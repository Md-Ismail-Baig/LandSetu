import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, Scale, Lock } from 'lucide-react';

export default function RestrictionsCard({ restrictions }) {
  if (!restrictions) return null;

  const isRestricted = restrictions.status.toLowerCase().includes('restriction') || restrictions.alert_flags?.length > 0;

  return (
    <div className={`rounded-xl shadow-sm border p-5 flex flex-col justify-between ${
      isRestricted ? 'bg-amber-50/40 border-amber-200' : 'bg-white border-slate-200'
    }`}>
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3.5">
          <div className="flex items-center space-x-2">
            <div className={`p-1.5 rounded-md ${isRestricted ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-700'}`}>
              {isRestricted ? <ShieldAlert className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Legal & Restrictions</h4>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Encumbrance & Litigations</span>
            </div>
          </div>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
            isRestricted 
              ? 'bg-amber-100 text-amber-900 border-amber-300' 
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            {restrictions.status}
          </span>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="flex items-start justify-between">
            <span className="text-slate-500 text-[11px]">Court Litigation / Stay</span>
            <span className={`font-semibold text-right ${restrictions.court_stay_status.includes('Injunction') ? 'text-red-700' : 'text-slate-800'}`}>
              {restrictions.court_stay_status}
            </span>
          </div>

          <div className="flex items-start justify-between pt-1 border-t border-slate-100">
            <span className="text-slate-500 text-[11px]">Government Acquisition</span>
            <span className="font-medium text-slate-800 text-right">{restrictions.land_acquisition_status}</span>
          </div>

          <div className="flex items-start justify-between pt-1 border-t border-slate-100">
            <span className="text-slate-500 text-[11px]">Ceiling Act Compliance</span>
            <span className="font-medium text-slate-800 text-right">{restrictions.ceiling_act_status}</span>
          </div>

          <div className="flex items-start justify-between pt-1 border-t border-slate-100">
            <span className="text-slate-500 text-[11px]">Bank Lien / Mortgage</span>
            <span className="font-medium text-slate-800 text-right">{restrictions.mortgage_status}</span>
          </div>

          {restrictions.alert_flags && restrictions.alert_flags.length > 0 && (
            <div className="mt-2 pt-2 border-t border-amber-200/80">
              <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1 mb-1">
                <AlertTriangle className="h-3 w-3 text-amber-600" /> Active Alert Flags:
              </span>
              <div className="flex flex-wrap gap-1">
                {restrictions.alert_flags.map((flag, idx) => (
                  <span key={idx} className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] px-1.5 py-0.5 rounded font-medium">
                    {flag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-2.5 border-t border-slate-100 text-[10px] text-slate-500 italic">
        {restrictions.remarks}
      </div>
    </div>
  );
}
