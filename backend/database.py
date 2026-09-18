"""
LandSetu Backend — Database

SQLite initialization, connection helper, and schema creation.
Schema is designed to be compatible with PostgreSQL/PostGIS migration later.
"""

import sqlite3
import os
from config import DATABASE_PATH


def get_db_path():
    """Return the absolute path to the database file."""
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), DATABASE_PATH)


def get_connection():
    """Create and return a new SQLite connection with row_factory enabled."""
    database_path = get_db_path()
    database_directory = os.path.dirname(database_path)
    if database_directory:
        os.makedirs(database_directory, exist_ok=True)
    conn = sqlite3.connect(database_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    """Create all tables if they do not exist."""
    conn = get_connection()
    cursor = conn.cursor()

    # 1. Parcels master ledger
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS parcels (
            ulpin TEXT PRIMARY KEY,
            survey_number TEXT NOT NULL,
            owner_name TEXT NOT NULL,
            father_name TEXT,
            area_hectares REAL NOT NULL,
            area_acres REAL NOT NULL,
            district TEXT NOT NULL,
            taluk TEXT NOT NULL,
            hobli TEXT NOT NULL,
            village TEXT NOT NULL,
            state TEXT NOT NULL DEFAULT 'Karnataka',
            land_type TEXT NOT NULL,
            land_use TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Active',
            last_transaction_date TEXT,
            encumbrances TEXT DEFAULT '[]',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """)

    # 2. Verification Workflow records (Phase 6 / Phase 7)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS verifications (
            verification_id TEXT PRIMARY KEY,
            ulpin TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'PENDING',
            requested_by TEXT NOT NULL,
            reviewed_by TEXT,
            change_type TEXT,
            remarks TEXT,
            decision TEXT,
            created_at TEXT NOT NULL,
            reviewed_at TEXT,
            FOREIGN KEY (ulpin) REFERENCES parcels(ulpin)
        )
    """)

    # 3. Generic Audit Trail Events
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS audit_events (
            event_id TEXT PRIMARY KEY,
            timestamp TEXT NOT NULL,
            username TEXT NOT NULL,
            role TEXT NOT NULL,
            ulpin TEXT,
            action TEXT NOT NULL,
            status TEXT NOT NULL,
            remarks TEXT,
            verification_id TEXT
        )
    """)

    # 4. Generic Service Request Framework (Phase 7)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS service_requests (
            request_id TEXT PRIMARY KEY,
            ulpin TEXT NOT NULL,
            service_type TEXT NOT NULL,
            applicant TEXT NOT NULL,
            assigned_role TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'SUBMITTED',
            description TEXT NOT NULL,
            priority TEXT DEFAULT 'Normal',
            metadata_json TEXT DEFAULT '{}',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (ulpin) REFERENCES parcels(ulpin)
        )
    """)

    # 5. Document Verification Records (Phase 8)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS document_verifications (
            doc_verification_id TEXT PRIMARY KEY,
            request_id TEXT NOT NULL,
            ulpin TEXT NOT NULL,
            document_type TEXT NOT NULL,
            document_name TEXT NOT NULL,
            document_number TEXT,
            document_date TEXT,
            seller_owner_name TEXT,
            buyer_applicant_name TEXT,
            area_mentioned REAL,
            registration_reference TEXT,
            additional_details TEXT,
            status TEXT NOT NULL DEFAULT 'SUBMITTED',
            overall_result TEXT DEFAULT 'NEEDS_REVIEW',
            verification_checks_json TEXT DEFAULT '[]',
            submitted_by TEXT NOT NULL,
            submission_date TEXT NOT NULL,
            reviewed_by TEXT,
            reviewed_at TEXT,
            remarks TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (ulpin) REFERENCES parcels(ulpin),
            FOREIGN KEY (request_id) REFERENCES service_requests(request_id)
        )
    """)

    # 6. Land Sale / Ownership Transfer Records (Phase 9)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS land_transfers (
            transfer_id TEXT PRIMARY KEY,
            request_id TEXT NOT NULL,
            ulpin TEXT NOT NULL,
            seller_name TEXT NOT NULL,
            seller_id TEXT,
            buyer_name TEXT NOT NULL,
            buyer_contact TEXT,
            buyer_id TEXT,
            transfer_type TEXT NOT NULL DEFAULT 'SALE',
            area_transferred REAL NOT NULL,
            consideration_amount REAL DEFAULT 0.0,
            consideration_reference TEXT,
            doc_verification_id TEXT,
            registration_reference TEXT,
            status TEXT NOT NULL DEFAULT 'SUBMITTED',
            tax_status TEXT DEFAULT 'PENDING',
            restriction_status TEXT DEFAULT 'PENDING',
            overall_eligibility TEXT DEFAULT 'NEEDS_REVIEW',
            submitted_by TEXT NOT NULL,
            submission_date TEXT NOT NULL,
            reviewed_by TEXT,
            reviewed_at TEXT,
            remarks TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (ulpin) REFERENCES parcels(ulpin),
            FOREIGN KEY (request_id) REFERENCES service_requests(request_id)
        )
    """)

    # 7. Parcel Subdivision Requests (Phase 10)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS parcel_subdivisions (
            subdivision_id TEXT PRIMARY KEY,
            request_id TEXT NOT NULL,
            parent_ulpin TEXT NOT NULL,
            applicant TEXT NOT NULL,
            num_children INTEGER NOT NULL DEFAULT 2,
            proposed_children_json TEXT DEFAULT '[]',
            reason TEXT,
            supporting_doc_id TEXT,
            status TEXT NOT NULL DEFAULT 'SUBMITTED',
            tax_status TEXT DEFAULT 'PENDING',
            restriction_status TEXT DEFAULT 'PENDING',
            validation_result TEXT DEFAULT 'PENDING',
            reviewed_by TEXT,
            reviewed_at TEXT,
            remarks TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (parent_ulpin) REFERENCES parcels(ulpin),
            FOREIGN KEY (request_id) REFERENCES service_requests(request_id)
        )
    """)

    # 8. Child Parcels created after subdivision approval (Phase 10)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS child_parcels (
            child_parcel_id TEXT PRIMARY KEY,
            parent_ulpin TEXT NOT NULL,
            subdivision_id TEXT NOT NULL,
            child_index INTEGER NOT NULL,
            owner_name TEXT NOT NULL,
            area_acres REAL NOT NULL,
            area_hectares REAL NOT NULL,
            land_type TEXT NOT NULL,
            land_use TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Active',
            geometry_json TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (parent_ulpin) REFERENCES parcels(ulpin),
            FOREIGN KEY (subdivision_id) REFERENCES parcel_subdivisions(subdivision_id)
        )
    """)

    # 9. Permissioned Digital Ledger / Blockchain Transactions
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS blockchain_transactions (
            transaction_id TEXT PRIMARY KEY,
            request_id TEXT,
            ulpin TEXT,
            action TEXT NOT NULL,
            department TEXT NOT NULL,
            username TEXT NOT NULL,
            role TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'SYNCHRONIZED',
            previous_hash TEXT NOT NULL,
            transaction_hash TEXT NOT NULL,
            metadata_json TEXT DEFAULT '{}',
            created_at TEXT NOT NULL
        )
    """)

    conn.commit()
    conn.close()


