"""
LandSetu Backend — Phase 4 Test Suite

Automated verification of Grounded AI / RAG Parcel Assistant:
1. Summarize parcel query
2. Domain-specific queries (Tax, Land Use, Restrictions, Transactions)
3. Off-topic query guardrail (e.g. Capital of France)
4. 404 validation for unknown ULPIN
5. 400 validation for empty query
"""

import unittest
from fastapi.testclient import TestClient
from main import app
from database import init_db, get_connection
from seed_data import seed_database


class TestPhase4AI(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        init_db()
        conn = get_connection()
        seed_database(conn)
        conn.close()
        cls.client = TestClient(app)

    def test_01_summarize_parcel(self):
        payload = {
            "ulpin": "KA0102030405",
            "query": "Summarize this parcel."
        }
        res = self.client.post("/api/ai/query", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["ulpin"], "KA0102030405")
        self.assertEqual(data["mode"], "grounded")
        self.assertIn("Ramesh Kumar", data["answer"])
        self.assertIn("2.5 Hectares", data["answer"])
        self.assertIn("Parcel Record", data["sources"])
        self.assertIn("Tax Record", data["sources"])
        print("  [OK] POST /api/ai/query (Summarize parcel) passed")

    def test_02_tax_status_query(self):
        payload = {
            "ulpin": "KA0102030405",
            "query": "What is the tax status?"
        }
        res = self.client.post("/api/ai/query", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("BBMP", data["answer"])
        self.assertIn("Paid", data["answer"])
        self.assertEqual(data["sources"], ["Tax Record"])
        print("  [OK] POST /api/ai/query (Tax status query) passed")

    def test_03_land_use_query(self):
        payload = {
            "ulpin": "KA0102030405",
            "query": "What is the land use?"
        }
        res = self.client.post("/api/ai/query", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("Residential", data["answer"])
        self.assertIn("BMRDA", data["answer"])
        self.assertIn("Planning Record", data["sources"])
        print("  [OK] POST /api/ai/query (Land use query) passed")

    def test_04_restrictions_query(self):
        payload = {
            "ulpin": "KA0102030405",
            "query": "Are there any restrictions?"
        }
        res = self.client.post("/api/ai/query", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("Clear", data["answer"])
        self.assertEqual(data["sources"], ["Restrictions Record"])
        print("  [OK] POST /api/ai/query (Restrictions query) passed")

    def test_05_transactions_query(self):
        payload = {
            "ulpin": "KA0102030405",
            "query": "Show me the recent transactions."
        }
        res = self.client.post("/api/ai/query", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("Mutation", data["answer"])
        self.assertEqual(data["sources"], ["Transactions Record"])
        print("  [OK] POST /api/ai/query (Transactions query) passed")

    def test_06_off_topic_guardrail(self):
        payload = {
            "ulpin": "KA0102030405",
            "query": "What is the capital of France?"
        }
        res = self.client.post("/api/ai/query", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("I can answer questions about the selected LandSetu parcel", data["answer"])
        self.assertEqual(data["sources"], [])
        print("  [OK] POST /api/ai/query (Off-topic guardrail) passed")

    def test_07_unknown_ulpin_404(self):
        payload = {
            "ulpin": "UNKNOWN999",
            "query": "Summarize this parcel."
        }
        res = self.client.post("/api/ai/query", json=payload)
        self.assertEqual(res.status_code, 404)
        print("  [OK] POST /api/ai/query (Unknown ULPIN 404) passed")

    def test_08_empty_query_400(self):
        payload = {
            "ulpin": "KA0102030405",
            "query": "   "
        }
        res = self.client.post("/api/ai/query", json=payload)
        self.assertEqual(res.status_code, 400)
        print("  [OK] POST /api/ai/query (Empty query 400 validation) passed")


if __name__ == "__main__":
    print("\n--- Running LandSetu Phase 4 AI Verification Suite ---")
    unittest.main()
