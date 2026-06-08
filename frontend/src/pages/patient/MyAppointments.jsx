import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getMyAppointments, cancelAppointment } from '../../api/patient.api';
import api from '../../api/axios';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';

const FILTERS = ['All', 'BOOKED', 'IN_QUEUE', 'COMPLETED', 'CANCELLED'];
const PAST_PREVIEW = 3;

const MyAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [cancellingId, setCancellingId] = useState(null);
  const [refundingId, setRefundingId] = useState(null);
  const [showAllPast, setShowAllPast] = useState(false);

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      // Always fetch all appointments so we can split upcoming/past client-side
      const res = await getMyAppointments({});
      setAppointments(res.data.data || []);
    } catch {
      toast.error('Failed to load appointments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAppointments(); }, []);

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
    if (!window.confirm('Request a refund for this appointment? This will cancel the appointment if still active.')) return;
    setRefundingId(id);
    try {
      await api.post('/payments/refund', { appointmentId: id, reason: 'Patient requested refund' });
      toast.success('Refund requested successfully');
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Refund request failed');
    } finally {
      setRefundingId(null);
    }
  };

  // Split into upcoming and past; apply filter to each list
  const ACTIVE_STATUSES = ['PENDING_PAYMENT', 'BOOKED', 'CHECKED_IN', 'IN_QUEUE', 'IN_CONSULTATION', 'CALLED'];
  const PAST_STATUSES   = ['COMPLETED', 'CANCELLED', 'NO_SHOW'];

  const applyFilter = (list) =>
    activeFilter === 'All' ? list : list.filter((a) => a.status === activeFilter);

  const upcoming  = applyFilter(appointments.filter((a) => ACTIVE_STATUSES.includes(a.status)));
  const allPast   = applyFilter(appointments.filter((a) => PAST_STATUSES.includes(a.status)));
  const pastShown = showAllPast ? allPast : allPast.slice(0, PAST_PREVIEW);

  const noResults = upcoming.length === 0 && allPast.length === 0;

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-text-primary">My Appointments</h1>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {FILTERS.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeFilter === filter
                  ? 'bg-primary-600 text-white'
                  : 'bg-white border border-border text-text-muted hover:border-primary-300'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : noResults ? (
          <EmptyState
            icon="📅"
            title="No appointments found"
            description="Book an appointment with a doctor to get started"
            action={<Link to="/patient/search" className="btn-primary">Find a Doctor</Link>}
          />
        ) : (
          <div className="space-y-8">
            {/* ── Upcoming ── */}
            {upcoming.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-primary-600" />
                  <h2 className="text-sm font-bold text-text-muted uppercase tracking-wider">Upcoming</h2>
                </div>
                <div className="space-y-4">
                  {upcoming.map((appt) => (
                    <AppointmentCard
                      key={appt.id}
                      appt={appt}
                      onCancel={handleCancel}
                      cancellingId={cancellingId}
                      onRefund={handleRefund}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── Past ── */}
            {allPast.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                    <h2 className="text-sm font-bold text-text-muted uppercase tracking-wider">Past Appointments</h2>
                  </div>
                  {allPast.length > PAST_PREVIEW && (
                    <button
                      onClick={() => setShowAllPast((prev) => !prev)}
                      className="flex items-center gap-1 text-sm text-primary-600 font-semibold hover:text-primary-700"
                    >
                      {showAllPast ? 'Show Less' : `View All (${allPast.length})`}
                      <svg className={`w-4 h-4 transition-transform ${showAllPast ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="space-y-4">
                  {pastShown.map((appt) => (
                    <AppointmentCard
                      key={appt.id}
                      appt={appt}
                      onCancel={handleCancel}
                      cancellingId={cancellingId}
                      onRefund={handleRefund}
                    />
                  ))}
                </div>
                {!showAllPast && allPast.length > PAST_PREVIEW && (
                  <button
                    onClick={() => setShowAllPast(true)}
                    className="w-full mt-3 py-3 border border-dashed border-primary-200 text-primary-600 text-sm font-semibold rounded-xl hover:bg-primary-50 transition-colors"
                  >
                    Show {allPast.length - PAST_PREVIEW} more past appointments
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

const AppointmentCard = ({ appt, onCancel, cancellingId, onRefund }) => {
  const paymentStatus = appt.payment?.status;
  const isFreeBooking = paymentStatus === 'PAID' && appt.payment?.amount === 0;
  const isPaid = paymentStatus === 'PAID' && !isFreeBooking;
  const isRefunded = paymentStatus === 'REFUNDED';
  const needsPayment = appt.status === 'COMPLETED' && !isPaid && !isFreeBooking && (appt.doctor?.consultationFee > 0);

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-primary-700 font-bold">
              {appt.doctor?.user?.name?.charAt(0) || 'D'}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">{appt.doctor?.user?.name}</h3>
            <p className="text-sm text-primary-600">{appt.doctor?.specialization}</p>
            <p className="text-sm text-text-muted mt-0.5">
              {appt.clinic?.name} • {appt.clinic?.city}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <StatusBadge status={appt.status} />
          {isFreeBooking && <span className="badge bg-emerald-100 text-emerald-700 text-xs font-semibold">🎉 Free</span>}
          {isPaid && <span className="badge bg-green-100 text-green-700">✓ Paid</span>}
          {isRefunded && <span className="badge bg-gray-100 text-gray-600">↩ Refunded</span>}
          {needsPayment && <span className="badge bg-red-100 text-red-700">Payment Due</span>}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div>
          <p className="text-text-muted">Date</p>
          <p className="font-medium">{new Date(appt.appointmentDate).toLocaleDateString()}</p>
        </div>
        <div>
          <p className="text-text-muted">Type</p>
          <p className="font-medium">{appt.appointmentType}</p>
        </div>
        {appt.queueNumber && (
          <div>
            <p className="text-text-muted">Queue #</p>
            <p className="font-medium">{appt.queueNumber}</p>
          </div>
        )}
        {appt.estimatedWaitMinutes && (
          <div>
            <p className="text-text-muted">Est. Wait</p>
            <p className="font-medium">{appt.estimatedWaitMinutes} min</p>
          </div>
        )}
      </div>

      {appt.symptoms && (
        <p className="text-xs text-text-muted mt-3">Symptoms: {appt.symptoms}</p>
      )}

      {/* Action buttons */}
      <div className="mt-4 flex flex-wrap gap-2">
        {/* Live queue tracking */}
        {['IN_QUEUE', 'BOOKED', 'CHECKED_IN'].includes(appt.status) && appt.appointmentType === 'OFFLINE' && (
          <Link to={`/patient/queue/${appt.id}`} className="btn-outline text-sm py-2 flex-1 text-center">
            📡 Track Live Queue
          </Link>
        )}

        {/* Pay now */}
        {needsPayment && (
          <Link
            to={`/patient/payment/${appt.id}`}
            className="btn-primary text-sm py-2 flex-1 text-center"
          >
            💳 Pay Now
          </Link>
        )}

        {/* Cancel */}
        {['BOOKED', 'IN_QUEUE'].includes(appt.status) && (
          <button
            onClick={() => onCancel(appt.id)}
            disabled={cancellingId === appt.id}
            className="btn-danger text-sm py-2 flex-1"
          >
            {cancellingId === appt.id ? <LoadingSpinner size="sm" className="mx-auto" /> : 'Cancel'}
          </button>
        )}

        {/* Request refund — only for completed + paid appointments */}
        {appt.status === 'COMPLETED' && isPaid && !isRefunded && (
          <button
            onClick={() => onRefund(appt.id)}
            className="text-xs text-gray-400 hover:text-red-500 font-medium transition-colors py-2 px-1 flex-none"
          >
            ↩ Request Refund
          </button>
        )}
      </div>
    </div>
  );
};

export default MyAppointments;
