"""
Test Case: TC-001 – User Registration
"""

import pytest
from sqlalchemy.orm import Session

from app.auth.services.user_service import create_user
from app.auth.schemas import UserCreate


class TestTC001UserRegistration:
    """Test user registration functionality."""

    def test_tc001_user_registration(self, db_session: Session, test_user_data):
        """
        Test Case ID: TC-001
        Requirement: User Registration
        Description: Verify that a new user can successfully register
        Preconditions: Valid user registration data provided
        Steps:
            1. Prepare user registration data
            2. Call create_user service
            3. Verify user was created successfully
        Expected Result: User registered successfully in database
        """
        # Prepare user registration data
        user_create = UserCreate(**test_user_data)

        # Call create_user service
        user = create_user(db_session, user_create)

        # Verify user was created
        assert user is not None
        assert user.id is not None
        assert user.email == test_user_data["email"]
        assert user.full_name == test_user_data["full_name"]
        assert user.is_active is True