"""
LandSetu Backend — Seed Data

5 fictional parcel records for the LandSetu platform.

All records are fictional demo data. They must not be interpreted as actual
government land records.
"""

SEED_PARCELS = [
    {
        "ulpin": "KA0102030405",
        "survey_number": "45/2A",
        "owner_name": "Ramesh Kumar",
        "father_name": "Suresh Kumar",
        "area_hectares": 2.5,
        "area_acres": 6.18,
        "district": "Bangalore Urban",
        "taluk": "Bangalore South",
        "hobli": "Begur",
        "village": "Hulimavu",
        "state": "Karnataka",
        "land_type": "Agricultural",
        "land_use": "Residential",
        "status": "Active",
        "last_transaction_date": "2025-03-15",
        "encumbrances": "[]",
        "created_at": "2024-01-01T00:00:00",
        "updated_at": "2025-03-15T00:00:00",
    },
    {
        "ulpin": "KA0203040506",
        "survey_number": "112/1B",
        "owner_name": "Lakshmi Devi",
        "father_name": "Krishnamurthy N",
        "area_hectares": 0.8,
        "area_acres": 1.98,
        "district": "Mysore",
        "taluk": "Mysore North",
        "hobli": "Jayapura",
        "village": "Yelwal",
        "state": "Karnataka",
        "land_type": "Residential",
        "land_use": "Residential",
        "status": "Active",
        "last_transaction_date": "2024-11-20",
        "encumbrances": "[]",
        "created_at": "2023-06-15T00:00:00",
        "updated_at": "2024-11-20T00:00:00",
    },
    {
        "ulpin": "KA0304050607",
        "survey_number": "78/3C",
        "owner_name": "Ahmed Khan",
        "father_name": "Ibrahim Khan",
        "area_hectares": 1.2,
        "area_acres": 2.97,
        "district": "Hubli-Dharwad",
        "taluk": "Hubli",
        "hobli": "Hubli Rural",
        "village": "Tarihal",
        "state": "Karnataka",
        "land_type": "Commercial",
        "land_use": "Commercial",
        "status": "Active",
        "last_transaction_date": "2025-01-10",
        "encumbrances": '[{"type": "Mortgage", "holder": "State Bank", "since": "2023-04-01"}]',
        "created_at": "2022-09-01T00:00:00",
        "updated_at": "2025-01-10T00:00:00",
    },
    {
        "ulpin": "KA0405060708",
        "survey_number": "201/4D",
        "owner_name": "Priya Sharma",
        "father_name": "Rajesh Sharma",
        "area_hectares": 3.7,
        "area_acres": 9.14,
        "district": "Mangalore",
        "taluk": "Mangalore South",
        "hobli": "Bantwal",
        "village": "Konaje",
        "state": "Karnataka",
        "land_type": "Agricultural",
        "land_use": "Agricultural",
        "status": "Active",
        "last_transaction_date": "2024-06-05",
        "encumbrances": "[]",
        "created_at": "2021-03-20T00:00:00",
        "updated_at": "2024-06-05T00:00:00",
    },
    {
        "ulpin": "KA0506070809",
        "survey_number": "55/5E",
        "owner_name": "Venkatesh Gowda",
        "father_name": "Basavaraj Gowda",
        "area_hectares": 5.0,
        "area_acres": 12.36,
        "district": "Belgaum",
        "taluk": "Belgaum North",
        "hobli": "Belgaum Rural",
        "village": "Kangrali",
        "state": "Karnataka",
        "land_type": "Industrial",
        "land_use": "Industrial",
        "status": "Under Dispute",
        "last_transaction_date": "2023-12-01",
        "encumbrances": '[{"type": "Court Stay", "holder": "District Court Belgaum", "since": "2024-02-15"}]',
        "created_at": "2020-07-10T00:00:00",
        "updated_at": "2024-02-15T00:00:00",
    },
]


def seed_database(conn):
    """Insert seed parcels into the database if the table is empty."""
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM parcels")
    count = cursor.fetchone()[0]

    if count > 0:
        return False  # Already seeded

    for parcel in SEED_PARCELS:
        cursor.execute(
            """
            INSERT INTO parcels (
                ulpin, survey_number, owner_name, father_name,
                area_hectares, area_acres, district, taluk, hobli,
                village, state, land_type, land_use, status,
                last_transaction_date, encumbrances, created_at, updated_at
            ) VALUES (
                :ulpin, :survey_number, :owner_name, :father_name,
                :area_hectares, :area_acres, :district, :taluk, :hobli,
                :village, :state, :land_type, :land_use, :status,
                :last_transaction_date, :encumbrances, :created_at, :updated_at
            )
            """,
            parcel,
        )

    conn.commit()
    return True
