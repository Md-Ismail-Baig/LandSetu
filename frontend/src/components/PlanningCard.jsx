import React from 'react';
import { Compass, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function PlanningCard({ planning }) {
  if (!planning) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3.5">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-md bg-purple-50 text-purple-700">
              <Compass className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Planning & Zoning</h4>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Master Plan & Land Use</span>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
            {planning.development_status}
          </span>
        </div>

        <div className="space-y-2.5 text-xs">
          <div>
            <span className="text-slate-500 block text-[11px]">Planning Authority</span>
            <span className="text-xs font-semibold text-slate-900 block leading-snug">{planning.planning_authority}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
            <div>
              <span className="text-slate-500 text-[11px] block">Master Plan Zone</span>
              <span className="font-semibold text-slate-800 text-[11px] leading-tight block">{planning.master_plan_zone}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">Permissible FAR</span>
              <span className="font-bold text-emerald-700">{planning.permissible_far}</span>
            </div>
          </div>

          <div className="pt-1 border-t border-slate-100">
            <span className="text-slate-500 text-[11px] block">Conversion Status</span>
            <span className="font-medium text-slate-900 block text-[11px]">{planning.conversion_status}</span>
            {planning.conversion_order_no && (
              <span className="text-slate-500 text-[10px] font-mono block">Order: {planning.conversion_order_no}</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
        <span>Green Belt: {planning.green_belt_clearance}</span>
        <span className="text-purple-700 font-medium">CDP 2031 Valid</span>
      </div>
    </div>
  );
}
