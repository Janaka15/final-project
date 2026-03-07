# Product Requirements Document (PRD)
## Somerset Mirissa Beach Hotel — Intelligent Hotel Management System (IHMS)

**Version:** 1.0
**Author:** M.H Janaka Kavindu Sampath Kumara (CL/BSCSD/32/121)
**Date:** 2026-03-07
**Course:** CIS6035 Final Year Project

---

## 1. Overview

### 1.1 Problem Statement

Somerset Mirissa Beach Hotel (15-room beachfront property, Mirissa, Sri Lanka) operates entirely on manual spreadsheet-based booking systems. This results in:

- **No real-time availability tracking** → double-bookings, revenue loss
- **No occupancy forecasting** → poor staffing and pricing decisions
- **No centralised guest data** → inability to personalise service
- **No automated customer engagement** → missed bookings from unanswered queries

### 1.2 Solution

A full-stack Intelligent Hotel Management System (IHMS) that:

1. Automates bookings via a customer-facing web portal
2. Predicts room occupancy using AI/ML models
3. Engages guests via an AI chatbot (Dialogflow ES)
4. Provides management with actionable analytics dashboards

### 1.3 Scope

- **In scope:** Reservation management, AI forecasting, admin analytics, chatbot
- **Out of scope:** Payment gateway, housekeeping module, POS/restaurant integration

---

## 2. User Stories

### Customer (Guest)

| ID | As a... | I want to... | So that... | Priority |
|----|---------|--------------|------------|----------|
| U01 | Guest | Browse room types and pricing | I can compare options | Must |
| U02 | Guest | Check real-time availability for my dates | I only see rooms I can book | Must |
| U03 | Guest | Register an account and log in | I can manage my reservations | Must |
| U04 | Guest | Make a room reservation online | I avoid calling the hotel | Must |
| U05 | Guest | Receive a confirmation code instantly | I have proof of my booking | Must |
| U06 | Guest | View all my bookings and their status | I can track my plans | Must |
| U07 | Guest | Cancel an upcoming booking | My plans changed | Must |
| U08 | Guest | Leave a rating and review after my stay | I can share my experience | Should |
| U09 | Guest | Chat with a bot about room info, availability | I get answers 24/7 | Should |
| U10 | Guest | Ask the bot about my booking status | I don't need to call | Could |

### Hotel Administrator

| ID | As a... | I want to... | So that... | Priority |
|----|---------|--------------|------------|----------|
| A01 | Admin | View today's occupancy rate | I can plan operations | Must |
| A02 | Admin | See a 30-day occupancy forecast | I can optimise staffing and pricing | Must |
| A03 | Admin | View revenue trends (daily/weekly/monthly) | I can track business performance | Must |
| A04 | Admin | See an occupancy calendar heatmap | I can identify peak periods visually | Should |
| A05 | Admin | View seasonal occupancy breakdown by month | I can plan seasonal promotions | Should |
| A06 | Admin | View room-type utilisation this month | I can identify underperforming rooms | Should |
| A07 | Admin | See all bookings and update their status | I can manage reservations operationally | Must |
| A08 | Admin | Manage room types (add, edit pricing) | I can keep listings up-to-date | Must |
| A09 | Admin | View the customer directory | I can look up guest history | Should |
| A10 | Admin | View all guest feedback and average scores | I can monitor satisfaction | Should |

---

## 3. Functional Requirements

### 3.1 Authentication
- FR-AUTH-01: System shall allow guests to register with email, name, and password (bcrypt hashed)
- FR-AUTH-02: System shall issue a JWT (HS256, 7-day expiry) on login
- FR-AUTH-03: System shall differentiate ADMIN and CUSTOMER roles
- FR-AUTH-04: Protected routes shall reject requests without a valid token

### 3.2 Room Management
- FR-ROOM-01: System shall store three room types: Standard (8 rooms), Deluxe (5 rooms), Suite (2 rooms)
- FR-ROOM-02: System shall expose a public endpoint listing all room types
- FR-ROOM-03: System shall provide an availability endpoint that accepts check-in/check-out and returns available room counts

### 3.3 Booking
- FR-BOOK-01: System shall create a booking with CONFIRMED status and generate a unique 12-character confirmation code
- FR-BOOK-02: System shall prevent double-booking via overlap detection (booking.check_in < checkout AND booking.check_out > checkin)
- FR-BOOK-03: System shall calculate total price = price_per_night × nights
- FR-BOOK-04: Customers shall be able to cancel their own CONFIRMED or PENDING bookings
- FR-BOOK-05: Admins shall be able to update booking status to any valid state

### 3.4 Occupancy Forecasting
- FR-ML-01: Three models shall be trained and compared (ARIMA, SARIMA, Prophet)
- FR-ML-02: The best model (lowest RMSE on 2025 test set) shall be deployed
- FR-ML-03: The API shall return a 30-day occupancy forecast with confidence intervals
- FR-ML-04: Model metadata (winner, metrics, train date) shall be stored in model_metadata.json

### 3.5 Analytics
- FR-ANAL-01: Revenue trend endpoint shall support daily/weekly/monthly aggregation
- FR-ANAL-02: Occupancy heatmap endpoint shall return all days for a given year
- FR-ANAL-03: Seasonal breakdown shall return average occupancy per calendar month
- FR-ANAL-04: Room utilisation endpoint shall return booked vs available nights per room type for the current month

### 3.6 Chatbot
- FR-BOT-01: Chatbot shall handle availability queries via Dialogflow webhook
- FR-BOT-02: Chatbot shall handle booking status lookups by confirmation code
- FR-BOT-03: Chatbot shall handle static FAQs (check-in time, location, pricing) without a webhook
- FR-BOT-04: Chatbot widget shall be embedded on all customer portal pages

---

## 4. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| Performance | API response time < 500ms for all non-ML endpoints |
| Availability | 99% uptime on Railway/Render hosting |
| Security | Passwords hashed with bcrypt (work factor ≥ 12); HTTPS enforced in production |
| Scalability | Stateless FastAPI design allows horizontal scaling |
| Accessibility | Frontend shall achieve WCAG AA colour contrast |
| Maintainability | All ML models serialised with joblib; models replaceable without code changes |

---

## 5. Acceptance Criteria

| User Story | Acceptance Criteria |
|------------|---------------------|
| U04 | Given valid dates and availability, when I submit the booking form, then I receive a confirmation code within 2 seconds |
| U07 | Given a CONFIRMED booking with a future check-in, when I click Cancel, then the status changes to CANCELLED |
| A02 | Given ML notebooks have been run, when I visit /admin/predictions, then I see a 30-day line chart with confidence band |
| A07 | When admin changes a booking status via the dropdown, the change persists immediately |
| U09 | When a user asks "Are rooms available for Jan 5-10?", the bot returns available room types with prices |

---

## 6. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, Recharts |
| Backend | FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2, python-jose, passlib |
| Database | PostgreSQL 16 |
| ML | statsmodels (ARIMA/SARIMA), prophet, pandas, numpy, scikit-learn |
| Chatbot | Dialogflow ES, Google Cloud |
| Deployment | Railway/Render (backend+DB), Netlify (frontend) |
