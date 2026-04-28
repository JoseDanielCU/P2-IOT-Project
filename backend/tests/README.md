# Testing Guide for P2-IOT-Project Backend

## Overview

This document describes the automated test suite for the backend module using **pytest**.

The test suite follows best practices and includes three types of test scenarios:
1. **Happy Path** - Normal, correct usage (tests that should pass)
2. **Sad Path** - Error scenarios and invalid inputs (tests that verify error handling)
3. **Edge Cases** - Unusual but valid scenarios (boundary conditions)

## Project Structure

```
backend/
├── tests/
│   ├── conftest.py                 # Pytest configuration and fixtures
│   ├── pytest.ini                  # Pytest markers configuration
│   ├── auth/
│   │   └── test_user_service.py   # User service tests
│   └── energy/
│       └── test_energy_service.py # Energy service tests
└── app/
    ├── auth/
    │   └── services/
    │       └── user_service.py     # User management logic
    └── energy/
        └── services/
            └── energy_service.py   # Energy data management logic
```

## Test Coverage

### User Service Tests (`tests/auth/test_user_service.py`)

#### 1. **User Creation** - `TestUserServiceCreateUser`

- **Happy Path**: `test_create_user_happy_path`
  - Tests successful user creation with all fields
  - Verifies password is hashed correctly
  - Confirms all user data is persisted

- **Happy Path**: `test_create_user_with_minimal_data`
  - Tests creating user with only required fields
  - Optional fields should be `None` without errors

- **Sad Path**: `test_create_user_duplicate_email_raises_error`
  - Verifies that duplicate emails raise `IntegrityError`
  - Tests uniqueness constraint enforcement

- **Edge Case**: `test_create_user_password_hashing`
  - Confirms password is hashed with bcrypt
  - Validates that plain password is never stored

#### 2. **User Retrieval** - `TestUserServiceGetUser`

- **Happy Path**: `test_get_user_by_email_happy_path`
  - Tests successful user retrieval by email
  - Verifies returned user data accuracy

- **Sad Path**: `test_get_user_by_email_not_found`
  - Returns `None` for non-existent users
  - No exceptions should be raised

- **Edge Case**: `test_get_user_email_case_sensitivity`
  - Documents email search behavior with different cases
  - SQLite default: case-insensitive

#### 3. **User Update** - `TestUserServiceUpdateUser`

- **Happy Path**: `test_update_user_happy_path`
  - Tests successful user data update
  - Verifies updated fields are persisted

- **Sad Path**: `test_update_nonexistent_user_returns_none`
  - Returns `None` for non-existent users
  - No exceptions should be raised

- **Edge Case**: `test_update_user_preserves_id_and_password`
  - Confirms ID remains unchanged after update
  - Password hash should not change during update

### Energy Service Tests (`tests/energy/test_energy_service.py`)

#### 1. **Energy Data Creation** - `TestEnergyServiceCreateEnergyData`

- **Happy Path**: `test_create_energy_data_happy_path`
  - Tests creation with valid positive values
  - Verifies all fields are correctly stored

- **Edge Case**: `test_create_energy_data_with_zero_values`
  - Tests zero production or consumption (valid scenario)
  - Cloudy days or non-production periods

- **Edge Case**: `test_create_energy_data_multiple_entries_same_user`
  - Multiple entries for same user on different timestamps
  - All entries should be created independently

#### 2. **Energy Data Upsert** - `TestEnergyServiceUpsertEnergyData`

- **Happy Path**: `test_upsert_insert_happy_path`
  - Tests inserting new energy records
  - Returns correct count of processed records

- **Happy Path**: `test_upsert_update_existing_records`
  - Tests updating existing records by date
  - Should not create duplicates
  - Values should be overwritten

- **Edge Case**: `test_upsert_empty_records_list`
  - Empty list should succeed and return 0
  - No errors should be raised

- **Edge Case**: `test_upsert_with_zero_values`
  - Zero production/consumption should be stored
  - Valid scenario for low-production days

#### 3. **Daily Metrics** - `TestEnergyServiceGetDailyMetrics`

- **Happy Path**: `test_get_daily_metrics_happy_path`
  - Tests metric calculation for a day with data
  - Verifies production, consumption, and net balance

- **Sad Path**: `test_get_daily_metrics_no_data_returns_zeros`
  - Returns zero metrics for dates without data
  - Should not raise exceptions

- **Edge Case**: `test_get_daily_metrics_negative_net_balance`
  - When consumption > production, balance is negative
  - Valid scenario for consumers

- **Edge Case**: `test_get_daily_metrics_past_date`
  - Retrieves metrics for historical dates
  - Works correctly with past data

- **Edge Case**: `test_get_daily_metrics_default_date_is_today`
  - Default parameter uses today's date
  - Confirms default behavior

#### 4. **Chart Data** - `TestEnergyServiceGetChartData`

- **Happy Path**: `test_get_chart_data_happy_path`
  - Retrieves chart data for 7-day range
  - Returns all days with available data

- **Edge Case**: `test_get_chart_data_empty_days_default_values`
  - Days without data get zero values
  - Range includes all 7 days even if empty

- **Edge Case**: `test_get_chart_data_custom_range`
  - Custom day range (e.g., 14 or 30 days)
  - Works correctly with different ranges

#### 5. **Multi-User Isolation** - `TestEnergyServiceMultipleUsers`

- **Edge Case**: `test_energy_data_isolation_between_users`
  - Each user sees only their own energy data
  - No data leakage between users

## Running Tests

### Prerequisites

Ensure pytest and required packages are installed:

```bash
# From the backend directory
pip install -r requirements.txt
pip install pytest pytest-cov pytest-xdist
```

### Run All Tests

```bash
# From the backend directory
pytest tests/ -v
```

### Run Specific Test File

```bash
# User service tests
pytest tests/auth/test_user_service.py -v

# Energy service tests
pytest tests/energy/test_energy_service.py -v
```



### Run with Coverage Report

```bash
# Generate coverage report
pytest tests/ --cov=app --cov-report=html --cov-report=term-missing

# Coverage report will be in htmlcov/index.html
```

### Run Specific Test Class or Method

```bash
# Run specific test class
pytest tests/auth/test_user_service.py::TestUserServiceCreateUser -v

# Run specific test method
pytest tests/auth/test_user_service.py::TestUserServiceCreateUser::test_create_user_happy_path -v
```

## Common Test Patterns

### Happy Path Example

```python
def test_create_user_happy_path(self, test_db: Session, cleanup_db):
    """Test successful user creation with all required fields."""
    # Arrange
    user_data = UserCreate(...)
    
    # Act
    created_user = create_user(test_db, user_data)
    
    # Assert
    assert created_user.id is not None
    assert created_user.email == user_data.email
```

### Sad Path Example

```python
def test_create_user_duplicate_email_raises_error(self, test_db: Session, cleanup_db):
    """Test that duplicate emails raise an error."""
    from sqlalchemy.exc import IntegrityError
    
    # Arrange
    create_user(test_db, first_user_data)
    
    # Act & Assert
    with pytest.raises(IntegrityError):
        create_user(test_db, duplicate_user_data)
```

### Edge Case Example

```python
def test_create_energy_data_with_zero_values(self, test_db: Session, test_user: User, cleanup_db):
    """Test creation with zero values."""
    # Arrange
    energy_data = EnergyDataCreate(
        energy_produced_kwh=0.0,
        energy_consumed_kwh=50.0,
    )
    
    # Act
    created_data = create_energy_data(test_db, test_user.id, energy_data)
    
    # Assert
    assert created_data.energy_produced_kwh == 0.0
```

## Troubleshooting

### Tests Fail with "No module named 'app'"

Ensure the backend directory is in your Python path:
```bash
cd backend
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
pytest tests/ -v
```

### Database Locked Error

Close any other database connections and try again. The in-memory SQLite should automatically cleanup.

### Import Errors

Ensure all required packages are installed:
```bash
pip install -r requirements.txt
```

## Future Enhancements

- Add API endpoint tests using `TestClient`
- Add database transaction tests
- Add performance/load tests
- Add mutation testing
- Add property-based tests with hypothesis

## References

- [pytest Documentation](https://docs.pytest.org/)
- [SQLAlchemy Testing](https://docs.sqlalchemy.org/en/20/orm/session_basics.html)
- [Pydantic Models](https://docs.pydantic.dev/)
