import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getMe } from '../../api/auth.api';
import { getStaff } from '../../api/clinic.api';
import { addFollowUp, searchPatients } from '../../api/reception.api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatusBadge from '../../components/ui/StatusBadge';
import toast from 'react-hot-toast';

const fmt12 = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hr}:${String(m).padStart(2, '0')} ${ampm}`;
};

const FollowUpBooking = () => {
  const [clinic, setClinic] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [searchDebounce, setSearchDebounce] = useState(null);

  // Form state
  const [form, setForm] = useState({ doctorId: '', symptoms: '' });

  useEffect(() => {
    const init = async () => {
      try {
        const meRes = await getMe();
        const staffClinics = meRes.data.data.user?.clinicStaff || [];
        if (!staffClinics.length) { setIsLoading(false); return; }

        const myClinic = staffClinics[0].clinic;
        setClinic(myClinic);

        const staffRes = await getStaff(myClinic.id);
        const doctorStaff = (staffRes.data.data.staff || []).filter((s) => s.role === 'DOCTOR');
        setDoctors(doctorStaff);
        if (doctorStaff.length > 0) {
          setForm((f) => ({ ...f, doctorId: doctorStaff[0].user?.doctorProfile?.id || '' }));
        }
      } catch {
        toast.error('Failed to load clinic data');
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  // Debounced patient search
  useEffect(() => {
    if (searchDebounce) clearTimeout(searchDebounce);

    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      if (!clinic) return;
      setIsSearching(true);
      try {
        const res = await searchPatients(searchQuery.trim(), clinic.id);
        setSearchResults(res.data.data.patients || []);
      } catch {
        toast.error('Search failed');
      } finally {
        setIsSearching(false);
      }
    }, 400);

    setSearchDebounce(timer);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, clinic]);

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setSelectedAppointment(null);
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleSelectAppointment = (appt) => {
    setSelectedAppointment(appt);
    // Auto-fill doctor from original appointment
    if (appt.doctor?.id) {
      setForm((f) => ({ ...f, doctorId: appt.doctor.id }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAppointment) {
      toast.error('Select the original appointment first');
      return;
    }
    if (!form.doctorId) {
      toast.error('Please select a doctor');
      return;
    }
    if (!clinic) {
      toast.error('Clinic not found');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await addFollowUp({
        doctorId: form.doctorId,
        clinicId: clinic.id,
        originalAppointmentId: selectedAppointment.id,
        symptoms: form.symptoms.trim() || undefined,
      });

      const { queueNumber } = res.data.data;
      toast.success(`Follow-up added with priority — Queue #${queueNumber}`);

      // Reset
      setSelectedPatient(null);
      setSelectedAppointment(null);
      setForm((f) => ({ ...f, symptoms: '' }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add follow-up patient');
    } finally {
      setIsSubmitting(false);
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

  return (
    <DashboardLayout>
      <div className="page-container max-w-lg">
        <h1 className="text-2xl font-bold text-text-primary mb-2">Follow-up Return</h1>
        <p className="text-text-muted text-sm mb-6">
          Add a returning patient to the priority queue. They will be placed ahead of new patients.
        </p>

        {/* Priority info */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
          <p className="text-sm font-semibold text-orange-800 mb-2">⚡ Priority Queue Logic</p>
          <ul className="text-xs text-orange-700 space-y-1">
            <li>• Follow-up patients are placed <strong>before</strong> new waiting patients</li>
            <li>• Multiple follow-ups are served in the order they return</li>
            <li>• Regular queue: 101, 102, 103… → With follow-up: <strong>F→ 104</strong>, 101, 102…</li>
          </ul>
        </div>

        {/* Step 1 — Search patient */}
        {!selectedPatient && (
          <div className="card mb-4">
            <h2 className="font-semibold text-text-primary mb-3">Step 1 — Find Patient</h2>
            <label className="label">Search by name or mobile</label>
            <div className="relative">
              <input
                className="input w-full pr-10"
                placeholder="e.g. Rahul or +91 98765..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <LoadingSpinner size="sm" />
                </div>
              )}
            </div>

            {/* Search results */}
            {searchResults.length > 0 && (
              <div className="mt-2 border border-border rounded-xl overflow-hidden">
                {searchResults.map((patient) => (
                  <button
                    key={patient.id}
                    onClick={() => handleSelectPatient(patient)}
                    className="w-full text-left px-4 py-3 hover:bg-primary-50 transition-colors border-b border-border last:border-0"
                  >
                    <p className="font-medium text-text-primary">{patient.name || 'Unknown'}</p>
                    <p className="text-xs text-text-muted">{patient.mobile}</p>
                    <p className="text-xs text-blue-600 mt-0.5">
                      {patient.appointments?.length || 0} appointment(s) today
                    </p>
                  </button>
                ))}
              </div>
            )}

            {searchQuery.trim().length >= 2 && !isSearching && searchResults.length === 0 && (
              <p className="text-sm text-text-muted mt-2">No patients found at this clinic today.</p>
            )}
          </div>
        )}

        {/* Step 2 — Select appointment */}
        {selectedPatient && !selectedAppointment && (
          <div className="card mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-text-primary">Step 2 — Select Original Appointment</h2>
              <button
                onClick={() => { setSelectedPatient(null); setSelectedAppointment(null); }}
                className="text-xs text-text-muted hover:text-text-primary"
              >
                ← Change patient
              </button>
            </div>

            {/* Selected patient info */}
            <div className="bg-blue-50 rounded-lg p-3 mb-3">
              <p className="font-medium text-blue-800">{selectedPatient.name || 'Unknown'}</p>
              <p className="text-xs text-blue-600">{selectedPatient.mobile}</p>
            </div>

            {selectedPatient.appointments?.length === 0 ? (
              <p className="text-sm text-text-muted">No eligible appointments found for today.</p>
            ) : (
              <div className="space-y-2">
                {selectedPatient.appointments.map((appt) => (
                  <button
                    key={appt.id}
                    onClick={() => handleSelectAppointment(appt)}
                    className="w-full text-left border border-border rounded-xl p-3 hover:border-primary-400 hover:bg-primary-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          Dr. {appt.doctor?.user?.name}
                          {appt.slotTime && <span className="text-text-muted ml-1">• {fmt12(appt.slotTime)}</span>}
                        </p>
                        {appt.symptoms && (
                          <p className="text-xs text-text-muted mt-0.5 italic truncate max-w-xs">"{appt.symptoms}"</p>
                        )}
                      </div>
                      <StatusBadge status={appt.status} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3 — Confirm follow-up */}
        {selectedPatient && selectedAppointment && (
          <form onSubmit={handleSubmit} className="card space-y-4">
            <h2 className="font-semibold text-text-primary">Step 3 — Confirm Follow-up</h2>

            {/* Summary */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 space-y-1">
              <p className="text-sm font-medium text-green-800">
                ✅ {selectedPatient.name} → Dr. {selectedAppointment.doctor?.user?.name}
              </p>
              {selectedAppointment.symptoms && (
                <p className="text-xs text-green-700 italic">Original: "{selectedAppointment.symptoms}"</p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedAppointment(null)}
                className="text-xs text-text-muted hover:text-text-primary underline"
              >
                ← Change appointment
              </button>
            </div>

            {/* Doctor selector */}
            <div>
              <label className="label">Doctor</label>
              <select
                className="input"
                value={form.doctorId}
                onChange={(e) => setForm((f) => ({ ...f, doctorId: e.target.value }))}
                required
              >
                <option value="">Select doctor...</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.user?.doctorProfile?.id}>
                    {d.user?.name}
                    {d.user?.doctorProfile?.specialization ? ` (${d.user.doctorProfile.specialization})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Reason for return */}
            <div>
              <label className="label">Reason for Return <span className="text-text-muted font-normal">(optional)</span></label>
              <input
                className="input"
                placeholder="e.g. BP check after medication, X-ray result review..."
                value={form.symptoms}
                onChange={(e) => setForm((f) => ({ ...f, symptoms: e.target.value }))}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-3 font-semibold"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" /> Adding to priority queue...
                </span>
              ) : (
                '🔄 Add to Priority Queue'
              )}
            </button>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
};

export default FollowUpBooking;
