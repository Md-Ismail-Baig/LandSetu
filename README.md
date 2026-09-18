# LandSetu

> **One Parcel. One Identity. One Integrated Land Ecosystem.**

An Integrated GIS-based Digital Public Infrastructure (DPI) for Land Governance.

---

## ⚠️ Mandatory Disclaimer

**All records, cadastral maps, titles, and verification decisions in this platform are fictional demonstration data created for the LandSetu digital public infrastructure platform. They must not be interpreted as actual government land records or legal determinations.**

---

## High-Level Architecture (Phase 1 through Phase 7)

```
┌────────────────────────────────────────────────────────────────────────┐
│                      LandSetu Application Shell                        │
│  - Persistent Sidebar & Header with Role Switcher & Live Notifications │
│  - React Router: /dashboard, /search, /gis-map, /ai-assistant,         │
│    /change-monitoring, /service-requests, /service-requests/:id        │
│  - Professional Placeholders: Document Verification, Land Transfer,   │
│    Parcel Subdivision, Blockchain Audit, Admin                         │
└────────────────────────────────────────────────────────────────────────┘
                                    │ (Axios + JWT Bearer Auth)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        FastAPI Backend Engine                          │
│  - /api/auth: HS256 JWT login & profile resolution                     │
│  - /api/dashboard: Real metrics calculation & recent activity feed     │
│  - /api/service-requests: Generic Service Request Framework            │
│  - /api/parcels/{ulpin}/verification: State machine & RBAC review      │
│  - /api/parcels/{ulpin}/audit: Immutable chronological event ledger    │
│  - /api/parcels/{ulpin}/integrated-view: 6-department aggregation      │
│  - /api/ai/query: Grounded RAG Assistant query engine                  │
│  - /api/satellite/{ulpin}: Cadastral temporal change detection         │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        SQLite Relational Storage                       │
│  - parcels (master cadastral & title ledger)                           │
│  - verifications (workflow state machine cases)                        │
│  - service_requests (generic multi-workflow pipeline)                  │
│  - audit_events (immutable action log records)                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## RBAC Demo Accounts & Permissions Matrix

| Role | Username | Password | Permitted Platform Actions | Verification Authority |
| :--- | :--- | :--- | :--- | :--- |
| **Revenue Officer** | `revenue.officer` | `demo123` | View parcels, initiate verification, approve/reject satellite change cases | **Full Verification Authority** |
| **Registration Officer** | `registration.officer` | `demo123` | View parcels, deed registries, encumbrance certificates, transfer requests | No verification rights |
| **Municipal Officer** | `municipal.officer` | `demo123` | View parcels, property tax assessments, master plan zoning, utility clearances | No verification rights |
| **Citizen** | `citizen` | `demo123` | Search public parcels, submit service requests, view grounded AI responses | Public access only |
| **Admin** | `admin` | `demo123` | Full administrative oversight across all services, audit trails, and requests | Full Administrative access |

---

## Generic Service Request Framework

LandSetu implements a unified, extensible Service Request Framework supporting 4 core governance service types:

1. `PARCEL_VERIFICATION` — Directly integrated with the satellite change verification state machine (`PENDING → APPROVED / REJECTED`).
2. `DOCUMENT_VERIFICATION` — Framework-ready tracking for registered sale deeds & encumbrance certificate validations (Phase 8).
3. `LAND_TRANSFER` — Framework-ready tracking for digital title conveyance and mutation workflows (Phase 9).
4. `PARCEL_SUBDIVISION` — Framework-ready tracking for spatial partition and child ULPIN generation (Phase 10).

---

## API Endpoints

### 1. Authentication & RBAC
- `POST /api/auth/login` — Authenticate demo persona and receive signed JWT access token.
- `GET /api/auth/me` — Retrieve active user role and identity profile.

### 2. Dashboard & Platform Metrics
- `GET /api/dashboard/summary` — Aggregated live stats (total parcels, verifications, pending requests, alerts, audit events) + recent activity stream.
- `GET /api/dashboard/recent-activity` — Recent activity feed.

### 3. Generic Service Requests
- `GET /api/service-requests` — List & filter service requests by status, service type, or ULPIN.
- `GET /api/service-requests/{request_id}` — Inspect single service request and linked verification case.
- `POST /api/service-requests` — Submit a new service request.

### 4. Verification Workflow & Audit
- `POST /api/parcels/{ulpin}/verification` — Create a PENDING verification case (Revenue Officer only).
- `GET /api/parcels/{ulpin}/verification` — Get current verification case details.
- `POST /api/parcels/{ulpin}/verification/approve` — Approve pending verification with official remarks (Revenue Officer only).
- `POST /api/parcels/{ulpin}/verification/reject` — Reject pending verification with official remarks (Revenue Officer only).
- `GET /api/parcels/{ulpin}/audit` — Retrieve parcel audit log entries.

### 5. Cadastral Parcels & Integrated Ecosystem
- `GET /api/parcels` — List all parcels.
- `GET /api/parcels/{ulpin}` — Master parcel metadata.
- `GET /api/parcels/{ulpin}/integrated-view` — One Integrated Parcel View aggregating 6 departmental silos.
- `GET /api/parcels/{ulpin}/map` — GeoJSON cadastral geometry.
- `POST /api/ai/query` — Grounded RAG query assistant.
- `GET /api/satellite/{ulpin}` — Satellite change monitoring analysis.

---

## Quick Start & Running Locally

### Backend Setup & Execution
```bash
cd backend
python -m venv venv
venv\Scripts\activate            # Windows
# source venv/bin/activate       # Linux/macOS
pip install -r requirements.txt
python main.py
```
Backend runs on: `http://localhost:8000` (Swagger docs at `/docs`)

### Frontend Setup & Execution
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on: `http://localhost:5173`

