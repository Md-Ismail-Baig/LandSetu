import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Building2,
  FileCheck,
  LandPlot,
  Users
} from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, demoAccounts, loading } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedPersona, setSelectedPersona] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handlePersonaChange = (e) => {
    const persona = demoAccounts.find((account) => account.username === e.target.value);
    setSelectedPersona(persona?.username || '');
    setUsername(persona?.username || '');
    setPassword(persona?.password || '');
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter your username/email and password.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const loggedUser = await login(username, password);
      // Route based on role
      if (loggedUser.role === 'Citizen') {
        navigate('/dashboard');
      } else if (loggedUser.role === 'Admin') {
        navigate('/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Invalid username or password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLogin = async (demoUser) => {
    setUsername(demoUser.username);
    setPassword(demoUser.password);
    setError(null);
    setSubmitting(true);
    try {
      await login(demoUser.username, demoUser.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background ambient accents */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.08),transparent_50%),radial-gradient(circle_at_70%_70%,rgba(59,130,246,0.08),transparent_50%)] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand Logo & Header */}
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-4 border border-emerald-400/30">
            <LandPlot className="w-8 h-8 text-white stroke-[2.2]" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            LandSetu
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Unified Land Governance & Cadastral Public Infrastructure
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl relative z-10">
        <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/80 shadow-2xl rounded-2xl p-6 sm:p-8">
          {/* Section title */}
          <div className="mb-6 pb-4 border-b border-slate-700/60 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Account Login</h3>
              <p className="text-xs text-slate-400">Sign in to access your land records, reviews, or administrative tools</p>
            </div>
            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Secure Session
            </span>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-200">Authentication Failed</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Explicit role selector for demo personas */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Choose Role
              </label>
              <select
                value={selectedPersona}
                onChange={handlePersonaChange}
                className="block w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              >
                <option value="">Select a demo role</option>
                {demoAccounts.map((account) => (
                  <option key={account.username} value={account.username}>
                    {account.role} - {account.username}
                  </option>
                ))}
              </select>
            </div>

            {/* Username / Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Username or Email
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. citizen, revenue.officer, or name@example.com"
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <span className="text-xs text-slate-400 cursor-pointer hover:text-emerald-400 transition" onClick={() => setPassword('demo123')}>
                  Use default (demo123)
                </span>
              </div>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-10 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 bg-slate-900 border-slate-700 rounded focus:ring-emerald-500 focus:ring-offset-slate-900"
                />
                Keep me signed in
              </label>
              <span className="text-slate-400">Role-based credentials</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || loading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition duration-200 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In to LandSetu
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Demonstration Quick Roles Selector */}
          <div className="mt-8 pt-6 border-t border-slate-700/60">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Quick-Select Persona
              </span>
              <span className="text-[11px] text-slate-400">Click to autofill & sign in</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.username}
                  type="button"
                  onClick={() => handleQuickLogin(acc)}
                  className="text-left p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-700/50 border border-slate-700 hover:border-slate-600 transition flex items-start gap-2.5 group"
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-600 flex items-center justify-center shrink-0 mt-0.5 text-slate-300 group-hover:text-emerald-400 group-hover:border-emerald-500/40 transition">
                    {acc.role === 'Citizen' && <User className="w-3.5 h-3.5" />}
                    {acc.role === 'Revenue Officer' && <LandPlot className="w-3.5 h-3.5" />}
                    {acc.role === 'Registration Officer' && <FileCheck className="w-3.5 h-3.5" />}
                    {acc.role === 'Municipal Officer' && <Building2 className="w-3.5 h-3.5" />}
                    {acc.role === 'Admin' && <Users className="w-3.5 h-3.5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-white">
                      {acc.name}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {acc.role}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Link to Signup */}
          <div className="mt-6 text-center text-xs text-slate-400">
            Don't have a registered account yet?{' '}
            <Link to="/signup" className="text-emerald-400 hover:text-emerald-300 font-medium underline underline-offset-2">
              Register New Account
            </Link>
          </div>
        </div>

        {/* Bottom Data Disclaimer */}
        <p className="mt-6 text-center text-[11px] text-slate-400 max-w-md mx-auto leading-relaxed">
          The information displayed on LandSetu uses fictional data for demonstration purposes and does not represent actual land records or official transactions.
        </p>
      </div>
    </div>
  );
}
