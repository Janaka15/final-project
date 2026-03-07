# Somerset Mirissa Beach Hotel — IHMS

**Intelligent Hotel Management System** — CIS6035 Final Year Project
Student: M.H Janaka Kavindu Sampath Kumara (CL/BSCSD/32/121)

A full-stack web application for Somerset Mirissa Beach Hotel (Mirissa, Sri Lanka) that automates reservations, delivers AI-powered occupancy forecasting, and provides an intelligent chatbot for guest engagement.

---

## Tech Stack

| Layer           | Technology                                                                        |
| --------------- | --------------------------------------------------------------------------------- |
| Frontend        | React 18, Vite, TypeScript, Tailwind CSS v4, shadcn/ui, Recharts, React Router v6 |
| Backend         | FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2, python-jose (JWT), bcrypt          |
| Database        | PostgreSQL 16                                                                     |
| ML              | statsmodels (ARIMA/SARIMA), Prophet, pandas, numpy, scikit-learn                  |
| Chatbot         | Dialogflow ES (Google Cloud)                                                      |
| DevOps          | Docker Compose (local), Railway/Render (production), Netlify (frontend)           |
| Dependency mgmt | uv (Python notebooks), pip (backend)                                              |

---

## Project Structure

```
Somerset-Mirissa-Beach-Hotel/
├── frontend/          # React + Vite + TypeScript
├── backend/           # FastAPI application
│   ├── app/
│   │   ├── api/       # Route handlers (auth, rooms, bookings, admin/*, webhook)
│   │   ├── models/    # SQLAlchemy ORM models
│   │   ├── schemas/   # Pydantic request/response schemas
│   │   ├── services/  # Business logic (booking, prediction, dialogflow)
│   │   ├── ml/        # Model artifacts (best_model.pkl, scaler.pkl, metadata.json)
│   │   └── core/      # Config, database, security
│   ├── alembic/       # DB migrations
│   ├── scripts/       # Seed script
│   └── tests/         # pytest unit tests
├── notebooks/         # Jupyter ML pipeline (01–08)
├── models/            # Exported model artifacts
├── data/              # hotel_data.csv (1,097 daily records, 2023–2025)
├── docs/              # Thesis documentation
└── docker-compose.yml
```

---

## Quick Start (Local Development)

### Prerequisites

- Docker & Docker Compose
- Python 3.12+
- Node.js 20+
- uv (`pip install uv`)

### 1. Start PostgreSQL

```bash
docker-compose up -d
```

This starts PostgreSQL on port 5432 and pgAdmin on port 5050 (admin@admin.com / admin).

### 2. Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp ../.env.example .env          # edit SECRET_KEY at minimum

alembic upgrade head             # run migrations
python scripts/seed.py           # seed room types + import occupancy_history
```

Start the API server:

```bash
uvicorn app.main:app --reload
```

API available at `http://localhost:8000`. Docs at `http://localhost:8000/docs`.

### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env             # optional: set VITE_DIALOGFLOW_AGENT_ID
npm run dev
```

App available at `http://localhost:5173`.

### 4. Run Tests

```bash
cd backend
pytest tests/ -v
```

All 33 tests should pass. Tests use an in-memory SQLite database — no running Postgres required.

---

## ML Notebooks

Run in order inside the `notebooks/` directory:

```bash
cd notebooks
uv run jupyter lab
```

| Notebook                       | Purpose                                         |
| ------------------------------ | ----------------------------------------------- |
| `01_data_inspection.ipynb`     | EDA, time-series plots, seasonality             |
| `02_preprocessing.ipynb`       | Stationarity tests, train/val/test split        |
| `03_feature_engineering.ipynb` | Lag features, rolling means, interaction terms  |
| `04_arima_model.ipynb`         | ARIMA grid search + validation                  |
| `05_sarima_model.ipynb`        | SARIMA(p,d,q)(P,D,Q,7)                          |
| `06_prophet_model.ipynb`       | Prophet + Sri Lanka holidays                    |
| `07_model_evaluation.ipynb`    | Comparative analysis → selects winner           |
| `08_inference_pipeline.ipynb`  | `predict_occupancy()` function, saves artifacts |

After notebook 08 completes, copy artifacts to backend:

```bash
cp models/best_model.pkl backend/app/ml/artifacts/
cp models/scaler.pkl backend/app/ml/artifacts/
cp models/model_metadata.json backend/app/ml/artifacts/
```

---

## Environment Variables

See `.env.example` for the full list. Key variables:

| Variable                              | Description                                    |
| ------------------------------------- | ---------------------------------------------- |
| `DATABASE_URL`                        | PostgreSQL connection string                   |
| `SECRET_KEY`                          | JWT signing secret (min 32 chars, keep secret) |
| `JWT_EXPIRE_MINUTES`                  | Token lifetime (default: 10080 = 7 days)       |
| `CORS_ORIGINS`                        | Comma-separated allowed origins                |
| `DIALOGFLOW_PROJECT_ID`               | GCP project ID for Dialogflow ES               |
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | Base64-encoded service account JSON            |

---

## Default Admin Credentials

After running `seed.py`:

- **Email:** `admin@somersetmirissa.com`
- **Password:** `Admin@2024!`

Change these in `.env` before deploying to production.

---

## Room Types

| Type      | Rooms  | Price/Night | Capacity |
| --------- | ------ | ----------- | -------- |
| Standard  | 8      | LKR 25,000  | 2        |
| Deluxe    | 5      | LKR 40,000  | 3        |
| Suite     | 2      | LKR 65,000  | 4        |
| **Total** | **15** |             |          |

---

## API Overview

Full spec: [`docs/api_spec.md`](docs/api_spec.md)

- `POST /api/auth/register` — customer registration
- `POST /api/auth/login` — returns JWT
- `GET /api/rooms/availability` — available room types for date range
- `POST /api/bookings` — create booking (JWT required)
- `GET /api/admin/predictions` — 30-day occupancy forecast (admin)
- `GET /api/admin/analytics/revenue` — revenue trend (admin)
- `POST /api/webhook/dialogflow` — Dialogflow fulfillment webhook

---

## Dialogflow Chatbot

Setup guide: [`docs/dialogflow_setup.md`](docs/dialogflow_setup.md)

The chat widget appears on all customer portal pages. It handles:

- Room availability queries
- Booking status lookups
- Room information (static)
- FAQ (check-in times, location, pricing)

---

## Deployment

### Backend (Railway / Render)

```bash
# Dockerfile is at backend/Dockerfile
# Set all env vars in the platform dashboard
# Run on deploy: alembic upgrade head
```

### Frontend (Netlify)

```bash
cd frontend
npm run build
# Deploy the dist/ directory
# Set VITE_API_BASE_URL to your backend URL
```

---

## Documentation

| File                       | Contents                                                |
| -------------------------- | ------------------------------------------------------- |
| `docs/PRD.md`              | Product requirements, user stories, acceptance criteria |
| `docs/architecture.md`     | System design, component boundaries, data flow          |
| `docs/data_analysis.md`    | EDA findings, feature engineering rationale             |
| `docs/model_comparison.md` | ARIMA vs SARIMA vs Prophet — metrics, winner rationale  |
| `docs/api_spec.md`         | Full endpoint reference                                 |
| `docs/dialogflow_setup.md` | Step-by-step GCP + Dialogflow ES setup winner rationale |
| `docs/api_spec.md`         | Full endpoint reference                                 |
| `docs/dialogflow_setup.md` | Step-by-step GCP + Dialogflow ES setup                  |

---

## License

Academic project — CIS6035, University submission. Not for commercial use.
