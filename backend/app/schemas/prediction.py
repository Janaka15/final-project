from pydantic import BaseModel
from typing import List, Optional
from datetime import date


class DayForecast(BaseModel):
    date: date
    predicted_occupancy: float
    confidence_lower: Optional[float]
    confidence_upper: Optional[float]


class ForecastResponse(BaseModel):
    model_name: str
    forecasts: List[DayForecast]
    avg_predicted_occupancy: float
