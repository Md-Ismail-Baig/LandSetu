"""
LandSetu Backend — Audit Service

Provides persistent audit event logging and retrieval.
Records every state-changing workflow event and administrative action.
"""

import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from database import get_connection


def log_audit_event(
    username: str,
    role: str,
    action: str,
    status: str,
    ulpin: Optional[str] = None,
    remarks: Optional[str] = None,
    verification_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Append an immutable audit event to the database.
    """
    event_id = f"AUD-{uuid.uuid4().hex[:8].upper()}"
    timestamp = datetime.now(timezone.utc).isoformat()

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO audit_events (
            event_id, timestamp, username, role, ulpin, action, status, remarks, verification_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        event_id,
        timestamp,
        username,
        role,
        ulpin,
        action,
        status,
        remarks,
        verification_id,
    ))

    conn.commit()
    conn.close()

    return {
        "event_id": event_id,
        "timestamp": timestamp,
        "username": username,
        "role": role,
        "ulpin": ulpin,
        "action": action,
        "status": status,
        "remarks": remarks,
        "verification_id": verification_id,
    }


def get_parcel_audit_events(ulpin: str) -> List[Dict[str, Any]]:
    """
    Retrieve all audit events for a specific parcel in reverse chronological order.
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT event_id, timestamp, username, role, ulpin, action, status, remarks, verification_id
        FROM audit_events
        WHERE ulpin = ?
        ORDER BY timestamp DESC
    """, (ulpin,))

    rows = cursor.fetchall()
    conn.close()

    return [dict(row) for row in rows]


def get_all_recent_audit_events(limit: int = 20) -> List[Dict[str, Any]]:
    """
    Retrieve recent platform-wide audit events.
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT event_id, timestamp, username, role, ulpin, action, status, remarks, verification_id
        FROM audit_events
        ORDER BY timestamp DESC
        LIMIT ?
    """, (limit,))

    rows = cursor.fetchall()
    conn.close()

    return [dict(row) for row in rows]


def get_audit_events(limit: int = 50) -> List[Dict[str, Any]]:
    """Alias for retrieving recent platform-wide audit events."""
    return get_all_recent_audit_events(limit=limit)
