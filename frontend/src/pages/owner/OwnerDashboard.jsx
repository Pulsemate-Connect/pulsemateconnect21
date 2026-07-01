import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import useAuthStore from '../../store/authStore';
import { getMyClinics, getMyClinicStatus, resubmitClinic } from '../../api/clinic.api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

// ── New hooks & store ──────────────────────────────────────────────────────────
import useDashboardFilters from '../../hooks/useDashboardFilters';
import useDashboardData from '../../hooks/useDashboardData';
import useDashboardSocket from '../../hooks/useDashboardSocket';
import useAlertEngine from '../../hooks/useAlertEngine';
import useWidgetPreferences from '../../hooks/useWidgetPreferences';
import useExportService from '../../hooks/useExportService';
import useDashboardStore from '../../store/dashboardStore';

// ── Dashboard components ───────────────────────────────────────────────────────
import MetricCard from '../../components/dashboard/MetricCard';
import AlertsInsightsWidget from '../../components/dashboard/AlertsInsightsWidget';
import DashboardFilterBar from '../../components/dashboard/DashboardFilterBar';
import DashboardFilterDrawer, { FilterTriggerButton } from '../../components/dashboard/DashboardFilterDrawer';
import WidgetCustomizerModal from '../../components/dashboard/WidgetCustomizerModal';
import ConnectionStatusBadge from '../../components/dashboard/ConnectionStatusBadge';
import ExportButton from '../../components/dashboard/ExportButton';
import RecentTransactionsTable from '../../components/dashboard/RecentTransactionsTable';
import RevenueTrendChart from '../../components/dashboard/charts/RevenueTrendChart';
import AppointmentTrendChart from '../../components/dashboard/charts/AppointmentTrendChart';
import DoctorPerformanceBar from '../../components/dashboard/charts/DoctorPerformanceBar';

// ── API ────────────────────────────────────────────────────────────────────────
import { getDoctorList } from '../../api/dashboard.api';

// ─────────────────────────────────────────────────────────────────────────────
//  ErrorBoundary — wraps each widget so a single failure can't crash the page
// ─────────────────────────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

const WidgetErrorFallback = ({ id }) => (
  <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-sm text-red-600">
    Widget &quot;{id}&quot; failed to load.
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
//  STATUS CONFIG
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
//  StatusBanner
// ─────────────────────────────────────────────────────────────────────────────
const StatusBanner = ({ clinic, resubmitting, onResubmit }) => {
  const status = clinic?.approvalStatus || 'PENDING';
  const cfg    = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const reason = cfg.reasonKey ? clinic?.[cfg.reasonKey] : null;

  return (
    <div className={`rounded-2xl border p-5 mb-6 ${cfg.banner}`}>
      <div className="flex items-start gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xl ${cfg.iconBg}`}>
          {cfg.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 className="text-sm font-bold text-gray-900">{cfg.title}</h2>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.badge}`}>
              {cfg.label}
            </span>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{cfg.message}</p>
          {reason && (
            <div className="mt-3 bg-white/80 rounded-xl border border-white/60 px-4 py-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{cfg.reasonLabel}</p>
              <p className="text-sm text-gray-800 leading-relaxed">{reason}</p>
            </div>
          )}
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
          {cfg.canResubmit && (
            <div className="mt-4">
              <ClinicResubmitForm resubmitting={resubmitting} onResubmit={onResubmit} />
            </div>
          )}
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
//  ClinicResubmitForm
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
//  Mobile detection helper
// ─────────────────────────────────────────────────────────────────────────────
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

// ─────────────────────────────────────────────────────────────────────────────
//  OwnerDashboard
// ─────────────────────────────────────────────────────────────────────────────
const OwnerDashboard = () => {
  const { user } = useAuthStore();

  // ── Performance timing ──────────────────────────────────────────────────────
  const mountTime = React.useRef(performance.now());

  // ── Clinic status (always loaded) ──────────────────────────────────────────
  const [clinicStatus,  setClinicStatus]  = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [resubmitting,  setResubmitting]  = useState(false);

  // ── Clinic list ─────────────────────────────────────────────────────────────
  const [clinics,        setClinics]        = useState([]);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [loadingClinics, setLoadingClinics] = useState(false);

  // ── Enhanced dashboard UI state ─────────────────────────────────────────────
  const [customizerOpen,  setCustomizerOpen]  = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [txPage,           setTxPage]           = useState(1);
  const [doctors,          setDoctors]          = useState([]);

  const approvalStatus = clinicStatus?.approvalStatus || user?.approvalStatus || 'PENDING';
  const isVerified     = approvalStatus === 'VERIFIED';

  // ── Hooks (always called — React rules of hooks) ────────────────────────────
  const { filters, setFilter, clearAll, activeCount } =
    useDashboardFilters(selectedClinic?.id);

  const { data, chartData, comparisonData, loading } =
    useDashboardData(selectedClinic?.id, filters);

  const { alerts, dismiss } = useAlertEngine(data, comparisonData);

  const { widgets, isVisible, save: saveWidgets, reset: resetWidgets, saving: savingWidgets } =
    useWidgetPreferences(selectedClinic?.id);

  const { exporting, exportPDF, exportExcel } =
    useExportService(
      selectedClinic?.id,
      filters,
      {
        ...data,
        doctorPerformance: chartData?.doctorPerformance,
        transactions: data?.recentTransactions,
      },
    );

  // ── Socket callbacks via store ──────────────────────────────────────────────
  const socketCallbacks = React.useMemo(() => {
    const apply = useDashboardStore.getState().applyRealtimeUpdate;
    return {
      onNewAppointment:      (payload) => apply({ ...payload, type: 'new-appointment' }),
      onAppointmentCompleted:(payload) => apply({ ...payload, type: 'appointment-completed' }),
      onNewPayment:          (payload) => apply({ ...payload, type: 'new-payment' }),
      onQueueUpdated:        (payload) => apply({ ...payload, type: 'queue-updated' }),
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { connected, reconnecting } =
    useDashboardSocket(selectedClinic?.id, socketCallbacks, filters);

  // ── Load clinic status on mount ─────────────────────────────────────────────
  const loadStatus = useCallback(() => {
    setLoadingStatus(true);
    return getMyClinicStatus()
      .then((res) => setClinicStatus(res.data.data?.clinic || null))
      .catch(() => {})
      .finally(() => setLoadingStatus(false));
  }, []);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  // ── Load clinics when verified ──────────────────────────────────────────────
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

  // ── Load doctors for filter dropdown ───────────────────────────────────────
  useEffect(() => {
    if (!isVerified || !selectedClinic) return;
    getDoctorList(selectedClinic.id)
      .then((res) => setDoctors(res.data.data?.doctors || []))
      .catch(() => {});
  }, [isVerified, selectedClinic]);

  // ── Log performance when data arrives ──────────────────────────────────────
  useEffect(() => {
    if (!loading && data) {
      console.info('[Dashboard] Load time:', Math.round(performance.now() - mountTime.current), 'ms');
    }
  }, [loading, data]);

  // ── Resubmit handler ───────────────────────────────────────────────────────
  const handleResubmit = async (formData) => {
    setResubmitting(true);
    try {
      await resubmitClinic(formData);
      toast.success('Clinic resubmitted for review!');
      await loadStatus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resubmit');
    } finally {
      setResubmitting(false);
    }
  };

  // ── renderWidget ────────────────────────────────────────────────────────────
  const renderWidget = (id) => {
    const metrics     = data?.metrics;
    const comparison  = comparisonData?.comparison;

    switch (id) {
      case 'alerts-insights':
        return <AlertsInsightsWidget alerts={alerts} onDismiss={dismiss} />;

      case 'revenue-metrics':
        return (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <MetricCard icon="💰" label="Total Revenue"    value={metrics?.revenue?.total}            unit="₹" comparison={comparison?.revenue} />
            <MetricCard icon="💵" label="Cash Revenue"     value={metrics?.revenue?.cash}             unit="₹" />
            <MetricCard icon="💳" label="Online Revenue"   value={metrics?.revenue?.online}           unit="₹" />
            <MetricCard icon="📈" label="Avg / Appt"       value={metrics?.revenue?.avgPerAppointment} unit="₹" />
            <MetricCard icon="📊" label="Month Growth"     value={metrics?.revenue?.monthGrowth}      unit="%" />
          </div>
        );

      case 'patient-metrics':
        return (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <MetricCard icon="👥" label="Total Patients"    value={metrics?.patients?.total}     comparison={comparison?.patients} />
            <MetricCard icon="🆕" label="New Patients"      value={metrics?.patients?.new} />
            <MetricCard icon="🔁" label="Returning"         value={metrics?.patients?.returning} />
          </div>
        );

      case 'appointment-metrics':
        return (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <MetricCard icon="📅" label="Total Appts"       value={metrics?.appointments?.total}          comparison={comparison?.appointments} />
            <MetricCard icon="✅" label="Completed"         value={metrics?.appointments?.completed} />
            <MetricCard icon="❌" label="Cancelled"         value={metrics?.appointments?.cancelled} />
            <MetricCard icon="🚫" label="No-Show"           value={metrics?.appointments?.noShow} />
            <MetricCard icon="📉" label="Completion Rate"   value={metrics?.appointments?.completionRate}  unit="%" comparison={comparison?.completionRate} />
            <MetricCard icon="⏱️" label="Avg Wait"          value={metrics?.appointments?.avgWaitTime}     unit=" min" />
          </div>
        );

      case 'staff-metrics':
        return (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <MetricCard icon="👨‍⚕️" label="Active Staff"    value={metrics?.staff?.active} />
            <MetricCard icon="🩺"  label="Doctors"          value={metrics?.staff?.doctors} />
            <MetricCard icon="👩‍💼" label="Receptionists"   value={metrics?.staff?.receptionists} />
            <MetricCard icon="📊"  label="Utilization"      value={metrics?.staff?.utilizationRate}  unit="%" />
          </div>
        );

      case 'revenue-chart':
        return (
          <RevenueTrendChart
            data={chartData?.revenueTrend}
            granularity={chartData?.granularity}
            loading={loading}
            empty={!chartData?.revenueTrend?.length}
            isMobile={isMobile}
          />
        );

      case 'appointment-chart':
        return (
          <AppointmentTrendChart
            data={chartData?.appointmentTrend}
            loading={loading}
            empty={!chartData?.appointmentTrend?.length}
            isMobile={isMobile}
          />
        );

      case 'revenue-by-doctor':
        return (
          <DoctorPerformanceBar
            data={chartData?.doctorPerformance}
            loading={loading}
            empty={!chartData?.doctorPerformance?.length}
            isMobile={isMobile}
          />
        );

      case 'recent-transactions':
        return (
          <RecentTransactionsTable
            transactions={data?.recentTransactions}
            total={data?.total}
            page={txPage}
            onPageChange={setTxPage}
            loading={loading}
          />
        );

      case 'quick-actions':
        return (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { to: '/clinic/profile',       icon: '🏥', label: 'Manage Clinic',  color: 'bg-blue-50 text-blue-600'    },
              { to: '/clinic/doctors',       icon: '👨‍⚕️', label: 'Doctors',       color: 'bg-green-50 text-green-600'  },
              { to: '/clinic/receptionists', icon: '👩‍💼', label: 'Receptionists', color: 'bg-purple-50 text-purple-600' },
              { to: '/clinic/appointments',  icon: '📅', label: 'Appointments',   color: 'bg-orange-50 text-orange-600' },
              { to: '/clinic/queue',         icon: '🔢', label: 'Queue Overview', color: 'bg-red-50 text-red-600'       },
            ].map((a) => (
              <Link key={a.to} to={a.to} className="card-hover flex flex-col items-center gap-2 py-4 text-center">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${a.color}`}>{a.icon}</div>
                <span className="text-sm font-medium text-gray-800">{a.label}</span>
              </Link>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loadingStatus) {
    return (
      <DashboardLayout>
        <div className="page-container">
          <div className="rounded-2xl bg-gray-100 animate-pulse h-32 mb-6" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-gray-100 animate-pulse h-24" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="page-container">

        {/* ── Status Banner (always visible) ───────────────────────── */}
        <StatusBanner
          clinic={clinicStatus}
          resubmitting={resubmitting}
          onResubmit={handleResubmit}
        />

        {/* ── VERIFIED branch — full enhanced dashboard ─────────────── */}
        {isVerified ? (
          <>
            {/* Clinic selector (multi-clinic) */}
            {loadingClinics ? (
              <div className="flex justify-center py-4"><LoadingSpinner /></div>
            ) : clinics.length > 1 ? (
              <div className="mb-4">
                <select
                  className="input text-sm py-1.5 max-w-[220px]"
                  value={selectedClinic?.id || ''}
                  onChange={(e) => setSelectedClinic(clinics.find((c) => c.id === e.target.value))}
                >
                  {clinics.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            ) : null}

            {/* Dashboard header */}
            <div className="mb-5 flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Clinic Dashboard</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Welcome back, <span className="font-semibold text-gray-700">{user?.name}</span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <ConnectionStatusBadge connected={connected} reconnecting={reconnecting} />
                <ExportButton
                  exporting={exporting}
                  onExportPDF={() => exportPDF(selectedClinic)}
                  onExportExcel={exportExcel}
                />
                <button
                  onClick={() => setCustomizerOpen(true)}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-xl bg-white text-gray-700 hover:border-blue-300 hover:text-blue-600 transition-colors"
                >
                  ⚙️ <span className="hidden sm:inline">Customize</span>
                </button>
              </div>
            </div>

            {/* Filter bar — desktop */}
            <DashboardFilterBar
              filters={filters}
              doctors={doctors}
              onFilterChange={setFilter}
              onClearAll={clearAll}
              activeCount={activeCount}
              loading={loading}
              resultCount={data?.filteredCount}
            />

            {/* Filter trigger + drawer — mobile */}
            <FilterTriggerButton
              onClick={() => setFilterDrawerOpen(true)}
              activeCount={activeCount}
            />
            <DashboardFilterDrawer
              open={filterDrawerOpen}
              onClose={() => setFilterDrawerOpen(false)}
              filters={filters}
              doctors={doctors}
              onFilterChange={setFilter}
              onClearAll={clearAll}
              activeCount={activeCount}
              loading={loading}
            />

            {/* Widget grid */}
            <div className="space-y-6 mt-6">
              {[...widgets].sort((a, b) => a.order - b.order).map((widget) => {
                if (!isVisible(widget.id)) return null;
                return (
                  <ErrorBoundary key={widget.id} fallback={<WidgetErrorFallback id={widget.id} />}>
                    <div className="transition-all duration-300">
                      {renderWidget(widget.id)}
                    </div>
                  </ErrorBoundary>
                );
              })}
            </div>

            {/* Widget customizer modal */}
            <WidgetCustomizerModal
              open={customizerOpen}
              widgets={widgets}
              saving={savingWidgets}
              onSave={(updated) => { saveWidgets(updated); setCustomizerOpen(false); }}
              onCancel={() => setCustomizerOpen(false)}
              onReset={() => { resetWidgets(); setCustomizerOpen(false); }}
            />
          </>
        ) : (
          /* ── Non-operational: show clinic info card ─────────────── */
          clinicStatus && (
            <div className="card">
              <h2 className="text-sm font-bold text-gray-900 mb-3">Clinic Information</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
                {[
                  { label: 'Clinic Name', value: clinicStatus.name       },
                  { label: 'City',        value: clinicStatus.city       },
                  { label: 'State',       value: clinicStatus.state      },
                  { label: 'Clinic Type', value: clinicStatus.clinicType },
                  { label: 'Phone',       value: clinicStatus.phone      },
                  {
                    label: 'Submitted',
                    value: clinicStatus.submittedAt
                      ? new Date(clinicStatus.submittedAt).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })
                      : null,
                  },
                ].map(({ label, value }) =>
                  value ? (
                    <div key={label}>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
                      <p className="text-sm text-gray-800 mt-0.5 font-medium">{value}</p>
                    </div>
                  ) : null,
                )}
              </div>
            </div>
          )
        )}
      </div>
    </DashboardLayout>
  );
};

export default OwnerDashboard;
