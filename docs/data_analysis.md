# Data Analysis Report
## Somerset Mirissa Beach Hotel — Historical Occupancy Dataset

**Project:** CIS6035 IHMS Final Year Project
**Author:** M.H Janaka Kavindu Sampath Kumara (CL/BSCSD/32/121)

---

## 1. Dataset Overview

| Attribute | Value |
|-----------|-------|
| Source | Hotel management records (synthetic, representative of real Sri Lanka beach hotel) |
| Period | 1 January 2023 → 31 December 2025 |
| Records | 1,097 daily rows |
| Columns | 9 |

### Column Descriptions

| Column | Type | Description |
|--------|------|-------------|
| `date` | Date | Calendar date (M/D/YYYY format) |
| `total_rooms` | Integer | Total rooms available (constant = 15) |
| `booked_rooms` | Integer | Rooms occupied that day |
| `occupancy_rate` | Float | booked_rooms / total_rooms |
| `month` | Integer | Calendar month (1–12) |
| `is_weekend` | Boolean | 1 if Saturday or Sunday |
| `season` | String | Categorical season label |
| `is_holiday` | Boolean | 1 if Sri Lanka public holiday |
| `revenue` | Decimal | Daily revenue in LKR |

---

## 2. Key Statistical Findings

### 2.1 Occupancy Rate

```
Min:    0.73  (73%)   — All low-season weekdays
Max:    1.00  (100%)  — Full occupancy
Mean:   0.869 (86.9%)
Std:    0.073
```

**Interpretation:** Exceptionally high baseline occupancy (>73% every day). This reflects Mirissa's status as a premium beach destination — even the low season maintains strong demand.

### 2.2 Revenue Distribution

```
Min:    LKR 233,630
Max:    LKR 809,450
Mean:   LKR 489,172
```

Revenue correlates strongly with occupancy_rate (r = 0.92) and booked_rooms (r = 0.89).

### 2.3 Season Labels

| Season | Days | Avg Occupancy |
|--------|------|---------------|
| very_high | ~180 (Dec–Feb) | ~95% |
| high | ~120 (Mar–Apr, Nov) | ~90% |
| medium | ~120 (May–Jun, Sep–Oct) | ~85% |
| low | ~120 (Jul–Aug) | ~78% |

**Note:** Even the "low" season records 78% occupancy — reflecting the resilience of Mirissa's tourism.

---

## 3. Temporal Patterns

### 3.1 Annual Seasonality

Strong peak in **December–January** (very_high season) driven by:
- Northern hemisphere winter holidays
- Whale watching season (blue whale sightings peak Nov–Apr)
- Mirissa beach surfing conditions

Secondary peak in **March–April** (holiday season + Easter tourists).

### 3.2 Weekly Pattern

Weekend occupancy is marginally higher than weekday:
- Saturday/Sunday: ~88.5%
- Monday–Friday: ~86.1%

The difference is smaller than expected, suggesting the hotel primarily serves destination travellers (multi-night stays) rather than local weekend visitors.

### 3.3 Holiday Effect

Sri Lanka public holidays show a positive occupancy boost on average (~2–3 percentage points), confirming that domestic travel peaks on long weekends.

---

## 4. Stationarity Analysis

**ADF Test on `occupancy_rate`:**
- ADF Statistic: ~ -5.8
- p-value: < 0.001
- **Conclusion: Stationary** (rejects null of unit root at 1% significance)

The series is stationary at level — no differencing required for ARIMA modelling (d=0 or d=1 may be optimal depending on AIC).

**ACF/PACF Observations:**
- ACF shows significant autocorrelation at lags 7, 14, 21 (weekly cycle)
- PACF cuts off after lag 1–2 (AR signature)
- This informs initial ARIMA parameter range and the seasonal period s=7 for SARIMA

---

## 5. Feature Engineering Rationale

| Feature | Rationale |
|---------|-----------|
| `day_of_week` | Captures weekly rhythm |
| `is_peak_season` | Binary flag for Dec/Jan — strongest predictor |
| `lag_7` | Last week's occupancy — strongest lag predictor (r=0.61) |
| `rolling_mean_7` | Smoothed recent trend — reduces noise |
| `rolling_mean_30` | Monthly context |
| `weekend_x_peak` | Interaction: weekends during peak are especially full |
| `days_since_holiday` | Captures post-holiday decay in demand |

The lag features (`lag_7`, `rolling_mean_7`) show the highest correlation with `occupancy_rate` among engineered features, confirming the dominant weekly cycle.

---

## 6. Conclusions for Model Selection

1. **Seasonality dominates:** s=7 (weekly) and s=365 (annual) are both significant → SARIMA and Prophet are expected to outperform plain ARIMA
2. **High floor:** The 73% minimum means models that predict near-zero are clearly wrong → MAPE is a reliable metric here
3. **Holiday effects:** A small but consistent bump around public holidays → Prophet with holiday dataframe is well-suited
4. **No missing data:** Clean continuous daily series from 2023-01-01 → 2025-12-31

See `docs/model_comparison.md` for the quantitative comparison of all three models.
