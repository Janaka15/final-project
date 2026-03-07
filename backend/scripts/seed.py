"""
Seed script — run from backend/ directory:
    python scripts/seed.py

Seeds:
1. Admin user
2. Room types (Standard × 8, Deluxe × 5, Suite × 2)
3. Individual room records
4. OccupancyHistory from ../../data/hotel_data.csv
"""

import sys
import os
from pathlib import Path

# Add backend root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from datetime import date
import csv
from decimal import Decimal

from app.core.database import SessionLocal, engine
from app.core.security import hash_password
from app.models import User, RoomType, Room, OccupancyHistory
from app.models.user import UserRole
from app.core.config import settings


def seed_admin(db):
    if db.query(User).filter(User.email == settings.ADMIN_EMAIL).first():
        print(f"  Admin {settings.ADMIN_EMAIL} already exists — skipping")
        return
    admin = User(
        email=settings.ADMIN_EMAIL,
        name=settings.ADMIN_NAME,
        password_hash=hash_password(settings.ADMIN_PASSWORD),
        role=UserRole.ADMIN,
    )
    db.add(admin)
    db.commit()
    print(f"  Created admin: {settings.ADMIN_EMAIL}")


ROOM_TYPES = [
    {
        "name": "Standard",
        "description": (
            "Comfortable beachside room with garden or pool view. "
            "Perfect for couples or solo travellers seeking a peaceful retreat."
        ),
        "price_per_night": Decimal("25000.00"),
        "capacity": 2,
        "total_rooms": 8,
        "amenities": [
            "Air conditioning", "Free Wi-Fi", "Flat-screen TV",
            "Minibar", "En-suite bathroom", "Daily housekeeping",
        ],
        "image_url": "/images/standard-room.jpg",
    },
    {
        "name": "Deluxe",
        "description": (
            "Spacious deluxe room with direct sea view and private balcony. "
            "Includes superior amenities and a sofa bed for extra guests."
        ),
        "price_per_night": Decimal("40000.00"),
        "capacity": 3,
        "total_rooms": 5,
        "amenities": [
            "Air conditioning", "Free Wi-Fi", "Flat-screen TV", "Minibar",
            "En-suite bathroom", "Private balcony", "Sea view",
            "Sofa bed", "Coffee machine", "Daily housekeeping",
        ],
        "image_url": "/images/deluxe-room.jpg",
    },
    {
        "name": "Suite",
        "description": (
            "Luxurious ocean-facing suite with separate living area, king bed, "
            "and private plunge pool. The ultimate Somerset experience."
        ),
        "price_per_night": Decimal("65000.00"),
        "capacity": 4,
        "total_rooms": 2,
        "amenities": [
            "Air conditioning", "Free Wi-Fi", "65\" Smart TV", "Minibar",
            "Premium en-suite bathroom", "Private plunge pool", "Ocean view",
            "King bed", "Separate living room", "Butler service",
            "Welcome fruit basket", "Daily housekeeping",
        ],
        "image_url": "/images/suite-room.jpg",
    },
]


def seed_room_types(db):
    if db.query(RoomType).count() > 0:
        print("  Room types already seeded — skipping")
        return

    room_number = 101
    for rt_data in ROOM_TYPES:
        rt = RoomType(**rt_data)
        db.add(rt)
        db.flush()  # get rt.id before adding rooms

        for _ in range(rt.total_rooms):
            room = Room(room_number=str(room_number), room_type_id=rt.id)
            db.add(room)
            room_number += 1

        print(f"  Created room type '{rt.name}' with {rt.total_rooms} rooms")

    db.commit()


def seed_occupancy(db):
    if db.query(OccupancyHistory).count() > 0:
        print("  Occupancy history already seeded — skipping")
        return

    csv_path = Path(__file__).resolve().parents[2] / "data" / "hotel_data.csv"
    if not csv_path.exists():
        print(f"  WARNING: CSV not found at {csv_path} — skipping occupancy seed")
        return

    rows = []
    with open(csv_path, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Parse date — format in CSV is M/D/YYYY
            from datetime import datetime
            parsed_date = datetime.strptime(row["date"], "%m/%d/%Y").date()
            rows.append(
                OccupancyHistory(
                    date=parsed_date,
                    total_rooms=int(row["total_rooms"]),
                    booked_rooms=int(row["booked_rooms"]),
                    occupancy_rate=float(row["occupancy_rate"]),
                    month=int(row["month"]),
                    is_weekend=row["is_weekend"].strip() in ("1", "True", "true"),
                    season=row["season"].strip(),
                    is_holiday=row["is_holiday"].strip() in ("1", "True", "true"),
                    revenue=Decimal(row["revenue"].strip()),
                )
            )

    db.bulk_save_objects(rows)
    db.commit()
    print(f"  Imported {len(rows)} occupancy history records from CSV")


def main():
    print("Running seed script...")
    db = SessionLocal()
    try:
        seed_admin(db)
        seed_room_types(db)
        seed_occupancy(db)
        print("Seed complete.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
