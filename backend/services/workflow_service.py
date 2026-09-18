"""
LandSetu Backend — Workflow Service

State machine and verification lifecycle management for satellite-detected
change verification cases. Enforces business rules, role permissions, and
state transition guarantees.
"""

import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from fastapi import HTTPException, status
from database import get_connection
from services.satellite_service import get_satellite_record
from services.audit_service import log_audit_event
from services.blockchain_service import create_transaction


def get_verification(ulpin: str) -> Optional[Dict[str, Any]]:

    """
    Retrieve current/latest verification record for a given ULPIN.
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT verification_id, ulpin, status, requested_by, reviewed_by,
               change_type, remarks, decision, created_at, reviewed_at
        FROM verifications
        WHERE ulpin = ?
        ORDER BY created_at DESC
        LIMIT 1
    """, (ulpin,))

    row = cursor.fetchone()
    conn.close()

    if not row:
        return None
    return dict(row)


def get_verification_by_id(verification_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve a verification case by verification_id."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT verification_id, ulpin, status, requested_by, reviewed_by,
               change_type, remarks, decision, created_at, reviewed_at
        FROM verifications
        WHERE verification_id = ?
    """, (verification_id,))

    row = cursor.fetchone()
    conn.close()

    if not row:
        return None
    return dict(row)


def create_verification(
    ulpin: str,
    user: Dict[str, Any],
    remarks: Optional[str] = None
) -> Dict[str, Any]:
    """
    Create a new verification case in PENDING state.
    """
    # 1. Validate ULPIN exists in database
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT ulpin FROM parcels WHERE ulpin = ?", (ulpin,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Parcel with ULPIN '{ulpin}' not found."
        )

    # 2. Validate satellite record exists
    sat_record = get_satellite_record(ulpin)
    if not sat_record:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No satellite monitoring record exists for parcel '{ulpin}' to initiate verification."
        )

    # 3. Check if there is already an active PENDING verification
    cursor.execute(
        "SELECT verification_id, status FROM verifications WHERE ulpin = ? AND status = 'PENDING'",
        (ulpin,)
    )
    existing_pending = cursor.fetchone()
    if existing_pending:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A verification case ({existing_pending['verification_id']}) is already PENDING for parcel '{ulpin}'."
        )

    # 4. Construct record
    verification_id = f"VER-{uuid.uuid4().hex[:8].upper()}"
    created_at = datetime.now(timezone.utc).isoformat()
    change_type = sat_record.get("change", {}).get("type") or "Possible New Construction"
    user_name = user.get("username", "revenue.officer")
    user_role = user.get("role", "Revenue Officer")

    cursor.execute("""
        INSERT INTO verifications (
            verification_id, ulpin, status, requested_by, reviewed_by,
            change_type, remarks, decision, created_at, reviewed_at
        ) VALUES (?, ?, 'PENDING', ?, NULL, ?, ?, NULL, ?, NULL)
    """, (
        verification_id,
        ulpin,
        user_name,
        change_type,
        remarks or "Review initiated based on simulated satellite change detection.",
        created_at,
    ))

    conn.commit()
    conn.close()

    # 5. Log audit event
    log_audit_event(
        username=user_name,
        role=user_role,
        action="VERIFICATION_CREATED",
        status="PENDING",
        ulpin=ulpin,
        remarks=remarks or "Initiated verification workflow",
        verification_id=verification_id,
    )

    return {
        "verification_id": verification_id,
        "ulpin": ulpin,
        "status": "PENDING",
        "requested_by": user_name,
        "reviewed_by": None,
        "change_type": change_type,
        "remarks": remarks,
        "decision": None,
        "created_at": created_at,
        "reviewed_at": None,
    }


def approve_verification(
    ulpin: str,
    reviewer: Dict[str, Any],
    remarks: str
) -> Dict[str, Any]:
    """
    Approve a pending verification case.
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT verification_id, ulpin, status, requested_by, created_at
        FROM verifications
        WHERE ulpin = ?
        ORDER BY created_at DESC
        LIMIT 1
    """, (ulpin,))
    current = cursor.fetchone()

    if not current:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No verification record found for parcel '{ulpin}'."
        )

    if current["status"] != "PENDING":
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot approve verification: Case status is currently '{current['status']}', expected 'PENDING'."
        )

    reviewed_at = datetime.now(timezone.utc).isoformat()
    reviewer_name = reviewer.get("username", "revenue.officer")
    reviewer_role = reviewer.get("role", "Revenue Officer")
    verification_id = current["verification_id"]

    cursor.execute("""
        UPDATE verifications
        SET status = 'APPROVED',
            reviewed_by = ?,
            decision = 'APPROVED',
            remarks = ?,
            reviewed_at = ?
        WHERE verification_id = ?
    """, (reviewer_name, remarks, reviewed_at, verification_id))

    conn.commit()
    conn.close()

    # Log audit event
    log_audit_event(
        username=reviewer_name,
        role=reviewer_role,
        action="VERIFICATION_APPROVED",
        status="APPROVED",
        ulpin=ulpin,
        remarks=remarks,
        verification_id=verification_id,
    )

    # Append to Permissioned Digital Ledger
    create_transaction(
        request_id=verification_id,
        ulpin=ulpin,
        action="PARCEL_VERIFICATION_APPROVED",
        department="REVENUE",
        username=reviewer_name,
        role=reviewer_role,
        status="SYNCHRONIZED",
        metadata={
            "verification_id": verification_id,
            "decision": "APPROVED",
            "remarks": remarks,
        },
    )

    return get_verification(ulpin)



def reject_verification(
    ulpin: str,
    reviewer: Dict[str, Any],
    remarks: str
) -> Dict[str, Any]:
    """
    Reject a pending verification case.
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT verification_id, ulpin, status, requested_by, created_at
        FROM verifications
        WHERE ulpin = ?
        ORDER BY created_at DESC
        LIMIT 1
    """, (ulpin,))
    current = cursor.fetchone()

    if not current:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No verification record found for parcel '{ulpin}'."
        )

    if current["status"] != "PENDING":
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot reject verification: Case status is currently '{current['status']}', expected 'PENDING'."
        )

    reviewed_at = datetime.now(timezone.utc).isoformat()
    reviewer_name = reviewer.get("username", "revenue.officer")
    reviewer_role = reviewer.get("role", "Revenue Officer")
    verification_id = current["verification_id"]

    cursor.execute("""
        UPDATE verifications
        SET status = 'REJECTED',
            reviewed_by = ?,
            decision = 'REJECTED',
            remarks = ?,
            reviewed_at = ?
        WHERE verification_id = ?
    """, (reviewer_name, remarks, reviewed_at, verification_id))

    conn.commit()
    conn.close()

    # Log audit event
    log_audit_event(
        username=reviewer_name,
        role=reviewer_role,
        action="VERIFICATION_REJECTED",
        status="REJECTED",
        ulpin=ulpin,
        remarks=remarks,
        verification_id=verification_id,
    )

    return get_verification(ulpin)
