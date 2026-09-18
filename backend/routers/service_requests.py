"""
LandSetu Backend — Generic Service Request Framework Router

Endpoints for creating, listing, and inspecting service requests across all
departmental governance workflows.
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Optional
from config import DISCLAIMER
from models import (
    ServiceRequestRecord,
    ServiceRequestCreateRequest,
    ServiceRequestUpdateRequest,
    ServiceRequestListResponse,
    ErrorResponse,
)
from core.auth import get_current_user, get_optional_user
from services.service_request_service import (
    get_service_requests,
    get_service_request_by_id,
    create_service_request,
    update_service_request,
)

router = APIRouter(prefix="/service-requests", tags=["Service Requests Framework"])


@router.get(
    "",
    response_model=ServiceRequestListResponse,
    summary="List and filter service requests",
)
async def list_requests(
    status: Optional[str] = Query(None, description="Filter by status (SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, COMPLETED)"),
    service_type: Optional[str] = Query(None, description="Filter by service type (PARCEL_VERIFICATION, DOCUMENT_VERIFICATION, LAND_TRANSFER, PARCEL_SUBDIVISION)"),
    ulpin: Optional[str] = Query(None, description="Filter by parcel ULPIN"),
    current_user: Optional[dict] = Depends(get_optional_user),
):
    """
    List all service requests with optional filtering by status, service type, or ULPIN.
    Citizens only view their own requests and standard demo requests.
    """
    res = get_service_requests(
        status_filter=status,
        service_type=service_type,
        ulpin=ulpin,
        user=current_user,
    )
    return ServiceRequestListResponse(
        count=res["count"],
        summary=res["summary"],
        requests=res["requests"],
        disclaimer=DISCLAIMER,
    )


@router.get(
    "/{request_id}",
    response_model=ServiceRequestRecord,
    responses={
        404: {"model": ErrorResponse, "description": "Request not found"},
    },
    summary="Get single service request details",
)
async def get_single_request(request_id: str):
    """Retrieve complete metadata and linked verification details for a service request."""
    req = get_service_request_by_id(request_id)
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Service request '{request_id}' was not found.",
        )
    return req


@router.post(
    "",
    response_model=ServiceRequestRecord,
    status_code=status.HTTP_201_CREATED,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid service request parameters"},
        401: {"model": ErrorResponse, "description": "Authentication required"},
        404: {"model": ErrorResponse, "description": "Parcel not found"},
    },
    summary="Submit a new service request",
)
async def submit_request(
    payload: ServiceRequestCreateRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Submit a new service request for a land parcel.
    Automatically links to verification engine if service_type is PARCEL_VERIFICATION.
    """
    return create_service_request(
        data=payload.model_dump(),
        user=current_user,
    )


@router.patch(
    "/{request_id}",
    response_model=ServiceRequestRecord,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid update payload"},
        401: {"model": ErrorResponse, "description": "Authentication required"},
        403: {"model": ErrorResponse, "description": "Citizen unauthorized to update request"},
        404: {"model": ErrorResponse, "description": "Request not found"},
    },
    summary="Update service request status or assignment (Officers / Admin only)",
)
async def update_request(
    request_id: str,
    payload: ServiceRequestUpdateRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Update status, assigned role, or remarks for an existing service request.
    Only available to authorized departmental officers and system administrators.
    """
    return update_service_request(
        request_id=request_id,
        updates=payload.model_dump(exclude_unset=True),
        user=current_user,
    )
