import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getAppointmentDetails } from '../../api/patient.api';
import { initiatePayment, verifyPayment, getPaymentStatus, getPaymentStatusByOrderId } from '../../api/payment.api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatusBadge from '../../components/ui/StatusBadge';
import toast from 'react-hot-toast';
import { fmtDoctorName } from '../../utils/doctorName';

// ── Payment states ────────────────────────────────────────────────────────────
// IDLE        — normal, show pay button
// PROCESSING  — payment attempted, polling for confirmation (don't pay again)
// SUCCESS     — confirmed paid
// FAILED      — payment failed

const POLL_INTERVAL_MS = 3000;   // poll every 3 seconds
const POLL_MAX_MS      = 60000;  // stop after 60 seconds

const PaymentPage = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();

  const [appointment, setAppointment]     = useState(null);
  const [payment, setPayment]             = useState(null);
  const [isLoading, setIsLoading]         = useState(true);
  const [isPaying, setIsPaying]           = useState(false);
  const [pollState, setPollState]         = useState('IDLE'); // IDLE | POLLING | SUCCESS | TIMEOUT
  const [pollSeconds, setPollSeconds]     = useState(0);
  const [currentOrderId, setCurrentOrderId] = useState(null);

  const pollTimerRef  = useRef(null);
  const pollStartRef  = useRef(null);
  const pollCountRef  = useRef(0);

  // ── Load appointment + payment on mount ────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [apptRes, payRes] = await Promise.all([
          getAppointmentDetails(appointmentId),
          getPaymentStatus(appointmentId),
        ]);
        setAppointment(apptRes.data.data.appointment);
        const p = payRes.data.data.payment;
        setPayment(p);

        // If payment is already PAID, show success immediately
        if (p?.status === 'PAID') {
          setPollState('SUCCESS');
        }
      } catch {
        toast.error('Failed to load payment details');
        navigate('/patient/appointments');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [appointmentId, navigate]);

  // ── Polling logic ──────────────────────────────────────────────────────────
  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const startPolling = useCallback((orderId) => {
    stopPolling();
    pollStartRef.current = Date.now();
    pollCountRef.current = 0;
    setPollState('POLLING');
    setPollSeconds(0);

    pollTimerRef.current = setInterval(async () => {
      pollCountRef.current += 1;
      const elapsed = Date.now() - pollStartRef.current;
      setPollSeconds(Math.floor(elapsed / 1000));

      if (elapsed >= POLL_MAX_MS) {
        stopPolling();
        setPollState('TIMEOUT');
        return;
      }

      try {
        // Poll by order ID so we can detect webhook-processed payments too
        const res = await getPaymentStatusByOrderId(orderId);
        const p   = res.data.data.payment;
        setPayment(p);

        if (p?.status === 'PAID') {
          stopPolling();
          setPollState('SUCCESS');
          toast.success('Payment confirmed!');
        } else if (p?.status === 'FAILED') {
          stopPolling();
          setPollState('IDLE');
          setIsPaying(false);
          toast.error('Payment failed. Please try again.');
        }
      } catch {
        // Network blip — keep polling
      }
    }, POLL_INTERVAL_MS);
  }, [stopPolling]);

  // Clean up on unmount
  useEffect(() => () => stopPolling(), [stopPolling]);

  // ── Razorpay payment handler ───────────────────────────────────────────────
  const handleRazorpayPayment = async () => {
    setIsPaying(true);
    try {
      const orderRes = await initiatePayment({
        doctorId:        appointment.doctorId,
        clinicId:        appointment.clinicId,
        appointmentType: appointment.appointmentType,
        appointmentDate: appointment.appointmentDate,
        slotTime:        appointment.slotTime,
        symptoms:        appointment.symptoms,
      });
      const { order, key, amount, devMode, isFree } = orderRes.data.data;

      // Free booking — immediately confirmed
      if (isFree) {
        toast.success('🎉 Free booking confirmed!');
        navigate('/patient/appointments');
        return;
      }

      // Dev mode — skip Razorpay SDK
      if (devMode) {
        setCurrentOrderId(order.id);
        await verifyPayment({
          appointmentId,
          razorpayOrderId:   order.id,
          razorpayPaymentId: 'dev_pay_' + Date.now(),
          razorpaySignature: 'dev_sig',
        });
        toast.success('Payment successful (dev mode)');
        navigate('/patient/appointments');
        return;
      }

      // Load Razorpay SDK dynamically
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }

      setCurrentOrderId(order.id);

      const options = {
        key,
        amount:      order.amount,
        currency:    order.currency,
        name:        'PulseMate',
        description: `Consultation with ${fmtDoctorName(appointment?.doctor?.user?.name)}`,
        order_id:    order.id,

        handler: async (response) => {
          // Razorpay calls this after successful payment on the modal
          // Start polling IMMEDIATELY — don't wait for verify to complete
          startPolling(order.id);

          try {
            await verifyPayment({
              appointmentId,
              razorpayOrderId:   response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            // verifyPayment succeeded — polling will detect PAID and stop
          } catch {
            // Verify call failed (network issue / server error)
            // Keep polling — webhook may have already updated the DB
            toast('Verifying payment... please wait.', { icon: '⏳' });
          }
        },

        prefill: { name: appointment?.patient?.name || '' },
        theme:   { color: '#6366F1' },

        modal: {
          ondismiss: () => {
            // User closed modal without paying
            if (pollState !== 'POLLING') {
              setIsPaying(false);
            }
            // If modal dismissed AFTER payment (race condition on some devices),
            // start polling anyway — the handler may have fired
            if (currentOrderId) {
              startPolling(currentOrderId || order.id);
            }
          },
        },
      };

      const rzp = new window.Razorpay(options);

      // Handle payment failure from Razorpay
      rzp.on('payment.failed', (response) => {
        stopPolling();
        setPollState('IDLE');
        setIsPaying(false);
        toast.error(`Payment failed: ${response.error?.description || 'Unknown error'}`);
      });

      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate payment');
      setIsPaying(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-64">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  const isFreeBooking = payment?.amount === 0 || payment?.razorpayOrderId?.startsWith('free_');
  const isPaid        = payment?.status === 'PAID' || pollState === 'SUCCESS';
  const isPolling     = pollState === 'POLLING';
  const isTimedOut    = pollState === 'TIMEOUT';
  const fee           = isFreeBooking ? 0 : 10;

  return (
    <DashboardLayout>
      <div className="page-container max-w-lg">
        <button
          onClick={() => navigate('/patient/appointments')}
          className="flex items-center gap-2 text-text-muted hover:text-text-primary mb-6 text-sm"
        >
          ← Back to appointments
        </button>

        <h1 className="text-2xl font-bold text-text-primary mb-6">Payment</h1>

        {/* ── Appointment summary ────────────────────────────────────────── */}
        <div className="card mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-primary-700 font-bold text-xl">
                {appointment?.doctor?.user?.name?.charAt(0) || 'D'}
              </span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-text-primary">
                Dr. {appointment?.doctor?.user?.name}
              </p>
              <p className="text-sm text-primary-600">{appointment?.doctor?.specialization}</p>
              <p className="text-sm text-text-muted">{appointment?.clinic?.name}</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-text-muted">Date</p>
              <p className="font-medium">
                {new Date(appointment?.appointmentDate).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </p>
            </div>
            <div>
              <p className="text-text-muted">Type</p>
              <p className="font-medium">{appointment?.appointmentType}</p>
            </div>
            {appointment?.queueNumber && (
              <div>
                <p className="text-text-muted">Queue #</p>
                <p className="font-medium">{appointment.queueNumber}</p>
              </div>
            )}
            <div>
              <p className="text-text-muted">Status</p>
              <StatusBadge status={appointment?.status} />
            </div>
          </div>
        </div>

        {/* ── Payment summary ────────────────────────────────────────────── */}
        <div className={`card mb-6 ${isFreeBooking ? 'border-emerald-200 bg-emerald-50/40' : ''}`}>
          <h2 className="font-semibold text-text-primary mb-4">Payment Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-muted">Booking Fee (Platform)</span>
              {isFreeBooking ? (
                <span className="flex items-center gap-1.5">
                  <span className="line-through text-gray-400 text-xs">₹10</span>
                  <span className="font-bold text-emerald-700">FREE</span>
                </span>
              ) : (
                <span className="font-semibold text-gray-900">₹10</span>
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Consultation Fee</span>
              <span className="text-gray-400 italic text-xs">
                Pay at clinic — ₹{appointment?.doctor?.consultationFee || 0}
              </span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between font-bold text-base">
              <span>Pay Now</span>
              <span className={isFreeBooking ? 'text-emerald-700' : 'text-primary-600'}>
                ₹{fee}
              </span>
            </div>
          </div>
          {isFreeBooking ? (
            <p className="text-xs text-emerald-600 mt-3 font-medium">
              🎁 First booking benefit — platform fee waived
            </p>
          ) : (
            <p className="text-xs text-gray-400 mt-3">
              Consultation fee is paid directly at the clinic after your visit.
            </p>
          )}
        </div>

        {/* ── Payment status / action ────────────────────────────────────── */}

        {/* FREE BOOKING — already confirmed */}
        {isFreeBooking && isPaid && (
          <div className="card bg-emerald-50 border-emerald-200 text-center py-6">
            <p className="text-4xl mb-3">🎉</p>
            <p className="font-semibold text-emerald-800 text-lg">First Booking Free!</p>
            <p className="text-sm text-emerald-700 mt-1">
              Your appointment is confirmed at no charge.
            </p>
          </div>
        )}

        {/* PAID — payment complete */}
        {!isFreeBooking && isPaid && (
          <div className="card bg-green-50 border-green-200 text-center py-6">
            <p className="text-4xl mb-3">✅</p>
            <p className="font-semibold text-green-800 text-lg">Payment Completed</p>
            {payment?.paidAt && (
              <p className="text-sm text-green-600 mt-1">
                Paid on {new Date(payment.paidAt).toLocaleDateString('en-IN')}
              </p>
            )}
            {payment?.razorpayPaymentId &&
              !payment.razorpayPaymentId.startsWith('dev_') &&
              !payment.razorpayPaymentId.startsWith('free_') && (
              <p className="text-xs text-green-500 mt-1">
                Transaction ID: {payment.razorpayPaymentId}
              </p>
            )}
            <button
              onClick={() => navigate('/patient/appointments')}
              className="mt-4 btn-primary px-6"
            >
              View Appointments
            </button>
          </div>
        )}

        {/* POLLING — payment processing, don't pay again */}
        {isPolling && (
          <div className="card border-amber-200 bg-amber-50 text-center py-6 space-y-3">
            <div className="flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
            <p className="font-semibold text-amber-800 text-lg">Payment Processing</p>
            <p className="text-sm text-amber-700 leading-relaxed max-w-xs mx-auto">
              ⚠️ <strong>Do not pay again.</strong> Your payment is being confirmed.
              We will update the status automatically.
            </p>
            <p className="text-xs text-amber-500">
              Checking... ({pollSeconds}s elapsed)
            </p>
            {/* Animated progress bar */}
            <div className="h-1.5 w-full bg-amber-200 rounded-full overflow-hidden mx-auto max-w-xs">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min((pollSeconds / 60) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* TIMEOUT — polling gave up */}
        {isTimedOut && (
          <div className="card border-orange-200 bg-orange-50 py-5 space-y-3">
            <p className="font-semibold text-orange-800">⏳ Payment Status Pending</p>
            <p className="text-sm text-orange-700 leading-relaxed">
              We could not confirm your payment automatically.
              If money was deducted from your account, <strong>do not pay again</strong> —
              your appointment will be confirmed within 24 hours once we receive confirmation from Razorpay.
            </p>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => startPolling(currentOrderId)}
                className="btn-primary flex-1 py-2.5 text-sm"
              >
                Check Again
              </button>
              <button
                onClick={() => navigate('/patient/appointments')}
                className="btn-outline flex-1 py-2.5 text-sm"
              >
                My Appointments
              </button>
            </div>
          </div>
        )}

        {/* PENDING — show pay button (only when not polling/paid/timeout) */}
        {!isPaid && !isPolling && !isTimedOut && (
          <div className="space-y-3">
            <button
              onClick={handleRazorpayPayment}
              disabled={isPaying}
              className="btn-primary w-full py-4 text-base font-semibold"
            >
              {isPaying ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" /> Processing...
                </span>
              ) : (
                `💳 Pay ₹${fee} via Razorpay`
              )}
            </button>
            <p className="text-xs text-center text-text-muted">
              Secured by Razorpay • UPI, Cards, Net Banking accepted
            </p>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default PaymentPage;
