"""
LandSetu Backend — Main Application

FastAPI application entry point with CORS, router mounting, database
initialization, and demo seed data loading.

All records served by this API are fictional demo data.
They must not be interpreted as actual government land records.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import APP_NAME, APP_VERSION, CORS_ORIGINS, HOST, PORT, DEBUG, DISCLAIMER
from database import init_db, get_connection
from seed_data import seed_database
from services.service_request_service import seed_default_service_requests
from services.document_verification_service import seed_default_document_verifications
from services.land_transfer_service import seed_default_land_transfers
from services.subdivision_service import seed_default_subdivisions
from services.blockchain_service import init_ledger
from routers import (
    health,
    parcels,
    ai,
    satellite,
    auth,
    workflow,
    service_requests,
    dashboard,
    document_verification,
    land_transfer,
    parcel_subdivision,
    blockchain,
)

# --- Application ---

app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description=(
        "An Integrated GIS-based Digital Public Infrastructure for Land Governance. "
        f"\n\n⚠️ {DISCLAIMER}"
    ),
    docs_url="/docs",
    redoc_url="/redoc",
)

# --- CORS ---

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials="*" not in CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Routers ---

app.include_router(health.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(parcels.router, prefix="/api")
app.include_router(ai.router, prefix="/api")
app.include_router(satellite.router, prefix="/api")
app.include_router(workflow.router, prefix="/api")
app.include_router(service_requests.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(document_verification.router, prefix="/api")
app.include_router(land_transfer.router, prefix="/api")
app.include_router(parcel_subdivision.router, prefix="/api")
app.include_router(parcel_subdivision.children_router, prefix="/api")
app.include_router(blockchain.router, prefix="/api")


# --- Root ---

@app.get("/", tags=["Root"])
async def root():
    """Root endpoint — API information."""
    return {
        "name": APP_NAME,
        "version": APP_VERSION,
        "description": "Integrated GIS-based Digital Public Infrastructure for Land Governance",
        "docs": "/docs",
        "disclaimer": DISCLAIMER,
    }


@app.head("/", include_in_schema=False)
async def root_head():
    """Respond to platform port probes at the root path."""
    return None


# --- Startup ---

@app.on_event("startup")
async def startup():
    """Initialize database and seed demo data on application startup."""
    init_db()
    conn = get_connection()
    seeded = seed_database(conn)
    conn.close()
    if seeded:
        print("[OK] Database seeded with 5 fictional demo parcels.")
    else:
        print("[INFO] Database already contains data, skipping seed.")

    # Seed demo service requests, document verifications, land transfers, and subdivisions
    seed_default_service_requests()
    seed_default_document_verifications()
    seed_default_land_transfers()
    seed_default_subdivisions()
    
    # Initialize Digital Ledger genesis block
    init_ledger()
    print("[OK] Digital Ledger initialized with SHA-256 Genesis Block.")
    print("[OK] All workflow frameworks initialized (Service Requests, Documents, Land Transfers, Subdivisions, Ledger).")




# --- Run directly ---

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=HOST,
        port=PORT,
        reload=DEBUG,
    )
