import React, { useState, useEffect } from 'react';
import { getAdminUsers, getAdminSystemStats } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  ShieldCheck,
  Building,
  Mail,
  Phone,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  LandPlot,
  FileCheck,
  Layers,
  Filter
} from 'lucide-react';
import LoadingState from '../components/LoadingState';
import ErrorMessage from '../components/ErrorMessage';

export default function AdminUsersPage() {
  const { user, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [usersData, statsData] = await Promise.all([
          getAdminUsers(),
          getAdminSystemStats(),
        ]);
        setUsers(usersData?.users || []);
        setStats(statsData || null);
      } catch (err) {
        setError(err.message || 'Failed to fetch administrative records. Please ensure you are logged in as Admin.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (!isAdmin) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center bg-slate-800 border border-slate-700 rounded-2xl">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white">Administrative Access Restricted</h2>
        <p className="text-sm text-slate-400 mt-2">
          This portal is reserved strictly for platform administrators. Your role ({user?.role}) does not have administrative privileges.
        </p>
      </div>
    );
  }

  if (loading) return <LoadingState message="Loading administrative user directory..." />;
  if (error) return <ErrorMessage message={error} />;

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole =
      roleFilter === 'ALL' ||
      (roleFilter === 'Citizen' && u.role === 'Citizen') ||
      (roleFilter === 'Officers' && u.role.includes('Officer')) ||
      (roleFilter === 'Admin' && u.role === 'Admin');

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-amber-400" />
            User Management & Administrative Directory
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Oversee registered platform accounts, departmental assignments, and role-based permissions
          </p>
        </div>
        <span className="self-start sm:self-auto px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-full text-xs font-semibold flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          Admin Access Enforced
        </span>
      </div>

      {/* System Statistics Summary */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Users</span>
            <p className="text-2xl font-bold text-white mt-1">{stats.total_users}</p>
          </div>
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Registered Citizens</span>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.total_citizens}</p>
          </div>
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Departmental Officers</span>
            <p className="text-2xl font-bold text-blue-400 mt-1">{stats.total_officers}</p>
          </div>
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Parcels</span>
            <p className="text-2xl font-bold text-amber-400 mt-1">{stats.total_parcels}</p>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, username, email..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <div className="flex rounded-xl bg-slate-900/80 p-1 border border-slate-700 text-xs">
            {['ALL', 'Citizen', 'Officers', 'Admin'].map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  roleFilter === role ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700/80">
              <tr>
                <th className="px-5 py-3.5">User</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Department</th>
                <th className="px-5 py-3.5">Contact</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-8 text-center text-slate-500">
                    No users matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.username} className="hover:bg-slate-750/50 transition">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                          {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{u.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          u.role === 'Admin'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : u.role === 'Citizen'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 max-w-[200px] truncate text-slate-300">
                      {u.department || 'Public Citizen'}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="space-y-0.5">
                        <p className="text-[11px] text-slate-300">{u.email || '—'}</p>
                        <p className="text-[10px] text-slate-400">{u.mobile || '—'}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" />
                        {u.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-[11px]">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Active'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
