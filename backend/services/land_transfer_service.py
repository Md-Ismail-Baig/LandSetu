"""
LandSetu Backend — Land Sale / Ownership Transfer Service

Manages end-to-end land ownership transfer workflows:
1. Validates seller ownership against cadastral parcel records.
2. Evaluates 4-point eligibility matrix (Seller match, Tax dues, Encumbrances, Linked Document Verification).
3. Creates linked Service Request records.
4. Processes officer approvals, updates master parcel ownership, and emits audit trail events.
"""

import json
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import HTTPException, status
from database import get_connection
from services.parcel_service import get_parcel_by_ulpin
from services.department_service import get_ownership_detail, get_tax_detail, get_restrictions_detail
from services.service_request_service import create_service_request, update_service_request
from services.document_verification_service import get_document_verification_by_id
from services.audit_service import log_audit_event
from services.blockchain_service import create_transaction



def run_land_transfer_eligibility_checks(transfer_data: Dict[str, Any], ulpin: str) -> Dict[str, Any]:
    """
    Execute 4-point automated eligibility verification matrix:
    1. Seller Ownership Match
    2. Property Tax Dues Status
    3. Legal Encumbrance & Court Stay Check
    4. Linked Document Verification Status
    """
    parcel = get_parcel_by_ulpin(ulpin)
    if not parcel:
        return {
            "overall_eligibility": "INELIGIBLE",
            "checks": [
                {
                    "check": "SELLER",
                    "name": "Registered Seller Ownership Check",
                    "provided_value": transfer_data.get("seller_name", "—"),
                    "record_value": "PARCEL NOT FOUND",
                    "result": "MISMATCH",
                    "details": f"Parcel with ULPIN '{ulpin}' was not found in LandSetu registry.",
                }
            ],
            "summary": "Target parcel record does not exist.",
        }

    ownership = get_ownership_detail(ulpin) or {}
    tax = get_tax_detail(ulpin) or {}
    restrictions = get_restrictions_detail(ulpin) or {}

    checks = []

    # 1. Seller Ownership Match
    provided_seller = str(transfer_data.get("seller_name", parcel.get("owner_name", ""))).strip()
    record_owner = str(parcel.get("owner_name", "")).strip()

    seller_match = provided_seller.lower() == record_owner.lower() or provided_seller.lower() in record_owner.lower() or record_owner.lower() in provided_seller.lower()
    checks.append({
        "check": "SELLER",
        "name": "Seller Title Match",
        "provided_value": provided_seller or "—",
        "record_value": record_owner or "—",
        "result": "MATCH" if seller_match else "MISMATCH",
        "details": f"Seller '{provided_seller}' matches recorded owner '{record_owner}'." if seller_match else f"Seller '{provided_seller}' does NOT match registered owner '{record_owner}'.",
    })

    # 2. Property Tax Status Check
    tax_status = tax.get("payment_status", "Paid / Up to date")
    outstanding = tax.get("outstanding_amount", 0.0)
    tax_clear = "paid" in tax_status.lower() and outstanding == 0.0

    checks.append({
        "check": "TAX",
        "name": "Municipal Property Tax Dues",
        "provided_value": f"Outstanding Dues: ₹{outstanding:,.2f}",
        "record_value": tax_status,
        "result": "CLEAR" if tax_clear else "NEEDS_REVIEW",
        "details": "Property tax payments are up to date with zero outstanding arrears." if tax_clear else f"Property tax arrears pending: ₹{outstanding:,.2f}. Tax receipt verification required.",
    })

    # 3. Encumbrance & Legal Restrictions Check
    restr_status = restrictions.get("status", "Clear / Standard Record")
    court_stay = restrictions.get("court_stay_status", "No Active Court Stay")
    is_restricted = "dispute" in restr_status.lower() or "stay" in court_stay.lower() or "injunction" in court_stay.lower()

    checks.append({
        "check": "RESTRICTIONS",
        "name": "Legal Encumbrance & Stay Order Check",
        "provided_value": "No Stay Order Claimed",
        "record_value": f"{restr_status} ({court_stay})",
        "result": "RESTRICTED" if is_restricted else "CLEAR",
        "details": f"Legal restriction active: {court_stay}." if is_restricted else "No active court stays, acquisition notices, or banking liens recorded.",
    })

    # 4. Linked Document Verification Check
    doc_ver_id = transfer_data.get("doc_verification_id")
    doc_ver_record = get_document_verification_by_id(doc_ver_id) if doc_ver_id else None

    if doc_ver_record:
        doc_status = doc_ver_record.get("status", "SUBMITTED")
        doc_result = doc_ver_record.get("overall_result", "NEEDS_REVIEW")
        doc_check_result = "MATCH" if (doc_status == "APPROVED" and doc_result == "MATCH") else ("APPROVED" if doc_status == "APPROVED" else "NEEDS_REVIEW")
        doc_details = f"Linked Document Verification ({doc_ver_id}) status: {doc_status} ({doc_result})."
    else:
        doc_status = "NOT_LINKED"
        doc_check_result = "NEEDS_REVIEW"
        doc_details = "No verified Sale Deed / Title Document linked to this transfer request."

    checks.append({
        "check": "DOCUMENTATION",
        "name": "Title Deed Verification Status",
        "provided_value": doc_ver_id or "Not Provided",
        "record_value": f"Status: {doc_status}",
        "result": doc_check_result,
        "details": doc_details,
    })

    # Determine overall eligibility
    if seller_match and tax_clear and not is_restricted:
        overall = "ELIGIBLE"
        summary = "Parcel is clear for ownership transfer. All mandatory revenue, tax, and legal checks passed."
    elif is_restricted:
        overall = "INELIGIBLE"
        summary = "Transfer prohibited due to active legal injunction or dispute on title."
    else:
        overall = "NEEDS_REVIEW"
        summary = "Transfer request requires officer scrutiny due to pending tax dues or unverified document records."

    return {
        "overall_eligibility": overall,
        "tax_status": "CLEAR" if tax_clear else "NEEDS_REVIEW",
        "restriction_status": "RESTRICTED" if is_restricted else "CLEAR",
        "checks": checks,
        "summary": summary,
    }


def get_land_transfers(
    ulpin: Optional[str] = None,
    status_filter: Optional[str] = None,
    user: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """List and filter land transfer records with role scoping."""
    conn = get_connection()
    cursor = conn.cursor()

    query = """
        SELECT transfer_id, request_id, ulpin, seller_name, seller_id, buyer_name,
               buyer_contact, buyer_id, transfer_type, area_transferred, consideration_amount,
               consideration_reference, doc_verification_id, registration_reference,
               status, tax_status, restriction_status, overall_eligibility,
               submitted_by, submission_date, reviewed_by, reviewed_at, remarks,
               created_at, updated_at
        FROM land_transfers
        WHERE 1=1
    """
    params = []

    if status_filter:
        query += " AND status = ?"
        params.append(status_filter)

    if ulpin:
        query += " AND ulpin = ?"
        params.append(ulpin)

    # Citizen scoping: see their own submissions or requests where seller/buyer is their demo user
    if user and user.get("role") == "Citizen":
        query += " AND (submitted_by = ? OR submitted_by = 'citizen' OR seller_name LIKE ?)"
        username = user.get("username", "citizen")
        user_name = user.get("name", "Ramesh Kumar")
        params.extend([username, f"%{user_name}%"])

    query += " ORDER BY created_at DESC"

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    transfers_list = []
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
        req_ulpin = row_dict["ulpin"]
        row_dict["parcel_summary"] = get_parcel_by_ulpin(req_ulpin)
        
        # Calculate live eligibility checks
        eligibility = run_land_transfer_eligibility_checks(row_dict, req_ulpin)
        row_dict["eligibility_checks"] = eligibility["checks"]

        st = row_dict["status"].lower()
        summary_counts["total"] += 1
        if st in summary_counts:
            summary_counts[st] += 1

        transfers_list.append(row_dict)

    return {
        "count": len(transfers_list),
        "summary": summary_counts,
        "transfers": transfers_list,
    }


def get_land_transfer_by_id(identifier: str) -> Optional[Dict[str, Any]]:
    """Retrieve single land transfer record by transfer_id or request_id."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT transfer_id, request_id, ulpin, seller_name, seller_id, buyer_name,
               buyer_contact, buyer_id, transfer_type, area_transferred, consideration_amount,
               consideration_reference, doc_verification_id, registration_reference,
               status, tax_status, restriction_status, overall_eligibility,
               submitted_by, submission_date, reviewed_by, reviewed_at, remarks,
               created_at, updated_at
        FROM land_transfers
        WHERE transfer_id = ? OR request_id = ?
    """, (identifier, identifier))

    row = cursor.fetchone()
    conn.close()

    if not row:
        return None

    res = dict(row)
    req_ulpin = res["ulpin"]
    res["parcel_summary"] = get_parcel_by_ulpin(req_ulpin)

    # Compute live eligibility checks matrix
    eligibility = run_land_transfer_eligibility_checks(res, req_ulpin)
    res["eligibility_checks"] = eligibility["checks"]
    res["overall_eligibility"] = eligibility["overall_eligibility"]

    return res


def create_land_transfer(data: Dict[str, Any], user: Dict[str, Any]) -> Dict[str, Any]:
    """Submit a new land sale / ownership transfer application."""
    ulpin = data.get("ulpin", "").strip().upper()
    parcel = get_parcel_by_ulpin(ulpin)
    if not parcel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Parcel with ULPIN '{ulpin}' not found.",
        )

    buyer_name = data.get("buyer_name", "").strip()
    if not buyer_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Buyer name is required for land ownership transfer.",
        )

    seller_name = parcel.get("owner_name", "Current Owner")
    area_transferred = float(data.get("area_transferred") or parcel.get("area_acres", 1.0))
    consideration_amount = float(data.get("consideration_amount") or 0.0)
    transfer_type = data.get("transfer_type", "SALE").upper()
    doc_ver_id = data.get("doc_verification_id")
    remarks = data.get("remarks", "").strip()

    # Step 1: Create linked Service Request
    service_req = create_service_request(
        data={
            "ulpin": ulpin,
            "service_type": "LAND_TRANSFER",
            "description": f"Land Transfer ({transfer_type}): Seller '{seller_name}' to Buyer '{buyer_name}'. Consideration: ₹{consideration_amount:,.2f}",
            "priority": "Normal",
            "metadata": {
                "transfer_type": transfer_type,
                "buyer_name": buyer_name,
                "seller_name": seller_name,
                "doc_verification_id": doc_ver_id,
            },
        },
        user=user,
    )

    request_id = service_req["request_id"]
    transfer_id = f"LTR-{uuid.uuid4().hex[:8].upper()}"
    now_iso = datetime.now(timezone.utc).isoformat()
    today_date = now_iso[:10]
    submitted_by = user.get("username", "citizen")

    # Run initial eligibility check
    temp_payload = {
        "seller_name": seller_name,
        "buyer_name": buyer_name,
        "doc_verification_id": doc_ver_id,
    }
    eligibility_result = run_land_transfer_eligibility_checks(temp_payload, ulpin)

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO land_transfers (
            transfer_id, request_id, ulpin, seller_name, seller_id, buyer_name,
            buyer_contact, buyer_id, transfer_type, area_transferred, consideration_amount,
            consideration_reference, doc_verification_id, registration_reference,
            status, tax_status, restriction_status, overall_eligibility,
            submitted_by, submission_date, remarks, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        transfer_id,
        request_id,
        ulpin,
        seller_name,
        parcel.get("owner_id", f"OWN-{ulpin[-4:]}"),
        buyer_name,
        data.get("buyer_contact"),
        data.get("buyer_id"),
        transfer_type,
        area_transferred,
        consideration_amount,
        data.get("consideration_reference"),
        doc_ver_id,
        f"SRO-REG-{uuid.uuid4().hex[:6].upper()}",
        "SUBMITTED",
        eligibility_result["tax_status"],
        eligibility_result["restriction_status"],
        eligibility_result["overall_eligibility"],
        submitted_by,
        today_date,
        remarks or "Ownership transfer request initiated via LandSetu platform.",
        now_iso,
        now_iso,
    ))

    conn.commit()
    conn.close()

    # Log audit event
    log_audit_event(
        username=submitted_by,
        role=user.get("role", "Citizen"),
        action="LAND_TRANSFER_CREATED",
        status="SUBMITTED",
        ulpin=ulpin,
        remarks=f"Land transfer request '{transfer_id}' created from {seller_name} to {buyer_name}.",
        verification_id=request_id,
    )

    return get_land_transfer_by_id(transfer_id)


def review_land_transfer(
    identifier: str,
    decision: str,
    remarks: str,
    user: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Process official Registration Officer / Revenue Officer approval or rejection of transfer request.
    Upon approval:
    - Master parcel owner_name is updated to buyer_name in parcels ledger.
    - Status is updated to APPROVED / COMPLETED.
    - Linked ServiceRequest is updated to COMPLETED.
    - Audit log events are recorded.
    """
    user_role = user.get("role", "Citizen")
    allowed_roles = ["Registration Officer", "Revenue Officer", "Administrator", "Admin"]
    if user_role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Role '{user_role}' is not authorized to review land ownership transfers.",
        )

    record = get_land_transfer_by_id(identifier)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Land transfer record '{identifier}' was not found.",
        )

    current_status = record["status"]
    if current_status in ["APPROVED", "REJECTED", "COMPLETED"]:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Land transfer record '{identifier}' is already in terminal state '{current_status}'.",
        )

    decision_upper = decision.upper().strip()
    if decision_upper not in ["APPROVED", "REJECTED"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Decision must be either 'APPROVED' or 'REJECTED'.",
        )

    if not remarks or len(remarks.strip()) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Official review remarks are mandatory for processing land transfers.",
        )

    now_iso = datetime.now(timezone.utc).isoformat()
    today_date = now_iso[:10]
    reviewer = user.get("username", "officer")
    ulpin = record["ulpin"]
    buyer_name = record["buyer_name"]
    seller_name = record["seller_name"]
    transfer_id = record["transfer_id"]
    request_id = record["request_id"]

    conn = get_connection()
    cursor = conn.cursor()

    if decision_upper == "APPROVED":
        new_status = "APPROVED"
        
        # 1. UPDATE master parcel owner in parcels table!
        cursor.execute("""
            UPDATE parcels
            SET owner_name = ?, last_transaction_date = ?, updated_at = ?
            WHERE ulpin = ?
        """, (buyer_name, today_date, now_iso, ulpin))

        # 2. UPDATE transfer record status
        cursor.execute("""
            UPDATE land_transfers
            SET status = ?, reviewed_by = ?, reviewed_at = ?, remarks = ?, updated_at = ?
            WHERE transfer_id = ?
        """, (new_status, reviewer, now_iso, remarks, now_iso, transfer_id))

        conn.commit()
        conn.close()

        # 3. Update linked service request status to COMPLETED
        try:
            update_service_request(
                request_id=request_id,
                updates={"status": "COMPLETED", "remarks": f"Transfer approved: Ownership mutated to {buyer_name}. Officer remarks: {remarks}"},
                user=user,
            )
        except Exception:
            pass

        # 4. Emit Audit events
        log_audit_event(
            username=reviewer,
            role=user_role,
            action="LAND_TRANSFER_APPROVED",
            status="APPROVED",
            ulpin=ulpin,
            remarks=f"Registration Officer approved land transfer '{transfer_id}'. Seller: {seller_name} -> Buyer: {buyer_name}.",
            verification_id=request_id,
        )

        log_audit_event(
            username=reviewer,
            role=user_role,
            action="OWNERSHIP_MUTATION_COMPLETED",
            status="ACTIVE",
            ulpin=ulpin,
            remarks=f"Master cadastral title updated to '{buyer_name}'. Transaction ref: {record.get('registration_reference')}.",
            verification_id=request_id,
        )

        # 5. Append to Permissioned Digital Ledger
        create_transaction(
            request_id=transfer_id,
            ulpin=ulpin,
            action="LAND_TRANSFER_APPROVED",
            department="REGISTRATION",
            username=reviewer,
            role=user_role,
            status="SYNCHRONIZED",
            metadata={
                "transfer_id": transfer_id,
                "seller_name": seller_name,
                "buyer_name": buyer_name,
                "area_transferred": record.get("area_transferred"),
                "consideration_amount": record.get("consideration_amount"),
                "remarks": remarks,
            },
        )


    else:
        new_status = "REJECTED"
        cursor.execute("""
            UPDATE land_transfers
            SET status = ?, reviewed_by = ?, reviewed_at = ?, remarks = ?, updated_at = ?
            WHERE transfer_id = ?
        """, (new_status, reviewer, now_iso, remarks, now_iso, transfer_id))

        conn.commit()
        conn.close()

        # Update linked service request to REJECTED
        try:
            update_service_request(
                request_id=request_id,
                updates={"status": "REJECTED", "remarks": f"Transfer rejected by Registration Officer. Remarks: {remarks}"},
                user=user,
            )
        except Exception:
            pass

        # Emit Audit event
        log_audit_event(
            username=reviewer,
            role=user_role,
            action="LAND_TRANSFER_REJECTED",
            status="REJECTED",
            ulpin=ulpin,
            remarks=f"Land transfer '{transfer_id}' rejected. Remarks: {remarks}",
            verification_id=request_id,
        )

    return get_land_transfer_by_id(transfer_id)


def seed_default_land_transfers():
    """Seed demo land transfer records if table is empty."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) AS count FROM land_transfers")
    count = cursor.fetchone()["count"]

    if count > 0:
        conn.close()
        return

    now_iso = datetime.now(timezone.utc).isoformat()
    demo_transfers = [
        (
            "LTR-2025-001",
            "REQ-TRNS-003",
            "KA0304050607",
            "Lakshmamma & Sons",
            "OWN-0607",
            "Lakshmi Rao",
            "+91 98450 11223",
            "AADHAAR-8921-0012",
            "SALE",
            1.75,
            3500000.0,
            "CHQ-SBIN-2025-99812",
            "DOC-VERIF-001",
            "SRO-KA03-REG-2025-091",
            "SUBMITTED",
            "CLEAR",
            "CLEAR",
            "ELIGIBLE",
            "citizen",
            "2025-08-25",
            "Family settlement deed for agricultural parcel title mutation.",
            now_iso,
            now_iso,
        )
    ]

    cursor.executemany("""
        INSERT INTO land_transfers (
            transfer_id, request_id, ulpin, seller_name, seller_id, buyer_name,
            buyer_contact, buyer_id, transfer_type, area_transferred, consideration_amount,
            consideration_reference, doc_verification_id, registration_reference,
            status, tax_status, restriction_status, overall_eligibility,
            submitted_by, submission_date, remarks, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, demo_transfers)

    conn.commit()
    conn.close()
