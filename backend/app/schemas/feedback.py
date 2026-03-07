from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class FeedbackCreate(BaseModel):
    booking_id: int
    rating: int  # 1–5
    comment: Optional[str] = None


class FeedbackResponse(BaseModel):
    id: int
    booking_id: int
    user_id: int
    rating: int
    comment: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class FeedbackWithUserResponse(FeedbackResponse):
    user_name: Optional[str] = None
    room_type_name: Optional[str] = None
