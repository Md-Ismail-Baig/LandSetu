"""
LandSetu Backend — Department Service

Retrieves mock/fictional departmental records for a given ULPIN:
- Ownership & Revenue Records
- Registration & Stamp Duty (IGR)
- Property Tax Assessment
- Town & Country Planning (Zoning/Conversion)
- Utilities & Infrastructure
- Restrictions & Encumbrances
- Historical Mutations & Transactions

⚠️ DISCLAIMER: All departmental records are fictional demo data created for
the Smart India Hackathon 2026 prototype. They must not be interpreted as
actual government records.
"""

from typing import Optional, List
from services.parcel_service import get_parcel_by_ulpin


def get_ownership_detail(ulpin: str) -> Optional[dict]:
    """Return ownership and title record."""
    parcel = get_parcel_by_ulpin(ulpin)
    if not parcel:
        return None

    if ulpin == "KA0102030405":
        return {
            "ulpin": ulpin,
            "owner_name": parcel["owner_name"],
            "owner_type": "Individual / Sole Owner",
            "father_or_spouse_name": parcel.get("father_name", "Suresh Kumar"),
            "share_percentage": 100.0,
            "khata_number": "45/A (Begur Sub-division)",
            "mutation_number": "MR-2024-BLR-00112",
            "record_reference": "RTC-KA-BLRU-2024-098234",
            "status": "Clear Title / Active",
            "last_updated": "2025-03-15",
        }

    # Dynamic fallback for other demo parcels
    return {
        "ulpin": ulpin,
        "owner_name": parcel["owner_name"],
        "owner_type": "Individual / Sole Owner",
        "father_or_spouse_name": parcel.get("father_name", "Guardian"),
        "share_percentage": 100.0,
        "khata_number": f"KH-{parcel['survey_number']}",
        "mutation_number": f"MR-2024-{ulpin[-4:]}",
        "record_reference": f"RTC-{ulpin[:4]}-{ulpin[-6:]}",
        "status": parcel["status"],
        "last_updated": parcel.get("last_transaction_date", "2024-01-01"),
    }


def get_registration_detail(ulpin: str) -> Optional[dict]:
    """Return registration and deed record from Inspector General of Registration (IGR)."""
    parcel = get_parcel_by_ulpin(ulpin)
    if not parcel:
        return None

    if ulpin == "KA0102030405":
        return {
            "ulpin": ulpin,
            "sro_office": "SRO Bangalore South (Jayanagar)",
            "deed_type": "Absolute Sale Deed",
            "document_number": "BNG-DN-2021-008912",
            "book_number": "Book-1 / Volume 412 / Pages 102-118",
            "registration_date": "2021-04-12",
            "stamp_duty_paid": 145000.0,
            "registration_fee_paid": 29000.0,
            "status": "Registered & Indexed",
            "verification_source": "State e-Registration Database (Kaveri 2.0 Integration Mock)",
        }

    return {
        "ulpin": ulpin,
        "sro_office": f"SRO {parcel['taluk']}",
        "deed_type": "Registered Conveyance Deed",
        "document_number": f"DOC-{ulpin[:4]}-2022-{ulpin[-4:]}",
        "book_number": "Book-1 / Registered Volume",
        "registration_date": parcel.get("created_at", "2022-01-01")[:10],
        "stamp_duty_paid": 65000.0,
        "registration_fee_paid": 13000.0,
        "status": "Registered",
        "verification_source": "State e-Registration Database (Mock)",
    }


def get_tax_detail(ulpin: str) -> Optional[dict]:
    """Return property tax assessment record."""
    parcel = get_parcel_by_ulpin(ulpin)
    if not parcel:
        return None

    if ulpin == "KA0102030405":
        return {
            "ulpin": ulpin,
            "authority": "Bruhat Bengaluru Mahanagara Palike (BBMP) / Begur Zone",
            "property_tax_id": "PID-BLR-0982-452A",
            "assessment_year": "2025-26",
            "annual_tax_assessed": 12450.0,
            "outstanding_amount": 0.0,
            "last_payment_date": "2025-05-10",
            "last_receipt_number": "RCT-BBMP-2025-778912",
            "payment_status": "Paid / Up to date",
        }

    is_disputed = "dispute" in parcel["status"].lower()
    return {
        "ulpin": ulpin,
        "authority": f"Municipal Council / Gram Panchayat {parcel['taluk']}",
        "property_tax_id": f"PID-{ulpin[:4]}-{ulpin[-6:]}",
        "assessment_year": "2025-26",
        "annual_tax_assessed": 8500.0,
        "outstanding_amount": 17000.0 if is_disputed else 0.0,
        "last_payment_date": "2024-04-15" if not is_disputed else None,
        "last_receipt_number": f"RCT-{ulpin[-6:]}" if not is_disputed else None,
        "payment_status": "Defaulter / Arrears Pending" if is_disputed else "Paid / Up to date",
    }


def get_planning_detail(ulpin: str) -> Optional[dict]:
    """Return town and country planning, zoning, and conversion details."""
    parcel = get_parcel_by_ulpin(ulpin)
    if not parcel:
        return None

    if ulpin == "KA0102030405":
        return {
            "ulpin": ulpin,
            "planning_authority": "Bangalore Metropolitan Region Development Authority (BMRDA)",
            "master_plan_zone": "Residential Main (R-1) / Peri-Urban Growth Zone",
            "permissible_land_use": "Residential (Villa / Low-Rise Group Housing)",
            "permissible_far": 1.75,
            "conversion_status": "Section 95 Non-Agricultural Conversion Sanctioned",
            "conversion_order_no": "DC(REV)/CONV/2022/9012",
            "development_status": "Layout Plan Approved / Ready for Construction",
            "green_belt_clearance": "Exempt / Non-buffer zone",
        }

    return {
        "ulpin": ulpin,
        "planning_authority": f"Urban Development Authority ({parcel['district']})",
        "master_plan_zone": f"{parcel['land_use']} Zone (Z-2)",
        "permissible_land_use": parcel["land_use"],
        "permissible_far": 1.5,
        "conversion_status": "Conforming to Master Plan",
        "conversion_order_no": f"UDA-ORD-{ulpin[-4:]}",
        "development_status": "Permitted",
        "green_belt_clearance": "Verified",
    }


def get_utilities_detail(ulpin: str) -> Optional[dict]:
    """Return public utilities, civic infrastructure, and road connectivity."""
    parcel = get_parcel_by_ulpin(ulpin)
    if not parcel:
        return None

    if ulpin == "KA0102030405":
        return {
            "ulpin": ulpin,
            "electricity_provider": "Bangalore Electricity Supply Company (BESCOM)",
            "electricity_consumer_id": "RR-BLRS-88234-A",
            "electricity_status": "Energized / LT-2 Residential (3-Phase Connection)",
            "water_authority": "Bangalore Water Supply and Sewerage Board (BWSSB)",
            "water_consumer_id": "BWSSB-HUL-0982-C",
            "water_status": "Piped Supply Connected",
            "road_access_type": "Paved Asphalt Municipal Road (Main Arterial Access)",
            "road_width_feet": 40.0,
            "sewage_drainage_status": "Underground Drainage (UGD) Connected",
        }

    return {
        "ulpin": ulpin,
        "electricity_provider": f"State Electricity Distribution Co. ({parcel['district']})",
        "electricity_consumer_id": f"RR-{ulpin[-6:]}",
        "electricity_status": "Active Grid Connection",
        "water_authority": f"Jal Jeevan Mission / Municipal Water Supply",
        "water_consumer_id": f"WTR-{ulpin[-6:]}",
        "water_status": "Piped Drinking Water Available",
        "road_access_type": "All-Weather Tar Road",
        "road_width_feet": 30.0,
        "sewage_drainage_status": "Open Stormwater Drain Network",
    }


def get_restrictions_detail(ulpin: str) -> Optional[dict]:
    """Return legal encumbrances, litigation, and regulatory restrictions."""
    parcel = get_parcel_by_ulpin(ulpin)
    if not parcel:
        return None

    if ulpin == "KA0102030405":
        return {
            "ulpin": ulpin,
            "status": "Clear / No Adverse Encumbrance",
            "court_stay_status": "No Active Litigation Found",
            "land_acquisition_status": "No Gazette Acquisition Notification (KIADB/NHAI/BDA)",
            "ceiling_act_status": "Compliant with Land Reforms Act (Section 79A/B Clear)",
            "mortgage_status": "No Registered Banking Lien",
            "alert_flags": [],
            "remarks": "Clean title record verified across digital revenue and registration ledgers.",
        }

    is_disputed = "dispute" in parcel["status"].lower()
    return {
        "ulpin": ulpin,
        "status": "Active Legal Restriction" if is_disputed else "Clear / Standard Record",
        "court_stay_status": "Interim Injunction Order (O.S. 452/2024 District Court)" if is_disputed else "No Active Court Stay",
        "land_acquisition_status": "No Acquisition Proceeding",
        "ceiling_act_status": "Within Permissible Holding Limit",
        "mortgage_status": "Lien Reported by Commercial Bank" if "3C" in parcel.get("survey_number", "") else "Unencumbered",
        "alert_flags": ["Title Dispute Pending", "Mutation Freeze Active"] if is_disputed else [],
        "remarks": "Court injunction in force; alienations restricted until final hearing." if is_disputed else "Standard unencumbered parcel.",
    }


def get_transactions_history(ulpin: str) -> Optional[List[dict]]:
    """Return historical audit log and mutation timeline for the parcel."""
    parcel = get_parcel_by_ulpin(ulpin)
    if not parcel:
        return None

    if ulpin == "KA0102030405":
        return [
            {
                "id": "TXN-2025-004",
                "date": "2025-03-15",
                "transaction_type": "Survey Verification & Digital Boundary Demarcation",
                "reference_number": "SURV-BLR-2025-8812",
                "department": "Survey, Settlement and Land Records (SSLR)",
                "parties_involved": "Tahsildar Bangalore South / SSLR Cadastral Team",
                "status": "Demarcation Completed & Sealed",
            },
            {
                "id": "TXN-2024-003",
                "date": "2024-11-04",
                "transaction_type": "Khata Bifurcation & Transfer",
                "reference_number": "MR-2024-BLR-00112",
                "department": "Revenue Department (Bhoomi)",
                "parties_involved": "Ramesh Kumar (Transferee)",
                "status": "Mutation Accepted",
            },
            {
                "id": "TXN-2022-002",
                "date": "2022-08-19",
                "transaction_type": "Land Use Conversion Order",
                "reference_number": "DC(REV)/CONV/2022/9012",
                "department": "Deputy Commissioner Office",
                "parties_involved": "Deputy Commissioner, Bangalore Urban",
                "status": "Conversion Sanctioned",
            },
            {
                "id": "TXN-2021-001",
                "date": "2021-04-12",
                "transaction_type": "Absolute Sale Deed Conveyance",
                "reference_number": "BNG-DN-2021-008912",
                "department": "Registration & Stamps (IGR)",
                "parties_involved": "G. Narayana (Vendor) -> Ramesh Kumar (Purchaser)",
                "status": "Registered & Stamped",
            },
        ]

    return [
        {
            "id": f"TXN-{ulpin[-4:]}-01",
            "date": parcel.get("created_at", "2023-01-01")[:10],
            "transaction_type": "Primary Title Registration",
            "reference_number": f"REG-{ulpin[-6:]}",
            "department": "Registration & Revenue",
            "parties_involved": parcel["owner_name"],
            "status": "Completed",
        }
    ]
