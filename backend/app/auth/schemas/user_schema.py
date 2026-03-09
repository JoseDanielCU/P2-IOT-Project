from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, EmailStr, Field


class UserType(StrEnum):
    household = "household"
    company = "company"


class PrimaryRole(StrEnum):
    producer = "producer"
    consumer = "consumer"
    prosumer = "prosumer"


class EnergySourceType(StrEnum):
    solar = "solar"
    wind = "wind"
    battery = "battery"
    other = "other"


class UserCreate(BaseModel):
    # Información básica
    full_name: str = Field(..., min_length=3, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    phone_number: str | None = Field(None, max_length=20)

    # Información de hogar/empresa
    user_type: UserType
    household_name: str = Field(..., min_length=2, max_length=100)
    address: str = Field(..., min_length=5, max_length=200)
    city: str = Field(..., min_length=2, max_length=50)
    postal_code: str = Field(..., min_length=3, max_length=10)

    # Rol en la comunidad energética
    primary_role: PrimaryRole

    # Información energética (opcional)
    installed_capacity_kwh: float | None = Field(None, ge=0)
    energy_source_type: EnergySourceType | None = None
    average_monthly_consumption_kwh: float | None = Field(None, ge=0)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    phone_number: str | None
    user_type: UserType
    household_name: str
    address: str
    city: str
    postal_code: str
    primary_role: PrimaryRole
    installed_capacity_kwh: float | None
    energy_source_type: EnergySourceType | None
    average_monthly_consumption_kwh: float | None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str



class UserUpdate(BaseModel):
    full_name: str
    email: EmailStr
    user_type: UserType
    household_name: str
    address: str
    city: str
    phone_number: str | None


