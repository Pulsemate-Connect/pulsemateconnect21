import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getTodaysAppointments, checkInAppointment } from '../../api/reception.api';
import { getMe } from '../../api/auth.api';
import { getStaff, getClinicSessions } from '../../api/clinic.api';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import useSocket from '../../hooks/useSocket';
import toast from 'react-hot-toast';

const STATUS_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Booked', value: 'BOOKED' },
  { label: 'Checked In', value: 'CHECKED_IN' },
  { label: 'In Queue', value: 'IN_QUEUE' },
  { label: 'Consulting', value: 'IN_CONSULTATION' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
  { label: 'No Show', value: 'NO_SHOW' },
];

const SESSION_ICONS = { MORNING: '🌅', AFTERNOON: '☀️', EVENING: '🌙' };

const fmt12 = (t) => {
  if (!t) return '—';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hr}:${String(m).padStart(2, '0')} ${ampm}`;
};

const CHECKIN_ELIGIBLE = ['BOOKED'];

const TodaysAppointments = () => {
  const [clinic, setClinic] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [sessionFilter, setSessionFilter] = useState('');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const { onEvent } = useSocket();

  useEffect(() => {
    const init = async () => {
      try {
        const meRes = await getMe();
        const staffClinics = meRes.data.data.user?.clinicStaff || [];
        if (!staffClinics.length) { setIsLoading(false); return; }
        const myClinic = staffClinics[0].clinic;
        setClinic(myClinic);

        const [staffRes, sessionsRes] = await Promise.all([
          getStaff(myClinic.id),
          getClinicSessions(myClinic.id),
        ]);
        const doctorStaff = (staffRes.data.data.staff || []).filter((s) => s.role === 'DOCTOR');
        setDoctors(doctorStaff);
        setSessions(sessionsRes.data.data.sessions || []);
      } catch {
        toast.error('Failed to load clinic data');
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const fetchAppointments = useCallback(async () => {
    if (!clinic) return;
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (doctorFilter) params.doctorId = doctorFilter;
      if (sessionFilter) params.sessionId = sessionFilter;
      if (search.trim().length >= 2) params.search = search.trim();

      const res = await getTodaysAppointments(params);
      setAppointments(res.data.data.appointments || []);
    } catch {
      toast.error('Failed to load appointments');
    }
  }, [clinic, statusFilter, doctorFilter, sessionFilter, search]);

  useEffect(() => {
    if (clinic) fetchAppointments();
  }, [fetchAppointments, clinic]);

  // Live updates via socket
  useEffect(() => {
    const cleanup = onEvent('queue:updated', () => fetchAppointments());
    return cleanup;
  }, [onEvent, fetchAppointments]);

  const handleCheckIn = async (appointmentId, patientName) => {
    setActionLoading(appointmentId);
    try {
      const res = await checkInAppointment(appointmentId);
      const data = res.data.data;
      if (data.alreadyInQueue) {
        toast.success(`${patientName} is already in queue at position #${data.queueNumber}`);
      } else {
        toast.success(`${patientName} checked in — Queue #${data.queueNumber}`);
      }
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in failed');
    } finally {
      setActionLoading(null);
    }
  };

  const totalCount = appointments.length;
  const waitingCount = appointments.filter((a) => ['IN_QUEUE', 'WAITING'].includes(a.status)).length;
  const completedCount = appointments.filter((a) => a.status === 'COMPLETED').length;
  const checkedInCount = appointments.filter((a) => a.status === 'CHECKED_IN').length;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-64"><LoadingSpinner size="lg" /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="page-container">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Today's Appointments</h1>
            <p className="text-text-muted text-sm mt-1">
              {clinic?.name} • {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <button
            onClick={fetchAppointments}
            className="btn-outline text-sm px-3 py-2"
            title="Refresh"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total', value: totalCount, color: 'text-blue-600' },
            { label: 'Waiting', value: waitingCount, color: 'text-yellow-600' },
            { label: 'Checked In', value: checkedInCount, color: 'text-purple-600' },
            { label: 'Completed', value: completedCount, color: 'text-green-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card text-center py-3">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-text-muted mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="card mb-4">
          <input
            type="text"
            className="input w-full"
            placeholder="🔍 Search by patient name or mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="card mb-4 space-y-3">
          {/* Status filter */}
          <div>
            <label className="label mb-1">Status</label>
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setStatusFilter(value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    statusFilter === value
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-border text-text-muted hover:border-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {/* Doctor filter */}
            {doctors.length > 1 && (
              <div className="flex-1 min-w-[160px]">
                <label className="label mb-1">Doctor</label>
                <select
                  className="input text-sm"
                  value={doctorFilter}
                  onChange={(e) => setDoctorFilter(e.target.value)}
                >
                  <option value="">All Doctors</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.user?.doctorProfile?.id}>
                      {d.user?.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Session filter */}
            {sessions.length > 1 && (
              <div className="flex-1 min-w-[160px]">
                <label className="label mb-1">Session</label>
                <select
                  className="input text-sm"
                  value={sessionFilter}
                  onChange={(e) => setSessionFilter(e.target.value)}
                >
                  <option value="">All Sessions</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {SESSION_ICONS[s.sessionType]} {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Appointments list */}
        {appointments.length === 0 ? (
          <EmptyState
            icon="📅"
            title="No appointments found"
            description={search || statusFilter ? 'Try adjusting your filters' : 'No appointments scheduled for today'}
          />
        ) : (
          <div className="space-y-3">
            {appointments.map((appt) => (
              <AppointmentCard
                key={appt.id}
                appointment={appt}
                onCheckIn={handleCheckIn}
                actionLoading={actionLoading}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

const AppointmentCard = ({ appointment: appt, onCheckIn, actionLoading }) => {
  const isCheckinEligible = CHECKIN_ELIGIBLE.includes(appt.status);
  const isLoading = actionLoading === appt.id;

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-xl flex-shrink-0">
            {appt.slotTime ? '🕐' : '🚶'}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-text-primary">{appt.patient?.name || 'Unknown'}</p>
              {!appt.slotTime && (
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Walk-in</span>
              )}
            </div>
            <p className="text-sm text-text-muted">{appt.patient?.mobile}</p>
            <p className="text-xs text-text-muted mt-0.5">
              Dr. {appt.doctor?.user?.name}
              {appt.slotTime && <span className="ml-1 font-medium text-blue-600">• {fmt12(appt.slotTime)}</span>}
            </p>
            {appt.symptoms && (
              <p className="text-xs text-text-muted mt-1 italic truncate max-w-xs">"{appt.symptoms}"</p>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <StatusBadge status={appt.status} />
          {appt.queueItem && (
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              Q#{appt.queueItem.queueNumber}
            </span>
          )}
          {appt.payment?.status === 'PAID' && (
            <span className="text-xs text-green-600 font-medium">💵 Paid</span>
          )}
        </div>
      </div>

      {/* Check-in action */}
      {isCheckinEligible && (
        <div className="mt-3 pt-3 border-t border-border">
          <button
            onClick={() => onCheckIn(appt.id, appt.patient?.name)}
            disabled={isLoading}
            className="btn-primary text-sm py-2 px-4 flex items-center gap-2"
          >
            {isLoading ? <LoadingSpinner size="sm" /> : '✓ Check In Patient'}
          </button>
        </div>
      )}

      {/* Already in queue info */}
      {['IN_QUEUE', 'CALLED', 'IN_CONSULTATION'].includes(appt.status) && appt.queueItem && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-blue-600 font-medium">
            ✅ In queue — Position {appt.queueItem.position}, Q#{appt.queueItem.queueNumber}
          </p>
        </div>
      )}
    </div>
  );
};

export default TodaysAppointments;
