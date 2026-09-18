"""
LandSetu Backend — Centralized RBAC Permissions

Defines all platform permissions and maps them to roles.
All authorization checks should use require_permission() or require_roles().
Never scatter `if role == 'admin'` checks across the codebase.
"""

from enum import Enum
from typing import List, Callable, Set
from fastapi import HTTPException, status, Depends
from core.auth import get_current_user


# ==========================================
# Permission Constants
# ==========================================

class Permission(str, Enum):
    # Parcel
    PARCEL_VIEW = "PARCEL_VIEW"
    PARCEL_SEARCH = "PARCEL_SEARCH"
    PARCEL_EDIT = "PARCEL_EDIT"

    # Ownership
    OWNERSHIP_VIEW = "OWNERSHIP_VIEW"
    OWNERSHIP_UPDATE = "OWNERSHIP_UPDATE"

    # Registration
    REGISTRATION_VIEW = "REGISTRATION_VIEW"
    REGISTRATION_UPDATE = "REGISTRATION_UPDATE"

    # Planning & Utilities
    TAX_VIEW = "TAX_VIEW"
    PLANNING_VIEW = "PLANNING_VIEW"
    UTILITIES_VIEW = "UTILITIES_VIEW"
    RESTRICTIONS_VIEW = "RESTRICTIONS_VIEW"

    # Document Verification
    DOCUMENT_SUBMIT = "DOCUMENT_SUBMIT"
    DOCUMENT_VIEW = "DOCUMENT_VIEW"
    DOCUMENT_REVIEW = "DOCUMENT_REVIEW"
    DOCUMENT_APPROVE = "DOCUMENT_APPROVE"
    DOCUMENT_REJECT = "DOCUMENT_REJECT"

    # Parcel Verification (satellite)
    VERIFICATION_CREATE = "VERIFICATION_CREATE"
    VERIFICATION_REVIEW = "VERIFICATION_REVIEW"
    VERIFICATION_APPROVE = "VERIFICATION_APPROVE"
    VERIFICATION_REJECT = "VERIFICATION_REJECT"

    # Land Transfer
    LAND_TRANSFER_CREATE = "LAND_TRANSFER_CREATE"
    LAND_TRANSFER_VIEW = "LAND_TRANSFER_VIEW"
    LAND_TRANSFER_REVIEW = "LAND_TRANSFER_REVIEW"
    LAND_TRANSFER_APPROVE = "LAND_TRANSFER_APPROVE"
    LAND_TRANSFER_REJECT = "LAND_TRANSFER_REJECT"

    # Parcel Subdivision
    SUBDIVISION_CREATE = "SUBDIVISION_CREATE"
    SUBDIVISION_VIEW = "SUBDIVISION_VIEW"
    SUBDIVISION_REVIEW = "SUBDIVISION_REVIEW"
    SUBDIVISION_APPROVE = "SUBDIVISION_APPROVE"
    SUBDIVISION_REJECT = "SUBDIVISION_REJECT"

    # Administration
    AUDIT_VIEW = "AUDIT_VIEW"
    USER_MANAGE = "USER_MANAGE"
    SYSTEM_SETTINGS = "SYSTEM_SETTINGS"


# ==========================================
# Role → Permissions Map
# ==========================================

CITIZEN_PERMISSIONS: Set[str] = {
    Permission.PARCEL_VIEW,
    Permission.PARCEL_SEARCH,
    Permission.OWNERSHIP_VIEW,
    Permission.REGISTRATION_VIEW,
    Permission.TAX_VIEW,
    Permission.PLANNING_VIEW,
    Permission.UTILITIES_VIEW,
    Permission.RESTRICTIONS_VIEW,
    Permission.DOCUMENT_SUBMIT,
    Permission.DOCUMENT_VIEW,
    Permission.VERIFICATION_CREATE,
    Permission.LAND_TRANSFER_CREATE,
    Permission.LAND_TRANSFER_VIEW,
    Permission.SUBDIVISION_CREATE,
    Permission.SUBDIVISION_VIEW,
}

REVENUE_OFFICER_PERMISSIONS: Set[str] = {
    Permission.PARCEL_VIEW,
    Permission.PARCEL_SEARCH,
    Permission.PARCEL_EDIT,
    Permission.OWNERSHIP_VIEW,
    Permission.OWNERSHIP_UPDATE,
    Permission.REGISTRATION_VIEW,
    Permission.TAX_VIEW,
    Permission.PLANNING_VIEW,
    Permission.UTILITIES_VIEW,
    Permission.RESTRICTIONS_VIEW,
    Permission.DOCUMENT_VIEW,
    Permission.DOCUMENT_REVIEW,
    Permission.DOCUMENT_APPROVE,
    Permission.DOCUMENT_REJECT,
    Permission.VERIFICATION_CREATE,
    Permission.VERIFICATION_REVIEW,
    Permission.VERIFICATION_APPROVE,
    Permission.VERIFICATION_REJECT,
    Permission.LAND_TRANSFER_VIEW,
    Permission.LAND_TRANSFER_REVIEW,
    Permission.SUBDIVISION_VIEW,
    Permission.SUBDIVISION_REVIEW,
    Permission.SUBDIVISION_APPROVE,
    Permission.SUBDIVISION_REJECT,
    Permission.AUDIT_VIEW,
}

REGISTRATION_OFFICER_PERMISSIONS: Set[str] = {
    Permission.PARCEL_VIEW,
    Permission.PARCEL_SEARCH,
    Permission.OWNERSHIP_VIEW,
    Permission.REGISTRATION_VIEW,
    Permission.REGISTRATION_UPDATE,
    Permission.TAX_VIEW,
    Permission.RESTRICTIONS_VIEW,
    Permission.DOCUMENT_VIEW,
    Permission.DOCUMENT_REVIEW,
    Permission.DOCUMENT_APPROVE,
    Permission.DOCUMENT_REJECT,
    Permission.LAND_TRANSFER_VIEW,
    Permission.LAND_TRANSFER_REVIEW,
    Permission.LAND_TRANSFER_APPROVE,
    Permission.LAND_TRANSFER_REJECT,
    Permission.SUBDIVISION_VIEW,
    Permission.AUDIT_VIEW,
}

MUNICIPAL_OFFICER_PERMISSIONS: Set[str] = {
    Permission.PARCEL_VIEW,
    Permission.PARCEL_SEARCH,
    Permission.OWNERSHIP_VIEW,
    Permission.TAX_VIEW,
    Permission.PLANNING_VIEW,
    Permission.UTILITIES_VIEW,
    Permission.RESTRICTIONS_VIEW,
    Permission.SUBDIVISION_VIEW,
    Permission.SUBDIVISION_REVIEW,
    Permission.SUBDIVISION_APPROVE,
    Permission.SUBDIVISION_REJECT,
    Permission.AUDIT_VIEW,
}

ADMIN_PERMISSIONS: Set[str] = {"*"}  # All permissions

ROLE_PERMISSION_MAP = {
    "Citizen": CITIZEN_PERMISSIONS,
    "Revenue Officer": REVENUE_OFFICER_PERMISSIONS,
    "Registration Officer": REGISTRATION_OFFICER_PERMISSIONS,
    "Municipal Officer": MUNICIPAL_OFFICER_PERMISSIONS,
    "Admin": ADMIN_PERMISSIONS,
}


# ==========================================
# Role Enum (for type-safety)
# ==========================================

class Role(str, Enum):
    CITIZEN = "Citizen"
    REVENUE_OFFICER = "Revenue Officer"
    REGISTRATION_OFFICER = "Registration Officer"
    MUNICIPAL_OFFICER = "Municipal Officer"
    ADMIN = "Admin"


# ==========================================
# RBAC Dependency Factories
# ==========================================

def user_has_permission(user: dict, permission: str) -> bool:
    """Check whether a user has a specific permission based on their role."""
    role = user.get("role", "")
    role_perms = ROLE_PERMISSION_MAP.get(role, set())
    if "*" in role_perms:
        return True  # Admin has all permissions
    return permission in role_perms


def require_permission(permission: str) -> Callable:
    """
    FastAPI dependency factory that enforces a specific permission.
    Returns 403 if user lacks the required permission.
    """
    async def permission_checker(current_user: dict = Depends(get_current_user)) -> dict:
        if not user_has_permission(current_user, permission):
            user_role = current_user.get("role", "Unknown")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Access denied. Permission '{permission}' is required. "
                    f"Your role '{user_role}' does not have this permission."
                ),
            )
        return current_user
    return permission_checker


def require_roles(allowed_roles: List[str]) -> Callable:
    """
    FastAPI dependency factory to enforce Role-Based Access Control (RBAC).
    Verifies that the authenticated user has one of the allowed roles.
    Admins are always granted access.
    """
    async def role_checker(current_user: dict = Depends(get_current_user)) -> dict:
        user_role = current_user.get("role", "")
        allowed_lower = [r.lower() for r in allowed_roles]
        if user_role.lower() not in allowed_lower and user_role.lower() != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Access denied. Role '{user_role}' is not authorized. "
                    f"Required roles: {', '.join(allowed_roles)}."
                ),
            )
        return current_user
    return role_checker
