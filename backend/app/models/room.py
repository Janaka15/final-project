from sqlalchemy import Column, Integer, String, Text, Numeric, JSON, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class RoomStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    MAINTENANCE = "MAINTENANCE"


class RoomType(Base):
    __tablename__ = "room_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    price_per_night = Column(Numeric(10, 2), nullable=False)
    capacity = Column(Integer, nullable=False)
    total_rooms = Column(Integer, nullable=False)
    amenities = Column(JSON, default=list)
    image_url = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    rooms = relationship("Room", back_populates="room_type")
    bookings = relationship("Booking", back_populates="room_type")


class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    room_number = Column(String(10), nullable=False, unique=True)
    room_type_id = Column(Integer, ForeignKey("room_types.id"), nullable=False)
    status = Column(SAEnum(RoomStatus, name="room_status"), default=RoomStatus.AVAILABLE, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    room_type = relationship("RoomType", back_populates="rooms")
