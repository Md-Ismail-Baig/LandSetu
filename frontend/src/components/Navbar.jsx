import React from 'react';
import { Landmark, MapPin, Layers, Cpu, FileCheck2 } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center shadow-lg shadow-emerald-950/50 border border-emerald-500/30">
            <Landmark className="h-6 w-6 text-emerald-100" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-white font-serif">LandSetu</h1>
              <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2 py-0.5 rounded font-medium border border-emerald-500/30">
                DPI
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              One Parcel. One Identity. One Integrated Land Ecosystem.
            </p>
          </div>
        </div>

        <nav className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto text-xs py-1">
          <button 
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-emerald-600 text-white font-medium shadow-sm transition"
          >
            <MapPin className="h-3.5 w-3.5" />
            <span>Parcel Search</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
