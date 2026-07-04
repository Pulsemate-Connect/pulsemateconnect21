import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getDoctorProfile } from '../../api/patient.api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import BookAppointmentModal from './BookAppointmentModal';

// ── Spec color map ────────────────────────────────────────────────────────────
const SPEC_CFG = {
  'General Physician': { color: '#6366F1', bg: '#EEF2FF' },
  'Cardiologist':      { color: '#EF4444', bg: '#FEE2E2' },
  'Dermatologist':     { color: '#F59E0B', bg: '#FEF3C7' },
  'Orthopedic':        { color: '#10B981', bg: '#D1FAE5' },
  'Pediatrician':      { color: '#EC4899', bg: '#FCE7F3' },
  'Neurologist':       { color: '#8B5CF6', bg: '#EDE9FE' },
  'ENT':               { color: '#06B6D4', bg: '#CFFAFE' },
};
const getSpec = (s) => SPEC_CFG[s] || { color: '#2563EB', bg: '#EFF6FF' };

// ── Info row ──────────────────────────────────────────────────────────────────
const InfoRow = ({ label, value }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
    <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</span>
    <span className="text-sm font-semibold text-gray-800">{value || '—'}</span>
  </div>
);

// ── Clinic logo fallback ──────────────────────────────────────────────────────
const ClinicAvatar = ({ name }) => (
  <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-700 font-bold border border-blue-100">
    {name?.charAt(0)?.toUpperCase() || '🏥'}
  </div>
);

// ── Main ──────────────────────────────────────────────────────────────────────
const DoctorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState('about');
  const [showBookModal, setShowBookModal] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getDoctorProfile(id)
      .then((r) => setDoctor(r.data.data.doctor))
      .catch(() => navigate('/patient/search'))
      .finally(() => setIsLoading(false));
  }, [id, navigate]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-64"><LoadingSpinner size="lg" /></div>
      </DashboardLayout>
    );
  }
  if (!doctor) return null;

  const spec   = doctor.specialization || 'General Physician';
  const cfg    = getSpec(spec);
  const initial = doctor.user?.name?.charAt(0)?.toUpperCase() || 'D';
  const langs   = doctor.languagesKnown?.join(', ') || 'English';
  const exp     = doctor.experienceYears || 0;
  const qual    = doctor.qualification || 'MBBS';
  const avgMins = doctor.avgConsultationMins || 15;
  const firstClinic = doctor.doctorClinics?.[0];

  const handleBook = (dc) => {
    setSelectedClinic({ ...dc.clinic, doctorClinicId: dc.id });
    setShowBookModal(true);
  };

  const TABS = [
    { key: 'about',   label: 'About'   },
    { key: 'clinics', label: 'Clinics' },
    { key: 'reviews', label: 'Reviews' },
  ];

  return (
    <DashboardLayout>
      <div className="page-container max-w-2xl">
        {/* Back */}
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-6">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Back to search
        </button>

        {/* Hero banner */}
        <div className="rounded-3xl overflow-hidden shadow-sm mb-5" style={{ backgroundColor: cfg.color }}>
          <div className="p-6">
            {/* Top nav */}
            <div className="flex items-center justify-end mb-4">
              <button onClick={() => setSaved((v) => !v)}
                className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                {saved ? '❤️' : '🤍'}
              </button>
            </div>

            {/* Avatar + name */}
            <div className="flex items-end gap-4 mb-5">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black"
                style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                {initial}
              </div>
              <div className="flex-1 pb-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black text-white">Dr. {doctor.user?.name}</h1>
                  <svg className="w-4 h-4 text-white/80" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                </div>
                <span className="inline-block text-xs font-semibold text-white/80 bg-white/20 px-2 py-0.5 rounded-full mt-1">{spec}</span>
                <p className="text-white/70 text-xs mt-1">{qual} · {exp} yrs experience</p>
              </div>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-3 bg-black/20 rounded-2xl divide-x divide-white/10">
              {[
                { label: 'Exp', value: `${exp}+ yrs` },
                { label: 'Avg Visit', value: `${avgMins} min` },
                { label: 'Mode', value: doctor.onlineAvailable && doctor.offlineAvailable ? 'Both' : doctor.onlineAvailable ? 'Online' : 'Clinic' },
              ].map((s) => (
                <div key={s.label} className="py-3 text-center">
                  <p className="text-white font-bold text-sm">{s.value}</p>
                  <p className="text-white/60 text-xs">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Consult mode chips */}
        <div className="flex gap-2 mb-4">
          {doctor.offlineAvailable && (
            <span className="flex items-center gap-1.5 text-xs font-semibold bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-full">🏥 In-Clinic</span>
          )}
          {doctor.onlineAvailable && (
            <span className="flex items-center gap-1.5 text-xs font-semibold bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1.5 rounded-full">💻 Online</span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-5">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── About tab ── */}
        {tab === 'about' && (
          <div className="space-y-4">
            {doctor.bio && (
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">About</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{doctor.bio}</p>
              </div>
            )}

            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Details</h3>
              <InfoRow label="Qualification"  value={qual} />
              <InfoRow label="Experience"     value={`${exp} years`} />
              <InfoRow label="Specialization" value={spec} />
              <InfoRow label="Languages"      value={langs} />
              <InfoRow label="Avg. Consult"   value={`~${avgMins} minutes`} />
              {doctor.medicalRegistrationNumber && (
                <InfoRow label="Reg. Number"  value={doctor.medicalRegistrationNumber} />
              )}
            </div>

            {doctor.education && (
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Education</h3>
                <p className="text-sm text-gray-600">{doctor.education}</p>
              </div>
            )}

            {doctor.languagesKnown?.length > 0 && (
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Languages Spoken</h3>
                <div className="flex flex-wrap gap-2">
                  {doctor.languagesKnown.map((l) => (
                    <span key={l} className="text-xs font-semibold px-3 py-1.5 rounded-full border"
                      style={{ backgroundColor: cfg.bg, color: cfg.color, borderColor: `${cfg.color}30` }}>
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Clinics tab ── */}
        {tab === 'clinics' && (
          <div className="space-y-4">
            {doctor.doctorClinics?.length === 0 ? (
              <div className="text-center py-12 bg-white border border-gray-100 rounded-2xl">
                <p className="text-3xl mb-3">🏥</p>
                <p className="font-semibold text-gray-600">No clinic info available</p>
              </div>
            ) : (
              doctor.doctorClinics?.map((dc) => (
                <div key={dc.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm"
                  style={{ borderLeft: `4px solid ${cfg.color}` }}>
                  <div className="p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <ClinicAvatar name={dc.clinic?.name} />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900">{dc.clinic?.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          📍 {[dc.clinic?.address, dc.clinic?.city].filter(Boolean).join(', ') || 'Location not set'}
                        </p>
                        {dc.clinic?.phone && (
                          <p className="text-xs text-gray-400 mt-0.5">📞 {dc.clinic.phone}</p>
                        )}
                      </div>
                      {dc.clinic?.isVerified && (
                        <span className="text-xs font-bold bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full flex-shrink-0">✓ Verified</span>
                      )}
                    </div>

                    {/* Hours */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-4">
                      {dc.startTime && dc.endTime && (
                        <div className="flex items-center gap-1.5">
                          <span>🕐</span> {dc.startTime} – {dc.endTime}
                        </div>
                      )}
                      {dc.availableDays?.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <span>📅</span> {dc.availableDays.slice(0,3).join(', ')}{dc.availableDays.length > 3 ? '...' : ''}
                        </div>
                      )}
                    </div>

                    {/* Book buttons */}
                    <div className="flex gap-2">
                      {doctor.offlineAvailable && (
                        <button onClick={() => handleBook(dc)}
                          className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors"
                          style={{ backgroundColor: cfg.color }}>
                          🏥 Book In-Person
                        </button>
                      )}
                      {doctor.onlineAvailable && (
                        <button onClick={() => handleBook(dc)}
                          className="flex-1 py-2.5 text-sm font-semibold rounded-xl border-2 transition-colors"
                          style={{ borderColor: cfg.color, color: cfg.color }}>
                          💻 Book Online
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Reviews tab ── */}
        {tab === 'reviews' && (
          <div className="text-center py-16 bg-white border border-gray-100 rounded-2xl shadow-sm">
            <p className="text-4xl mb-4">⭐</p>
            <p className="font-bold text-gray-700 text-lg">No reviews yet</p>
            <p className="text-sm text-gray-400 mt-1 max-w-xs mx-auto">Patient reviews will appear here after appointments are completed</p>
          </div>
        )}

        {/* Sticky Book CTA */}
        <div className="sticky bottom-4 mt-6">
          <button onClick={() => handleBook(firstClinic)}
            className="w-full py-4 text-white font-bold text-base rounded-2xl shadow-xl transition-all active:scale-95"
            style={{ backgroundColor: cfg.color }}>
            📅 Book Appointment
          </button>
        </div>

      </div>

      {showBookModal && selectedClinic && (
        <BookAppointmentModal
          doctor={doctor}
          clinic={selectedClinic}
          defaultType="OFFLINE"
          onClose={() => setShowBookModal(false)}
          onSuccess={() => { setShowBookModal(false); navigate('/patient/appointments'); }}
        />
      )}
    </DashboardLayout>
  );
};

export default DoctorProfile;
