"""
LandSetu Backend — Document Verification Router

Provides endpoints for submitting land documents, inspecting deterministic 5-point comparison
evaluations against cadastral records, and processing official administrative decisions.
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Optional
from config import DISCLAIMER
from models import (
    DocumentVerificationCreateRequest,
    DocumentVerificationRecord,
    DocumentVerificationReviewRequest,
    DocumentVerificationListResponse,
    VerificationEngineResult,
    ErrorResponse,
)
from core.auth import get_current_user, get_optional_user
from services.document_verification_service import (
    create_document_verification,
    get_document_verification_by_id,
    get_document_verifications,
    run_document_verification_checks,
    review_document_verification,
)

router = APIRouter(prefix="/document-verification", tags=["Document Verification Workflow"])


@router.get(
    "",
    response_model=DocumentVerificationListResponse,
    summary="List and filter document verification requests",
)
async def list_document_verifications(
    status: Optional[str] = Query(None, description="Filter by status (SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED)"),
    ulpin: Optional[str] = Query(None, description="Filter by target parcel ULPIN"),
    current_user: Optional[dict] = Depends(get_optional_user),
):
    """
    List all document verification requests with optional filtering.
    Citizens view their own requests and standard demo cases; officers and admins view all records.
    """
    res = get_document_verifications(
        ulpin=ulpin,
        status_filter=status,
        user=current_user,
    )
    return DocumentVerificationListResponse(
        count=res["count"],
        summary=res["summary"],
        documents=[DocumentVerificationRecord(**d) for d in res["documents"]],
        disclaimer=DISCLAIMER,
    )


@router.get(
    "/{identifier}",
    response_model=DocumentVerificationRecord,
    responses={
        404: {"model": ErrorResponse, "description": "Document verification record not found"},
    },
    summary="Get single document verification record with comparison checks",
)
async def get_single_document_verification(identifier: str):
    """Retrieve complete metadata, 5-point check results, and parcel context for a document verification."""
    doc = get_document_verification_by_id(identifier)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document verification record '{identifier}' was not found.",
        )
    return DocumentVerificationRecord(**doc)


@router.post(
    "",
    response_model=DocumentVerificationRecord,
    status_code=status.HTTP_201_CREATED,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid document parameters"},
        401: {"model": ErrorResponse, "description": "Authentication required"},
        404: {"model": ErrorResponse, "description": "Parcel not found"},
    },
    summary="Submit a new land document for automated verification",
)
async def submit_document_verification(
    payload: DocumentVerificationCreateRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Submit a land-related document (Sale Deed, Tax Receipt, Title Certificate) for automated comparison
    against master Cadastral Land & Registration records.
    """
    return create_document_verification(
        data=payload.model_dump(),
        user=current_user,
    )


@router.post(
    "/{identifier}/verify",
    response_model=VerificationEngineResult,
    responses={
        404: {"model": ErrorResponse, "description": "Record not found"},
    },
    summary="Re-run deterministic 5-point verification checks against live records",
)
async def rerun_verification_checks(identifier: str):
    """Execute live deterministic 5-point comparison checks between submitted document and parcel records."""
    doc = get_document_verification_by_id(identifier)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document verification record '{identifier}' was not found.",
        )

    return run_document_verification_checks(doc, doc["ulpin"])


@router.post(
    "/{identifier}/approve",
    response_model=DocumentVerificationRecord,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid review parameters"},
        401: {"model": ErrorResponse, "description": "Authentication required"},
        403: {"model": ErrorResponse, "description": "Unauthorized role for document approval"},
        404: {"model": ErrorResponse, "description": "Record not found"},
        409: {"model": ErrorResponse, "description": "Invalid state transition"},
    },
    summary="Approve document verification (Officers / Admin only)",
)
async def approve_verification(
    identifier: str,
    payload: DocumentVerificationReviewRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Approve document verification after officer physical or legal scrutiny.
    Restricted to Registration Officers, Revenue Officers, and Administrators.
    """
    return review_document_verification(
        identifier=identifier,
        decision="APPROVED",
        remarks=payload.remarks,
        user=current_user,
    )


@router.post(
    "/{identifier}/reject",
    response_model=DocumentVerificationRecord,
    responses={
        400: {"model": ErrorResponse, "description": "Remarks mandatory on rejection"},
        401: {"model": ErrorResponse, "description": "Authentication required"},
        403: {"model": ErrorResponse, "description": "Unauthorized role for document rejection"},
        404: {"model": ErrorResponse, "description": "Record not found"},
        409: {"model": ErrorResponse, "description": "Invalid state transition"},
    },
    summary="Reject document verification with mandatory remarks (Officers / Admin only)",
)
async def reject_verification(
    identifier: str,
    payload: DocumentVerificationReviewRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Reject document verification with mandatory justification notes.
    Restricted to Registration Officers, Revenue Officers, and Administrators.
    """
    return review_document_verification(
        identifier=identifier,
        decision="REJECTED",
        remarks=payload.remarks,
        user=current_user,
    )
