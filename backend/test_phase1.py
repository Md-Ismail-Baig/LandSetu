"""
LandSetu Backend — Phase 1 Test Suite

Automated verification of Phase 1 requirements:
1. Health check endpoint
2. List parcels endpoint (5 parcels)
3. Get parcel by ULPIN (including demo ULPIN KA0102030405)
4. Get parcel map GeoJSON endpoint
5. 404 handling for non-existent ULPINs
6. Disclaimer presence in API responses
"""

import unittest
from fastapi.testclient import TestClient
from main import app
from database import init_db, get_connection
from seed_data import seed_database


class TestPhase1API(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        # Ensure database is initialized and seeded for test context
        init_db()
        conn = get_connection()
        seed_database(conn)
        conn.close()
        cls.client = TestClient(app)

    def test_01_health_check(self):
        """Test GET /api/health returns status 200 and 'ok'."""
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "ok")
        self.assertIn("fictional demo data", data["disclaimer"])
        print("  [OK] Health check passed")

    def test_02_list_parcels(self):
        """Test GET /api/parcels returns at least 5 parcels."""
        response = self.client.get("/api/parcels")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreaterEqual(data["count"], 5)
        self.assertEqual(len(data["parcels"]), data["count"])
        
        ulpins = [p["ulpin"] for p in data["parcels"]]
        self.assertIn("KA0102030405", ulpins)
        print(f"  [OK] List parcels passed ({data['count']} parcels found, demo ULPIN present)")

    def test_03_get_parcel_by_ulpin(self):
        """Test GET /api/parcels/KA0102030405 returns correct demo parcel details."""
        response = self.client.get("/api/parcels/KA0102030405")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        parcel = data["parcel"]
        self.assertEqual(parcel["ulpin"], "KA0102030405")
        self.assertEqual(parcel["survey_number"], "45/2A")
        self.assertEqual(parcel["owner_name"], "Ramesh Kumar")
        self.assertEqual(parcel["district"], "Bangalore Urban")
        self.assertEqual(parcel["state"], "Karnataka")
        self.assertEqual(parcel["land_type"], "Agricultural")
        self.assertIn("fictional demo data", data["disclaimer"])
        print("  [OK] Get parcel by ULPIN passed")

    def test_04_get_parcel_map(self):
        """Test GET /api/parcels/KA0102030405/map returns valid GeoJSON Feature."""
        response = self.client.get("/api/parcels/KA0102030405/map")
        self.assertEqual(response.status_code, 200)
        geojson = response.json()
        self.assertEqual(geojson["type"], "Feature")
        self.assertEqual(geojson["geometry"]["type"], "Polygon")
        self.assertEqual(geojson["properties"]["ulpin"], "KA0102030405")
        self.assertGreater(len(geojson["geometry"]["coordinates"][0]), 3)
        print("  [OK] Get parcel GeoJSON map passed")

    def test_05_invalid_ulpin_404(self):
        """Test GET /api/parcels/NONEXISTENT_999 returns HTTP 404."""
        response = self.client.get("/api/parcels/NONEXISTENT_999")
        self.assertEqual(response.status_code, 404)
        data = response.json()
        self.assertIn("detail", data)
        self.assertIn("NONEXISTENT_999", data["detail"])
        print("  [OK] Invalid ULPIN detail 404 passed")

    def test_06_invalid_ulpin_map_404(self):
        """Test GET /api/parcels/NONEXISTENT_999/map returns HTTP 404."""
        response = self.client.get("/api/parcels/NONEXISTENT_999/map")
        self.assertEqual(response.status_code, 404)
        data = response.json()
        self.assertIn("detail", data)
        print("  [OK] Invalid ULPIN map 404 passed")


if __name__ == "__main__":
    print("\n--- Running LandSetu Phase 1 Backend Verification Suite ---")
    unittest.main()
