"""
Configuration settings for the application.
Centralized configuration management following PEP 8 standards.
"""

import os
from datetime import timedelta


# Database Configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://postgres:password@localhost:5432/energy_community",
)

# Security Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# CORS Configuration
# allow_credentials=True is incompatible with wildcard origins per the CORS spec.
# Origins are loaded from the environment for production use.
_raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000")
CORS_ORIGINS = [o.strip() for o in _raw_origins.split(",")]
CORS_CREDENTIALS = True
CORS_METHODS = ["*"]
CORS_HEADERS = ["*"]

# Constants
ACCESS_TOKEN_EXPIRATION = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)


# OpenAI Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")