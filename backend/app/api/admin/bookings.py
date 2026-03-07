from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from app.core.database import get_db
from app.models.booking import Booking, BookingStatus
from app.models.user import User
from app.schemas.booking import BookingWithDetailsResponse, AdminBookingUpdate
from app.api.deps import require_admin

router = APIRouter(prefix="/api/admin/bookings", tags=["admin-bookings"])


@router.get("", response_model=List[BookingWithDetailsResponse])
def list_all_bookings(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    query = db.query(Booking).options(
        joinedload(Booking.user),
        joinedload(Booking.room_type),
    )
    if status:
        try:
            status_enum = BookingStatus(status.upper())
            query = query.filter(Booking.status == status_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status}")

    bookings = query.order_by(Booking.created_at.desc()).all()

    result = []
    for b in bookings:
        item = BookingWithDetailsResponse(
            id=b.id,
            user_id=b.user_id,
            room_type_id=b.room_type_id,
            check_in=b.check_in,
            check_out=b.check_out,
            guests=b.guests,
            total_price=float(b.total_price) if b.total_price else None,
            status=b.status,
            confirmation_code=b.confirmation_code,
            notes=b.notes,
            created_at=b.created_at,
            room_type_name=b.room_type.name if b.room_type else None,
            user_name=b.user.name if b.user else None,
            user_email=b.user.email if b.user else None,
        )
        result.append(item)
    return result


@router.put("/{booking_id}", response_model=BookingWithDetailsResponse)
def update_booking_status(
    booking_id: int,
    data: AdminBookingUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    booking = db.query(Booking).options(
        joinedload(Booking.user),
        joinedload(Booking.room_type),
    ).filter(Booking.id == booking_id).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    try:
        booking.status = BookingStatus(data.status.upper())
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {data.status}")

    db.commit()
    db.refresh(booking)

    return BookingWithDetailsResponse(
        id=booking.id,
        user_id=booking.user_id,
        room_type_id=booking.room_type_id,
        check_in=booking.check_in,
        check_out=booking.check_out,
        guests=booking.guests,
        total_price=float(booking.total_price) if booking.total_price else None,
        status=booking.status,
        confirmation_code=booking.confirmation_code,
        notes=booking.notes,
        created_at=booking.created_at,
        room_type_name=booking.room_type.name if booking.room_type else None,
        user_name=booking.user.name if booking.user else None,
        user_email=booking.user.email if booking.user else None,
    )
