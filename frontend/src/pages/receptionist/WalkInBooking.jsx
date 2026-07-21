import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { addWalkIn } from '../../api/reception.api';
import { getMe } from '../../api/auth.api';
import { getStaff, getClinicSessions } from '../../api/clinic.api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const SESSION_ICONS = { MORNING: '🌅', AFTERNOON: '☀️', EVENING: '🌙' };

const fmt12 = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hr}:${String(m).padStart(2, '0')} ${ampm}`;
};

const WalkInBooking = () => {
  const [clinic, setClinic] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [isInitLoading, setIsInitLoading] = useState(true);
  const [formData, setFormData] = useState({
    doctorId: '',
    clinicId: '',
    sessionId: '',
    patientMobile: '+91 ',
    patientName: '',
    symptoms: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const meRes = await getMe();
        const staffClinics = meRes.data.data.user?.clinicStaff || [];

        if (staffClinics.length === 0) {
          setIsInitLoading(false);
          return;
        }

        const myClinic = staffClinics[0].clinic;
        setClinic(myClinic);
        setFormData((prev) => ({ ...prev, clinicId: myClinic.id }));

        const [staffRes, sessionsRes] = await Promise.all([
          getStaff(myClinic.id),
          getClinicSessions(myClinic.id),
        ]);

        const allStaff = staffRes.data.data.staff || [];
        const doctorStaff = allStaff.filter((s) => s.role === 'DOCTOR');
        setDoctors(doctorStaff);
        if (doctorStaff.length > 0) {
          const firstDoctorProfileId = doctorStaff[0].user?.doctorProfile?.id;
          if (firstDoctorProfileId) {
            setFormData((prev) => ({ ...prev, doctorId: firstDoctorProfileId }));
          }
        }

        const clinicSessions = sessionsRes.data.data.sessions || [];
        setSessions(clinicSessions);
        // Auto-select current session
        const now = new Date();
        const nowMins = now.getHours() * 60 + now.getMinutes();
        const activeSession = clinicSessions.find((s) => {
          const [sh, sm] = s.startTime.split(':').map(Number);
          const [eh, em] = s.endTime.split(':').map(Number);
          return nowMins >= sh * 60 + sm && nowMins < eh * 60 + em;
        });
        const defaultSession = activeSession || clinicSessions[0];
        if (defaultSession) setFormData((prev) => ({ ...prev, sessionId: defaultSession.id }));
      } catch (err) {
        console.error('[WalkIn] Error:', err);
        toast.error('Failed to load clinic data');
      } finally {
        setIsInitLoading(false);
      }
    };
    init();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.doctorId) return toast.error('Please select a doctor');
    if (!formData.patientMobile) return toast.error('Please enter patient mobile');

    setIsLoading(true);
    setResult(null);
    try {
      const res = await addWalkIn(formData);
      setResult(res.data.data);
      toast.success(`Walk-in added! Queue #${res.data.data.queueNumber}`);
      setFormData((prev) => ({ ...prev, patientMobile: '+91 ', patientName: '', symptoms: '' }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add walk-in');
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-64"><LoadingSpinner size="lg" /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="page-container max-w-lg">
        <h1 className="text-2xl font-bold text-text-primary mb-2">Walk-in Patient</h1>
        <p className="text-text-muted text-sm mb-6">Add a patient directly to the queue without prior booking</p>

        {/* Success result */}
        {result && (
          <div className="bg-secondary-50 border border-secondary-200 rounded-xl p-5 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-secondary-100 rounded-xl flex items-center justify-center text-3xl">✅</div>
              <div>
                <p className="font-bold text-secondary-700 text-lg">Patient Added!</p>
                <p className="text-secondary-600">
                  Queue Number: <strong className="text-2xl">#{result.queueNumber}</strong>
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Clinic info */}
            {clinic && (
              <div className="bg-primary-50 rounded-lg p-3">
                <p className="text-sm font-medium text-primary-700">🏥 {clinic.name}</p>
              </div>
            )}

            {/* Doctor selector */}
            <div>
              <label className="label">Select Doctor *</label>
              {doctors.length === 0 ? (
                <p className="text-sm text-error">No doctors available in this clinic</p>
              ) : (
                <select
                  className="input"
                  value={formData.doctorId}
                  onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                  required
                >
                  <option value="">Select a doctor</option>
                  {doctors.map((d) => {
                    const profileId = d.user?.doctorProfile?.id;
                    return profileId ? (
                      <option key={d.id} value={profileId}>
                        {d.user?.name}
                        {d.user?.doctorProfile?.specialization ? ` — ${d.user.doctorProfile.specialization}` : ''}
                      </option>
                    ) : null;
                  })}
                </select>
              )}
            </div>

            {/* Session selector */}
            {sessions.length > 0 && (
              <div>
                <label className="label">Session *</label>
                <div className="flex flex-wrap gap-2">
                  {sessions.map((s) => {
                    const icon = SESSION_ICONS[s.sessionType] || '🕐';
                    const active = formData.sessionId === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, sessionId: s.id })}
                        className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-colors flex items-center gap-1.5 ${
                          active
                            ? 'border-primary-600 bg-primary-50 text-primary-700'
                            : 'border-border text-text-muted hover:border-gray-300'
                        }`}
                      >
                        <span>{icon}</span>
                        <span>{s.name}</span>
                        <span className="text-xs opacity-60">{fmt12(s.startTime)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Patient mobile */}
            <div>
              <label className="label">Patient Mobile *</label>
              <input
                type="tel"
                className="input"
                placeholder="+91 9876543210"
                value={formData.patientMobile}
                onChange={(e) => {
                  const value = e.target.value;
                  // Extract only the number part after +91
                  const numberPart = value.replace(/^\+91\s*/, '');
                  // Allow only digits and limit to 10
                  const digitsOnly = numberPart.replace(/\D/g, '').slice(0, 10);
                  setFormData({ ...formData, patientMobile: '+91 ' + digitsOnly });
                }}
                onKeyDown={(e) => {
                  // Prevent deleting past the +91 prefix
                  if ((e.key === 'Backspace' || e.key === 'Delete') && e.target.selectionStart <= 4) {
                    e.preventDefault();
                  }
                }}
                maxLength={14}
                required
              />
              <p className="text-xs text-text-muted mt-1">
                If patient doesn't exist, a new account will be created automatically
              </p>
            </div>

            {/* Patient name */}
            <div>
              <label className="label">Patient Name</label>
              <input
                type="text"
                className="input"
                placeholder="Patient's full name"
                value={formData.patientName}
                onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
              />
            </div>

            {/* Symptoms */}
            <div>
              <label className="label">Symptoms / Reason</label>
              <textarea
                className="input resize-none"
                rows={3}
                placeholder="Brief description of symptoms or reason for visit..."
                value={formData.symptoms}
                onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-3 text-base"
              disabled={isLoading || doctors.length === 0}
            >
              {isLoading
                ? <LoadingSpinner size="sm" className="mx-auto" />
                : '🚶 Add to Queue'}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default WalkInBooking;
