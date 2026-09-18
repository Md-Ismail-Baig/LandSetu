import React, { useState, useEffect } from 'react';
import { getParcels, getVerification } from '../services/api';
import SatelliteCard from '../components/SatelliteCard';
import OfficerReviewPanel from '../components/OfficerReviewPanel';
import AuditView from '../components/AuditView';
import { Satellite, AlertTriangle, ShieldCheck, Database, Calendar } from 'lucide-react';

export default function ChangeMonitoringPage() {
  const [parcels, setParcels] = useState([]);
  const [selectedUlpin, setSelectedUlpin] = useState('KA0102030405');
  const [verification, setVerification] = useState(null);
  const [auditRefreshKey, setAuditRefreshKey] = useState(0);

  useEffect(() => {
    const fetchParcels = async () => {
      try {
        const res = await getParcels();
        setParcels(res.parcels || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchParcels();
  }, []);

  const fetchVerif = async () => {
    if (!selectedUlpin) return;
    try {
      const v = await getVerification(selectedUlpin);
      setVerification(v);
    } catch (e) {
      setVerification(null);
    }
  };

  useEffect(() => {
    fetchVerif();
  }, [selectedUlpin]);

  const handleStatusChange = (newVer) => {
    setVerification(newVer);
    setAuditRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-rose-700 uppercase tracking-wider mb-1">
            <Satellite className="h-4 w-4" />
            <span>Satellite Temporal Change Sentinel</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 tracking-tight">
            Automated Cadastral Encroachment & Construction Detection
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Computer vision comparison of baseline vs latest satellite imagery paired with official verification workflows.
          </p>
        </div>

        {/* Parcel Selector */}
        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-xs font-bold text-slate-700">Parcel:</span>
          <select
            value={selectedUlpin}
            onChange={(e) => setSelectedUlpin(e.target.value)}
            className="px-3 py-1.5 text-xs font-mono font-bold bg-slate-100 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            {parcels.map((p) => (
              <option key={p.ulpin} value={p.ulpin}>
                {p.ulpin} ({p.owner_name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Satellite Card */}
      <SatelliteCard
        ulpin={selectedUlpin}
        onVerificationStarted={handleStatusChange}
      />

      {/* Officer Review Panel if verification exists */}
      {verification && (
        <OfficerReviewPanel
          ulpin={selectedUlpin}
          verification={verification}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Audit View */}
      <AuditView
        ulpin={selectedUlpin}
        refreshTrigger={auditRefreshKey}
      />
    </div>
  );
}
