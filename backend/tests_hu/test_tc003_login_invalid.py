"""
Test Case: TC-003 – Login with invalid credentials
"""

import pytest
from sqlalchemy.orm import Session

from app.auth.services.user_service import get_user_by_email
from app.core.security import verify_password


class TestTC003LoginInvalid:
    """Test login with invalid credentials functionality."""

    def test_tc003_login_invalid_credentials(self, db_session: Session):
        """
        Test Case ID: TC-003
        Requirement: Login with invalid credentials
        Description: Verify that login fails with incorrect email or password
        Preconditions: No user registered with the provided credentials
        Steps:
            1. Attempt to retrieve user with non-existent email
            2. Verify user does not exist
        Expected Result: Login fails, user not found
        """
        # Attempt login with invalid credentials
        user = get_user_by_email(db_session, "nonexistent@example.com")

        # Verify user does not exist
        assert user is None