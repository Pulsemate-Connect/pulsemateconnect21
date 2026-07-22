import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getMe } from '../../api/auth.api';
import { searchPatients } from '../../api/reception.api';
import {
  listFollowUps,
  createFollowUp,
  cancelFollowUp,
  getFollowUpSettings,
  getCompletedVisits,
} from '../../api/followup.api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const daysUntil = (date) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(date); due.setHours(0, 0, 0, 0);
  return Math.round((due - today) / 86400000);
};

// ─── Status config ─────────────────────────────────────────────────────────
const STATUS = {
  PENDING:   { label: 'Pending',    cls: 'bg-blue-50 text-blue-700 border-blue-200'    },
  UPCOMING:  { label: 'Due Soon',   cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  DUE:       { label: 'Due Today',  cls: 'bg-red-50 text-red-700 border-red-200'       },
  OVERDUE:   { label: 'Overdue',    cls: 'bg-red-100 text-red-800 border-red-300'      },
  BOOKED:    { label: 'Booked',     cls: 'bg-green-50 text-green-700 border-green-200' },
  COMPLETED: { label: 'Completed',  cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  CANCELLED: { label: 'Cancelled',  cls: 'bg-gray-50 text-gray-500 border-gray-200'   },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS[status] || STATUS.PENDING;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
};

const FILTERS = ['ALL', 'PENDING', 'UPCOMING', 'DUE', 'OVERDUE', 'BOOKED', 'COMPLETED', 'CANCELLED'];

// ─── Create Follow-Up Modal ────────────────────────────────────────────────
function CreateFollowUpModal({ clinic, onClose, onCreated }) {
  const [step, setStep] = useState(1); // 1=search patient, 2=select visit, 3=enter days
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [completedVisits, setCompletedVisits] = useState([]);
  const [loadingVisits, setLoadingVisits] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [settings, setSettings] = useState(null);
  const [followUpDays, setFollowUpDays] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getFollowUpSettings({ clinicId: clinic.id })
      .then(r => setSettings(r.data.data.settings))
      .catch(() => {});
  }, [clinic.id]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await searchPatients(searchQuery.trim(), clinic.id);
        // Only show patients who have completed visits — filter client-side for UX speed
        setSearchResults((r.data.data.patients || []).filter(p => p.appointments?.length > 0));
      } catch { toast.error('Search failed'); }
      finally { setSearching(false); }
    }, 350);
    return () => clearTimeout(t);
  }, [searchQuery, clinic.id]);

  const handleSelectPatient = async (patient) => {
    setSelectedPatient(patient);
    setSearchResults([]);
    setSearchQuery('');
    setStep(2);
    setLoadingVisits(true);
    try {
      const r = await getCompletedVisits({ patientId: patient.id, clinicId: clinic.id });
      setCompletedVisits(r.data.data.visits || []);
    } catch { toast.error('Failed to load visits'); }
    finally { setLoadingVisits(false); }
  };

  const handleSelectVisit = (visit) => {
    setSelectedVisit(visit);
    // Pre-fill default days from settings
    if (settings?.defaultFollowUpDays) setFollowUpDays(String(settings.defaultFollowUpDays));
    setStep(3);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const days = parseInt(followUpDays);
    if (!days || days <= 0) { toast.error('Follow-up days must be a positive number'); return; }
    setSubmitting(true);
    try {
      await createFollowUp({
        clinicId: clinic.id,
        doctorId: selectedVisit.doctorId,
        originalVisitId: selectedVisit.id,
        followUpDays: days,
        note: note.trim() || undefined,
      });
      toast.success(`Follow-up created — due ${fmtDate(new Date(new Date(selectedVisit.appointmentDate).getTime() + days * 86400000))}`);
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create follow-up');
    } finally { setSubmitting(false); }
  };

  // Preset buttons derived from clinic settings
  const presets = settings ? [
    settings.preset7DaysEnabled  && 7,
    settings.preset15DaysEnabled && 15,
    settings.preset30DaysEnabled && 30,
  ].filter(Boolean) : [7, 15, 30];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Create Follow-Up</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Step {step} of 3 — {step === 1 ? 'Find Patient' : step === 2 ? 'Select Visit' : 'Set Days'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Feature disabled warning */}
          {settings && !settings.followUpEnabled && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 font-medium">
              ⚠️ Follow-up feature is currently disabled for this clinic. Contact the clinic admin to enable it.
            </div>
          )}

          {/* STEP 1 — Search */}
          {step === 1 && (
            <div>
              <label className="label">Search patient by name or mobile</label>
              <div className="relative">
                <input className="input w-full pr-10" placeholder="e.g. Rahul or 98765…"
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)} autoFocus />
                {searching && <div className="absolute right-3 top-1/2 -translate-y-1/2"><LoadingSpinner size="sm" /></div>}
              </div>
              {searchResults.length > 0 && (
                <div className="mt-2 border border-gray-200 rounded-xl overflow-hidden">
                  {searchResults.map(p => (
                    <button key={p.id} onClick={() => handleSelectPatient(p)}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-0">
                      <p className="font-semibold text-gray-900">{p.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{p.mobile} · {p.appointments?.length || 0} visit(s) today</p>
                    </button>
                  ))}
                </div>
              )}
              {searchQuery.trim().length >= 2 && !searching && searchResults.length === 0 && (
                <p className="text-sm text-gray-400 mt-2">No patients with completed visits found.</p>
              )}
            </div>
          )}

          {/* STEP 2 — Select visit */}
          {step === 2 && (
            <div>
              <div className="bg-blue-50 rounded-xl p-3 mb-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-blue-800">{selectedPatient?.name}</p>
                  <p className="text-xs text-blue-600">{selectedPatient?.mobile}</p>
                </div>
                <button onClick={() => { setStep(1); setSelectedPatient(null); setCompletedVisits([]); }}
                  className="text-xs text-blue-600 underline">Change</button>
              </div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Select the completed visit:</p>
              {loadingVisits ? <LoadingSpinner /> : completedVisits.length === 0 ? (
                <p className="text-sm text-gray-400">No completed visits found for this patient at this clinic.</p>
              ) : (
                <div className="space-y-2">
                  {completedVisits.map(v => {
                    const hasActiveFollowUp = v.followUpRecords?.length > 0;
                    return (
                      <button key={v.id} onClick={() => !hasActiveFollowUp && handleSelectVisit(v)} disabled={hasActiveFollowUp}
                        className={`w-full text-left border rounded-xl p-3 transition-colors ${
                          hasActiveFollowUp
                            ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                            : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                        }`}>
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">Dr. {v.doctor?.user?.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{fmtDate(v.appointmentDate)}</p>
                            {v.symptoms && <p className="text-xs text-gray-400 italic mt-0.5 truncate max-w-xs">"{v.symptoms}"</p>}
                          </div>
                          {hasActiveFollowUp ? (
                            <span className="text-xs text-amber-600 font-semibold shrink-0">Follow-up exists</span>
                          ) : (
                            <span className="text-xs text-blue-600 font-semibold shrink-0">Select →</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 3 — Set days */}
          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Visit summary */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm space-y-0.5">
                <p className="font-semibold text-green-800">✅ {selectedPatient?.name}</p>
                <p className="text-green-700 text-xs">Dr. {selectedVisit?.doctor?.user?.name} · Visited {fmtDate(selectedVisit?.appointmentDate)}</p>
                <button type="button" onClick={() => setStep(2)} className="text-xs text-green-600 underline mt-1">Change visit</button>
              </div>

              {/* Preset buttons */}
              {presets.length > 0 && (
                <div>
                  <label className="label">Quick presets</label>
                  <div className="flex gap-2 flex-wrap">
                    {presets.map(d => (
                      <button key={d} type="button"
                        onClick={() => setFollowUpDays(String(d))}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-colors ${
                          followUpDays === String(d)
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-gray-200 text-gray-700 hover:border-blue-300'
                        }`}>
                        {d} Days
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Days input */}
              <div>
                <label className="label">Follow-up after (days) *</label>
                <input type="number" min="1" className="input" placeholder="e.g. 15"
                  value={followUpDays} onChange={e => setFollowUpDays(e.target.value)} required />
                {followUpDays && parseInt(followUpDays) > 0 && selectedVisit && (
                  <p className="text-xs text-blue-600 mt-1.5 font-semibold">
                    📅 Follow-up date: {fmtDate(new Date(new Date(selectedVisit.appointmentDate).getTime() + parseInt(followUpDays) * 86400000))}
                  </p>
                )}
              </div>

              {/* Note */}
              <div>
                <label className="label">Note <span className="text-gray-400 font-normal">(optional)</span></label>
                <input className="input" placeholder="e.g. Doctor advised BP check after medication"
                  value={note} onChange={e => setNote(e.target.value)} />
              </div>

              <button type="submit" disabled={submitting || (settings && !settings.followUpEnabled)}
                className="btn-primary w-full py-3 font-semibold">
                {submitting ? <span className="flex items-center justify-center gap-2"><LoadingSpinner size="sm" /> Creating…</span> : '📋 Create Follow-Up'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Cancel Confirm Modal ──────────────────────────────────────────────────
function CancelModal({ followUp, onClose, onCancelled }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    setLoading(true);
    try {
      await cancelFollowUp(followUp.id, { cancellationReason: reason.trim() || undefined });
      toast.success('Follow-up cancelled');
      onCancelled();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Cancel Follow-Up?</h3>
        <p className="text-sm text-gray-600 mb-4">
          This will cancel the follow-up for <strong>{followUp.patient?.name}</strong>. The record will be preserved for audit.
        </p>
        <div className="mb-4">
          <label className="label">Reason <span className="text-gray-400 font-normal">(optional)</span></label>
          <input className="input" placeholder="e.g. Patient requested cancellation"
            value={reason} onChange={e => setReason(e.target.value)} />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">Keep</button>
          <button onClick={handleCancel} disabled={loading}
            className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
            {loading ? 'Cancelling…' : 'Cancel Follow-Up'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
const FollowUpManagement = () => {
  const [clinic, setClinic] = useState(null);
  const [followUps, setFollowUps] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [showCreate, setShowCreate] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const loadClinic = useCallback(async () => {
    const r = await getMe();
    const staffClinics = r.data.data.user?.clinicStaff || [];
    if (staffClinics.length > 0) return staffClinics[0].clinic;
    // CLINIC_OWNER path
    const ownedClinics = r.data.data.user?.ownedClinics || [];
    return ownedClinics[0] || null;
  }, []);

  const loadFollowUps = useCallback(async (clinicId, filter, pageNum) => {
    setLoading(true);
    try {
      const params = { clinicId, page: pageNum, limit: LIMIT };
      if (filter !== 'ALL') params.status = filter;
      const r = await listFollowUps(params);
      setFollowUps(r.data.data.followUps || []);
      setTotal(r.data.data.total || 0);
    } catch { toast.error('Failed to load follow-ups'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadClinic().then(c => {
      if (c) { setClinic(c); loadFollowUps(c.id, 'ALL', 1); }
      else { setLoading(false); }
    }).catch(() => setLoading(false));
  }, [loadClinic, loadFollowUps]);

  const applyFilter = (f) => { setActiveFilter(f); setPage(1); if (clinic) loadFollowUps(clinic.id, f, 1); };
  const changePage = (p) => { setPage(p); if (clinic) loadFollowUps(clinic.id, activeFilter, p); };
  const reload = () => { if (clinic) loadFollowUps(clinic.id, activeFilter, page); };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <DashboardLayout>
      <div className="page-container">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Follow-Up Management</h1>
            <p className="text-sm text-gray-500 mt-0.5">Track and manage patient follow-up recommendations</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary px-5 py-2.5 font-semibold">
            + Create Follow-Up
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-5">
          {FILTERS.map(f => (
            <button key={f} onClick={() => applyFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                activeFilter === f
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
              }`}>
              {f === 'ALL' ? 'All' : STATUS[f]?.label || f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
        ) : followUps.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">📋</div>
            <p className="font-semibold text-gray-600 text-lg">No follow-ups found</p>
            <p className="text-sm mt-1">
              {activeFilter !== 'ALL' ? `No ${STATUS[activeFilter]?.label || activeFilter} follow-ups.` : 'Create the first follow-up using the button above.'}
            </p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="card overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                    <th className="px-4 py-3 text-left font-semibold">Patient</th>
                    <th className="px-4 py-3 text-left font-semibold">Doctor</th>
                    <th className="px-4 py-3 text-left font-semibold">Last Visit</th>
                    <th className="px-4 py-3 text-left font-semibold">Follow-Up Date</th>
                    <th className="px-4 py-3 text-left font-semibold">Days</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-left font-semibold">Added By</th>
                    <th className="px-4 py-3 text-left font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {followUps.map(fu => {
                    const d = daysUntil(fu.followUpDate);
                    const isActive = ['PENDING','UPCOMING','DUE','OVERDUE'].includes(fu.status);
                    return (
                      <tr key={fu.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900">{fu.patient?.name || '—'}</p>
                          <p className="text-xs text-gray-400">{fu.patient?.mobile}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-700">Dr. {fu.doctor?.user?.name || '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{fmtDate(fu.originalVisit?.appointmentDate)}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{fmtDate(fu.followUpDate)}</p>
                          {isActive && (
                            <p className={`text-xs font-semibold mt-0.5 ${d < 0 ? 'text-red-600' : d === 0 ? 'text-red-500' : 'text-blue-500'}`}>
                              {d < 0 ? `${Math.abs(d)}d overdue` : d === 0 ? 'Today' : `In ${d}d`}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-700">{fu.followUpDays} days</td>
                        <td className="px-4 py-3"><StatusBadge status={fu.status} /></td>
                        <td className="px-4 py-3">
                          <p className="text-gray-700">{fu.createdBy?.name || '—'}</p>
                          <p className="text-xs text-gray-400 capitalize">{fu.createdByRole?.toLowerCase()}</p>
                          <p className="text-xs text-gray-300">{fmtDateTime(fu.createdAt)}</p>
                        </td>
                        <td className="px-4 py-3">
                          {isActive && (
                            <button onClick={() => setCancelTarget(fu)}
                              className="text-xs text-red-600 hover:text-red-800 font-semibold underline whitespace-nowrap">
                              Cancel
                            </button>
                          )}
                          {fu.note && (
                            <p className="text-xs text-gray-400 mt-1 max-w-[140px] truncate" title={fu.note}>
                              📝 {fu.note}
                            </p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
                <p>Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}</p>
                <div className="flex gap-2">
                  <button disabled={page === 1} onClick={() => changePage(page - 1)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:border-blue-300">← Prev</button>
                  <button disabled={page === totalPages} onClick={() => changePage(page + 1)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:border-blue-300">Next →</button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Modals */}
        {showCreate && clinic && (
          <CreateFollowUpModal clinic={clinic} onClose={() => setShowCreate(false)} onCreated={reload} />
        )}
        {cancelTarget && (
          <CancelModal followUp={cancelTarget} onClose={() => setCancelTarget(null)} onCancelled={reload} />
        )}
      </div>
    </DashboardLayout>
  );
};

export default FollowUpManagement;
