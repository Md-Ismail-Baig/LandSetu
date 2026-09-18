"""
LandSetu Backend — Parcel Subdivision Router

REST API endpoints for submitting, querying, validating, and processing
parcel subdivision applications.
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Optional
from config import DISCLAIMER
from models import (
    SubdivisionCreateRequest,
    SubdivisionRecord,
    SubdivisionReviewRequest,
    SubdivisionListResponse,
    SubdivisionValidationResult,
    ChildParcelRecord,
    ErrorResponse,
)
from core.auth import get_current_user, get_optional_user
from services.subdivision_service import (
    create_subdivision_request,
    get_subdivision_by_id,
    get_subdivisions,
    approve_subdivision,
    reject_subdivision,
    validate_subdivision_request,
    get_child_parcels,
)
from services.parcel_service import get_parcel_by_ulpin

router = APIRouter(prefix="/parcel-subdivision", tags=["Parcel Subdivision Workflow"])


@router.get(
    "",
    response_model=SubdivisionListResponse,
    summary="List and filter parcel subdivision requests",
)
async def list_subdivisions(
    status: Optional[str] = Query(None, description="Filter by status (SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED)"),
    ulpin: Optional[str] = Query(None, description="Filter by parent parcel ULPIN"),
    current_user: Optional[dict] = Depends(get_optional_user),
):
    """
    List all parcel subdivision requests with optional filtering.
    Citizens view their own requests; officers see all records.
    """
    res = get_subdivisions(
        ulpin=ulpin,
        status_filter=status,
        user=current_user,
    )
    return SubdivisionListResponse(
        count=res["count"],
        summary=res["summary"],
        subdivisions=[SubdivisionRecord(**s) for s in res["subdivisions"]],
        disclaimer=DISCLAIMER,
    )


@router.get(
    "/{identifier}",
    response_model=SubdivisionRecord,
    responses={
        404: {"model": ErrorResponse, "description": "Subdivision record not found"},
    },
    summary="Get single subdivision record with validation matrix and child parcels",
)
async def get_single_subdivision(identifier: str):
    """Retrieve full subdivision record with 10-point validation and child parcels."""
    record = get_subdivision_by_id(identifier)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Subdivision record '{identifier}' was not found.",
        )
    return SubdivisionRecord(**record)


@router.get(
    "/{identifier}/validation",
    response_model=SubdivisionValidationResult,
    responses={
        404: {"model": ErrorResponse, "description": "Subdivision record not found"},
    },
    summary="Run/return 10-point validation matrix for subdivision request",
)
async def get_validation(identifier: str):
    """Execute live 10-point validation check for subdivision request."""
    record = get_subdivision_by_id(identifier)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Subdivision record '{identifier}' was not found.",
        )

    validation_data = {
        "applicant": record["applicant"],
        "num_children": record["num_children"],
        "proposed_children": record.get("proposed_children", []),
    }
    result = validate_subdivision_request(validation_data, record["parent_ulpin"])
    return SubdivisionValidationResult(**result)


@router.post(
    "",
    response_model=SubdivisionRecord,
    status_code=status.HTTP_201_CREATED,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid subdivision parameters"},
        401: {"model": ErrorResponse, "description": "Authentication required"},
        404: {"model": ErrorResponse, "description": "Parent parcel not found"},
    },
    summary="Submit a new parcel subdivision request",
)
async def submit_subdivision(
    payload: SubdivisionCreateRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Initiate a formal parcel subdivision application.
    Validates parent parcel, creates linked service request, and runs initial validation.
    """
    return create_subdivision_request(
        data=payload.model_dump(),
        user=current_user,
    )


@router.post(
    "/{identifier}/approve",
    response_model=SubdivisionRecord,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid review parameters"},
        401: {"model": ErrorResponse, "description": "Authentication required"},
        403: {"model": ErrorResponse, "description": "Unauthorized role for subdivision approval"},
        404: {"model": ErrorResponse, "description": "Record not found"},
        409: {"model": ErrorResponse, "description": "Invalid state transition"},
    },
    summary="Approve subdivision — create child parcels and mark parent as SUBDIVIDED",
)
async def approve_subdivision_endpoint(
    identifier: str,
    payload: SubdivisionReviewRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Approve subdivision request:
    - Creates child parcel records.
    - Updates parent parcel status to SUBDIVIDED.
    - Logs audit events.
    Restricted to Revenue Officers, Municipal Officers, and Administrators.
    """
    return approve_subdivision(
        identifier=identifier,
        remarks=payload.remarks,
        user=current_user,
    )


@router.post(
    "/{identifier}/reject",
    response_model=SubdivisionRecord,
    responses={
        400: {"model": ErrorResponse, "description": "Remarks mandatory on rejection"},
        401: {"model": ErrorResponse, "description": "Authentication required"},
        403: {"model": ErrorResponse, "description": "Unauthorized role"},
        404: {"model": ErrorResponse, "description": "Record not found"},
        409: {"model": ErrorResponse, "description": "Invalid state transition"},
    },
    summary="Reject subdivision with mandatory remarks",
)
async def reject_subdivision_endpoint(
    identifier: str,
    payload: SubdivisionReviewRequest,
    current_user: dict = Depends(get_current_user),
):
    """Reject subdivision request with mandatory justification."""
    return reject_subdivision(
        identifier=identifier,
        remarks=payload.remarks,
        user=current_user,
    )


# ==========================================
# Child Parcels Lookup (mounted on parcels prefix via main.py)
# ==========================================

children_router = APIRouter(tags=["Parcel Subdivision Workflow"])


@children_router.get(
    "/parcels/{parent_ulpin}/children",
    summary="Get child parcels for a parent ULPIN",
)
async def get_children(parent_ulpin: str):
    """Retrieve all child parcels created from subdivision of a parent parcel."""
    parcel = get_parcel_by_ulpin(parent_ulpin)
    if not parcel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Parent parcel '{parent_ulpin}' not found.",
        )

    children = get_child_parcels(parent_ulpin)
    return {
        "parent_ulpin": parent_ulpin,
        "count": len(children),
        "children": children,
        "disclaimer": DISCLAIMER,
    }
