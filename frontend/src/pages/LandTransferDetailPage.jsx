import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowLeftRight,
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Building,
  FileCheck,
  Lock,
  MessageSquare
} from 'lucide-react';
import { getLandTransferById, approveLandTransfer, rejectLandTransfer } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingState from '../components/LoadingState';
import ErrorMessage from '../components/ErrorMessage';

export default function LandTransferDetailPage() {
  const { identifier } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [transfer, setTransfer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [processing, setProcessing] = useState(false);
  const [actionError, setActionError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getLandTransferById(identifier);
      setTransfer(data);
    } catch (err) {
      setError(err.message || 'Failed to load land transfer record.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [identifier]);

  const handleApprove = async () => {
    setProcessing(true);
    setActionError(null);
    try {
      const updated = await approveLandTransfer(identifier, remarks || 'Transfer approved and master title updated.');
      setTransfer(updated);
    } catch (err) {
      setActionError(err.message || 'Failed to approve land transfer.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!remarks || remarks.trim().length < 2) {
      setActionError('Remarks are mandatory when rejecting a transfer application.');
      return;
    }
    setProcessing(true);
    setActionError(null);
    try {
      const updated = await rejectLandTransfer(identifier, remarks);
      setTransfer(updated);
    } catch (err) {
      setActionError(err.message || 'Failed to reject land transfer.');
    } finally {
      setProcessing(false);
    }
  };

  const isOfficer = ['Registration Officer', 'Revenue Officer', 'Administrator', 'Admin'].includes(user?.role);

  if (loading) {
    return <LoadingState message="Loading land transfer details & eligibility checks..." />;
  }

  if (error || !transfer) {
    return <ErrorMessage message={error || 'Transfer record not found.'} onRetry={loadData} />;
  }

  const eligibility = transfer.eligibility_checklist || [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back Button & Navigation */}
      <button
        onClick={() => navigate('/land-transfer')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Land Transfers
      </button>

      {/* Detail Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xl font-bold text-slate-900">{transfer.transfer_id}</span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 font-mono text-xs font-semibold text-slate-700">
                ULPIN: {transfer.ulpin}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Submitted by <span className="font-semibold text-slate-700">{transfer.submitted_by}</span> on{' '}
              {new Date(transfer.submission_date || transfer.created_at).toLocaleString()}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide ${
                transfer.status === 'APPROVED' || transfer.status === 'COMPLETED'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : transfer.status === 'REJECTED'
                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}
            >
              STATUS: {transfer.status}
            </span>
          </div>
        </div>

        {/* Transfer Party Flow */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
          <div className="space-y-2">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Seller / Current Owner</span>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-slate-200 text-slate-700 rounded-xl">
                <User className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-slate-900 text-base">{transfer.seller_name}</div>
                <div className="text-xs text-slate-500 font-mono">ID: {transfer.seller_id || 'OWN-CADASTRAL'}</div>
              </div>
            </div>
          </div>

          <div className="space-y-2 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6">
            <span className="text-xs text-emerald-600 font-semibold uppercase tracking-wider block">Buyer / Proposed Owner</span>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
                <User className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-emerald-800 text-base">{transfer.buyer_name}</div>
                <div className="text-xs text-slate-500">{transfer.buyer_contact || 'Contact details attached'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 block font-medium">Consideration Amount</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block">
              ₹{Number(transfer.consideration_amount || 0).toLocaleString()}
            </span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 block font-medium">Area Transferred</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block">
              {transfer.area_transferred} Acres
            </span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 block font-medium">Deed Verification ID</span>
            <span className="font-bold text-emerald-600 font-mono mt-0.5 block truncate">
              {transfer.doc_verification_id || 'Attached'}
            </span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 block font-medium">Registration Ref</span>
            <span className="font-bold text-slate-700 font-mono mt-0.5 block truncate">
              {transfer.registration_reference || 'IGR-KAR-2026'}
            </span>
          </div>
        </div>
      </div>

      {/* 4-Point Eligibility Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          Automated 4-Point Ownership Transfer Eligibility Matrix
        </h3>
        <p className="text-xs text-slate-500">
          Evaluated automatically against Cadastral ownership, Revenue tax records, encumbrances, and document verification engine.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          {eligibility.map((check, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border flex items-start gap-3.5 ${
                check.passed
                  ? 'bg-emerald-50/50 border-emerald-200'
                  : 'bg-rose-50/50 border-rose-200'
              }`}
            >
              <div className="mt-0.5">
                {check.passed ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-600" />
                )}
              </div>
              <div className="space-y-1">
                <div className="font-bold text-xs text-slate-900">{check.check}</div>
                <div className="text-xs text-slate-600">{check.details}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Officer Decision Panel */}
      {isOfficer && (transfer.status === 'SUBMITTED' || transfer.status === 'UNDER_REVIEW') && (
        <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-800 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Officer Action & Ledger Title Mutation Panel</h3>
              <p className="text-xs text-slate-400">
                Approving this transfer mutates master parcel title to {transfer.buyer_name} and emits SHA-256 digital ledger blocks.
              </p>
            </div>
          </div>

          {actionError && (
            <div className="p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs">
              {actionError}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              Official Review Remarks & Justification Note
            </label>
            <textarea
              rows="3"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Provide official review comments, verification reference, or rejection reason..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
            <button
              onClick={handleReject}
              disabled={processing}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-all shadow-md disabled:opacity-50"
            >
              Reject Application
            </button>
            <button
              onClick={handleApprove}
              disabled={processing}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-900/40 disabled:opacity-50"
            >
              Approve & Mutate Title
            </button>
          </div>
        </div>
      )}

      {/* Approved Confirmation Card */}
      {(transfer.status === 'APPROVED' || transfer.status === 'COMPLETED') && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-emerald-900 space-y-3">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-600" />
            <h3 className="text-base font-bold">Transfer Approved & Title Mutated</h3>
          </div>
          <p className="text-xs text-emerald-800 leading-relaxed">
            Master cadastral parcel title for <span className="font-bold">{transfer.ulpin}</span> has been mutated to{' '}
            <span className="font-bold">{transfer.buyer_name}</span>. An immutable SHA-256 block has been appended to the Permissioned Digital Ledger.
          </p>
          {transfer.remarks && (
            <div className="text-xs font-mono bg-white/70 p-3 rounded-xl text-emerald-900 border border-emerald-200/50">
              Officer Remarks: {transfer.remarks}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
