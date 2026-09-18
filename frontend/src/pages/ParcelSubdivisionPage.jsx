import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Grid,
  PlusCircle,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
  ChevronRight,
  Layers,
  MapPin,
  X
} from 'lucide-react';
import { getSubdivisions, createSubdivision } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingState from '../components/LoadingState';
import ErrorMessage from '../components/ErrorMessage';

export default function ParcelSubdivisionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [subdivisions, setSubdivisions] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    parent_ulpin: 'KA0102030405',
    num_children: 2,
    reason: 'Family partitioning and inheritance division of agricultural holding.',
    child1_owner: 'Ramesh Gowda (Child 01)',
    child1_acres: '2.5',
    child2_owner: 'Suresh Gowda (Child 02)',
    child2_acres: '2.5',
    child3_owner: 'Priya Gowda (Child 03)',
    child3_acres: '1.0',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getSubdivisions({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });
      setSubdivisions(res?.subdivisions || []);
      setSummary(res?.summary || {});
    } catch (err) {
      setError(err.message || 'Failed to load parcel subdivision applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const proposed = [
        { owner_name: formData.child1_owner, area_acres: parseFloat(formData.child1_acres) || 1.0 },
        { owner_name: formData.child2_owner, area_acres: parseFloat(formData.child2_acres) || 1.0 },
      ];

      if (formData.num_children === 3) {
        proposed.push({ owner_name: formData.child3_owner, area_acres: parseFloat(formData.child3_acres) || 1.0 });
      }

      const payload = {
        parent_ulpin: formData.parent_ulpin,
        num_children: formData.num_children,
        proposed_children: proposed,
        reason: formData.reason,
      };

      const newRecord = await createSubdivision(payload);
      setShowCreateModal(false);
      navigate(`/parcel-subdivision/${newRecord.subdivision_id}`);
    } catch (err) {
      setFormError(err.message || 'Failed to submit subdivision application.');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = subdivisions.filter(s =>
    s.subdivision_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.parent_ulpin.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.applicant.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && subdivisions.length === 0) {
    return <LoadingState message="Loading parcel subdivision applications..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
            <Grid className="w-3.5 h-3.5" />
            Cadastral Parcel Subdivision Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Parcel Subdivision & Split Workflow
          </h1>
          <p className="text-slate-400 text-sm max-w-2xl">
            10-Point deterministic boundary & area validation engine, polygon geometry generation, child ULPIN creation, and parent-child lineage tracking.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-900/30"
        >
          <PlusCircle className="w-4 h-4" />
          Apply for Subdivision
        </button>
      </div>

      {error && <ErrorMessage message={error} onRetry={loadData} />}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Total Applications</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{summary.total || subdivisions.length}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-amber-600 font-medium">Submitted / Under Review</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {(summary.submitted || 0) + (summary.under_review || 0)}
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-emerald-600 font-medium">Approved & Child Parcels Active</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{summary.approved || 0}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-rose-600 font-medium">Rejected / Area Mismatch</div>
          <div className="text-2xl font-bold text-rose-600 mt-1">{summary.rejected || 0}</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {['ALL', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Subdivision ID, Parent ULPIN, Applicant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Applications List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500 space-y-3">
            <Grid className="w-10 h-10 mx-auto text-slate-300" />
            <div className="font-semibold text-base">No parcel subdivision applications found</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              There are no subdivision records matching your filter. Use the button above to initiate a new cadastral split.
            </p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.subdivision_id}
              onClick={() => navigate(`/parcel-subdivision/${item.subdivision_id}`)}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-4 hover:border-emerald-300 group"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-slate-900 group-hover:text-emerald-600 transition-colors">
                    {item.subdivision_id}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800">
                    Parent: {item.parent_ulpin}
                  </span>
                </div>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    item.status === 'APPROVED' || item.status === 'COMPLETED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : item.status === 'REJECTED'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {item.status}
                </span>
              </div>

              {/* Proposed Child Split Info */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-500 font-semibold">
                  <span>Proposed Child Parcels ({item.num_children} Parcels)</span>
                  <span>Reason: {item.reason || 'Family Split'}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  {(item.proposed_children || []).map((ch, idx) => (
                    <div key={idx} className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                      <div className="font-mono font-bold text-emerald-700">{item.parent_ulpin}-0{idx+1}</div>
                      <div className="text-[11px] font-semibold text-slate-800 truncate">{ch.owner_name}</div>
                      <div className="text-[10px] text-slate-400">{ch.area_acres} Acres</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 text-xs border-t border-slate-100">
                <span className="text-slate-400">
                  Applicant: <span className="font-semibold text-slate-700">{item.applicant}</span>
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 group-hover:translate-x-1 transition-transform">
                  Review 10-Point Matrix <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Application Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
                  <Grid className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Initiate Parcel Subdivision</h3>
                  <p className="text-xs text-slate-500">Specify parent parcel and proposed child parcel boundaries</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Parent Parcel ULPIN</label>
                <input
                  type="text"
                  required
                  value={formData.parent_ulpin}
                  onChange={(e) => setFormData({ ...formData, parent_ulpin: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="e.g. KA0102030405"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Number of Child Parcels</label>
                <select
                  value={formData.num_children}
                  onChange={(e) => setFormData({ ...formData, num_children: parseInt(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value={2}>2 Child Parcels (2-way split)</option>
                  <option value={3}>3 Child Parcels (3-way split)</option>
                </select>
              </div>

              {/* Child 1 */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800">Child Parcel 01 ({formData.parent_ulpin}-01)</div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Owner Name"
                    value={formData.child1_owner}
                    onChange={(e) => setFormData({ ...formData, child1_owner: e.target.value })}
                    className="px-3 py-2 rounded-lg border border-slate-200 text-xs"
                  />
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Area (Acres)"
                    value={formData.child1_acres}
                    onChange={(e) => setFormData({ ...formData, child1_acres: e.target.value })}
                    className="px-3 py-2 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
              </div>

              {/* Child 2 */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800">Child Parcel 02 ({formData.parent_ulpin}-02)</div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Owner Name"
                    value={formData.child2_owner}
                    onChange={(e) => setFormData({ ...formData, child2_owner: e.target.value })}
                    className="px-3 py-2 rounded-lg border border-slate-200 text-xs"
                  />
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Area (Acres)"
                    value={formData.child2_acres}
                    onChange={(e) => setFormData({ ...formData, child2_acres: e.target.value })}
                    className="px-3 py-2 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
              </div>

              {/* Child 3 */}
              {formData.num_children === 3 && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-800">Child Parcel 03 ({formData.parent_ulpin}-03)</div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Owner Name"
                      value={formData.child3_owner}
                      onChange={(e) => setFormData({ ...formData, child3_owner: e.target.value })}
                      className="px-3 py-2 rounded-lg border border-slate-200 text-xs"
                    />
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="Area (Acres)"
                      value={formData.child3_acres}
                      onChange={(e) => setFormData({ ...formData, child3_acres: e.target.value })}
                      className="px-3 py-2 rounded-lg border border-slate-200 text-xs"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Subdivision</label>
                <textarea
                  rows="2"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Submitting Application...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
