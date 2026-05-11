"""
Tests for the energy service module.

Includes tests for energy data creation, update operations, and metrics retrieval
with happy path, sad path, and edge case scenarios.
"""

from datetime import date, datetime, timedelta

import pytest
from sqlalchemy.orm import Session

from app.auth.models import EnergySourceType, PrimaryRole, User, UserType
from app.auth.schemas import UserCreate
from app.auth.services.user_service import create_user
from app.energy.models import EnergyData
from app.energy.schemas import EnergyDataCreate
from app.energy.services.energy_service import (
    create_energy_data,
    get_chart_data,
    get_daily_metrics,
    upsert_energy_data,
)


@pytest.fixture
def test_user(test_db: Session):
    """Create a test user for energy data tests."""
    user_data = UserCreate(
        full_name="Energy Test User",
        email="energy@example.com",
        password="Password123!",
        user_type=UserType.household,
        household_name="Casa Energía",
        address="Calle Energía 1",
        city="Madrid",
        postal_code="28001",
        primary_role=PrimaryRole.prosumer,
        installed_capacity_kwh=10.0,
        energy_source_type=EnergySourceType.solar,
        average_monthly_consumption_kwh=150.0,
    )
    return create_user(test_db, user_data)


class TestEnergyServiceCreateEnergyData:
    """Test suite for energy data creation functionality."""

    def test_create_energy_data_happy_path(
        self, test_db: Session, test_user: User, cleanup_db  # noqa: ARG002
    ):
        """Test successful creation of energy data.

        HAPPY PATH: Creating valid energy data with positive values
        should succeed and return an EnergyData object.
        """
        # Arrange
        timestamp = datetime.now()
        energy_data = EnergyDataCreate(
            timestamp=timestamp,
            energy_produced_kwh=25.5,
            energy_consumed_kwh=18.3,
        )

        # Act
        created_data = create_energy_data(test_db, test_user.id, energy_data)

        # Assert
        assert created_data.id is not None
        assert created_data.user_id == test_user.id
        assert created_data.timestamp == timestamp
        assert created_data.energy_produced_kwh == 25.5
        assert created_data.energy_consumed_kwh == 18.3

    def test_create_energy_data_with_zero_values(
        self, test_db: Session, test_user: User, cleanup_db  # noqa: ARG002
    ):
        """Test creation of energy data with zero values.

        EDGE CASE: Creating energy data where production or consumption is zero
        should succeed (valid scenario for cloudy days or days without production).
        """
        # Arrange
        timestamp = datetime.now()
        energy_data = EnergyDataCreate(
            timestamp=timestamp,
            energy_produced_kwh=0.0,
            energy_consumed_kwh=50.0,
        )

        # Act
        created_data = create_energy_data(test_db, test_user.id, energy_data)

        # Assert
        assert created_data.id is not None
        assert created_data.energy_produced_kwh == 0.0
        assert created_data.energy_consumed_kwh == 50.0

    def test_create_energy_data_multiple_entries_same_user(
        self, test_db: Session, test_user: User, cleanup_db  # noqa: ARG002
    ):
        """Test creating multiple energy data entries for the same user.

        EDGE CASE: Multiple entries for the same user on different timestamps
        should all be created successfully.
        """
        # Arrange
        base_time = datetime.now()
        entries = [
            EnergyDataCreate(
                timestamp=base_time,
                energy_produced_kwh=10.0,
                energy_consumed_kwh=5.0,
            ),
            EnergyDataCreate(
                timestamp=base_time + timedelta(hours=1),
                energy_produced_kwh=15.0,
                energy_consumed_kwh=8.0,
            ),
            EnergyDataCreate(
                timestamp=base_time + timedelta(hours=2),
                energy_produced_kwh=12.0,
                energy_consumed_kwh=7.0,
            ),
        ]

        # Act
        created_entries = [
            create_energy_data(test_db, test_user.id, entry) for entry in entries
        ]

        # Assert
        assert len(created_entries) == 3
        assert all(entry.id is not None for entry in created_entries)
        assert all(entry.user_id == test_user.id for entry in created_entries)


class TestEnergyServiceUpsertEnergyData:
    """Test suite for energy data upsert (insert/update) functionality."""

    def test_upsert_insert_happy_path(
        self, test_db: Session, test_user: User, cleanup_db  # noqa: ARG002
    ):
        """Test successful insertion of new energy records via upsert.

        HAPPY PATH: Upserting new records that don't exist should insert them
        and return the count of processed records.
        """
        # Arrange
        target_date = date.today()
        records = [
            {
                "date": target_date,
                "produced": 25.5,
                "consumed": 18.3,
            },
            {
                "date": target_date - timedelta(days=1),
                "produced": 22.0,
                "consumed": 20.0,
            },
        ]

        # Act
        count = upsert_energy_data(test_db, test_user.id, records)

        # Assert
        assert count == 2
        # Verify records were created
        created_records = (
            test_db.query(EnergyData).filter(EnergyData.user_id == test_user.id).all()
        )
        assert len(created_records) == 2

    def test_upsert_update_existing_records(
        self, test_db: Session, test_user: User, cleanup_db  # noqa: ARG002
    ):
        """Test updating existing energy records via upsert.

        HAPPY PATH: Upserting records with dates that already exist should
        update the values, not create duplicates.
        """
        # Arrange
        target_date = date.today()

        # Create initial record
        initial_record = {
            "date": target_date,
            "produced": 10.0,
            "consumed": 5.0,
        }
        upsert_energy_data(test_db, test_user.id, [initial_record])

        # Verify initial record
        initial_data = (
            test_db.query(EnergyData).filter(EnergyData.user_id == test_user.id).first()
        )
        assert initial_data.energy_produced_kwh == 10.0

        # Update the record
        updated_record = {
            "date": target_date,
            "produced": 25.5,
            "consumed": 18.3,
        }

        # Act
        count = upsert_energy_data(test_db, test_user.id, [updated_record])

        # Assert
        assert count == 1
        # Verify record was updated, not duplicated
        all_records = (
            test_db.query(EnergyData).filter(EnergyData.user_id == test_user.id).all()
        )
        assert len(all_records) == 1
        assert all_records[0].energy_produced_kwh == 25.5
        assert all_records[0].energy_consumed_kwh == 18.3

    def test_upsert_empty_records_list(
        self, test_db: Session, test_user: User, cleanup_db  # noqa: ARG002
    ):
        """Test upserting an empty records list.

        EDGE CASE: Calling upsert with an empty list should succeed
        and return 0 without errors.
        """
        # Act
        count = upsert_energy_data(test_db, test_user.id, [])

        # Assert
        assert count == 0

    def test_upsert_with_zero_values(
        self, test_db: Session, test_user: User, cleanup_db  # noqa: ARG002
    ):
        """Test upserting records with zero energy values.

        EDGE CASE: Records with 0 production or consumption should be
        stored correctly (valid scenario).
        """
        # Arrange
        records = [
            {
                "date": date.today(),
                "produced": 0.0,
                "consumed": 50.0,
            },
        ]

        # Act
        count = upsert_energy_data(test_db, test_user.id, records)

        # Assert
        assert count == 1
        stored_record = (
            test_db.query(EnergyData).filter(EnergyData.user_id == test_user.id).first()
        )
        assert stored_record.energy_produced_kwh == 0.0


class TestEnergyServiceGetDailyMetrics:
    """Test suite for daily metrics retrieval functionality."""

    def test_get_daily_metrics_happy_path(
        self, test_db: Session, test_user: User, cleanup_db # noqa: ARG002
    ):
        """Test successful retrieval of daily metrics.

        HAPPY PATH: Getting metrics for a day with energy data should return
        correct totals and net balance.
        """
        # Arrange
        target_date = date.today()
        energy_data = EnergyDataCreate(
            timestamp=datetime(
                target_date.year, target_date.month, target_date.day, 12, 0
            ),
            energy_produced_kwh=30.0,
            energy_consumed_kwh=20.0,
        )
        create_energy_data(test_db, test_user.id, energy_data)

        # Act
        metrics = get_daily_metrics(test_db, test_user.id, target_date)

        # Assert
        assert metrics is not None
        assert metrics["total_produced_kwh"] == 30.0
        assert metrics["total_consumed_kwh"] == 20.0
        assert metrics["net_balance_kwh"] == 10.0  # 30 - 20

    def test_get_daily_metrics_no_data_returns_zeros(
        self, test_db: Session, test_user: User, cleanup_db # noqa: ARG002
    ):
        """Test that metrics for a day without data returns zeros.

        SAD PATH: Getting metrics for a date with no energy data should
        return zero values instead of raising an error.
        """
        # Act
        metrics = get_daily_metrics(test_db, test_user.id, date.today())

        # Assert
        assert metrics is not None
        assert metrics["total_produced_kwh"] == 0.0
        assert metrics["total_consumed_kwh"] == 0.0
        assert metrics["net_balance_kwh"] == 0.0

    def test_get_daily_metrics_negative_net_balance(
        self, test_db: Session, test_user: User, cleanup_db # noqa: ARG002
    ):
        """Test metrics when consumption exceeds production.

        EDGE CASE: When consumed energy is greater than produced energy,
        the net balance should be negative.
        """
        # Arrange
        target_date = date.today()
        energy_data = EnergyDataCreate(
            timestamp=datetime(
                target_date.year, target_date.month, target_date.day, 12, 0
            ),
            energy_produced_kwh=15.0,
            energy_consumed_kwh=40.0,
        )
        create_energy_data(test_db, test_user.id, energy_data)

        # Act
        metrics = get_daily_metrics(test_db, test_user.id, target_date)

        # Assert
        assert metrics["total_produced_kwh"] == 15.0
        assert metrics["total_consumed_kwh"] == 40.0
        assert metrics["net_balance_kwh"] == -25.0  # 15 - 40

    def test_get_daily_metrics_past_date(
        self, test_db: Session, test_user: User, cleanup_db # noqa: ARG002
    ):
        """Test retrieving metrics for a past date.

        EDGE CASE: Getting metrics for historical dates should work correctly
        if data exists for those dates.
        """
        # Arrange
        past_date = date.today() - timedelta(days=5)
        energy_data = EnergyDataCreate(
            timestamp=datetime(past_date.year, past_date.month, past_date.day, 12, 0),
            energy_produced_kwh=20.0,
            energy_consumed_kwh=15.0,
        )
        create_energy_data(test_db, test_user.id, energy_data)

        # Act
        metrics = get_daily_metrics(test_db, test_user.id, past_date)

        # Assert
        assert metrics["total_produced_kwh"] == 20.0
        assert metrics["total_consumed_kwh"] == 15.0
        assert metrics["net_balance_kwh"] == 5.0

    def test_get_daily_metrics_default_date_is_today(
        self, test_db: Session, test_user: User, cleanup_db # noqa: ARG002
    ):
        """Test that get_daily_metrics defaults to today's date.

        EDGE CASE: When no target_date is provided, the function should
        use today's date.
        """
        # Arrange
        energy_data = EnergyDataCreate(
            timestamp=datetime.now(),
            energy_produced_kwh=25.0,
            energy_consumed_kwh=10.0,
        )
        create_energy_data(test_db, test_user.id, energy_data)

        # Act
        metrics = get_daily_metrics(test_db, test_user.id)  # No date specified

        # Assert
        assert metrics["total_produced_kwh"] == 25.0
        assert metrics["total_consumed_kwh"] == 10.0


class TestEnergyServiceGetChartData:
    """Test suite for chart data retrieval functionality."""

    def test_get_chart_data_happy_path(
        self, test_db: Session, test_user: User, cleanup_db # noqa: ARG002
    ):
        """Test successful retrieval of chart data for multiple days.

        HAPPY PATH: Getting chart data for the last 7 days should return
        all available data points with default values for empty days.
        """
        # Arrange
        today = date.today()
        todaystr = today.strftime(
            "%Y-%m-%d"
        )  # formato string para comparar con el formato de timestamp en chart_data
        # Add data for 3 days
        for i in range(3):
            target_date = today - timedelta(days=i)
            energy_data = EnergyDataCreate(
                timestamp=datetime(
                    target_date.year, target_date.month, target_date.day, 12, 0
                ),
                energy_produced_kwh=20.0 + i,
                energy_consumed_kwh=15.0 + i,
            )
            create_energy_data(test_db, test_user.id, energy_data)

        # Act
        chart_data = get_chart_data(test_db, test_user.id, days=7)

        # Assert
        assert chart_data is not None
        assert len(chart_data) == 7  # Should have 7 entries (one per day)
        # Check that today's data is present
        today_entry = next(
            (entry for entry in chart_data if entry.get("timestamp") == todaystr),
            None,
        )
        print(type(chart_data[6].get("timestamp")))  # ultmio día "hoy"
        print(type(todaystr))
        print(today_entry)
        assert today_entry is not None

    def test_get_chart_data_empty_days_default_values(
        self, test_db: Session, test_user: User, cleanup_db # noqa: ARG002
    ):
        """Test that days without data get default zero values.

        EDGE CASE: Days within the range that don't have energy data should
        appear with zero production and consumption.
        """
        # Arrange

        # Only add data for one day
        energy_data = EnergyDataCreate(
            timestamp=datetime.now(),
            energy_produced_kwh=30.0,
            energy_consumed_kwh=25.0,
        )
        create_energy_data(test_db, test_user.id, energy_data)

        # Act
        chart_data = get_chart_data(test_db, test_user.id, days=7)

        # Assert
        assert len(chart_data) == 7
        # Count days with zero values
        zero_days = [
            d
            for d in chart_data
            if d.get("produced") == 0.0 and d.get("consumed") == 0.0
        ]
        assert len(zero_days) >= 5  # Most days should have zero values

    def test_get_chart_data_custom_range(
        self, test_db: Session, test_user: User, cleanup_db # noqa: ARG002
    ):
        """Test retrieving chart data for a custom number of days.

        EDGE CASE: Requesting chart data for a different number of days
        (e.g., 30 days) should return the correct range.
        """
        # Arrange
        # Add multiple data points
        for i in range(5):
            target_date = date.today() - timedelta(days=i)
            energy_data = EnergyDataCreate(
                timestamp=datetime(
                    target_date.year, target_date.month, target_date.day, 12, 0
                ),
                energy_produced_kwh=20.0 + i,
                energy_consumed_kwh=15.0 + i,
            )
            create_energy_data(test_db, test_user.id, energy_data)

        # Act
        chart_data = get_chart_data(test_db, test_user.id, days=14)

        # Assert
        assert len(chart_data) == 14  # Should have 14 entries


class TestEnergyServiceMultipleUsers:
    """Test suite for energy data isolation between users."""

    def test_energy_data_isolation_between_users(self, test_db: Session, cleanup_db):  # noqa: ARG002
        """Test that energy data is properly isolated between users.

        EDGE CASE: Each user should only see their own energy data,
        not data from other users.
        """
        # Arrange - Create two users
        user1_data = UserCreate(
            full_name="User One",
            email="user1@example.com",
            password="Password123!",
            user_type=UserType.household,
            household_name="Casa Uno",
            address="Calle Uno 1",
            city="Madrid",
            postal_code="28001",
            primary_role=PrimaryRole.producer,
        )
        user2_data = UserCreate(
            full_name="User Two",
            email="user2@example.com",
            password="Password123!",
            user_type=UserType.household,
            household_name="Casa Dos",
            address="Calle Dos 1",
            city="Barcelona",
            postal_code="08001",
            primary_role=PrimaryRole.consumer,
        )

        user1 = create_user(test_db, user1_data)
        user2 = create_user(test_db, user2_data)

        # Create energy data for both users
        energy_data_1 = EnergyDataCreate(
            timestamp=datetime.now(),
            energy_produced_kwh=30.0,
            energy_consumed_kwh=20.0,
        )
        energy_data_2 = EnergyDataCreate(
            timestamp=datetime.now(),
            energy_produced_kwh=10.0,
            energy_consumed_kwh=8.0,
        )

        create_energy_data(test_db, user1.id, energy_data_1)
        create_energy_data(test_db, user2.id, energy_data_2)

        # Act & Assert
        user1_metrics = get_daily_metrics(test_db, user1.id)
        user2_metrics = get_daily_metrics(test_db, user2.id)

        assert user1_metrics["total_produced_kwh"] == 30.0
        assert user2_metrics["total_produced_kwh"] == 10.0
        assert (
            user1_metrics["total_produced_kwh"] != user2_metrics["total_produced_kwh"]
        )
