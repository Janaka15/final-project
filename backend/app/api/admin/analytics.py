from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, case, and_
from typing import List
from datetime import date, timedelta
import calendar

from app.core.database import get_db
from app.models.booking import Booking, BookingStatus
from app.models.occupancy import OccupancyHistory
from app.models.room import RoomType
from app.models.user import User
from app.schemas.analytics import (
    RevenueTrendPoint,
    OccupancyHeatmapPoint,
    SeasonalBreakdownPoint,
    RoomUtilizationPoint,
    DashboardKPIs,
)
from app.api.deps import require_admin

router = APIRouter(prefix="/api/admin/analytics", tags=["admin-analytics"])


@router.get("/kpis", response_model=DashboardKPIs)
def get_dashboard_kpis(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    today = date.today()

    # Total rooms from room_types table (live data)
    total_rooms = db.query(func.sum(RoomType.total_rooms)).scalar() or 15

    # Today's occupancy from live bookings
    checked_in_today = db.query(func.count(Booking.id)).filter(
        Booking.status == BookingStatus.CONFIRMED,
        Booking.check_in <= today,
        Booking.check_out > today,
    ).scalar() or 0
    todays_occupancy = checked_in_today / total_rooms

    # Revenue MTD from live bookings
    first_of_month = today.replace(day=1)
    revenue_mtd_row = db.query(func.sum(Booking.total_price)).filter(
        Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.COMPLETED]),
        Booking.check_in >= first_of_month,
        Booking.check_in <= today,
    ).scalar()
    revenue_mtd = float(revenue_mtd_row or 0)

    # Active bookings (unchanged)
    active_bookings = db.query(func.count(Booking.id)).filter(
        Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.PENDING]),
        Booking.check_out >= today,
    ).scalar() or 0

    # Check-ins today (unchanged)
    checkins_today = db.query(func.count(Booking.id)).filter(
        Booking.check_in == today,
        Booking.status == BookingStatus.CONFIRMED,
    ).scalar() or 0

    return DashboardKPIs(
        todays_occupancy_pct=round(todays_occupancy * 100, 1),
        revenue_mtd=revenue_mtd,
        active_bookings=active_bookings,
        checkins_today=checkins_today,
    )


@router.get("/revenue", response_model=List[RevenueTrendPoint])
def revenue_trend(
    period: str = Query("weekly", pattern="^(daily|weekly|monthly)$"),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    if period == "daily":
        rows = (
            db.query(
                OccupancyHistory.date.label("period"),
                OccupancyHistory.revenue.label("revenue"),
                OccupancyHistory.booked_rooms.label("bookings_count"),
            )
            .order_by(OccupancyHistory.date.desc())
            .limit(90)
            .all()
        )
        return [
            RevenueTrendPoint(
                period=str(r.period),
                revenue=float(r.revenue),
                bookings_count=r.bookings_count,
            )
            for r in reversed(rows)
        ]

    elif period == "weekly":
        rows = (
            db.query(
                func.to_char(OccupancyHistory.date, "IYYY-IW").label("period"),
                func.sum(OccupancyHistory.revenue).label("revenue"),
                func.sum(OccupancyHistory.booked_rooms).label("bookings_count"),
            )
            .group_by(func.to_char(OccupancyHistory.date, "IYYY-IW"))
            .order_by(func.to_char(OccupancyHistory.date, "IYYY-IW").desc())
            .limit(52)
            .all()
        )
    else:  # monthly
        rows = (
            db.query(
                func.to_char(OccupancyHistory.date, "YYYY-MM").label("period"),
                func.sum(OccupancyHistory.revenue).label("revenue"),
                func.sum(OccupancyHistory.booked_rooms).label("bookings_count"),
            )
            .group_by(func.to_char(OccupancyHistory.date, "YYYY-MM"))
            .order_by(func.to_char(OccupancyHistory.date, "YYYY-MM").desc())
            .limit(36)
            .all()
        )

    return [
        RevenueTrendPoint(
            period=str(r.period),
            revenue=float(r.revenue),
            bookings_count=int(r.bookings_count),
        )
        for r in reversed(rows)
    ]


@router.get("/occupancy-heatmap", response_model=List[OccupancyHeatmapPoint])
def occupancy_heatmap(
    year: int = Query(2025),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    rows = (
        db.query(OccupancyHistory)
        .filter(extract("year", OccupancyHistory.date) == year)
        .order_by(OccupancyHistory.date)
        .all()
    )
    return [
        OccupancyHeatmapPoint(
            date=r.date,
            occupancy_rate=r.occupancy_rate,
            booked_rooms=r.booked_rooms,
        )
        for r in rows
    ]


@router.get("/seasonal", response_model=List[SeasonalBreakdownPoint])
def seasonal_breakdown(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    rows = (
        db.query(
            OccupancyHistory.month.label("month"),
            func.avg(OccupancyHistory.occupancy_rate).label("avg_occupancy_rate"),
        )
        .group_by(OccupancyHistory.month)
        .order_by(OccupancyHistory.month)
        .all()
    )
    return [
        SeasonalBreakdownPoint(
            month=r.month,
            month_name=calendar.month_abbr[r.month],
            avg_occupancy_rate=round(float(r.avg_occupancy_rate), 4),
        )
        for r in rows
    ]


@router.get("/room-utilization", response_model=List[RoomUtilizationPoint])
def room_utilization(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    today = date.today()
    first_of_month = today.replace(day=1)
    last_of_month = today.replace(day=calendar.monthrange(today.year, today.month)[1])
    days_in_month = (last_of_month - first_of_month).days + 1

    room_types = db.query(RoomType).all()
    result = []
    for rt in room_types:
        # Count booked nights this month (sum of nights per booking overlapping this month)
        bookings = (
            db.query(Booking)
            .filter(
                Booking.room_type_id == rt.id,
                Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.COMPLETED]),
                Booking.check_in <= last_of_month,
                Booking.check_out >= first_of_month,
            )
            .all()
        )

        booked_nights = 0
        for b in bookings:
            overlap_start = max(b.check_in, first_of_month)
            overlap_end = min(b.check_out, last_of_month + timedelta(days=1))
            booked_nights += max(0, (overlap_end - overlap_start).days)

        available_nights = rt.total_rooms * days_in_month
        utilization = booked_nights / available_nights if available_nights > 0 else 0.0

        result.append(
            RoomUtilizationPoint(
                room_type=rt.name,
                booked_nights=booked_nights,
                available_nights=available_nights,
                utilization_rate=round(utilization, 4),
            )
        )
    return result
