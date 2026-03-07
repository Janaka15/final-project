from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.core.database import get_db
from app.models.room import RoomType
from app.schemas.room import RoomTypeResponse, RoomAvailabilityResponse
from app.services.booking_service import get_available_count

router = APIRouter(prefix="/api/rooms", tags=["rooms"])


@router.get("", response_model=List[RoomTypeResponse])
def list_room_types(db: Session = Depends(get_db)):
    return db.query(RoomType).all()


@router.get("/availability", response_model=List[RoomAvailabilityResponse])
def check_availability(
    check_in: date = Query(...),
    check_out: date = Query(...),
    db: Session = Depends(get_db),
):
    if check_in >= check_out:
        raise HTTPException(status_code=400, detail="check_out must be after check_in")
    if check_in < date.today():
        raise HTTPException(status_code=400, detail="check_in cannot be in the past")

    room_types = db.query(RoomType).all()
    result = []
    for rt in room_types:
        available_count = get_available_count(db, rt, check_in, check_out)
        rt_dict = {
            "id": rt.id,
            "name": rt.name,
            "description": rt.description,
            "price_per_night": float(rt.price_per_night),
            "capacity": rt.capacity,
            "total_rooms": rt.total_rooms,
            "amenities": rt.amenities or [],
            "image_url": rt.image_url,
            "created_at": rt.created_at,
            "available_count": available_count,
        }
        result.append(rt_dict)
    return result


@router.get("/{room_type_id}", response_model=RoomTypeResponse)
def get_room_type(room_type_id: int, db: Session = Depends(get_db)):
    rt = db.query(RoomType).filter(RoomType.id == room_type_id).first()
    if not rt:
        raise HTTPException(status_code=404, detail="Room type not found")
    return rt
