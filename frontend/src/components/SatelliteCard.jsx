import React, { useState, useEffect } from 'react';
import { getSatelliteData, initiateVerification, getVerification } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Satellite, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  ArrowRight, 
  Calendar
} from 'lucide-react';

export default function SatelliteCard({ ulpin, onVerificationStarted }) {
  const { user, hasVerificationAuthority } = useAuth();
  const [satelliteData, setSatelliteData] = useState(null);
  const [verificationData, setVerificationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSatelliteAndVerification = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sat, ver] = await Promise.all([
        getSatelliteData(ulpin).catch(() => null),
        getVerification(ulpin).catch(() => null),
      ]);
      setSatelliteData(sat);
      setVerificationData(ver);
    } catch (err) {
      setError('Unable to load satellite monitoring records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ulpin) {
      fetchSatelliteAndVerification();
    }
  }, [ulpin]);

  const handleStartVerification = async () => {
    if (!hasVerificationAuthority) return;
    setActionLoading(true);
    try {
      const ver = await initiateVerification(
        ulpin,
        `Review initiated for detected change: ${satelliteData?.change?.type || 'Possible Anomaly'}`
      );
      setVerificationData(ver);
      if (onVerificationStarted) onVerificationStarted(ver);
    } catch (err) {
      setError(err.message || 'Failed to initiate verification workflow.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex items-center justify-center space-x-3">
        <div className="h-5 w-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs text-slate-500 font-medium">Retrieving satellite monitoring analysis...</span>
      </div>
    );
  }

  if (!satelliteData) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm mb-2">
          <Satellite className="h-4 w-4 text-slate-500" />
          <h4>Satellite Cadastral Monitoring</h4>
        </div>
        <p className="text-xs text-slate-500">
          No automated satellite change detection captures registered for ULPIN <code className="font-mono text-slate-700">{ulpin}</code>.
        </p>
      </div>
    );
  }

  const { change, previous, current } = satelliteData;
  const isChangeDetected = change?.detected;
  const isPending = verificationData?.status === 'PENDING';
  const isApproved = verificationData?.status === 'APPROVED';
  const isRejected = verificationData?.status === 'REJECTED';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Top Banner */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${isChangeDetected ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
            <Satellite className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-slate-900">Satellite Analysis</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Analysis shown is based on simulated imagery and is intended for informational purposes only.
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div>
          {isChangeDetected ? (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              <span>Possible Change — Requires Officer Verification</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>No Structural Change</span>
            </span>
          )}
        </div>
      </div>

      {/* Dual Imagery Comparison */}
      <div className="p-5 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Baseline Capture */}
          <div className="rounded-xl border border-slate-200 bg-slate-950 p-3 text-white overflow-hidden relative group">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> Baseline Capture
              </span>
              <span className="font-mono text-slate-400 text-[11px]">{previous?.date}</span>
            </div>
            <div className="h-44 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center border border-slate-800 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-20"></div>
              <Satellite className="h-8 w-8 text-slate-500 mb-2 opacity-60" />
              <span className="text-xs font-mono text-slate-300">Agricultural / Open Cadastre</span>
              <span className="text-[10px] text-slate-500 mt-1">High-Resolution Multispectral Capture</span>
            </div>
          </div>

          {/* Latest Capture */}
          <div className="rounded-xl border border-slate-200 bg-slate-950 p-3 text-white overflow-hidden relative group">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> Latest Capture
              </span>
              <span className="font-mono text-slate-400 text-[11px]">{current?.date}</span>
            </div>
            <div className={`h-44 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center border ${isChangeDetected ? 'border-amber-500/50' : 'border-slate-800'} relative overflow-hidden`}>
              <div className="absolute inset-0 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px] opacity-20"></div>
              {isChangeDetected ? (
                <div className="text-center p-3 z-10">
                  <span className="inline-block px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-md text-xs font-mono font-bold mb-1.5">
                    {change.type || 'Possible New Construction'}
                  </span>
                  <p className="text-[11px] text-slate-300">
                    Delta Area: <span className="text-amber-400 font-mono font-bold">+{change.changed_area_sqm} m²</span> ({change.change_percentage}%)
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">Confidence Score: {(change.confidence * 100).toFixed(0)}%</p>
                </div>
              ) : (
                <>
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2 opacity-60" />
                  <span className="text-xs font-mono text-slate-300">Cadastral Footprint Constant</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Change Finding Callout */}
        {isChangeDetected && (
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start space-x-3">
              <ShieldAlert className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-amber-950">Possible Change — Requires Officer Verification</h4>
                <p className="text-amber-800 mt-0.5">
                  Automated temporal analysis identified potential structural variance (+{change.changed_area_sqm} m²). Official field inspection recommended.
                </p>
              </div>
            </div>

            {/* Action Trigger */}
            <div className="shrink-0">
              {isApproved ? (
                <span className="px-3 py-1.5 bg-emerald-600 text-white font-semibold rounded-lg text-xs flex items-center space-x-1.5 shadow-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Verification Approved</span>
                </span>
              ) : isRejected ? (
                <span className="px-3 py-1.5 bg-red-600 text-white font-semibold rounded-lg text-xs flex items-center space-x-1.5 shadow-sm">
                  <ShieldAlert className="h-4 w-4" />
                  <span>Verification Rejected</span>
                </span>
              ) : isPending ? (
                <span className="px-3 py-1.5 bg-amber-600 text-white font-semibold rounded-lg text-xs flex items-center space-x-1.5 shadow-sm">
                  <Clock className="h-4 w-4 animate-pulse" />
                  <span>Pending Officer Review</span>
                </span>
              ) : hasVerificationAuthority ? (
                <button
                  onClick={handleStartVerification}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg shadow-sm transition flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <span>{actionLoading ? 'Creating Case...' : 'Verify Parcel'}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <div className="text-[11px] text-slate-500 italic bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                  Verification authority: Revenue Officer
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
