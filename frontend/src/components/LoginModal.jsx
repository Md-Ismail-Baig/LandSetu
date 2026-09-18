import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Landmark, X, User, Lock, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function LoginModal({ isOpen, onClose }) {
  const { login, switchDemoUser, demoAccounts, loading, error, user: currentUser } = useAuth();
  const [username, setUsername] = useState('revenue.officer');
  const [password, setPassword] = useState('demo123');
  const [formError, setFormError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    try {
      await login(username, password);
      onClose();
    } catch (err) {
      setFormError(err.message || 'Login failed');
    }
  };

  const handleSelectDemo = async (account) => {
    setUsername(account.username);
    setPassword(account.password);
    setFormError(null);
    try {
      await switchDemoUser(account.username);
      onClose();
    } catch (err) {
      setFormError(err.message || 'Failed to switch user account');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700/50 transition"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center space-x-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-950/50">
              <Landmark className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-serif">LandSetu</h3>
              <p className="text-xs text-emerald-400 font-medium">Secure Land Governance Platform</p>
            </div>
          </div>
          <p className="text-xs text-slate-300 mt-2">
            Role-Based Access Control (RBAC). Select a user persona or sign in with credentials.
          </p>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          {/* Persona Selector */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select User Role
              </span>
              <span className="text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                1-Click Access
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {demoAccounts.map((account) => {
                const isActive = currentUser?.username === account.username;
                return (
                  <button
                    key={account.username}
                    type="button"
                    onClick={() => handleSelectDemo(account)}
                    className={`flex items-start justify-between p-3 rounded-xl border text-left transition ${
                      isActive
                        ? 'border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-900">{account.name}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${account.badgeColor}`}>
                          {account.role}
                        </span>
                        {isActive && (
                          <span className="flex items-center text-[10px] text-emerald-700 font-semibold gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{account.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-[11px] font-medium text-slate-400 uppercase">Or Sign In</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Form */}
          {(formError || error) && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{formError || error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Username</label>
              <div className="relative">
                <User className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. revenue.officer"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>

          <p className="text-[10px] text-center text-slate-400">
            Select a role above or sign in with your credentials.
          </p>
        </div>
      </div>
    </div>
  );
}
