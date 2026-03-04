"""
Configuration settings for the application.
Centralized configuration management following PEP 8 standards.
"""

import os
from datetime import timedelta

# Database Configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://postgres:postgres@localhost:5432/community_db",
)

# Security Configuration
SECRET_KEY = "supersecretkey"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# CORS Configuration
CORS_ORIGINS = ["*"]
CORS_CREDENTIALS = True
CORS_METHODS = ["*"]
CORS_HEADERS = ["*"]

# Constants
ACCESS_TOKEN_EXPIRATION = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
