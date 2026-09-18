"""
LandSetu Backend — Parcel Subdivision Service

Manages end-to-end parcel subdivision workflows:
1. Validates subdivision requests via 10-point deterministic matrix.
2. Creates linked Service Request records and audit trail events.
3. Generates child parcel geometries via pure polygon splitting.
4. Processes officer approvals creating child parcel records.
"""

import json
import uuid
import math
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import HTTPException, status
from database import get_connection
from services.parcel_service import get_parcel_by_ulpin
from services.department_service import get_tax_detail, get_restrictions_detail, get_planning_detail
from services.service_request_service import create_service_request, update_service_request
from services.audit_service import log_audit_event
from services.blockchain_service import create_transaction



# ==========================================
# 10-Point Subdivision Validation Matrix
# ==========================================

def validate_subdivision_request(data: Dict[str, Any], parent_ulpin: str) -> Dict[str, Any]:
    """
    Execute 10-point deterministic validation matrix for subdivision request:
    1. Parent Parcel Exists
    2. Parent Parcel Status (Active)
    3. Ownership Verification
    4. Area Conservation (sum of children == parent area)
    5. Minimum Child Area (>= 0.1 acres)
    6. Number of Children Consistency
    7. Property Tax Dues Check
    8. Legal Restrictions / Encumbrance Check
    9. Planning Zone Compliance
    10. Duplicate Request Prevention
    """
    parcel = get_parcel_by_ulpin(parent_ulpin)
    checks = []

    # 1. Parent Parcel Exists
    if not parcel:
        checks.append({
            "check": "PARENT_EXISTS",
            "name": "Parent Parcel Existence",
            "result": "FAIL",
            "details": f"Parcel with ULPIN '{parent_ulpin}' was not found in LandSetu registry.",
        })
        return {
            "overall_result": "INVALID",
            "checks": checks,
            "summary": "Parent parcel does not exist in the cadastral registry.",
        }

    checks.append({
        "check": "PARENT_EXISTS",
        "name": "Parent Parcel Existence",
        "result": "PASS",
        "details": f"Parent parcel '{parent_ulpin}' found. Owner: {parcel.get('owner_name')}.",
    })

    # 2. Parent Parcel Status
    parcel_status = parcel.get("status", "Active")
    is_active = "active" in parcel_status.lower()
    checks.append({
        "check": "PARENT_STATUS",
        "name": "Parent Parcel Status",
        "result": "PASS" if is_active else "FAIL",
        "details": f"Parcel status: {parcel_status}." + (" Eligible for subdivision." if is_active else " Inactive or subdivided parcels cannot be subdivided."),
    })

    # 3. Ownership Verification
    applicant = data.get("applicant", "")
    record_owner = parcel.get("owner_name", "")
    owner_match = (
        applicant.lower() == record_owner.lower()
        or applicant.lower() in record_owner.lower()
        or record_owner.lower() in applicant.lower()
        or applicant in ["citizen", "admin"]  # Demo users
    )
    checks.append({
        "check": "OWNERSHIP",
        "name": "Applicant Ownership Verification",
        "result": "PASS" if owner_match else "NEEDS_REVIEW",
        "details": f"Applicant '{applicant}' vs recorded owner '{record_owner}'." + (" Ownership verified." if owner_match else " Officer review required to confirm applicant authority."),
    })

    # 4. Area Conservation
    proposed = data.get("proposed_children", [])
    parent_area = float(parcel.get("area_acres", 0))
    total_proposed = sum(float(c.get("area_acres", 0)) for c in proposed)
    area_diff = abs(parent_area - total_proposed)
    area_ok = area_diff <= 0.01  # tolerance for float precision
    checks.append({
        "check": "AREA_CONSERVATION",
        "name": "Area Conservation Check",
        "result": "PASS" if area_ok else "FAIL",
        "details": f"Parent area: {parent_area:.2f} acres. Sum of proposed children: {total_proposed:.2f} acres. Difference: {area_diff:.3f} acres." + (" Total area conserved." if area_ok else " Total proposed area does NOT match parent parcel area."),
    })

    # 5. Minimum Child Area
    min_area = min((float(c.get("area_acres", 0)) for c in proposed), default=0)
    min_ok = min_area >= 0.1
    checks.append({
        "check": "MIN_CHILD_AREA",
        "name": "Minimum Child Parcel Area",
        "result": "PASS" if min_ok else "FAIL",
        "details": f"Smallest proposed child area: {min_area:.2f} acres." + (" Meets minimum threshold (≥ 0.10 acres)." if min_ok else " Below minimum permissible area of 0.10 acres."),
    })

    # 6. Children Count Consistency
    num_children = int(data.get("num_children", 0))
    actual_count = len(proposed)
    count_ok = num_children == actual_count and 2 <= num_children <= 3
    checks.append({
        "check": "CHILDREN_COUNT",
        "name": "Child Parcel Count Consistency",
        "result": "PASS" if count_ok else "FAIL",
        "details": f"Declared: {num_children} children. Provided: {actual_count} proposals." + (" Consistent." if count_ok else " Mismatch or outside permitted range (2-3)."),
    })

    # 7. Property Tax Dues
    tax = get_tax_detail(parent_ulpin) or {}
    tax_status = tax.get("payment_status", "Paid / Up to date")
    outstanding = float(tax.get("outstanding_amount", 0.0))
    tax_clear = "paid" in tax_status.lower() and outstanding == 0.0
    checks.append({
        "check": "TAX_STATUS",
        "name": "Property Tax Clearance",
        "result": "PASS" if tax_clear else "NEEDS_REVIEW",
        "details": f"Tax status: {tax_status}. Outstanding: ₹{outstanding:,.2f}." + (" Property tax cleared." if tax_clear else " Outstanding tax dues require clearance before subdivision."),
    })

    # 8. Legal Restrictions
    restrictions = get_restrictions_detail(parent_ulpin) or {}
    restr_status = restrictions.get("status", "Clear / Standard Record")
    court_stay = restrictions.get("court_stay_status", "No Active Court Stay")
    is_restricted = "dispute" in restr_status.lower() or "stay" in court_stay.lower() or "injunction" in court_stay.lower()
    checks.append({
        "check": "RESTRICTIONS",
        "name": "Legal Encumbrance & Court Stay Check",
        "result": "FAIL" if is_restricted else "PASS",
        "details": f"Restriction status: {restr_status}. Court stay: {court_stay}." + (" No active legal impediments." if not is_restricted else " Active legal restriction blocks subdivision."),
    })

    # 9. Planning Zone Compliance
    planning = get_planning_detail(parent_ulpin) or {}
    zone = planning.get("master_plan_zone", "Residential")
    conversion = planning.get("conversion_status", "Not Required")
    green_belt = planning.get("green_belt_clearance", "N/A")
    planning_ok = "prohibited" not in zone.lower() and "blocked" not in conversion.lower()
    checks.append({
        "check": "PLANNING_ZONE",
        "name": "Planning & Zoning Compliance",
        "result": "PASS" if planning_ok else "NEEDS_REVIEW",
        "details": f"Master plan zone: {zone}. Conversion status: {conversion}. Green belt: {green_belt}." + (" Zone permits subdivision." if planning_ok else " Planning zone restrictions may apply."),
    })

    # 10. Duplicate Request Prevention
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT COUNT(*) AS count FROM parcel_subdivisions
        WHERE parent_ulpin = ? AND status IN ('SUBMITTED', 'UNDER_REVIEW')
    """, (parent_ulpin,))
    pending_count = cursor.fetchone()["count"]
    conn.close()

    dup_ok = pending_count == 0
    checks.append({
        "check": "DUPLICATE_CHECK",
        "name": "Duplicate Request Prevention",
        "result": "PASS" if dup_ok else "FAIL",
        "details": f"Pending subdivision requests for this parcel: {pending_count}." + (" No conflicting requests." if dup_ok else " An active subdivision request already exists for this parcel."),
    })

    # Determine overall result
    results = [c["result"] for c in checks]
    if "FAIL" in results:
        overall = "INVALID"
        summary = "Subdivision request failed one or more mandatory validation checks."
    elif "NEEDS_REVIEW" in results:
        overall = "NEEDS_REVIEW"
        summary = "Subdivision request requires officer review before approval."
    else:
        overall = "VALID"
        summary = "All 10 validation checks passed. Subdivision is eligible for officer approval."

    return {
        "overall_result": overall,
        "checks": checks,
        "summary": summary,
        "tax_status": "CLEAR" if tax_clear else "NEEDS_REVIEW",
        "restriction_status": "RESTRICTED" if is_restricted else "CLEAR",
    }


# ==========================================
# Child Geometry Generation
# ==========================================

def generate_child_geometries(parent_geojson: Dict[str, Any], n_children: int) -> List[Dict[str, Any]]:
    """
    Split parent polygon into n equal horizontal strips as valid GeoJSON.
    Pure geometry math — no external dependencies.
    """
    if not parent_geojson or parent_geojson.get("type") != "Polygon":
        # Generate synthetic rectangle polygons as fallback
        base_lat, base_lng = 13.14, 77.58
        width = 0.005
        height = 0.004
        children = []
        strip_height = height / n_children

        for i in range(n_children):
            y_start = base_lat + (i * strip_height)
            y_end = base_lat + ((i + 1) * strip_height)
            child_coords = [
                [base_lng, y_start],
                [base_lng + width, y_start],
                [base_lng + width, y_end],
                [base_lng, y_end],
                [base_lng, y_start],  # close ring
            ]
            children.append({
                "type": "Polygon",
                "coordinates": [child_coords],
            })
        return children

    # Real polygon splitting: get bounding box and split horizontally
    coordinates = parent_geojson["coordinates"][0]  # outer ring
    lats = [c[1] for c in coordinates]
    lngs = [c[0] for c in coordinates]

    min_lat, max_lat = min(lats), max(lats)
    min_lng, max_lng = min(lngs), max(lngs)

    lat_range = max_lat - min_lat
    strip_height = lat_range / n_children

    children = []
    for i in range(n_children):
        y_start = min_lat + (i * strip_height)
        y_end = min_lat + ((i + 1) * strip_height)

        child_coords = [
            [min_lng, y_start],
            [max_lng, y_start],
            [max_lng, y_end],
            [min_lng, y_end],
            [min_lng, y_start],  # close ring
        ]
        children.append({
            "type": "Polygon",
            "coordinates": [child_coords],
        })

    return children


# ==========================================
# CRUD Operations
# ==========================================

def create_subdivision_request(data: Dict[str, Any], user: Dict[str, Any]) -> Dict[str, Any]:
    """Submit a new parcel subdivision request."""
    parent_ulpin = data.get("parent_ulpin", "").strip().upper()
    parcel = get_parcel_by_ulpin(parent_ulpin)
    if not parcel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Parcel with ULPIN '{parent_ulpin}' not found.",
        )

    num_children = int(data.get("num_children", 2))
    if num_children < 2 or num_children > 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Number of child parcels must be 2 or 3.",
        )

    proposed_children = data.get("proposed_children", [])
    if len(proposed_children) != num_children:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Expected {num_children} child proposals but received {len(proposed_children)}.",
        )

    applicant = user.get("username", "citizen")
    reason = data.get("reason", "").strip()
    supporting_doc_id = data.get("supporting_doc_id")

    # Run validation
    validation_data = {
        "applicant": applicant,
        "num_children": num_children,
        "proposed_children": proposed_children,
    }
    validation = validate_subdivision_request(validation_data, parent_ulpin)

    # Create linked Service Request
    parent_area = float(parcel.get("area_acres", 0))
    child_areas_str = ", ".join([f"{float(c.get('area_acres', 0)):.2f} ac" for c in proposed_children])
    service_req = create_service_request(
        data={
            "ulpin": parent_ulpin,
            "service_type": "PARCEL_SUBDIVISION",
            "description": f"Parcel Subdivision: Split '{parent_ulpin}' ({parent_area:.2f} acres) into {num_children} children [{child_areas_str}].",
            "priority": "Normal",
            "metadata": {
                "num_children": num_children,
                "proposed_children": proposed_children,
                "reason": reason,
            },
        },
        user=user,
    )

    request_id = service_req["request_id"]
    subdivision_id = f"SUB-{uuid.uuid4().hex[:8].upper()}"
    now_iso = datetime.now(timezone.utc).isoformat()

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO parcel_subdivisions (
            subdivision_id, request_id, parent_ulpin, applicant, num_children,
            proposed_children_json, reason, supporting_doc_id,
            status, tax_status, restriction_status, validation_result,
            created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        subdivision_id,
        request_id,
        parent_ulpin,
        applicant,
        num_children,
        json.dumps(proposed_children),
        reason or "Parcel subdivision request submitted via LandSetu platform.",
        supporting_doc_id,
        "SUBMITTED",
        validation.get("tax_status", "PENDING"),
        validation.get("restriction_status", "PENDING"),
        validation["overall_result"],
        now_iso,
        now_iso,
    ))

    conn.commit()
    conn.close()

    # Log audit event
    log_audit_event(
        username=applicant,
        role=user.get("role", "Citizen"),
        action="SUBDIVISION_CREATED",
        status="SUBMITTED",
        ulpin=parent_ulpin,
        remarks=f"Subdivision request '{subdivision_id}' created to split into {num_children} child parcels.",
        verification_id=request_id,
    )

    return get_subdivision_by_id(subdivision_id)


def get_subdivision_by_id(identifier: str) -> Optional[Dict[str, Any]]:
    """Retrieve single subdivision record by subdivision_id or request_id."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT subdivision_id, request_id, parent_ulpin, applicant, num_children,
               proposed_children_json, reason, supporting_doc_id,
               status, tax_status, restriction_status, validation_result,
               reviewed_by, reviewed_at, remarks, created_at, updated_at
        FROM parcel_subdivisions
        WHERE subdivision_id = ? OR request_id = ?
    """, (identifier, identifier))

    row = cursor.fetchone()
    if not row:
        conn.close()
        return None

    res = dict(row)

    # Parse proposed children JSON
    try:
        res["proposed_children"] = json.loads(res.pop("proposed_children_json", "[]"))
    except (json.JSONDecodeError, TypeError):
        res["proposed_children"] = []

    # Get parent parcel summary
    res["parent_parcel_summary"] = get_parcel_by_ulpin(res["parent_ulpin"])

    # Run live validation
    validation_data = {
        "applicant": res["applicant"],
        "num_children": res["num_children"],
        "proposed_children": res["proposed_children"],
    }
    validation = validate_subdivision_request(validation_data, res["parent_ulpin"])
    res["validation_checks"] = validation["checks"]
    res["validation_result"] = validation["overall_result"]

    # Get child parcels if approved
    cursor.execute("""
        SELECT child_parcel_id, parent_ulpin, subdivision_id, child_index,
               owner_name, area_acres, area_hectares, land_type, land_use,
               status, geometry_json, created_at
        FROM child_parcels
        WHERE subdivision_id = ?
        ORDER BY child_index
    """, (res["subdivision_id"],))

    child_rows = cursor.fetchall()
    conn.close()

    res["child_parcels"] = []
    for cr in child_rows:
        child = dict(cr)
        try:
            child["geometry"] = json.loads(child.pop("geometry_json", "null"))
        except (json.JSONDecodeError, TypeError):
            child["geometry"] = None
        res["child_parcels"].append(child)

    return res


def get_subdivisions(
    ulpin: Optional[str] = None,
    status_filter: Optional[str] = None,
    user: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """List and filter subdivision records with role scoping."""
    conn = get_connection()
    cursor = conn.cursor()

    query = """
        SELECT subdivision_id, request_id, parent_ulpin, applicant, num_children,
               proposed_children_json, reason, supporting_doc_id,
               status, tax_status, restriction_status, validation_result,
               reviewed_by, reviewed_at, remarks, created_at, updated_at
        FROM parcel_subdivisions
        WHERE 1=1
    """
    params = []

    if status_filter:
        query += " AND status = ?"
        params.append(status_filter)

    if ulpin:
        query += " AND parent_ulpin = ?"
        params.append(ulpin)

    # Citizen scoping
    if user and user.get("role") == "Citizen":
        query += " AND (applicant = ? OR applicant = 'citizen')"
        params.append(user.get("username", "citizen"))

    query += " ORDER BY created_at DESC"

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    subdivisions_list = []
    summary_counts = {
        "total": 0,
        "submitted": 0,
        "under_review": 0,
        "approved": 0,
        "rejected": 0,
    }

    for r in rows:
        row_dict = dict(r)

        try:
            row_dict["proposed_children"] = json.loads(row_dict.pop("proposed_children_json", "[]"))
        except (json.JSONDecodeError, TypeError):
            row_dict["proposed_children"] = []

        row_dict["parent_parcel_summary"] = get_parcel_by_ulpin(row_dict["parent_ulpin"])
        row_dict["validation_checks"] = []
        row_dict["child_parcels"] = []

        st = row_dict["status"].lower()
        summary_counts["total"] += 1
        if st in summary_counts:
            summary_counts[st] += 1

        subdivisions_list.append(row_dict)

    return {
        "count": len(subdivisions_list),
        "summary": summary_counts,
        "subdivisions": subdivisions_list,
    }


def approve_subdivision(
    identifier: str,
    remarks: str,
    user: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Approve subdivision request:
    1. Create child parcel records with generated IDs (e.g. KA0102030405-01).
    2. Update parent parcel status to SUBDIVIDED.
    3. Update linked service request.
    4. Log audit events.
    """
    user_role = user.get("role", "Citizen")
    allowed_roles = ["Revenue Officer", "Municipal Officer", "Administrator", "Admin"]
    if user_role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Role '{user_role}' is not authorized to approve subdivisions.",
        )

    record = get_subdivision_by_id(identifier)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Subdivision record '{identifier}' was not found.",
        )

    if record["status"] in ["APPROVED", "REJECTED", "COMPLETED"]:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Subdivision '{identifier}' is already in terminal state '{record['status']}'.",
        )

    if not remarks or len(remarks.strip()) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Official review remarks are mandatory.",
        )

    parent_ulpin = record["parent_ulpin"]
    subdivision_id = record["subdivision_id"]
    request_id = record["request_id"]
    proposed = record.get("proposed_children", [])
    parcel = get_parcel_by_ulpin(parent_ulpin)
    now_iso = datetime.now(timezone.utc).isoformat()
    reviewer = user.get("username", "officer")

    # Generate child geometries
    parent_geojson = None  # We don't store actual geometries yet in the demo
    child_geometries = generate_child_geometries(parent_geojson, len(proposed))

    conn = get_connection()
    cursor = conn.cursor()

    # Create child parcel records
    for i, child_proposal in enumerate(proposed):
        child_index = i + 1
        child_id = f"{parent_ulpin}-{child_index:02d}"
        child_area_acres = float(child_proposal.get("area_acres", 1.0))
        child_area_hectares = round(child_area_acres * 0.404686, 4)
        child_owner = child_proposal.get("owner_name", parcel.get("owner_name", "Owner"))
        geometry_json = json.dumps(child_geometries[i]) if i < len(child_geometries) else None

        cursor.execute("""
            INSERT OR IGNORE INTO child_parcels (
                child_parcel_id, parent_ulpin, subdivision_id, child_index,
                owner_name, area_acres, area_hectares, land_type, land_use,
                status, geometry_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            child_id,
            parent_ulpin,
            subdivision_id,
            child_index,
            child_owner,
            child_area_acres,
            child_area_hectares,
            parcel.get("land_type", "Agricultural"),
            parcel.get("land_use", "Agricultural"),
            "Active",
            geometry_json,
            now_iso,
        ))

    # Update parent parcel status to SUBDIVIDED
    cursor.execute("""
        UPDATE parcels SET status = 'Subdivided', updated_at = ? WHERE ulpin = ?
    """, (now_iso, parent_ulpin))

    # Update subdivision record
    cursor.execute("""
        UPDATE parcel_subdivisions
        SET status = 'APPROVED', reviewed_by = ?, reviewed_at = ?, remarks = ?, updated_at = ?
        WHERE subdivision_id = ?
    """, (reviewer, now_iso, remarks, now_iso, subdivision_id))

    conn.commit()
    conn.close()

    # Update linked service request
    try:
        update_service_request(
            request_id=request_id,
            updates={
                "status": "COMPLETED",
                "remarks": f"Subdivision approved. {len(proposed)} child parcels created. Remarks: {remarks}",
            },
            user=user,
        )
    except Exception:
        pass

    # Audit events
    log_audit_event(
        username=reviewer,
        role=user_role,
        action="SUBDIVISION_APPROVED",
        status="APPROVED",
        ulpin=parent_ulpin,
        remarks=f"Subdivision '{subdivision_id}' approved. {len(proposed)} child parcels created.",
        verification_id=request_id,
    )

    log_audit_event(
        username=reviewer,
        role=user_role,
        action="PARENT_PARCEL_SUBDIVIDED",
        status="SUBDIVIDED",
        ulpin=parent_ulpin,
        remarks=f"Parent parcel '{parent_ulpin}' marked as SUBDIVIDED after subdivision approval.",
        verification_id=request_id,
    )

    # Append to Permissioned Digital Ledger
    create_transaction(
        request_id=subdivision_id,
        ulpin=parent_ulpin,
        action="SUBDIVISION_APPROVED",
        department="MUNICIPAL",
        username=reviewer,
        role=user_role,
        status="SYNCHRONIZED",
        metadata={
            "subdivision_id": subdivision_id,
            "parent_ulpin": parent_ulpin,
            "num_children": len(proposed),
            "child_ids": [f"{parent_ulpin}-0{i+1}" for i in range(len(proposed))],
            "remarks": remarks,
        },
    )

    return get_subdivision_by_id(subdivision_id)



def reject_subdivision(
    identifier: str,
    remarks: str,
    user: Dict[str, Any],
) -> Dict[str, Any]:
    """Reject subdivision request with mandatory remarks."""
    user_role = user.get("role", "Citizen")
    allowed_roles = ["Revenue Officer", "Municipal Officer", "Administrator", "Admin"]
    if user_role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Role '{user_role}' is not authorized to reject subdivisions.",
        )

    record = get_subdivision_by_id(identifier)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Subdivision record '{identifier}' was not found.",
        )

    if record["status"] in ["APPROVED", "REJECTED", "COMPLETED"]:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Subdivision '{identifier}' is already in terminal state '{record['status']}'.",
        )

    if not remarks or len(remarks.strip()) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Official review remarks are mandatory for rejection.",
        )

    subdivision_id = record["subdivision_id"]
    request_id = record["request_id"]
    parent_ulpin = record["parent_ulpin"]
    now_iso = datetime.now(timezone.utc).isoformat()
    reviewer = user.get("username", "officer")

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE parcel_subdivisions
        SET status = 'REJECTED', reviewed_by = ?, reviewed_at = ?, remarks = ?, updated_at = ?
        WHERE subdivision_id = ?
    """, (reviewer, now_iso, remarks, now_iso, subdivision_id))
    conn.commit()
    conn.close()

    try:
        update_service_request(
            request_id=request_id,
            updates={"status": "REJECTED", "remarks": f"Subdivision rejected. Remarks: {remarks}"},
            user=user,
        )
    except Exception:
        pass

    log_audit_event(
        username=reviewer,
        role=user_role,
        action="SUBDIVISION_REJECTED",
        status="REJECTED",
        ulpin=parent_ulpin,
        remarks=f"Subdivision '{subdivision_id}' rejected. Remarks: {remarks}",
        verification_id=request_id,
    )

    return get_subdivision_by_id(subdivision_id)


def get_child_parcels(parent_ulpin: str) -> List[Dict[str, Any]]:
    """Get all child parcels for a given parent ULPIN."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT child_parcel_id, parent_ulpin, subdivision_id, child_index,
               owner_name, area_acres, area_hectares, land_type, land_use,
               status, geometry_json, created_at
        FROM child_parcels
        WHERE parent_ulpin = ?
        ORDER BY child_index
    """, (parent_ulpin,))

    rows = cursor.fetchall()
    conn.close()

    children = []
    for r in rows:
        child = dict(r)
        try:
            child["geometry"] = json.loads(child.pop("geometry_json", "null"))
        except (json.JSONDecodeError, TypeError):
            child["geometry"] = None
        children.append(child)

    return children


def seed_default_subdivisions():
    """Seed demo subdivision request if table is empty."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) AS count FROM parcel_subdivisions")
    count = cursor.fetchone()["count"]

    if count > 0:
        conn.close()
        return

    now_iso = datetime.now(timezone.utc).isoformat()
    subdivision_id = "SUB-DEMO-001"
    request_id = "REQ-SUBD-004"


    proposed = [
        {"child_index": 1, "owner_name": "Rajesh Kumar", "area_acres": 3.5, "remarks": "Northern plot"},
        {"child_index": 2, "owner_name": "Suresh Kumar", "area_acres": 2.55, "remarks": "Southern plot"},
    ]

    cursor.execute("""
        INSERT INTO parcel_subdivisions (
            subdivision_id, request_id, parent_ulpin, applicant, num_children,
            proposed_children_json, reason, supporting_doc_id,
            status, tax_status, restriction_status, validation_result,
            created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        subdivision_id,
        request_id,
        "KA0102030405",
        "citizen",
        2,
        json.dumps(proposed),
        "Family partition of agricultural land between two sons.",
        None,
        "SUBMITTED",
        "CLEAR",
        "CLEAR",
        "NEEDS_REVIEW",
        now_iso,
        now_iso,
    ))

    conn.commit()
    conn.close()
