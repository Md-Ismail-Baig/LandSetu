"""
LandSetu Backend — Verification Workflow & Audit Router

Endpoints for initiating, reviewing, approving, and rejecting satellite verification
cases, plus querying parcel audit event trails.
"""

from fastapi import APIRouter, HTTPException, status, Depends
from typing import Optional
from config import DISCLAIMER
from models import (
    VerificationRecord,
    VerificationCreateRequest,
    VerificationReviewRequest,
    AuditListResponse,
    ErrorResponse,
)
from core.auth import get_current_user
from core.permissions import Role, require_roles
from services.workflow_service import (
    create_verification,
    get_verification,
    approve_verification,
    reject_verification,
)
from services.audit_service import get_parcel_audit_events

router = APIRouter(prefix="/parcels", tags=["Verification Workflow & Audit"])


@router.get(
    "/{ulpin}/verification",
    response_model=Optional[VerificationRecord],
    summary="Get current verification workflow case for a parcel",
)
async def get_parcel_verification(ulpin: str):
    """Retrieve the current or latest verification record for the parcel."""
    record = get_verification(ulpin.upper())
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No verification record exists for parcel '{ulpin}'."
        )
    return record


@router.post(
    "/{ulpin}/verification",
    response_model=VerificationRecord,
    responses={
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Insufficient permissions"},
        404: {"model": ErrorResponse, "description": "Parcel not found"},
        409: {"model": ErrorResponse, "description": "Verification already pending"},
    },
    summary="Initiate verification workflow case for a parcel (Revenue Officer only)",
)
async def initiate_verification(
    ulpin: str,
    payload: VerificationCreateRequest,
    current_user: dict = Depends(require_roles([Role.REVENUE_OFFICER])),
):
    """Initiate a verification case for satellite-detected changes. Enforces Revenue Officer authorization."""
    return create_verification(
        ulpin=ulpin.upper(),
        user=current_user,
        remarks=payload.remarks,
    )


@router.post(
    "/{ulpin}/verification/approve",
    response_model=VerificationRecord,
    responses={
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Insufficient permissions"},
        404: {"model": ErrorResponse, "description": "Verification not found"},
        409: {"model": ErrorResponse, "description": "Invalid state transition"},
    },
    summary="Approve a pending verification case (Revenue Officer only)",
)
async def approve_case(
    ulpin: str,
    payload: VerificationReviewRequest,
    current_user: dict = Depends(require_roles([Role.REVENUE_OFFICER])),
):
    """Approve a pending verification case with official remarks."""
    return approve_verification(
        ulpin=ulpin.upper(),
        reviewer=current_user,
        remarks=payload.remarks,
    )


@router.post(
    "/{ulpin}/verification/reject",
    response_model=VerificationRecord,
    responses={
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Insufficient permissions"},
        404: {"model": ErrorResponse, "description": "Verification not found"},
        409: {"model": ErrorResponse, "description": "Invalid state transition"},
    },
    summary="Reject a pending verification case (Revenue Officer only)",
)
async def reject_case(
    ulpin: str,
    payload: VerificationReviewRequest,
    current_user: dict = Depends(require_roles([Role.REVENUE_OFFICER])),
):
    """Reject a pending verification case with official remarks."""
    return reject_verification(
        ulpin=ulpin.upper(),
        reviewer=current_user,
        remarks=payload.remarks,
    )


@router.get(
    "/{ulpin}/audit",
    response_model=AuditListResponse,
    summary="Get chronological audit trail events for a parcel",
)
async def get_parcel_audit(ulpin: str):
    """Retrieve all chronological audit events recorded for the specified parcel."""
    events = get_parcel_audit_events(ulpin.upper())
    return AuditListResponse(
        ulpin=ulpin.upper(),
        count=len(events),
        events=events,
        disclaimer=DISCLAIMER,
    )
