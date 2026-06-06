import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import useAuthStore from '../../store/authStore';
import { getMyClinics, getClinicRevenue, getMyClinicStatus, resubmitClinic } from '../../api/clinic.api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
//  STATUS CONFIG  — messages, colours, icon per approval state
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  PENDING: {
    icon: '⏳',
    label: 'Pending Verification',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    banner: 'bg-amber-50 border-amber-200',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    title: 'Verification in progress',
    message:
      'Your clinic verification is pending. Our admin team is reviewing your details. ' +
      'You cannot receive bookings or add staff until your clinic is approved.',
    showBlockedFeatures: true,
    canResubmit: false,
  },
  UNDER_REVIEW: {
    icon: '🔍',
    label: 'Under Review',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    banner: 'bg-blue-50 border-blue-200',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    title: 'Under admin review',
    message:
      'Your clinic is currently being reviewed by our admin team. ' +
      'This usually takes 1–2 business days. You will be notified once a decision is made.',
    showBlockedFeatures: true,
    canResubmit: false,
  },
  VERIFIED: {
    icon: '✅',
    label: 'Verified',
    badge: 'bg-green-100 text-green-800 border-green-200',
    banner: 'bg-green-50 border-green-200',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    title: 'Clinic verified',
    message:
      'Your clinic is verified and live. You can add doctors, receptionists, receive bookings, and manage your queue.',
    showBlockedFeatures: false,
    canResubmit: false,
  },
  REJECTED: {
    icon: '❌',
    label: 'Rejected',
    badge: 'bg-red-100 text-red-800 border-red-200',
    banner: 'bg-red-50 border-red-200',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    title: 'Verification rejected',
    message:
      'Your clinic verification was rejected. Please review the reason below, update your information, and resubmit.',
    showBlockedFeatures: true,
    canResubmit: true,
    reasonLabel: 'Rejection reason',
    reasonKey: 'rejectionReason',
  },
  CHANGES_REQUIRED: {
    icon: '✏️',
    label: 'Changes Required',
    badge: 'bg-orange-100 text-orange-800 border-orange-200',
    banner: 'bg-orange-50 border-orange-200',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    title: 'Changes required',
    message:
      'Our admin team has reviewed your clinic and requires some changes before approval. ' +
      'Please review the note below, update your details, and resubmit.',
    showBlockedFeatures: true,
    canResubmit: true,
    reasonLabel: 'Changes requested by admin',
    reasonKey: 'changesRequestedReason',
  },
  SUSPENDED: {
    icon: '🚫',
    label: 'Suspended',
    badge: 'bg-red-100 text-red-800 border-red-200',
    banner: 'bg-red-50 border-red-200',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    title: 'Your clinic has been suspended',
    message:
      'Your clinic has been suspended by PulseMate admin. All bookings, patient visibility, ' +
      'appointments, and queue management are disabled until the suspension is lifted. ' +
      'Please review the reason below and contact PulseMate support to resolve this.',
    showBlockedFeatures: true,
    canResubmit: false,
    reasonLabel: 'Suspension reason',
    reasonKey: 'suspendedReason',
    showSupportContact: true,
  },
};

const BLOCKED_FEATURES = [
  { icon: '👨‍⚕️', label: 'Add doctors' },
  { icon: '👩‍💼', label: 'Add receptionists' },
  { icon: '📅', label: 'Receive bookings' },
  { icon: '🔍', label: 'Appear in patient search' },
  { icon: '🔢', label: 'Manage queue' },
  { icon: '✅', label: 'Accept appointments' },
];

const ACTIVE_FEATURES = [
  { icon: '👨‍⚕️', label: 'Add doctors' },
  { icon: '👩‍💼', label: 'Add receptionists' },
  { icon: '📅', label: 'Receive bookings' },
  { icon: '🔍', label: 'Appear in patient search' },
  { icon: '🔢', label: 'Manage queue' },
  { icon: '✅', label: 'Accept appointments' },
];

// ─────────────────────────────────────────────────────────────────────────────
//  StatusBanner — shown at top of dashboard for every non-VERIFIED status,
//  and as a green confirmation card when VERIFIED
// ─────────────────────────────────────────────────────────────────────────────
const StatusBanner = ({ clinic, resubmitting, onResubmit }) => {
  const status  = clinic?.approvalStatus || 'PENDING';
  const cfg     = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const reason  = cfg.reasonKey ? clinic?.[cfg.reasonKey] : null;

  return (
    <div className={`rounded-2xl border p-5 mb-6 ${cfg.banner}`}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xl ${cfg.iconBg}`}>
          {cfg.icon}
        </div>

        <div className="flex-1 min-w-0">
          {/* Title + badge row */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 className="text-sm font-bold text-gray-900">{cfg.title}</h2>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.badge}`}>
              {cfg.label}
            </span>
          </div>

          {/* Message */}
          <p className="text-sm text-gray-600 leading-relaxed">{cfg.message}</p>

          {/* Admin reason box */}
          {reason && (
            <div className="mt-3 bg-white/80 rounded-xl border border-white/60 px-4 py-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{cfg.reasonLabel}</p>
              <p className="text-sm text-gray-800 leading-relaxed">{reason}</p>
            </div>
          )}

          {/* Blocked features grid */}
          {cfg.showBlockedFeatures && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {BLOCKED_FEATURES.map((f) => (
                <div key={f.label} className="flex items-center gap-2 bg-white/60 rounded-lg px-3 py-2 text-xs text-gray-500">
                  <span className="opacity-40">{f.icon}</span>
                  <span className="line-through">{f.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Active features (VERIFIED) */}
          {status === 'VERIFIED' && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ACTIVE_FEATURES.map((f) => (
                <div key={f.label} className="flex items-center gap-2 bg-white/80 rounded-lg px-3 py-2 text-xs text-green-700 font-medium">
                  <span>✓</span>
                  {f.label}
                </div>
              ))}
            </div>
          )}

          {/* Resubmit actions */}
          {cfg.canResubmit && (
            <div className="mt-4">
              <ClinicResubmitForm
                resubmitting={resubmitting}
                onResubmit={onResubmit}
              />
            </div>
          )}

          {/* Support contact for suspended clinics */}
          {cfg.showSupportContact && (
            <div className="mt-4 flex items-center gap-3 bg-white/80 rounded-xl border border-white/60 px-4 py-3">
              <span className="text-xl">📞</span>
              <div>
                <p className="text-xs font-bold text-gray-700">Need help? Contact PulseMate Support</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Email us at{' '}
                  <a href="mailto:support@pulsemate.in" className="text-blue-600 hover:underline font-medium">
                    support@pulsemate.in
                  </a>
                  {' '}with your clinic name and registered mobile number.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  ClinicResubmitForm — buttons to go to the full edit page or resubmit as-is
// ─────────────────────────────────────────────────────────────────────────────
const ClinicResubmitForm = ({ resubmitting, onResubmit }) => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => navigate('/clinic/edit-resubmit')}
        className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
      >
        ✏️ Edit &amp; Resubmit
      </button>
      <button
        type="button"
        disabled={resubmitting}
        onClick={() => onResubmit({})}
        className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
      >
        {resubmitting ? 'Resubmitting…' : 'Resubmit as-is'}
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  StatCard
// ─────────────────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon, color, big }) => (
  <div className={`card text-center ${big ? 'col-span-2 sm:col-span-1' : ''}`}>
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mx-auto mb-2 ${color}`}>
      {icon}
    </div>
    <p className={`font-bold ${big ? 'text-2xl' : 'text-xl'} text-gray-900`}>{value}</p>
    <p className="text-xs text-gray-500 mt-1">{label}</p>
  </div>
);

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: 'week',  label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'all',   label: 'All Time' },
];

// ─────────────────────────────────────────────────────────────────────────────
//  OwnerDashboard
// ─────────────────────────────────────────────────────────────────────────────
const OwnerDashboard = () => {
  const { user, refreshUser } = useAuthStore();

  // Always load clinic status regardless of approval state
  const [clinicStatus, setClinicStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [resubmitting, setResubmitting] = useState(false);

  // Operational data (only used when VERIFIED)
  const [clinics,        setClinics]       = useState([]);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [period,         setPeriod]         = useState('today');
  const [revenue,        setRevenue]        = useState(null);
  const [loadingClinics, setLoadingClinics] = useState(false);
  const [loadingRevenue, setLoadingRevenue] = useState(false);

  const approvalStatus = clinicStatus?.approvalStatus || user?.approvalStatus || 'PENDING';
  const isVerified     = approvalStatus === 'VERIFIED';

  // ── Load clinic status (always, on mount) ──────────────────────────────────
  const loadStatus = useCallback(() => {
    setLoadingStatus(true);
    return getMyClinicStatus()
      .then((res) => setClinicStatus(res.data.data?.clinic || null))
      .catch(() => {})
      .finally(() => setLoadingStatus(false));
  }, []);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  // ── Load clinic list + revenue only when verified ──────────────────────────
  useEffect(() => {
    if (!isVerified) return;
    setLoadingClinics(true);
    getMyClinics()
      .then((res) => {
        const list = res.data.data?.clinics || [];
        setClinics(list);
        if (list.length > 0) setSelectedClinic(list[0]);
      })
      .catch(() => toast.error('Failed to load clinics'))
      .finally(() => setLoadingClinics(false));
  }, [isVerified]);

  useEffect(() => {
    if (!isVerified || !selectedClinic) return;
    setLoadingRevenue(true);
    getClinicRevenue(selectedClinic.id, period)
      .then((res) => setRevenue(res.data.data))
      .catch(() => toast.error('Failed to load revenue'))
      .finally(() => setLoadingRevenue(false));
  }, [selectedClinic, period, isVerified]);

  // ── Resubmit handler ───────────────────────────────────────────────────────
  const handleResubmit = async (data) => {
    setResubmitting(true);
    try {
      await resubmitClinic(data);
      toast.success('Clinic resubmitted for review!');
      if (refreshUser) await refreshUser();
      await loadStatus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resubmit');
    } finally {
      setResubmitting(false);
    }
  };

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loadingStatus) {
    return (
      <DashboardLayout>
        <div className="page-container">
          {/* Skeleton banner */}
          <div className="rounded-2xl bg-gray-100 animate-pulse h-32 mb-6" />
          {/* Skeleton cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-gray-100 animate-pulse h-24" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="page-container">

        {/* ── Page header ────────────────────────────────────────────── */}
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Clinic Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Welcome back, <span className="font-semibold text-gray-700">{user?.name}</span>
          </p>
        </div>

        {/* ── Status Banner (always visible) ─────────────────────────── */}
        <StatusBanner
          clinic={clinicStatus}
          resubmitting={resubmitting}
          onResubmit={handleResubmit}
        />

        {/* ── Quick Actions ── only when VERIFIED ──────────────────────── */}
        {isVerified ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
              {[
                { to: '/clinic/profile',        icon: '🏥', label: 'Manage Clinic',  color: 'bg-blue-50 text-blue-600'   },
                { to: '/clinic/doctors',        icon: '👨‍⚕️', label: 'Doctors',        color: 'bg-green-50 text-green-600' },
                { to: '/clinic/receptionists',  icon: '👩‍💼', label: 'Receptionists',  color: 'bg-purple-50 text-purple-600'},
                { to: '/clinic/appointments',   icon: '📅', label: 'Appointments',   color: 'bg-orange-50 text-orange-600'},
                { to: '/clinic/queue',          icon: '🔢', label: 'Queue Overview', color: 'bg-red-50 text-red-600'     },
              ].map((a) => (
                <Link key={a.to} to={a.to}
                  className="card-hover flex flex-col items-center gap-2 py-4 text-center">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${a.color}`}>{a.icon}</div>
                  <span className="text-sm font-medium text-gray-800">{a.label}</span>
                </Link>
              ))}
            </div>

            {/* Revenue section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <h2 className="text-lg font-bold text-gray-900">💰 Revenue</h2>
                <div className="flex items-center gap-2 flex-wrap">
                  {clinics.length > 1 && (
                    <select className="input text-sm py-1.5 max-w-[180px]"
                      value={selectedClinic?.id || ''}
                      onChange={(e) => setSelectedClinic(clinics.find((c) => c.id === e.target.value))}>
                      {clinics.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  )}
                  <div className="flex rounded-xl border border-gray-200 overflow-hidden">
                    {PERIODS.map((p) => (
                      <button key={p.key} onClick={() => setPeriod(p.key)}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                          period === p.key ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
                        }`}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {loadingRevenue ? (
                <div className="flex justify-center py-10"><LoadingSpinner size="lg" /></div>
              ) : revenue ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <StatCard label="Total Revenue"   value={fmt(revenue.totalRevenue)}   icon="💰" color="bg-green-50 text-green-700"  big />
                    <StatCard label="Cash Collected"  value={fmt(revenue.cashRevenue)}    icon="💵" color="bg-blue-50 text-blue-700"   />
                    <StatCard label="Online Payments" value={fmt(revenue.onlineRevenue)}  icon="💳" color="bg-purple-50 text-purple-700"/>
                    <StatCard label="Transactions"    value={revenue.transactionCount}    icon="🧾" color="bg-orange-50 text-orange-700"/>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <StatCard label="Today's Appts"   value={revenue.stats?.totalAppointments ?? 0} icon="📅" color="bg-gray-50 text-gray-700"   />
                    <StatCard label="Completed Today" value={revenue.stats?.completedToday ?? 0}    icon="✅" color="bg-green-50 text-green-700" />
                    <StatCard label="Pending Payment" value={revenue.stats?.pendingPayments ?? 0}   icon="⏳" color="bg-yellow-50 text-yellow-700"/>
                  </div>

                  {revenue.revenueByDoctor?.length > 0 && (
                    <div className="card mb-6">
                      <h3 className="font-semibold text-gray-900 mb-4">Revenue by Doctor</h3>
                      <div className="space-y-3">
                        {revenue.revenueByDoctor.map(({ doctor, amount }) => {
                          const pct = revenue.totalRevenue > 0 ? Math.round((amount / revenue.totalRevenue) * 100) : 0;
                          return (
                            <div key={doctor}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-gray-800">{doctor}</span>
                                <span className="text-sm font-bold text-green-600">{fmt(amount)}</span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-2">
                                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {revenue.recentPayments?.length > 0 ? (
                    <div className="card">
                      <h3 className="font-semibold text-gray-900 mb-4">Recent Transactions</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-100 text-left text-gray-500 text-xs uppercase tracking-wide">
                              <th className="pb-2 pr-4">Patient</th>
                              <th className="pb-2 pr-4">Doctor</th>
                              <th className="pb-2 pr-4">Method</th>
                              <th className="pb-2 pr-4">Amount</th>
                              <th className="pb-2">Time</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {revenue.recentPayments.map((p) => (
                              <tr key={p.id} className="hover:bg-gray-50">
                                <td className="py-2.5 pr-4 font-medium text-gray-800">{p.patient?.name || '—'}</td>
                                <td className="py-2.5 pr-4 text-gray-500">{p.appointment?.doctor?.user?.name || '—'}</td>
                                <td className="py-2.5 pr-4">
                                  <span className={`badge text-xs ${p.method === 'CASH' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {p.method === 'CASH' ? '💵 Cash' : '💳 Online'}
                                  </span>
                                </td>
                                <td className="py-2.5 pr-4 font-bold text-green-600">{fmt(p.amount)}</td>
                                <td className="py-2.5 text-gray-400 text-xs">
                                  {p.paidAt ? new Date(p.paidAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="card text-center py-8 text-gray-500">
                      <p className="text-3xl mb-2">💸</p>
                      <p className="font-medium">No transactions {period === 'today' ? 'today' : `this ${period}`}</p>
                      <p className="text-sm mt-1 text-gray-400">Revenue will appear here once patients pay</p>
                    </div>
                  )}
                </>
              ) : null}
            </div>

            {/* My Clinics list */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">My Clinics</h2>
              </div>
              {loadingClinics ? (
                <div className="flex justify-center py-8"><LoadingSpinner /></div>
              ) : clinics.length === 0 ? (
                <div className="card text-center py-10 text-gray-400">
                  <p className="text-3xl mb-2">🏥</p>
                  <p className="font-medium text-gray-600">No clinics found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {clinics.map((clinic) => (
                    <Link key={clinic.id} to={`/clinic/profile/${clinic.id}`} className="card-hover block">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{clinic.name}</h3>
                          <p className="text-sm text-gray-500 mt-0.5">📍 {clinic.city}</p>
                          <p className="text-sm text-gray-500">🕐 {clinic.openingTime} – {clinic.closingTime}</p>
                        </div>
                        <span className={`badge ${clinic.isVerified ? 'badge-success' : 'badge-warning'}`}>
                          {clinic.isVerified ? '✓ Verified' : 'Pending'}
                        </span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-100 flex gap-4 text-sm text-gray-400">
                        <span>👥 {clinic._count?.staff || 0} staff</span>
                        <span>📅 {clinic._count?.appointments || 0} appointments</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          /* ── Non-operational: show clinic info card ─── */
          clinicStatus && (
            <div className="card">
              <h2 className="text-sm font-bold text-gray-900 mb-3">Clinic Information</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
                {[
                  { label: 'Clinic Name',   value: clinicStatus.name        },
                  { label: 'City',          value: clinicStatus.city        },
                  { label: 'State',         value: clinicStatus.state       },
                  { label: 'Clinic Type',   value: clinicStatus.clinicType  },
                  { label: 'Phone',         value: clinicStatus.phone       },
                  { label: 'Submitted',     value: clinicStatus.submittedAt
                    ? new Date(clinicStatus.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                    : null },
                ].map(({ label, value }) => value ? (
                  <div key={label}>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
                    <p className="text-sm text-gray-800 mt-0.5 font-medium">{value}</p>
                  </div>
                ) : null)}
              </div>
            </div>
          )
        )}
      </div>
    </DashboardLayout>
  );
};

export default OwnerDashboard;
