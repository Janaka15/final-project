from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api import auth, rooms, bookings, feedback, webhook
from app.api.admin import rooms as admin_rooms
from app.api.admin import bookings as admin_bookings
from app.api.admin import predictions as admin_predictions
from app.api.admin import analytics as admin_analytics
from app.api.admin import customers as admin_customers

app = FastAPI(
    title="Somerset Mirissa Beach Hotel — IHMS API",
    description="Intelligent Hotel Management System REST API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Public
app.include_router(auth.router)
app.include_router(rooms.router)
app.include_router(bookings.router)
app.include_router(feedback.router)
app.include_router(webhook.router)

# Admin
app.include_router(admin_rooms.router)
app.include_router(admin_bookings.router)
app.include_router(admin_predictions.router)
app.include_router(admin_analytics.router)
app.include_router(admin_customers.router)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "Somerset IHMS API"}
