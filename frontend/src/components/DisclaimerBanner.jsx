import React from 'react';
import { Shield } from 'lucide-react';

export default function DisclaimerBanner({ text }) {
  const disclaimerText = text || "The information displayed on LandSetu uses fictional data for demonstration purposes and does not represent actual land records, ownership details, government records, or official transactions.";

  return (
    <div className="bg-slate-100 border-b border-slate-200 text-slate-700 px-4 py-2 text-xs">
      <div className="max-w-7xl mx-auto flex items-center space-x-2">
        <Shield className="h-3.5 w-3.5 text-slate-500 shrink-0" />
        <div className="flex-1 font-medium">
          <strong className="text-slate-900">Data Disclaimer:</strong> {disclaimerText}
        </div>
      </div>
    </div>
  );
}
