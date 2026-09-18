"""
LandSetu Backend — Parcel Service

Data access layer for parcel records and GeoJSON geometry.
"""

import json
import os
from database import get_connection

# Path to GeoJSON data file
GEOJSON_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "data", "parcels.geojson"
)


def _row_to_dict(row):
    """Convert a sqlite3.Row to a plain dict with parsed encumbrances."""
    d = dict(row)
    # Parse encumbrances from JSON string
    if isinstance(d.get("encumbrances"), str):
        try:
            d["encumbrances"] = json.loads(d["encumbrances"])
        except (json.JSONDecodeError, TypeError):
            d["encumbrances"] = []
    return d


def get_all_parcels():
    """Return all parcels as summary dicts."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT ulpin, survey_number, owner_name, district, taluk,
               village, area_hectares, land_type, status
        FROM parcels
        ORDER BY ulpin
        """
    )
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def get_parcel_by_ulpin(ulpin):
    """Return a single parcel by ULPIN, or None if not found."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM parcels WHERE ulpin = ?", (ulpin,))
    row = cursor.fetchone()
    conn.close()
    if row is None:
        return None
    return _row_to_dict(row)


def get_parcel_geojson(ulpin):
    """Return GeoJSON Feature for a parcel, or None if not found."""
    try:
        with open(GEOJSON_PATH, "r", encoding="utf-8") as f:
            collection = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return None

    for feature in collection.get("features", []):
        if feature.get("properties", {}).get("ulpin") == ulpin:
            return feature

    return None


def get_all_parcels_geojson():
    """Return the full GeoJSON FeatureCollection."""
    try:
        with open(GEOJSON_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {"type": "FeatureCollection", "features": []}
