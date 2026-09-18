import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppLayout from './components/AppLayout';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProfilePage from './pages/ProfilePage';
import Dashboard from './pages/Dashboard';
import ParcelSearch from './pages/ParcelSearch';
import IntegratedParcelPage from './pages/IntegratedParcelPage';
import GISMapPage from './pages/GISMapPage';
import AIAssistantPage from './pages/AIAssistantPage';
import ChangeMonitoringPage from './pages/ChangeMonitoringPage';
import ServiceRequestsPage from './pages/ServiceRequestsPage';
import ServiceRequestDetailPage from './pages/ServiceRequestDetailPage';
import DocumentVerificationPage from './pages/DocumentVerificationPage';
import DocumentVerificationDetailPage from './pages/DocumentVerificationDetailPage';
import LandTransferPage from './pages/LandTransferPage';
import LandTransferDetailPage from './pages/LandTransferDetailPage';
import ParcelSubdivisionPage from './pages/ParcelSubdivisionPage';
import ParcelSubdivisionDetailPage from './pages/ParcelSubdivisionDetailPage';
import BlockchainAuditPage from './pages/BlockchainAuditPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AccessDeniedPage from './pages/AccessDeniedPage';
import PlaceholderPage from './pages/PlaceholderPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Main Application Layout with Protected Routes */}
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Navigate to="/login" replace />} />
            <Route path="dashboard" element={<Dashboard />} />

            <Route path="profile" element={<ProfilePage />} />
            <Route path="access-denied" element={<AccessDeniedPage />} />
            
            {/* Parcel & Search Routes */}
            <Route path="search" element={<ParcelSearch />} />
            <Route path="parcel-search" element={<ParcelSearch />} />
            <Route path="parcel/:ulpin" element={<IntegratedParcelPage />} />
            <Route path="integrated-parcel/:ulpin" element={<IntegratedParcelPage />} />
            
            {/* GIS & Mapping */}
            <Route path="gis" element={<GISMapPage />} />
            <Route path="gis-map" element={<GISMapPage />} />
            
            {/* AI Assistant & Satellite Monitoring */}
            <Route path="ai-assistant" element={<AIAssistantPage />} />
            <Route path="change-monitoring" element={<ChangeMonitoringPage />} />
            
            {/* Service Requests Framework */}
            <Route path="service-requests" element={<ServiceRequestsPage />} />
            <Route path="service-requests/:requestId" element={<ServiceRequestDetailPage />} />
            <Route path="verification" element={<Navigate to="/service-requests?type=PARCEL_VERIFICATION" replace />} />
            
            {/* Administrative Management Routes */}
            <Route path="admin/users" element={<AdminUsersPage />} />
            <Route path="admin" element={<AdminUsersPage />} />
            
            {/* Document Verification Engine */}
            <Route path="document-verification" element={<DocumentVerificationPage />} />
            <Route path="document-verification/:verificationId" element={<DocumentVerificationDetailPage />} />
            
            {/* Land Ownership Transfer Workflow */}
            <Route path="land-transfer" element={<LandTransferPage />} />
            <Route path="land-transfer/:identifier" element={<LandTransferDetailPage />} />
            
            {/* Parcel Subdivision & Split Workflow */}
            <Route path="parcel-subdivision" element={<ParcelSubdivisionPage />} />
            <Route path="parcel-subdivision/:identifier" element={<ParcelSubdivisionDetailPage />} />
            
            {/* Permissioned Digital Ledger & Audit Engine */}
            <Route path="blockchain-audit" element={<BlockchainAuditPage />} />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

