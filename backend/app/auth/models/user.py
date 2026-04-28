import enum

from sqlalchemy import Boolean, Column, DateTime, Enum, Float, Integer, String
from sqlalchemy.sql import func

from app.core.database import Base


class UserType(enum.Enum):
    household = "household"
    company = "company"


class PrimaryRole(enum.Enum):
    producer = "producer"
    consumer = "consumer"
    prosumer = "prosumer"


class EnergySourceType(enum.Enum):
    solar = "solar"
    wind = "wind"
    battery = "battery"
    other = "other"


class User(Base):
    __tablename__ = "users"

    # Campos básicos existentes
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    # Información personal adicional
    phone_number = Column(String, nullable=True)

    # Información de hogar/empresa
    user_type = Column(Enum(UserType, native_enum=False), nullable=False)
    household_name = Column(String, nullable=False)
    address = Column(String, nullable=False)
    city = Column(String, nullable=False)
    postal_code = Column(String, nullable=False)

    # Rol en la comunidad energética
    primary_role = Column(Enum(PrimaryRole, native_enum=False), nullable=False)

    # Información energética
    installed_capacity_kwh = Column(Float, nullable=True)
    energy_source_type = Column(
        Enum(EnergySourceType, native_enum=False), nullable=True
    )
    average_monthly_consumption_kwh = Column(Float, nullable=True)

    # Campos del sistema
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
