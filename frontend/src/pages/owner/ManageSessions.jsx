import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  getMyClinics,
  getClinicSessions,
  createClinicSession,
  updateClinicSession,
  deleteClinicSession,
} from '../../api/clinic.api';

const SESSION_PRESETS = [
  { name: 'Morning Session',   start: '08:00', end: '12:00' },
  { name: 'Afternoon Session', start: '12:00', end: '16:00' },
  { name: 'Evening Session',   start: '16:00', end: '21:00' },
];

const fmt12 = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hr}:${String(m).padStart(2, '0')} ${ampm}`;
};

const EMPTY_FORM = { sessionName: '', startTime: '08:00', endTime: '12:00', maxAppointments: 20, isActive: true };

const ManageSessions = () => {
  const navigate = useNavigate();
  const [clinic, setClinic]         = useState(null);
  const [sessions, setSessions]     = useState([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [saving, setSaving]         = useState(false);
  const [editId, setEditId]         = useState(null);  // null = add new
  const [form, setForm]             = useState(EMPTY_FORM);
  const [showForm, setShowForm]     = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getMyClinics();
        const c = res.data.data.clinics?.[0];
        if (!c) { toast.error('No clinic found'); navigate('/clinic/dashboard'); return; }
        setClinic(c);
        const sRes = await getClinicSessions(c.id);
        setSessions(sRes.data.data.sessions || []);
      } catch { toast.error('Failed to load sessions'); }
      finally { setIsLoading(false); }
    };
    load();
  }, [navigate]);

  const openAdd = (preset = null) => {
    setEditId(null);
    setForm(preset
      ? { sessionName: preset.name, startTime: preset.start, endTime: preset.end, maxAppointments: 20, isActive: true }
      : EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (s) => {
    setEditId(s.id);
    setForm({ sessionName: s.sessionName, startTime: s.startTime, endTime: s.endTime, maxAppointments: s.maxAppointments ?? 20, isActive: s.isActive });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.sessionName.trim()) { toast.error('Session name is required'); return; }
    setSaving(true);
    try {
      if (editId) {
        const res = await updateClinicSession(editId, form);
        setSessions((prev) => prev.map((s) => s.id === editId ? res.data.data.session : s));
        toast.success('Session updated');
      } else {
        const res = await createClinicSession(clinic.id, form);
        setSessions((prev) => [...prev, res.data.data.session]);
        toast.success('Session created');
      }
      setShowForm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save session');
    } finally { setSaving(false); }
  };

  const handleToggle = async (s) => {
    try {
      const res = await updateClinicSession(s.id, { isActive: !s.isActive });
      setSessions((prev) => prev.map((x) => x.id === s.id ? res.data.data.session : x));
      toast.success(s.isActive ? 'Session disabled' : 'Session enabled');
    } catch { toast.error('Failed to update'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this session? Patients won\'t see it.')) return;
    setDeletingId(id);
    try {
      await deleteClinicSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      toast.success('Session deleted');
    } catch { toast.error('Failed to delete session'); }
    finally { setDeletingId(null); }
  };

  if (isLoading) return <DashboardLayout><div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="page-container max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Session Management</h1>
            <p className="text-sm text-gray-500 mt-0.5">{clinic?.name} · Configure booking sessions patients see</p>
          </div>
          <button onClick={() => openAdd()} className="btn-primary px-5">+ Add Session</button>
        </div>

        {/* Preset quick-add */}
        {sessions.length === 0 && (
          <div className="mb-6 bg-blue-50 border border-blue-100 rounded-2xl p-5">
            <p className="text-sm font-semibold text-blue-800 mb-3">Quick start — add common sessions:</p>
            <div className="flex flex-wrap gap-2">
              {SESSION_PRESETS.map((p) => (
                <button key={p.name} onClick={() => openAdd(p)}
                  className="text-sm px-4 py-2 rounded-xl border border-blue-200 bg-white text-blue-700 font-medium hover:bg-blue-100 transition">
                  + {p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Session list */}
        {sessions.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">🕐</div>
            <p className="text-base font-semibold">No sessions configured yet</p>
            <p className="text-sm mt-1">Add sessions so patients can book appointments at your clinic.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => (
              <div key={s.id} className={`bg-white rounded-2xl border px-5 py-4 flex items-center justify-between gap-4 shadow-sm transition ${s.isActive ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${s.isActive ? 'bg-blue-50' : 'bg-gray-100'}`}>
                    {s.sessionName.toLowerCase().includes('morning') ? '🌅'
                      : s.sessionName.toLowerCase().includes('evening') ? '🌙'
                      : s.sessionName.toLowerCase().includes('afternoon') ? '☀️' : '🕐'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{s.sessionName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{fmt12(s.startTime)} – {fmt12(s.endTime)} · Max {s.maxAppointments ?? 20} patients</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {s.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <button onClick={() => handleToggle(s)} className="text-xs text-gray-500 hover:text-gray-800 px-2 py-1 rounded-lg hover:bg-gray-100 transition">
                    {s.isActive ? 'Disable' : 'Enable'}
                  </button>
                  <button onClick={() => openEdit(s)} className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded-lg hover:bg-blue-50 transition">Edit</button>
                  <button onClick={() => handleDelete(s.id)} disabled={deletingId === s.id} className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50 transition disabled:opacity-40">
                    {deletingId === s.id ? '...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowForm(false)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-bold text-gray-900 mb-5">{editId ? 'Edit Session' : 'Add Session'}</h2>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="label">Session Name *</label>
                  <input className="input" value={form.sessionName} onChange={(e) => setForm({ ...form, sessionName: e.target.value })}
                    placeholder="e.g. Morning Session" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Start Time *</label>
                    <input type="time" className="input" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required /></div>
                  <div><label className="label">End Time *</label>
                    <input type="time" className="input" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} required /></div>
                </div>
                <div>
                  <label className="label">Max Appointments (optional)</label>
                  <input type="number" className="input" min={1} max={200} value={form.maxAppointments}
                    onChange={(e) => setForm({ ...form, maxAppointments: parseInt(e.target.value) || 20 })} />
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 rounded" />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active (visible to patients)</label>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">Cancel</button>
                  <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                    {saving ? 'Saving...' : editId ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ManageSessions;
