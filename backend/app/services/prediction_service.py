"""
Prediction service — loads the winning model artifact and generates a 30-day forecast.

The inference function is defined in notebooks/08_inference_pipeline.ipynb and
the artifact is saved to models/best_model.pkl. This module loads that artifact
at startup (lazy singleton) and exposes predict_occupancy().
"""

import json
import os
from datetime import date, timedelta
from pathlib import Path
from typing import List, Optional

_model = None
_metadata: Optional[dict] = None

MODELS_DIR = Path(__file__).resolve().parents[3] / "models"


def _load_model():
    global _model, _metadata
    if _model is not None:
        return

    metadata_path = MODELS_DIR / "model_metadata.json"
    if not metadata_path.exists():
        raise FileNotFoundError(
            "model_metadata.json not found. Run notebooks/07_model_evaluation.ipynb first."
        )

    with open(metadata_path) as f:
        _metadata = json.load(f)

    winner = _metadata.get("winner", "prophet").lower()
    model_path = MODELS_DIR / "best_model.pkl"
    if not model_path.exists():
        raise FileNotFoundError(
            f"best_model.pkl not found at {model_path}. Run notebook 08 to export it."
        )

    json_path = MODELS_DIR / "best_model_prophet.json"
    if winner == "prophet" and json_path.exists():
        from prophet.serialize import model_from_json
        with open(json_path) as f:
            _model = model_from_json(f.read())
    else:
        import joblib
        loaded = joblib.load(model_path)
        _model = loaded["model"] if isinstance(loaded, dict) and "model" in loaded else loaded


def predict_occupancy(start_date: date, days: int = 30) -> List[dict]:
    """
    Return a list of day-level occupancy forecasts.

    Each element: {"date": date, "predicted_occupancy": float,
                   "lower": float|None, "upper": float|None}
    """
    _load_model()

    winner = (_metadata or {}).get("winner", "prophet").lower()

    if winner == "prophet":
        return _predict_prophet(start_date, days)
    elif winner in ("arima", "sarima"):
        return _predict_statsmodels(start_date, days)
    else:
        raise ValueError(f"Unknown winner model: {winner}")


def _predict_prophet(start_date: date, days: int) -> List[dict]:
    import pandas as pd

    last_train_date = _model.history_dates.max().date()
    periods_needed = (start_date - last_train_date).days + days
    future_df = _model.make_future_dataframe(periods=max(periods_needed, days), freq="D")
    future_df = future_df[future_df["ds"] >= pd.Timestamp(start_date)]

    forecast = _model.predict(future_df)
    result = []
    for _, row in forecast.iterrows():
        result.append(
            {
                "date": row["ds"].date(),
                "predicted_occupancy": float(min(max(row["yhat"], 0), 1)),
                "lower": float(min(max(row.get("yhat_lower", row["yhat"]), 0), 1)),
                "upper": float(min(max(row.get("yhat_upper", row["yhat"]), 0), 1)),
            }
        )
    return result[:days]


def _predict_statsmodels(start_date: date, days: int) -> List[dict]:
    forecast = _model.forecast(steps=days)
    result = []
    for i, val in enumerate(forecast):
        result.append(
            {
                "date": start_date + timedelta(days=i),
                "predicted_occupancy": float(min(max(val, 0), 1)),
                "lower": None,
                "upper": None,
            }
        )
    return result
