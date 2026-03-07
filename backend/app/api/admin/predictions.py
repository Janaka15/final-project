from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from datetime import date

from app.core.database import get_db
from app.models.user import User
from app.schemas.prediction import ForecastResponse
from app.services.prediction_service import predict_occupancy
from app.api.deps import require_admin

import json
from pathlib import Path

MODELS_DIR = Path(__file__).resolve().parents[4] / "models"

router = APIRouter(prefix="/api/admin/predictions", tags=["admin-predictions"])


@router.get("", response_model=ForecastResponse)
def get_predictions(
    days: int = Query(30, ge=1, le=365),
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    metadata_path = MODELS_DIR / "model_metadata.json"
    if not metadata_path.exists():
        raise HTTPException(
            status_code=503,
            detail="Prediction model not yet trained. Complete the ML notebooks first.",
        )

    with open(metadata_path) as f:
        metadata = json.load(f)

    try:
        forecasts = predict_occupancy(start_date=date.today(), days=days)
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {e}")

    avg = sum(f["predicted_occupancy"] for f in forecasts) / len(forecasts) if forecasts else 0.0

    return ForecastResponse(
        model_name=metadata.get("winner", "unknown"),
        forecasts=[
            {
                "date": f["date"],
                "predicted_occupancy": f["predicted_occupancy"],
                "confidence_lower": f.get("lower"),
                "confidence_upper": f.get("upper"),
            }
            for f in forecasts
        ],
        avg_predicted_occupancy=avg,
    )
