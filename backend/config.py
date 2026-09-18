"""
LandSetu Backend — Configuration

Loads settings from environment variables with sensible defaults.
"""

import os
from dotenv import load_dotenv

load_dotenv()

# Application
APP_NAME = os.getenv("APP_NAME", "LandSetu")
APP_VERSION = os.getenv("APP_VERSION", "0.1.0")
DEBUG = os.getenv("DEBUG", "true").lower() == "true"

# Database
DATABASE_PATH = os.getenv("DATABASE_PATH", "landsetu.db")

# CORS
cors_env = os.getenv("CORS_ORIGINS", "*")
if cors_env.strip() == "*":
    CORS_ORIGINS = ["*"]
else:
    CORS_ORIGINS = [
        origin.strip()
        for origin in cors_env.split(",")
    ]


# Server
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))

# AI Service Keys (Optional)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# Disclaimer — embedded in every relevant API response
DISCLAIMER = (
    "All records are fictional demo data created for the LandSetu "
    "digital public infrastructure platform. They must not be interpreted as actual government land records."
)
