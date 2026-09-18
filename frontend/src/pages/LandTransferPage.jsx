import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeftRight,
  PlusCircle,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
  FileCheck,
  Building,
  User,
  ChevronRight,
  AlertCircle,
  X
} from 'lucide-react';
import { getLandTransfers, createLandTransfer, getParcels } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingState from '../components/LoadingState';
import ErrorMessage from '../components/ErrorMessage';

export default function LandTransferPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [transfers, setTransfers] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    ulpin: 'KA0102030405',
    buyer_name: 'Vikramaditya Rao',
    buyer_contact: '+91 98765 43210',
    transfer_type: 'SALE',
    area_transferred: '2.5',
    consideration_amount: '4500000',
    doc_verification_id: 'DVR-KA0102030405-01',
    remarks: 'Application for official land ownership mutation following registered sale deed.',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getLandTransfers({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });
      setTransfers(res?.transfers || []);
      setSummary(res?.summary || {});
    } catch (err) {
      setError(err.message || 'Failed to load land transfer applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const payload = {
        ulpin: formData.ulpin,
        buyer_name: formData.buyer_name,
        buyer_contact: formData.buyer_contact,
        transfer_type: formData.transfer_type,
        area_transferred: parseFloat(formData.area_transferred) || 1.0,
        consideration_amount: parseFloat(formData.consideration_amount) || 0.0,
        doc_verification_id: formData.doc_verification_id || null,
        remarks: formData.remarks,
      };

      const newRecord = await createLandTransfer(payload);
      setShowCreateModal(false);
      navigate(`/land-transfer/${newRecord.transfer_id}`);
    } catch (err) {
      setFormError(err.message || 'Failed to submit land transfer application.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTransfers = transfers.filter(t =>
    t.transfer_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.ulpin.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.seller_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.buyer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && transfers.length === 0) {
    return <LoadingState message="Loading land ownership transfer applications..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
            <ArrowLeftRight className="w-3.5 h-3.5" />
            Land Sale & Ownership Mutation Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Land Ownership Transfers
          </h1>
          <p className="text-slate-400 text-sm max-w-2xl">
            Formal registry application workflow for deed execution, 4-point eligibility cross-verification, and master title mutation.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-900/30"
        >
          <PlusCircle className="w-4 h-4" />
          New Transfer Application
        </button>
      </div>

      {error && <ErrorMessage message={error} onRetry={loadData} />}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Total Applications</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{summary.total || transfers.length}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-amber-600 font-medium">Submitted / Under Review</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {(summary.submitted || 0) + (summary.under_review || 0)}
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-emerald-600 font-medium">Approved & Mutated</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{summary.approved || 0}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-rose-600 font-medium">Rejected</div>
          <div className="text-2xl font-bold text-rose-600 mt-1">{summary.rejected || 0}</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {['ALL', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Transfer ID, ULPIN, Buyer, Seller..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Applications List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredTransfers.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500 space-y-3">
            <ArrowLeftRight className="w-10 h-10 mx-auto text-slate-300" />
            <div className="font-semibold text-base">No land transfer applications found</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              There are no transfer records matching your current filter. You can initiate a new transfer application using the button above.
            </p>
          </div>
        ) : (
          filteredTransfers.map((item) => (
            <div
              key={item.transfer_id}
              onClick={() => navigate(`/land-transfer/${item.transfer_id}`)}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-4 hover:border-emerald-300 group"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-slate-900 group-hover:text-emerald-600 transition-colors">
                    {item.transfer_id}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    ULPIN: {item.ulpin}
                  </span>
                </div>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    item.status === 'APPROVED' || item.status === 'COMPLETED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : item.status === 'REJECTED'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {item.status}
                </span>
              </div>

              {/* Seller & Buyer Flow */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Seller (Current Owner)</span>
                  <span className="font-bold text-slate-800 text-sm block mt-0.5">{item.seller_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Buyer (Proposed Owner)</span>
                  <span className="font-bold text-emerald-700 text-sm block mt-0.5">{item.buyer_name}</span>
                </div>
              </div>

              {/* Transaction details */}
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                <div>
                  <span className="text-slate-400">Transfer Type:</span>{' '}
                  <span className="font-semibold text-slate-800">{item.transfer_type}</span>
                </div>
                <div>
                  <span className="text-slate-400">Consideration:</span>{' '}
                  <span className="font-semibold text-slate-900">
                    ₹{Number(item.consideration_amount || 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Area:</span>{' '}
                  <span className="font-semibold text-slate-800">{item.area_transferred} Acres</span>
                </div>
                <div>
                  <span className="text-slate-400">Doc Verification:</span>{' '}
                  <span className="font-semibold text-emerald-600">{item.doc_verification_id || 'Attached'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 text-xs border-t border-slate-100">
                <span className="text-slate-400">
                  Submitted: {new Date(item.submission_date || item.created_at).toLocaleDateString()}
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 group-hover:translate-x-1 transition-transform">
                  View Application <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Application Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
                  <ArrowLeftRight className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Initiate Land Ownership Transfer</h3>
                  <p className="text-xs text-slate-500">Submit sale deed & buyer details for eligibility cross-verification</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Parcel ULPIN</label>
                <input
                  type="text"
                  required
                  value={formData.ulpin}
                  onChange={(e) => setFormData({ ...formData, ulpin: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="e.g. KA0102030405"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Proposed Buyer Name</label>
                  <input
                    type="text"
                    required
                    value={formData.buyer_name}
                    onChange={(e) => setFormData({ ...formData, buyer_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="Full legal name"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Buyer Contact Number</label>
                  <input
                    type="text"
                    value={formData.buyer_contact}
                    onChange={(e) => setFormData({ ...formData, buyer_contact: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="+91..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Transfer Consideration (₹)</label>
                  <input
                    type="number"
                    value={formData.consideration_amount}
                    onChange={(e) => setFormData({ ...formData, consideration_amount: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="Total sale value"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Area Transferred (Acres)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.area_transferred}
                    onChange={(e) => setFormData({ ...formData, area_transferred: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Linked Document Verification ID</label>
                <input
                  type="text"
                  value={formData.doc_verification_id}
                  onChange={(e) => setFormData({ ...formData, doc_verification_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="e.g. DVR-KA0102030405-01"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Application Remarks / Deed Reference</label>
                <textarea
                  rows="2"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Submitting Application...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
