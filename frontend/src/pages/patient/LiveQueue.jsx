import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getLiveQueue } from '../../api/patient.api';
import useSocket from '../../hooks/useSocket';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt12 = (t) => {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  return `${h > 12 ? h - 12 : h || 12}:${String(m).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_META = {
  WAITING:         { label: 'Waiting',               sub: 'Your turn is coming up',                    color: '#F59E0B', bg: '#FEF3C7', icon: '⏳' },
  CALLED:          { label: "You've Been Called!",    sub: "Please proceed to the doctor's room now",    color: '#10B981', bg: '#D1FAE5', icon: '🔔' },
  IN_CONSULTATION: { label: 'In Consultation',        sub: 'Your consultation is in progress',           color: '#3B82F6', bg: '#DBEAFE', icon: '🩺' },
  CHECKED_IN:      { label: 'Checked In',             sub: 'You are checked in and waiting',             color: '#0EA5E9', bg: '#E0F2FE', icon: '✅' },
  COMPLETED:       { label: 'Consultation Complete',  sub: 'Thank you for visiting',                     color: '#10B981', bg: '#D1FAE5', icon: '🎉' },
  SKIPPED:         { label: 'Skipped',                sub: 'Please check with the receptionist',         color: '#EF4444', bg: '#FEE2E2', icon: '⚠️' },
};
const getMeta = (s) => STATUS_META[s] || STATUS_META.WAITING;

// Journey steps
const JOURNEY = [
  { key: 'BOOKED',         label: 'Booked',      icon: '📅' },
  { key: 'CHECKED_IN',     label: 'Checked In',  icon: '✅' },
  { key: 'WAITING',        label: 'Waiting',     icon: '⏳' },
  { key: 'CALLED',         label: 'Called',      icon: '🔔' },
  { key: 'IN_CONSULTATION',label: 'Consulting',  icon: '🩺' },
  { key: 'COMPLETED',      label: 'Done',        icon: '🎉' },
];
const ORDER = JOURNEY.map((j) => j.key);

// ── Pulsing token ─────────────────────────────────────────────────────────────
const PulseToken = ({ number, color }) => (
  <div className="relative flex items-center justify-center w-36 h-36 mx-auto mb-6">
    {/* Rings */}
    <div className="absolute inset-0 rounded-full opacity-20 animate-ping" style={{ backgroundColor: color }} />
    <div className="absolute inset-3 rounded-full opacity-10 animate-ping" style={{ backgroundColor: color, animationDelay: '0.3s' }} />
    {/* Token circle */}
    <div className="relative w-28 h-28 rounded-full flex flex-col items-center justify-center border-4"
      style={{ backgroundColor: `${color}15`, borderColor: `${color}40` }}>
      <span className="text-xs font-bold tracking-widest opacity-60 uppercase" style={{ color }}>TOKEN</span>
      <span className="text-5xl font-black leading-none" style={{ color }}>{number ?? '—'}</span>
    </div>
  </div>
);

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon, value, label, highlight }) => (
  <div className={`bg-white rounded-2xl border p-4 text-center transition-all ${highlight ? 'border-green-300 shadow-green-100 shadow-md' : 'border-gray-100 shadow-sm'}`}>
    <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2 text-lg" style={{ backgroundColor: highlight ? '#D1FAE5' : '#F3F4F6' }}>
      {icon}
    </div>
    <p className={`text-2xl font-black leading-none mb-1 ${highlight ? 'text-green-600' : 'text-gray-900'}`}>{value ?? '—'}</p>
    <p className="text-xs font-semibold text-gray-400">{label}</p>
  </div>
);

// ── Progress bar ──────────────────────────────────────────────────────────────
const QueueBar = ({ position, total, color }) => {
  const pct = total > 0 ? Math.max(0, Math.min(100, (1 - (position - 1) / total) * 100)) : 0;
  return (
    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const LiveQueue = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [queueData, setQueueData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [socketState, setSocketState] = useState('connecting'); // connecting | live | offline
  const { joinQueueRoom, onEvent, leaveQueueRoom } = useSocket();
  const roomRef = useRef(null);

  const fetchQueueData = useCallback(async () => {
    try {
      const res = await getLiveQueue(appointmentId);
      const { appointment, queueInfo } = res.data.data;
      setQueueData({ appointment, queueInfo });
      setLastUpdated(new Date());
      setSocketState('live');

      if (queueInfo?.roomName && roomRef.current !== queueInfo.roomName) {
        const parts = queueInfo.roomName.split(':');
        if (parts.length >= 4) {
          joinQueueRoom({ clinicId: parts[1], doctorId: parts[2], date: parts[3] });
          roomRef.current = queueInfo.roomName;
        }
      }
    } catch {
      setSocketState('offline');
    } finally {
      setIsLoading(false);
    }
  }, [appointmentId, joinQueueRoom]);

  useEffect(() => {
    fetchQueueData();
    const interval = setInterval(fetchQueueData, 30000);
    return () => clearInterval(interval);
  }, [fetchQueueData]);

  // Socket events
  useEffect(() => {
    const cleanups = [
      onEvent('queue:updated', () => { fetchQueueData(); }),
      onEvent('queue:called', (data) => {
        if (queueData?.queueInfo?.queueNumber === data.queueNumber) {
          toast.success('🔔 Your turn! Please proceed to the doctor.', { duration: 10000 });
        }
        fetchQueueData();
      }),
      onEvent('queue:positionUpdated', () => fetchQueueData()),
      onEvent('queue:paused', () => { toast('Queue paused ⏸', { icon: '⏸️' }); fetchQueueData(); }),
      onEvent('queue:resumed', () => { toast('Queue resumed ▶️', { icon: '▶️' }); fetchQueueData(); }),
    ];
    return () => cleanups.forEach((c) => c?.());
  }, [queueData, fetchQueueData, onEvent]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-gray-400 text-sm">Connecting to live queue...</p>
        </div>
      </DashboardLayout>
    );
  }

  const { appointment, queueInfo } = queueData || {};
  const qi     = queueInfo;
  const status = qi?.status || appointment?.status || 'WAITING';
  const meta   = getMeta(status);
  const curIdx = ORDER.indexOf(status);

  return (
    <DashboardLayout>
      <div className="page-container max-w-lg">

        {/* Back */}
        <div className="flex items-center gap-2 mb-6">
          <button onClick={() => navigate('/patient/appointments')}
            className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Live Queue</h1>
            {appointment?.clinic?.name && <p className="text-xs text-gray-400">{appointment.clinic.name}</p>}
          </div>
          {/* Connection badge */}
          <div className={`ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${socketState === 'live' ? 'bg-green-50 border-green-200 text-green-700' : socketState === 'offline' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
            {socketState === 'live' ? (
              <><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> LIVE</>
            ) : socketState === 'offline' ? (
              <><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> OFFLINE</>
            ) : (
              <><LoadingSpinner size="sm" /> SYNC</>
            )}
          </div>
        </div>

        {/* "Called" banner */}
        {status === 'CALLED' && (
          <div className="bg-green-500 text-white rounded-2xl p-4 mb-5 flex items-center gap-3 animate-bounce">
            <span className="text-3xl">🔔</span>
            <div>
              <p className="font-bold">Your Turn Has Arrived!</p>
              <p className="text-green-100 text-sm">Please proceed to the doctor's room now</p>
            </div>
          </div>
        )}

        {/* Token + status */}
        <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl p-6 mb-5 text-center">
          <PulseToken number={qi?.queueNumber ?? appointment?.queueNumber} color={meta.color} />

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-2 text-sm font-bold"
            style={{ backgroundColor: `${meta.color}25`, color: meta.color, border: `1px solid ${meta.color}40` }}>
            <span>{meta.icon}</span>
            {meta.label}
          </div>
          <p className="text-slate-400 text-xs">{meta.sub}</p>

          {qi?.queueStatus === 'PAUSED' && (
            <div className="mt-3 bg-amber-500/20 border border-amber-500/30 rounded-xl px-3 py-2 text-amber-400 text-xs font-semibold">
              ⏸ Queue is temporarily paused
            </div>
          )}

          {lastUpdated && (
            <p className="text-slate-500 text-xs mt-2">Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
          )}
        </div>

        {!qi ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center shadow-sm">
            <p className="text-3xl mb-3">📋</p>
            <p className="font-semibold text-gray-700">Queue not started yet</p>
            <p className="text-sm text-gray-400 mt-1">The clinic will start the queue soon</p>
          </div>
        ) : (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <StatCard icon="👥" value={qi.patientsAhead} label="Ahead of You" highlight={qi.patientsAhead === 0} />
              <StatCard icon="▶️" value={qi.currentlyServing != null ? `#${qi.currentlyServing}` : null} label="Now Serving" />
              <StatCard icon="🕐"
                value={qi.estimatedAppointmentTime ? fmt12(qi.estimatedAppointmentTime) : qi.estimatedWaitMinutes != null ? `${qi.estimatedWaitMinutes}m` : null}
                label={qi.estimatedAppointmentTime ? 'Your Slot' : 'Est. Wait'} />
            </div>

            {/* Queue progress bar */}
            {status === 'WAITING' && qi.position != null && (
              <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-gray-900">Queue Progress</p>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Position #{qi.position}</span>
                </div>
                <QueueBar position={qi.position} total={(qi.patientsAhead || 0) + 1} color={meta.color} />
                <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                  <span>Start</span>
                  <span className="font-medium text-gray-600">{qi.patientsAhead === 0 ? "You're next!" : `${qi.patientsAhead} patients ahead`}</span>
                  <span>Doctor</span>
                </div>
              </div>
            )}

            {/* Journey tracker */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-5 shadow-sm">
              <p className="text-sm font-bold text-gray-900 mb-4">Your Journey</p>
              <div className="flex items-start justify-between">
                {JOURNEY.map((step, idx) => {
                  const done   = curIdx > idx;
                  const active = curIdx === idx;
                  const color  = done ? '#10B981' : active ? meta.color : '#E5E7EB';
                  return (
                    <div key={step.key} className="flex-1 flex flex-col items-center relative">
                      {/* Connector line */}
                      {idx < JOURNEY.length - 1 && (
                        <div className="absolute top-4 left-1/2 w-full h-0.5 z-0"
                          style={{ backgroundColor: done ? '#10B981' : '#E5E7EB' }} />
                      )}
                      {/* Circle */}
                      <div className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 mb-2"
                        style={{ backgroundColor: (done || active) ? color : '#F9FAFB', borderColor: color }}>
                        {done ? <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          : <span style={{ color: active ? '#fff' : '#9CA3AF' }}>{step.icon}</span>}
                      </div>
                      <p className="text-xs text-center leading-tight font-medium"
                        style={{ color: active ? meta.color : done ? '#10B981' : '#9CA3AF' }}>
                        {step.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* While you wait */}
            {status === 'WAITING' && (
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-5">
                <p className="text-xs font-bold text-amber-700 mb-2.5">💡 While You Wait</p>
                {[
                  'Keep your prescriptions and reports ready',
                  "You'll be notified when it's your turn",
                  'Queue updates automatically every 30 seconds',
                ].map((tip) => (
                  <div key={tip} className="flex items-center gap-2 mb-1.5">
                    <div className="w-5 h-5 rounded bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <p className="text-xs text-amber-700">{tip}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Doctor info */}
            {appointment?.doctor?.user?.name && (
              <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-700 font-bold">{appointment.doctor.user.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Dr. {appointment.doctor.user.name}</p>
                    {appointment.doctor.specialization && (
                      <p className="text-xs text-blue-600">{appointment.doctor.specialization}</p>
                    )}
                  </div>
                  <div className="ml-auto">
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${status === 'IN_CONSULTATION' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                      {status === 'IN_CONSULTATION' ? '🩺 In Consult' : '✅ Available'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Refresh */}
            <button onClick={fetchQueueData}
              className="w-full flex items-center justify-center gap-2 py-3 border border-blue-200 text-blue-600 rounded-xl text-sm font-semibold hover:bg-blue-50 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Refresh Queue
            </button>

            <p className="text-center text-xs text-gray-300 mt-3">
              {socketState === 'live' ? '⚡ Connected — real-time updates via socket' : '🔄 Polling every 30 seconds'}
            </p>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default LiveQueue;
