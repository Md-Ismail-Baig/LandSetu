"""
LandSetu Backend — Permissioned Digital Ledger Service

Simulates a permissioned blockchain ledger backed by SHA-256 cryptographic hash chaining.
Provides tamper-evident audit logging for high-integrity land administration operations.
"""

import hashlib
import json
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from database import get_connection

GENESIS_PREVIOUS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"


def canonicalize_json(data: Optional[Dict[str, Any]]) -> str:
    """Format metadata into a deterministic, sorted JSON string for SHA-256 hashing."""
    if not data:
        return "{}"
    return json.dumps(data, sort_keys=True, separators=(",", ":"))


def calculate_block_hash(
    transaction_id: str,
    request_id: Optional[str],
    ulpin: Optional[str],
    action: str,
    department: str,
    username: str,
    role: str,
    timestamp: str,
    status: str,
    previous_hash: str,
    canonical_metadata: str,
) -> str:
    """Compute deterministic SHA-256 hash for a ledger block."""
    payload = f"{transaction_id}|{request_id or ''}|{ulpin or ''}|{action}|{department}|{username}|{role}|{timestamp}|{status}|{previous_hash}|{canonical_metadata}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def init_ledger() -> Dict[str, Any]:
    """Initialize genesis block if the ledger is currently empty."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) as count FROM blockchain_transactions")
    row = cursor.fetchone()
    count = row["count"] if row else 0

    if count == 0:
        tx_id = "TX-GENESIS-000000"
        timestamp = "2026-01-01T00:00:00Z"
        action = "GENESIS_BLOCK"
        department = "SYSTEM"
        username = "system"
        role = "ADMIN"
        status = "GENESIS"
        metadata = canonicalize_json({"note": "LandSetu Permissioned Ledger Genesis Block"})

        tx_hash = calculate_block_hash(
            transaction_id=tx_id,
            request_id="REQ-GENESIS",
            ulpin="KA0000000000",
            action=action,
            department=department,
            username=username,
            role=role,
            timestamp=timestamp,
            status=status,
            previous_hash=GENESIS_PREVIOUS_HASH,
            canonical_metadata=metadata,
        )

        cursor.execute("""
            INSERT INTO blockchain_transactions (
                transaction_id, request_id, ulpin, action, department, username, role,
                timestamp, status, previous_hash, transaction_hash, metadata_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            tx_id, "REQ-GENESIS", "KA0000000000", action, department, username, role,
            timestamp, status, GENESIS_PREVIOUS_HASH, tx_hash, metadata, timestamp
        ))

        conn.commit()
        conn.close()

        return {
            "transaction_id": tx_id,
            "status": "GENESIS_CREATED",
            "transaction_hash": tx_hash,
        }

    conn.close()
    return {"status": "ALREADY_INITIALIZED", "count": count}


def create_transaction(
    action: str,
    department: str,
    username: str,
    role: str,
    request_id: Optional[str] = None,
    ulpin: Optional[str] = None,
    status: str = "SYNCHRONIZED",
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Append a new tamper-evident transaction to the permissioned digital ledger.
    Guarantees idempotency based on request_id + action.
    """
    conn = get_connection()
    cursor = conn.cursor()

    # Idempotency check
    if request_id:
        cursor.execute("""
            SELECT * FROM blockchain_transactions
            WHERE request_id = ? AND action = ?
        """, (request_id, action))
        existing = cursor.fetchone()
        if existing:
            conn.close()
            return dict(existing)

    # Fetch latest transaction for previous_hash
    cursor.execute("""
        SELECT transaction_hash FROM blockchain_transactions
        ORDER BY rowid DESC LIMIT 1
    """)
    last_tx = cursor.fetchone()
    previous_hash = last_tx["transaction_hash"] if last_tx else GENESIS_PREVIOUS_HASH

    tx_id = f"TX-{uuid.uuid4().hex[:8].upper()}"
    timestamp = datetime.now(timezone.utc).isoformat()
    canonical_meta = canonicalize_json(metadata or {})

    tx_hash = calculate_block_hash(
        transaction_id=tx_id,
        request_id=request_id,
        ulpin=ulpin,
        action=action,
        department=department,
        username=username,
        role=role,
        timestamp=timestamp,
        status=status,
        previous_hash=previous_hash,
        canonical_metadata=canonical_meta,
    )

    cursor.execute("""
        INSERT INTO blockchain_transactions (
            transaction_id, request_id, ulpin, action, department, username, role,
            timestamp, status, previous_hash, transaction_hash, metadata_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        tx_id, request_id, ulpin, action, department, username, role,
        timestamp, status, previous_hash, tx_hash, canonical_meta, timestamp
    ))

    conn.commit()
    conn.close()

    return {
        "transaction_id": tx_id,
        "request_id": request_id,
        "ulpin": ulpin,
        "action": action,
        "department": department,
        "username": username,
        "role": role,
        "timestamp": timestamp,
        "status": status,
        "previous_hash": previous_hash,
        "transaction_hash": tx_hash,
        "metadata_json": canonical_meta,
    }


def get_transactions(limit: int = 50, ulpin: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieve transaction history ordered from newest to oldest."""
    conn = get_connection()
    cursor = conn.cursor()

    if ulpin:
        cursor.execute("""
            SELECT * FROM blockchain_transactions
            WHERE ulpin = ?
            ORDER BY rowid DESC LIMIT ?
        """, (ulpin, limit))
    else:
        cursor.execute("""
            SELECT * FROM blockchain_transactions
            ORDER BY rowid DESC LIMIT ?
        """, (limit,))

    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def get_transaction_by_id(transaction_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve a single transaction by ID."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT * FROM blockchain_transactions
        WHERE transaction_id = ?
    """, (transaction_id,))

    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def verify_chain() -> Dict[str, Any]:
    """
    Verify full cryptographic integrity of the ledger.
    Checks sequence hashes and previous_hash continuity from Genesis onwards.
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM blockchain_transactions ORDER BY rowid ASC")
    rows = cursor.fetchall()
    conn.close()

    if not rows:
        return {
            "is_valid": True,
            "status": "VALID",
            "verified_count": 0,
            "broken_transaction": None,
            "details": "Ledger is empty.",
        }

    expected_prev_hash = GENESIS_PREVIOUS_HASH
    verified_count = 0

    for index, row in enumerate(rows):
        tx = dict(row)
        tx_id = tx["transaction_id"]

        # 1. Verify previous_hash linkage
        if index == 0:
            if tx["previous_hash"] != GENESIS_PREVIOUS_HASH:
                return {
                    "is_valid": False,
                    "status": "INVALID",
                    "verified_count": verified_count,
                    "broken_transaction": tx_id,
                    "details": f"Genesis block previous_hash mismatch. Expected {GENESIS_PREVIOUS_HASH}, found {tx['previous_hash']}.",
                }
        else:
            if tx["previous_hash"] != expected_prev_hash:
                return {
                    "is_valid": False,
                    "status": "INVALID",
                    "verified_count": verified_count,
                    "broken_transaction": tx_id,
                    "details": f"Broken chain link at block {tx_id}. Previous hash {tx['previous_hash']} does not match expected {expected_prev_hash}.",
                }

        # 2. Re-compute SHA-256 block hash
        computed_hash = calculate_block_hash(
            transaction_id=tx["transaction_id"],
            request_id=tx["request_id"],
            ulpin=tx["ulpin"],
            action=tx["action"],
            department=tx["department"],
            username=tx["username"],
            role=tx["role"],
            timestamp=tx["timestamp"],
            status=tx["status"],
            previous_hash=tx["previous_hash"],
            canonical_metadata=tx["metadata_json"] or "{}",
        )

        if computed_hash != tx["transaction_hash"]:
            return {
                "is_valid": False,
                "status": "INVALID",
                "verified_count": verified_count,
                "broken_transaction": tx_id,
                "details": f"Cryptographic tamper detected in transaction '{tx_id}'. Stored hash {tx['transaction_hash']} != Recomputed hash {computed_hash}.",
            }

        expected_prev_hash = tx["transaction_hash"]
        verified_count += 1

    return {
        "is_valid": True,
        "status": "VALID",
        "verified_count": verified_count,
        "latest_hash": expected_prev_hash,
        "broken_transaction": None,
        "details": f"Chain verified successfully across {verified_count} blocks. All hashes valid.",
    }


def tamper_transaction_test(transaction_id: str) -> Dict[str, Any]:
    """Dev/Demo test helper: Mutate metadata of a transaction to simulate data tampering."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM blockchain_transactions WHERE transaction_id = ?", (transaction_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return {"error": f"Transaction '{transaction_id}' not found."}

    # Alter metadata without updating transaction_hash
    tampered_meta = json.dumps({"tampered": True, "unauthorized_change": "Simulated record alteration"})
    cursor.execute("""
        UPDATE blockchain_transactions
        SET metadata_json = ?
        WHERE transaction_id = ?
    """, (tampered_meta, transaction_id))

    conn.commit()
    conn.close()
    return {"status": "TAMPERED", "transaction_id": transaction_id}


def repair_chain_test() -> Dict[str, Any]:
    """Dev/Demo test helper: Recalculate valid hashes for all transactions to restore integrity."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM blockchain_transactions ORDER BY rowid ASC")
    rows = cursor.fetchall()

    expected_prev = GENESIS_PREVIOUS_HASH
    repaired_count = 0

    for index, row in enumerate(rows):
        tx = dict(row)
        tx_id = tx["transaction_id"]
        prev = GENESIS_PREVIOUS_HASH if index == 0 else expected_prev

        new_hash = calculate_block_hash(
            transaction_id=tx_id,
            request_id=tx["request_id"],
            ulpin=tx["ulpin"],
            action=tx["action"],
            department=tx["department"],
            username=tx["username"],
            role=tx["role"],
            timestamp=tx["timestamp"],
            status=tx["status"],
            previous_hash=prev,
            canonical_metadata=tx["metadata_json"] or "{}",
        )

        cursor.execute("""
            UPDATE blockchain_transactions
            SET previous_hash = ?, transaction_hash = ?
            WHERE transaction_id = ?
        """, (prev, new_hash, tx_id))

        expected_prev = new_hash
        repaired_count += 1

    conn.commit()
    conn.close()
    return {"status": "REPAIRED", "repaired_count": repaired_count}
