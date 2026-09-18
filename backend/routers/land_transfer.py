"""
LandSetu Backend — Land Sale / Ownership Transfer Router

Provides REST API endpoints for submitting, querying, and processing official land ownership transfer applications.
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Optional
from config import DISCLAIMER
from models import (
    LandTransferCreateRequest,
    LandTransferRecord,
    LandTransferReviewRequest,
    LandTransferListResponse,
    ErrorResponse,
)
from core.auth import get_current_user, get_optional_user
from services.land_transfer_service import (
    create_land_transfer,
    get_land_transfer_by_id,
    get_land_transfers,
    review_land_transfer,
)

router = APIRouter(prefix="/land-transfer", tags=["Land Sale / Ownership Transfer Workflow"])


@router.get(
    "",
    response_model=LandTransferListResponse,
    summary="List and filter land transfer applications",
)
async def list_transfers(
    status: Optional[str] = Query(None, description="Filter by status (SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, COMPLETED)"),
    ulpin: Optional[str] = Query(None, description="Filter by target parcel ULPIN"),
    current_user: Optional[dict] = Depends(get_optional_user),
):
    """
    List all land transfer applications with optional filtering.
    Citizens view their own requests; officers and administrators view all records.
    """
    res = get_land_transfers(
        ulpin=ulpin,
        status_filter=status,
        user=current_user,
    )
    return LandTransferListResponse(
        count=res["count"],
        summary=res["summary"],
        transfers=[LandTransferRecord(**t) for t in res["transfers"]],
        disclaimer=DISCLAIMER,
    )


@router.get(
    "/{identifier}",
    response_model=LandTransferRecord,
    responses={
        404: {"model": ErrorResponse, "description": "Land transfer record not found"},
    },
    summary="Get single land transfer record with 4-point eligibility matrix",
)
async def get_single_transfer(identifier: str):
    """Retrieve complete metadata, seller/buyer details, eligibility checklist, and parcel context."""
    transfer = get_land_transfer_by_id(identifier)
    if not transfer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Land transfer record '{identifier}' was not found.",
        )
    return LandTransferRecord(**transfer)


@router.post(
    "",
    response_model=LandTransferRecord,
    status_code=status.HTTP_201_CREATED,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid transfer parameters"},
        401: {"model": ErrorResponse, "description": "Authentication required"},
        404: {"model": ErrorResponse, "description": "Parcel not found"},
    },
    summary="Submit a new land sale / ownership transfer application",
)
async def submit_transfer(
    payload: LandTransferCreateRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Initiate a formal land sale or ownership transfer application.
    Validates target parcel ownership and creates a linked service request.
    """
    return create_land_transfer(
        data=payload.model_dump(),
        user=current_user,
    )


@router.post(
    "/{identifier}/approve",
    response_model=LandTransferRecord,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid review parameters"},
        401: {"model": ErrorResponse, "description": "Authentication required"},
        403: {"model": ErrorResponse, "description": "Unauthorized role for land transfer approval"},
        404: {"model": ErrorResponse, "description": "Record not found"},
        409: {"model": ErrorResponse, "description": "Invalid state transition"},
    },
    summary="Approve land ownership transfer & mutate parcel ledger (Registration Officers / Admin only)",
)
async def approve_transfer(
    identifier: str,
    payload: LandTransferReviewRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Approve land ownership transfer.
    Mutates master parcel owner record in the cadastral ledger to buyer name and logs audit events.
    Restricted to Registration Officers, Revenue Officers, and Administrators.
    """
    return review_land_transfer(
        identifier=identifier,
        decision="APPROVED",
        remarks=payload.remarks,
        user=current_user,
    )


@router.post(
    "/{identifier}/reject",
    response_model=LandTransferRecord,
    responses={
        400: {"model": ErrorResponse, "description": "Remarks mandatory on rejection"},
        401: {"model": ErrorResponse, "description": "Authentication required"},
        403: {"model": ErrorResponse, "description": "Unauthorized role for land transfer rejection"},
        404: {"model": ErrorResponse, "description": "Record not found"},
        409: {"model": ErrorResponse, "description": "Invalid state transition"},
    },
    summary="Reject land transfer with mandatory remarks (Officers / Admin only)",
)
async def reject_transfer(
    identifier: str,
    payload: LandTransferReviewRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Reject land ownership transfer with mandatory justification notes.
    Restricted to Registration Officers, Revenue Officers, and Administrators.
    """
    return review_land_transfer(
        identifier=identifier,
        decision="REJECTED",
        remarks=payload.remarks,
        user=current_user,
    )
