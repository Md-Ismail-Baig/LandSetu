"""
LandSetu Backend — Authentication Router

Provides login, token issuance, and current authenticated user resolution.
"""

from fastapi import APIRouter, HTTPException, status, Depends
from config import DISCLAIMER
from models import (
    LoginRequest,
    LoginResponse,
    SignupRequest,
    UserPayload,
    UserRecord,
    AdminUserListResponse,
    AdminSystemStatsResponse,
    ErrorResponse,
)
from core.auth import (
    authenticate_user,
    create_access_token,
    get_current_user,
    register_new_user,
    get_all_users,
    require_admin,
)
from services.audit_service import log_audit_event, get_audit_events
from database import get_connection

router = APIRouter(tags=["Authentication & Admin"])


@router.post(
    "/auth/login",
    response_model=LoginResponse,
    responses={
        401: {"model": ErrorResponse, "description": "Invalid credentials"},
    },
    summary="Authenticate user and issue JWT access token",
)
async def login(payload: LoginRequest):
    """
    Authenticate user credentials (username or email) and receive a signed Bearer JWT token.
    
    Supported demo credentials:
    - `citizen` / `demo123`
    - `revenue.officer` / `demo123`
    - `registration.officer` / `demo123`
    - `municipal.officer` / `demo123`
    - `admin` / `demo123`
    """
    user = authenticate_user(payload.username, payload.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password. Please check your credentials.",
        )

    token = create_access_token(user)

    # Log successful login event
    log_audit_event(
        username=user["username"],
        role=user["role"],
        action="USER_LOGIN_SUCCESS",
        status="SUCCESS",
        remarks=f"User logged in with role {user['role']}",
    )

    return LoginResponse(
        access_token=token,
        token_type="bearer",
        user=UserPayload(
            username=user["username"],
            name=user["name"],
            role=user["role"],
            email=user.get("email"),
            mobile=user.get("mobile"),
            department=user.get("department"),
            status=user.get("status", "ACTIVE"),
            created_at=user.get("created_at"),
        ),
    )


@router.post(
    "/auth/signup",
    response_model=LoginResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid registration details or email in use"},
        403: {"model": ErrorResponse, "description": "Admin registration forbidden"},
    },
    summary="Register a new citizen or officer account",
)
async def signup(payload: SignupRequest):
    """
    Create a new user account with role Citizen, Revenue Officer, Registration Officer, or Municipal Officer.
    Direct Admin registration is strictly blocked.
    """
    user = register_new_user(
        name=payload.name,
        email=payload.email,
        mobile=payload.mobile,
        password=payload.password,
        role=payload.role,
        department=payload.department,
    )

    token = create_access_token(user)

    log_audit_event(
        username=user["username"],
        role=user["role"],
        action="USER_REGISTRATION",
        status="SUCCESS",
        remarks=f"New user registered: {user['name']} ({user['role']})",
    )

    return LoginResponse(
        access_token=token,
        token_type="bearer",
        user=UserPayload(
            username=user["username"],
            name=user["name"],
            role=user["role"],
            email=user.get("email"),
            mobile=user.get("mobile"),
            department=user.get("department"),
            status=user.get("status", "ACTIVE"),
            created_at=user.get("created_at"),
        ),
    )


@router.get(
    "/auth/me",
    response_model=UserPayload,
    responses={
        401: {"model": ErrorResponse, "description": "Unauthenticated"},
    },
    summary="Get current authenticated user profile",
)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Retrieve profile and role information for the currently active JWT token."""
    return UserPayload(
        username=current_user["username"],
        name=current_user.get("name", current_user["username"]),
        role=current_user["role"],
        email=current_user.get("email"),
        mobile=current_user.get("mobile"),
        department=current_user.get("department"),
        status=current_user.get("status", "ACTIVE"),
        created_at=current_user.get("created_at"),
    )


# ==========================================
# Admin Protected Endpoints
# ==========================================

@router.get(
    "/admin/users",
    response_model=AdminUserListResponse,
    responses={
        401: {"model": ErrorResponse, "description": "Unauthenticated"},
        403: {"model": ErrorResponse, "description": "Admin access required"},
    },
    summary="List all registered platform users (Admin only)",
)
async def list_users(admin_user: dict = Depends(require_admin)):
    """Retrieve full list of registered platform users and their roles (Admin only)."""
    users = get_all_users()
    user_records = [
        UserRecord(
            username=u["username"],
            name=u["name"],
            role=u["role"],
            email=u.get("email"),
            mobile=u.get("mobile"),
            department=u.get("department"),
            status=u.get("status", "ACTIVE"),
            created_at=u.get("created_at", "2026-01-01T00:00:00Z"),
        )
        for u in users
    ]
    return AdminUserListResponse(
        count=len(user_records),
        users=user_records,
        disclaimer=DISCLAIMER,
    )


@router.get(
    "/admin/system-stats",
    response_model=AdminSystemStatsResponse,
    responses={
        401: {"model": ErrorResponse, "description": "Unauthenticated"},
        403: {"model": ErrorResponse, "description": "Admin access required"},
    },
    summary="Get system-wide administrative statistics (Admin only)",
)
async def get_admin_system_stats(admin_user: dict = Depends(require_admin)):
    """Calculate system-wide statistics across users, parcels, requests, and verifications."""
    users = get_all_users()
    citizens = [u for u in users if u["role"] == "Citizen"]
    officers = [u for u in users if u["role"] != "Citizen" and u["role"] != "Admin"]

    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM parcels")
    parcels_count = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM verifications WHERE status = 'PENDING'")
    pending_verif = c.fetchone()[0]
    conn.close()

    from services.service_request_service import get_service_requests
    req_res = get_service_requests(user={"role": "Admin", "username": "admin"})

    audits = get_audit_events()

    return AdminSystemStatsResponse(
        total_users=len(users),
        total_citizens=len(citizens),
        total_officers=len(officers),
        total_parcels=parcels_count,
        total_requests=req_res["count"],
        pending_verifications=pending_verif,
        audit_events_count=len(audits),
        disclaimer=DISCLAIMER,
    )
