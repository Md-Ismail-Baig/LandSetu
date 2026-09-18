import React from 'react';
import { UserCheck, Shield, FileText, CheckCircle2 } from 'lucide-react';

export default function OwnershipCard({ ownership }) {
  if (!ownership) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3.5">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-700">
              <UserCheck className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Revenue & Ownership</h4>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Title Registry (Bhoomi)</span>
            </div>
          </div>
          <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" />
            <span>{ownership.status}</span>
          </span>
        </div>

        <div className="space-y-2.5 text-xs">
          <div>
            <span className="text-slate-500 block text-[11px]">Primary Title Holder</span>
            <span className="text-sm font-bold text-slate-900">{ownership.owner_name}</span>
            {ownership.father_or_spouse_name && (
              <span className="text-slate-500 text-[11px] block">Relation: {ownership.father_or_spouse_name}</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
            <div>
              <span className="text-slate-500 text-[11px] block">Owner Type</span>
              <span className="font-medium text-slate-800">{ownership.owner_type}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">Title Share</span>
              <span className="font-semibold text-emerald-700">{ownership.share_percentage}% (Sole)</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
            <div>
              <span className="text-slate-500 text-[11px] block">Khata Number</span>
              <span className="font-mono font-medium text-slate-800">{ownership.khata_number}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">Mutation Number</span>
              <span className="font-mono font-medium text-slate-800">{ownership.mutation_number}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
        <span>Ref: <code className="font-mono text-slate-600">{ownership.record_reference}</code></span>
        <span>Updated: {ownership.last_updated}</span>
      </div>
    </div>
  );
}
