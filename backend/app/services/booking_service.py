from datetime import date
from decimal import Decimal
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, func

from app.models.booking import Booking, BookingStatus, generate_confirmation_code
from app.models.room import RoomType
from app.schemas.booking import BookingCreate
from app.services.email_service import send_booking_confirmation, send_booking_cancellation
from app.models.user import User



def count_overlapping_bookings(
    db: Session,
    room_type_id: int,
    check_in: date,
    check_out: date,
    exclude_booking_id: Optional[int] = None,
) -> int:
    """
    Count active bookings for a room type that overlap with [check_in, check_out).
    Overlap condition: booking.check_in < check_out AND booking.check_out > check_in
    """
    query = db.query(func.count(Booking.id)).filter(
        Booking.room_type_id == room_type_id,
        Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.PENDING]),
        Booking.check_in < check_out,
        Booking.check_out > check_in,
    )
    if exclude_booking_id is not None:
        query = query.filter(Booking.id != exclude_booking_id)
    return query.scalar() or 0


def get_available_count(
    db: Session,
    room_type: RoomType,
    check_in: date,
    check_out: date,
) -> int:
    """Return how many rooms of this type are available for the given date range."""
    overlapping = count_overlapping_bookings(db, room_type.id, check_in, check_out)
    return max(0, room_type.total_rooms - overlapping)


def create_booking(db: Session, user_id: int, data: BookingCreate) -> Booking:
    """
    Create a confirmed booking. Raises ValueError if:
    - check_in >= check_out
    - check_in is in the past
    - no availability for the requested room type
    """
    today = date.today()
    if data.check_in >= data.check_out:
        raise ValueError("check_out must be after check_in")
    if data.check_in < today:
        raise ValueError("check_in cannot be in the past")

    room_type = db.query(RoomType).filter(RoomType.id == data.room_type_id).first()
    if not room_type:
        raise ValueError("Room type not found")

    available = get_available_count(db, room_type, data.check_in, data.check_out)
    if available < 1:
        raise ValueError("No rooms available for the selected dates")

    nights = (data.check_out - data.check_in).days
    total_price = Decimal(str(room_type.price_per_night)) * nights

    booking = Booking(
        user_id=user_id,
        room_type_id=data.room_type_id,
        check_in=data.check_in,
        check_out=data.check_out,
        guests=data.guests,
        total_price=total_price,
        status=BookingStatus.CONFIRMED,
        confirmation_code=generate_confirmation_code(),
        notes=data.notes,
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)

    # Send confirmation email
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        send_booking_confirmation(
            to_email=user.email,
            name=user.name,
            booking={
                "confirmation_code": booking.confirmation_code,
                "room_type": room_type.name,
                "check_in": str(booking.check_in),
                "check_out": str(booking.check_out),
                "guests": booking.guests,
                "total_price": float(booking.total_price),
            }
        )


    return booking


def cancel_booking(db: Session, booking_id: int, user_id: int) -> Booking:
    """Cancel a booking. Raises ValueError if not found, not owned, or not cancellable."""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise ValueError("Booking not found")
    if booking.user_id != user_id:
        raise ValueError("Not authorised to cancel this booking")
    if booking.status not in (BookingStatus.CONFIRMED, BookingStatus.PENDING):
        raise ValueError(f"Cannot cancel a booking with status '{booking.status}'")

    booking.status = BookingStatus.CANCELLED
    db.commit()
    db.refresh(booking)
    # Send cancellation email
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        send_booking_cancellation(
            to_email=user.email,
            name=user.name,
            booking={
                "confirmation_code": booking.confirmation_code,
                "check_in": str(booking.check_in),
                "check_out": str(booking.check_out),
            }
        )


    return booking
