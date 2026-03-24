"""
Configuration settings for the application.
Centralized configuration management following PEP 8 standards.
"""

import os
from datetime import timedelta


# Database Configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://postgres:12345678@localhost:5432/energy_community",
)

# Security Configuration
SECRET_KEY = "supersecretkey"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))

# CORS Configuration
CORS_ORIGINS = ["*"]
CORS_CREDENTIALS = True
CORS_METHODS = ["*"]
CORS_HEADERS = ["*"]

# Constants
ACCESS_TOKEN_EXPIRATION = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
