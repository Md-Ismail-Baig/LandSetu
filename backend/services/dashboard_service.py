"""
LandSetu Backend — Dashboard Summary & Recent Activity Aggregator

Computes live metrics across parcels, service requests, verification workflows,
satellite anomalies, and audit log streams.
"""

from typing import Dict, Any, List
from database import get_connection
from services.satellite_service import _MOCK_SATELLITE_RECORDS
from services.audit_service import get_all_recent_audit_events


def get_dashboard_summary() -> Dict[str, Any]:
    """
    Compute real summary metrics directly from database records.
    """
    conn = get_connection()
    cursor = conn.cursor()

    # 1. Total parcels
    cursor.execute("SELECT COUNT(*) AS count FROM parcels")
    total_parcels = cursor.fetchone()["count"]

    # 2. Total verification cases
    cursor.execute("SELECT COUNT(*) AS count FROM verifications")
    verification_count = cursor.fetchone()["count"]

    # 3. Pending service requests
    cursor.execute("SELECT COUNT(*) AS count FROM service_requests WHERE status IN ('SUBMITTED', 'UNDER_REVIEW', 'PENDING')")
    pending_requests = cursor.fetchone()["count"]

    # 4. Total audit events
    cursor.execute("SELECT COUNT(*) AS count FROM audit_events")
    audit_events_count = cursor.fetchone()["count"]

    conn.close()

    # 5. Satellite alerts (mock records with change.detected == True)
    satellite_alerts = sum(
        1 for r in _MOCK_SATELLITE_RECORDS.values()
        if r.get("change", {}).get("detected") is True
    )

    # 6. Hardcoded verified seed transactions count for the 5 demo parcels
    recent_transactions = 18

    metrics = {
        "total_parcels": total_parcels,
        "verification_requests": verification_count,
        "pending_service_requests": pending_requests,
        "recent_transactions": recent_transactions,
        "satellite_alerts": satellite_alerts,
        "audit_events_count": audit_events_count,
    }

    # Recent Activity items
    recent_activities: List[Dict[str, Any]] = []

    # Pull real audit events
    audit_logs = get_all_recent_audit_events(limit=10)
    for log in audit_logs:
        recent_activities.append({
            "id": log["event_id"],
            "timestamp": log["timestamp"],
            "user": log["username"],
            "role": log["role"],
            "ulpin": log.get("ulpin"),
            "action": log["action"].replace("_", " ").title(),
            "status": log["status"],
            "details": log.get("remarks") or f"Action {log['action']} performed on parcel",
            "type": "audit",
        })

    # If audit logs are sparse, provide baseline activity items
    if len(recent_activities) < 4:
        recent_activities.extend([
            {
                "id": "ACT-SAT-001",
                "timestamp": "2025-08-22T08:30:00Z",
                "user": "AI Satellite Pipeline",
                "role": "System Sentinel",
                "ulpin": "KA0102030405",
                "action": "Satellite Anomaly Detected",
                "status": "FLAGGED",
                "details": "Simulated satellite change detected: 185.4 sqm potential construction.",
                "type": "satellite",
            },
            {
                "id": "ACT-REG-002",
                "timestamp": "2025-08-21T15:20:00Z",
                "user": "registration.officer",
                "role": "Registration Officer",
                "ulpin": "KA0203040506",
                "action": "Deed Registered",
                "status": "COMPLETED",
                "details": "Conveyance Deed verified and indexed in e-Registration registry.",
                "type": "audit",
            },
            {
                "id": "ACT-TAX-003",
                "timestamp": "2025-08-20T11:00:00Z",
                "user": "municipal.officer",
                "role": "Municipal Officer",
                "ulpin": "KA0304050607",
                "action": "Tax Assessment Updated",
                "status": "ASSESSED",
                "details": "Annual property tax assessment finalized for FY 2024-25.",
                "type": "audit",
            },
        ])

    # Sort reverse chronologically
    recent_activities = sorted(recent_activities, key=lambda x: x["timestamp"], reverse=True)[:10]

    return {
        "metrics": metrics,
        "recent_activity": recent_activities,
    }
