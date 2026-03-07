from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.room import RoomType, Room
from app.models.user import User
from app.schemas.room import RoomTypeCreate, RoomTypeUpdate, RoomTypeResponse
from app.api.deps import require_admin

router = APIRouter(prefix="/api/admin/rooms", tags=["admin-rooms"])


@router.get("", response_model=List[RoomTypeResponse])
def list_room_types(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return db.query(RoomType).all()


@router.post("", response_model=RoomTypeResponse, status_code=status.HTTP_201_CREATED)
def create_room_type(
    data: RoomTypeCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    rt = RoomType(**data.model_dump())
    db.add(rt)
    db.commit()
    db.refresh(rt)
    return rt


@router.put("/{room_type_id}", response_model=RoomTypeResponse)
def update_room_type(
    room_type_id: int,
    data: RoomTypeUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    rt = db.query(RoomType).filter(RoomType.id == room_type_id).first()
    if not rt:
        raise HTTPException(status_code=404, detail="Room type not found")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(rt, field, value)

    db.commit()
    db.refresh(rt)
    return rt


@router.delete("/{room_type_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_room_type(
    room_type_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    rt = db.query(RoomType).filter(RoomType.id == room_type_id).first()
    if not rt:
        raise HTTPException(status_code=404, detail="Room type not found")
    db.delete(rt)
    db.commit()
