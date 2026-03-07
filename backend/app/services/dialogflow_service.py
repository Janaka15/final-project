"""
Dialogflow fulfillment webhook handlers.

Each handler receives the Dialogflow request body, queries the DB as needed,
and returns a Dialogflow-formatted JSON response dict.
"""

from datetime import date
from typing import Any
from sqlalchemy.orm import Session

from app.models.booking import Booking, BookingStatus
from app.models.room import RoomType
from app.services.booking_service import get_available_count


def build_text_response(text: str) -> dict:
    return {
        "fulfillmentMessages": [{"text": {"text": [text]}}],
        "fulfillmentText": text,
    }


def handle_check_availability(params: dict, db: Session) -> dict:
    check_in_str = params.get("check-in") or params.get("date-period", {}).get("startDate")
    check_out_str = params.get("check-out") or params.get("date-period", {}).get("endDate")

    if not check_in_str or not check_out_str:
        return build_text_response(
            "Please provide both check-in and check-out dates. "
            "For example: 'Are rooms available from January 5 to January 10?'"
        )

    try:
        check_in = date.fromisoformat(str(check_in_str)[:10])
        check_out = date.fromisoformat(str(check_out_str)[:10])
    except ValueError:
        return build_text_response("I couldn't parse those dates. Please try again in YYYY-MM-DD format.")

    if check_in >= check_out:
        return build_text_response("Check-out must be after check-in.")

    room_types = db.query(RoomType).all()
    available_lines = []
    for rt in room_types:
        count = get_available_count(db, rt, check_in, check_out)
        if count > 0:
            available_lines.append(
                f"• {rt.name}: {count} room(s) from LKR {rt.price_per_night:,.0f}/night"
            )

    if not available_lines:
        return build_text_response(
            f"Sorry, we have no rooms available from {check_in} to {check_out}. "
            "Please try different dates."
        )

    msg = (
        f"Great news! Available rooms from {check_in} to {check_out}:\n"
        + "\n".join(available_lines)
        + "\n\nVisit our website to book your stay!"
    )
    return build_text_response(msg)


def handle_booking_status(params: dict, db: Session) -> dict:
    code = (params.get("confirmation-code") or "").strip().upper()
    if not code:
        return build_text_response(
            "Please provide your confirmation code (e.g. 'ABC123XYZ789') to look up your booking."
        )

    booking = db.query(Booking).filter(Booking.confirmation_code == code).first()
    if not booking:
        return build_text_response(
            f"I couldn't find a booking with confirmation code '{code}'. "
            "Please double-check and try again."
        )

    msg = (
        f"Booking {code}:\n"
        f"• Status: {booking.status}\n"
        f"• Check-in: {booking.check_in}\n"
        f"• Check-out: {booking.check_out}\n"
        f"• Guests: {booking.guests}"
    )
    return build_text_response(msg)


def handle_booking_cancel(params: dict, db: Session) -> dict:
    code = (params.get("confirmation-code") or "").strip().upper()
    if not code:
        return build_text_response(
            "To cancel a booking, please provide your confirmation code. "
            "You can find it in your confirmation email."
        )

    booking = db.query(Booking).filter(Booking.confirmation_code == code).first()
    if not booking:
        return build_text_response(f"No booking found with code '{code}'.")

    if booking.status == BookingStatus.CANCELLED:
        return build_text_response(f"Booking {code} is already cancelled.")

    if booking.status not in (BookingStatus.CONFIRMED, BookingStatus.PENDING):
        return build_text_response(
            f"Booking {code} cannot be cancelled (status: {booking.status}). "
            "Please call us for assistance."
        )

    return build_text_response(
        f"To confirm cancellation of booking {code} (check-in: {booking.check_in}), "
        "please visit My Bookings on our website or call us at +94 41 225 9999."
    )


def handle_booking_make(params: dict, db: Session) -> dict:
    room_type_name = params.get("room-type", "")
    return build_text_response(
        f"I'd be happy to help you book a {room_type_name or 'room'}! "
        "Please visit our Rooms page to select your dates and complete the reservation."
    )


INTENT_HANDLERS = {
    "check.availability": handle_check_availability,
    "booking.status": handle_booking_status,
    "booking.cancel": handle_booking_cancel,
    "booking.make": handle_booking_make,
}


def route_intent(intent_name: str, params: dict, db: Session) -> dict:
    handler = INTENT_HANDLERS.get(intent_name)
    if handler:
        return handler(params, db)
    return build_text_response(
        "I'm not sure how to help with that. "
        "Please call us at +94 41 225 9999 or email info@somersetmirissa.com."
    )
