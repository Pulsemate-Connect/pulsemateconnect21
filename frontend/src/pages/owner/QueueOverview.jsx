import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getMyClinics, getStaff } from '../../api/clinic.api';
import { getQueue, getSessionQueueStats } from '../../api/reception.api';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import ClinicNotVerifiedGuard from '../../components/ui/ClinicNotVerifiedGuard';
import useSocket from '../../hooks/useSocket';
import toast from 'react-hot-toast';

// ── Session icons ─────────────────────────────────────────────────────────────
const SESSION_ICON = { MORNING: '🌅', AFTERNOON: '☀️', EVENING: '🌙' };

// ── Session Stats Card (Req #13) ──────────────────────────────────────────────
const SessionStatsCard = ({ sess }) => {
  const { sessionName, sessionType, startTime, endTime, stats, liveQueue } = sess;
  const icon = SESSION_ICON[sessionType] || '🕐';
  const pct = stats.utilizationPct || 0;
  const barColor = pct >= 90 ? '#EF4444' : pct >= 70 ? '#F59E0B' : '#10B981';

  const fmt12 = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    return `${h > 12 ? h - 12 : h || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{icon}</span>
          <div>
            <p className="font-bold text-gray-900 text-sm">{sessionName}</p>
            <p className="text-xs text-gray-400">{fmt12(startTime)} – {fmt12(endTime)}</p>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
          liveQueue.status === 'ACTIVE' ? 'bg-green-50 text-green-700' :
          liveQueue.status === 'PAUSED' ? 'bg-amber-50 text-amber-700' :
          'bg-gray-50 text-gray-400'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${
            liveQueue.status === 'ACTIVE' ? 'bg-green-500 animate-pulse' :
            liveQueue.status === 'PAUSED' ? 'bg-amber-500' : 'bg-gray-300'
          }`} />
          {liveQueue.status === 'ACTIVE' ? 'Live' : liveQueue.status === 'PAUSED' ? 'Paused' : 'Not Started'}
        </div>
      </div>

      {/* Live queue token */}
      {liveQueue.currentToken && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 mb-4 flex items-center justify-between">
          <span className="text-xs font-semibold text-blue-600">Now Serving</span>
          <span className="text-lg font-black text-blue-700">#{liveQueue.currentToken}</span>
          <span className="text-xs text-blue-500">{liveQueue.totalWaiting} waiting</span>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: 'Booked',    value: stats.booked,    color: 'text-blue-600',   bg: 'bg-blue-50'   },
          { label: 'Done',      value: stats.completed, color: 'text-green-600',  bg: 'bg-green-50'  },
          { label: 'Walk-ins',  value: stats.walkIns,   color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Avg Wait',  value: stats.avgWaitMins ? `${stats.avgWaitMins}m` : '—', color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-2 text-center`}>
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Utilization bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-400">Session Utilization</span>
          <span className="text-xs font-bold" style={{ color: barColor }}>{pct}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div className="h-2 rounded-full transition-all duration-700"
            style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: barColor }} />
        </div>
        <p className="text-xs text-gray-400 mt-1">{stats.total} / {sess.maxPatients} patients</p>
      </div>
    </div>
  );
};

const QueueOverview = () => {
  const [clinics, setClinics] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [queues, setQueues] = useState({});
  const [sessionStats, setSessionStats] = useState([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { joinStaffQueueRoom, onEvent } = useSocket();

  useEffect(() => {
    getMyClinics()
      .then((res) => {
        const list = res.data.data.clinics || [];
        setClinics(list);
        if (list.length > 0) setSelectedClinic(list[0]);
      })
      .catch(() => toast.error('Failed to load clinics'))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedClinic) return;
    fetchDoctorsAndQueues();
    fetchSessionStats();
  }, [selectedClinic]);

  const fetchSessionStats = useCallback(async () => {
    if (!selectedClinic) return;
    setStatsLoading(true);
    try {
      const res = await getSessionQueueStats(selectedClinic.id);
      setSessionStats(res.data.data.sessionStats || []);
    } catch { /* non-critical */ }
    finally { setStatsLoading(false); }
  }, [selectedClinic]);

  const fetchDoctorsAndQueues = useCallback(async () => {
    if (!selectedClinic) return;
    setIsLoading(true);
    try {
      const staffRes = await getStaff(selectedClinic.id);
      const doctorStaff = (staffRes.data.data.staff || []).filter((s) => s.role === 'DOCTOR');
      setDoctors(doctorStaff);

      const today = new Date().toISOString().split('T')[0];
      const queueData = {};
      await Promise.all(
        doctorStaff.map(async (s) => {
          const doctorProfileId = s.user?.doctorProfile?.id;
          if (!doctorProfileId) return;
          try {
            const res = await getQueue(doctorProfileId, selectedClinic.id);
            queueData[doctorProfileId] = {
              queue: res.data.data.queue,
              queueItems: res.data.data.queueItems || [],
              doctorName: s.user?.name,
            };
            joinStaffQueueRoom({ clinicId: selectedClinic.id, doctorId: doctorProfileId, date: today });
          } catch {
            queueData[doctorProfileId] = { queue: null, queueItems: [], doctorName: s.user?.name };
          }
        })
      );
      setQueues(queueData);
    } catch {
      toast.error('Failed to load queue data');
    } finally {
      setIsLoading(false);
    }
  }, [selectedClinic, joinStaffQueueRoom]);

  // Refresh session stats on socket queue:updated
  useEffect(() => {
    const cleanup = onEvent('queue:updated', () => {
      fetchDoctorsAndQueues();
      fetchSessionStats();
    });
    return cleanup;
  }, [onEvent, fetchDoctorsAndQueues, fetchSessionStats]);

  return (
    <DashboardLayout>
      <ClinicNotVerifiedGuard>
      <div className="page-container">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Queue Overview</h1>
            <p className="text-gray-400 text-sm mt-1">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-100 rounded-xl">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-green-700">Live</span>
          </div>
        </div>

        {/* Clinic selector */}
        {clinics.length > 1 && (
          <div className="mb-5">
            <select className="input max-w-xs" value={selectedClinic?.id || ''}
              onChange={(e) => setSelectedClinic(clinics.find((c) => c.id === e.target.value))}>
              {clinics.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}

        {/* ── Session Stats (Req #13) ── */}
        {sessionStats.length > 0 && (
          <div className="mb-7">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Session Overview</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sessionStats.map((sess) => (
                <SessionStatsCard key={sess.sessionId} sess={sess} />
              ))}
            </div>
          </div>
        )}

        {/* ── Per-Doctor Live Queue ── */}
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Live Queue by Doctor</p>
        {isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : Object.keys(queues).length === 0 ? (
          <EmptyState icon="🔢" title="No active queues"
            description="Queues will appear here once doctors start seeing patients" />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(queues).map(([doctorId, data]) => (
              <DoctorQueuePanel key={doctorId} data={data} />
            ))}
          </div>
        )}
      </div>
      </ClinicNotVerifiedGuard>
    </DashboardLayout>
  );
};

const DoctorQueuePanel = ({ data }) => {
  const { queue, queueItems, doctorName } = data;
  const waiting = queueItems.filter((i) => i.status === 'WAITING').length;
  const completed = queueItems.filter((i) => i.status === 'COMPLETED').length;
  const current = queueItems.find((i) => ['CALLED', 'IN_CONSULTATION'].includes(i.status));

  return (
    <div className="card">
      {/* Doctor header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-700 font-bold">{doctorName?.charAt(0) || 'D'}</span>
          </div>
          <div>
            <p className="font-semibold text-text-primary">{doctorName}</p>
            {queue && (
              <StatusBadge status={queue.status} />
            )}
          </div>
        </div>
        <div className="text-right text-sm">
          <p className="text-text-muted">{waiting} waiting</p>
          <p className="text-secondary-600">{completed} done</p>
        </div>
      </div>

      {/* Currently serving */}
      {current && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3">
          <p className="text-xs font-medium text-purple-600 uppercase tracking-wide mb-1">Now Serving</p>
          <div className="flex items-center justify-between">
            <p className="font-semibold text-purple-800">
              #{current.queueNumber} — {current.patient?.name}
            </p>
            <StatusBadge status={current.status} />
          </div>
        </div>
      )}

      {/* Queue items */}
      {queueItems.length === 0 ? (
        <p className="text-sm text-text-muted text-center py-4">No patients in queue</p>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {queueItems
            .filter((i) => i.status === 'WAITING')
            .slice(0, 5)
            .map((item) => (
              <div key={item.id} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-text-muted w-6">#{item.queueNumber}</span>
                  <span className="text-sm text-text-primary">{item.patient?.name}</span>
                </div>
                <span className="text-xs text-text-muted">Pos {item.position}</span>
              </div>
            ))}
          {waiting > 5 && (
            <p className="text-xs text-text-muted text-center pt-1">+{waiting - 5} more waiting</p>
          )}
        </div>
      )}
    </div>
  );
};

export default QueueOverview;
