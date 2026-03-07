from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.booking import Booking
from app.models.feedback import Feedback
from app.schemas.auth import UserResponse
from app.schemas.feedback import FeedbackWithUserResponse
from app.api.deps import require_admin

router = APIRouter(prefix="/api/admin/customers", tags=["admin-customers"])


@router.get("", response_model=List[UserResponse])
def list_customers(
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    query = db.query(User).filter(User.role == UserRole.CUSTOMER)
    if search:
        like = f"%{search}%"
        query = query.filter(
            (User.name.ilike(like)) | (User.email.ilike(like))
        )
    return query.order_by(User.created_at.desc()).all()


@router.get("/{user_id}/bookings")
def customer_bookings(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    bookings = (
        db.query(Booking)
        .options(joinedload(Booking.room_type))
        .filter(Booking.user_id == user_id)
        .order_by(Booking.created_at.desc())
        .all()
    )
    return [
        {
            "id": b.id,
            "room_type_name": b.room_type.name if b.room_type else None,
            "check_in": b.check_in,
            "check_out": b.check_out,
            "guests": b.guests,
            "total_price": float(b.total_price) if b.total_price else None,
            "status": b.status,
            "confirmation_code": b.confirmation_code,
            "created_at": b.created_at,
        }
        for b in bookings
    ]


@router.get("/feedback", response_model=List[FeedbackWithUserResponse])
def list_all_feedback(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    feedbacks = (
        db.query(Feedback)
        .options(joinedload(Feedback.user), joinedload(Feedback.booking).joinedload(Booking.room_type))
        .order_by(Feedback.created_at.desc())
        .all()
    )
    return [
        FeedbackWithUserResponse(
            id=f.id,
            booking_id=f.booking_id,
            user_id=f.user_id,
            rating=f.rating,
            comment=f.comment,
            created_at=f.created_at,
            user_name=f.user.name if f.user else None,
            room_type_name=f.booking.room_type.name if f.booking and f.booking.room_type else None,
        )
        for f in feedbacks
    ]
