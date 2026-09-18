"""
LandSetu Backend — Satellite Change Monitoring Service

Provides deterministic mock satellite imagery and change-detection results
for supported parcels. Designed for modular replacement with real satellite
image processing and change-detection models in future releases.

NOTE: All satellite analysis data served by this module is simulated.
It is not legal proof of encroachment, unauthorized construction,
ownership, or land-use violation.
"""

from typing import Optional, Dict, Any


# ---------------------------------------------------------------------------
# Mock satellite records — deterministic per ULPIN
# ---------------------------------------------------------------------------

_MOCK_SATELLITE_RECORDS: Dict[str, Dict[str, Any]] = {
    "KA0102030405": {
        "ulpin": "KA0102030405",
        "analysis_status": "possible_change",
        "source_type": "simulated",
        "previous": {
            "date": "2024-11-15",
            "image_url": "/mock-satellite/previous.png",
            "label": "Baseline Capture",
        },
        "current": {
            "date": "2025-08-22",
            "image_url": "/mock-satellite/current.png",
            "label": "Latest Capture",
        },
        "change": {
            "detected": True,
            "changed_area_sqm": 185.4,
            "change_percentage": 12.6,
            "type": "Possible New Construction",
            "confidence": 0.78,
        },
        "requires_verification": True,
        "officer_remarks": None,
    },
    "KA0504030201": {
        "ulpin": "KA0504030201",
        "analysis_status": "no_change",
        "source_type": "simulated",
        "previous": {
            "date": "2024-10-03",
            "image_url": "/mock-satellite/previous.png",
            "label": "Baseline Capture",
        },
        "current": {
            "date": "2025-07-18",
            "image_url": "/mock-satellite/current.png",
            "label": "Latest Capture",
        },
        "change": {
            "detected": False,
            "changed_area_sqm": 0.0,
            "change_percentage": 0.0,
            "type": None,
            "confidence": 0.0,
        },
        "requires_verification": False,
        "officer_remarks": None,
    },
}


def get_satellite_record(ulpin: str) -> Optional[Dict[str, Any]]:
    """
    Retrieve the satellite monitoring record for a given ULPIN.

    Returns deterministic mock data for supported demo parcels.
    Returns None when no record exists (caller should return 404).

    Future: Replace this lookup with a call to a satellite imagery
    ingestion pipeline and a change-detection ML model.
    """
    return _MOCK_SATELLITE_RECORDS.get(ulpin)
