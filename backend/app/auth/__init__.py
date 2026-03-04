"""
Auth module - Authentication and user management
"""

from app.auth.models import EnergySourceType, PrimaryRole, User, UserType
from app.auth.routers import router
from app.auth.schemas import Token, UserCreate, UserResponse
from app.auth.services import create_user, get_user_by_email


__all__ = [
    # Models
    "User",
    "UserType",
    "PrimaryRole",
    "EnergySourceType",
    # Schemas
    "UserCreate",
    "UserResponse",
    "Token",
    # Services
    "get_user_by_email",
    "create_user",
    # Routers
    "router",
]
