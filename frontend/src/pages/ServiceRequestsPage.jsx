import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getServiceRequests, createServiceRequest, getParcels } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  FileCheck2,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Filter,
  Search,
  ArrowRight,
  Shield,
  Layers,
  FileText,
  Repeat,
  Scissors,
  X,
  AlertCircle
} from 'lucide-react';

const SERVICE_TYPES = [
  { id: 'PARCEL_VERIFICATION', label: 'Parcel Verification', icon: FileCheck2, desc: 'Verification of satellite-detected cadastral anomalies' },
  { id: 'DOCUMENT_VERIFICATION', label: 'Document Verification', icon: FileText, desc: 'Validation of Title Deed / Encumbrance Certificates' },
  { id: 'LAND_TRANSFER', label: 'Land Sale / Transfer', icon: Repeat, desc: 'Title mutation and conveyance registration' },
  { id: 'PARCEL_SUBDIVISION', label: 'Parcel Subdivision', icon: Scissors, desc: 'Cadastral land partition and boundary bifurcation' },
];

export default function ServiceRequestsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [summary, setSummary] = useState({});
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [parcels, setParcels] = useState([]);

  // Modal Form State
  const [formUlpin, setFormUlpin] = useState('KA0102030405');
  const [formServiceType, setFormServiceType] = useState('PARCEL_VERIFICATION');
  const [formDescription, setFormDescription] = useState('');
  const [formPriority, setFormPriority] = useState('Normal');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.service_type = typeFilter;
      const res = await getServiceRequests(params);
      setRequests(res.requests || []);
      setSummary(res.summary || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    const fetchAllParcels = async () => {
      try {
        const p = await getParcels();
        setParcels(p.parcels || []);
      } catch (e) {}
    };
    fetchAllParcels();
  }, []);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!formDescription.trim()) return;
    setFormLoading(true);
    setFormError(null);
    try {
      await createServiceRequest({
        ulpin: formUlpin,
        service_type: formServiceType,
        description: formDescription,
        priority: formPriority,
        metadata: {
          submitted_by_role: user?.role || 'Citizen',
          applicant_name: user?.name || user?.username,
        },
      });
      setIsModalOpen(false);
      setFormDescription('');
      fetchRequests();
    } catch (err) {
      setFormError(err.message || 'Failed to submit service request.');
    } finally {
      setFormLoading(false);
    }
  };

  const getServiceTypeIcon = (type) => {
    switch (type) {
      case 'PARCEL_VERIFICATION':
        return <FileCheck2 className="h-4 w-4 text-emerald-600" />;
      case 'DOCUMENT_VERIFICATION':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'LAND_TRANSFER':
        return <Repeat className="h-4 w-4 text-purple-600" />;
      case 'PARCEL_SUBDIVISION':
        return <Scissors className="h-4 w-4 text-amber-600" />;
      default:
        return <FileCheck2 className="h-4 w-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
            <FileCheck2 className="h-4 w-4" />
            <span>Service Request Framework</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 tracking-tight">
            Governance Workflows & Service Case Hub
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Centralized orchestration framework for parcel verifications, document validations, title transfers, and subdivisions.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center space-x-1.5 shrink-0"
        >
          <PlusCircle className="h-4 w-4" />
          <span>New Service Request</span>
        </button>
      </div>

      {/* Summary Status Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div
          onClick={() => setStatusFilter('')}
          className={`p-3.5 rounded-xl border text-xs cursor-pointer transition ${
            statusFilter === '' ? 'border-emerald-500 bg-emerald-50/70 shadow-xs' : 'border-slate-200 bg-white hover:bg-slate-50'
          }`}
        >
          <span className="text-[11px] text-slate-500 font-bold block uppercase">Total Requests</span>
          <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">
            {summary.total || 0}
          </span>
        </div>

        <div
          onClick={() => setStatusFilter('SUBMITTED')}
          className={`p-3.5 rounded-xl border text-xs cursor-pointer transition ${
            statusFilter === 'SUBMITTED' ? 'border-blue-500 bg-blue-50/70 shadow-xs' : 'border-slate-200 bg-white hover:bg-slate-50'
          }`}
        >
          <span className="text-[11px] text-blue-700 font-bold block uppercase">Submitted</span>
          <span className="text-xl font-bold font-mono text-blue-900 mt-1 block">
            {summary.submitted || 0}
          </span>
        </div>

        <div
          onClick={() => setStatusFilter('UNDER_REVIEW')}
          className={`p-3.5 rounded-xl border text-xs cursor-pointer transition ${
            statusFilter === 'UNDER_REVIEW' ? 'border-amber-500 bg-amber-50/70 shadow-xs' : 'border-slate-200 bg-white hover:bg-slate-50'
          }`}
        >
          <span className="text-[11px] text-amber-700 font-bold block uppercase">Under Review</span>
          <span className="text-xl font-bold font-mono text-amber-900 mt-1 block">
            {summary.under_review || 0}
          </span>
        </div>

        <div
          onClick={() => setStatusFilter('APPROVED')}
          className={`p-3.5 rounded-xl border text-xs cursor-pointer transition ${
            statusFilter === 'APPROVED' ? 'border-emerald-500 bg-emerald-50/70 shadow-xs' : 'border-slate-200 bg-white hover:bg-slate-50'
          }`}
        >
          <span className="text-[11px] text-emerald-700 font-bold block uppercase">Approved</span>
          <span className="text-xl font-bold font-mono text-emerald-900 mt-1 block">
            {summary.approved || 0}
          </span>
        </div>

        <div
          onClick={() => setStatusFilter('REJECTED')}
          className={`p-3.5 rounded-xl border text-xs cursor-pointer transition ${
            statusFilter === 'REJECTED' ? 'border-red-500 bg-red-50/70 shadow-xs' : 'border-slate-200 bg-white hover:bg-slate-50'
          }`}
        >
          <span className="text-[11px] text-red-700 font-bold block uppercase">Rejected</span>
          <span className="text-xl font-bold font-mono text-red-900 mt-1 block">
            {summary.rejected || 0}
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <span className="font-bold text-slate-700">Filter by Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
          >
            <option value="">All Service Types</option>
            {SERVICE_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="text-slate-400 text-[11px]">
          Showing <strong>{requests.length}</strong> service cases
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] text-slate-500 uppercase font-bold tracking-wider bg-slate-50">
                <th className="py-3 px-4">Request ID</th>
                <th className="py-3 px-4">Target ULPIN</th>
                <th className="py-3 px-4">Service Type</th>
                <th className="py-3 px-4">Applicant</th>
                <th className="py-3 px-4">Assigned Authority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400 text-xs">
                    No service requests found matching the selected filters.
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr
                    key={req.request_id}
                    onClick={() => navigate(`/service-requests/${req.request_id}`)}
                    className="hover:bg-slate-50/80 cursor-pointer transition"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {req.request_id}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-emerald-800">
                      {req.ulpin}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1.5">
                        {getServiceTypeIcon(req.service_type)}
                        <span className="font-semibold text-slate-800">
                          {req.service_type.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{req.applicant}</td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{req.assigned_role}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        req.status === 'APPROVED' || req.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : req.status === 'REJECTED'
                          ? 'bg-red-100 text-red-800'
                          : req.status === 'UNDER_REVIEW'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(req.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/service-requests/${req.request_id}`);
                        }}
                        className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Service Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <PlusCircle className="h-5 w-5 text-emerald-400" />
                <h3 className="font-bold text-sm">Submit New Land Governance Request</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* ULPIN Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Land Parcel ULPIN</label>
                <select
                  value={formUlpin}
                  onChange={(e) => setFormUlpin(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono outline-none"
                  required
                >
                  {parcels.map((p) => (
                    <option key={p.ulpin} value={p.ulpin}>
                      {p.ulpin} — {p.owner_name} ({p.village})
                    </option>
                  ))}
                </select>
              </div>

              {/* Service Type */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Service Type</label>
                <select
                  value={formServiceType}
                  onChange={(e) => setFormServiceType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                >
                  {SERVICE_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  {SERVICE_TYPES.find((t) => t.id === formServiceType)?.desc}
                </p>
              </div>

              {/* Future Workflow Honest Notice */}
              {formServiceType !== 'PARCEL_VERIFICATION' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-[11px]">
                  ℹ️ <strong>Service Notice:</strong> {SERVICE_TYPES.find((t) => t.id === formServiceType)?.label} will create a tracked service request. The interactive workflow for this service is currently being prepared for deployment.
                </div>
              )}

              {/* Priority */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Priority</label>
                <select
                  value={formPriority}
                  onChange={(e) => setFormPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Request Description & Remarks</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Provide context, references, or citizen request details..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading || !formDescription.trim()}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg shadow transition font-semibold disabled:opacity-50"
                >
                  {formLoading ? 'Submitting...' : 'Create Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
