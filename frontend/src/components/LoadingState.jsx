import React from 'react';

export default function LoadingState({ ulpin }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8 text-center animate-pulse">
      <div className="inline-flex items-center justify-center p-3 bg-emerald-50 rounded-full text-emerald-600 mb-4">
        <svg className="animate-spin h-7 w-7" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>

      <h4 className="text-base font-bold text-slate-800 tracking-tight">
        Querying Land Governance Registry...
      </h4>
      <p className="text-xs text-slate-500 mt-1 font-mono">
        Fetching parcel record for ULPIN: <span className="font-semibold text-emerald-700">{ulpin}</span>
      </p>

      {/* Skeleton cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
        <div className="h-28 bg-slate-100 rounded-lg"></div>
        <div className="h-28 bg-slate-100 rounded-lg"></div>
        <div className="h-28 bg-slate-100 rounded-lg"></div>
      </div>
    </div>
  );
}
