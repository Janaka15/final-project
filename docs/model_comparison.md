# Model Comparison Report

**Project:** CIS6035 IHMS — Somerset Mirissa Beach Hotel

## Methodology

Three univariate time series models were trained and evaluated for 30-day occupancy forecasting:

| Split               | Period                      | Days    |
| ------------------- | --------------------------- | ------- |
| Train               | 2023-01-01 → 2023-12-31     | 365     |
| Validation          | 2024-01-01 → 2024-12-31     | 366     |
| **Test (held-out)** | **2025-01-01 → 2025-12-31** | **365** |

## Results on Test Set (2025)

| Model          |   RMSE |    MAE | MAPE (%) | Time (s) |
| :------------- | -----: | -----: | -------: | -------: |
| ARIMA(3, 1, 3) | 0.1014 | 0.0785 |  15.5871 |     86.5 |
| SARIMA         | 0.1007 | 0.0798 |  15.8023 |    123.5 |
| Prophet        |  0.095 | 0.0758 |  14.2761 |      0.1 |

## Winner

**PROPHET** achieves the lowest RMSE (0.0950) on the 2025 test set and is deployed in production.

## Model Details

### ARIMA

- Order: (3, 1, 3), determined via AIC grid search
- Univariate model, no seasonality term
- Strength: simple, interpretable
- Weakness: cannot capture strong seasonal patterns without differencing

### SARIMA

- Seasonal period s=7 (weekly)
- Seasonal order: (0, 0, 0, 7)
- Better than ARIMA at capturing weekly cycles
- Higher computational cost for rolling forecasts

### Prophet

- Framework by Meta for time series with strong seasonality
- Includes Sri Lanka public holiday effects
- Custom quarterly seasonality
- Best at capturing yearly and holiday patterns
- Provides uncertainty intervals (90% CI)

## Conclusion

Prophet is selected as the production model due to its superior RMSE on unseen 2025 data.
It handles the strong seasonal patterns in Sri Lanka beach tourism (peak Dec-Jan, secondary Apr) better
than the baseline ARIMA approach.
