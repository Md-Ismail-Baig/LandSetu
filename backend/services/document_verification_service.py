"""
LandSetu Backend — Document Verification Service

Provides a deterministic 5-point comparison engine evaluating submitted land documents
(Sale Deeds, Registration Documents, Property Tax Receipts, Land Ownership Documents, Survey Documents)
against verified Cadastral Land & IGR Registration records.
"""

import json
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import HTTPException, status
from database import get_connection
from services.parcel_service import get_parcel_by_ulpin
from services.department_service import get_ownership_detail, get_registration_detail
from services.audit_service import log_audit_event
from services.blockchain_service import create_transaction



def run_document_verification_checks(doc_data: Dict[str, Any], ulpin: str) -> Dict[str, Any]:
    """
    Execute deterministic 5-point automated verification checks:
    1. ULPIN Match
    2. Current Owner / Seller Match
    3. Land Area Consistency
    4. Registration Reference & Deed Cross-Check
    5. Document Date Logical Consistency
    """
    parcel = get_parcel_by_ulpin(ulpin)
    if not parcel:
        return {
            "overall_result": "MISMATCH",
            "checks": [
                {
                    "check": "ULPIN",
                    "name": "Cadastral ULPIN Match",
                    "document_value": doc_data.get("ulpin", "—"),
                    "record_value": "NOT FOUND",
                    "result": "MISMATCH",
                    "details": f"Parcel with ULPIN '{ulpin}' does not exist in LandSetu master registry.",
                }
            ],
            "summary": "Target land parcel record was not found.",
        }

    ownership = get_ownership_detail(ulpin) or {}
    registration = get_registration_detail(ulpin) or {}

    checks = []

    # -------------------------------------------------------------
    # Check 1: ULPIN Match
    # -------------------------------------------------------------
    doc_ulpin = str(doc_data.get("ulpin", "")).strip().upper()
    rec_ulpin = str(parcel.get("ulpin", "")).strip().upper()

    if doc_ulpin == rec_ulpin:
        ulpin_res = "MATCH"
        ulpin_details = f"Document ULPIN '{doc_ulpin}' matches the registered cadastral record."
    else:
        ulpin_res = "MISMATCH"
        ulpin_details = f"Document ULPIN '{doc_ulpin}' does not match record ULPIN '{rec_ulpin}'."

    checks.append({
        "check": "ULPIN",
        "name": "Cadastral ULPIN Identifier",
        "document_value": doc_ulpin or "—",
        "record_value": rec_ulpin or "—",
        "result": ulpin_res,
        "details": ulpin_details,
    })

    # -------------------------------------------------------------
    # Check 2: Current Owner / Seller Name Match
    # -------------------------------------------------------------
    doc_owner = str(doc_data.get("seller_owner_name") or "").strip().lower()
    rec_owner = str(ownership.get("owner_name") or parcel.get("owner_name") or "").strip().lower()

    if not doc_owner:
        owner_res = "NEEDS_REVIEW"
        owner_details = "Seller/Owner name not specified in document submission; officer manual inspection required."
    elif doc_owner == rec_owner or doc_owner in rec_owner or rec_owner in doc_owner:
        owner_res = "MATCH"
        owner_details = f"Seller/Owner '{doc_data.get('seller_owner_name')}' matches registered titleholder '{ownership.get('owner_name', parcel.get('owner_name'))}'."
    else:
        owner_res = "MISMATCH"
        owner_details = f"Seller name '{doc_data.get('seller_owner_name')}' conflicts with registered owner '{ownership.get('owner_name', parcel.get('owner_name'))}'."

    checks.append({
        "check": "OWNER",
        "name": "Current Owner / Seller Titleholder",
        "document_value": doc_data.get("seller_owner_name") or "—",
        "record_value": ownership.get("owner_name") or parcel.get("owner_name") or "—",
        "result": owner_res,
        "details": owner_details,
    })

    # -------------------------------------------------------------
    # Check 3: Land Area Consistency Check
    # -------------------------------------------------------------
    doc_area = doc_data.get("area_mentioned")
    rec_ha = float(parcel.get("area_hectares", 0.0))
    rec_acres = float(parcel.get("area_acres", 0.0))

    if doc_area is None:
        area_res = "NEEDS_REVIEW"
        area_details = "Area not explicitly mentioned in document form. Officer verification required against survey map."
        doc_area_str = "—"
    else:
        doc_area_val = float(doc_area)
        doc_area_str = f"{doc_area_val} (Ha/Acres)"

        # Check against hectares or acres with 0.05 tolerance
        diff_ha = abs(doc_area_val - rec_ha)
        diff_acres = abs(doc_area_val - rec_acres)

        if diff_ha <= 0.05 or diff_acres <= 0.05:
            area_res = "MATCH"
            area_details = f"Document area ({doc_area_val}) aligns precisely with cadastral bounds ({rec_ha} Ha / {rec_acres} Acres)."
        elif diff_ha <= 0.3 or diff_acres <= 0.5:
            area_res = "NEEDS_REVIEW"
            area_details = f"Minor area discrepancy detected: Document mentions {doc_area_val}, master records show {rec_ha} Ha ({rec_acres} Acres)."
        else:
            area_res = "MISMATCH"
            area_details = f"Significant area mismatch: Document specifies {doc_area_val}, while cadastral record is {rec_ha} Ha ({rec_acres} Acres)."

    checks.append({
        "check": "AREA",
        "name": "Parcel Extent & Area Bounds",
        "document_value": doc_area_str,
        "record_value": f"{rec_ha} Hectares ({rec_acres} Acres)",
        "result": area_res,
        "details": area_details,
    })

    # -------------------------------------------------------------
    # Check 4: Registration Reference & SRO Deed Validation
    # -------------------------------------------------------------
    doc_reg_ref = str(doc_data.get("registration_reference") or doc_data.get("document_number") or "").strip().lower()
    rec_reg_num = str(registration.get("document_number") or "").strip().lower()
    rec_book = str(registration.get("book_number") or "").strip().lower()

    if not doc_reg_ref:
        reg_res = "NEEDS_REVIEW"
        reg_details = "Registration reference not provided. Officer must verify index register."
    elif doc_reg_ref in rec_reg_num or rec_reg_num in doc_reg_ref or doc_reg_ref in rec_book:
        reg_res = "MATCH"
        reg_details = f"Document reference matches IGR registered deed '{registration.get('document_number')}' ({registration.get('sro_office')})."
    else:
        reg_res = "NEEDS_REVIEW"
        reg_details = f"Reference '{doc_data.get('registration_reference') or doc_data.get('document_number')}' differs from latest indexed deed '{registration.get('document_number')}'; may represent earlier deed chain."

    checks.append({
        "check": "REGISTRATION",
        "name": "IGR Registration Reference & SRO Index",
        "document_value": doc_data.get("registration_reference") or doc_data.get("document_number") or "—",
        "record_value": registration.get("document_number") or "—",
        "result": reg_res,
        "details": reg_details,
    })

    # -------------------------------------------------------------
    # Check 5: Document Date Logical Consistency
    # -------------------------------------------------------------
    doc_date = str(doc_data.get("document_date") or "").strip()
    rec_date = str(registration.get("registration_date") or parcel.get("last_transaction_date") or "").strip()

    if not doc_date:
        date_res = "NEEDS_REVIEW"
        date_details = "Document date omitted. Manual validation against physical stamp paper required."
    elif doc_date == rec_date:
        date_res = "MATCH"
        date_details = f"Document date ({doc_date}) corresponds directly with registered deed date."
    elif doc_date <= "2026-12-31" and (not rec_date or doc_date <= rec_date or doc_date >= "1980-01-01"):
        date_res = "NEEDS_REVIEW"
        date_details = f"Document date ({doc_date}) differs from latest mutation date ({rec_date}); requires sequence inspection."
    else:
        date_res = "MISMATCH"
        date_details = f"Document date ({doc_date}) is inconsistent with parcel historical lineage."

    checks.append({
        "check": "DATE",
        "name": "Chronological Execution & Date Consistency",
        "document_value": doc_date or "—",
        "record_value": rec_date or "—",
        "result": date_res,
        "details": date_details,
    })

    # -------------------------------------------------------------
    # Calculate Overall Result
    # -------------------------------------------------------------
    results_list = [c["result"] for c in checks]
    if "MISMATCH" in results_list:
        overall = "MISMATCH"
        summary = "Automated verification identified conflicting records between the document and LandSetu master registry."
    elif "NEEDS_REVIEW" in results_list:
        overall = "NEEDS_REVIEW"
        summary = "Automated verification completed with advisory flags. Physical officer scrutiny recommended before approval."
    else:
        overall = "MATCH"
        summary = "All automated deterministic checks passed. Document information is consistent with cadastral records."

    return {
        "overall_result": overall,
        "checks": checks,
        "summary": summary,
    }


def create_document_verification(data: Dict[str, Any], user: Dict[str, Any]) -> Dict[str, Any]:
    """
    Submit a new land document verification request:
    1. Validate parcel existence
    2. Run automated 5-point comparison engine
    3. Create linked Service Request entry
    4. Store document verification record
    5. Log immutable audit trail event
    """
    ulpin = data.get("ulpin", "").strip().upper()
    parcel = get_parcel_by_ulpin(ulpin)
    if not parcel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Parcel with ULPIN '{ulpin}' was not found.",
        )

    doc_verif_id = f"DOC-VERIF-{uuid.uuid4().hex[:6].upper()}"
    service_req_id = f"REQ-DOCS-{uuid.uuid4().hex[:6].upper()}"
    now_iso = datetime.now(timezone.utc).isoformat()
    submitted_by = user.get("username", "citizen")

    # Run automated 5-point verification checks
    check_results = run_document_verification_checks(data, ulpin)
    overall_res = check_results["overall_result"]
    checks_json = json.dumps(check_results["checks"])

    conn = get_connection()
    cursor = conn.cursor()

    # 1. Insert parent Service Request
    service_desc = f"Document Verification ({data.get('document_type', 'Sale Deed')}): {data.get('document_name', 'Title Deed')}"
    cursor.execute("""
        INSERT INTO service_requests (
            request_id, ulpin, service_type, applicant, assigned_role,
            status, description, priority, metadata_json, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        service_req_id,
        ulpin,
        "DOCUMENT_VERIFICATION",
        submitted_by,
        "Registration Officer",
        "SUBMITTED",
        service_desc,
        "Normal",
        json.dumps({
            "doc_verification_id": doc_verif_id,
            "document_type": data.get("document_type"),
            "document_number": data.get("document_number"),
            "overall_result": overall_res,
        }),
        now_iso,
        now_iso,
    ))

    # 2. Insert Document Verification Record
    cursor.execute("""
        INSERT INTO document_verifications (
            doc_verification_id, request_id, ulpin, document_type, document_name,
            document_number, document_date, seller_owner_name, buyer_applicant_name,
            area_mentioned, registration_reference, additional_details,
            status, overall_result, verification_checks_json, submitted_by,
            submission_date, reviewed_by, reviewed_at, remarks, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        doc_verif_id,
        service_req_id,
        ulpin,
        data.get("document_type"),
        data.get("document_name"),
        data.get("document_number"),
        data.get("document_date"),
        data.get("seller_owner_name"),
        data.get("buyer_applicant_name"),
        data.get("area_mentioned"),
        data.get("registration_reference"),
        data.get("additional_details"),
        "SUBMITTED",
        overall_res,
        checks_json,
        submitted_by,
        now_iso,
        None,
        None,
        None,
        now_iso,
        now_iso,
    ))

    conn.commit()
    conn.close()

    # 3. Log Audit Event
    log_audit_event(
        username=submitted_by,
        role=user.get("role", "Citizen"),
        action="DOCUMENT_VERIFICATION_CREATED",
        status="SUBMITTED",
        ulpin=ulpin,
        remarks=f"Document verification requested for '{data.get('document_name')}'. Automated Check: {overall_res}",
        verification_id=doc_verif_id,
    )

    return get_document_verification_by_id(doc_verif_id)


def get_document_verification_by_id(identifier: str) -> Optional[Dict[str, Any]]:
    """Retrieve complete document verification record by doc_verification_id or request_id."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT * FROM document_verifications
        WHERE doc_verification_id = ? OR request_id = ?
    """, (identifier, identifier))

    row = cursor.fetchone()
    conn.close()

    if not row:
        return None

    d = dict(row)
    # Parse verification checks JSON
    if isinstance(d.get("verification_checks_json"), str):
        try:
            d["verification_checks"] = json.loads(d["verification_checks_json"])
        except Exception:
            d["verification_checks"] = []
    else:
        d["verification_checks"] = []

    # Attach lightweight parcel summary
    parcel = get_parcel_by_ulpin(d["ulpin"])
    if parcel:
        d["parcel_summary"] = {
            "ulpin": parcel["ulpin"],
            "owner_name": parcel["owner_name"],
            "survey_number": parcel["survey_number"],
            "area_hectares": parcel["area_hectares"],
            "area_acres": parcel["area_acres"],
            "land_type": parcel["land_type"],
            "district": parcel["district"],
            "taluk": parcel["taluk"],
            "village": parcel["village"],
            "status": parcel["status"],
        }

    return d


def get_document_verifications(
    ulpin: Optional[str] = None,
    status_filter: Optional[str] = None,
    user: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """List document verification requests with role-based visibility."""
    conn = get_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM document_verifications WHERE 1=1"
    params = []

    if ulpin:
        query += " AND ulpin = ?"
        params.append(ulpin)

    if status_filter:
        query += " AND status = ?"
        params.append(status_filter)

    # Scoping for Citizen: view own submissions + demo accounts
    if user and user.get("role") == "Citizen":
        query += " AND (submitted_by = ? OR submitted_by = 'citizen')"
        params.append(user.get("username", "citizen"))

    query += " ORDER BY created_at DESC"

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    doc_list = []
    summary_counts = {"total": 0, "submitted": 0, "under_review": 0, "approved": 0, "rejected": 0}

    for r in rows:
        d = dict(r)
        if isinstance(d.get("verification_checks_json"), str):
            try:
                d["verification_checks"] = json.loads(d["verification_checks_json"])
            except Exception:
                d["verification_checks"] = []
        else:
            d["verification_checks"] = []

        status_key = d["status"].lower()
        if status_key in summary_counts:
            summary_counts[status_key] += 1
        summary_counts["total"] += 1

        doc_list.append(d)

    return {
        "count": len(doc_list),
        "summary": summary_counts,
        "documents": doc_list,
    }


def review_document_verification(
    identifier: str,
    decision: str,
    remarks: str,
    user: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Officer review action (APPROVE / REJECT) with RBAC and immutable audit logging.
    Permitted roles: Registration Officer, Revenue Officer, Admin.
    """
    user_role = user.get("role", "")
    allowed_roles = ["registration officer", "revenue officer", "admin"]
    if user_role.lower() not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Role '{user_role}' is not authorized to approve or reject document verifications.",
        )

    doc = get_document_verification_by_id(identifier)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document verification '{identifier}' was not found.",
        )

    if doc["status"] in ["APPROVED", "REJECTED"]:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Document verification is already {doc['status']}. Further status changes are locked.",
        )

    decision_clean = decision.strip().upper()
    if decision_clean not in ["APPROVED", "REJECTED"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Decision must be either 'APPROVED' or 'REJECTED'.",
        )

    if decision_clean == "REJECTED" and not remarks.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Detailed remarks are mandatory when rejecting a document verification.",
        )

    now_iso = datetime.now(timezone.utc).isoformat()
    reviewer = user.get("username", "officer")

    conn = get_connection()
    cursor = conn.cursor()

    # Update document verification
    cursor.execute("""
        UPDATE document_verifications
        SET status = ?, reviewed_by = ?, reviewed_at = ?, remarks = ?, updated_at = ?
        WHERE doc_verification_id = ?
    """, (decision_clean, reviewer, now_iso, remarks, now_iso, doc["doc_verification_id"]))

    # Update linked service request
    cursor.execute("""
        UPDATE service_requests
        SET status = ?, updated_at = ?
        WHERE request_id = ?
    """, (decision_clean, now_iso, doc["request_id"]))

    conn.commit()
    conn.close()

    # Log Audit Event
    audit_action = f"DOCUMENT_VERIFICATION_{decision_clean}"
    log_audit_event(
        username=reviewer,
        role=user_role,
        action=audit_action,
        status=decision_clean,
        ulpin=doc["ulpin"],
        remarks=f"Officer {user.get('name', reviewer)} ({user_role}) decided {decision_clean}. Remarks: {remarks}",
        verification_id=doc["doc_verification_id"],
    )

    if decision_clean == "APPROVED":
        create_transaction(
            request_id=doc["doc_verification_id"],
            ulpin=doc["ulpin"],
            action="DOCUMENT_VERIFICATION_APPROVED",
            department="REGISTRATION",
            username=reviewer,
            role=user_role,
            status="SYNCHRONIZED",
            metadata={
                "doc_verification_id": doc["doc_verification_id"],
                "document_type": doc["document_type"],
                "document_name": doc["document_name"],
                "overall_result": doc.get("overall_result"),
                "remarks": remarks,
            },
        )

    return get_document_verification_by_id(doc["doc_verification_id"])



def seed_default_document_verifications():
    """Seed demonstration document records for KA0102030405 covering Match, Mismatch, and Needs Review."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) AS count FROM document_verifications")
    count = cursor.fetchone()["count"]

    if count > 0:
        conn.close()
        return

    now_iso = datetime.now(timezone.utc).isoformat()

    demo_cases = [
        {
            "doc_verification_id": "DOC-VERIF-001",
            "request_id": "REQ-DOCS-002",
            "ulpin": "KA0102030405",
            "document_type": "Sale Deed",
            "document_name": "Absolute Sale Deed (Registered)",
            "document_number": "BNG-DN-2021-008912",
            "document_date": "2021-04-12",
            "seller_owner_name": "Ramesh Kumar",
            "buyer_applicant_name": "Suresh Kumar",
            "area_mentioned": 2.45,
            "registration_reference": "BNG-DN-2021-008912",
            "additional_details": "Original registered absolute sale deed executed before SRO Bangalore South.",
            "status": "APPROVED",
            "overall_result": "MATCH",
            "submitted_by": "citizen",
            "submission_date": "2026-02-10T10:00:00Z",
            "reviewed_by": "registration.officer",
            "reviewed_at": "2026-02-12T14:30:00Z",
            "remarks": "Document metadata matches state registration index and revenue title records perfectly.",
        },
        {
            "doc_verification_id": "DOC-VERIF-002",
            "request_id": "REQ-DOCS-005",
            "ulpin": "KA0102030405",
            "document_type": "Land Ownership Document",
            "document_name": "Gift Deed (Conflicting Title Claim)",
            "document_number": "GIFT-2024-KA-9912",
            "document_date": "2024-06-18",
            "seller_owner_name": "Vikramaditya Hegde",
            "buyer_applicant_name": "Rohit Hegde",
            "area_mentioned": 4.10,
            "registration_reference": "SRO-RURAL-GIFT-88",
            "additional_details": "Claimant submitted gift deed asserting ownership over 4.10 hectares.",
            "status": "REJECTED",
            "overall_result": "MISMATCH",
            "submitted_by": "citizen",
            "submission_date": "2026-02-15T09:15:00Z",
            "reviewed_by": "registration.officer",
            "reviewed_at": "2026-02-16T11:00:00Z",
            "remarks": "Rejected due to critical seller title mismatch and area discrepancy exceeding recorded parcel bounds.",
        },
        {
            "doc_verification_id": "DOC-VERIF-003",
            "request_id": "REQ-DOCS-006",
            "ulpin": "KA0102030405",
            "document_type": "Survey Document",
            "document_name": "Tippani Survey Sketch & Partition Memo",
            "document_number": "SURV-2025-BLR-0044",
            "document_date": "2025-01-20",
            "seller_owner_name": "Ramesh Kumar",
            "buyer_applicant_name": "Ramesh Kumar & Co-heirs",
            "area_mentioned": 2.40,
            "registration_reference": "CADASTRE-PART-2025",
            "additional_details": "Application for cadastral re-survey and family partition documentation check.",
            "status": "UNDER_REVIEW",
            "overall_result": "NEEDS_REVIEW",
            "submitted_by": "revenue.officer",
            "submission_date": "2026-03-01T15:45:00Z",
            "reviewed_by": None,
            "reviewed_at": None,
            "remarks": None,
        },
    ]

    for item in demo_cases:
        checks_res = run_document_verification_checks(item, item["ulpin"])
        checks_json = json.dumps(checks_res["checks"])

        # Ensure parent service request exists to satisfy Foreign Key constraint
        cursor.execute("""
            INSERT OR IGNORE INTO service_requests (
                request_id, ulpin, service_type, applicant, assigned_role,
                status, description, priority, metadata_json, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            item["request_id"],
            item["ulpin"],
            "DOCUMENT_VERIFICATION",
            item["submitted_by"],
            "Registration Officer",
            item["status"],
            f"Document Verification: {item['document_name']}",
            "Normal",
            json.dumps({"doc_verification_id": item["doc_verification_id"], "overall_result": item["overall_result"]}),
            item["submission_date"],
            item["submission_date"],
        ))

        cursor.execute("""
            INSERT OR REPLACE INTO document_verifications (
                doc_verification_id, request_id, ulpin, document_type, document_name,
                document_number, document_date, seller_owner_name, buyer_applicant_name,
                area_mentioned, registration_reference, additional_details,
                status, overall_result, verification_checks_json, submitted_by,
                submission_date, reviewed_by, reviewed_at, remarks, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            item["doc_verification_id"],
            item["request_id"],
            item["ulpin"],
            item["document_type"],
            item["document_name"],
            item["document_number"],
            item["document_date"],
            item["seller_owner_name"],
            item["buyer_applicant_name"],
            item["area_mentioned"],
            item["registration_reference"],
            item["additional_details"],
            item["status"],
            item["overall_result"],
            checks_json,
            item["submitted_by"],
            item["submission_date"],
            item["reviewed_by"],
            item["reviewed_at"],
            item["remarks"],
            item["submission_date"],
            now_iso,
        ))

    conn.commit()
    conn.close()
