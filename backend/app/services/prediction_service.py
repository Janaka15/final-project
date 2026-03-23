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
import pandas as pd

_model = None
_metadata: Optional[dict] = None
_last_loaded_date: Optional[date] = None

MODELS_DIR = Path(__file__).resolve().parents[3] / "models"


def _load_model():
    global _model, _metadata, _last_loaded_date

    # Reload model once per day
    if _model is not None and _last_loaded_date == date.today():
        return

    metadata_path = MODELS_DIR / "model_metadata.json"
    if not metadata_path.exists():
        raise FileNotFoundError(
            "model_metadata.json not found. Run notebooks/07_model_evaluation.ipynb first."
        )

    with open(metadata_path) as f:
        _metadata = json.load(f)

    winner = _metadata.get("winner", "sarima").lower()
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

    _last_loaded_date = date.today()


def predict_occupancy(start_date: date, days: int = 30) -> List[dict]:
    """
    Return a list of day-level occupancy forecasts.

    Each element: {"date": date, "predicted_occupancy": float,
                   "lower": float|None, "upper": float|None}
    """
    _load_model()

    winner = (_metadata or {}).get("winner", "sarima").lower()

    if winner == "prophet":
        return _predict_prophet(start_date, days)
    elif winner in ("arima", "sarima"):
        return _predict_statsmodels(start_date, days)
    else:
        raise ValueError(f"Unknown winner model: {winner}")


def _predict_prophet(start_date: date, days: int) -> List[dict]:
    last_train_date = _model.history_dates.max().date()

    gap = (start_date - last_train_date).days
    periods_needed = gap + days

    future_df = _model.make_future_dataframe(periods=periods_needed, freq="D")

    start_ts = pd.Timestamp(start_date)
    end_ts = pd.Timestamp(start_date + timedelta(days=days))
    future_df = future_df[
        (future_df["ds"] >= start_ts) & (future_df["ds"] < end_ts)
    ]

    forecast = _model.predict(future_df)

    result = []
    for _, row in forecast.iterrows():
        result.append({
            "date": row["ds"].date(),
            "predicted_occupancy": float(min(max(row["yhat"], 0), 1)),
            "lower": float(min(max(row.get("yhat_lower", row["yhat"]), 0), 1)),
            "upper": float(min(max(row.get("yhat_upper", row["yhat"]), 0), 1)),
        })
    return result[:days]


def _predict_statsmodels(start_date: date, days: int) -> List[dict]:
    # Last date the model knows about (end of test set)
    last_known_date = pd.to_datetime(
        _metadata.get("evaluated_on", "2025-12-31")
    ).date()

    # How many steps from last known date to start_date (today)
    gap = (start_date - last_known_date).days  # ~80 days as of March 2026

    # Forecast enough steps to bridge the gap + cover requested days
    total_steps = gap + days
    all_forecasts = _model.forecast(steps=total_steps)

    # Skip the gap, take only the days from start_date onwards
    relevant = all_forecasts[gap:]

    result = []
    for i, val in enumerate(relevant[:days]):
        result.append({
            "date": start_date + timedelta(days=i),
            "predicted_occupancy": float(min(max(val, 0), 1)),
            "lower": None,
            "upper": None,
        })
    return result[:days]