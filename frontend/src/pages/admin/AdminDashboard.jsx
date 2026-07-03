import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import Modal from '../../components/ui/Modal';
import { getAdminDashboard, resetDatabase as resetDatabaseRequest } from '../../api/admin.api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import useAuthStore from '../../store/authStore';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) => (n ?? 0).toLocaleString('en-IN');
const fmtRupee = (n) => `₹${(n ?? 0).toLocaleString('en-IN')}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—';
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';
const fmtDateTime = (d) => d ? `${fmtDate(d)}, ${fmtTime(d)}` : '—';

// ── Icons ─────────────────────────────────────────────────────────────────────
const Icon = {
  Users: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-4.13a4 4 0 10-8 0 4 4 0 008 0zM21 8a4 4 0 10-8 0 4 4 0 008 0z" /></svg>,
  Patient: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  Doctor: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h6a2 2 0 002-2v-5M9 21H5a2 2 0 01-2-2v-5m0 0h18" /></svg>,
  Clinic: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  Clock: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Check: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  X: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Edit: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  Ban: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>,
  Gift: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a4 4 0 00-4-4H7a3 3 0 000 6h5m0-6a4 4 0 014-4h1a3 3 0 010 6h-5m-7 4h14a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1v-7a1 1 0 011-1z" /></svg>,
  Card: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
  Revenue: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 8h6m-5 0a3 3 0 110 6H9l3 6m-3-6h6m6 1a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  TrendUp: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
  Calendar: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  Trash: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
};

// ── Stat card ─────────────────────────────────────────────────────────────────
const SCHEMES = {
  blue:    { bg: 'bg-blue-50',    icon: 'text-blue-600',    dot: 'bg-blue-500'    },
  green:   { bg: 'bg-green-50',   icon: 'text-green-600',   dot: 'bg-green-500'   },
  yellow:  { bg: 'bg-yellow-50',  icon: 'text-yellow-600',  dot: 'bg-yellow-500'  },
  red:     { bg: 'bg-red-50',     icon: 'text-red-600',     dot: 'bg-red-500'     },
  orange:  { bg: 'bg-orange-50',  icon: 'text-orange-600',  dot: 'bg-orange-500'  },
  gray:    { bg: 'bg-gray-100',   icon: 'text-gray-500',    dot: 'bg-gray-400'    },
  indigo:  { bg: 'bg-indigo-50',  icon: 'text-indigo-600',  dot: 'bg-indigo-500'  },
  teal:    { bg: 'bg-teal-50',    icon: 'text-teal-600',    dot: 'bg-teal-500'    },
  emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', dot: 'bg-emerald-500' },
  violet:  { bg: 'bg-violet-50',  icon: 'text-violet-600',  dot: 'bg-violet-500'  },
  amber:   { bg: 'bg-amber-50',   icon: 'text-amber-600',   dot: 'bg-amber-500'   },
  cyan:    { bg: 'bg-cyan-50',    icon: 'text-cyan-600',    dot: 'bg-cyan-500'    },
  sky:     { bg: 'bg-sky-50',     icon: 'text-sky-600',     dot: 'bg-sky-500'     },
  rose:    { bg: 'bg-rose-50',    icon: 'text-rose-600',    dot: 'bg-rose-500'    },
};

const StatCard = ({ label, value, sub, icon: Ic, color = 'blue', loading }) => {
  const s = SCHEMES[color] || SCHEMES.blue;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${s.bg}`}>
          <span className={s.icon}><Ic /></span>
        </div>
        <span className={`w-2 h-2 rounded-full ${s.dot} opacity-60 group-hover:opacity-100 transition-opacity mt-1`} />
      </div>
      {loading ? (
        <>
          <div className="h-8 w-16 rounded-lg bg-gray-100 animate-pulse mb-2" />
          <div className="h-3 w-24 rounded bg-gray-100 animate-pulse" />
        </>
      ) : (
        <>
          <p className="text-3xl font-bold text-gray-900 leading-none mb-1">{value ?? 0}</p>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </>
      )}
    </div>
  );
};

// ── Section heading ───────────────────────────────────────────────────────────
const Section = ({ label }) => (
  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 mt-8 first:mt-0">{label}</p>
);

// ── Quick action card ─────────────────────────────────────────────────────────
const ActionCard = ({ to, emoji, bg, title, desc }) => (
  <Link to={to} className="group bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
      <span className="text-xl">{emoji}</span>
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-semibold text-gray-900 text-sm leading-tight">{title}</p>
      <p className="text-xs text-gray-500 mt-0.5 leading-snug">{desc}</p>
    </div>
    <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
  </Link>
);

// ── Badge ─────────────────────────────────────────────────────────────────────
const Badge = ({ free }) => free
  ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">🎁 Free</span>
  : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-100">💳 Paid</span>;

// ── Main Component ────────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const isRoot = currentUser?.adminLevel === 'ROOT';
  const canApprove = ['ROOT', 'SUPER_ADMIN', 'SUPPORT'].includes(currentUser?.adminLevel);

  useEffect(() => {
    getAdminDashboard()
      .then((r) => setData(r.data.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const stats = data?.stats ?? {};
  const bm = data?.bookingMetrics ?? {};
  const recentBookings = data?.recentBookings ?? [];
  const recentClinics = data?.recentVerifiedClinics ?? [];

  const handleReset = async () => {
    setResetting(true);
    try {
      await resetDatabaseRequest();
      toast.success('Database cleared. Sign in again.');
      setResetOpen(false);
      await logout();
      navigate('/admin', { replace: true });
    } catch (e) {
      toast.error(e.response?.data?.message || 'Reset failed');
    } finally {
      setResetting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="page-container max-w-screen-xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">PulseMate platform — live overview</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-50 border border-green-100">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-xs font-semibold text-green-700">Live</span>
          </div>
        </div>

        {/* ── Today's Snapshot ─────────────────────────────────────── */}
        <Section label="Today's Snapshot" />
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
          <StatCard label="Appointments Today" value={fmt(stats.appointmentsToday)} icon={Icon.Calendar} color="blue" loading={loading} sub="Booked + active today" />
          <StatCard label="Completed Today" value={fmt(stats.completedToday)} icon={Icon.Check} color="green" loading={loading} sub="Consultations done" />
          <StatCard label="Today's Revenue" value={fmtRupee(bm.todayRevenue)} icon={Icon.Revenue} color="cyan" loading={loading} sub="Platform fees collected" />
          <StatCard label="Pending Deletions" value={fmt(stats.pendingDeletionRequests)} icon={Icon.Trash} color={stats.pendingDeletionRequests > 0 ? 'red' : 'gray'} loading={loading} sub="Account deletion queue" />
        </div>

        {/* ── User Breakdown ───────────────────────────────────────── */}
        <Section label="User Breakdown" />
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
          <StatCard label="Total Users" value={fmt(stats.totalUsers)} icon={Icon.Users} color="blue" loading={loading} />
          <StatCard label="Patients" value={fmt(stats.patientCount)} icon={Icon.Patient} color="sky" loading={loading} />
          <StatCard label="Doctors" value={fmt(stats.doctorCount)} icon={Icon.Doctor} color="indigo" loading={loading} />
          <StatCard label="Clinic Owners" value={fmt(stats.clinicOwnerCount)} icon={Icon.Clinic} color="teal" loading={loading} />
        </div>

        {/* ── Clinic Status ────────────────────────────────────────── */}
        <Section label="Clinic Status" />
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
          <StatCard label="Verified Clinics" value={fmt(stats.verifiedClinics)} icon={Icon.Check} color="green" loading={loading} />
          <StatCard label="Pending Review" value={fmt((stats.pendingClinics ?? 0) + (stats.underReviewClinics ?? 0))} icon={Icon.Clock} color="yellow" loading={loading} sub={`${fmt(stats.pendingClinics)} pending · ${fmt(stats.underReviewClinics)} under review`} />
          <StatCard label="Changes Required" value={fmt(stats.changesRequiredClinics)} icon={Icon.Edit} color="orange" loading={loading} />
          <StatCard label="Rejected / Suspended" value={fmt((stats.rejectedClinics ?? 0) + (stats.suspendedClinics ?? 0))} icon={Icon.Ban} color="red" loading={loading} sub={`${fmt(stats.rejectedClinics)} rejected · ${fmt(stats.suspendedClinics)} suspended`} />
        </div>

        {/* ── Doctor Status ────────────────────────────────────────── */}
        <Section label="Doctor Status" />
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
          <StatCard label="Verified Doctors" value={fmt(stats.verifiedDoctors)} icon={Icon.Doctor} color="teal" loading={loading} />
          <StatCard label="Pending Doctors" value={fmt(stats.pendingDoctors)} icon={Icon.Clock} color="indigo" loading={loading} />
          <StatCard label="Total Appointments" value={fmt(stats.totalAppointments)} icon={Icon.Calendar} color="blue" loading={loading} sub="All-time confirmed" />
          <StatCard label="Avg Rev / Booking" value={fmtRupee(bm.revenuePerPatient)} icon={Icon.TrendUp} color="amber" loading={loading} sub="Paid bookings only" />
        </div>

        {/* ── Booking & Revenue ────────────────────────────────────── */}
        <Section label="Booking & Revenue" />
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Free Bookings" value={fmt(bm.freeBookings)} icon={Icon.Gift} color="emerald" loading={loading} sub="First-time free" />
          <StatCard label="Paid Bookings" value={fmt(bm.paidBookings)} icon={Icon.Card} color="violet" loading={loading} sub="₹10 platform fee" />
          <StatCard label="Conversion Rate" value={bm.conversionRate != null ? `${bm.conversionRate}%` : '—'} icon={Icon.TrendUp} color="amber" loading={loading} sub="Free → Paid repeat" />
          <StatCard label="Total Revenue" value={fmtRupee(bm.totalRevenue)} icon={Icon.Revenue} color="rose" loading={loading} sub="All-time platform fees" />
        </div>

        {/* ── Two-column: Recent Bookings + Recently Verified Clinics ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

          {/* Recent Bookings table — takes 2/3 width on large screens */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900 text-sm">Recent Bookings</p>
                <p className="text-xs text-gray-400 mt-0.5">Last 10 confirmed appointments</p>
              </div>
            </div>
            {loading ? (
              <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-gray-50 rounded-xl animate-pulse" />)}
              </div>
            ) : recentBookings.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">No bookings yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Patient</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Clinic</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Doctor</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Booked At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentBookings.map((b) => (
                      <tr key={b.paymentId} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3">
                          <p className="font-medium text-gray-900 text-xs">{b.patientName || 'Unknown'}</p>
                          <p className="text-gray-400 text-xs">{b.patientMobile}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-700 max-w-[120px] truncate">{b.clinicName}</td>
                        <td className="px-4 py-3 text-xs text-gray-700 max-w-[100px] truncate">{b.doctorName}</td>
                        <td className="px-4 py-3"><Badge free={b.isFree} /></td>
                        <td className="px-4 py-3 text-xs font-semibold text-gray-900">{b.isFree ? <span className="text-emerald-600">Free</span> : fmtRupee(b.amount)}</td>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtDateTime(b.paidAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recently Verified Clinics — 1/3 width */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <p className="font-semibold text-gray-900 text-sm">Recently Verified Clinics</p>
              <p className="text-xs text-gray-400 mt-0.5">Last 5 approved</p>
            </div>
            {loading ? (
              <div className="p-4 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />)}</div>
            ) : recentClinics.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">No verified clinics yet</div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {recentClinics.map((c) => (
                  <li key={c.id} className="px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-green-600"><Icon.Clinic /></span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-xs truncate">{c.name}</p>
                        <p className="text-xs text-gray-500">{[c.city, c.state].filter(Boolean).join(', ') || '—'}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{fmtDate(c.verifiedAt)}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="px-5 py-3 border-t border-gray-50">
              <Link to="/admin/clinics/verify" className="text-xs font-semibold text-blue-600 hover:text-blue-700">View all clinics →</Link>
            </div>
          </div>
        </div>

        {/* ── Quick Actions ─────────────────────────────────────────── */}
        <Section label="Quick Actions" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {canApprove && <ActionCard to="/admin/clinics/verify" emoji="🏥" bg="bg-blue-50" title="Clinic Verification" desc="Approve, reject, and manage clinic applications" />}
          <ActionCard to="/admin/users" emoji="👤" bg="bg-green-50" title="User Management" desc="Inspect users, approval states, and admin levels" />
          {canApprove && <ActionCard to="/admin/notifications" emoji="🔔" bg="bg-purple-50" title="Notification Campaigns" desc="Create, send, and manage user campaigns" />}
        </div>

        {/* ── Root Only: Reset Database ─────────────────────────────── */}
        {isRoot && (
          <div className="rounded-2xl border border-red-100 bg-red-50/60 p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-red-500">Root Admin Only</span>
                  <h2 className="text-base font-bold text-red-900 mt-0.5">Reset Database</h2>
                  <p className="mt-1 text-sm text-red-700/80 leading-relaxed max-w-xl">
                    Permanently deletes all clinics, users, appointments, queues, payments, sessions, and logs. A fresh root admin is recreated.
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setResetOpen(true)}
                className="inline-flex items-center gap-2 justify-center rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-all shadow-sm whitespace-nowrap flex-shrink-0">
                <Icon.Trash />
                Reset Database
              </button>
            </div>
          </div>
        )}

        {/* Reset Modal */}
        {isRoot && (
          <Modal isOpen={resetOpen} onClose={() => !resetting && setResetOpen(false)} title="Reset database" size="md">
            <div className="space-y-4">
              <p className="text-sm leading-6 text-slate-600">
                This permanently clears all data and recreates only the root admin account.
              </p>
              <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-700">
                <p>Email: <span className="font-semibold text-slate-900">sahilnaik1515@gmail.com</span></p>
                <p className="mt-1">Password: <span className="font-semibold text-slate-900">Nkabu18$</span></p>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setResetOpen(false)} disabled={resetting}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60">
                  Cancel
                </button>
                <button type="button" onClick={handleReset} disabled={resetting}
                  className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                  {resetting ? 'Resetting…' : 'Delete Everything'}
                </button>
              </div>
            </div>
          </Modal>
        )}

      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
