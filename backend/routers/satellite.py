"""
LandSetu Backend — Satellite Router

Satellite change monitoring endpoints for land parcels.
"""

from fastapi import APIRouter, HTTPException, status
from models import SatelliteResponse, ErrorResponse
from services.satellite_service import get_satellite_record

router = APIRouter(prefix="/parcels", tags=["Satellite Monitoring"])


@router.get(
    "/{ulpin}/satellite",
    response_model=SatelliteResponse,
    responses={404: {"model": ErrorResponse}},
    summary="Get satellite change monitoring data for a parcel",
)
async def get_satellite(ulpin: str):
    """
    Returns satellite change monitoring analysis for the given ULPIN.

    NOTE: All satellite data is currently simulated. It is not legal proof
    of encroachment, unauthorized construction, ownership, or land-use
    violation. Any detected changes require officer verification.
    """
    record = get_satellite_record(ulpin)
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Satellite monitoring data for ULPIN '{ulpin}' is not available.",
        )
    return SatelliteResponse(**record)
