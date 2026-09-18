import React, { useState } from 'react';
import { Search, X, Sparkles, AlertCircle } from 'lucide-react';

const DEMO_ULPINS = [
  { ulpin: 'KA0102030405', label: 'KA0102030405 (Primary Demo — Bangalore)', primary: true },
  { ulpin: 'KA0203040506', label: 'KA0203040506 (Mysore Residential)' },
  { ulpin: 'KA0304050607', label: 'KA0304050607 (Hubli Commercial)' },
  { ulpin: 'KA0405060708', label: 'KA0405060708 (Mangalore Agri)' },
  { ulpin: 'KA0506070809', label: 'KA0506070809 (Belgaum Dispute)' },
];

export default function SearchBar({ onSearch, onClear, isLoading, currentUlpin }) {
  const [inputVal, setInputVal] = useState(currentUlpin || '');
  const [validationError, setValidationError] = useState('');

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const cleanVal = inputVal.trim().toUpperCase();

    if (!cleanVal) {
      setValidationError('Please enter a valid ULPIN (e.g. KA0102030405).');
      return;
    }

    setValidationError('');
    onSearch(cleanVal);
  };

  const handleChipClick = (ulpin) => {
    setInputVal(ulpin);
    setValidationError('');
    onSearch(ulpin);
  };

  const handleReset = () => {
    setInputVal('');
    setValidationError('');
    onClear();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 sm:p-6 mb-6">
      <div className="max-w-3xl">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Search className="h-5 w-5 text-emerald-600" />
          Integrated Land Parcel Search
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-4">
          Search a land parcel using its Unique Land Parcel Identification Number (ULPIN) to view integrated spatial and governance attributes.
        </p>

        <form onSubmit={handleFormSubmit} className="space-y-3">
          <div className="relative flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => {
                  setInputVal(e.target.value);
                  if (validationError) setValidationError('');
                }}
                placeholder="Enter ULPIN, e.g. KA0102030405"
                disabled={isLoading}
                className={`w-full uppercase font-mono px-4 py-3 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 transition ${
                  validationError
                    ? 'border-red-400 focus:ring-red-400/30 bg-red-50/30'
                    : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20 bg-slate-50/50 focus:bg-white'
                }`}
              />
              {inputVal && !isLoading && (
                <button
                  type="button"
                  onClick={() => setInputVal('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full"
                  title="Clear input"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 sm:flex-none px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-medium text-sm rounded-lg shadow-sm transition flex items-center justify-center space-x-2 min-w-[130px]"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    <span>Search ULPIN</span>
                  </>
                )}
              </button>

              {currentUlpin && (
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isLoading}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition"
                  title="Reset search"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {validationError && (
            <div className="flex items-center space-x-1.5 text-xs text-red-600 font-medium pt-1">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}
        </form>

        {/* Demo Quick Chips */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Sample ULPINs:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {DEMO_ULPINS.map((item) => (
              <button
                key={item.ulpin}
                type="button"
                onClick={() => handleChipClick(item.ulpin)}
                disabled={isLoading}
                className={`text-xs px-2.5 py-1 rounded-md font-mono transition border ${
                  item.primary
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 font-semibold'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                {item.ulpin}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
