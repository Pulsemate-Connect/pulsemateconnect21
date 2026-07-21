import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getMyAppointments, cancelAppointment, getLiveQueue } from '../../api/patient.api';
import api from '../../api/axios';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import BookAppointmentModal from './BookAppointmentModal';
import toast from 'react-hot-toast';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  const today = new Date(); today.setHours(0,0,0,0);
  const isToday = date.toDateString() === today.toDateString();
  const str = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  return isToday ? `Today, ${str}` : str;
};

const ACTIVE_STATUSES = ['PENDING_PAYMENT', 'BOOKED', 'CHECKED_IN', 'IN_QUEUE', 'IN_CONSULTATION', 'CALLED'];
const PAST_STATUSES   = ['COMPLETED', 'CANCELLED', 'NO_SHOW'];
const FILTERS = ['All', 'BOOKED', 'IN_QUEUE', 'COMPLETED', 'CANCELLED'];
const PAST_PREVIEW = 3;

// ── Inline queue strip ────────────────────────────────────────────────────────
const QueueStrip = ({ appt }) => {
  const [qi, setQi] = useState(null);

  useEffect(() => {
    if (!['BOOKED','CHECKED_IN','IN_QUEUE','CALLED','IN_CONSULTATION'].includes(appt.status)) return;
    getLiveQueue(appt.id)
      .then((r) => setQi(r.data.data?.queueInfo))
      .catch(() => {});
  }, [appt.id, appt.status]);

  if (!qi) return null;

  const fmt12 = (t) => {
    if (!t) return null;
    const [h, m] = t.split(':').map(Number);
    return `${h > 12 ? h - 12 : h || 12}:${String(m).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`;
  };

  return (
    <div className="mt-3 grid grid-cols-3 gap-2 bg-blue-50 rounded-xl p-3">
      <div className="text-center">
        <p className="text-lg font-bold text-blue-700">{qi.position != null ? `#${qi.position}` : '—'}</p>
        <p className="text-xs text-blue-500 font-medium">Position</p>
      </div>
      <div className="text-center border-x border-blue-100">
        <p className="text-lg font-bold text-blue-700">{qi.patientsAhead != null ? qi.patientsAhead : '—'}</p>
        <p className="text-xs text-blue-500 font-medium">Ahead</p>
      </div>
      <div className="text-center">
        <p className="text-lg font-bold text-blue-700">
          {qi.estimatedAppointmentTime ? fmt12(qi.estimatedAppointmentTime) : qi.estimatedWaitMinutes ? `~${qi.estimatedWaitMinutes}m` : '—'}
        </p>
        <p className="text-xs text-blue-500 font-medium">{qi.estimatedAppointmentTime ? 'Your Slot' : 'Est. Wait'}</p>
      </div>
    </div>
  );
};

// ── Appointment Card ──────────────────────────────────────────────────────────
const AppointmentCard = ({ appt, onCancel, cancellingId, onRefund, onBookAgain, onFollowUp }) => {
  const navigate = useNavigate();
  const pay = appt.payment;
  const isFree     = pay?.status === 'PAID' && pay?.amount === 0;
  const isPaid     = pay?.status === 'PAID' && !isFree;
  const isRefunded = pay?.status === 'REFUNDED';
  const needsPayment = appt.status === 'PENDING_PAYMENT';
  const isActive   = ACTIVE_STATUSES.includes(appt.status);
  const isPast     = PAST_STATUSES.includes(appt.status);
  const canCancel  = ['BOOKED','IN_QUEUE'].includes(appt.status);
  const canRebook  = isPast && appt.doctor?.id && appt.clinic?.id;
  const canRefund  = isPaid && !isRefunded && appt.status === 'COMPLETED';
  // Show follow-up if doctor recommended it (prescription has requiresFollowUp)
  const hasFollowUpRecommendation = appt.status === 'COMPLETED' && appt.prescriptions?.requiresFollowUp;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Top strip for active appointments */}
      {isActive && <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-400" />}

      <div className="p-4">
        {/* Doctor row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-blue-700 font-bold text-lg">
                {appt.doctor?.user?.name?.charAt(0) || 'D'}
              </span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Dr. {appt.doctor?.user?.name}</p>
              <p className="text-sm text-blue-600">{appt.doctor?.specialization}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {appt.clinic?.name}{appt.clinic?.city ? ` · ${appt.clinic.city}` : ''}
              </p>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <StatusBadge status={appt.status} />
            {isFree && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">🎉 Free</span>
            )}
            {isPaid && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">✓ Paid ₹{pay.amount}</span>
            )}
            {isRefunded && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">↩ Refunded</span>
            )}
          </div>
        </div>

        {/* Details row */}
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div>
            <p className="text-gray-400">Date</p>
            <p className="font-semibold text-gray-700">{fmtDate(appt.appointmentDate)}</p>
          </div>
          <div>
            <p className="text-gray-400">Type</p>
            <p className="font-semibold text-gray-700">{appt.appointmentType === 'OFFLINE' ? '🏥 In-Person' : '💻 Online'}</p>
          </div>
          {appt.queueNumber != null && (
            <div>
              <p className="text-gray-400">Queue Token</p>
              <p className="font-bold text-blue-600 text-sm">#{appt.queueNumber}</p>
            </div>
          )}
          {appt.slotTime && (
            <div>
              <p className="text-gray-400">Slot</p>
              <p className="font-semibold text-gray-700">{appt.slotTime}</p>
            </div>
          )}
        </div>

        {/* Symptoms */}
        {appt.symptoms && (
          <p className="mt-2 text-xs text-gray-400">
            <span className="font-medium text-gray-500">Symptoms: </span>{appt.symptoms}
          </p>
        )}

        {/* Doctor's notes — visible after consultation */}
        {appt.notes && (
          <div className="mt-2 bg-green-50 rounded-lg px-3 py-2">
            <p className="text-xs font-semibold text-green-700">Doctor's Notes</p>
            <p className="text-xs text-green-600 mt-0.5">{appt.notes}</p>
          </div>
        )}

        {/* Inline queue strip for active appointments */}
        {isActive && appt.appointmentType === 'OFFLINE' && <QueueStrip appt={appt} />}

        {/* Action buttons */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {/* Track live queue */}
          {['IN_QUEUE','BOOKED','CHECKED_IN','CALLED'].includes(appt.status) && appt.appointmentType === 'OFFLINE' && (
            <Link to={`/patient/queue/${appt.id}`}
              className="flex-1 text-center text-xs font-semibold bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors">
              📡 Track Live Queue
            </Link>
          )}

          {/* Pay now */}
          {needsPayment && (
            <Link to={`/patient/payment/${appt.id}`}
              className="flex-1 text-center text-xs font-semibold bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors">
              💳 Pay Now
            </Link>
          )}

          {/* Cancel */}
          {canCancel && (
            <button onClick={() => onCancel(appt.id)} disabled={cancellingId === appt.id}
              className="flex-1 text-xs font-semibold border border-red-200 text-red-500 py-2 px-3 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50">
              {cancellingId === appt.id ? <LoadingSpinner size="sm" className="mx-auto" /> : 'Cancel'}
            </button>
          )}

          {/* Book Again — one-tap rebook from past appointment */}
          {canRebook && (
            <button
              onClick={() => onBookAgain(appt)}
              className="flex items-center gap-1 text-xs font-semibold text-blue-600 border border-blue-200 py-2 px-3 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Book Again
            </button>
          )}

          {/* Follow-up — only when doctor recommended */}
          {hasFollowUpRecommendation && onFollowUp && (
            <button
              onClick={() => onFollowUp(appt)}
              className="flex items-center gap-1 text-xs font-semibold text-orange-600 border border-orange-300 py-2 px-3 rounded-lg hover:bg-orange-50 transition-colors"
            >
              🔄 Follow-up
            </button>
          )}

          {/* Request refund */}
          {canRefund && (
            <button onClick={() => onRefund(appt.id)}
              className="text-xs font-medium text-gray-400 hover:text-red-500 transition-colors py-2 px-1">
              ↩ Refund
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const MyAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [cancellingId, setCancellingId] = useState(null);
  const [showAllPast, setShowAllPast] = useState(false);
  const [rebookAppt, setRebookAppt] = useState(null);
  const [followUpAppt, setFollowUpAppt] = useState(null); // appointment to follow up on

  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getMyAppointments({});
      setAppointments(res.data.data || []);
    } catch {
      toast.error('Failed to load appointments');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    setCancellingId(id);
    try {
      await cancelAppointment(id);
      toast.success('Appointment cancelled');
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    } finally {
      setCancellingId(null);
    }
  };

  const handleRefund = async (id) => {
    if (!window.confirm('Request a refund for this booking?')) return;
    try {
      await api.post('/payments/refund', { appointmentId: id, reason: 'Patient requested refund' });
      toast.success('Refund requested successfully');
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Refund request failed');
    }
  };

  const applyFilter = (list) =>
    activeFilter === 'All' ? list : list.filter((a) => a.status === activeFilter);

  const upcoming  = applyFilter(appointments.filter((a) => ACTIVE_STATUSES.includes(a.status)));
  const allPast   = applyFilter(appointments.filter((a) => PAST_STATUSES.includes(a.status)));
  const pastShown = showAllPast ? allPast : allPast.slice(0, PAST_PREVIEW);
  const noResults = upcoming.length === 0 && allPast.length === 0;

  return (
    <DashboardLayout>
      <div className="page-container">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
            <p className="text-sm text-gray-400 mt-0.5">Track and manage your bookings</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/patient/payments"
              className="text-xs font-semibold text-gray-500 border border-gray-200 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors">
              💳 Payments
            </Link>
            <Link to="/patient/search"
              className="text-xs font-semibold text-white bg-blue-600 px-3 py-2 rounded-xl hover:bg-blue-700 transition-colors">
              + Book New
            </Link>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setActiveFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeFilter === f ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-blue-300'}`}>
              {f}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : noResults ? (
          <EmptyState icon="📅" title="No appointments found" description="Book an appointment with a doctor to get started"
            action={<Link to="/patient/search" className="btn-primary">Find a Doctor</Link>} />
        ) : (
          <div className="space-y-8">
            {/* Upcoming */}
            {upcoming.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Upcoming ({upcoming.length})</h2>
                </div>
                <div className="space-y-3">
                  {upcoming.map((appt) => (
                    <AppointmentCard key={appt.id} appt={appt}
                      onCancel={handleCancel} cancellingId={cancellingId}
                      onRefund={handleRefund} onBookAgain={setRebookAppt}
                      onFollowUp={setFollowUpAppt} />
                  ))}
                </div>
              </div>
            )}

            {/* Past */}
            {allPast.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-300" />
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Past Appointments ({allPast.length})</h2>
                  </div>
                  {allPast.length > PAST_PREVIEW && (
                    <button onClick={() => setShowAllPast((p) => !p)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                      {showAllPast ? 'Show Less' : `View All (${allPast.length})`}
                      <svg className={`w-3.5 h-3.5 transition-transform ${showAllPast ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {pastShown.map((appt) => (
                    <AppointmentCard key={appt.id} appt={appt}
                      onCancel={handleCancel} cancellingId={cancellingId}
                      onRefund={handleRefund} onBookAgain={setRebookAppt}
                      onFollowUp={setFollowUpAppt} />
                  ))}
                </div>
                {!showAllPast && allPast.length > PAST_PREVIEW && (
                  <button onClick={() => setShowAllPast(true)}
                    className="w-full mt-3 py-3 border border-dashed border-blue-200 text-blue-600 text-sm font-semibold rounded-xl hover:bg-blue-50 transition-colors">
                    Show {allPast.length - PAST_PREVIEW} more past appointments
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Book Again modal */}
      {rebookAppt && (
        <BookAppointmentModal
          doctor={rebookAppt.doctor}
          clinic={rebookAppt.clinic}
          defaultType={rebookAppt.appointmentType || 'OFFLINE'}
          onClose={() => setRebookAppt(null)}
          onSuccess={() => { setRebookAppt(null); fetchAppointments(); toast.success('Appointment booked!'); }}
        />
      )}

      {/* Follow-up modal — opens BookAppointmentModal which shows follow-up option automatically */}
      {followUpAppt && (
        <BookAppointmentModal
          doctor={followUpAppt.doctor}
          clinic={followUpAppt.clinic}
          defaultType="OFFLINE"
          onClose={() => setFollowUpAppt(null)}
          onSuccess={() => { setFollowUpAppt(null); fetchAppointments(); toast.success('Follow-up booked!'); }}
        />
      )}
    </DashboardLayout>
  );
};

export default MyAppointments;
