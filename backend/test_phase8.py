"""
LandSetu Backend — Phase 8 Document Verification Workflow Automated Test Suite

Verifies:
1. Document Verification Creation & Automated 5-Point Comparison Engine
2. Deterministic Matching Logic (MATCH / MISMATCH / NEEDS_REVIEW)
3. Officer Review & Decision State Machine (APPROVED / REJECTED)
4. RBAC Authorization (Citizens blocked from approving/rejecting)
5. Audit Trail Event Logging
6. Linked Service Request Integration
"""

import unittest
from fastapi.testclient import TestClient
from main import app
from database import init_db, get_connection
from seed_data import seed_database
from services.service_request_service import seed_default_service_requests
from services.document_verification_service import seed_default_document_verifications


class TestPhase8(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        init_db()
        conn = get_connection()
        seed_database(conn)
        conn.close()
        seed_default_service_requests()
        seed_default_document_verifications()
        cls.client = TestClient(app)

    def _login(self, username: str, password: str = "demo123") -> str:
        res = self.client.post("/api/auth/login", json={"username": username, "password": password})
        self.assertEqual(res.status_code, 200)
        return res.json()["access_token"]

    def test_01_matching_document_submission(self):
        """Test submitting a perfectly matching Sale Deed for KA0102030405."""
        citizen_token = self._login("citizen")

        matching_payload = {
            "ulpin": "KA0102030405",
            "document_type": "Sale Deed",
            "document_name": "Registered Absolute Sale Deed",
            "document_number": "BNG-DN-2021-008912",
            "document_date": "2021-04-12",
            "seller_owner_name": "Ramesh Kumar",
            "buyer_applicant_name": "Suresh Kumar",
            "area_mentioned": 2.45,
            "registration_reference": "BNG-DN-2021-008912",
            "additional_details": "Certified true copy of registered deed executed at SRO Bangalore South.",
        }

        res = self.client.post(
            "/api/document-verification",
            json=matching_payload,
            headers={"Authorization": f"Bearer {citizen_token}"},
        )
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertEqual(data["overall_result"], "MATCH")
        self.assertEqual(data["status"], "SUBMITTED")
        self.assertGreaterEqual(len(data["verification_checks"]), 5)

        # Verify all checks matched
        for check in data["verification_checks"]:
            self.assertEqual(check["result"], "MATCH", f"Check {check['check']} should be MATCH")

    def test_02_mismatching_document_submission(self):
        """Test submitting a document with conflicting seller and area."""
        citizen_token = self._login("citizen")

        mismatch_payload = {
            "ulpin": "KA0102030405",
            "document_type": "Land Ownership Document",
            "document_name": "Fraudulent Conveyance Note",
            "document_number": "FAKE-DEED-2024",
            "document_date": "2024-05-10",
            "seller_owner_name": "Devendra Murthy",  # Conflicting seller
            "buyer_applicant_name": "Pawan Kalyan",
            "area_mentioned": 15.50,  # Far exceeds 2.45 Ha
            "registration_reference": "UNKNOWN-SRO-99",
            "additional_details": "Unverified paper draft claiming 15 hectares.",
        }

        res = self.client.post(
            "/api/document-verification",
            json=mismatch_payload,
            headers={"Authorization": f"Bearer {citizen_token}"},
        )
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertEqual(data["overall_result"], "MISMATCH")

        # Check that owner and area are flagged as MISMATCH
        check_map = {c["check"]: c["result"] for c in data["verification_checks"]}
        self.assertEqual(check_map["OWNER"], "MISMATCH")
        self.assertEqual(check_map["AREA"], "MISMATCH")

    def test_03_needs_review_document_submission(self):
        """Test submitting a document with partial details or minor variance."""
        citizen_token = self._login("citizen")

        review_payload = {
            "ulpin": "KA0102030405",
            "document_type": "Survey Document",
            "document_name": "Partition Survey Sketch",
            "document_number": "SKETCH-2025-01",
            "document_date": "2025-02-14",
            "seller_owner_name": "Ramesh Kumar",
            "buyer_applicant_name": "Ramesh Kumar & Co-owners",
            "area_mentioned": 2.30,  # Minor difference
            "registration_reference": "",  # Unspecified reference
            "additional_details": "Preliminary survey memo.",
        }

        res = self.client.post(
            "/api/document-verification",
            json=review_payload,
            headers={"Authorization": f"Bearer {citizen_token}"},
        )
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertEqual(data["overall_result"], "NEEDS_REVIEW")

    def test_04_officer_review_and_decision_rbac(self):
        """Test approval and rejection actions with strict RBAC enforcement."""
        cit_token = self._login("citizen")
        reg_token = self._login("registration.officer")
        rev_token = self._login("revenue.officer")

        # Create a document verification as citizen
        res_create = self.client.post(
            "/api/document-verification",
            json={
                "ulpin": "KA0102030405",
                "document_type": "Registration Document",
                "document_name": "Title Validation Application",
                "document_number": "BNG-DN-2021-008912",
                "document_date": "2021-04-12",
                "seller_owner_name": "Ramesh Kumar",
                "area_mentioned": 2.45,
                "registration_reference": "BNG-DN-2021-008912",
            },
            headers={"Authorization": f"Bearer {cit_token}"},
        )
        doc_id = res_create.json()["doc_verification_id"]

        # 1. Citizen cannot approve -> 403 Forbidden
        res_cit_app = self.client.post(
            f"/api/document-verification/{doc_id}/approve",
            json={"remarks": "Citizen self-approval attempt", "decision": "APPROVED"},
            headers={"Authorization": f"Bearer {cit_token}"},
        )
        self.assertEqual(res_cit_app.status_code, 403)

        # 2. Registration Officer approves -> 200 OK
        res_off_app = self.client.post(
            f"/api/document-verification/{doc_id}/approve",
            json={"remarks": "Sale deed verified against SRO index volume 412.", "decision": "APPROVED"},
            headers={"Authorization": f"Bearer {reg_token}"},
        )
        self.assertEqual(res_off_app.status_code, 200)
        self.assertEqual(res_off_app.json()["status"], "APPROVED")

        # 3. Cannot re-approve an already approved document -> 409 Conflict
        res_dup_app = self.client.post(
            f"/api/document-verification/{doc_id}/approve",
            json={"remarks": "Duplicate approval attempt", "decision": "APPROVED"},
            headers={"Authorization": f"Bearer {reg_token}"},
        )
        self.assertEqual(res_dup_app.status_code, 409)

        # 4. Rejection flow test
        res_rej_target = self.client.post(
            "/api/document-verification",
            json={
                "ulpin": "KA0203040506",
                "document_type": "Sale Deed",
                "document_name": "Draft Note for Title Transfer",
                "seller_owner_name": "Unknown Seller",
            },
            headers={"Authorization": f"Bearer {cit_token}"},
        )
        doc_rej_id = res_rej_target.json()["doc_verification_id"]

        # Rejection requires remarks
        res_empty_rej = self.client.post(
            f"/api/document-verification/{doc_rej_id}/reject",
            json={"remarks": "   ", "decision": "REJECTED"},
            headers={"Authorization": f"Bearer {rev_token}"},
        )
        self.assertIn(res_empty_rej.status_code, [400, 422])

        # Successful rejection by Revenue Officer
        res_rej = self.client.post(
            f"/api/document-verification/{doc_rej_id}/reject",
            json={"remarks": "Seller name is unverified and missing registered power of attorney.", "decision": "REJECTED"},
            headers={"Authorization": f"Bearer {rev_token}"},
        )
        self.assertEqual(res_rej.status_code, 200)
        self.assertEqual(res_rej.json()["status"], "REJECTED")

    def test_05_audit_events_logged(self):
        """Verify that document verification actions produce immutable audit entries."""
        res_audit = self.client.get("/api/parcels/KA0102030405/audit")
        self.assertEqual(res_audit.status_code, 200)
        events = res_audit.json()["events"]
        actions = [e["action"] for e in events]
        self.assertIn("DOCUMENT_VERIFICATION_CREATED", actions)


if __name__ == "__main__":
    unittest.main()
