"""Unit tests for booking_service.py — availability overlap logic and edge cases."""

import pytest
from datetime import date, timedelta
from decimal import Decimal

from app.models.room import RoomType, Room
from app.models.user import User, UserRole
from app.models.booking import Booking, BookingStatus
from app.schemas.booking import BookingCreate
from app.services.booking_service import (
    count_overlapping_bookings,
    get_available_count,
    create_booking,
    cancel_booking,
)
from app.core.security import hash_password


# ---------- Fixtures ----------

@pytest.fixture
def room_type(db):
    rt = RoomType(
        name="Standard",
        price_per_night=Decimal("25000.00"),
        capacity=2,
        total_rooms=2,
        amenities=[],
    )
    db.add(rt)
    db.commit()
    db.refresh(rt)
    return rt


@pytest.fixture
def customer(db):
    user = User(
        email="guest@test.com",
        name="Test Guest",
        password_hash=hash_password("pass123"),
        role=UserRole.CUSTOMER,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def make_booking(db, user_id, room_type_id, check_in, check_out, status=BookingStatus.CONFIRMED):
    b = Booking(
        user_id=user_id,
        room_type_id=room_type_id,
        check_in=check_in,
        check_out=check_out,
        guests=1,
        total_price=Decimal("25000.00"),
        status=status,
        confirmation_code=f"TEST{check_in}{check_out}".replace("-", "")[:12],
    )
    db.add(b)
    db.commit()
    db.refresh(b)
    return b


# ---------- count_overlapping_bookings ----------

class TestOverlapDetection:
    def test_no_bookings_returns_zero(self, db, room_type):
        result = count_overlapping_bookings(db, room_type.id, date(2027, 1, 5), date(2027, 1, 10))
        assert result == 0

    def test_exact_overlap(self, db, room_type, customer):
        make_booking(db, customer.id, room_type.id, date(2027, 1, 5), date(2027, 1, 10))
        result = count_overlapping_bookings(db, room_type.id, date(2027, 1, 5), date(2027, 1, 10))
        assert result == 1

    def test_partial_overlap_start(self, db, room_type, customer):
        # Existing: Jan 5–10; Query: Jan 3–7 → overlap
        make_booking(db, customer.id, room_type.id, date(2027, 1, 5), date(2027, 1, 10))
        result = count_overlapping_bookings(db, room_type.id, date(2027, 1, 3), date(2027, 1, 7))
        assert result == 1

    def test_partial_overlap_end(self, db, room_type, customer):
        # Existing: Jan 5–10; Query: Jan 8–15 → overlap
        make_booking(db, customer.id, room_type.id, date(2027, 1, 5), date(2027, 1, 10))
        result = count_overlapping_bookings(db, room_type.id, date(2027, 1, 8), date(2027, 1, 15))
        assert result == 1

    def test_adjacent_checkout_no_overlap(self, db, room_type, customer):
        # Existing: Jan 5–10; Query: Jan 10–15 → no overlap (checkout day is exclusive)
        make_booking(db, customer.id, room_type.id, date(2027, 1, 5), date(2027, 1, 10))
        result = count_overlapping_bookings(db, room_type.id, date(2027, 1, 10), date(2027, 1, 15))
        assert result == 0

    def test_adjacent_checkin_no_overlap(self, db, room_type, customer):
        # Existing: Jan 10–15; Query: Jan 5–10 → no overlap
        make_booking(db, customer.id, room_type.id, date(2027, 1, 10), date(2027, 1, 15))
        result = count_overlapping_bookings(db, room_type.id, date(2027, 1, 5), date(2027, 1, 10))
        assert result == 0

    def test_cancelled_booking_not_counted(self, db, room_type, customer):
        make_booking(db, customer.id, room_type.id, date(2027, 1, 5), date(2027, 1, 10), BookingStatus.CANCELLED)
        result = count_overlapping_bookings(db, room_type.id, date(2027, 1, 5), date(2027, 1, 10))
        assert result == 0

    def test_exclude_booking_id(self, db, room_type, customer):
        b = make_booking(db, customer.id, room_type.id, date(2027, 1, 5), date(2027, 1, 10))
        # Excluding this booking → 0
        result = count_overlapping_bookings(
            db, room_type.id, date(2027, 1, 5), date(2027, 1, 10), exclude_booking_id=b.id
        )
        assert result == 0

    def test_multiple_bookings_counted(self, db, room_type, customer):
        make_booking(db, customer.id, room_type.id, date(2027, 1, 5), date(2027, 1, 10))
        make_booking(db, customer.id, room_type.id, date(2027, 1, 6), date(2027, 1, 11))
        result = count_overlapping_bookings(db, room_type.id, date(2027, 1, 7), date(2027, 1, 9))
        assert result == 2


# ---------- get_available_count ----------

class TestAvailableCount:
    def test_fully_available(self, db, room_type):
        assert get_available_count(db, room_type, date(2027, 2, 1), date(2027, 2, 5)) == 2

    def test_one_booked_one_available(self, db, room_type, customer):
        make_booking(db, customer.id, room_type.id, date(2027, 2, 1), date(2027, 2, 5))
        assert get_available_count(db, room_type, date(2027, 2, 1), date(2027, 2, 5)) == 1

    def test_fully_booked(self, db, room_type, customer):
        make_booking(db, customer.id, room_type.id, date(2027, 2, 1), date(2027, 2, 5))
        make_booking(db, customer.id, room_type.id, date(2027, 2, 1), date(2027, 2, 5))
        assert get_available_count(db, room_type, date(2027, 2, 1), date(2027, 2, 5)) == 0

    def test_never_negative(self, db, room_type, customer):
        # Overbooking guard — available count never goes below 0
        for _ in range(5):
            make_booking(db, customer.id, room_type.id, date(2027, 2, 1), date(2027, 2, 5))
        assert get_available_count(db, room_type, date(2027, 2, 1), date(2027, 2, 5)) == 0


# ---------- create_booking ----------

class TestCreateBooking:
    def test_successful_booking(self, db, room_type, customer):
        data = BookingCreate(
            room_type_id=room_type.id,
            check_in=date(2027, 3, 1),
            check_out=date(2027, 3, 5),
            guests=2,
        )
        booking = create_booking(db, customer.id, data)
        assert booking.id is not None
        assert booking.status == BookingStatus.CONFIRMED
        assert booking.total_price == Decimal("25000.00") * 4
        assert len(booking.confirmation_code) == 12

    def test_check_in_same_as_check_out_raises(self, db, room_type, customer):
        data = BookingCreate(
            room_type_id=room_type.id,
            check_in=date(2027, 3, 1),
            check_out=date(2027, 3, 1),
            guests=1,
        )
        with pytest.raises(ValueError, match="check_out must be after check_in"):
            create_booking(db, customer.id, data)

    def test_past_check_in_raises(self, db, room_type, customer):
        data = BookingCreate(
            room_type_id=room_type.id,
            check_in=date(2020, 1, 1),
            check_out=date(2020, 1, 5),
            guests=1,
        )
        with pytest.raises(ValueError, match="past"):
            create_booking(db, customer.id, data)

    def test_no_availability_raises(self, db, room_type, customer):
        # Fill all 2 rooms
        make_booking(db, customer.id, room_type.id, date(2027, 3, 1), date(2027, 3, 5))
        make_booking(db, customer.id, room_type.id, date(2027, 3, 1), date(2027, 3, 5))
        data = BookingCreate(
            room_type_id=room_type.id,
            check_in=date(2027, 3, 1),
            check_out=date(2027, 3, 5),
            guests=1,
        )
        with pytest.raises(ValueError, match="No rooms available"):
            create_booking(db, customer.id, data)

    def test_invalid_room_type_raises(self, db, customer):
        data = BookingCreate(
            room_type_id=9999,
            check_in=date(2027, 3, 1),
            check_out=date(2027, 3, 5),
            guests=1,
        )
        with pytest.raises(ValueError, match="Room type not found"):
            create_booking(db, customer.id, data)


# ---------- cancel_booking ----------

class TestCancelBooking:
    def test_cancel_confirmed_booking(self, db, room_type, customer):
        b = make_booking(db, customer.id, room_type.id, date(2027, 4, 1), date(2027, 4, 5))
        cancelled = cancel_booking(db, b.id, customer.id)
        assert cancelled.status == BookingStatus.CANCELLED

    def test_cannot_cancel_another_users_booking(self, db, room_type, customer):
        other = User(
            email="other@test.com",
            name="Other",
            password_hash=hash_password("pass"),
            role=UserRole.CUSTOMER,
        )
        db.add(other)
        db.commit()
        db.refresh(other)

        b = make_booking(db, other.id, room_type.id, date(2027, 4, 1), date(2027, 4, 5))
        with pytest.raises(ValueError, match="Not authorised"):
            cancel_booking(db, b.id, customer.id)

    def test_cannot_cancel_already_cancelled(self, db, room_type, customer):
        b = make_booking(db, customer.id, room_type.id, date(2027, 4, 1), date(2027, 4, 5), BookingStatus.CANCELLED)
        with pytest.raises(ValueError, match="Cannot cancel"):
            cancel_booking(db, b.id, customer.id)

    def test_cannot_cancel_completed_booking(self, db, room_type, customer):
        b = make_booking(db, customer.id, room_type.id, date(2027, 4, 1), date(2027, 4, 5), BookingStatus.COMPLETED)
        with pytest.raises(ValueError, match="Cannot cancel"):
            cancel_booking(db, b.id, customer.id)

    def test_cancel_nonexistent_booking_raises(self, db, customer):
        with pytest.raises(ValueError, match="not found"):
            cancel_booking(db, 9999, customer.id)
