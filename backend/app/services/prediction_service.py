"""
Prediction service — loads the winning model artifact and generates a 30-day forecast.

The inference function is defined in notebooks/08_inference_pipeline.ipynb and
the artifact is saved to models/best_model.pkl. This module loads that artifact
at startup (lazy singleton) and exposes predict_occupancy().
"""

import json
import logging
import os
from datetime import date, timedelta
from pathlib import Path
from typing import List, Optional, Tuple
import pandas as pd

logger = logging.getLogger(__name__)

# If the gap between the model's last known date and today exceeds this
# threshold, the SARIMA forecast becomes numerically unstable.  We return a
# clearly-labelled fallback instead of crashing.
STALE_MODEL_DAYS_THRESHOLD = 60

_model = None
_metadata: Optional[dict] = None
_last_loaded_date: Optional[date] = None

BASE_DIR = Path(__file__).resolve().parents[2]
MODELS_DIR = BASE_DIR / "models"
if not MODELS_DIR.exists():
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


def predict_occupancy(
    start_date: date, days: int = 30
) -> Tuple[List[dict], bool, Optional[str]]:
    """
    Return ``(forecasts, model_stale, warning)``.

    * ``forecasts``   – list of day-level dicts with keys
                        ``date``, ``predicted_occupancy``, ``lower``, ``upper``.
    * ``model_stale`` – ``True`` when the model is too old to produce reliable
                        forecasts (gap > STALE_MODEL_DAYS_THRESHOLD days).
    * ``warning``     – human-readable explanation when ``model_stale`` is True,
                        otherwise ``None``.
    """
    _load_model()

    winner = (_metadata or {}).get("winner", "sarima").lower()

    if winner == "prophet":
        forecasts = _predict_prophet(start_date, days)
        return forecasts, False, None
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


def _predict_statsmodels(
    start_date: date, days: int
) -> Tuple[List[dict], bool, Optional[str]]:
    """
    Forecast occupancy using the fitted SARIMA/ARIMA model.

    Returns ``(forecasts, model_stale, warning)``.

    When the gap between the model's last known date and *start_date* exceeds
    ``STALE_MODEL_DAYS_THRESHOLD`` days the model is considered stale.
    Attempting to forecast 60+ steps ahead with SARIMA causes numerical
    instability (exploding confidence intervals, NaN/Inf values), so we skip
    the live forecast entirely and return a constant fallback equal to the
    model's last observed occupancy level.  The caller receives ``model_stale=True``
    and a ``warning`` string so the API can surface this to clients.
    """
    # Last date the model knows about (end of test set / evaluation window)
    last_known_date = pd.to_datetime(
        _metadata.get("evaluated_on", "2025-12-31")
    ).date()

    # How many calendar days separate the model's horizon from today
    gap = (start_date - last_known_date).days

    evaluated_on_str = _metadata.get("evaluated_on", "unknown")

    # ------------------------------------------------------------------
    # Staleness guard
    # ------------------------------------------------------------------
    if gap > STALE_MODEL_DAYS_THRESHOLD:
        logger.warning(
            "SARIMA model is stale: last known date=%s, start_date=%s, gap=%d days "
            "(threshold=%d). Returning fallback forecast. Retrain the model to restore "
            "accurate predictions.",
            evaluated_on_str,
            start_date,
            gap,
            STALE_MODEL_DAYS_THRESHOLD,
        )

        warning_msg = (
            f"Model is stale: it was last evaluated on {evaluated_on_str} "
            f"({gap} days ago, threshold is {STALE_MODEL_DAYS_THRESHOLD} days). "
            "Forecasting this far ahead with SARIMA causes numerical instability. "
            "The values below are a constant fallback — please retrain the model "
            "with recent data for reliable predictions."
        )

        # Use the last in-sample fitted value as a neutral fallback so the
        # response is still a valid, parseable forecast rather than an error.
        try:
            fallback_value = float(
                min(max(_model.fittedvalues.iloc[-1], 0), 1)
            )
        except Exception:
            fallback_value = 0.5  # safe default if fitted values unavailable

        fallback = [
            {
                "date": start_date + timedelta(days=i),
                "predicted_occupancy": fallback_value,
                "lower": None,
                "upper": None,
            }
            for i in range(days)
        ]
        return fallback, True, warning_msg

    # ------------------------------------------------------------------
    # Normal forecast path (gap is within the safe window)
    # ------------------------------------------------------------------
    total_steps = gap + days
    logger.debug(
        "SARIMA forecast: last_known_date=%s, gap=%d, total_steps=%d",
        evaluated_on_str,
        gap,
        total_steps,
    )

    try:
        all_forecasts = _model.forecast(steps=total_steps)
    except Exception as exc:
        # Catch any numerical errors (LinAlgError, overflow, etc.) that slip
        # through the staleness guard and return a graceful degraded response
        # rather than a 500/503 crash.
        logger.error(
            "SARIMA forecast failed (gap=%d days, total_steps=%d): %s",
            gap,
            total_steps,
            exc,
            exc_info=True,
        )
        raise RuntimeError(
            f"SARIMA forecast failed after {gap}-day gap ({total_steps} total steps). "
            f"Original error: {exc}. "
            "The model may need retraining — run notebooks/07_model_evaluation.ipynb "
            "and notebooks/08_inference_pipeline.ipynb to produce a fresh artifact."
        ) from exc

    # Skip the bridging gap, keep only the requested forecast window
    relevant = all_forecasts[gap:]

    result = []
    for i, val in enumerate(relevant[:days]):
        result.append({
            "date": start_date + timedelta(days=i),
            "predicted_occupancy": float(min(max(val, 0), 1)),
            "lower": None,
            "upper": None,
        })
    return result[:days], False, None