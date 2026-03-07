from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class BookingCreate(BaseModel):
    room_type_id: int
    check_in: date
    check_out: date
    guests: int
    notes: Optional[str] = None


class BookingResponse(BaseModel):
    id: int
    user_id: int
    room_type_id: int
    check_in: date
    check_out: date
    guests: int
    total_price: Optional[float]
    status: str
    confirmation_code: str
    notes: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class BookingWithDetailsResponse(BookingResponse):
    room_type_name: Optional[str] = None
    user_name: Optional[str] = None
    user_email: Optional[str] = None


class AdminBookingUpdate(BaseModel):
    status: str
