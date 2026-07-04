import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import useAuthStore from '../../store/authStore';
import { getMyAppointments, getPatientProfile, searchDoctors } from '../../api/patient.api';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

// ── Helpers ───────────────────────────────────────────────────────────────────
const calcCompletion = (user, p) => {
  const checks = [!!user?.name, !!p?.gender, !!(p?.dob || p?.age), !!(p?.city || p?.address), !!p?.emergencyContact];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
};

const fmtDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  const today = new Date(); today.setHours(0,0,0,0);
  const isToday = date.toDateString() === today.toDateString();
  const str = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return isToday ? `Today` : str;
};

// ── Health tips ───────────────────────────────────────────────────────────────
const HEALTH_TIPS = [
  { emoji: '💧', title: 'Stay Hydrated', tip: 'Drink at least 8 glasses of water daily to keep your body functioning optimally.' },
  { emoji: '🚶', title: 'Walk Daily', tip: '30 minutes of walking a day significantly reduces the risk of heart disease.' },
  { emoji: '😴', title: 'Sleep Well', tip: '7–9 hours of quality sleep boosts immunity and mental clarity.' },
  { emoji: '🥦', title: 'Eat Green', tip: 'Include leafy vegetables in every meal for essential vitamins and minerals.' },
  { emoji: '🧘', title: 'Manage Stress', tip: 'Deep breathing for 5 minutes a day can lower blood pressure and reduce anxiety.' },
];

// ── Speciality chips ──────────────────────────────────────────────────────────
const SPECIALITIES = [
  { label: 'General',    icon: '🩺', spec: 'General Physician' },
  { label: 'Cardiology', icon: '❤️', spec: 'Cardiologist' },
  { label: 'Skin',       icon: '✨', spec: 'Dermatologist' },
  { label: 'Ortho',      icon: '🦴', spec: 'Orthopedic' },
  { label: 'Kids',       icon: '👶', spec: 'Pediatrician' },
  { label: 'Neuro',      icon: '🧠', spec: 'Neurologist' },
  { label: 'ENT',        icon: '👂', spec: 'ENT' },
  { label: 'Dental',     icon: '🦷', spec: 'Dental' },
];

const ACTIVE_STATUSES = ['BOOKED', 'CHECKED_IN', 'IN_QUEUE', 'IN_CONSULTATION', 'CALLED'];

// ── Main Component ────────────────────────────────────────────────────────────
const PatientDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [appointments, setAppointments] = useState([]);
  const [topDoctors, setTopDoctors] = useState([]);
  const [profilePct, setProfilePct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tipIdx, setTipIdx] = useState(0);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [apptRes, profileRes, doctorRes] = await Promise.all([
          getMyAppointments({ limit: 5 }),
          getPatientProfile(),
          searchDoctors({ limit: 6 }).catch(() => null),
        ]);
        setAppointments(apptRes.data.data || []);
        const u = profileRes.data.data.user;
        setProfilePct(calcCompletion(u, u?.patientProfile));
        setTopDoctors(doctorRes?.data?.data || []);
      } catch { /* silent */ }
      finally { setIsLoading(false); }
    };
    fetchAll();
  }, []);

  // Auto-rotate health tips every 5s
  useEffect(() => {
    const t = setInterval(() => setTipIdx((i) => (i + 1) % HEALTH_TIPS.length), 5000);
    return () => clearInterval(t);
  }, []);

  const active = appointments.filter((a) => ACTIVE_STATUSES.includes(a.status));
  const recent = appointments.filter((a) => ['COMPLETED','CANCELLED','NO_SHOW'].includes(a.status));
  const firstName = user?.name?.split(' ')[0] || 'there';
  const tip = HEALTH_TIPS[tipIdx];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-7">

        {/* ── Hero header ── */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{greeting}, {firstName} 👋</h1>
            <p className="text-gray-400 text-sm mt-1">Your health, managed in one place.</p>
          </div>
          <Link to="/notifications" className="relative w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          </Link>
        </div>

        {/* ── Profile completion banner ── */}
        {profilePct !== null && profilePct < 100 && (
          <Link to="/patient/profile" className="block">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 hover:bg-amber-100 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-amber-900">Complete your health profile</p>
                    <p className="text-xs text-amber-600">Required to book appointments</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-amber-700">{profilePct}%</span>
              </div>
              <div className="w-full bg-amber-200 rounded-full h-1.5">
                <div className="bg-amber-500 h-1.5 rounded-full transition-all duration-700" style={{ width: `${profilePct}%` }} />
              </div>
            </div>
          </Link>
        )}

        {/* ── Quick actions ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { to: '/patient/search',       emoji: '🔍', label: 'Find Doctors',  sub: 'Search by specialty', bg: 'bg-blue-50',    border: 'border-blue-100'   },
            { to: '/patient/appointments', emoji: '📅', label: 'Appointments',  sub: 'View & manage',       bg: 'bg-green-50',   border: 'border-green-100'  },
            { to: '/patient/payments',     emoji: '💳', label: 'Payments',      sub: 'History & refunds',   bg: 'bg-purple-50',  border: 'border-purple-100' },
          ].map((a) => (
            <Link key={a.to} to={a.to}
              className={`border rounded-2xl p-4 hover:shadow-sm transition-all bg-white group ${a.border}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2.5 text-xl ${a.bg}`}>
                {a.emoji}
              </div>
              <p className="text-sm font-semibold text-gray-900">{a.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{a.sub}</p>
            </Link>
          ))}
        </div>

        {/* ── Speciality chips ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900">Find by Speciality</h2>
            <Link to="/patient/search" className="text-xs font-semibold text-blue-600 hover:text-blue-700">View All →</Link>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {SPECIALITIES.map((s) => (
              <Link key={s.spec} to={`/patient/search?specialization=${encodeURIComponent(s.spec)}`}
                className="flex-shrink-0 flex flex-col items-center gap-1.5 bg-white border border-gray-100 rounded-2xl px-4 py-3 hover:border-blue-200 hover:bg-blue-50 transition-all group">
                <span className="text-2xl">{s.icon}</span>
                <span className="text-xs font-semibold text-gray-600 group-hover:text-blue-700 whitespace-nowrap">{s.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Active appointments ── */}
        {active.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <h2 className="text-base font-semibold text-gray-900">Active Appointments</h2>
            </div>
            <div className="space-y-3">
              {active.map((appt) => (
                <div key={appt.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                  <div className="h-0.5 bg-gradient-to-r from-blue-500 to-blue-400" />
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-700 font-bold">{appt.doctor?.user?.name?.charAt(0) || 'D'}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">Dr. {appt.doctor?.user?.name}</p>
                          <p className="text-xs text-gray-400">{appt.clinic?.name} · {fmtDate(appt.appointmentDate)}</p>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <StatusBadge status={appt.status} />
                        {appt.queueNumber != null && (
                          <span className="text-xs font-bold text-blue-600">Token #{appt.queueNumber}</span>
                        )}
                      </div>
                    </div>
                    {['IN_QUEUE','BOOKED','CHECKED_IN','CALLED'].includes(appt.status) && (
                      <div className="mt-3 flex items-center justify-between">
                        {appt.estimatedWaitMinutes != null && (
                          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                            🕐 ~{appt.estimatedWaitMinutes} min wait
                          </span>
                        )}
                        <Link to={`/patient/queue/${appt.id}`}
                          className="ml-auto text-xs font-semibold text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                          📡 Track Live →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Health tip rotating card ── */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white">
          <div className="flex items-start gap-3">
            <span className="text-3xl">{tip.emoji}</span>
            <div className="flex-1">
              <p className="text-xs font-semibold text-blue-200 uppercase tracking-wide mb-1">Health Tip of the Day</p>
              <p className="font-semibold text-white text-sm">{tip.title}</p>
              <p className="text-blue-100 text-xs mt-1 leading-relaxed">{tip.tip}</p>
            </div>
          </div>
          {/* Dot indicators */}
          <div className="flex gap-1.5 mt-4 justify-center">
            {HEALTH_TIPS.map((_, i) => (
              <button key={i} onClick={() => setTipIdx(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === tipIdx ? 'bg-white w-4' : 'bg-blue-400'}`} />
            ))}
          </div>
        </div>

        {/* ── Top Doctors ── */}
        {topDoctors.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-900">Verified Doctors</h2>
              <Link to="/patient/search" className="text-xs font-semibold text-blue-600 hover:text-blue-700">See All →</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {topDoctors.slice(0, 6).map((doc) => {
                const clinic = doc.doctorClinics?.[0]?.clinic;
                return (
                  <Link key={doc.id} to={`/patient/doctors/${doc.id}`}
                    className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-700 font-bold text-lg">{doc.user?.name?.charAt(0) || 'D'}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">Dr. {doc.user?.name}</p>
                        <p className="text-xs text-blue-600 truncate">{doc.specialization || 'General'}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{doc.experienceYears || 0} yrs exp</span>
                      <div className="flex gap-1">
                        {doc.offlineAvailable && <span className="bg-green-50 text-green-600 font-medium px-1.5 py-0.5 rounded">Clinic</span>}
                        {doc.onlineAvailable && <span className="bg-blue-50 text-blue-600 font-medium px-1.5 py-0.5 rounded">Online</span>}
                      </div>
                    </div>
                    {clinic && (
                      <p className="text-xs text-gray-400 mt-1.5 truncate">📍 {clinic.name}{clinic.city ? `, ${clinic.city}` : ''}</p>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Recent appointments ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900">Recent Appointments</h2>
            <Link to="/patient/appointments" className="text-xs font-semibold text-blue-600 hover:text-blue-700">View All →</Link>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10"><LoadingSpinner /></div>
          ) : appointments.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center">
              <p className="text-4xl mb-3">📅</p>
              <p className="text-sm font-semibold text-gray-700">No appointments yet</p>
              <p className="text-xs text-gray-400 mt-1 mb-5">Book your first appointment with a doctor</p>
              <Link to="/patient/search" className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">
                🔍 Find a Doctor
              </Link>
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-2xl divide-y divide-gray-50 shadow-sm">
              {appointments.slice(0, 5).map((appt) => (
                <Link key={appt.id} to="/patient/appointments"
                  className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors first:rounded-t-2xl last:rounded-b-2xl">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Dr. {appt.doctor?.user?.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {appt.clinic?.name} · {new Date(appt.appointmentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <StatusBadge status={appt.status} />
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
};

export default PatientDashboard;
