import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getAppointmentDetails } from '../../api/patient.api';
import { initiatePayment, verifyPayment, getPaymentStatus } from '../../api/payment.api';
import api from '../../api/axios';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatusBadge from '../../components/ui/StatusBadge';
import toast from 'react-hot-toast';

// ── Poll payment status by Razorpay order ID ──────────────────────────────────
const getPaymentStatusByOrderId = (orderId) =>
  api.get(`/payments/status/${orderId}`);

const PaymentPage = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [payment, setPayment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  // Polling state — active when payment is PENDING after redirect
  const [isPolling, setIsPolling] = useState(false);
  const [pollSeconds, setPollSeconds] = useState(0);
  const pollIntervalRef = useRef(null);
  const currentOrderIdRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [apptRes, payRes] = await Promise.all([
          getAppointmentDetails(appointmentId),
          getPaymentStatus(appointmentId),
        ]);
        setAppointment(apptRes.data.data.appointment);
        setPayment(payRes.data.data.payment);
      } catch {
        toast.error('Failed to load payment details');
        navigate('/patient/appointments');
      } finally {
        setIsLoading(false);
      }
    };
    load();

    return () => stopPolling();
  }, [appointmentId, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Polling helpers ─────────────────────────────────────────────────────────
  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setIsPolling(false);
    setPollSeconds(0);
  };

  const startPolling = (orderId) => {
    currentOrderIdRef.current = orderId;
    setIsPolling(true);
    setPollSeconds(0);
    let elapsed = 0;
    const MAX_SECONDS = 60;

    pollIntervalRef.current = setInterval(async () => {
      elapsed += 3;
      setPollSeconds(elapsed);

      try {
        const res = await getPaymentStatusByOrderId(orderId);
        const { status, appointmentId: apptId } = res.data.data;

        if (status === 'PAID') {
          stopPolling();
          toast.success('✅ Payment confirmed!');
          navigate('/patient/appointments');
          return;
        }

        if (status === 'FAILED') {
          stopPolling();
          toast.error('Payment failed. Please try again.');
          // Reload page to show fresh state
          const payRes = await getPaymentStatus(appointmentId);
          setPayment(payRes.data.data.payment);
          return;
        }
      } catch {
        // Network error during poll — keep trying until timeout
      }

      if (elapsed >= MAX_SECONDS) {
        stopPolling();
        toast('Payment is still processing. Check back in a few minutes.', { icon: 'ℹ️', duration: 6000 });
      }
    }, 3000);
  };

  // ── Razorpay payment handler ─────────────────────────────────────────────────
  const handleRazorpayPayment = async () => {
    setIsPaying(true);
    try {
      const orderRes = await initiatePayment({
        doctorId: appointment.doctorId,
        clinicId: appointment.clinicId,
        appointmentType: appointment.appointmentType,
        appointmentDate: appointment.appointmentDate,
        slotTime: appointment.slotTime,
        symptoms: appointment.symptoms,
      });
      const { order, key, amount, devMode, isFree } = orderRes.data.data;

      if (isFree) {
        toast.success('🎉 Free booking confirmed!');
        navigate('/patient/appointments');
        return;
      }

      if (devMode) {
        await verifyPayment({
          appointmentId,
          razorpayOrderId: order.id,
          razorpayPaymentId: 'dev_pay_' + Date.now(),
          razorpaySignature: 'dev_sig',
        });
        toast.success('Payment successful (dev mode)');
        navigate('/patient/appointments');
        return;
      }

      // Load Razorpay SDK
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }

      const options = {
        key,
        amount: order.amount,
        currency: order.currency,
        name: 'PulseMate',
        description: `Consultation with Dr. ${appointment?.doctor?.user?.name}`,
        order_id: order.id,
        handler: async (response) => {
          // Payment succeeded on Razorpay — call verify endpoint
          try {
            await verifyPayment({
              appointmentId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            toast.success('Payment successful!');
            navigate('/patient/appointments');
          } catch {
            // Verify call failed — start polling (webhook may still confirm it)
            toast('Payment received. Confirming your booking...', { icon: '⏳', duration: 5000 });
            setIsPaying(false);
            startPolling(order.id);
          }
        },
        prefill: {
          name: appointment?.patient?.name || '',
        },
        theme: { color: '#6366F1' },
        modal: {
          ondismiss: () => {
            setIsPaying(false);
            // If user closed modal — check if payment actually went through
            // (possible on mobile where popup closes after deduction)
            startPolling(order.id);
            toast('Payment window closed. Checking payment status...', { icon: '🔍', duration: 4000 });
          },
        },
      };

      const rzp = new window.Razorpay(options);
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
  const isPaid = payment?.status === 'PAID';
  const isFailed = payment?.status === 'FAILED';
  const fee = isFreeBooking ? 0 : 10;

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

        {/* ── Polling banner — shown when payment is still processing ──────── */}
        {isPolling && (
          <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-5 h-5 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-800">Payment processing</p>
              <p className="text-sm text-amber-700 mt-0.5 leading-relaxed">
                Do not pay again. Your payment is being verified. We will update your booking automatically.
              </p>
              <p className="text-xs text-amber-500 mt-1">
                Checking... ({pollSeconds}s / 60s)
              </p>
            </div>
          </div>
        )}

        {/* Appointment summary */}
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

        {/* Payment summary */}
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

        {/* Payment status / action */}
        {isFreeBooking && isPaid ? (
          <div className="card bg-emerald-50 border-emerald-200 text-center py-6">
            <p className="text-4xl mb-3">🎉</p>
            <p className="font-semibold text-emerald-800 text-lg">First Booking Free!</p>
            <p className="text-sm text-emerald-700 mt-1">Your appointment is confirmed at no charge.</p>
            <p className="text-xs text-emerald-500 mt-2">Queue number assigned · No payment required</p>
          </div>
        ) : isPaid ? (
          <div className="card bg-green-50 border-green-200 text-center py-6">
            <p className="text-4xl mb-3">✅</p>
            <p className="font-semibold text-green-800 text-lg">Payment Completed</p>
            <p className="text-sm text-green-600 mt-1">
              Paid via {payment.method} on{' '}
              {new Date(payment.paidAt).toLocaleDateString('en-IN')}
            </p>
            {payment.razorpayPaymentId &&
              !payment.razorpayPaymentId.startsWith('dev_') &&
              !payment.razorpayPaymentId.startsWith('free_') && (
              <p className="text-xs text-green-500 mt-1">
                Transaction ID: {payment.razorpayPaymentId}
              </p>
            )}
          </div>
        ) : isFailed ? (
          <div className="space-y-4">
            <div className="card bg-red-50 border-red-200 text-center py-4">
              <p className="text-3xl mb-2">❌</p>
              <p className="font-semibold text-red-800">Payment Failed</p>
              <p className="text-sm text-red-600 mt-1">Your money has not been deducted. Please try again.</p>
            </div>
            <button
              onClick={handleRazorpayPayment}
              disabled={isPaying || isPolling}
              className="btn-primary w-full py-4 text-base font-semibold"
            >
              {isPaying ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" /> Processing...
                </span>
              ) : `💳 Retry Payment — ₹${fee}`}
            </button>
          </div>
        ) : (
          /* PENDING — show pay button */
          <div className="space-y-3">
            <button
              onClick={handleRazorpayPayment}
              disabled={isPaying || isPolling}
              className="btn-primary w-full py-4 text-base font-semibold"
            >
              {isPaying ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" /> Processing...
                </span>
              ) : isPolling ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" /> Verifying payment...
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
