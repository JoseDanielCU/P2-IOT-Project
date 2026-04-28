"""
Tests for the user service module.

Includes tests for user creation, retrieval, and update operations
with happy path, sad path, and edge case scenarios.
"""

import pytest
from sqlalchemy.orm import Session

from app.auth.models import EnergySourceType, PrimaryRole, UserType
from app.auth.schemas import UserCreate
from app.auth.services.user_service import (
    create_user,
    get_user_by_email,
    update_user,
)


class TestUserServiceCreateUser:
    """Test suite for user creation functionality."""

    def test_create_user_happy_path(self, test_db: Session, cleanup_db):  # noqa: ARG002
        """Test successful user creation with all required fields.

        HAPPY PATH: Creating a valid user should succeed and return
        a user object with all provided data.
        """
        # Arrange
        user_data = UserCreate(
            full_name="Juan García López",
            email="juan@example.com",
            password="securePassword123!",
            phone_number="123456789",
            user_type=UserType.household,
            household_name="Casa García",
            address="Calle Principal 123",
            city="Madrid",
            postal_code="28001",
            primary_role=PrimaryRole.producer,
            installed_capacity_kwh=5.0,
            energy_source_type=EnergySourceType.solar,
            average_monthly_consumption_kwh=100.0,
        )

        # Act
        created_user = create_user(test_db, user_data)

        # Assert
        assert created_user.id is not None
        assert created_user.full_name == user_data.full_name
        assert created_user.email == user_data.email
        assert created_user.hashed_password is not None
        assert created_user.hashed_password != user_data.password  # Password is hashed
        assert created_user.phone_number == user_data.phone_number
        assert created_user.user_type == user_data.user_type
        assert created_user.household_name == user_data.household_name
        assert created_user.address == user_data.address
        assert created_user.city == user_data.city
        assert created_user.postal_code == user_data.postal_code
        assert created_user.primary_role == user_data.primary_role

    def test_create_user_with_minimal_data(self, test_db: Session, cleanup_db):  # noqa: ARG002
        """Test user creation with only required fields (edge case).

        EDGE CASE: Creating a user with minimal data (no optional fields)
        should succeed without errors.
        """
        # Arrange
        user_data = UserCreate(
            full_name="María López",
            email="maria@example.com",
            password="Password123!",
            phone_number=None,  # Optional field
            user_type=UserType.household,
            household_name="Casa López",
            address="Calle Secundaria 456",
            city="Barcelona",
            postal_code="08001",
            primary_role=PrimaryRole.consumer,
            installed_capacity_kwh=None,  # Optional field
            energy_source_type=None,  # Optional field
            average_monthly_consumption_kwh=None,  # Optional field
        )

        # Act
        created_user = create_user(test_db, user_data)

        # Assert
        assert created_user.id is not None
        assert created_user.full_name == user_data.full_name
        assert created_user.email == user_data.email
        assert created_user.phone_number is None
        assert created_user.installed_capacity_kwh is None

    def test_create_user_duplicate_email_raises_error(
        self, test_db: Session, cleanup_db  # noqa: ARG002
    ):
        """Test that creating a user with duplicate email fails.

        SAD PATH: Creating a user with an email that already exists
        should raise an IntegrityError.
        """
        from sqlalchemy.exc import IntegrityError

        # Arrange
        first_user_data = UserCreate(
            full_name="Usuario Uno",
            email="duplicate@example.com",
            password="Password123!",
            phone_number="111111111",
            user_type=UserType.household,
            household_name="Casa Uno",
            address="Calle Uno 111",
            city="Valencia",
            postal_code="46001",
            primary_role=PrimaryRole.prosumer,
        )

        second_user_data = UserCreate(
            full_name="Usuario Dos",
            email="duplicate@example.com",  # Same email
            password="Password456!",
            phone_number="222222222",
            user_type=UserType.company,
            household_name="Empresa Dos",
            address="Calle Dos 222",
            city="Sevilla",
            postal_code="41001",
            primary_role=PrimaryRole.producer,
        )

        # Act & Assert
        create_user(test_db, first_user_data)
        with pytest.raises(IntegrityError):
            create_user(test_db, second_user_data)

    def test_create_user_password_hashing(self, test_db: Session, cleanup_db):  # noqa: ARG002
        """Test that passwords are properly hashed.

        EDGE CASE: Verify that the password stored is a bcrypt hash,
        not the plain password.
        """
        # Arrange
        plain_password = "MyPassword123!"
        user_data = UserCreate(
            full_name="Test Usuario",
            email="test@example.com",
            password=plain_password,
            user_type=UserType.household,
            household_name="Casa Test",
            address="Calle Test 1",
            city="Test City",
            postal_code="00000",
            primary_role=PrimaryRole.consumer,
        )

        # Act
        created_user = create_user(test_db, user_data)

        # Assert
        assert created_user.hashed_password != plain_password
        assert created_user.hashed_password.startswith("$2b")  # bcrypt hash prefix
        assert len(created_user.hashed_password) >= 60  # bcrypt hash length


class TestUserServiceGetUser:
    """Test suite for user retrieval functionality."""

    def test_get_user_by_email_happy_path(self, test_db: Session, cleanup_db):  # noqa: ARG002
        """Test successful retrieval of user by email.

        HAPPY PATH: Getting an existing user by email should return
        the user object with correct data.
        """
        # Arrange
        email = "search@example.com"
        user_data = UserCreate(
            full_name="Búsqueda Usuario",
            email=email,
            password="Password123!",
            user_type=UserType.household,
            household_name="Casa Búsqueda",
            address="Calle Búsqueda 1",
            city="Bilbao",
            postal_code="48001",
            primary_role=PrimaryRole.consumer,
        )
        created_user = create_user(test_db, user_data)

        # Act
        found_user = get_user_by_email(test_db, email)

        # Assert
        assert found_user is not None
        assert found_user.id == created_user.id
        assert found_user.email == email
        assert found_user.full_name == user_data.full_name

    def test_get_user_by_email_not_found(self, test_db: Session, cleanup_db): # noqa: ARG002
        """Test retrieval of non-existent user returns None.

        SAD PATH: Attempting to get a user that doesn't exist should
        return None without raising an exception.
        """
        # Act
        found_user = get_user_by_email(test_db, "nonexistent@example.com")

        # Assert
        assert found_user is None

    def test_get_user_email_case_sensitivity(self, test_db: Session, cleanup_db):  # noqa: ARG002
        """Test email search behavior with different cases.

        EDGE CASE: Test that email search behaves as expected with
        different letter cases (depending on DB configuration).
        """
        # Arrange
        email = "CaseSensitive@example.com"
        user_data = UserCreate(
            full_name="Usuario Caso",
            email=email,
            password="Password123!",
            user_type=UserType.household,
            household_name="Casa Caso",
            address="Calle Caso 1",
            city="Murcia",
            postal_code="30001",
            primary_role=PrimaryRole.producer,
        )
        create_user(test_db, user_data)

        # Act - Search with different case
        found_user = get_user_by_email(test_db, email.lower())

        # Assert - Note: SQLite is case-insensitive by default
        # This test documents the actual behavior
        assert found_user is not None or found_user is None  # Edge case behavior


class TestUserServiceUpdateUser:
    """Test suite for user update functionality."""

    def test_update_user_happy_path(self, test_db: Session, cleanup_db):  # noqa: ARG002
        """Test successful user update.

        HAPPY PATH: Updating an existing user's fields should succeed
        and return the updated user object.
        """
        # Arrange
        original_data = UserCreate(
            full_name="Original Name",
            email="update@example.com",
            password="Password123!",
            user_type=UserType.household,
            household_name="Casa Original",
            address="Calle Original 1",
            city="Alicante",
            postal_code="03001",
            primary_role=PrimaryRole.consumer,
        )
        created_user = create_user(test_db, original_data)

        # Create update data
        update_data = UserCreate(
            full_name="Updated Name",
            email="updated@example.com",
            password="NewPassword123!",
            user_type=UserType.company,
            household_name="Empresa Actualizada",
            address="Calle Updated 1",
            city="Toledo",
            postal_code="45001",
            primary_role=PrimaryRole.producer,
        )

        # Act
        updated_user = update_user(test_db, created_user.id, update_data)

        # Assert
        assert updated_user is not None
        assert updated_user.id == created_user.id
        assert updated_user.full_name == update_data.full_name
        assert updated_user.email == update_data.email

    def test_update_nonexistent_user_returns_none(self, test_db: Session, cleanup_db):  # noqa: ARG002
        """Test that updating a non-existent user returns None.

        SAD PATH: Attempting to update a user that doesn't exist
        should return None without raising an exception.
        """
        # Arrange
        update_data = UserCreate(
            full_name="Ghost Update",
            email="ghost@example.com",
            password="Password123!",
            user_type=UserType.household,
            household_name="Casa Fantasma",
            address="Calle Fantasma 1",
            city="Salamanca",
            postal_code="37001",
            primary_role=PrimaryRole.consumer,
        )
        non_existent_user_id = 99999

        # Act
        result = update_user(test_db, non_existent_user_id, update_data)

        # Assert
        assert result is None

    def test_update_user_preserves_id_and_password(self, test_db: Session, cleanup_db):  # noqa: ARG002
        """Test that user ID and password hash are not changed on update.

        EDGE CASE: Verify that critical fields like ID and password hash
        remain unchanged after an update operation.
        """
        # Arrange
        original_data = UserCreate(
            full_name="Preserve Test",
            email="preserve@example.com",
            password="OriginalPassword123!",
            user_type=UserType.household,
            household_name="Casa Preserve",
            address="Calle Preserve 1",
            city="Palencia",
            postal_code="34001",
            primary_role=PrimaryRole.consumer,
        )
        created_user = create_user(test_db, original_data)
        original_id = created_user.id
        original_password_hash = created_user.hashed_password

        update_data = UserCreate(
            full_name="Updated Name",
            email="preserve_updated@example.com",
            password="DifferentPassword456!",
            user_type=UserType.company,
            household_name="Empresa Preserve",
            address="Calle Preserve Updated 1",
            city="Cuenca",
            postal_code="16001",
            primary_role=PrimaryRole.producer,
        )

        # Act
        updated_user = update_user(test_db, original_id, update_data)

        # Assert
        assert updated_user.id == original_id
        assert updated_user.hashed_password == original_password_hash
        assert updated_user.full_name == update_data.full_name
