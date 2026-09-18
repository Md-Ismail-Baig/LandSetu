import React, { useState, useEffect } from 'react';
import { getParcels } from '../services/api';
import AIAssistantCard from '../components/AIAssistantCard';
import { Cpu, Bot, Sparkles, ShieldCheck, Database, HelpCircle, ArrowRight } from 'lucide-react';

export default function AIAssistantPage() {
  const [parcels, setParcels] = useState([]);
  const [selectedUlpin, setSelectedUlpin] = useState('KA0102030405');

  useEffect(() => {
    const fetchParcels = async () => {
      try {
        const res = await getParcels();
        setParcels(res.parcels || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchParcels();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-purple-700 uppercase tracking-wider mb-1">
              <Cpu className="h-4 w-4" />
              <span>Grounded AI / RAG Parcel Assistant</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 tracking-tight">
              Natural Language Land Query Intelligence
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Queries are answered strictly using retrieved facts from state land records, encumbrances, tax ledgers, and zoning plans with zero hallucination.
            </p>
          </div>

          {/* Parcel Selector Dropdown */}
          <div className="flex items-center space-x-2 shrink-0">
            <span className="text-xs font-bold text-slate-700">Target Parcel:</span>
            <select
              value={selectedUlpin}
              onChange={(e) => setSelectedUlpin(e.target.value)}
              className="px-3 py-1.5 text-xs font-mono font-bold bg-slate-100 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              {parcels.map((p) => (
                <option key={p.ulpin} value={p.ulpin}>
                  {p.ulpin} ({p.owner_name} - {p.village})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main AI Assistant Card */}
      <AIAssistantCard ulpin={selectedUlpin} />

      {/* Technical RAG Info Strip */}
      <div className="bg-purple-50/70 border border-purple-200/80 rounded-xl p-4 flex items-start space-x-3 text-xs">
        <ShieldCheck className="h-5 w-5 text-purple-700 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-purple-950">Grounded Architecture Guardrail</h4>
          <p className="text-purple-800 mt-0.5 leading-relaxed">
            The LandSetu AI Assistant performs structured retrieval across 6 departmental database records. If asked non-land or off-topic queries (e.g. general knowledge, recipes, trivia), it enforces a strict domain boundary guardrail refusing to hallucinate.
          </p>
        </div>
      </div>
    </div>
  );
}
