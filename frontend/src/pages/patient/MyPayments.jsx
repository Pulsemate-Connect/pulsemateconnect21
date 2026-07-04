import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getMyPayments, requestRefund } from '../../api/payment.api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const STATUS_STYLE = {
  PAID:     { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Paid'     },
  PENDING:  { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending'  },
  FAILED:   { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Failed'   },
  REFUNDED: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Refunded' },
};

const METHOD_ICON = { RAZORPAY: '💳', CASH: '💵', UPI: '📱' };

// ── Summary Card ──────────────────────────────────────────────────────────────
const SummaryCard = ({ label, value, sub, color = 'text-gray-900' }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

// ── Payment Row ───────────────────────────────────────────────────────────────
const PaymentRow = ({ pay, onRefund, refundingId }) => {
  const st = STATUS_STYLE[pay.status] || STATUS_STYLE.PENDING;
  const isFree = pay.amount === 0 && pay.status === 'PAID';
  const isPaid = pay.status === 'PAID' && !isFree;
  const canRefund = isPaid && pay.appointment?.status !== 'COMPLETED' && pay.appointment?.status !== 'CANCELLED';
  const txnId = pay.razorpayPaymentId && !pay.razorpayPaymentId.startsWith('free_') && !pay.razorpayPaymentId.startsWith('dev_');

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        {/* Method icon */}
        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl">
          {isFree ? '🎁' : (METHOD_ICON[pay.method] || '💳')}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-gray-900 text-sm">
                Dr. {pay.appointment?.doctor?.user?.name || 'Doctor'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {pay.appointment?.clinic?.name || '—'}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              {isFree ? (
                <span className="text-base font-bold text-emerald-600">FREE</span>
              ) : (
                <span className="text-base font-bold text-gray-900">₹{pay.amount}</span>
              )}
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>
                {st.label}
              </span>
            </div>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-400">
            <span>📅 {fmtDate(pay.appointment?.appointmentDate)}</span>
            {pay.paidAt && <span>✅ Paid {fmtDateTime(pay.paidAt)}</span>}
            <span>{pay.method}</span>
          </div>

          {/* Transaction ID */}
          {txnId && (
            <div className="mt-2 flex items-center gap-1.5">
              <svg className="w-3 h-3 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <span className="text-xs text-gray-300 truncate font-mono">{pay.razorpayPaymentId}</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      {(canRefund || pay.appointment?.id) && (
        <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-3">
          {pay.appointment?.id && (
            <Link to={`/patient/appointments`} className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              View Appointment →
            </Link>
          )}
          {canRefund && (
            <button
              onClick={() => onRefund(pay)}
              disabled={refundingId === pay.id}
              className="ml-auto text-xs font-semibold text-red-500 hover:text-red-600 transition-colors disabled:opacity-50"
            >
              {refundingId === pay.id ? 'Processing...' : '↩ Request Refund'}
            </button>
          )}
          {pay.status === 'REFUNDED' && (
            <span className="ml-auto text-xs font-semibold text-purple-500">↩ Refunded</span>
          )}
        </div>
      )}
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const MyPayments = () => {
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refundingId, setRefundingId] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 20;

  const load = useCallback(async (p = 1) => {
    setIsLoading(true);
    try {
      const res = await getMyPayments({ page: p, limit: LIMIT });
      const data = res.data.data;
      setPayments(data.payments || []);
      setTotal(data.total || 0);
      setPage(p);
    } catch {
      toast.error('Failed to load payment history');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(1); }, [load]);

  const handleRefund = async (pay) => {
    if (!window.confirm(`Request a refund of ₹${pay.amount} for this booking?`)) return;
    setRefundingId(pay.id);
    try {
      await requestRefund({ appointmentId: pay.appointmentId, reason: 'Patient requested refund' });
      toast.success('Refund requested. It may take 3–5 business days.');
      load(page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Refund request failed');
    } finally {
      setRefundingId(null);
    }
  };

  // Summary stats
  const paid = payments.filter((p) => p.status === 'PAID');
  const totalPaid = paid.reduce((s, p) => s + (p.amount || 0), 0);
  const freeCount = paid.filter((p) => p.amount === 0).length;
  const paidCount = paid.filter((p) => p.amount > 0).length;
  const pendingCount = payments.filter((p) => p.status === 'PENDING').length;

  return (
    <DashboardLayout>
      <div className="page-container max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/patient/home" className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payment History</h1>
            <p className="text-sm text-gray-400 mt-0.5">All your booking transactions</p>
          </div>
        </div>

        {/* Summary cards */}
        {!isLoading && payments.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <SummaryCard label="Total Paid" value={`₹${totalPaid}`} sub="Platform fees" color="text-blue-600" />
            <SummaryCard label="Paid Bookings" value={paidCount} sub="₹10 each" />
            <SummaryCard label="Free Bookings" value={freeCount} sub="First-time benefit" color="text-emerald-600" />
            <SummaryCard label="Pending" value={pendingCount} sub="Awaiting payment" color={pendingCount > 0 ? 'text-amber-600' : 'text-gray-400'} />
          </div>
        )}

        {/* List */}
        {isLoading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
        ) : payments.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">💳</p>
            <p className="font-semibold text-gray-700 text-lg">No payments yet</p>
            <p className="text-gray-400 text-sm mt-1 mb-6">Your booking payment history will appear here</p>
            <Link to="/patient/search" className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors">
              Book an Appointment
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((pay) => (
              <PaymentRow key={pay.id} pay={pay} onRefund={handleRefund} refundingId={refundingId} />
            ))}

            {/* Pagination */}
            {total > LIMIT && (
              <div className="flex items-center justify-center gap-3 pt-4">
                <button onClick={() => load(page - 1)} disabled={page === 1}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                  ← Previous
                </button>
                <span className="text-sm text-gray-400">Page {page} of {Math.ceil(total / LIMIT)}</span>
                <button onClick={() => load(page + 1)} disabled={page >= Math.ceil(total / LIMIT)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                  Next →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyPayments;
