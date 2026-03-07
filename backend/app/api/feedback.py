from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.booking import Booking, BookingStatus
from app.models.feedback import Feedback
from app.models.user import User
from app.schemas.feedback import FeedbackCreate, FeedbackResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/feedback", tags=["feedback"])


@router.post("", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
def submit_feedback(
    data: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not (1 <= data.rating <= 5):
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

    booking = db.query(Booking).filter(
        Booking.id == data.booking_id,
        Booking.user_id == current_user.id,
        Booking.status == BookingStatus.COMPLETED,
    ).first()
    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Booking not found or not eligible for feedback (must be completed and yours)",
        )

    existing = db.query(Feedback).filter(
        Feedback.booking_id == data.booking_id,
        Feedback.user_id == current_user.id,
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Feedback already submitted for this booking")

    feedback = Feedback(
        booking_id=data.booking_id,
        user_id=current_user.id,
        rating=data.rating,
        comment=data.comment,
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback
