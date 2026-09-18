import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  createDocumentVerification,
  getDocumentVerifications,
} from '../services/api';
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Upload,
  LandPlot,
  Building2,
  Search,
  FileCheck2,
  Layers,
  AlertCircle
} from 'lucide-react';
import LoadingState from '../components/LoadingState';
import ErrorMessage from '../components/ErrorMessage';

export default function DocumentVerificationPage() {
  const navigate = useNavigate();
  const { user, isCitizen, isOfficer, isAdmin } = useAuth();

  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [formData, setFormData] = useState({
    ulpin: 'KA0102030405',
    document_type: 'Sale Deed',
    document_name: 'Registered Absolute Sale Deed',
    document_number: 'BNG-DN-2021-008912',
    document_date: '2021-04-12',
    seller_owner_name: 'Ramesh Kumar',
    buyer_applicant_name: 'Suresh Kumar',
    area_mentioned: '2.45',
    registration_reference: 'BNG-DN-2021-008912',
    additional_details: 'Certified true copy of absolute sale deed executed before SRO Bangalore South.',
  });

  const fetchVerifications = async () => {
    try {
      const res = await getDocumentVerifications();
      setVerifications(res?.documents || []);
    } catch (err) {
      console.error('Error fetching document verifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, [user]);

  const loadPreset = (type) => {
    if (type === 'matching') {
      setFormData({
        ulpin: 'KA0102030405',
        document_type: 'Sale Deed',
        document_name: 'Registered Absolute Sale Deed',
        document_number: 'BNG-DN-2021-008912',
        document_date: '2021-04-12',
        seller_owner_name: 'Ramesh Kumar',
        buyer_applicant_name: 'Suresh Kumar',
        area_mentioned: '2.45',
        registration_reference: 'BNG-DN-2021-008912',
        additional_details: 'Exact title and acreage matching master cadastral ledger.',
      });
    } else if (type === 'mismatch') {
      setFormData({
        ulpin: 'KA0102030405',
        document_type: 'Land Ownership Document',
        document_name: 'Gift Deed (Conflicting Title Claim)',
        document_number: 'GIFT-2024-KA-9912',
        document_date: '2024-06-18',
        seller_owner_name: 'Vikramaditya Hegde',
        buyer_applicant_name: 'Rohit Hegde',
        area_mentioned: '4.10',
        registration_reference: 'SRO-RURAL-GIFT-88',
        additional_details: 'Unverified deed asserting ownership over 4.10 hectares by conflicting party.',
      });
    } else if (type === 'review') {
      setFormData({
        ulpin: 'KA0102030405',
        document_type: 'Survey Document',
        document_name: 'Tippani Survey Sketch & Partition Memo',
        document_number: 'SURV-2025-BLR-0044',
        document_date: '2025-01-20',
        seller_owner_name: 'Ramesh Kumar',
        buyer_applicant_name: 'Ramesh Kumar & Co-heirs',
        area_mentioned: '2.40',
        registration_reference: '',
        additional_details: 'Family partition survey memo with minor 0.05 Ha variance requiring field scrutiny.',
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      const payload = {
        ulpin: formData.ulpin.trim().toUpperCase(),
        document_type: formData.document_type,
        document_name: formData.document_name.trim(),
        document_number: formData.document_number?.trim() || null,
        document_date: formData.document_date?.trim() || null,
        seller_owner_name: formData.seller_owner_name?.trim() || null,
        buyer_applicant_name: formData.buyer_applicant_name?.trim() || null,
        area_mentioned: formData.area_mentioned ? parseFloat(formData.area_mentioned) : null,
        registration_reference: formData.registration_reference?.trim() || null,
        additional_details: formData.additional_details?.trim() || null,
      };

      const created = await createDocumentVerification(payload);
      setSuccessMsg(`Document verification submitted successfully (${created.doc_verification_id}). Automated evaluation: ${created.overall_result}`);
      await fetchVerifications();
      // Navigate to detail comparison page
      navigate(`/document-verification/${created.doc_verification_id}`);
    } catch (err) {
      setError(err.message || 'Failed to submit document verification request.');
    } finally {
      setSubmitting(false);
    }
  };

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
        return <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-600">APPROVED</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-rose-950 text-rose-300 border border-rose-600">REJECTED</span>;
      case 'UNDER_REVIEW':
        return <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-950 text-amber-300 border border-amber-600">UNDER REVIEW</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-blue-950 text-blue-300 border border-blue-600">SUBMITTED</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 border border-slate-700/80 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Deterministic 5-Point Cadastral Comparison Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Document Verification Workflow
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            Submit land-related title deeds, sale deeds, tax receipts, or survey memos to automatically compare extracted parameters against verified LandSetu Cadastral and IGR Registration records.
          </p>
        </div>
      </div>

      {/* Submission Form Card */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/60 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              Submit Document for Verification
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter document metadata for automated comparison checks against the cadastral registry.
            </p>
          </div>

          {/* Demonstration Quick Preset Loaders */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Presets:</span>
            <button
              type="button"
              onClick={() => loadPreset('matching')}
              className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-medium rounded-lg transition"
            >
              ✓ Matching Sale Deed
            </button>
            <button
              type="button"
              onClick={() => loadPreset('mismatch')}
              className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-medium rounded-lg transition"
            >
              ✗ Conflicting Deed (Mismatch)
            </button>
            <button
              type="button"
              onClick={() => loadPreset('review')}
              className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-medium rounded-lg transition"
            >
              ⚠ Partition Memo (Needs Review)
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-200">Submission Error</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-200">Success</p>
              <p className="mt-0.5">{successMsg}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Target ULPIN */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Target Parcel ULPIN *
              </label>
              <input
                type="text"
                required
                value={formData.ulpin}
                onChange={(e) => setFormData({ ...formData, ulpin: e.target.value })}
                placeholder="e.g. KA0102030405"
                className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Document Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Document Type *
              </label>
              <select
                value={formData.document_type}
                onChange={(e) => setFormData({ ...formData, document_type: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Sale Deed">Sale Deed</option>
                <option value="Registration Document">Registration Document (IGR)</option>
                <option value="Property Tax Receipt">Property Tax Assessment Receipt</option>
                <option value="Land Ownership Document">Land Ownership Document / Title Deed</option>
                <option value="Survey Document">Survey Document / Tippani Sketch</option>
              </select>
            </div>

            {/* Document Title / Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Document Title *
              </label>
              <input
                type="text"
                required
                value={formData.document_name}
                onChange={(e) => setFormData({ ...formData, document_name: e.target.value })}
                placeholder="e.g. Registered Absolute Sale Deed"
                className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Document Number / Reference */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Deed / Document Number
              </label>
              <input
                type="text"
                value={formData.document_number}
                onChange={(e) => setFormData({ ...formData, document_number: e.target.value })}
                placeholder="e.g. BNG-DN-2021-008912"
                className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Document Execution Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Execution / Registration Date
              </label>
              <input
                type="date"
                value={formData.document_date}
                onChange={(e) => setFormData({ ...formData, document_date: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Area Mentioned */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Area Mentioned (Hectares / Acres)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.area_mentioned}
                onChange={(e) => setFormData({ ...formData, area_mentioned: e.target.value })}
                placeholder="e.g. 2.45"
                className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Seller / Recorded Owner Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Seller / Titleholder Name
              </label>
              <input
                type="text"
                value={formData.seller_owner_name}
                onChange={(e) => setFormData({ ...formData, seller_owner_name: e.target.value })}
                placeholder="e.g. Ramesh Kumar"
                className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Buyer / Applicant Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Buyer / Applicant Name
              </label>
              <input
                type="text"
                value={formData.buyer_applicant_name}
                onChange={(e) => setFormData({ ...formData, buyer_applicant_name: e.target.value })}
                placeholder="e.g. Suresh Kumar"
                className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* SRO Registration Reference */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                SRO Reference / Index Reference
              </label>
              <input
                type="text"
                value={formData.registration_reference}
                onChange={(e) => setFormData({ ...formData, registration_reference: e.target.value })}
                placeholder="e.g. BNG-DN-2021-008912"
                className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Additional Notes & Legal Remarks
            </label>
            <textarea
              rows="2"
              value={formData.additional_details}
              onChange={(e) => setFormData({ ...formData, additional_details: e.target.value })}
              placeholder="Provide background context or document execution notes..."
              className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Running Deterministic Checks...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Submit & Run 5-Point Verification
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Recent Document Verifications Directory Table */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-blue-400" />
              Document Verification Directory & Audit Records
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Inspected land documents, automated comparison results, and official status.
            </p>
          </div>
          <span className="text-xs text-slate-400">Total: {verifications.length} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold border-b border-slate-700/80">
              <tr>
                <th className="px-4 py-3.5">Verification ID</th>
                <th className="px-4 py-3.5">Target ULPIN</th>
                <th className="px-4 py-3.5">Document Details</th>
                <th className="px-4 py-3.5">Automated Check</th>
                <th className="px-4 py-3.5">Workflow Status</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {verifications.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-slate-500">
                    No document verification records found.
                  </td>
                </tr>
              ) : (
                verifications.map((doc) => (
                  <tr key={doc.doc_verification_id} className="hover:bg-slate-750/50 transition">
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-200">
                      {doc.doc_verification_id}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-emerald-400 font-semibold">
                      {doc.ulpin}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-white">{doc.document_name}</p>
                      <p className="text-[11px] text-slate-400">{doc.document_type}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      {getResultBadge(doc.overall_result)}
                    </td>
                    <td className="px-4 py-3.5">
                      {getStatusBadge(doc.status)}
                    </td>
                    <td className="px-4 py-3.5 text-slate-400">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => navigate(`/document-verification/${doc.doc_verification_id}`)}
                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white rounded-lg font-semibold text-xs transition inline-flex items-center gap-1"
                      >
                        <span>Compare & Review</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
