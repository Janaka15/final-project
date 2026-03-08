# Model Comparison Report

**Project:** CIS6035 IHMS — Somerset Mirissa Beach Hotel

## Methodology

Three univariate time series models were trained and evaluated for 30-day occupancy forecasting:

| Split | Period | Days |
|-------|--------|------|
| Train | 2023-01-01 → 2023-12-31 | 365 |
| Validation | 2024-01-01 → 2024-12-31 | 366 |
| **Test (held-out)** | **2025-01-01 → 2025-12-31** | **365** |

## Results on Test Set (2025)

| Model          |   RMSE |    MAE |   MAPE (%) |   Time (s) |
|:---------------|-------:|-------:|-----------:|-----------:|
| ARIMA(2, 1, 3) | 0.1018 | 0.0793 |    15.7507 |     1372.5 |
| SARIMA         | 0.0944 | 0.0736 |    14.6475 |     4239.3 |
| Prophet        | 0.103  | 0.0825 |    14.8126 |        5.1 |

## Winner

**SARIMA** achieves the lowest RMSE (0.0944) on the 2025 test set and is deployed in production.

## Model Details

### ARIMA
- Order: (2, 1, 3), determined via AIC grid search
- Univariate model, no seasonality term
- Strength: simple, interpretable
- Weakness: cannot capture strong seasonal patterns without differencing

### SARIMA
- Seasonal period s=7 (weekly)
- Seasonal order: (1, 0, 1, 7)
- Better than ARIMA at capturing weekly cycles
- Higher computational cost for rolling forecasts

### Prophet
- Framework by Meta for time series with strong seasonality
- Includes Sri Lanka public holiday effects
- Custom quarterly seasonality
- Best at capturing yearly and holiday patterns
- Provides uncertainty intervals (90% CI)

## Conclusion

Sarima is selected as the production model due to its superior RMSE on unseen 2025 data.
It handles the strong seasonal patterns in Sri Lanka beach tourism (peak Dec-Jan, secondary Apr) better
than the baseline ARIMA approach.
