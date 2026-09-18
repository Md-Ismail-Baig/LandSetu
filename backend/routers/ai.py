"""
LandSetu Backend — AI Router

Grounded AI parcel assistant endpoint.
"""

from fastapi import APIRouter, HTTPException, status
from models import AIQueryRequest, AIQueryResponse, ErrorResponse
from services.ai_service import query_ai_assistant
from services.parcel_service import get_parcel_by_ulpin

router = APIRouter(prefix="/ai", tags=["AI Assistant"])


@router.post(
    "/query",
    response_model=AIQueryResponse,
    responses={
        400: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
    },
    summary="Query Grounded AI Assistant regarding a Land Parcel",
)
async def query_ai(request: AIQueryRequest):
    """
    RAG-style grounded AI query endpoint.
    Retrieves factual parcel records and returns an exact, grounded answer with source attribution.
    """
    cleaned_query = request.query.strip()
    if not cleaned_query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query string cannot be empty.",
        )

    # Verify parcel existence
    parcel = get_parcel_by_ulpin(request.ulpin)
    if not parcel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Parcel with ULPIN '{request.ulpin}' not found in registry.",
        )

    response_data = query_ai_assistant(request.ulpin, cleaned_query)
    if not response_data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate grounded AI response.",
        )

    return AIQueryResponse(**response_data)
