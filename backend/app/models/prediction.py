from sqlalchemy import Column, Integer, String, Date, Float, DateTime
from sqlalchemy.sql import func
from app.core.database import Base


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(50), nullable=False)
    prediction_date = Column(Date, nullable=False)
    predicted_occupancy = Column(Float, nullable=False)
    confidence_lower = Column(Float)
    confidence_upper = Column(Float)
    generated_at = Column(DateTime(timezone=True), server_default=func.now())
