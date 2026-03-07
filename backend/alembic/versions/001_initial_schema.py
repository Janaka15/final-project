"""Initial schema

Revision ID: 001
Revises:
Create Date: 2026-01-01 00:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enums
    op.execute("CREATE TYPE user_role AS ENUM ('ADMIN', 'CUSTOMER')")
    op.execute("CREATE TYPE room_status AS ENUM ('AVAILABLE', 'MAINTENANCE')")
    op.execute(
        "CREATE TYPE booking_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED')"
    )

    op.create_table(
        "users",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("email", sa.String(255), unique=True, nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column(
            "role",
            sa.Enum("ADMIN", "CUSTOMER", name="user_role", create_type=False),
            nullable=False,
            server_default="CUSTOMER",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
        ),
    )
    op.create_index("ix_users_email", "users", ["email"])

    op.create_table(
        "room_types",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("description", sa.Text),
        sa.Column("price_per_night", sa.Numeric(10, 2), nullable=False),
        sa.Column("capacity", sa.Integer, nullable=False),
        sa.Column("total_rooms", sa.Integer, nullable=False),
        sa.Column("amenities", sa.JSON),
        sa.Column("image_url", sa.String(500)),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
        ),
    )

    op.create_table(
        "rooms",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("room_number", sa.String(10), nullable=False, unique=True),
        sa.Column(
            "room_type_id",
            sa.Integer,
            sa.ForeignKey("room_types.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.Enum("AVAILABLE", "MAINTENANCE", name="room_status", create_type=False),
            nullable=False,
            server_default="AVAILABLE",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
        ),
    )

    op.create_table(
        "bookings",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column(
            "user_id",
            sa.Integer,
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "room_type_id",
            sa.Integer,
            sa.ForeignKey("room_types.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("check_in", sa.Date, nullable=False),
        sa.Column("check_out", sa.Date, nullable=False),
        sa.Column("guests", sa.Integer, nullable=False, server_default="1"),
        sa.Column("total_price", sa.Numeric(12, 2)),
        sa.Column(
            "status",
            sa.Enum(
                "PENDING", "CONFIRMED", "CANCELLED", "COMPLETED",
                name="booking_status",
                create_type=False,
            ),
            nullable=False,
            server_default="CONFIRMED",
        ),
        sa.Column("confirmation_code", sa.String(12), unique=True),
        sa.Column("notes", sa.Text),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
        ),
    )
    op.create_index("ix_bookings_user_id", "bookings", ["user_id"])
    op.create_index("ix_bookings_room_type_id", "bookings", ["room_type_id"])
    op.create_index("ix_bookings_check_in", "bookings", ["check_in"])

    op.create_table(
        "occupancy_history",
        sa.Column("date", sa.Date, primary_key=True),
        sa.Column("total_rooms", sa.Integer, nullable=False),
        sa.Column("booked_rooms", sa.Integer, nullable=False),
        sa.Column("occupancy_rate", sa.Float, nullable=False),
        sa.Column("month", sa.Integer, nullable=False),
        sa.Column("is_weekend", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("season", sa.String(20), nullable=False),
        sa.Column("is_holiday", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("revenue", sa.Numeric(14, 2), nullable=False),
    )

    op.create_table(
        "predictions",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("model_name", sa.String(50), nullable=False),
        sa.Column("prediction_date", sa.Date, nullable=False),
        sa.Column("predicted_occupancy", sa.Float, nullable=False),
        sa.Column("confidence_lower", sa.Float),
        sa.Column("confidence_upper", sa.Float),
        sa.Column(
            "generated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
        ),
    )

    op.create_table(
        "feedback",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column(
            "booking_id",
            sa.Integer,
            sa.ForeignKey("bookings.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            sa.Integer,
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("rating", sa.Integer, nullable=False),
        sa.Column("comment", sa.Text),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
        ),
    )


def downgrade() -> None:
    op.drop_table("feedback")
    op.drop_table("predictions")
    op.drop_table("occupancy_history")
    op.drop_table("bookings")
    op.drop_table("rooms")
    op.drop_table("room_types")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS booking_status")
    op.execute("DROP TYPE IF EXISTS room_status")
    op.execute("DROP TYPE IF EXISTS user_role")
