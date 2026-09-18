import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ParcelMap from './ParcelMap';
import OwnershipCard from './OwnershipCard';
import RegistrationCard from './RegistrationCard';
import TaxCard from './TaxCard';
import PlanningCard from './PlanningCard';
import UtilitiesCard from './UtilitiesCard';
import RestrictionsCard from './RestrictionsCard';
import TransactionsTimeline from './TransactionsTimeline';
import SatelliteCard from './SatelliteCard';
import OfficerReviewPanel from './OfficerReviewPanel';
import AuditView from './AuditView';
import AIAssistantCard from './AIAssistantCard';
import { getVerification } from '../services/api';
import { 
  MapPin, 
  Copy, 
  Check, 
  Layers, 
  Database, 
  ShieldCheck, 
  ArrowLeft, 
  Satellite,
  Bot,
  History,
  FileCheck2,
  FileText
} from 'lucide-react';

export default function OneIntegratedParcelView({ data, onBackToSearch }) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [verification, setVerification] = useState(null);
  const [auditRefreshKey, setAuditRefreshKey] = useState(0);

  if (!data || !data.parcel) return null;

  const { parcel, ownership, registration, tax, planning, utilities, restrictions, transactions, map } = data;

  const fetchCurrentVerification = async () => {
    try {
      const v = await getVerification(parcel.ulpin);
      setVerification(v);
    } catch (e) {
      setVerification(null);
    }
  };

  useEffect(() => {
    if (parcel?.ulpin) {
      fetchCurrentVerification();
    }
  }, [parcel?.ulpin]);

  const copyUlpin = () => {
    navigator.clipboard.writeText(parcel.ulpin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerificationStatusChange = (newVerification) => {
    setVerification(newVerification);
    setAuditRefreshKey((prev) => prev + 1);
  };

  const isDisputed = parcel.status?.toLowerCase().includes('dispute');

  return (
    <div className="space-y-6 pb-12">
      {/* Top Identity & Action Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              <span>One Integrated Parcel View</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-mono">DPI Cadastral Anchor</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 tracking-tight">
                {parcel.ulpin}
              </h2>
              <button
                onClick={copyUlpin}
                className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition"
                title="Copy ULPIN"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              </button>

              <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                isDisputed
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-300'
              }`}>
                {parcel.status}
              </span>

              {verification && (
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                  verification.status === 'APPROVED'
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    : verification.status === 'REJECTED'
                    ? 'bg-red-100 text-red-900 border-red-300'
                    : 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                }`}>
                  Verification: {verification.status}
                </span>
              )}

              <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-medium border border-slate-200">
                Survey No: {parcel.survey_number}
              </span>
            </div>

            {/* Geographic Breadcrumb */}
            <div className="flex items-center space-x-1.5 text-xs text-slate-600 mt-2.5">
              <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span className="font-semibold text-slate-900">{parcel.village}</span>
              <span className="text-slate-400">/</span>
              <span>{parcel.hobli || 'Hobli'}</span>
              <span className="text-slate-400">/</span>
              <span>{parcel.taluk}</span>
              <span className="text-slate-400">/</span>
              <span className="font-semibold text-slate-800">{parcel.district}</span>
              <span className="text-slate-400">/</span>
              <span className="text-slate-700">{parcel.state}</span>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => navigate(`/document-verification?ulpin=${parcel.ulpin}`)}
              className="px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition flex items-center space-x-1.5 shadow-sm"
            >
              <FileText className="h-3.5 w-3.5 text-emerald-700" />
              <span>Verify Deed / Document</span>
            </button>

            {onBackToSearch && (
              <button
                onClick={onBackToSearch}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition flex items-center space-x-1.5"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Search</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Middle Section: GIS Map (Left) + Core Governance Metrics (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 xl:col-span-8">
          <ParcelMap
            geoJson={map}
            ulpin={parcel.ulpin}
            parcel={parcel}
          />
        </div>

        <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3.5">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-700">
                  <Database className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Cadastral Metric Highlights</h3>
              </div>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 font-semibold px-2 py-0.5 rounded border border-emerald-200">
                Synchronized
              </span>
            </div>

            <div className="bg-slate-50/80 rounded-lg p-3.5 border border-slate-200/80 mb-3.5">
              <span className="text-[11px] text-slate-500 font-medium block uppercase tracking-wider mb-1">
                Total Demarcated Land Area
              </span>
              <div className="flex items-baseline space-x-3">
                <span className="text-2xl font-bold text-emerald-800 font-mono">
                  {parcel.area_hectares}
                </span>
                <span className="text-xs text-slate-600 font-semibold">Hectares</span>
                <span className="text-slate-300">|</span>
                <span className="text-base font-bold text-slate-800 font-mono">
                  {parcel.area_acres}
                </span>
                <span className="text-xs text-slate-600 font-semibold">Acres</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Owner of Record:</span>
                <span className="font-bold text-slate-900">{parcel.owner_name}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Classification:</span>
                <span className="font-semibold text-slate-800">{parcel.land_type}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Zoning Land Use:</span>
                <span className="font-semibold text-slate-800">{parcel.land_use}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Sub-Registrar Jurisdiction:</span>
                <span className="font-medium text-slate-800">{registration?.sro_office || 'Local SRO'}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Khata Record:</span>
                <span className="font-mono font-medium text-slate-800">{ownership?.khata_number || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500">Property Tax Assessment:</span>
                <span className="font-semibold text-emerald-700">{tax?.payment_status || 'Assessed'}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
            <span>Identity standard: 14-digit ULPIN</span>
            <span className="text-emerald-700 font-medium">LandSetu DPI</span>
          </div>
        </div>
      </div>

      {/* Satellite Monitoring & Officer Review Section */}
      <div className="space-y-4">
        <SatelliteCard
          ulpin={parcel.ulpin}
          onVerificationStarted={handleVerificationStatusChange}
        />

        {verification && (
          <OfficerReviewPanel
            ulpin={parcel.ulpin}
            verification={verification}
            onStatusChange={handleVerificationStatusChange}
          />
        )}
      </div>

      {/* Grounded AI Assistant Section */}
      <div>
        <AIAssistantCard ulpin={parcel.ulpin} />
      </div>

      {/* 6 Unified Departmental Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pt-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Layers className="h-5 w-5 text-emerald-600" />
              Unified Departmental Ledgers
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Aggregated across 6 administrative silos anchored to ULPIN <code className="font-mono text-emerald-800 font-semibold">{parcel.ulpin}</code>
            </p>
          </div>
          <div className="hidden sm:flex items-center space-x-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            <span>6/6 Department Services Connected</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <OwnershipCard ownership={ownership} />
          <RegistrationCard registration={registration} />
          <TaxCard tax={tax} />
          <PlanningCard planning={planning} />
          <UtilitiesCard utilities={utilities} />
          <RestrictionsCard restrictions={restrictions} />
        </div>
      </div>

      {/* Transactions & Mutations Timeline */}
      <div className="pt-2">
        <TransactionsTimeline transactions={transactions} />
      </div>

      {/* Audit Trail Ledger */}
      <div className="pt-2">
        <AuditView
          ulpin={parcel.ulpin}
          refreshTrigger={auditRefreshKey}
        />
      </div>
    </div>
  );
}
