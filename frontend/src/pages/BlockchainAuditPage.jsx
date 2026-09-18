import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  Lock,
  Layers,
  CheckCircle,
  AlertTriangle,
  FileText,
  Search,
  ChevronRight,
  X,
  Code,
  Zap,
  Activity,
  UserCheck
} from 'lucide-react';
import {
  getBlockchainTransactions,
  verifyBlockchainChain,
  tamperBlockchainTest,
  repairBlockchainTest,
  getAuditEvents
} from '../services/api';
import LoadingState from '../components/LoadingState';
import ErrorMessage from '../components/ErrorMessage';

export default function BlockchainAuditPage() {
  const [activeTab, setActiveTab] = useState('ledger'); // 'ledger' | 'audit'
  const [transactions, setTransactions] = useState([]);
  const [auditEvents, setAuditEventStream] = useState([]);
  const [verificationResult, setVerificationResult] = useState(null);
  const [selectedTx, setSelectedTx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [tampering, setTampering] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [txRes, verifyRes, auditRes] = await Promise.all([
        getBlockchainTransactions({ limit: 100 }),
        verifyBlockchainChain(),
        getAuditEvents('KA0102030405').catch(() => ({ events: [] }))
      ]);

      setTransactions(txRes?.transactions || []);
      setVerificationResult(verifyRes);
      setAuditEventStream(auditRes?.events || []);
    } catch (err) {
      setError(err.message || 'Failed to load digital ledger data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleVerifyChain = async () => {
    setVerifying(true);
    try {
      const res = await verifyBlockchainChain();
      setVerificationResult(res);
    } catch (err) {
      setError('Verification check failed: ' + err.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleTamperTest = async () => {
    if (transactions.length === 0) return;
    setTampering(true);
    try {
      // Tamper the latest non-genesis transaction
      const targetTx = transactions.find(t => t.action !== 'GENESIS_BLOCK') || transactions[0];
      await tamperBlockchainTest(targetTx.transaction_id);
      await loadData();
    } catch (err) {
      setError('Tamper simulation failed: ' + err.message);
    } finally {
      setTampering(false);
    }
  };

  const handleRepairTest = async () => {
    setRepairing(true);
    try {
      await repairBlockchainTest();
      await loadData();
    } catch (err) {
      setError('Chain repair failed: ' + err.message);
    } finally {
      setRepairing(false);
    }
  };

  const filteredTxs = transactions.filter(t =>
    t.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.ulpin && t.ulpin.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (t.request_id && t.request_id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return <LoadingState message="Connecting to Permissioned Digital Ledger & Audit Stream..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
              <Lock className="w-3.5 h-3.5" />
              Permissioned Digital Ledger Engine
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Blockchain & Centralized Audit Trail
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl">
              Cryptographically secured tamper-evident audit ledger using SHA-256 block hash chaining for all state-changing land administration workflow events.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleVerifyChain}
              disabled={verifying}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-all shadow-md shadow-emerald-900/30 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${verifying ? 'animate-spin' : ''}`} />
              {verifying ? 'Verifying Chain...' : 'Verify Transaction Chain'}
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800 text-xs">
          <div>
            <div className="text-slate-400">Total Blocks</div>
            <div className="text-xl font-bold text-white mt-1">{transactions.length}</div>
          </div>
          <div>
            <div className="text-slate-400">Hashing Algorithm</div>
            <div className="text-xl font-bold text-emerald-400 mt-1">SHA-256</div>
          </div>
          <div>
            <div className="text-slate-400">Latest Block ID</div>
            <div className="text-sm font-mono font-semibold text-slate-200 mt-1 truncate">
              {transactions[0]?.transaction_id || 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-slate-400">Chain Status</div>
            <div className="mt-1">
              {verificationResult?.is_valid ? (
                <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                  <CheckCircle className="w-4 h-4" /> VALID
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-rose-400 font-semibold">
                  <AlertTriangle className="w-4 h-4" /> INVALID
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={loadData} />}

      {/* Verification Status Card */}
      {verificationResult && (
        <div
          className={`rounded-2xl p-6 border shadow-sm transition-all ${
            verificationResult.is_valid
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              : 'bg-rose-50/90 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div
                className={`p-3 rounded-xl ${
                  verificationResult.is_valid ? 'bg-emerald-500 text-white' : 'bg-rose-600 text-white'
                }`}
              >
                {verificationResult.is_valid ? (
                  <ShieldCheck className="w-7 h-7" />
                ) : (
                  <ShieldAlert className="w-7 h-7 animate-bounce" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold">
                  Blockchain Integrity: {verificationResult.is_valid ? 'VALID' : 'INVALID'}
                </h3>
                <p className="text-sm mt-0.5 opacity-90">{verificationResult.details}</p>
                {verificationResult.latest_hash && (
                  <div className="mt-2 text-xs font-mono opacity-80 truncate">
                    Chain Tip Hash: {verificationResult.latest_hash}
                  </div>
                )}
              </div>
            </div>

            {/* Dev Controls */}
            <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-current/10">
              <span className="text-xs font-semibold opacity-75 mr-1">Demo Tamper Controls:</span>
              <button
                onClick={handleTamperTest}
                disabled={tampering}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                title="Simulate data modification to trigger hash mismatch"
              >
                {tampering ? 'Tampering...' : 'Simulate Tamper'}
              </button>
              <button
                onClick={handleRepairTest}
                disabled={repairing}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                title="Recalculate correct SHA-256 hashes to restore chain integrity"
              >
                {repairing ? 'Repairing...' : 'Restore Chain'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('ledger')}
          className={`pb-4 px-4 font-semibold text-sm transition-all border-b-2 ${
            activeTab === 'ledger'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Digital Ledger Blocks ({transactions.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-4 px-4 font-semibold text-sm transition-all border-b-2 ${
            activeTab === 'audit'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Centralized Audit Trail Events ({auditEvents.length})
          </div>
        </button>
      </div>

      {activeTab === 'ledger' ? (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter transactions by ID, ULPIN, Action, or Request ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Tx ID</th>
                    <th className="px-6 py-3.5">Action Event</th>
                    <th className="px-6 py-3.5">ULPIN / Request</th>
                    <th className="px-6 py-3.5">Department / User</th>
                    <th className="px-6 py-3.5">Timestamp</th>
                    <th className="px-6 py-3.5">SHA-256 Hash</th>
                    <th className="px-6 py-3.5 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-xs">
                  {filteredTxs.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-slate-400 font-sans">
                        No digital ledger transactions found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredTxs.map((tx) => (
                      <tr key={tx.transaction_id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-bold text-emerald-700">{tx.transaction_id}</td>
                        <td className="px-6 py-4 font-sans">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 text-xs font-semibold">
                            <Zap className="w-3 h-3 text-emerald-600" />
                            {tx.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-sans text-slate-700">
                          <div>{tx.ulpin || 'N/A'}</div>
                          {tx.request_id && <div className="text-xs text-slate-400 font-mono">{tx.request_id}</div>}
                        </td>
                        <td className="px-6 py-4 font-sans">
                          <span className="font-semibold text-slate-800">{tx.department}</span>
                          <div className="text-xs text-slate-500">{tx.username} ({tx.role})</div>
                        </td>
                        <td className="px-6 py-4 font-sans text-slate-500 text-xs">
                          {new Date(tx.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-slate-400 max-w-xs truncate" title={tx.transaction_hash}>
                          {tx.transaction_hash.slice(0, 16)}...
                        </td>
                        <td className="px-6 py-4 text-right font-sans">
                          <button
                            onClick={() => setSelectedTx(tx)}
                            className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-semibold text-xs hover:underline"
                          >
                            View Block <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Audit Events Stream */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600" />
            Centralized Audit Event Stream
          </h3>
          <p className="text-xs text-slate-500">
            Immutable log of state changes, user authentications, and officer review decisions.
          </p>

          <div className="space-y-3 mt-4">
            {auditEvents.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">No audit events recorded yet.</div>
            ) : (
              auditEvents.map((evt) => (
                <div key={evt.event_id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{evt.action}</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-semibold">
                        {evt.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{evt.remarks}</p>
                    <div className="text-xs text-slate-400 font-mono">
                      User: {evt.username} ({evt.role}) {evt.ulpin ? `| ULPIN: ${evt.ulpin}` : ''}
                    </div>
                  </div>
                  <div className="text-xs font-mono text-slate-400 whitespace-nowrap">
                    {new Date(evt.timestamp).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Block Details Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
                  <Code className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Digital Ledger Block Details</h3>
                  <p className="text-xs font-mono text-emerald-600">{selectedTx.transaction_id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100">
                <div>
                  <span className="text-slate-400 uppercase tracking-wider block text-[10px]">Action Event</span>
                  <span className="text-slate-800 font-bold text-sm">{selectedTx.action}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase tracking-wider block text-[10px]">Department & User</span>
                  <span className="text-slate-700">{selectedTx.department} | {selectedTx.username} ({selectedTx.role})</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase tracking-wider block text-[10px]">Associated ULPIN / Request</span>
                  <span className="text-slate-700">{selectedTx.ulpin || 'N/A'} {selectedTx.request_id ? `(${selectedTx.request_id})` : ''}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase tracking-wider block text-[10px]">Timestamp</span>
                  <span className="text-slate-700">{selectedTx.timestamp}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-slate-500 font-sans font-bold text-xs">Previous SHA-256 Block Hash Pointer</label>
                <div className="p-3 bg-slate-900 text-emerald-400 rounded-xl break-all">
                  {selectedTx.previous_hash}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-slate-500 font-sans font-bold text-xs">Current Block SHA-256 Hash</label>
                <div className="p-3 bg-slate-900 text-emerald-400 rounded-xl break-all font-bold">
                  {selectedTx.transaction_hash}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-slate-500 font-sans font-bold text-xs">Canonical Block Metadata (JSON)</label>
                <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl overflow-x-auto text-[11px]">
                  {selectedTx.metadata_json}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedTx(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
