"""
LandSetu Backend — Phase 3 Test Suite

Automated verification of Phase 3 departmental and integrated view endpoints.
"""

import unittest
from fastapi.testclient import TestClient
from main import app
from database import init_db, get_connection
from seed_data import seed_database


class TestPhase3API(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        init_db()
        conn = get_connection()
        seed_database(conn)
        conn.close()
        cls.client = TestClient(app)

    def test_01_ownership_endpoint(self):
        res = self.client.get("/api/parcels/KA0102030405/ownership")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["ulpin"], "KA0102030405")
        self.assertEqual(data["owner_name"], "Ramesh Kumar")
        self.assertIn("Begur", data["khata_number"])
        print("  [OK] GET /api/parcels/{ulpin}/ownership passed")

    def test_02_registration_endpoint(self):
        res = self.client.get("/api/parcels/KA0102030405/registration")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["ulpin"], "KA0102030405")
        self.assertIn("Jayanagar", data["sro_office"])
        self.assertEqual(data["deed_type"], "Absolute Sale Deed")
        self.assertGreater(data["stamp_duty_paid"], 0)
        print("  [OK] GET /api/parcels/{ulpin}/registration passed")

    def test_03_tax_endpoint(self):
        res = self.client.get("/api/parcels/KA0102030405/tax")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["ulpin"], "KA0102030405")
        self.assertIn("BBMP", data["authority"])
        self.assertEqual(data["outstanding_amount"], 0.0)
        print("  [OK] GET /api/parcels/{ulpin}/tax passed")

    def test_04_planning_endpoint(self):
        res = self.client.get("/api/parcels/KA0102030405/planning")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["ulpin"], "KA0102030405")
        self.assertIn("Residential", data["master_plan_zone"])
        self.assertEqual(data["permissible_far"], 1.75)
        print("  [OK] GET /api/parcels/{ulpin}/planning passed")

    def test_05_utilities_endpoint(self):
        res = self.client.get("/api/parcels/KA0102030405/utilities")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["ulpin"], "KA0102030405")
        self.assertIn("BESCOM", data["electricity_provider"])
        self.assertIn("BWSSB", data["water_authority"])
        self.assertEqual(data["road_width_feet"], 40.0)
        print("  [OK] GET /api/parcels/{ulpin}/utilities passed")

    def test_06_restrictions_endpoint(self):
        res = self.client.get("/api/parcels/KA0102030405/restrictions")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["ulpin"], "KA0102030405")
        self.assertIn("Clear", data["status"])
        print("  [OK] GET /api/parcels/{ulpin}/restrictions passed")

    def test_07_transactions_endpoint(self):
        res = self.client.get("/api/parcels/KA0102030405/transactions")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIsInstance(data, list)
        self.assertGreaterEqual(len(data), 4)
        print(f"  [OK] GET /api/parcels/{{ulpin}}/transactions passed ({len(data)} events)")

    def test_08_integrated_view_endpoint(self):
        res = self.client.get("/api/parcels/KA0102030405/integrated-view")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("parcel", data)
        self.assertIn("ownership", data)
        self.assertIn("registration", data)
        self.assertIn("tax", data)
        self.assertIn("planning", data)
        self.assertIn("utilities", data)
        self.assertIn("restrictions", data)
        self.assertIn("transactions", data)
        self.assertIn("map", data)
        self.assertEqual(data["map"]["type"], "Feature")
        self.assertIn("fictional demo data", data["disclaimer"])
        print("  [OK] GET /api/parcels/{ulpin}/integrated-view passed (full aggregated response)")

    def test_09_unknown_ulpin_404(self):
        res = self.client.get("/api/parcels/UNKNOWN999/integrated-view")
        self.assertEqual(res.status_code, 404)
        print("  [OK] 404 validation for unknown ULPIN on integrated-view passed")


if __name__ == "__main__":
    print("\n--- Running LandSetu Phase 3 Backend Verification Suite ---")
    unittest.main()
