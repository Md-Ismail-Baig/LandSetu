"""
LandSetu Backend — Parcels Router

CRUD and Departmental endpoints for land parcel records and One Integrated Parcel View.
"""

from fastapi import APIRouter, HTTPException
from models import (
    ParcelListResponse,
    ParcelDetailResponse,
    ParcelSummary,
    ParcelDetail,
    OwnershipDetail,
    RegistrationDetail,
    TaxDetail,
    PlanningDetail,
    UtilitiesDetail,
    RestrictionsDetail,
    TransactionRecord,
    IntegratedParcelViewResponse,
    ErrorResponse,
)
from services.parcel_service import (
    get_all_parcels,
    get_parcel_by_ulpin,
    get_parcel_geojson,
)
from services.department_service import (
    get_ownership_detail,
    get_registration_detail,
    get_tax_detail,
    get_planning_detail,
    get_utilities_detail,
    get_restrictions_detail,
    get_transactions_history,
)
from config import DISCLAIMER

router = APIRouter(prefix="/parcels", tags=["Parcels"])


@router.get(
    "",
    response_model=ParcelListResponse,
    summary="List all parcels",
)
async def list_parcels():
    """Return a summary list of all land parcels in the system."""
    parcels = get_all_parcels()
    return ParcelListResponse(
        count=len(parcels),
        parcels=[ParcelSummary(**p) for p in parcels],
        disclaimer=DISCLAIMER,
    )


@router.get(
    "/{ulpin}",
    response_model=ParcelDetailResponse,
    responses={404: {"model": ErrorResponse}},
    summary="Get parcel by ULPIN",
)
async def get_parcel(ulpin: str):
    """Return the full detail record for a parcel identified by its ULPIN."""
    parcel = get_parcel_by_ulpin(ulpin)
    if parcel is None:
        raise HTTPException(
            status_code=404,
            detail=f"Parcel with ULPIN '{ulpin}' not found.",
        )
    return ParcelDetailResponse(
        parcel=ParcelDetail(**parcel),
        disclaimer=DISCLAIMER,
    )


@router.get(
    "/{ulpin}/map",
    summary="Get parcel GeoJSON geometry",
    responses={404: {"model": ErrorResponse}},
)
async def get_parcel_map(ulpin: str):
    """Return the GeoJSON Feature geometry for a parcel."""
    parcel = get_parcel_by_ulpin(ulpin)
    if parcel is None:
        raise HTTPException(
            status_code=404,
            detail=f"Parcel with ULPIN '{ulpin}' not found.",
        )

    geojson = get_parcel_geojson(ulpin)
    if geojson is None:
        raise HTTPException(
            status_code=404,
            detail=f"GeoJSON geometry for ULPIN '{ulpin}' not found.",
        )

    return geojson


# ==========================================
# Departmental Endpoints (Phase 3)
# ==========================================

@router.get(
    "/{ulpin}/ownership",
    response_model=OwnershipDetail,
    responses={404: {"model": ErrorResponse}},
    summary="Get parcel ownership details",
)
async def get_parcel_ownership(ulpin: str):
    data = get_ownership_detail(ulpin)
    if not data:
        raise HTTPException(status_code=404, detail=f"Ownership records for ULPIN '{ulpin}' not found.")
    return OwnershipDetail(**data)


@router.get(
    "/{ulpin}/registration",
    response_model=RegistrationDetail,
    responses={404: {"model": ErrorResponse}},
    summary="Get parcel deed & registration details",
)
async def get_parcel_registration(ulpin: str):
    data = get_registration_detail(ulpin)
    if not data:
        raise HTTPException(status_code=404, detail=f"Registration records for ULPIN '{ulpin}' not found.")
    return RegistrationDetail(**data)


@router.get(
    "/{ulpin}/tax",
    response_model=TaxDetail,
    responses={404: {"model": ErrorResponse}},
    summary="Get parcel property tax details",
)
async def get_parcel_tax(ulpin: str):
    data = get_tax_detail(ulpin)
    if not data:
        raise HTTPException(status_code=404, detail=f"Tax records for ULPIN '{ulpin}' not found.")
    return TaxDetail(**data)


@router.get(
    "/{ulpin}/planning",
    response_model=PlanningDetail,
    responses={404: {"model": ErrorResponse}},
    summary="Get parcel zoning & planning details",
)
async def get_parcel_planning(ulpin: str):
    data = get_planning_detail(ulpin)
    if not data:
        raise HTTPException(status_code=404, detail=f"Planning records for ULPIN '{ulpin}' not found.")
    return PlanningDetail(**data)


@router.get(
    "/{ulpin}/utilities",
    response_model=UtilitiesDetail,
    responses={404: {"model": ErrorResponse}},
    summary="Get parcel utility connections & road access",
)
async def get_parcel_utilities(ulpin: str):
    data = get_utilities_detail(ulpin)
    if not data:
        raise HTTPException(status_code=404, detail=f"Utilities records for ULPIN '{ulpin}' not found.")
    return UtilitiesDetail(**data)


@router.get(
    "/{ulpin}/restrictions",
    response_model=RestrictionsDetail,
    responses={404: {"model": ErrorResponse}},
    summary="Get parcel encumbrances & restriction alerts",
)
async def get_parcel_restrictions(ulpin: str):
    data = get_restrictions_detail(ulpin)
    if not data:
        raise HTTPException(status_code=404, detail=f"Restriction records for ULPIN '{ulpin}' not found.")
    return RestrictionsDetail(**data)


@router.get(
    "/{ulpin}/transactions",
    response_model=list[TransactionRecord],
    responses={404: {"model": ErrorResponse}},
    summary="Get parcel mutation and transaction history",
)
async def get_parcel_transactions(ulpin: str):
    data = get_transactions_history(ulpin)
    if data is None:
        raise HTTPException(status_code=404, detail=f"Transaction history for ULPIN '{ulpin}' not found.")
    return [TransactionRecord(**t) for t in data]


@router.get(
    "/{ulpin}/integrated-view",
    response_model=IntegratedParcelViewResponse,
    responses={404: {"model": ErrorResponse}},
    summary="One Integrated Parcel View (Aggregated DPI Dataset)",
)
async def get_integrated_view(ulpin: str):
    """
    Returns aggregated 'One Integrated Parcel View' dataset across Revenue,
    Registration, Municipal Tax, Town Planning, Utilities, Encumbrances, and GIS boundary.
    """
    parcel = get_parcel_by_ulpin(ulpin)
    if not parcel:
        raise HTTPException(status_code=404, detail=f"Parcel with ULPIN '{ulpin}' not found.")

    ownership = get_ownership_detail(ulpin)
    registration = get_registration_detail(ulpin)
    tax = get_tax_detail(ulpin)
    planning = get_planning_detail(ulpin)
    utilities = get_utilities_detail(ulpin)
    restrictions = get_restrictions_detail(ulpin)
    transactions = get_transactions_history(ulpin) or []
    geo_map = get_parcel_geojson(ulpin)

    return IntegratedParcelViewResponse(
        parcel=ParcelDetail(**parcel),
        ownership=OwnershipDetail(**ownership),
        registration=RegistrationDetail(**registration),
        tax=TaxDetail(**tax),
        planning=PlanningDetail(**planning),
        utilities=UtilitiesDetail(**utilities),
        restrictions=RestrictionsDetail(**restrictions),
        transactions=[TransactionRecord(**t) for t in transactions],
        map=geo_map,
        disclaimer=DISCLAIMER,
    )
