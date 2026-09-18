import React from 'react';
import { AlertCircle, ServerCrash, SearchX, RefreshCw } from 'lucide-react';

export default function ErrorMessage({ error, onRetry, ulpin }) {
  const isNotFound = error?.isNotFound || error?.status === 404;
  const isNetwork = error?.isNetworkError;

  return (
    <div className={`rounded-xl shadow-sm border p-6 mb-8 ${
      isNotFound 
        ? 'bg-amber-50/70 border-amber-200 text-amber-900' 
        : 'bg-red-50/70 border-red-200 text-red-900'
    }`}>
      <div className="flex items-start space-x-4">
        <div className={`p-3 rounded-lg shrink-0 ${
          isNotFound ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
        }`}>
          {isNotFound ? (
            <SearchX className="h-6 w-6" />
          ) : isNetwork ? (
            <ServerCrash className="h-6 w-6" />
          ) : (
            <AlertCircle className="h-6 w-6" />
          )}
        </div>

        <div className="flex-1">
          <h4 className="text-base font-bold tracking-tight">
            {isNotFound
              ? 'Parcel Not Found'
              : isNetwork
              ? 'Backend Connection Failed'
              : 'Error Fetching Parcel Information'}
          </h4>

          <p className="text-xs sm:text-sm mt-1 opacity-90 leading-relaxed">
            {isNotFound
              ? `No registered land parcel record could be found matching ULPIN "${ulpin}". Please double-check the 12-character ULPIN code and try again.`
              : error?.message || 'An unexpected error occurred while communicating with the server.'}
          </p>

          {isNotFound && (
            <div className="mt-3 bg-white/80 rounded-lg p-3 border border-amber-200/80 text-xs">
              <span className="font-semibold text-amber-950 block mb-1">Suggested Actions:</span>
              <ul className="list-disc list-inside space-y-0.5 text-amber-900/90">
                <li>Try searching the primary demo ULPIN: <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">KA0102030405</code></li>
                <li>Verify you have not entered spaces or special symbols.</li>
              </ul>
            </div>
          )}

          {isNetwork && (
            <div className="mt-3 bg-white/80 rounded-lg p-3 border border-red-200/80 text-xs text-red-950">
              <span className="font-semibold block mb-1">Troubleshooting Checklist:</span>
              <ul className="list-disc list-inside space-y-0.5 text-red-900/90">
                <li>Verify FastAPI server is running: <code className="bg-red-100 px-1 py-0.5 rounded font-mono">venv\Scripts\python.exe main.py</code></li>
                <li>Check backend health at: <a href="http://localhost:8000/api/health" target="_blank" rel="noreferrer" className="underline font-mono">http://localhost:8000/api/health</a></li>
              </ul>
            </div>
          )}

          {onRetry && (
            <div className="mt-4">
              <button
                onClick={onRetry}
                className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition ${
                  isNotFound
                    ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm'
                    : 'bg-red-600 hover:bg-red-700 text-white shadow-sm'
                }`}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Try Demo ULPIN KA0102030405</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
