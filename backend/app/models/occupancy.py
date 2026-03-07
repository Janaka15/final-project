from sqlalchemy import Column, Date, Integer, Float, Boolean, String, Numeric
from app.core.database import Base


class OccupancyHistory(Base):
    __tablename__ = "occupancy_history"

    date = Column(Date, primary_key=True)
    total_rooms = Column(Integer, nullable=False)
    booked_rooms = Column(Integer, nullable=False)
    occupancy_rate = Column(Float, nullable=False)
    month = Column(Integer, nullable=False)
    is_weekend = Column(Boolean, nullable=False, default=False)
    season = Column(String(20), nullable=False)
    is_holiday = Column(Boolean, nullable=False, default=False)
    revenue = Column(Numeric(14, 2), nullable=False)
