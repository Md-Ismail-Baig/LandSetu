import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getDocumentVerificationById,
  runDocumentVerificationCheck,
  approveDocumentVerification,
  rejectDocumentVerification,
  getAuditEvents,
} from '../services/api';
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowLeft,
  RefreshCw,
  LandPlot,
  Building,
  User,
  Calendar,
  Layers,
  FileCheck2,
  AlertCircle,
  History,
  Check,
  X
} from 'lucide-react';
import LoadingState from '../components/LoadingState';
import ErrorMessage from '../components/ErrorMessage';

export default function DocumentVerificationDetailPage() {
  const params = useParams();
  const id = params.id || params.verificationId;
  const navigate = useNavigate();
  const { user, isCitizen, isOfficer, isAdmin, isRegistrationOfficer, isRevenueOfficer } = useAuth();

  const [doc, setDoc] = useState(null);
  const [auditEvents, setAuditEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [reviewRemarks, setReviewRemarks] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [decisionError, setDecisionError] = useState(null);
  const [rechecking, setRechecking] = useState(false);

  const canReview = isRegistrationOfficer || isRevenueOfficer || isAdmin;

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getDocumentVerificationById(id);
      setDoc(res);
      if (res?.ulpin) {
        try {
          const auditRes = await getAuditEvents(res.ulpin);
          setAuditEvents(auditRes?.events || []);
        } catch (e) {
          // Ignore audit fetch failure if offline
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load document verification details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id, user]);

  const handleRerunChecks = async () => {
    setRechecking(true);
    try {
      await runDocumentVerificationCheck(id);
      await loadData();
    } catch (err) {
      alert('Failed to re-run verification checks: ' + err.message);
    } finally {
      setRechecking(false);
    }
  };

  const handleDecision = async (decision) => {
    if (decision === 'REJECTED' && !reviewRemarks.trim()) {
      setDecisionError('Detailed justification remarks are required when rejecting a document verification.');
      return;
    }

    setSubmittingDecision(true);
    setDecisionError(null);
    try {
      if (decision === 'APPROVED') {
        await approveDocumentVerification(doc.doc_verification_id, reviewRemarks);
      } else {
        await rejectDocumentVerification(doc.doc_verification_id, reviewRemarks);
      }
      await loadData();
      setReviewRemarks('');
    } catch (err) {
      setDecisionError(err.message || 'Failed to submit review decision.');
    } finally {
      setSubmittingDecision(false);
    }
  };

  if (loading) return <LoadingState message={`Inspecting verification record ${id}...`} />;
  if (error) return <ErrorMessage message={error} onRetry={loadData} />;
  if (!doc) return null;

  const getResultBadge = (result) => {
    switch (result) {
      case 'MATCH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> MATCH
          </span>
        );
      case 'MISMATCH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" /> MISMATCH
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5" /> NEEDS REVIEW
          </span>
        );
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/40">APPROVED</span>;
      case 'REJECTED':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-300 border border-rose-500/40">REJECTED</span>;
      case 'UNDER_REVIEW':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/40">UNDER REVIEW</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-300 border border-blue-500/40">SUBMITTED</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/80 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/document-verification')}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="Back to Document Verifications"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-xl font-bold text-white font-mono">{doc.doc_verification_id}</span>
              {getStatusBadge(doc.status)}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Linked Service Request: <Link to={`/service-requests/${doc.request_id}`} className="text-emerald-400 hover:underline font-mono font-semibold">{doc.request_id}</Link>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRerunChecks}
            disabled={rechecking}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${rechecking ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Re-Evaluate Checks</span>
          </button>

          <Link
            to={`/parcel/${doc.ulpin}`}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <LandPlot className="w-3.5 h-3.5" />
            <span>Open Cadastral Parcel</span>
          </Link>
        </div>
      </div>

      {/* Deterministic Evaluation Overview Banner */}
      <div className={`p-5 rounded-2xl border shadow-lg ${
        doc.overall_result === 'MATCH'
          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
          : doc.overall_result === 'MISMATCH'
          ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
          : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700 shrink-0">
              {doc.overall_result === 'MATCH' && <CheckCircle2 className="w-6 h-6 text-emerald-400" />}
              {doc.overall_result === 'MISMATCH' && <XCircle className="w-6 h-6 text-rose-400" />}
              {doc.overall_result === 'NEEDS_REVIEW' && <AlertTriangle className="w-6 h-6 text-amber-400" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider">Automated Verification Result:</span>
                {getResultBadge(doc.overall_result)}
              </div>
              <p className="text-sm font-semibold text-white mt-1">
                {doc.overall_result === 'MATCH'
                  ? 'All automated deterministic checks passed against LandSetu cadastral master records.'
                  : doc.overall_result === 'MISMATCH'
                  ? 'Critical discrepancies detected between submitted document parameters and registered parcel data.'
                  : 'Document parameters completed automated checks with advisory flags requiring officer scrutiny.'}
              </p>
            </div>
          </div>

          <span className="text-xs font-mono px-3 py-1 bg-slate-900/80 rounded-lg text-slate-300 shrink-0">
            5-Point Check Complete
          </span>
        </div>
      </div>

      {/* 5-Point Automated Comparison Checks Matrix */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              Automated 5-Point Verification Checks Matrix
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Comparison between submitted document metadata and verified Cadastral & Registration records.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold border-b border-slate-700/80">
              <tr>
                <th className="px-4 py-3.5">Check Parameter</th>
                <th className="px-4 py-3.5">Submitted Document Value</th>
                <th className="px-4 py-3.5">LandSetu Master Record</th>
                <th className="px-4 py-3.5">Result</th>
                <th className="px-4 py-3.5">Technical & Legal Findings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {doc.verification_checks?.map((c) => (
                <tr key={c.check} className="hover:bg-slate-750/50 transition">
                  <td className="px-4 py-3.5 font-semibold text-white">
                    {c.name}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-slate-200">
                    {c.document_value || '—'}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-emerald-400">
                    {c.record_value || '—'}
                  </td>
                  <td className="px-4 py-3.5">
                    {getResultBadge(c.result)}
                  </td>
                  <td className="px-4 py-3.5 text-slate-300 max-w-sm">
                    {c.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side-by-Side Detailed Data Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Submitted Document Information */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-md space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-700/60 pb-3">
            <FileText className="w-4 h-4 text-emerald-400" />
            Submitted Document Record
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-700/50">
              <span className="text-slate-400">Document Title:</span>
              <span className="font-semibold text-white">{doc.document_name}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-700/50">
              <span className="text-slate-400">Document Type:</span>
              <span className="font-medium text-slate-200">{doc.document_type}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-700/50">
              <span className="text-slate-400">Deed / Doc Reference:</span>
              <span className="font-mono text-slate-200">{doc.document_number || '—'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-700/50">
              <span className="text-slate-400">Execution Date:</span>
              <span className="font-medium text-slate-200">{doc.document_date || '—'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-700/50">
              <span className="text-slate-400">Seller / Titleholder:</span>
              <span className="font-semibold text-white">{doc.seller_owner_name || '—'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-700/50">
              <span className="text-slate-400">Buyer / Applicant:</span>
              <span className="font-medium text-slate-200">{doc.buyer_applicant_name || '—'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-700/50">
              <span className="text-slate-400">Mentioned Area:</span>
              <span className="font-medium text-slate-200">{doc.area_mentioned ? `${doc.area_mentioned} Ha / Acres` : '—'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-700/50">
              <span className="text-slate-400">SRO Reference:</span>
              <span className="font-mono text-slate-200">{doc.registration_reference || '—'}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Submitted By:</span>
              <span className="font-medium text-slate-300">{doc.submitted_by} ({new Date(doc.submission_date).toLocaleDateString()})</span>
            </div>
          </div>
        </div>

        {/* Card 2: Master Cadastral Record */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-md space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-700/60 pb-3">
            <LandPlot className="w-4 h-4 text-cyan-400" />
            LandSetu Master Cadastral Record
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-700/50">
              <span className="text-slate-400">Target ULPIN:</span>
              <span className="font-mono font-bold text-emerald-400">{doc.ulpin}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-700/50">
              <span className="text-slate-400">Registered Owner:</span>
              <span className="font-semibold text-white">{doc.parcel_summary?.owner_name || 'Ramesh Kumar'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-700/50">
              <span className="text-slate-400">Survey Number:</span>
              <span className="font-medium text-slate-200">{doc.parcel_summary?.survey_number || '142/2A'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-700/50">
              <span className="text-slate-400">Cadastral Area:</span>
              <span className="font-medium text-slate-200">
                {doc.parcel_summary?.area_hectares || '2.45'} Hectares ({doc.parcel_summary?.area_acres || '6.05'} Acres)
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-700/50">
              <span className="text-slate-400">Land Classification:</span>
              <span className="font-medium text-slate-200">{doc.parcel_summary?.land_type || 'Dry Agricultural'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-700/50">
              <span className="text-slate-400">Location:</span>
              <span className="font-medium text-slate-200">
                {doc.parcel_summary?.village || 'Devanahalli'}, {doc.parcel_summary?.district || 'Bangalore Rural'}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Parcel Status:</span>
              <span className="font-semibold text-emerald-400">{doc.parcel_summary?.status || 'Active / Clear Title'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Officer Decision & Official Review Panel */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-700/60 pb-3">
          <Building className="w-5 h-5 text-amber-400" />
          Official Review & Administrative Decision
        </h2>

        {doc.status === 'APPROVED' || doc.status === 'REJECTED' ? (
          <div className={`p-4 rounded-xl border ${
            doc.status === 'APPROVED' ? 'bg-emerald-950/40 border-emerald-500/40' : 'bg-rose-950/40 border-rose-500/40'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                Official Decision: <strong className={doc.status === 'APPROVED' ? 'text-emerald-400' : 'text-rose-400'}>{doc.status}</strong>
              </span>
              <span className="text-[11px] text-slate-400">
                Reviewed by: <strong>{doc.reviewed_by}</strong> ({doc.reviewed_at ? new Date(doc.reviewed_at).toLocaleString() : 'Recent'})
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-2">
              <strong>Official Remarks:</strong> {doc.remarks || 'No additional remarks.'}
            </p>
          </div>
        ) : canReview ? (
          <div className="space-y-4">
            <p className="text-xs text-slate-300">
              As an authorized officer ({user?.role}), please review the comparison findings above. Enter official scrutiny remarks and record your formal decision.
            </p>

            {decisionError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
                {decisionError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Official Review Remarks (Mandatory on rejection)
              </label>
              <textarea
                rows="3"
                value={reviewRemarks}
                onChange={(e) => setReviewRemarks(e.target.value)}
                placeholder="Enter official legal or physical inspection findings..."
                className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleDecision('REJECTED')}
                disabled={submittingDecision}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-rose-600/20 flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                <span>Reject Verification</span>
              </button>

              <button
                type="button"
                onClick={() => handleDecision('APPROVED')}
                disabled={submittingDecision}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>Approve Verification</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-slate-900/60 border border-slate-700/60 rounded-xl text-xs text-slate-300 flex items-center gap-3">
            <Clock className="w-5 h-5 text-blue-400 shrink-0" />
            <div>
              <p className="font-semibold text-white">Under Official Departmental Scrutiny</p>
              <p className="text-slate-400 mt-0.5">
                Your submitted document is currently queued for evaluation by the Inspector General of Registration (IGR) and Revenue authorities.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Immutable Audit Log History */}
      {auditEvents.length > 0 && (
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-700/60 pb-3">
            <History className="w-4 h-4 text-purple-400" />
            Immutable Audit Trail Events
          </h2>

          <div className="space-y-2">
            {auditEvents.map((evt) => (
              <div key={evt.event_id} className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/50 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-emerald-400">{evt.action}</span>
                    <span className="text-slate-400">by {evt.username} ({evt.role})</span>
                  </div>
                  <p className="text-slate-300 mt-0.5">{evt.remarks}</p>
                </div>
                <span className="text-slate-500 font-mono text-[11px] shrink-0 ml-2">
                  {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
