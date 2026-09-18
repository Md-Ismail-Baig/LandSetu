import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Attach Authorization Bearer token automatically if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('landsetu_token') || sessionStorage.getItem('landsetu_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ==========================================
// Authentication APIs
// ==========================================

export const loginUser = async (username, password) => {
  try {
    const response = await apiClient.post('/auth/login', { username, password });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const signupUser = async (userData) => {
  try {
    const response = await apiClient.post('/auth/signup', userData);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getMe = async () => {
  try {
    const response = await apiClient.get('/auth/me');
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getAdminUsers = async () => {
  try {
    const response = await apiClient.get('/admin/users');
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getAdminSystemStats = async () => {
  try {
    const response = await apiClient.get('/admin/system-stats');
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

// ==========================================
// Dashboard & Governance Summary APIs
// ==========================================

export const getDashboardSummary = async () => {
  try {
    const response = await apiClient.get('/dashboard/summary');
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getRecentActivity = async () => {
  try {
    const response = await apiClient.get('/dashboard/recent-activity');
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

// ==========================================
// Parcel & GIS APIs
// ==========================================

export const getParcelByUlpin = async (ulpin) => {
  try {
    const response = await apiClient.get(`/parcels/${encodeURIComponent(ulpin)}`);
    return response.data;
  } catch (error) {
    handleApiError(error, ulpin);
  }
};

export const getIntegratedView = async (ulpin) => {
  try {
    const response = await apiClient.get(`/parcels/${encodeURIComponent(ulpin)}/integrated-view`);
    return response.data;
  } catch (error) {
    handleApiError(error, ulpin);
  }
};

export const getParcelMap = async (ulpin) => {
  try {
    const response = await apiClient.get(`/parcels/${encodeURIComponent(ulpin)}/map`);
    return response.data;
  } catch (error) {
    handleApiError(error, ulpin);
  }
};

export const getParcels = async () => {
  try {
    const response = await apiClient.get('/parcels');
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

// ==========================================
// Grounded AI Parcel Assistant API
// ==========================================

export const queryAIAssistant = async (ulpin, query) => {
  try {
    const response = await apiClient.post('/ai/query', { ulpin, query });
    return response.data;
  } catch (error) {
    handleApiError(error, ulpin);
  }
};

// ==========================================
// Satellite Change Monitoring API
// ==========================================

export const getSatelliteData = async (ulpin) => {
  try {
    const response = await apiClient.get(`/satellite/${encodeURIComponent(ulpin)}`);
    return response.data;
  } catch (error) {
    handleApiError(error, ulpin);
  }
};

// ==========================================
// Verification Workflow & Audit APIs
// ==========================================

export const getVerification = async (ulpin) => {
  try {
    const response = await apiClient.get(`/parcels/${encodeURIComponent(ulpin)}/verification`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    handleApiError(error, ulpin);
  }
};

export const initiateVerification = async (ulpin, remarks) => {
  try {
    const response = await apiClient.post(`/parcels/${encodeURIComponent(ulpin)}/verification`, { remarks });
    return response.data;
  } catch (error) {
    handleApiError(error, ulpin);
  }
};

export const approveVerification = async (ulpin, remarks) => {
  try {
    const response = await apiClient.post(`/parcels/${encodeURIComponent(ulpin)}/verification/approve`, { remarks });
    return response.data;
  } catch (error) {
    handleApiError(error, ulpin);
  }
};

export const rejectVerification = async (ulpin, remarks) => {
  try {
    const response = await apiClient.post(`/parcels/${encodeURIComponent(ulpin)}/verification/reject`, { remarks });
    return response.data;
  } catch (error) {
    handleApiError(error, ulpin);
  }
};

export const getAuditEvents = async (ulpin) => {
  try {
    const response = await apiClient.get(`/parcels/${encodeURIComponent(ulpin)}/audit`);
    return response.data;
  } catch (error) {
    handleApiError(error, ulpin);
  }
};

// ==========================================
// Generic Service Request Framework APIs
// ==========================================

export const getServiceRequests = async (params = {}) => {
  try {
    const response = await apiClient.get('/service-requests', { params });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getServiceRequestById = async (requestId) => {
  try {
    const response = await apiClient.get(`/service-requests/${encodeURIComponent(requestId)}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const createServiceRequest = async (requestData) => {
  try {
    const response = await apiClient.post('/service-requests', requestData);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const patchServiceRequest = async (requestId, updateData) => {
  try {
    const response = await apiClient.patch(`/service-requests/${encodeURIComponent(requestId)}`, updateData);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

// ==========================================
// Document Verification Workflow APIs (Phase 8)
// ==========================================

export const getDocumentVerifications = async (params = {}) => {
  try {
    const response = await apiClient.get('/document-verification', { params });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getDocumentVerificationById = async (identifier) => {
  try {
    const response = await apiClient.get(`/document-verification/${encodeURIComponent(identifier)}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const createDocumentVerification = async (docData) => {
  try {
    const response = await apiClient.post('/document-verification', docData);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const runDocumentVerificationCheck = async (identifier) => {
  try {
    const response = await apiClient.post(`/document-verification/${encodeURIComponent(identifier)}/verify`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const approveDocumentVerification = async (identifier, remarks = '') => {
  try {
    const response = await apiClient.post(`/document-verification/${encodeURIComponent(identifier)}/approve`, {
      decision: 'APPROVED',
      remarks: remarks || 'Official document verification approved.',
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const rejectDocumentVerification = async (identifier, remarks) => {
  try {
    const response = await apiClient.post(`/document-verification/${encodeURIComponent(identifier)}/reject`, {
      decision: 'REJECTED',
      remarks,
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

// ==========================================
// Land Transfer APIs (Phase 9 & 10)
// ==========================================

export const getLandTransfers = async (params = {}) => {
  try {
    const response = await apiClient.get('/land-transfer', { params });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getLandTransferById = async (identifier) => {
  try {
    const response = await apiClient.get(`/land-transfer/${encodeURIComponent(identifier)}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const createLandTransfer = async (transferData) => {
  try {
    const response = await apiClient.post('/land-transfer', transferData);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const approveLandTransfer = async (identifier, remarks = '') => {
  try {
    const response = await apiClient.post(`/land-transfer/${encodeURIComponent(identifier)}/approve`, {
      remarks: remarks || 'Official land transfer approved.',
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const rejectLandTransfer = async (identifier, remarks) => {
  try {
    const response = await apiClient.post(`/land-transfer/${encodeURIComponent(identifier)}/reject`, { remarks });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

// ==========================================
// Parcel Subdivision APIs (Phase 10)
// ==========================================

export const getSubdivisions = async (params = {}) => {
  try {
    const response = await apiClient.get('/parcel-subdivision', { params });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getSubdivisionById = async (identifier) => {
  try {
    const response = await apiClient.get(`/parcel-subdivision/${encodeURIComponent(identifier)}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const createSubdivision = async (subdivisionData) => {
  try {
    const response = await apiClient.post('/parcel-subdivision', subdivisionData);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const validateSubdivision = async (parentUlpin, data) => {
  try {
    const response = await apiClient.post(`/parcel-subdivision/validate?parent_ulpin=${encodeURIComponent(parentUlpin)}`, data);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const approveSubdivision = async (identifier, remarks = '') => {
  try {
    const response = await apiClient.post(`/parcel-subdivision/${encodeURIComponent(identifier)}/approve`, {
      remarks: remarks || 'Subdivision application approved.',
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const rejectSubdivision = async (identifier, remarks) => {
  try {
    const response = await apiClient.post(`/parcel-subdivision/${encodeURIComponent(identifier)}/reject`, { remarks });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getChildParcels = async (parentUlpin) => {
  try {
    const response = await apiClient.get(`/parcels/${encodeURIComponent(parentUlpin)}/children`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

// ==========================================
// Permissioned Digital Ledger / Blockchain APIs
// ==========================================

export const getBlockchainTransactions = async (params = {}) => {
  try {
    const response = await apiClient.get('/blockchain/transactions', { params });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getBlockchainTransactionById = async (transactionId) => {
  try {
    const response = await apiClient.get(`/blockchain/transactions/${encodeURIComponent(transactionId)}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const verifyBlockchainChain = async () => {
  try {
    const response = await apiClient.get('/blockchain/verify');
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const tamperBlockchainTest = async (transactionId) => {
  try {
    const response = await apiClient.post(`/blockchain/tamper-test?transaction_id=${encodeURIComponent(transactionId)}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const repairBlockchainTest = async () => {
  try {
    const response = await apiClient.post('/blockchain/repair-test');
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

// ==========================================
// Platform Health API
// ==========================================

export const checkHealth = async () => {

  try {
    const response = await apiClient.get('/health');
    return response.data;
  } catch (error) {
    return { status: 'offline' };
  }
};

// ==========================================
// Error Normalizer
// ==========================================

function handleApiError(error, ulpin = '') {
  if (error.response) {
    const status = error.response.status;
    const detail = error.response.data?.detail || 'An unexpected API error occurred.';
    const customErr = new Error(detail);
    customErr.status = status;
    if (status === 404) customErr.isNotFound = true;
    if (status === 401) customErr.isUnauthorized = true;
    if (status === 403) customErr.isForbidden = true;
    if (status === 409) customErr.isConflict = true;
    throw customErr;
  } else if (error.request) {
    const networkErr = new Error('Unable to connect to LandSetu backend server. Please verify the server is running on port 8000.');
    networkErr.isNetworkError = true;
    throw networkErr;
  } else {
    throw error;
  }
}

export default apiClient;
