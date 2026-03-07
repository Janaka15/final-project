"""Shared pytest fixtures: in-memory SQLite engine for unit tests."""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base

TEST_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture(scope="function")
def db():
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
    )
    # SQLite does not support PostgreSQL enums; use String fallback via model reflection.
    # Import models AFTER engine is set so Base.metadata is populated.
    from app.models import User, RoomType, Room, Booking, OccupancyHistory, Prediction, Feedback  # noqa

    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)
