import React, { useState } from 'react';
import { 
  MapPin, 
  User, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  Database,
  Calendar,
  Layers,
  Building2,
  FileCheck
} from 'lucide-react';

export default function ParcelCard({ parcel }) {
  const [copied, setCopied] = useState(false);

  if (!parcel) return null;

  const copyUlpin = () => {
    navigator.clipboard.writeText(parcel.ulpin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isDisputed = parcel.status?.toLowerCase().includes('dispute');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8 transition-all">
      {/* Header bar */}
      <div className="bg-slate-900 text-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-xs text-emerald-400 font-mono font-medium tracking-wider uppercase mb-1">
            <Database className="h-3.5 w-3.5" />
            <span>Land Parcel Record</span>
          </div>
          <div className="flex items-center space-x-3">
            <h3 className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-white">
              {parcel.ulpin}
            </h3>
            <button
              onClick={copyUlpin}
              className="text-slate-400 hover:text-white p-1 rounded transition"
              title="Copy ULPIN"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span
            className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              isDisputed
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            }`}
          >
            {isDisputed ? (
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            )}
            <span>{parcel.status || 'Active'}</span>
          </span>
          <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full font-medium border border-slate-700">
            Survey No: {parcel.survey_number}
          </span>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Ownership & Identity */}
        <div className="bg-slate-50/80 rounded-lg p-4 border border-slate-200/80 space-y-3">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <User className="h-4 w-4 text-emerald-600" />
            <span>Ownership Details</span>
          </div>

          <div>
            <span className="text-xs text-slate-500 block">Primary Owner Name</span>
            <span className="text-base font-semibold text-slate-900">{parcel.owner_name}</span>
          </div>

          {parcel.father_name && (
            <div>
              <span className="text-xs text-slate-500 block">Father / Relation</span>
              <span className="text-sm font-medium text-slate-700">{parcel.father_name}</span>
            </div>
          )}

          <div>
            <span className="text-xs text-slate-500 block">Record Status</span>
            <span className="text-sm font-medium text-slate-800">{parcel.status}</span>
          </div>
        </div>

        {/* Card 2: Location Attributes */}
        <div className="bg-slate-50/80 rounded-lg p-4 border border-slate-200/80 space-y-3">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <MapPin className="h-4 w-4 text-emerald-600" />
            <span>Jurisdiction & Location</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-500 block">State</span>
              <span className="font-medium text-slate-800">{parcel.state}</span>
            </div>
            <div>
              <span className="text-slate-500 block">District</span>
              <span className="font-semibold text-slate-900">{parcel.district}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Taluk</span>
              <span className="font-medium text-slate-800">{parcel.taluk}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Hobli</span>
              <span className="font-medium text-slate-800">{parcel.hobli || 'N/A'}</span>
            </div>
          </div>

          <div className="pt-1 border-t border-slate-200/60">
            <span className="text-xs text-slate-500 block">Village</span>
            <span className="text-sm font-semibold text-slate-900">{parcel.village}</span>
          </div>
        </div>

        {/* Card 3: Land Characteristics & Area */}
        <div className="bg-slate-50/80 rounded-lg p-4 border border-slate-200/80 space-y-3">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Layers className="h-4 w-4 text-emerald-600" />
            <span>Land Area & Classification</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-xs text-slate-500 block">Hectares</span>
              <span className="text-base font-bold text-emerald-700">{parcel.area_hectares} Ha</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Acres</span>
              <span className="text-base font-bold text-slate-800">{parcel.area_acres} Ac</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200/60">
            <div>
              <span className="text-slate-500 block">Land Type</span>
              <span className="font-medium text-slate-800">{parcel.land_type}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Land Use</span>
              <span className="font-medium text-slate-800">{parcel.land_use}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Footer metadata bar */}
      <div className="bg-slate-100/70 border-t border-slate-200 px-6 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-slate-600 gap-2">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>Last Mutation: <strong className="text-slate-700">{parcel.last_transaction_date || 'N/A'}</strong></span>
          </div>
          <div className="flex items-center space-x-1.5">
            <FileCheck className="h-3.5 w-3.5 text-slate-400" />
            <span>Encumbrances: <strong className="text-slate-700">{parcel.encumbrances?.length || 0} active</strong></span>
          </div>
        </div>

        <div className="flex items-center space-x-1 text-[11px] text-slate-500">
          <Database className="h-3 w-3 text-slate-400" />
          <span>Synchronized with Land Records backend</span>
        </div>
      </div>
    </div>
  );
}
