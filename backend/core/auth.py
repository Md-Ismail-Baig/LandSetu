"""
LandSetu Backend — Authentication & Lightweight JWT Engine

Provides zero-external-dependency RFC 7519 HMAC-SHA256 (HS256) JWT generation,
verification, and mock demo account credentials.
"""

import hmac
import hashlib
import base64
import json
import time
import os
from typing import Optional, Dict, Any, List
from fastapi import HTTPException, status, Header, Depends

# JWT secret key (environment or secure demo fallback)
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "landsetu_sih_dpi_super_secret_jwt_key_2026")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_SECONDS = 86400 * 7  # 7 days

# Persistent Demo & Registered User Registry
DEMO_USERS: Dict[str, Dict[str, Any]] = {
    "revenue.officer": {
        "username": "revenue.officer",
        "password": "demo123",
        "name": "K. S. Narayana",
        "email": "narayana.ks@landrecords.gov.in",
        "mobile": "+91 98450 12345",
        "role": "Revenue Officer",
        "department": "Department of Revenue & Land Records",
        "status": "ACTIVE",
        "created_at": "2026-01-15T09:00:00Z",
    },
    "registration.officer": {
        "username": "registration.officer",
        "password": "demo123",
        "name": "Priya Deshmukh",
        "email": "priya.deshmukh@igr.gov.in",
        "mobile": "+91 98450 23456",
        "role": "Registration Officer",
        "department": "Inspector General of Registration (IGR)",
        "status": "ACTIVE",
        "created_at": "2026-01-16T10:30:00Z",
    },
    "municipal.officer": {
        "username": "municipal.officer",
        "password": "demo123",
        "name": "Anil Kumar Rao",
        "email": "anil.rao@bbmp.gov.in",
        "mobile": "+91 98450 34567",
        "role": "Municipal Officer",
        "department": "BBMP Town Planning & Municipal Revenue",
        "status": "ACTIVE",
        "created_at": "2026-01-18T14:15:00Z",
    },
    "citizen": {
        "username": "citizen",
        "password": "demo123",
        "name": "Ramesh Kumar",
        "email": "ramesh.kumar@example.com",
        "mobile": "+91 98765 43210",
        "role": "Citizen",
        "department": "Public Citizen",
        "status": "ACTIVE",
        "created_at": "2026-02-01T11:00:00Z",
    },
    "admin": {
        "username": "admin",
        "password": "demo123",
        "name": "System Administrator",
        "email": "admin@landsetu.gov.in",
        "mobile": "+91 99000 00000",
        "role": "Admin",
        "department": "DPI Platform Administration",
        "status": "ACTIVE",
        "created_at": "2026-01-01T00:00:00Z",
    },
}

USER_REGISTRY: Dict[str, Dict[str, Any]] = dict(DEMO_USERS)


# --- Lightweight Base64URL & JWT Helpers ---

def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("utf-8")


def _b64url_decode(data: str) -> bytes:
    padding = 4 - (len(data) % 4)
    if padding != 4:
        data += "=" * padding
    return base64.urlsafe_b64decode(data.encode("utf-8"))


def create_access_token(user_data: Dict[str, Any], expires_delta: Optional[int] = None) -> str:
    """Create a signed HS256 JWT access token."""
    header = {"alg": JWT_ALGORITHM, "typ": "JWT"}
    exp = int(time.time()) + (expires_delta or JWT_EXPIRATION_SECONDS)
    payload = {
        "sub": user_data["username"],
        "username": user_data["username"],
        "role": user_data["role"],
        "name": user_data.get("name", user_data["username"]),
        "email": user_data.get("email", ""),
        "mobile": user_data.get("mobile", ""),
        "department": user_data.get("department", ""),
        "status": user_data.get("status", "ACTIVE"),
        "created_at": user_data.get("created_at", ""),
        "exp": exp,
        "iat": int(time.time()),
    }

    header_b64 = _b64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_b64 = _b64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")

    signature = hmac.new(
        JWT_SECRET_KEY.encode("utf-8"),
        signing_input,
        hashlib.sha256,
    ).digest()
    signature_b64 = _b64url_encode(signature)

    return f"{header_b64}.{payload_b64}.{signature_b64}"


def decode_access_token(token: str) -> Dict[str, Any]:
    """Verify and decode an HS256 JWT access token."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            raise ValueError("Invalid JWT format")

        header_b64, payload_b64, signature_b64 = parts
        signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")

        expected_sig = hmac.new(
            JWT_SECRET_KEY.encode("utf-8"),
            signing_input,
            hashlib.sha256,
        ).digest()

        provided_sig = _b64url_decode(signature_b64)
        if not hmac.compare_digest(expected_sig, provided_sig):
            raise ValueError("Invalid JWT signature")

        payload_bytes = _b64url_decode(payload_b64)
        payload = json.loads(payload_bytes.decode("utf-8"))

        if "exp" in payload and payload["exp"] < int(time.time()):
            raise ValueError("JWT token has expired")

        return payload
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def authenticate_user(identifier: str, password: str) -> Optional[Dict[str, Any]]:
    """Authenticate credentials against user registry by username or email."""
    query = identifier.strip().lower()
    
    # 1. Direct username match
    user = USER_REGISTRY.get(query)
    if user and user["password"] == password:
        return user
        
    # 2. Email match
    for u in USER_REGISTRY.values():
        if u.get("email", "").lower() == query and u["password"] == password:
            return u

    return None


def register_new_user(
    name: str,
    email: str,
    mobile: Optional[str],
    password: str,
    role: str,
    department: Optional[str] = None,
) -> Dict[str, Any]:
    """Register a new user into the registry. Prevents Admin self-registration."""
    normalized_role = role.strip()
    if normalized_role.lower() == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin registration is restricted. Administrator accounts must be provisioned by the system.",
        )

    # Validate allowed roles
    valid_roles = ["Citizen", "Revenue Officer", "Registration Officer", "Municipal Officer"]
    matched_role = next((r for r in valid_roles if r.lower() == normalized_role.lower()), None)
    if not matched_role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid user type '{role}'. Allowed options: {', '.join(valid_roles)}",
        )

    # Derive username from email or name
    username = email.split("@")[0].lower().replace(" ", ".")
    if username in USER_REGISTRY:
        username = f"{username}{len(USER_REGISTRY) + 1}"

    # Check if email already registered
    for u in USER_REGISTRY.values():
        if u.get("email", "").lower() == email.strip().lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"An account with email '{email}' already exists.",
            )

    dept_mapping = {
        "Citizen": "Public Citizen",
        "Revenue Officer": department or "Department of Revenue & Land Records",
        "Registration Officer": department or "Inspector General of Registration (IGR)",
        "Municipal Officer": department or "BBMP Town Planning & Municipal Revenue",
    }

    user_record = {
        "username": username,
        "password": password,
        "name": name.strip(),
        "email": email.strip().lower(),
        "mobile": mobile.strip() if mobile else None,
        "role": matched_role,
        "department": dept_mapping.get(matched_role, "Public"),
        "status": "ACTIVE",
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }

    USER_REGISTRY[username] = user_record
    return user_record


def get_all_users() -> List[Dict[str, Any]]:
    """Retrieve list of all registered platform users."""
    return list(USER_REGISTRY.values())


async def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """FastAPI dependency to extract and validate authenticated user from Bearer token."""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing. Authentication required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization scheme. Expected 'Bearer <token>'.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = parts[1]
    return decode_access_token(token)


async def get_optional_user(authorization: Optional[str] = Header(None)) -> Optional[Dict[str, Any]]:
    """Optional user extractor for endpoints accessible to both public and authenticated users."""
    if not authorization:
        return None
    try:
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            return decode_access_token(parts[1])
    except Exception:
        pass
    return None


def require_roles(allowed_roles: List[str]):
    """FastAPI dependency factory enforcing that current user role is within allowed_roles."""
    async def role_checker(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        user_role = current_user.get("role", "")
        # Admin is permitted on all officer operations unless explicitly restricted
        allowed_lower = [r.lower() for r in allowed_roles]
        if user_role.lower() not in allowed_lower and user_role.lower() != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Role '{user_role}' is not authorized. Allowed roles: {', '.join(allowed_roles)}",
            )
        return current_user
    return role_checker


async def require_admin(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """FastAPI dependency requiring strictly Admin role."""
    if current_user.get("role", "").lower() != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative privileges required. Access denied.",
        )
    return current_user
