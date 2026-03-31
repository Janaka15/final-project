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
    # Set to True when the model is stale (gap > STALE_MODEL_DAYS_THRESHOLD).
    # Forecasts are still returned (fallback values) but should not be trusted
    # for operational decisions until the model is retrained.
    model_stale: bool = False
    warning: Optional[str] = None
