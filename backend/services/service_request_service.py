"""
LandSetu Backend — Generic Service Request Framework Service

Provides an extensible workflow foundation for parcel services:
1. PARCEL_VERIFICATION (active workflow)
2. DOCUMENT_VERIFICATION (framework ready)
3. LAND_TRANSFER (framework ready)
4. PARCEL_SUBDIVISION (framework ready)
"""

import json
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import HTTPException, status
from database import get_connection
from services.audit_service import log_audit_event
from services.workflow_service import get_verification, create_verification


SERVICE_ROLE_MAPPING = {
    "PARCEL_VERIFICATION": "Revenue Officer",
    "DOCUMENT_VERIFICATION": "Registration Officer",
    "LAND_TRANSFER": "Registration Officer",
    "PARCEL_SUBDIVISION": "Revenue Officer",
}


def get_service_requests(
    status_filter: Optional[str] = None,
    service_type: Optional[str] = None,
    ulpin: Optional[str] = None,
    user: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    List and filter service requests with role-aware scoping.
    """
    conn = get_connection()
    cursor = conn.cursor()

    query = """
        SELECT request_id, ulpin, service_type, applicant, assigned_role,
               status, description, priority, metadata_json, created_at, updated_at
        FROM service_requests
        WHERE 1=1
    """
    params = []

    if status_filter:
        query += " AND status = ?"
        params.append(status_filter)

    if service_type:
        query += " AND service_type = ?"
        params.append(service_type)

    if ulpin:
        query += " AND ulpin = ?"
        params.append(ulpin)

    # Scoping for citizens: can view their own requests + demo requests
    if user and user.get("role") == "Citizen":
        query += " AND (applicant = ? OR applicant = 'citizen')"
        params.append(user.get("username", "citizen"))

    query += " ORDER BY created_at DESC"

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    requests_list = []
    summary_counts = {
        "total": 0,
        "submitted": 0,
        "under_review": 0,
        "approved": 0,
        "rejected": 0,
        "completed": 0,
    }

    for r in rows:
        row_dict = dict(r)
        try:
            row_dict["metadata"] = json.loads(row_dict.pop("metadata_json") or "{}")
        except Exception:
            row_dict["metadata"] = {}

        # Attach linked verification if PARCEL_VERIFICATION
        if row_dict["service_type"] == "PARCEL_VERIFICATION":
            row_dict["linked_verification"] = get_verification(row_dict["ulpin"])
        else:
            row_dict["linked_verification"] = None

        req_status = row_dict["status"].lower()
        summary_counts["total"] += 1
        if req_status in summary_counts:
            summary_counts[req_status] += 1

        requests_list.append(row_dict)

    return {
        "count": len(requests_list),
        "summary": summary_counts,
        "requests": requests_list,
    }


def get_service_request_by_id(request_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve single service request record with linked verification if applicable."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT request_id, ulpin, service_type, applicant, assigned_role,
               status, description, priority, metadata_json, created_at, updated_at
        FROM service_requests
        WHERE request_id = ?
    """, (request_id,))

    row = cursor.fetchone()
    conn.close()

    if not row:
        return None

    res = dict(row)
    try:
        res["metadata"] = json.loads(res.pop("metadata_json") or "{}")
    except Exception:
        res["metadata"] = {}

    if res["service_type"] == "PARCEL_VERIFICATION":
        res["linked_verification"] = get_verification(res["ulpin"])
    else:
        res["linked_verification"] = None

    return res


def create_service_request(
    data: Dict[str, Any],
    user: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Create a new generic service request and log an audit event.
    """
    ulpin = data.get("ulpin", "").strip().upper()
    service_type = data.get("service_type", "").strip().upper()
    description = data.get("description", "").strip()
    priority = data.get("priority", "Normal")
    meta = data.get("metadata", {})

    # Validate ULPIN exists
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT ulpin FROM parcels WHERE ulpin = ?", (ulpin,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Parcel with ULPIN '{ulpin}' not found."
        )

    valid_types = ["PARCEL_VERIFICATION", "DOCUMENT_VERIFICATION", "LAND_TRANSFER", "PARCEL_SUBDIVISION"]
    if service_type not in valid_types:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid service type '{service_type}'. Valid types: {', '.join(valid_types)}."
        )

    request_id = f"REQ-{uuid.uuid4().hex[:8].upper()}"
    now_iso = datetime.now(timezone.utc).isoformat()
    assigned_role = SERVICE_ROLE_MAPPING.get(service_type, "Revenue Officer")
    applicant = user.get("username", "citizen")
    initial_status = "UNDER_REVIEW" if service_type == "PARCEL_VERIFICATION" else "SUBMITTED"

    cursor.execute("""
        INSERT INTO service_requests (
            request_id, ulpin, service_type, applicant, assigned_role,
            status, description, priority, metadata_json, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        request_id,
        ulpin,
        service_type,
        applicant,
        assigned_role,
        initial_status,
        description,
        priority,
        json.dumps(meta),
        now_iso,
        now_iso,
    ))

    conn.commit()
    conn.close()

    # Link parcel verification if type is PARCEL_VERIFICATION
    linked_ver = None
    if service_type == "PARCEL_VERIFICATION":
        existing_ver = get_verification(ulpin)
        if not existing_ver:
            try:
                linked_ver = create_verification(ulpin, user, remarks=description)
            except Exception:
                pass
        else:
            linked_ver = existing_ver

    # Log audit event
    log_audit_event(
        username=applicant,
        role=user.get("role", "Citizen"),
        action="SERVICE_REQUEST_CREATED",
        status=initial_status,
        ulpin=ulpin,
        remarks=f"{service_type}: {description}",
        verification_id=request_id,
    )

    return {
        "request_id": request_id,
        "ulpin": ulpin,
        "service_type": service_type,
        "applicant": applicant,
        "assigned_role": assigned_role,
        "status": initial_status,
        "description": description,
        "priority": priority,
        "metadata": meta,
        "created_at": now_iso,
        "updated_at": now_iso,
        "linked_verification": linked_ver,
    }


def update_service_request(
    request_id: str,
    updates: Dict[str, Any],
    user: Dict[str, Any],
) -> Dict[str, Any]:
    """Update status, assigned role, or metadata of an existing service request."""
    user_role = user.get("role", "Citizen")
    if user_role == "Citizen":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Citizens cannot modify service request status or assignment.",
        )

    req = get_service_request_by_id(request_id)
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Service request '{request_id}' not found.",
        )

    conn = get_connection()
    cursor = conn.cursor()

    new_status = updates.get("status") or req["status"]
    new_assigned = updates.get("assigned_role") or req["assigned_role"]
    remarks = updates.get("remarks")
    now_iso = datetime.now(timezone.utc).isoformat()

    cursor.execute("""
        UPDATE service_requests
        SET status = ?, assigned_role = ?, updated_at = ?
        WHERE request_id = ?
    """, (new_status, new_assigned, now_iso, request_id))
    conn.commit()
    conn.close()

    # Log audit event
    log_audit_event(
        username=user.get("username", "officer"),
        role=user_role,
        action="SERVICE_REQUEST_UPDATED",
        status=new_status,
        ulpin=req.get("ulpin"),
        remarks=f"Status updated to {new_status} by {user.get('name', user_role)}. Remarks: {remarks or 'None'}",
        verification_id=request_id,
    )

    return get_service_request_by_id(request_id)


def seed_default_service_requests():
    """Seed demo service requests if the table is currently empty."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) AS count FROM service_requests")
    count = cursor.fetchone()["count"]

    if count > 0:
        conn.close()
        return

    now_iso = datetime.now(timezone.utc).isoformat()
    demo_requests = [
        (
            "REQ-VERIF-001",
            "KA0102030405",
            "PARCEL_VERIFICATION",
            "revenue.officer",
            "Revenue Officer",
            "UNDER_REVIEW",
            "Automated satellite anomaly detected 185.4 sqm potential construction. Officer physical demarcation review scheduled.",
            "High",
            json.dumps({"satellite_change_type": "Possible New Construction", "confidence": 0.78}),
            "2025-08-23T10:15:00Z",
            "2025-08-23T10:15:00Z",
        ),
        (
            "REQ-DOCS-002",
            "KA0203040506",
            "DOCUMENT_VERIFICATION",
            "citizen",
            "Registration Officer",
            "SUBMITTED",
            "Citizen submitted Form 15 Encumbrance Certificate & Sale Deed for title validation.",
            "Normal",
            json.dumps({"document_type": "Sale Deed", "doc_reference": "DOC-2024-BLR-892"}),
            "2025-08-24T14:30:00Z",
            "2025-08-24T14:30:00Z",
        ),
        (
            "REQ-TRNS-003",
            "KA0304050607",
            "LAND_TRANSFER",
            "citizen",
            "Registration Officer",
            "SUBMITTED",
            "Application for family settlement partition and title transfer to joint legal heir.",
            "Normal",
            json.dumps({"transfer_type": "Family Settlement", "target_party": "Lakshmi Rao"}),
            "2025-08-25T09:00:00Z",
            "2025-08-25T09:00:00Z",
        ),
        (
            "REQ-SUBD-004",
            "KA0405060708",
            "PARCEL_SUBDIVISION",
            "revenue.officer",
            "Revenue Officer",
            "SUBMITTED",
            "Cadastral survey partition request to bifurcate 3.8 hectares agricultural land into 2 distinct plots.",
            "Normal",
            json.dumps({"subdivision_parts": 2, "surveyor_assigned": "Bangalore Urban Cadastral Unit"}),
            "2025-08-26T11:45:00Z",
            "2025-08-26T11:45:00Z",
        ),
    ]

    cursor.executemany("""
        INSERT INTO service_requests (
            request_id, ulpin, service_type, applicant, assigned_role,
            status, description, priority, metadata_json, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, demo_requests)

    conn.commit()
    conn.close()
