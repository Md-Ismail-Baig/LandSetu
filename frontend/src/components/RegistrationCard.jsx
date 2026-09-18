import React from 'react';
import { FileCheck, Stamp, Building } from 'lucide-react';

export default function RegistrationCard({ registration }) {
  if (!registration) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3.5">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-md bg-blue-50 text-blue-700">
              <Stamp className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Registration & Deeds</h4>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Stamps & Registration (IGR)</span>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
            {registration.status}
          </span>
        </div>

        <div className="space-y-2.5 text-xs">
          <div>
            <span className="text-slate-500 block text-[11px]">Sub-Registrar Office</span>
            <span className="text-sm font-semibold text-slate-900">{registration.sro_office}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
            <div>
              <span className="text-slate-500 text-[11px] block">Deed Instrument</span>
              <span className="font-medium text-slate-800">{registration.deed_type}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">Registration Date</span>
              <span className="font-semibold text-slate-800">{registration.registration_date}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
            <div>
              <span className="text-slate-500 text-[11px] block">Doc Reference</span>
              <span className="font-mono font-medium text-slate-800 text-[11px]">{registration.document_number}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">Stamp Duty Paid</span>
              <span className="font-semibold text-emerald-700 font-mono">₹{registration.stamp_duty_paid?.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
        <span>Book: {registration.book_number}</span>
        <span className="text-blue-700 font-medium">Kaveri 2.0 Synced</span>
      </div>
    </div>
  );
}
