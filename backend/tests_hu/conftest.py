"""
Pytest configuration and fixtures for HU testing.
Uses SQLite in-memory database for testing without Docker.
"""

import os
import sys
from datetime import timedelta

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add parent directory to path so we can import app
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.database import Base


@pytest.fixture(scope="session")
def engine():
    """Create in-memory SQLite database engine."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        echo=False,
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db_session(engine):
    """Create a new database session for each test."""
    connection = engine.connect()
    transaction = connection.begin()
    session = sessionmaker(autocommit=False, autoflush=False, bind=connection)()

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def test_user_data():
    """Sample user data for testing."""
    return {
        "full_name": "Test User",
        "email": "test@example.com",
        "password": "testpass123",
        "phone_number": "1234567890",
        "user_type": "household",
        "household_name": "Test Household",
        "address": "123 Main Street",
        "city": "Test City",
        "postal_code": "12345",
        "primary_role": "producer",
        "installed_capacity_kwh": 5.0,
        "energy_source_type": "solar",
        "average_monthly_consumption_kwh": 100.0,
    }