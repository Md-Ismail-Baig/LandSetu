import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import OneIntegratedParcelView from '../components/OneIntegratedParcelView';
import LoadingState from '../components/LoadingState';
import ErrorMessage from '../components/ErrorMessage';
import { getIntegratedView } from '../services/api';
import { ShieldCheck, MapPin, Database, ArrowRight, Layers } from 'lucide-react';

export default function ParcelSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentUlpin, setCurrentUlpin] = useState('');
  const [integratedData, setIntegratedData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (ulpinToSearch) => {
    if (!ulpinToSearch) return;
    setCurrentUlpin(ulpinToSearch);
    setIsLoading(true);
    setError(null);
    setIntegratedData(null);
    setHasSearched(true);
    setSearchParams({ ulpin: ulpinToSearch });

    try {
      const data = await getIntegratedView(ulpinToSearch);
      setIntegratedData(data);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const urlUlpin = searchParams.get('ulpin');
    if (urlUlpin && urlUlpin !== currentUlpin) {
      handleSearch(urlUlpin);
    }
  }, [searchParams]);

  const handleClear = () => {
    setCurrentUlpin('');
    setIntegratedData(null);
    setError(null);
    setHasSearched(false);
    setSearchParams({});
  };

  return (
    <div className="space-y-6">
      {/* Search Bar Section */}
      <SearchBar
        onSearch={handleSearch}
        onClear={handleClear}
        isLoading={isLoading}
        currentUlpin={currentUlpin}
      />

      {/* Results Area */}
      {isLoading && <LoadingState ulpin={currentUlpin} />}

      {!isLoading && error && (
        <ErrorMessage
          error={error}
          ulpin={currentUlpin}
          onRetry={() => handleSearch('KA0102030405')}
        />
      )}

      {!isLoading && integratedData && (
        <OneIntegratedParcelView
          data={integratedData}
          onBackToSearch={handleClear}
        />
      )}

      {/* Initial Welcome State when no search active */}
      {!isLoading && !hasSearched && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <div className="max-w-3xl">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              Unified Cadastral Search Engine
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
              Input a 14-digit Unique Land Parcel Identification Number (ULPIN) to simultaneously aggregate state land revenue titles, registration deeds, property tax assessments, master plan zoning, public utility connections, and spatial boundaries into One Integrated Parcel View.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/80">
                <div className="w-8 h-8 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs mb-2">
                  1
                </div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">Enter ULPIN</h4>
                <p className="text-[11px] text-slate-500">Input the 12-to-14 character cadastral ULPIN.</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/80">
                <div className="w-8 h-8 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs mb-2">
                  2
                </div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">Query Aggregator</h4>
                <p className="text-[11px] text-slate-500">FastAPI aggregates 6 departmental services concurrently.</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/80">
                <div className="w-8 h-8 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs mb-2">
                  3
                </div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">Integrated View</h4>
                <p className="text-[11px] text-slate-500">Inspect Leaflet GIS boundary, titles, satellite, & ledgers.</p>
              </div>
            </div>

            <div className="bg-emerald-50/70 rounded-lg p-4 border border-emerald-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2 text-emerald-900">
                <Database className="h-4 w-4 text-emerald-700 shrink-0" />
                <span>
                  <strong>Primary Demo Parcel:</strong> <code className="bg-emerald-100 px-1.5 py-0.5 rounded font-mono font-bold text-emerald-950">KA0102030405</code> (Ramesh Kumar, Hulimavu, Bangalore Urban)
                </span>
              </div>
              <button
                onClick={() => handleSearch('KA0102030405')}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-medium rounded-md shadow-sm transition shrink-0 flex items-center space-x-1"
              >
                <span>Try Demo Parcel</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
