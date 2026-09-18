import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { approveVerification, rejectVerification } from '../services/api';
import { 
  FileCheck2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  UserCheck, 
  Shield, 
  Send,
  Calendar
} from 'lucide-react';

export default function OfficerReviewPanel({ ulpin, verification, onStatusChange }) {
  const { user, hasVerificationAuthority } = useAuth();
  const [remarks, setRemarks] = useState('Reviewed simulated satellite evidence against cadastral land records.');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!verification) return null;

  const { status, verification_id, requested_by, reviewed_by, change_type, created_at, reviewed_at, remarks: currentRemarks } = verification;
  const isPending = status === 'PENDING';
  const isApproved = status === 'APPROVED';
  const isRejected = status === 'REJECTED';

  const handleApprove = async () => {
    if (!hasVerificationAuthority) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await approveVerification(ulpin, remarks);
      if (onStatusChange) onStatusChange(updated);
    } catch (err) {
      setError(err.message || 'Failed to approve verification.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!hasVerificationAuthority) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await rejectVerification(ulpin, remarks);
      if (onStatusChange) onStatusChange(updated);
    } catch (err) {
      setError(err.message || 'Failed to reject verification.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-emerald-600/30 text-emerald-400 border border-emerald-500/30">
            <FileCheck2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold tracking-tight">Parcel Verification Officer Panel</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {verification_id}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Role-Based Access Control: Verification authority assigned to Revenue Officer.
            </p>
          </div>
        </div>

        {/* State Badge */}
        <div>
          {isPending && (
            <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-xs font-semibold flex items-center space-x-1.5">
              <Clock className="h-3.5 w-3.5 animate-pulse" />
              <span>PENDING REVIEW</span>
            </span>
          )}
          {isApproved && (
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-semibold flex items-center space-x-1.5">
              <CheckCircle className="h-3.5 w-3.5" />
              <span>APPROVED</span>
            </span>
          )}
          {isRejected && (
            <span className="px-3 py-1 bg-red-500/20 text-red-300 border border-red-500/40 rounded-full text-xs font-semibold flex items-center space-x-1.5">
              <XCircle className="h-3.5 w-3.5" />
              <span>REJECTED</span>
            </span>
          )}
        </div>
      </div>

      {/* Case Details */}
      <div className="p-5 space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Target ULPIN</span>
            <span className="font-mono font-bold text-slate-900">{ulpin}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Satellite Finding</span>
            <span className="font-semibold text-slate-800">{change_type}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Initiated By</span>
            <span className="font-medium text-slate-800">{requested_by}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Initiated Date</span>
            <span className="font-mono text-slate-700">{created_at ? new Date(created_at).toLocaleString() : 'N/A'}</span>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Panel for PENDING cases */}
        {isPending ? (
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 flex items-center gap-1.5">
                <UserCheck className="h-4 w-4 text-emerald-600" />
                <span>Official Review Remarks</span>
              </label>
              <span className="text-[10px] text-slate-500">
                Logged in as: <strong className="text-slate-800">{user?.role || 'Guest'}</strong>
              </span>
            </div>

            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter official assessment, survey reference, or rationale..."
              disabled={!hasVerificationAuthority || loading}
              className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
            />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
              <div className="text-[11px] text-slate-500 italic">
                {hasVerificationAuthority
                  ? '⚠️ State transition is irreversible once finalized and logged in audit trail.'
                  : '🔒 Only Revenue Officers and Administrators possess verification authority.'}
              </div>

              {hasVerificationAuthority ? (
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <button
                    onClick={handleReject}
                    disabled={loading || !remarks.trim()}
                    className="flex-1 sm:flex-none px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition shadow-sm flex items-center justify-center space-x-1.5 disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Reject Verification</span>
                  </button>

                  <button
                    onClick={handleApprove}
                    disabled={loading || !remarks.trim()}
                    className="flex-1 sm:flex-none px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg transition shadow-sm flex items-center justify-center space-x-1.5 disabled:opacity-50"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Approve Verification</span>
                  </button>
                </div>
              ) : (
                <div className="bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium">
                  Approval controls disabled for {user?.role || 'Citizen'}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Final Decision Record Display */
          <div className={`p-4 rounded-xl border ${
            isApproved ? 'bg-emerald-50/70 border-emerald-200' : 'bg-red-50/70 border-red-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                {isApproved ? <CheckCircle className="h-4 w-4 text-emerald-700" /> : <XCircle className="h-4 w-4 text-red-700" />}
                <span>Verification Decision: {status}</span>
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                Decided on {reviewed_at ? new Date(reviewed_at).toLocaleString() : 'N/A'}
              </span>
            </div>

            <p className="text-slate-800 font-medium text-xs bg-white/80 p-2.5 rounded-lg border border-slate-200/80 mb-2">
              "{currentRemarks || 'No remarks provided.'}"
            </p>

            <div className="flex items-center justify-between text-[11px] text-slate-600">
              <span>Reviewed By: <strong className="text-slate-900">{reviewed_by || 'Revenue Officer'}</strong></span>
              <span className="text-slate-400">Official administrative verification record.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
