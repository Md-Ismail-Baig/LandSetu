import React, { useState, useEffect } from 'react';
import { getAuditEvents } from '../services/api';
import { ShieldCheck, History, Clock, User, Shield, FileText, CheckCircle2, RefreshCw } from 'lucide-react';

export default function AuditView({ ulpin, refreshTrigger }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAudit = async () => {
    if (!ulpin) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getAuditEvents(ulpin);
      setEvents(res.events || []);
    } catch (err) {
      setError('Unable to retrieve parcel audit events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudit();
  }, [ulpin, refreshTrigger]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-md bg-emerald-100 text-emerald-800">
            <History className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Parcel Governance Audit Trail</h3>
            <p className="text-[11px] text-slate-500">
              Chronological immutable event ledger for ULPIN <code className="font-mono text-emerald-800 font-semibold">{ulpin}</code>
            </p>
          </div>
        </div>

        <button
          onClick={fetchAudit}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition"
          title="Refresh Audit Trail"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Events List / Table */}
      <div className="p-4 sm:p-5">
        {loading && events.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center space-x-2">
            <div className="h-4 w-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading audit log entries...</span>
          </div>
        ) : events.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            <History className="h-8 w-8 text-slate-300 mx-auto mb-2 opacity-50" />
            <p>No audit events recorded yet for this parcel.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Initiating or approving verification will generate tamper-evident audit logs.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] text-slate-500 uppercase font-bold tracking-wider bg-slate-50/70">
                  <th className="py-2.5 px-3">Event ID</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Actor / Role</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {events.map((evt) => {
                  const isApproved = evt.status === 'APPROVED';
                  const isRejected = evt.status === 'REJECTED';
                  const isPending = evt.status === 'PENDING' || evt.status === 'SUBMITTED';

                  return (
                    <tr key={evt.event_id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                        {evt.event_id}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                        {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        <span className="text-slate-400 ml-1 block text-[10px]">
                          {new Date(evt.timestamp).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="text-slate-900 font-bold">{evt.username}</div>
                        <span className="text-[10px] text-slate-500 block">{evt.role}</span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {evt.action.replace(/_/g, ' ')}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          isApproved
                            ? 'bg-emerald-100 text-emerald-800'
                            : isRejected
                            ? 'bg-red-100 text-red-800'
                            : isPending
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {evt.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate" title={evt.remarks}>
                        {evt.remarks || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-emerald-600" />
            <span>Digital Audit Engine</span>
          </span>
          <span>Immutable event logging active</span>
        </div>
      </div>
    </div>
  );
}
