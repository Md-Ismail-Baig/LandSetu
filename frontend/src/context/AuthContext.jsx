import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, signupUser, getMe } from '../services/api';

const AuthContext = createContext(null);

export const DEMO_ACCOUNTS = [
  {
    username: 'citizen',
    password: 'demo123',
    role: 'Citizen',
    name: 'Ramesh Kumar',
    email: 'ramesh.kumar@example.com',
    mobile: '+91 98765 43210',
    department: 'Public Citizen',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    description: 'Public citizen experience with land parcel search, title viewing, and service request filing.',
  },
  {
    username: 'revenue.officer',
    password: 'demo123',
    role: 'Revenue Officer',
    name: 'K. S. Narayana',
    email: 'narayana.ks@landrecords.gov.in',
    mobile: '+91 98450 12345',
    department: 'Department of Revenue & Land Records',
    badgeColor: 'bg-blue-50 text-blue-800 border-blue-300',
    description: 'Revenue authority for parcel verification, satellite change evaluation, and cadastral records.',
  },
  {
    username: 'registration.officer',
    password: 'demo123',
    role: 'Registration Officer',
    name: 'Priya Deshmukh',
    email: 'priya.deshmukh@igr.gov.in',
    mobile: '+91 98450 23456',
    department: 'Inspector General of Registration (IGR)',
    badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-300',
    description: 'Registration authority for title deeds, encumbrance certificates, and transfer conveyance.',
  },
  {
    username: 'municipal.officer',
    password: 'demo123',
    role: 'Municipal Officer',
    name: 'Anil Kumar Rao',
    email: 'anil.rao@bbmp.gov.in',
    mobile: '+91 98450 34567',
    department: 'BBMP Town Planning & Municipal Revenue',
    badgeColor: 'bg-purple-50 text-purple-800 border-purple-300',
    description: 'Municipal authority for property tax assessment, zoning compliance, and building utility approvals.',
  },
  {
    username: 'admin',
    password: 'demo123',
    role: 'Admin',
    name: 'System Administrator',
    email: 'admin@landsetu.gov.in',
    mobile: '+91 99000 00000',
    department: 'DPI Platform Administration',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-300',
    description: 'Full administrative access across users, parcels, audit logs, and platform operations.',
  },
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const cachedUser = localStorage.getItem('landsetu_user');
    if (cachedUser) {
      try {
        return JSON.parse(cachedUser);
      } catch (e) {
        return null;
      }
    }
    // No auto-login fallback — user must authenticate explicitly
    return null;
  });

  const [token, setToken] = useState(() => localStorage.getItem('landsetu_token') || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Validate existing token on mount — NO auto-login
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('landsetu_token');
      if (!storedToken) {
        // No token — user is not authenticated. Do NOT auto-login.
        setUser(null);
        setToken('');
        setLoading(false);
        return;
      }

      // Token exists — validate it via /auth/me
      try {
        const profile = await getMe();
        if (profile) {
          const cachedUser = localStorage.getItem('landsetu_user');
          const existing = cachedUser ? JSON.parse(cachedUser) : {};
          const merged = { ...existing, ...profile };
          setUser(merged);
          localStorage.setItem('landsetu_user', JSON.stringify(merged));
        }
      } catch (err) {
        // Token expired or server unreachable — clear auth state
        console.warn('Token validation failed. Clearing session.');
        setUser(null);
        setToken('');
        localStorage.removeItem('landsetu_token');
        localStorage.removeItem('landsetu_user');
      } finally {
        setLoading(false);
      }
    };
    initializeAuth();
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await loginUser(username, password);
      setToken(data.access_token);
      setUser(data.user);
      localStorage.setItem('landsetu_token', data.access_token);
      localStorage.setItem('landsetu_user', JSON.stringify(data.user));
      return data.user;
    } catch (err) {
      if (!err.isNetworkError) {
        setError(err.message || 'Login failed. Please verify credentials.');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const data = await signupUser(formData);
      setToken(data.access_token);
      setUser(data.user);
      localStorage.setItem('landsetu_token', data.access_token);
      localStorage.setItem('landsetu_user', JSON.stringify(data.user));
      return data.user;
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your details.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const switchDemoUser = async (username) => {
    const targetAccount = DEMO_ACCOUNTS.find((a) => a.username === username);
    if (!targetAccount) return;
    return await login(targetAccount.username, targetAccount.password);
  };

  const logout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('landsetu_token');
    localStorage.removeItem('landsetu_user');
  };

  const hasRole = (allowedRoles = []) => {
    if (!user) return false;
    if (user.role === 'Admin') return true;
    return allowedRoles.some((r) => r.toLowerCase() === user.role.toLowerCase());
  };

  const isAuthenticated = !!user && !!token;
  const isCitizen = user?.role === 'Citizen';
  const isOfficer = user?.role ? user.role.includes('Officer') : false;
  const isAdmin = user?.role === 'Admin';
  const isRevenueOfficer = user?.role === 'Revenue Officer';
  const isRegistrationOfficer = user?.role === 'Registration Officer';
  const isMunicipalOfficer = user?.role === 'Municipal Officer';
  const hasVerificationAuthority = isRevenueOfficer || isAdmin;

  const value = {
    user,
    token,
    loading,
    error,
    login,
    signup,
    logout,
    switchDemoUser,
    hasRole,
    isAuthenticated,
    isCitizen,
    isOfficer,
    isAdmin,
    isRevenueOfficer,
    isRegistrationOfficer,
    isMunicipalOfficer,
    hasVerificationAuthority,
    demoAccounts: DEMO_ACCOUNTS,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
