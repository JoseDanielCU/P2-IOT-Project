"""
Test Case: TC-002 – Login with valid credentials
"""

import pytest
from sqlalchemy.orm import Session

from app.auth.services.user_service import create_user, get_user_by_email
from app.auth.schemas import UserCreate
from app.core.security import verify_password


class TestTC002LoginValid:
    """Test login with valid credentials functionality."""

    def test_tc002_login_valid_credentials(self, db_session: Session, test_user_data):
        """
        Test Case ID: TC-002
        Requirement: Login with valid credentials
        Description: Verify that user can login with correct email and password
        Preconditions: User is registered in the system
        Steps:
            1. Register a user
            2. Retrieve user by email
            3. Verify password matches
            4. Verify user is active
        Expected Result: Login successful, user authenticated
        """
        # Register the user
        user_create = UserCreate(**test_user_data)
        registered_user = create_user(db_session, user_create)

        # Attempt login with correct credentials
        user = get_user_by_email(db_session, test_user_data["email"])

        # Verify user exists
        assert user is not None
        assert user.id == registered_user.id

        # Verify password
        password_valid = verify_password(test_user_data["password"], user.hashed_password)
        assert password_valid is True

        # Verify user is active
        assert user.is_active is True