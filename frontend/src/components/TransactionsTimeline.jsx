import React from 'react';
import { History, CheckCircle2, ArrowRight, ShieldCheck, FileText } from 'lucide-react';

export default function TransactionsTimeline({ transactions }) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center text-xs text-slate-500">
        No historical mutations recorded for this parcel.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center space-x-2 text-xs">
          <History className="h-4 w-4 text-emerald-400" />
          <span className="font-bold text-slate-100">Audit Trail & Mutation Timeline</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400 text-[11px]">{transactions.length} Verified Events</span>
        </div>
        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
          State Land Records Ledger
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[10px] tracking-wider">
            <tr>
              <th className="px-5 py-3">Event Date</th>
              <th className="px-5 py-3">Transaction / Mutation Type</th>
              <th className="px-5 py-3">Reference No</th>
              <th className="px-5 py-3">Authority / Department</th>
              <th className="px-5 py-3">Parties Involved</th>
              <th className="px-5 py-3 text-right">Ledger Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 font-sans">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-5 py-3.5 font-mono text-slate-900 font-medium whitespace-nowrap">
                  {tx.date}
                </td>
                <td className="px-5 py-3.5 font-medium text-slate-900">
                  <div className="flex items-center space-x-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                    <span>{tx.transaction_type}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 font-mono text-slate-600 text-[11px]">
                  {tx.reference_number}
                </td>
                <td className="px-5 py-3.5 text-slate-600">
                  {tx.department}
                </td>
                <td className="px-5 py-3.5 text-slate-600 max-w-[220px] truncate" title={tx.parties_involved}>
                  {tx.parties_involved}
                </td>
                <td className="px-5 py-3.5 text-right whitespace-nowrap">
                  <span className="inline-flex items-center space-x-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                    <span>{tx.status}</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
