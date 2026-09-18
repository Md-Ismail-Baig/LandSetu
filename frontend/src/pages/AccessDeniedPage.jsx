import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldOff, ArrowLeft, User, Lock } from 'lucide-react';

export default function AccessDeniedPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(239,68,68,0.06),transparent_60%)] pointer-events-none" />

      <div className="relative z-10 text-center max-w-lg">
        {/* Icon */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-6 shadow-lg shadow-rose-500/10">
          <ShieldOff className="w-10 h-10 text-rose-400" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
          Access Denied
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed mb-6">
          You do not have the required permissions to access this resource.
          This area is restricted based on your current role assignment.
        </p>

        {/* Role Info Card */}
        {user && (
          <div className="mx-auto max-w-sm bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 mb-6 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-700 border border-slate-600 flex items-center justify-center">
                <User className="w-5 h-5 text-slate-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{user.name || user.username}</p>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Role: <span className="text-slate-300 font-medium">{user.role}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-emerald-600/20 transition flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go to Dashboard
          </button>
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium rounded-xl text-sm transition"
          >
            Go Back
          </button>
        </div>

        {/* Disclaimer */}
        <p className="mt-8 text-[11px] text-slate-500 max-w-sm mx-auto">
          If you believe this is an error, please contact your system administrator
          or log in with an authorized account.
        </p>
      </div>
    </div>
  );
}
