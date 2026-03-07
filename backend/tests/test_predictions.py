"""Unit tests for prediction_service.py — mock model loading."""

import pytest
import json
from datetime import date, timedelta
from pathlib import Path
from unittest.mock import patch, MagicMock


class TestPredictOccupancy:
    def test_prophet_forecast_shape(self):
        """predict_occupancy returns correct number of days with required keys."""
        import pandas as pd
        import numpy as np

        mock_model = MagicMock()
        future_df = pd.DataFrame(
            {"ds": pd.date_range(start="2027-01-01", periods=30, freq="D")}
        )
        mock_model.make_future_dataframe.return_value = future_df

        forecast_df = future_df.copy()
        forecast_df["yhat"] = np.random.uniform(0.7, 1.0, 30)
        forecast_df["yhat_lower"] = forecast_df["yhat"] - 0.05
        forecast_df["yhat_upper"] = forecast_df["yhat"] + 0.05
        mock_model.predict.return_value = forecast_df

        metadata = {"winner": "prophet", "rmse": 0.04}

        import app.services.prediction_service as svc
        svc._model = mock_model
        svc._metadata = metadata

        results = svc._predict_prophet(date(2027, 1, 1), 30)

        assert len(results) == 30
        for r in results:
            assert "date" in r
            assert "predicted_occupancy" in r
            assert 0.0 <= r["predicted_occupancy"] <= 1.0
            assert "lower" in r
            assert "upper" in r

        # Reset
        svc._model = None
        svc._metadata = None

    def test_statsmodels_forecast_shape(self):
        """ARIMA/SARIMA forecast returns correct days."""
        mock_model = MagicMock()
        mock_model.forecast.return_value = [0.8] * 30

        import app.services.prediction_service as svc
        svc._model = mock_model
        svc._metadata = {"winner": "arima"}

        results = svc._predict_statsmodels(date(2027, 1, 1), 30)

        assert len(results) == 30
        assert results[0]["date"] == date(2027, 1, 1)
        assert results[29]["date"] == date(2027, 1, 30)
        assert results[0]["lower"] is None

        svc._model = None
        svc._metadata = None

    def test_occupancy_clamped_to_0_1(self):
        """Values outside [0, 1] from model should be clamped."""
        mock_model = MagicMock()
        mock_model.forecast.return_value = [1.5, -0.1, 0.85]

        import app.services.prediction_service as svc
        svc._model = mock_model
        svc._metadata = {"winner": "arima"}

        results = svc._predict_statsmodels(date(2027, 1, 1), 3)

        assert results[0]["predicted_occupancy"] == 1.0
        assert results[1]["predicted_occupancy"] == 0.0
        assert results[2]["predicted_occupancy"] == 0.85

        svc._model = None
        svc._metadata = None

    def test_model_not_found_raises(self, tmp_path, monkeypatch):
        """FileNotFoundError raised when model artifacts are missing."""
        import app.services.prediction_service as svc
        svc._model = None
        svc._metadata = None
        monkeypatch.setattr(svc, "MODELS_DIR", tmp_path)

        with pytest.raises(FileNotFoundError, match="model_metadata.json"):
            svc._load_model()
