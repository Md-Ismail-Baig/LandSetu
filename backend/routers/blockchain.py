"""
LandSetu Backend — Permissioned Digital Ledger Router

REST API endpoints for querying transactions, inspecting block metadata,
and performing backend-driven cryptographic chain verification.
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict
from config import DISCLAIMER
from core.auth import get_current_user, get_optional_user
from services.blockchain_service import (
    get_transactions,
    get_transaction_by_id,
    verify_chain,
    tamper_transaction_test,
    repair_chain_test,
)


class BlockchainTransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    transaction_id: str
    request_id: Optional[str] = None
    ulpin: Optional[str] = None
    action: str
    department: str
    username: str
    role: str
    timestamp: str
    status: str
    previous_hash: str
    transaction_hash: str
    metadata_json: Optional[str] = "{}"


class BlockchainListResponse(BaseModel):
    count: int
    status: str
    transactions: List[BlockchainTransactionResponse]
    disclaimer: str


class ChainVerificationResponse(BaseModel):
    is_valid: bool
    status: str
    verified_count: int
    latest_hash: Optional[str] = None
    broken_transaction: Optional[str] = None
    details: str
    disclaimer: str


router = APIRouter(prefix="/blockchain", tags=["Permissioned Digital Ledger"])


@router.get(
    "/transactions",
    response_model=BlockchainListResponse,
    summary="List transactions on the permissioned digital ledger",
)
async def list_blockchain_transactions(
    limit: int = Query(50, ge=1, le=200, description="Max transaction blocks to return"),
    ulpin: Optional[str] = Query(None, description="Filter transactions by parcel ULPIN"),
    current_user: Optional[dict] = Depends(get_optional_user),
):
    """Retrieve chronologically ordered transaction blocks from the digital ledger."""
    txs = get_transactions(limit=limit, ulpin=ulpin)
    return BlockchainListResponse(
        count=len(txs),
        status="ACTIVE",
        transactions=[BlockchainTransactionResponse(**t) for t in txs],
        disclaimer=DISCLAIMER,
    )


@router.get(
    "/history",
    response_model=BlockchainListResponse,
    summary="Alias endpoint for transaction history",
)
async def get_blockchain_history(
    limit: int = Query(50, ge=1, le=200),
    ulpin: Optional[str] = Query(None),
):
    """Alias endpoint for retrieving transaction history."""
    return await list_blockchain_transactions(limit=limit, ulpin=ulpin)


@router.get(
    "/transactions/{transaction_id}",
    response_model=BlockchainTransactionResponse,
    summary="Get single transaction block by ID",
)
async def get_single_transaction(transaction_id: str):
    """Retrieve full cryptographic details for a single ledger block."""
    tx = get_transaction_by_id(transaction_id)
    if not tx:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ledger block '{transaction_id}' was not found.",
        )
    return BlockchainTransactionResponse(**tx)


@router.get(
    "/verify",
    response_model=ChainVerificationResponse,
    summary="Perform complete cryptographic verification of the digital ledger",
)
async def verify_blockchain_chain():
    """
    Executes sequential SHA-256 hash validation across all transaction blocks
    from Genesis block to tip.
    """
    res = verify_chain()
    return ChainVerificationResponse(
        is_valid=res["is_valid"],
        status=res["status"],
        verified_count=res["verified_count"],
        latest_hash=res.get("latest_hash"),
        broken_transaction=res.get("broken_transaction"),
        details=res["details"],
        disclaimer=DISCLAIMER,
    )


@router.post(
    "/tamper-test",
    summary="Dev/Demo utility: Simulate metadata tampering on a ledger transaction",
)
async def tamper_test(
    transaction_id: str = Query(..., description="Target transaction ID to tamper"),
    current_user: dict = Depends(get_current_user),
):
    """Dev/Demo test endpoint to trigger controlled chain invalidation."""
    return tamper_transaction_test(transaction_id)


@router.post(
    "/repair-test",
    summary="Dev/Demo utility: Recalculate valid SHA-256 hashes across the chain",
)
async def repair_test(
    current_user: dict = Depends(get_current_user),
):
    """Dev/Demo test endpoint to restore chain integrity."""
    return repair_chain_test()
