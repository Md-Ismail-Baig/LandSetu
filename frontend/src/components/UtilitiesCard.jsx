import React from 'react';
import { Zap, Droplets, Navigation, CheckCircle } from 'lucide-react';

export default function UtilitiesCard({ utilities }) {
  if (!utilities) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3.5">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-md bg-teal-50 text-teal-700">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Utilities & Civic Access</h4>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Infrastructure Connectivity</span>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
            Connected
          </span>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="flex items-start space-x-2">
            <Zap className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-500 text-[11px] block">Electricity Supply</span>
              <span className="font-semibold text-slate-900">{utilities.electricity_provider}</span>
              <span className="text-slate-500 text-[10px] block">{utilities.electricity_status}</span>
            </div>
          </div>

          <div className="flex items-start space-x-2 pt-1 border-t border-slate-100">
            <Droplets className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-500 text-[11px] block">Water Supply & Sewerage</span>
              <span className="font-semibold text-slate-900">{utilities.water_authority}</span>
              <span className="text-slate-500 text-[10px] block">{utilities.water_status}</span>
            </div>
          </div>

          <div className="flex items-start space-x-2 pt-1 border-t border-slate-100">
            <Navigation className="h-3.5 w-3.5 text-slate-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-500 text-[11px] block">Right of Way / Road Access</span>
              <span className="font-semibold text-slate-900">{utilities.road_access_type}</span>
              <span className="text-emerald-700 font-medium text-[10px] block">Road Width: {utilities.road_width_feet} Feet</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
        <span>Drainage: {utilities.sewage_drainage_status}</span>
        <span className="text-teal-700 font-medium font-mono">{utilities.electricity_consumer_id || 'ID Active'}</span>
      </div>
    </div>
  );
}
