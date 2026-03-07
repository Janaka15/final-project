from pydantic import BaseModel
from typing import List
from datetime import date


class RevenueTrendPoint(BaseModel):
    period: str
    revenue: float
    bookings_count: int


class OccupancyHeatmapPoint(BaseModel):
    date: date
    occupancy_rate: float
    booked_rooms: int


class SeasonalBreakdownPoint(BaseModel):
    month: int
    month_name: str
    avg_occupancy_rate: float


class RoomUtilizationPoint(BaseModel):
    room_type: str
    booked_nights: int
    available_nights: int
    utilization_rate: float


class DashboardKPIs(BaseModel):
    todays_occupancy_pct: float
    revenue_mtd: float
    active_bookings: int
    checkins_today: int
