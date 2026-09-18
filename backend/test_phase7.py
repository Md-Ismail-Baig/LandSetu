"""
LandSetu Backend — Phase 7 Automated Test Suite

Verifies:
1. Demo User Authentication & JWT Generation
2. RBAC Access Control & Role Permissions
3. Satellite Verification Workflow State Machine (PENDING -> APPROVED / REJECTED)
4. Audit Trail Event Logging
5. Generic Service Request Framework (Listing, Filtering, Creation)
6. Governance Dashboard Metrics & Recent Activity Feed
"""

import unittest
from fastapi.testclient import TestClient
from main import app
from database import init_db, get_connection
from seed_data import seed_database
from services.service_request_service import seed_default_service_requests


class TestPhase7(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        init_db()
        conn = get_connection()
        seed_database(conn)
        conn.close()
        seed_default_service_requests()
        cls.client = TestClient(app)

    def _login(self, username: str, password: str = "demo123") -> str:
        res = self.client.post("/api/auth/login", json={"username": username, "password": password})
        self.assertEqual(res.status_code, 200)
        return res.json()["access_token"]

    def test_01_authentication_flow(self):
        """Test authentication with demo accounts and invalid credentials."""
        # 1. Revenue Officer login
        res = self.client.post("/api/auth/login", json={"username": "revenue.officer", "password": "demo123"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["user"]["role"], "Revenue Officer")
        token = data["access_token"]

        # 2. Get Me with valid token
        res_me = self.client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(res_me.status_code, 200)
        self.assertEqual(res_me.json()["username"], "revenue.officer")

        # 3. Invalid credentials
        res_invalid = self.client.post("/api/auth/login", json={"username": "revenue.officer", "password": "wrongpassword"})
        self.assertEqual(res_invalid.status_code, 401)

        # 4. Unauthenticated get me
        res_unauth = self.client.get("/api/auth/me")
        self.assertEqual(res_unauth.status_code, 401)

    def test_02_dashboard_metrics_and_activity(self):
        """Test dashboard summary and activity endpoints."""
        res = self.client.get("/api/dashboard/summary")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        metrics = data["metrics"]
        self.assertGreaterEqual(metrics["total_parcels"], 5)
        self.assertGreaterEqual(metrics["satellite_alerts"], 1)
        self.assertTrue(len(data["recent_activity"]) > 0)

        # Recent activity endpoint
        res_act = self.client.get("/api/dashboard/recent-activity")
        self.assertEqual(res_act.status_code, 200)
        self.assertTrue(isinstance(res_act.json(), list))

    def test_03_verification_rbac_and_state_machine(self):
        """Test verification initiation, role enforcement, approval, and conflict prevention."""
        ulpin = "KA0102030405"
        rev_token = self._login("revenue.officer")
        citizen_token = self._login("citizen")
        reg_token = self._login("registration.officer")

        # 1. Citizen cannot initiate verification -> 403 Forbidden
        res_cit_init = self.client.post(
            f"/api/parcels/{ulpin}/verification",
            json={"remarks": "Citizen attempt"},
            headers={"Authorization": f"Bearer {citizen_token}"}
        )
        self.assertEqual(res_cit_init.status_code, 403)

        # 2. Revenue Officer initiates verification -> 200 OK
        res_rev_init = self.client.post(
            f"/api/parcels/{ulpin}/verification",
            json={"remarks": "Officer initiation based on satellite change"},
            headers={"Authorization": f"Bearer {rev_token}"}
        )
        # Status could be 200 or 409 if already pending from earlier
        if res_rev_init.status_code == 200:
            self.assertEqual(res_rev_init.json()["status"], "PENDING")

        # 3. Registration Officer cannot approve verification -> 403 Forbidden
        res_reg_app = self.client.post(
            f"/api/parcels/{ulpin}/verification/approve",
            json={"remarks": "Registration officer attempt"},
            headers={"Authorization": f"Bearer {reg_token}"}
        )
        self.assertEqual(res_reg_app.status_code, 403)

        # 4. Revenue Officer approves verification -> 200 OK
        res_rev_app = self.client.post(
            f"/api/parcels/{ulpin}/verification/approve",
            json={"remarks": "Physical verification matches simulated satellite findings."},
            headers={"Authorization": f"Bearer {rev_token}"}
        )
        self.assertEqual(res_rev_app.status_code, 200)
        self.assertEqual(res_rev_app.json()["status"], "APPROVED")
        self.assertEqual(res_rev_app.json()["decision"], "APPROVED")

        # 5. Approving again returns 409 Conflict (invalid state transition)
        res_dup_app = self.client.post(
            f"/api/parcels/{ulpin}/verification/approve",
            json={"remarks": "Duplicate approval"},
            headers={"Authorization": f"Bearer {rev_token}"}
        )
        self.assertEqual(res_dup_app.status_code, 409)

        # 6. Audit trail contains events
        res_audit = self.client.get(f"/api/parcels/{ulpin}/audit")
        self.assertEqual(res_audit.status_code, 200)
        events = res_audit.json()["events"]
        actions = [e["action"] for e in events]
        self.assertIn("VERIFICATION_APPROVED", actions)

    def test_04_generic_service_requests_framework(self):
        """Test listing, filtering, and submitting generic service requests."""
        token = self._login("citizen")

        # 1. List requests
        res_list = self.client.get("/api/service-requests")
        self.assertEqual(res_list.status_code, 200)
        data = res_list.json()
        self.assertGreaterEqual(data["count"], 1)

        # 2. Filter by service_type
        res_filter = self.client.get("/api/service-requests?service_type=DOCUMENT_VERIFICATION")
        self.assertEqual(res_filter.status_code, 200)

        # 3. Create a new service request
        payload = {
            "ulpin": "KA0203040506",
            "service_type": "LAND_TRANSFER",
            "description": "Citizen test transfer application for title conveyance.",
            "priority": "Normal",
            "metadata": {"buyer": "Anita Sen", "sale_value": 4500000}
        }
        res_create = self.client.post(
            "/api/service-requests",
            json=payload,
            headers={"Authorization": f"Bearer {token}"}
        )
        self.assertEqual(res_create.status_code, 201)
        created = res_create.json()
        self.assertEqual(created["service_type"], "LAND_TRANSFER")
        self.assertEqual(created["status"], "SUBMITTED")
        req_id = created["request_id"]

        # 4. Get single request detail
        res_single = self.client.get(f"/api/service-requests/{req_id}")
        self.assertEqual(res_single.status_code, 200)
        self.assertEqual(res_single.json()["request_id"], req_id)

    def test_05_signup_and_rbac_boundaries(self):
        """Test user registration flow, role protection, and admin isolation."""
        # 1. Successful citizen registration
        signup_payload = {
            "name": "Sunita Patil",
            "email": "sunita.patil@example.com",
            "mobile": "+91 91234 56789",
            "password": "patilpassword123",
            "role": "Citizen"
        }
        res_signup = self.client.post("/api/auth/signup", json=signup_payload)
        self.assertEqual(res_signup.status_code, 201)
        data = res_signup.json()
        self.assertEqual(data["user"]["role"], "Citizen")
        self.assertEqual(data["user"]["email"], "sunita.patil@example.com")
        new_token = data["access_token"]

        # 2. Login with newly registered credentials
        res_login = self.client.post(
            "/api/auth/login",
            json={"username": "sunita.patil@example.com", "password": "patilpassword123"}
        )
        self.assertEqual(res_login.status_code, 200)

        # 3. Prevent Admin self-registration via public signup (403 Forbidden)
        admin_signup_attempt = {
            "name": "Hacker Admin",
            "email": "hacker@example.com",
            "password": "hackpass123",
            "role": "Admin"
        }
        res_admin_block = self.client.post("/api/auth/signup", json=admin_signup_attempt)
        self.assertEqual(res_admin_block.status_code, 403)

        # 4. Citizen attempting to access /api/admin/users receives 403 Forbidden
        res_cit_admin = self.client.get(
            "/api/admin/users",
            headers={"Authorization": f"Bearer {new_token}"}
        )
        self.assertEqual(res_cit_admin.status_code, 403)

        # 5. Admin accessing /api/admin/users and /api/admin/system-stats receives 200 OK
        admin_token = self._login("admin")
        res_adm_users = self.client.get(
            "/api/admin/users",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        self.assertEqual(res_adm_users.status_code, 200)
        self.assertGreaterEqual(res_adm_users.json()["count"], 5)

        res_adm_stats = self.client.get(
            "/api/admin/system-stats",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        self.assertEqual(res_adm_stats.status_code, 200)
        self.assertGreaterEqual(res_adm_stats.json()["total_users"], 5)

    def test_06_service_request_status_patching(self):
        """Test updating service requests by officers and blocking citizens."""
        cit_token = self._login("citizen")
        rev_token = self._login("revenue.officer")

        # Create request as citizen
        res_create = self.client.post(
            "/api/service-requests",
            json={
                "ulpin": "KA0102030405",
                "service_type": "PARCEL_SUBDIVISION",
                "description": "Partition boundary review",
            },
            headers={"Authorization": f"Bearer {cit_token}"}
        )
        req_id = res_create.json()["request_id"]

        # Citizen cannot PATCH status -> 403 Forbidden
        res_cit_patch = self.client.patch(
            f"/api/service-requests/{req_id}",
            json={"status": "UNDER_REVIEW", "remarks": "Citizen attempt"},
            headers={"Authorization": f"Bearer {cit_token}"}
        )
        self.assertEqual(res_cit_patch.status_code, 403)

        # Revenue officer can PATCH status -> 200 OK
        res_off_patch = self.client.patch(
            f"/api/service-requests/{req_id}",
            json={"status": "UNDER_REVIEW", "remarks": "Officer started field survey."},
            headers={"Authorization": f"Bearer {rev_token}"}
        )
        self.assertEqual(res_off_patch.status_code, 200)
        self.assertEqual(res_off_patch.json()["status"], "UNDER_REVIEW")


if __name__ == "__main__":
    unittest.main()
