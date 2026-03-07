# System Architecture

## Somerset Mirissa Beach Hotel — IHMS

**Version:** 1.0 | **Date:** 2026-03-07

---

## 1. Architecture Overview

The IHMS follows a classic **3-tier architecture**:

```
┌─────────────────────────────────┐
│         PRESENTATION TIER        │
│   React SPA (Vite + TypeScript)  │
│   - Customer Portal              │
│   - Admin Dashboard              │
│   - Dialogflow Messenger widget  │
└──────────────┬──────────────────┘
               │  HTTPS (JSON REST)
               ▼
┌─────────────────────────────────┐
│          APPLICATION TIER        │
│     FastAPI (Python 3.12)        │
│   - REST API endpoints           │
│   - JWT Authentication           │
│   - ML Inference Service         │
│   - Dialogflow Webhook           │
└──────────────┬──────────────────┘
               │  SQLAlchemy ORM
               ▼
┌─────────────────────────────────┐
│            DATA TIER             │
│        PostgreSQL 16             │
│   - users, room_types, rooms     │
│   - bookings, feedback           │
│   - occupancy_history            │
│   - predictions                  │
└─────────────────────────────────┘
```

---

## 2. Component Boundaries

### 2.1 Frontend (React SPA)

```
frontend/src/
├── pages/
│   ├── customer/     # Public-facing portal (Landing, Rooms, Booking, Auth, MyBookings, Feedback)
│   └── admin/        # Admin dashboard (guard: role=ADMIN)
├── components/
│   ├── ui/           # shadcn/ui primitives (Button, Card, Input, Badge, Label)
│   ├── Navbar.tsx
│   ├── AdminSidebar.tsx
│   ├── ProtectedRoute.tsx
│   └── ChatWidget/   # Dialogflow Messenger embed
├── context/
│   └── AuthContext.tsx  # JWT state + login/logout/register
└── services/
    └── api.ts           # Axios client with token interceptor
```

**Key decisions:**

- JWT stored in `localStorage` (acceptable for demo; production would use httpOnly cookies)
- Axios interceptor attaches `Authorization: Bearer <token>` on every request
- 401 response → auto-redirect to `/login`
- Admin routes guarded by `ProtectedRoute requireAdmin`

### 2.2 Backend (FastAPI)

```
backend/app/
├── main.py              # FastAPI app, CORS, router includes
├── core/
│   ├── config.py        # pydantic-settings (reads .env)
│   ├── database.py      # SQLAlchemy engine + session + Base
│   └── security.py      # bcrypt + JWT encode/decode
├── api/
│   ├── deps.py          # Shared deps: get_current_user, require_admin
│   ├── auth.py          # /api/auth/*
│   ├── rooms.py         # /api/rooms/* (public)
│   ├── bookings.py      # /api/bookings/* (customer-JWT)
│   ├── feedback.py      # /api/feedback
│   ├── webhook.py       # /api/webhook/dialogflow
│   └── admin/           # /api/admin/* (admin-JWT)
│       ├── rooms.py
│       ├── bookings.py
│       ├── predictions.py
│       ├── analytics.py
│       └── customers.py
├── models/              # SQLAlchemy ORM (mapped to DB tables)
├── schemas/             # Pydantic request/response models
└── services/
    ├── booking_service.py      # Availability logic, overlap detection
    ├── prediction_service.py   # Lazy-load ML model, run inference
    └── dialogflow_service.py   # Intent routing for webhook
```

### 2.3 ML Pipeline (Notebooks)

```
notebooks/
├── 01_data_inspection.ipynb    → docs/data_analysis.md
├── 02_preprocessing.ipynb      → data/splits/{train,val,test}.csv
├── 03_feature_engineering.ipynb → data/splits/features.csv
├── 04_arima_model.ipynb        → models/arima_model.pkl
├── 05_sarima_model.ipynb       → models/sarima_model.pkl
├── 06_prophet_model.ipynb      → models/prophet_model.pkl
├── 07_model_evaluation.ipynb   → models/model_metadata.json + best_model.pkl
└── 08_inference_pipeline.ipynb → validates predict_occupancy() function
```

---

## 3. Data Flow

### 3.1 Customer Booking Flow

```
Customer → /rooms?check_in=X&check_out=Y
         → GET /api/rooms/availability
         → BookingService.get_available_count()
         → Returns available room types

Customer → POST /api/bookings (JWT required)
         → BookingService.create_booking()
           - Validate dates, check overlap, compute price
           - INSERT bookings row
           - Return confirmation_code
```

### 3.2 ML Inference Flow

```
Admin → GET /api/admin/predictions?days=30
      → PredictionService._load_model()   [lazy singleton]
        - Read models/model_metadata.json → find winner
        - joblib.load(models/best_model.pkl)
      → predict_occupancy(today, 30)
        - Prophet: make_future_dataframe → predict → clip [0,1]
        - ARIMA/SARIMA: model.forecast(30) → clip [0,1]
      → Return ForecastResponse to frontend
      → React: render AreaChart with confidence band
```

### 3.3 Dialogflow Webhook Flow

```
User → chat widget → Dialogflow ES → detects intent
     → POST /api/webhook/dialogflow (fulfillment)
     → WebhookEndpoint.dialogflow_webhook()
       - Parse intent name + parameters
       - DialogflowService.route_intent()
         - check.availability → query DB for room counts
         - booking.status    → query booking by code
         - booking.cancel    → guide user to website
     → Return Dialogflow-format JSON response
     → Dialogflow → chat widget renders response
```

---

## 4. Database Schema

```sql
users           (id, email, name, password_hash, role, created_at)
room_types      (id, name, description, price_per_night, capacity, total_rooms, amenities, image_url, created_at)
rooms           (id, room_number, room_type_id→room_types, status, created_at)
bookings        (id, user_id→users, room_type_id→room_types, check_in, check_out, guests, total_price, status, confirmation_code, notes, created_at)
occupancy_history (date PK, total_rooms, booked_rooms, occupancy_rate, month, is_weekend, season, is_holiday, revenue)
predictions     (id, model_name, prediction_date, predicted_occupancy, confidence_lower, confidence_upper, generated_at)
feedback        (id, booking_id→bookings, user_id→users, rating, comment, created_at)
```

---

## 5. Security Architecture

| Layer             | Control                                                 |
| ----------------- | ------------------------------------------------------- |
| Passwords         | bcrypt (passlib, work factor 12)                        |
| Auth tokens       | HS256 JWT, 7-day expiry, signed with SECRET_KEY         |
| Role-based access | `require_admin` dependency on all `/api/admin/*` routes |
| CORS              | Whitelist via `CORS_ORIGINS` env var                    |
| Input validation  | Pydantic v2 on all request bodies                       |
| SQL injection     | SQLAlchemy ORM (parameterised queries)                  |
| XSS               | React DOM escaping (default)                           all request bodies |
| SQL injection | SQLAlchemy ORM (parameterised queries) |
| XSS | React DOM escaping (default) |

---

## 6. Deployment Architecture

```
Internet
   │
   ├── Netlify CDN (static SPA)
   │     frontend/dist/ → served globally
   │
   └── Railway
         ├── PostgreSQL managed DB
         │     Auto-backups, connection pooling
         └── FastAPI web service
               Dockerfile: python:3.12-slim
               uvicorn --host 0.0.0.0 --port 8000
               Reads DATABASE_URL, SECRET_KEY from env
```

---

## 7. API Contract Summary

See `docs/api_spec.md` for full endpoint reference.

Base URL (production): `https://somerset-ihms.railway.app`

All authenticated endpoints require: `Authorization: Bearer <token>`
