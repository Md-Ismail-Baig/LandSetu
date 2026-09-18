import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';

/**
 * Centralized RBAC Permission Map
 * 
 * Maps each role to its allowed permission strings.
 * Admin role uses '*' wildcard for all permissions.
 */
const ROLE_PERMISSIONS = {
  Citizen: [
    'PARCEL_VIEW', 'PARCEL_SEARCH',
    'DOCUMENT_SUBMIT', 'DOCUMENT_VIEW',
    'VERIFICATION_CREATE',
    'LAND_TRANSFER_CREATE', 'LAND_TRANSFER_VIEW',
    'SUBDIVISION_CREATE', 'SUBDIVISION_VIEW',
    'SERVICE_REQUEST_CREATE', 'SERVICE_REQUEST_VIEW',
  ],
  'Revenue Officer': [
    'PARCEL_VIEW', 'PARCEL_SEARCH', 'PARCEL_EDIT',
    'OWNERSHIP_VIEW', 'REGISTRATION_VIEW', 'TAX_VIEW',
    'PLANNING_VIEW', 'UTILITIES_VIEW', 'RESTRICTIONS_VIEW',
    'DOCUMENT_VIEW', 'DOCUMENT_REVIEW', 'DOCUMENT_APPROVE', 'DOCUMENT_REJECT',
    'VERIFICATION_CREATE', 'VERIFICATION_REVIEW', 'VERIFICATION_APPROVE', 'VERIFICATION_REJECT',
    'LAND_TRANSFER_VIEW', 'LAND_TRANSFER_REVIEW',
    'SUBDIVISION_VIEW', 'SUBDIVISION_REVIEW', 'SUBDIVISION_APPROVE', 'SUBDIVISION_REJECT',
    'SERVICE_REQUEST_VIEW', 'SERVICE_REQUEST_REVIEW',
    'AUDIT_VIEW',
    'GIS_VIEW', 'AI_ASSISTANT', 'CHANGE_MONITORING',
  ],
  'Registration Officer': [
    'PARCEL_VIEW', 'PARCEL_SEARCH',
    'REGISTRATION_VIEW', 'REGISTRATION_UPDATE',
    'DOCUMENT_VIEW', 'DOCUMENT_REVIEW', 'DOCUMENT_APPROVE', 'DOCUMENT_REJECT',
    'LAND_TRANSFER_VIEW', 'LAND_TRANSFER_REVIEW', 'LAND_TRANSFER_APPROVE', 'LAND_TRANSFER_REJECT',
    'SUBDIVISION_VIEW',
    'SERVICE_REQUEST_VIEW', 'SERVICE_REQUEST_REVIEW',
    'AUDIT_VIEW',
  ],
  'Municipal Officer': [
    'PARCEL_VIEW', 'PARCEL_SEARCH',
    'TAX_VIEW', 'PLANNING_VIEW', 'UTILITIES_VIEW', 'RESTRICTIONS_VIEW',
    'SUBDIVISION_VIEW', 'SUBDIVISION_REVIEW', 'SUBDIVISION_APPROVE', 'SUBDIVISION_REJECT',
    'SERVICE_REQUEST_VIEW', 'SERVICE_REQUEST_REVIEW',
    'AUDIT_VIEW',
  ],
  Admin: ['*'], // All permissions
};

const PermissionsContext = createContext(null);

export const PermissionsProvider = ({ children }) => {
  const { user } = useAuth();

  const permissions = useMemo(() => {
    const role = user?.role || '';
    const rolePerms = ROLE_PERMISSIONS[role] || [];

    const can = (permission) => {
      if (!user) return false;
      if (rolePerms.includes('*')) return true;
      return rolePerms.includes(permission);
    };

    const canAny = (...perms) => perms.some((p) => can(p));
    const canAll = (...perms) => perms.every((p) => can(p));

    return { can, canAny, canAll, role, rolePerms };
  }, [user]);

  return (
    <PermissionsContext.Provider value={permissions}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
};

export { ROLE_PERMISSIONS };
export default PermissionsContext;
