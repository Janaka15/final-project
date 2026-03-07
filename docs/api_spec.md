# API Specification
## Somerset Mirissa Beach Hotel — IHMS REST API

**Base URL (local):** `http://localhost:8000`
**Base URL (prod):** `https://somerset-ihms.railway.app`
**Content-Type:** `application/json`
**Auth:** `Authorization: Bearer <JWT token>`

---

## Authentication

### POST /api/auth/register
Register a new customer account.

**Request:**
```json
{ "email": "guest@example.com", "name": "Jane Smith", "password": "SecurePass123" }
```
**Response 201:**
```json
{ "access_token": "<jwt>", "token_type": "bearer" }
```
**Errors:** 400 Email already registered

---

### POST /api/auth/login
```json
{ "email": "guest@example.com", "password": "SecurePass123" }
```
**Response 200:**
```json
{ "access_token": "<jwt>", "token_type": "bearer" }
```
**Errors:** 401 Invalid credentials

---

### GET /api/auth/me *(JWT)*
**Response 200:**
```json
{ "id": 1, "email": "guest@example.com", "name": "Jane Smith", "role": "CUSTOMER" }
```

---

## Rooms (Public)

### GET /api/rooms
Returns all room types.
**Response 200:** Array of room type objects.

### GET /api/rooms/{id}
Returns a single room type by ID.
**Errors:** 404 Not found

### GET /api/rooms/availability?check_in=YYYY-MM-DD&check_out=YYYY-MM-DD
Returns room types with `available_count` added.
**Errors:** 400 Invalid dates

---

## Bookings *(JWT required)*

### POST /api/bookings
**Request:**
```json
{
  "room_type_id": 1,
  "check_in": "2027-01-10",
  "check_out": "2027-01-14",
  "guests": 2,
  "notes": "Early check-in requested"
}
```
**Response 201:** Booking object with `confirmation_code`.
**Errors:** 400 No rooms available / Invalid dates

### GET /api/bookings
Returns all bookings for the authenticated customer.

### PUT /api/bookings/{id}/cancel
Cancels a booking. Customer can only cancel their own CONFIRMED/PENDING bookings.
**Errors:** 400 Cannot cancel

---

## Admin — Bookings *(Admin JWT)*

### GET /api/admin/bookings?status=CONFIRMED
Returns all bookings (optionally filtered by status).

### PUT /api/admin/bookings/{id}
```json
{ "status": "COMPLETED" }
```

---

## Admin — Rooms *(Admin JWT)*

### GET /api/admin/rooms
### POST /api/admin/rooms
```json
{
  "name": "Studio", "description": "Cozy studio room",
  "price_per_night": 18000, "capacity": 1, "total_rooms": 3,
  "amenities": ["Air conditioning", "Free Wi-Fi"]
}
```
### PUT /api/admin/rooms/{id}
### DELETE /api/admin/rooms/{id}

---

## Admin — Predictions *(Admin JWT)*

### GET /api/admin/predictions?days=30
**Response 200:**
```json
{
  "model_name": "prophet",
  "avg_predicted_occupancy": 0.872,
  "forecasts": [
    {
      "date": "2026-03-07",
      "predicted_occupancy": 0.89,
      "confidence_lower": 0.82,
      "confidence_upper": 0.96
    }
  ]
}
```
**Errors:** 503 Model not yet trained

---

## Admin — Analytics *(Admin JWT)*

### GET /api/admin/analytics/kpis
```json
{
  "todays_occupancy_pct": 86.7,
  "revenue_mtd": 12500000,
  "active_bookings": 9,
  "checkins_today": 2
}
```

### GET /api/admin/analytics/revenue?period=weekly
period: `daily` | `weekly` | `monthly`

### GET /api/admin/analytics/occupancy-heatmap?year=2025

### GET /api/admin/analytics/seasonal

### GET /api/admin/analytics/room-utilization

---

## Admin — Customers *(Admin JWT)*

### GET /api/admin/customers?search=john
### GET /api/admin/customers/{user_id}/bookings
### GET /api/admin/customers/feedback

---

## Webhook

### POST /api/webhook/dialogflow
Dialogflow fulfillment webhook. Accepts standard Dialogflow request format.
No authentication (Dialogflow sends its own request signature).

**Request (Dialogflow format):**
```json
{
  "queryResult": {
    "intent": { "displayName": "check.availability" },
    "parameters": { "check-in": "2027-01-05", "check-out": "2027-01-10" }
  }
}
```
**Response:**
```json
{
  "fulfillmentText": "Available rooms: Standard (2 available)...",
  "fulfillmentMessages": [{ "text": { "text": ["..."] } }]
}
```

---

## Error Response Format

```json
{ "detail": "Human-readable error message" }
```

HTTP status codes used: 200, 201, 204, 400, 401, 403, 404, 409, 500, 503
