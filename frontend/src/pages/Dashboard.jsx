import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardSummary, getServiceRequests } from '../services/api';
import {
  Layers,
  FileCheck2,
  Clock,
  Repeat,
  Satellite,
  ShieldCheck,
  Search,
  ArrowRight,
  Sparkles,
  MapPin,
  AlertTriangle,
  History,
  CheckCircle2,
  ExternalLink,
  PlusCircle,
  TrendingUp,
  UserCheck,
  Users,
  Building2,
  LandPlot,
  FileText,
  Eye,
  Activity,
  Server
} from 'lucide-react';
import LoadingState from '../components/LoadingState';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isCitizen, isOfficer, isAdmin, isRevenueOfficer, isRegistrationOfficer, isMunicipalOfficer } = useAuth();
  const [data, setData] = useState(null);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const [summaryRes, reqRes] = await Promise.all([
          getDashboardSummary(),
          getServiceRequests(),
        ]);
        setData(summaryRes);
        setMyRequests(reqRes?.requests || []);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [user]);

  if (loading) {
    return <LoadingState message="Loading governance dashboard..." />;
  }

  const metrics = data?.metrics || {
    total_parcels: 5,
    verification_requests: 1,
    pending_service_requests: 3,
    recent_transactions: 18,
    satellite_alerts: 1,
    audit_events_count: 6,
  };

  const activity = data?.recent_activity || [];

  if (isCitizen) {
    return <CitizenDashboard user={user} metrics={metrics} requests={myRequests} navigate={navigate} />;
  }

  if (isAdmin) {
    return <AdminDashboard user={user} metrics={metrics} activity={activity} requests={myRequests} navigate={navigate} />;
  }

  // Default: Officer Dashboard (Revenue, Registration, Municipal)
  return <OfficerDashboard user={user} metrics={metrics} activity={activity} requests={myRequests} navigate={navigate} />;
}


// ============================================================================
// 1. CITIZEN DASHBOARD EXPERIENCE
// ============================================================================
function CitizenDashboard({ user, metrics, requests, navigate }) {
  const citizenParcels = [
    {
      ulpin: 'KA0102030405',
      survey_number: '142/2A',
      village: 'Devanahalli',
      district: 'Bangalore Rural',
      area: '2.45 Hectares (6.05 Acres)',
      land_type: 'Dry Agricultural',
      status: 'Active / Clear Title',
      tax_status: 'Paid (Current)',
    },
    {
      ulpin: 'KA0203040506',
      survey_number: '88/1',
      village: 'Begur',
      district: 'Bangalore South',
      area: '0.85 Hectares (2.10 Acres)',
      land_type: 'Residential Converted',
      status: 'Active / Clear Title',
      tax_status: 'Paid (Current)',
    },
  ];

  const citizenRequests = requests.filter(
    (r) => r.applicant === user?.username || r.applicant === 'citizen'
  );

  return (
    <div className="space-y-6">
      {/* Citizen Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 border border-slate-700/80 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Citizen Land Records & Services Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome, {user?.name || 'Citizen'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            Access your registered land holdings, track service requests, verify titles, and submit departmental applications through LandSetu's single window.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-xs">
            <button
              onClick={() => navigate('/search')}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              <span>Search Any Parcel</span>
            </button>
            <button
              onClick={() => navigate('/service-requests')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold rounded-xl transition flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>Submit Service Request</span>
            </button>
          </div>
        </div>
      </div>

      {/* Citizen Quick Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider block">My Registered Parcels</span>
          <p className="text-2xl font-extrabold text-white mt-1">2</p>
          <span className="text-[11px] text-emerald-400 font-semibold mt-1 inline-block">Titles in Good Standing</span>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-bold text-blue-300 uppercase tracking-wider block">Active Requests</span>
          <p className="text-2xl font-extrabold text-white mt-1">{citizenRequests.length || 2}</p>
          <span className="text-[11px] text-blue-300 font-semibold mt-1 inline-block">Applications in Progress</span>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider block">Tax Assessment Status</span>
          <p className="text-2xl font-extrabold text-emerald-400 mt-1">Up to Date</p>
          <span className="text-[11px] text-slate-200 font-semibold mt-1 inline-block">0 Outstanding Dues</span>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">Recent Activity</span>
          <p className="text-2xl font-extrabold text-amber-300 mt-1">4</p>
          <span className="text-[11px] text-slate-200 font-semibold mt-1 inline-block">Verified Transactions</span>
        </div>
      </div>


      {/* My Land Holdings Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <LandPlot className="w-5 h-5 text-emerald-400" />
            My Land Holdings
          </h2>
          <span className="text-xs text-slate-400">2 registered properties</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {citizenParcels.map((p) => (
            <div
              key={p.ulpin}
              className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 hover:border-slate-600 transition shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-900 border border-slate-700 text-emerald-400">
                    ULPIN: {p.ulpin}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {p.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-700/50">
                    <span className="text-slate-400">Survey Number:</span>
                    <span className="font-semibold text-white">{p.survey_number}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-700/50">
                    <span className="text-slate-400">Location:</span>
                    <span className="font-medium text-slate-200">{p.village}, {p.district}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-700/50">
                    <span className="text-slate-400">Total Area:</span>
                    <span className="font-medium text-slate-200">{p.area}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Land Classification:</span>
                    <span className="font-medium text-slate-200">{p.land_type}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between">
                <span className="text-[11px] text-emerald-400 font-medium">✓ Property Tax Cleared</span>
                <button
                  onClick={() => navigate(`/parcel/${p.ulpin}`)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                >
                  <span>View Unified Record</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* My Service Requests Tracker */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-md">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-700/60">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">My Service Applications & Requests</h2>
          </div>
          <button
            onClick={() => navigate('/service-requests')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {citizenRequests.slice(0, 3).map((req) => (
            <div
              key={req.request_id}
              onClick={() => navigate(`/service-requests/${req.request_id}`)}
              className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-750/70 border border-slate-700/60 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold text-slate-300">{req.request_id}</span>
                  <span className="text-xs font-medium text-emerald-400 font-mono">ULPIN: {req.ulpin}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                    {req.service_type?.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 line-clamp-1">{req.description}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                    req.status === 'APPROVED'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : req.status === 'UNDER_REVIEW'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}
                >
                  {req.status?.replace('_', ' ')}
                </span>
                <ArrowRight className="w-4 h-4 text-slate-500" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


// ============================================================================
// 2. OFFICER DASHBOARD EXPERIENCE
// ============================================================================
function OfficerDashboard({ user, metrics, activity, requests, navigate }) {
  const pendingRequests = requests.filter((r) => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW');

  return (
    <div className="space-y-6">
      {/* Officer Operational Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 border border-slate-700/80 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold mb-3">
            <Building2 className="w-3.5 h-3.5" />
            <span>{user?.department || 'Department Operations Hub'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Officer Operations Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            Logged in as <strong>{user?.name}</strong> ({user?.role}). Manage departmental verification queues, inspect simulated satellite change alerts, and conduct administrative title reviews.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-xs">
            <button
              onClick={() => navigate('/service-requests')}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition flex items-center gap-2"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Review Work Queue ({pendingRequests.length})</span>
            </button>
            <button
              onClick={() => navigate('/change-monitoring')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold rounded-xl transition flex items-center gap-2"
            >
              <Satellite className="w-4 h-4 text-cyan-400" />
              <span>Satellite Change Alerts ({metrics.satellite_alerts})</span>
            </button>
            <button
              onClick={() => navigate('/gis-map')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold rounded-xl transition flex items-center gap-2"
            >
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Cadastral GIS Map</span>
            </button>
          </div>
        </div>
      </div>

      {/* Operational Key Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">Total Parcels</span>
          <p className="text-2xl font-extrabold text-white mt-1">{metrics.total_parcels}</p>
          <span className="text-[10px] text-emerald-300 font-semibold mt-1 block">In Cadastral Master</span>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">Pending Verifications</span>
          <p className="text-2xl font-extrabold text-amber-300 mt-1">{metrics.verification_requests}</p>
          <span className="text-[10px] text-amber-200 font-semibold mt-1 block">Requires Officer Action</span>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-bold text-blue-300 uppercase tracking-wider block">Service Queue</span>
          <p className="text-2xl font-extrabold text-blue-300 mt-1">{pendingRequests.length}</p>
          <span className="text-[10px] text-slate-200 font-semibold mt-1 block">Active Applications</span>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider block">Satellite Alerts</span>
          <p className="text-2xl font-extrabold text-cyan-300 mt-1">{metrics.satellite_alerts}</p>
          <span className="text-[10px] text-cyan-200 font-semibold mt-1 block">Physical Verification</span>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider block">Transactions</span>
          <p className="text-2xl font-extrabold text-emerald-300 mt-1">{metrics.recent_transactions}</p>
          <span className="text-[10px] text-slate-200 font-semibold mt-1 block">Verified Deeds</span>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-bold text-purple-300 uppercase tracking-wider block">Audit Events</span>
          <p className="text-2xl font-extrabold text-purple-300 mt-1">{metrics.audit_events_count}</p>
          <span className="text-[10px] text-slate-200 font-semibold mt-1 block">Immutable Log</span>
        </div>
      </div>


      {/* Actionable Work Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Verification Review Queue */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-md">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-700/60">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Pending Verification Cases
            </h2>
            <button
              onClick={() => navigate('/parcel/KA0102030405')}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
            >
              Open Active Case →
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-emerald-400">ULPIN: KA0102030405</span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                PENDING REVIEW
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Potential construction change identified (+185.4 sqm). Requires officer physical demarcation and approval.
            </p>
            <div className="pt-2 flex items-center justify-between text-xs">
              <span className="text-slate-400">Assigned: Revenue Officer</span>
              <button
                onClick={() => navigate('/parcel/KA0102030405')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition"
              >
                Inspect & Verify
              </button>
            </div>
          </div>
        </div>

        {/* Departmental Service Requests */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-md">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-700/60">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-blue-400" />
              Departmental Service Requests
            </h2>
            <button
              onClick={() => navigate('/service-requests')}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
            >
              View All ({requests.length}) →
            </button>
          </div>

          <div className="space-y-2.5">
            {requests.slice(0, 3).map((req) => (
              <div
                key={req.request_id}
                onClick={() => navigate(`/service-requests/${req.request_id}`)}
                className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-750/70 border border-slate-700/60 transition cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-200">{req.request_id}</span>
                    <span className="text-[11px] text-slate-400">ULPIN: {req.ulpin}</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">{req.description}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 shrink-0 ml-2">
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


// ============================================================================
// 3. ADMIN DASHBOARD EXPERIENCE
// ============================================================================
function AdminDashboard({ user, metrics, activity, requests, navigate }) {
  return (
    <div className="space-y-6">
      {/* Admin Governance Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 border border-slate-700/80 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Platform Administrative Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            System Administration & Oversight
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            Centralized platform control panel. Monitor user accounts, departmental access, cadastral parcel ledgers, system audit logs, and cross-department service requests.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-xs">
            <button
              onClick={() => navigate('/admin/users')}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl shadow-lg shadow-amber-600/20 transition flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              <span>User & Role Directory</span>
            </button>
            <button
              onClick={() => navigate('/service-requests')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold rounded-xl transition flex items-center gap-2"
            >
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
              <span>Global Service Requests ({requests.length})</span>
            </button>
            <button
              onClick={() => navigate('/search')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold rounded-xl transition flex items-center gap-2"
            >
              <LandPlot className="w-4 h-4 text-blue-400" />
              <span>Cadastral Master Registry</span>
            </button>
          </div>
        </div>
      </div>

      {/* Admin System Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Parcels</span>
          <p className="text-2xl font-bold text-white mt-1">{metrics.total_parcels}</p>
          <span className="text-[10px] text-emerald-400 mt-1 block">Active Cadastral Base</span>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Platform Requests</span>
          <p className="text-2xl font-bold text-blue-400 mt-1">{requests.length}</p>
          <span className="text-[10px] text-slate-400 mt-1 block">Cross-Departmental</span>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Active Verifications</span>
          <p className="text-2xl font-bold text-amber-400 mt-1">{metrics.verification_requests}</p>
          <span className="text-[10px] text-amber-400/80 mt-1 block">Pending Action</span>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Satellite Anomalies</span>
          <p className="text-2xl font-bold text-cyan-400 mt-1">{metrics.satellite_alerts}</p>
          <span className="text-[10px] text-cyan-400/80 mt-1 block">Integrated Imagery</span>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Transactions</span>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{metrics.recent_transactions}</p>
          <span className="text-[10px] text-slate-400 mt-1 block">Deed & Tax Records</span>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Audit Events Log</span>
          <p className="text-2xl font-bold text-purple-400 mt-1">{metrics.audit_events_count}</p>
          <span className="text-[10px] text-slate-400 mt-1 block">System State Log</span>
        </div>
      </div>

      {/* System Activity Stream */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-md">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-700/60">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">System Activity & Audit Log Stream</h2>
          </div>
          <span className="text-xs text-slate-400">Live platform events</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="px-4 py-2.5">Time</th>
                <th className="px-4 py-2.5">Actor / Role</th>
                <th className="px-4 py-2.5">Action</th>
                <th className="px-4 py-2.5">Target ULPIN</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {activity.map((item) => (
                <tr key={item.id} className="hover:bg-slate-750/50">
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3 font-semibold text-white whitespace-nowrap">
                    {item.user} ({item.role})
                  </td>
                  <td className="px-4 py-3 font-mono text-emerald-400">{item.action}</td>
                  <td className="px-4 py-3 font-mono text-slate-300">{item.ulpin || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300 max-w-xs truncate">{item.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
