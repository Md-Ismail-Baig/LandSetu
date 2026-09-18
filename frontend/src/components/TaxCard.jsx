import React from 'react';
import { Receipt, CheckCircle, AlertCircle } from 'lucide-react';

export default function TaxCard({ tax }) {
  if (!tax) return null;

  const isPaid = tax.outstanding_amount === 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3.5">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-md bg-amber-50 text-amber-700">
              <Receipt className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Municipal & Land Tax</h4>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Property Tax Assessment</span>
            </div>
          </div>
          <span className={`inline-flex items-center space-x-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
            isPaid 
              ? 'text-emerald-700 bg-emerald-50 border-emerald-200' 
              : 'text-amber-800 bg-amber-50 border-amber-200'
          }`}>
            {isPaid ? <CheckCircle className="h-3 w-3 text-emerald-600" /> : <AlertCircle className="h-3 w-3 text-amber-600" />}
            <span>{isPaid ? 'Paid' : 'Dues Pending'}</span>
          </span>
        </div>

        <div className="space-y-2.5 text-xs">
          <div>
            <span className="text-slate-500 block text-[11px]">Revenue Authority</span>
            <span className="text-xs font-semibold text-slate-900 leading-snug block">{tax.authority}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
            <div>
              <span className="text-slate-500 text-[11px] block">Assessment FY</span>
              <span className="font-semibold text-slate-800">{tax.assessment_year}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">Annual Assessed</span>
              <span className="font-semibold text-slate-900 font-mono">₹{tax.annual_tax_assessed?.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
            <div>
              <span className="text-slate-500 text-[11px] block">Outstanding Dues</span>
              <span className={`font-mono font-bold ${isPaid ? 'text-emerald-700' : 'text-red-600'}`}>
                ₹{tax.outstanding_amount?.toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">Last Payment Date</span>
              <span className="font-medium text-slate-800">{tax.last_payment_date || 'None on record'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-mono">
        <span>PID: {tax.property_tax_id}</span>
        <span>Receipt: {tax.last_receipt_number || 'N/A'}</span>
      </div>
    </div>
  );
}
