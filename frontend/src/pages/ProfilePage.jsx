import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  User,
  ShieldCheck,
  Mail,
  Phone,
  Building,
  Calendar,
  CheckCircle2,
  KeyRound,
  FileText,
  LandPlot,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function ProfilePage() {
  const { user, isCitizen, isOfficer, isAdmin, isRevenueOfficer, isRegistrationOfficer, isMunicipalOfficer } = useAuth();

  if (!user) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-400">Please sign in to view your profile.</p>
        <Link to="/login" className="mt-4 inline-block px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium">
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Profile Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-800 via-slate-800 to-slate-900 border border-slate-700/80 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 border-2 border-emerald-400/40 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-emerald-600/20">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white tracking-tight">{user.name}</h1>
                <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {user.status || 'ACTIVE'}
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
                <span>@{user.username}</span>
                <span>•</span>
                <span className="text-slate-300 font-medium">{user.role}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white rounded-xl text-sm font-medium transition flex items-center gap-1.5"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Profile Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact & Affiliation Info */}
        <div className="md:col-span-2 bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-md space-y-6">
          <h2 className="text-base font-semibold text-white flex items-center gap-2 border-b border-slate-700/60 pb-3">
            <User className="w-4 h-4 text-emerald-400" />
            Account Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/50">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Full Name
              </span>
              <p className="text-sm font-medium text-white">{user.name}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/50">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Username / Identifier
              </span>
              <p className="text-sm font-medium text-white font-mono">{user.username}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/50">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> Email Address
              </span>
              <p className="text-sm font-medium text-white">{user.email || 'Not configured'}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/50">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" /> Mobile Number
              </span>
              <p className="text-sm font-medium text-white">{user.mobile || '+91 98765 00000'}</p>
            </div>

            <div className="sm:col-span-2 p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/50">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                <Building className="w-3.5 h-3.5" /> Department / Jurisdiction
              </span>
              <p className="text-sm font-medium text-white">{user.department || 'Public Sector'}</p>
            </div>
          </div>
        </div>

        {/* Role & Access Privileges */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-md space-y-6">
          <h2 className="text-base font-semibold text-white flex items-center gap-2 border-b border-slate-700/60 pb-3">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            Access Privileges
          </h2>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/50 flex items-center justify-between">
              <span className="text-xs text-slate-300">Role Classification</span>
              <span className="text-xs font-semibold text-emerald-400">{user.role}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/50 flex items-center justify-between">
              <span className="text-xs text-slate-300">Parcel Search</span>
              <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Enabled
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/50 flex items-center justify-between">
              <span className="text-xs text-slate-300">Service Request Submission</span>
              <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Enabled
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/50 flex items-center justify-between">
              <span className="text-xs text-slate-300">Verification Review Authority</span>
              <span className={`text-xs font-medium ${isRevenueOfficer || isAdmin ? 'text-emerald-400' : 'text-slate-500'}`}>
                {isRevenueOfficer || isAdmin ? 'Authorized' : 'Restricted'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/50 flex items-center justify-between">
              <span className="text-xs text-slate-300">Administrative Oversight</span>
              <span className={`text-xs font-medium ${isAdmin ? 'text-emerald-400' : 'text-slate-500'}`}>
                {isAdmin ? 'Full Admin' : 'None'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
