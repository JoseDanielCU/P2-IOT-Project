"""
Configuration and fixtures for pytest.

This module provides database setup and fixtures for testing.
Using SQLite in-memory database for fast isolated tests.
"""

import os
import sys
from pathlib import Path

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker



# Set test database URL to SQLite BEFORE importing app modules
# This prevents PostgreSQL connection attempts during import
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

# Add backend directory to path so 'app' can be imported
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.database import Base  # noqa: E402

@pytest.fixture(scope="function")
def test_db():
    """Create a test database with in-memory SQLite.

    Yields a database session for each test function.
    Database is recreated for each test to ensure isolation.
    """
    # Create an in-memory SQLite database for testing
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
    )

    # Create all tables
    Base.metadata.create_all(bind=engine)

    # Create a session factory
    testingsessionlocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    # Create a session and yield it for the test
    session = testingsessionlocal()
    yield session

    # Cleanup
    session.close()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def cleanup_db(test_db: Session):
    """Cleanup database after each test.

    Ensures that database state doesn't leak between tests.
    """
    yield
    test_db.rollback()
