from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class RoomTypeBase(BaseModel):
    name: str
    description: Optional[str] = None
    price_per_night: float
    capacity: int
    total_rooms: int
    amenities: List[str] = []
    image_url: Optional[str] = None


class RoomTypeCreate(RoomTypeBase):
    pass


class RoomTypeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price_per_night: Optional[float] = None
    capacity: Optional[int] = None
    total_rooms: Optional[int] = None
    amenities: Optional[List[str]] = None
    image_url: Optional[str] = None


class RoomTypeResponse(RoomTypeBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class RoomAvailabilityResponse(RoomTypeResponse):
    available_count: int


class RoomResponse(BaseModel):
    id: int
    room_number: str
    room_type_id: int
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
