"""
LandSetu Backend — Health Check Router
"""

from fastapi import APIRouter
from models import HealthCheckResponse
from config import APP_VERSION, DISCLAIMER

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """Health check endpoint — verifies the API is running."""
    return HealthCheckResponse(
        status="ok",
        version=APP_VERSION,
        disclaimer=DISCLAIMER,
    )
