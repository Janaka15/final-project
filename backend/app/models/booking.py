import random
import string
from sqlalchemy import Column, Integer, String, Text, Numeric, Date, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class BookingStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"


def generate_confirmation_code() -> str:
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=12))


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    room_type_id = Column(Integer, ForeignKey("room_types.id"), nullable=False)
    check_in = Column(Date, nullable=False)
    check_out = Column(Date, nullable=False)
    guests = Column(Integer, nullable=False, default=1)
    total_price = Column(Numeric(12, 2))
    status = Column(
        SAEnum(BookingStatus, name="booking_status"),
        default=BookingStatus.CONFIRMED,
        nullable=False,
    )
    confirmation_code = Column(String(12), unique=True, default=generate_confirmation_code)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="bookings")
    room_type = relationship("RoomType", back_populates="bookings")
    feedbacks = relationship("Feedback", back_populates="booking")
