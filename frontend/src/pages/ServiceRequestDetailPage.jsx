import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getServiceRequestById, getIntegratedView } from '../services/api';
import OfficerReviewPanel from '../components/OfficerReviewPanel';
import AuditView from '../components/AuditView';
import {
  FileCheck2,
  ArrowLeft,
  MapPin,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Shield,
  Layers,
  FileText,
  Calendar,
  Sparkles
} from 'lucide-react';

export default function ServiceRequestDetailPage() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [parcelData, setParcelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const req = await getServiceRequestById(requestId);
      setRequest(req);
      if (req.ulpin) {
        const p = await getIntegratedView(req.ulpin).catch(() => null);
        setParcelData(p);
      }
    } catch (err) {
      setError(err.message || 'Unable to retrieve service request.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [requestId]);

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-slate-500 flex items-center justify-center space-x-3">
        <div className="h-5 w-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <span>Loading service request details...</span>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="bg-white rounded-xl border border-red-200 p-8 text-center max-w-lg mx-auto">
        <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900">Request Not Found</h3>
        <p className="text-xs text-slate-500 mt-1">{error || 'Service request record could not be located.'}</p>
        <button
          onClick={() => navigate('/service-requests')}
          className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold"
        >
          Back to Service Requests
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <button
              onClick={() => navigate('/service-requests')}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center space-x-1 mb-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Requests List</span>
            </button>

            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl sm:text-2xl font-bold font-mono text-slate-900">
                {request.request_id}
              </h2>

              <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${
                request.status === 'APPROVED' || request.status === 'COMPLETED'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : request.status === 'REJECTED'
                  ? 'bg-red-50 text-red-800 border-red-300'
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}>
                {request.status}
              </span>

              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {request.service_type.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          {request.ulpin && (
            <button
              onClick={() => navigate(`/search?ulpin=${request.ulpin}`)}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center space-x-1.5 shrink-0"
            >
              <span>Inspect Parcel {request.ulpin}</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Grid: Request Metadata + Linked Parcel Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Case Info & Metadata */}
        <div className="lg:col-span-7 bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Service Case Metadata
          </h3>

          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Applicant</span>
              <span className="font-semibold text-slate-900">{request.applicant}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Assigned Authority</span>
              <span className="font-semibold text-slate-900">{request.assigned_role}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Priority</span>
              <span className="font-semibold text-slate-800">{request.priority}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Submitted Date</span>
              <span className="font-mono text-slate-700">{new Date(request.created_at).toLocaleString()}</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
              Case Description & Citizen Remarks
            </span>
            <p className="text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed font-medium">
              {request.description}
            </p>
          </div>

          {request.metadata && Object.keys(request.metadata).length > 0 && (
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                Custom Workflow Payload
              </span>
              <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg text-[11px] font-mono overflow-x-auto">
                {JSON.stringify(request.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Right: Target Parcel Demarcation */}
        <div className="lg:col-span-5 bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between text-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 mb-3">
              Anchored Parcel Overview
            </h3>

            {parcelData ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">ULPIN:</span>
                  <span className="font-mono font-bold text-emerald-800">{parcelData.parcel.ulpin}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Owner of Record:</span>
                  <span className="font-bold text-slate-900">{parcelData.parcel.owner_name}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Demarcated Area:</span>
                  <span className="font-mono font-semibold">{parcelData.parcel.area_hectares} Hectares</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Survey Plot:</span>
                  <span className="font-mono">{parcelData.parcel.survey_number}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Jurisdiction:</span>
                  <span>{parcelData.parcel.village}, {parcelData.parcel.district}</span>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 italic">No parcel data available.</p>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400">
            Digital Public Infrastructure Framework
          </div>
        </div>
      </div>

      {/* Linked Document Verification if applicable */}
      {(request.service_type === 'DOCUMENT_VERIFICATION' || request.metadata?.verification_id) && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-emerald-600 text-white rounded-lg">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-950">
                Document Verification Workflow Linked
              </h4>
              <p className="text-xs text-emerald-800 mt-0.5">
                Verification Record ID: <span className="font-mono font-bold">{request.metadata?.verification_id || request.request_id}</span>.
                Compare submitted deed attributes against cadastral registry ledgers.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate(`/document-verification/${request.metadata?.verification_id || request.request_id}`)}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center space-x-1.5 shrink-0 self-start sm:self-center"
          >
            <span>Open 5-Point Comparison Panel</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Linked Verification Panel if applicable */}
      {request.linked_verification && (
        <OfficerReviewPanel
          ulpin={request.ulpin}
          verification={request.linked_verification}
          onStatusChange={fetchDetail}
        />
      )}

      {/* Audit trail for the parcel */}
      <AuditView ulpin={request.ulpin} />
    </div>
  );
}
