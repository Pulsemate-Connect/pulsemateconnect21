// ─────────────────────────────────────────────────────────────────────────────
//  ClinicEditResubmit — Full multi-section edit form for REJECTED / CHANGES_REQUIRED
//  Route: /clinic/edit-resubmit
//  Pre-fills all existing clinic data. On submit calls PATCH /clinics/my-resubmit.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import useAuthStore from '../../store/authStore';
import { getMyClinicStatus, resubmitClinic } from '../../api/clinic.api';
import { uploadClinicOwnerDocument } from '../../api/auth.api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { getDistricts, getCities } from '../../data/indiaLocations';

// ── Static options ────────────────────────────────────────────────────────────
const CLINIC_TYPES = [
  'Individual Clinic', 'Multi-specialty Clinic', 'Hospital', 'Dental Clinic',
  'Eye Clinic', 'Physiotherapy Center', 'Diagnostic Center', 'Other',
];

const SPECIALTY_MAP = {
  'Individual Clinic':      ['General Medicine','Pediatrics','ENT','Dermatology','Gynecology','Other'],
  'Multi-specialty Clinic': ['General Medicine','Pediatrics','Cardiology','Orthopedics','Dermatology','ENT','Gynecology','Other'],
  'Hospital':               ['General Medicine','Pediatrics','Cardiology','Orthopedics','Dermatology','ENT','Gynecology','Dentistry','Ophthalmology','Other'],
  'Dental Clinic':          ['Dentistry','Orthodontics','Endodontics','Oral Surgery','Periodontics','Prosthodontics','Other'],
  'Eye Clinic':             ['Ophthalmology','Optometry','Other'],
  'Physiotherapy Center':   ['Physiotherapy','Sports Rehabilitation','Pain Management','Other'],
  'Diagnostic Center':      ['Pathology','Radiology','Imaging','Laboratory Medicine','Other'],
  'Other':                  ['General Medicine','Specialty Care','Surgery','Other'],
};

const CONSULTATION_MODES = ['Offline Consultation','Video Consultation','Home Visit','Online Chat'];
const FACILITIES         = ['Parking','Wheelchair Access','Pharmacy','Laboratory','AC Waiting Area','Drinking Water','Online Payment','Emergency Care','Lift Access','CCTV Security','Child Friendly Area','WiFi'];
const LANGUAGES          = ['English','Hindi','Kannada','Marathi','Tamil','Telugu','Malayalam'];
const PAYMENT_METHODS    = ['Cash','UPI','Credit/Debit Card','Insurance','Net Banking'];
const INSURANCE_OPTIONS  = ['Star Health','Niva Bupa','ICICI Lombard','HDFC Ergo','Aditya Birla','Care Health','Other'];
const INDIAN_STATES      = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chandigarh','Chhattisgarh','Delhi','Goa','Gujarat','Haryana','Himachal Pradesh','Jammu and Kashmir','Jharkhand','Karnataka','Kerala','Ladakh','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal'];
const DAYS               = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

// ── Helpers ───────────────────────────────────────────────────────────────────
const normalizeSchedule = (raw) => {
  const base = DAYS.map((day) => ({
    day, enabled: false, openingTime: '09:00', closingTime: '18:00', breakStart: '', breakEnd: '',
  }));
  if (!Array.isArray(raw)) return base;
  return base.map((b) => {
    const found = raw.find((r) => r.day?.toLowerCase() === b.day.toLowerCase());
    return found ? { ...b, ...found } : b;
  });
};

const normalizeModes = (raw) => {
  if (!Array.isArray(raw)) return ['Offline Consultation'];
  const MAP = {
    OFFLINE: 'Offline Consultation', ONLINE: 'Video Consultation',
    HOME_VISIT: 'Home Visit', VIDEO: 'Video Consultation', CHAT: 'Online Chat',
  };
  return raw.map((m) => MAP[m] || m).filter((m) => CONSULTATION_MODES.includes(m));
};

const modeToBackend = (modes) => {
  const MAP = {
    'Offline Consultation': 'OFFLINE',
    'Video Consultation':   'VIDEO',
    'Home Visit':           'HOME_VISIT',
    'Online Chat':          'ONLINE',
  };
  return modes.map((m) => MAP[m] || m);
};

// ── Section wrapper ───────────────────────────────────────────────────────────
const Section = ({ title, icon, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
    <h3 className="flex items-center gap-2 text-base font-bold text-gray-900 mb-5">
      <span>{icon}</span>{title}
    </h3>
    {children}
  </div>
);

const Label = ({ children, required }) => (
  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
    {children}{required && <span className="text-red-500 ml-0.5">*</span>}
  </label>
);

const Chip = ({ active, onClick, children }) => (
  <button type="button" onClick={onClick}
    className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${
      active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
    }`}>
    {children}
  </button>
);

// ── File upload field ─────────────────────────────────────────────────────────
const FileField = ({ label, fieldKey, accept = '.pdf,image/*', value, onUpload, uploading, required }) => {
  const fileName = value ? value.split('/').pop().replace(/^\d{13}-/, '') : '';
  const isLoading = uploading === fieldKey;
  return (
    <div>
      <Label required={required}>{label}</Label>
      {fileName && (
        <p className="text-xs text-green-700 font-medium mb-1.5 flex items-center gap-1">
          <span className="text-green-500">✓</span>
          <span className="truncate">{fileName}</span>
        </p>
      )}
      <label className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed cursor-pointer transition-all
        ${isLoading ? 'border-blue-300 bg-blue-50/60' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'}`}>
        <input type="file" accept={accept} className="hidden" disabled={isLoading}
          onChange={(e) => onUpload(fieldKey, e.target.files?.[0])} />
        <span className="text-base">{isLoading ? '⏳' : fileName ? '🔄' : '📎'}</span>
        <span className="text-xs text-gray-500 font-medium">
          {isLoading ? 'Uploading…' : fileName ? 'Replace file' : 'Choose file'}
        </span>
      </label>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const ClinicEditResubmit = () => {
  const navigate     = useNavigate();
  const { checkAuth } = useAuthStore();

  const [loading,      setLoading]      = useState(true);
  const [submitting,   setSubmitting]   = useState(false);
  const [uploading,    setUploading]    = useState('');
  const [clinic,       setClinic]       = useState(null);
  const [activeSection, setActiveSection] = useState(0);

  // ── Form state ─────────────────────────────────────────────────────────────
  const [form, setForm] = useState(null);

  // ── Load clinic data ───────────────────────────────────────────────────────
  useEffect(() => {
    getMyClinicStatus()
      .then((res) => {
        const c = res.data.data?.clinic;
        if (!c) { navigate('/clinic/dashboard'); return; }
        if (!['REJECTED', 'CHANGES_REQUIRED'].includes(c.approvalStatus)) {
          navigate('/clinic/dashboard'); return;
        }
        setClinic(c);
        setForm({
          // Basic
          name:                  c.name                  || '',
          phone:                 c.phone                 || '',
          address:               c.address               || '',
          landmark:              c.landmark              || '',
          city:                  c.city                  || '',
          state:                 c.state                 || '',
          district:              c.district              || '',
          pincode:               c.pincode               || '',
          googleMapsLocation:    c.googleMapsLocation    || '',
          latitude:              c.latitude              || '',
          longitude:             c.longitude             || '',
          emergencyContactNumber:c.emergencyContactNumber|| '',
          alternateEmail:        c.alternateEmail        || '',
          // Clinic type
          clinicType:            c.clinicType            || 'Individual Clinic',
          clinicTypeOther:       c.clinicTypeOther       || '',
          description:           c.description           || '',
          specialties:           c.specialties           || [],
          specialtyOther:        c.specialtyOther        || '',
          doctorCount:           c.doctorCount           || '',
          // Operations
          consultationModes:     normalizeModes(c.consultationModes || []),
          weeklySchedule:        normalizeSchedule(c.weeklySchedule),
          avgConsultationMinutes:c.avgConsultationMinutes || 10,
          appointmentSlotMinutes:c.appointmentSlotMinutes || 15,
          dailyPatientCapacity:  c.dailyPatientCapacity  || '',
          // Facilities
          facilities:            c.facilities            || [],
          languagesSpoken:       c.languagesSpoken       || [],
          paymentMethods:        c.paymentMethods        || [],
          insuranceSupported:    c.insuranceSupported    || [],
          // Compliance
          clinicRegistrationNumber:          c.clinicRegistrationNumber          || '',
          gstNumber:                         c.gstNumber                         || '',
          panNumber:                         c.panNumber                         || '',
          clinicLogoUrl:                     c.clinicLogoUrl                     || '',
          clinicCoverImageUrl:               c.clinicCoverImageUrl               || '',
          licenseDocumentUrl:                c.licenseDocumentUrl                || c.clinicLicenseDocument || '',
          medicalEstablishmentCertificateUrl:c.medicalEstablishmentCertificateUrl|| '',
          gstCertificateUrl:                 c.gstCertificateUrl                 || '',
          panCardUrl:                        c.panCardUrl                        || '',
          additionalDocuments:               Array.isArray(c.additionalDocuments) ? c.additionalDocuments : [],
        });
      })
      .catch(() => { toast.error('Failed to load clinic data'); navigate('/clinic/dashboard'); })
      .finally(() => setLoading(false));
  }, [navigate]);

  const set = useCallback((key, val) => setForm((p) => ({ ...p, [key]: val })), []);

  const toggleArr = useCallback((key, val) => setForm((p) => {
    const arr = p[key] || [];
    return { ...p, [key]: arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val] };
  }), []);

  const setSchedule = useCallback((idx, patch) => setForm((p) => ({
    ...p,
    weeklySchedule: p.weeklySchedule.map((d, i) => i === idx ? { ...d, ...patch } : d),
  })), []);

  // ── File upload ────────────────────────────────────────────────────────────
  const handleUpload = async (field, file) => {
    if (!file) return;
    setUploading(field);
    try {
      const res = await uploadClinicOwnerDocument(file, field);
      const url = res.data?.data?.url || '';
      if (!url) throw new Error('No URL returned from upload');
      set(field, url);
      toast.success('File uploaded successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Upload failed');
    } finally {
      setUploading('');
    }
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.name?.trim()) { toast.error('Clinic name is required'); setActiveSection(0); return; }
    if (!form.licenseDocumentUrl) { toast.error('Clinic license document is required'); setActiveSection(5); return; }
    if (!form.medicalEstablishmentCertificateUrl) { toast.error('Medical establishment certificate is required'); setActiveSection(5); return; }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        consultationModes: modeToBackend(form.consultationModes),
        latitude:  form.latitude  ? Number(form.latitude)  : undefined,
        longitude: form.longitude ? Number(form.longitude) : undefined,
        avgConsultationMinutes: Number(form.avgConsultationMinutes) || 10,
        appointmentSlotMinutes: Number(form.appointmentSlotMinutes) || 15,
        dailyPatientCapacity:   form.dailyPatientCapacity ? Number(form.dailyPatientCapacity) : undefined,
        doctorCount:            form.doctorCount ? Number(form.doctorCount) : undefined,
        // Keep clinicLicenseDocument in sync
        clinicLicenseDocument:  form.licenseDocumentUrl,
      };

      await resubmitClinic(payload);
      toast.success('Clinic resubmitted for review! Our team will verify within 1–2 business days.');
      await checkAuth();
      navigate('/clinic/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Resubmit failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading || !form) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-24">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  const specialtyOptions = SPECIALTY_MAP[form.clinicType] || SPECIALTY_MAP['Other'];

  const SECTIONS = [
    { label: 'Clinic Info',    icon: '🏥' },
    { label: 'Location',       icon: '📍' },
    { label: 'Operations',     icon: '⚙️' },
    { label: 'Schedule',       icon: '🕐' },
    { label: 'Facilities',     icon: '🏗️' },
    { label: 'Documents',      icon: '📋' },
  ];

  const adminReason = clinic?.rejectionReason || clinic?.changesRequestedReason;

  return (
    <DashboardLayout>
      <div className="page-container max-w-3xl mx-auto">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="mb-6">
          <button onClick={() => navigate('/clinic/dashboard')}
            className="text-sm text-blue-600 hover:underline mb-3 inline-flex items-center gap-1">
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Edit &amp; Resubmit Clinic</h1>
          <p className="text-sm text-gray-500 mt-1">
            Update your clinic details and resubmit for admin review.
          </p>
        </div>

        {/* ── Admin reason notice ──────────────────────────────────────── */}
        {adminReason && (
          <div className={`rounded-2xl border p-4 mb-6 ${
            clinic.approvalStatus === 'REJECTED'
              ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'
          }`}>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">
              {clinic.approvalStatus === 'REJECTED' ? 'Rejection reason' : 'Changes requested by admin'}
            </p>
            <p className="text-sm text-gray-800 leading-relaxed">{adminReason}</p>
          </div>
        )}

        {/* ── Section tabs ────────────────────────────────────────────── */}
        <div className="flex gap-1.5 flex-wrap mb-5">
          {SECTIONS.map((s, i) => (
            <button key={i} type="button" onClick={() => setActiveSection(i)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium border transition-all ${
                activeSection === i
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
              }`}>
              <span>{s.icon}</span>{s.label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 0 — Clinic Information
        ══════════════════════════════════════════════════════════════ */}
        {activeSection === 0 && (
          <Section title="Clinic Information" icon="🏥">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label required>Clinic Name</Label>
                  <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} />
                </div>
                <div>
                  <Label>Clinic Phone</Label>
                  <input className="input" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label required>Clinic Type</Label>
                  <select className="input" value={form.clinicType} onChange={(e) => set('clinicType', e.target.value)}>
                    {CLINIC_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                {form.clinicType === 'Other' && (
                  <div>
                    <Label required>Specify Type</Label>
                    <input className="input" value={form.clinicTypeOther} onChange={(e) => set('clinicTypeOther', e.target.value)} />
                  </div>
                )}
                <div>
                  <Label>Number of Doctors</Label>
                  <input className="input" type="number" min={0} value={form.doctorCount}
                    onChange={(e) => set('doctorCount', e.target.value)} />
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <textarea className="input resize-none" rows={3} value={form.description}
                  onChange={(e) => set('description', e.target.value)} />
              </div>

              {/* Specialties */}
              <div>
                <Label required>Specialties</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {specialtyOptions.map((s) => (
                    <Chip key={s} active={form.specialties.includes(s)} onClick={() => toggleArr('specialties', s)}>
                      {s}
                    </Chip>
                  ))}
                </div>
                {form.specialties.includes('Other') && (
                  <div className="mt-3">
                    <Label>Other specialty</Label>
                    <input className="input" value={form.specialtyOther} onChange={(e) => set('specialtyOther', e.target.value)} />
                  </div>
                )}
              </div>

              {/* Branding images */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FileField label="Clinic Logo" fieldKey="clinicLogoUrl" accept="image/*"
                  value={form.clinicLogoUrl} onUpload={handleUpload} uploading={uploading} />
                <FileField label="Cover Image" fieldKey="clinicCoverImageUrl" accept="image/*"
                  value={form.clinicCoverImageUrl} onUpload={handleUpload} uploading={uploading} />
              </div>
            </div>
          </Section>
        )}

        {/* ══════════════════════════════════════════════════════════════
            SECTION 1 — Location
        ══════════════════════════════════════════════════════════════ */}
        {activeSection === 1 && (
          <Section title="Location" icon="📍">
            <div className="space-y-4">
              <div>
                <Label required>Address</Label>
                <textarea className="input resize-none" rows={2} value={form.address}
                  onChange={(e) => set('address', e.target.value)} />
              </div>
              <div>
                <Label>Landmark</Label>
                <input className="input" value={form.landmark} onChange={(e) => set('landmark', e.target.value)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label required>State</Label>
                  <select
                    className="input"
                    value={form.state}
                    onChange={(e) => {
                      const selected = e.target.value;
                      set('state', selected);
                      set('district', '');
                      set('city', '');
                    }}
                  >
                    <option value="">Select state</option>
                    {INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <Label required>District</Label>
                  {getDistricts(form.state).length ? (
                    <select
                      className="input"
                      value={form.district}
                      onChange={(e) => {
                        set('district', e.target.value);
                        set('city', '');
                      }}
                    >
                      <option value="">Select district</option>
                      {getDistricts(form.state).map((d) => <option key={d}>{d}</option>)}
                    </select>
                  ) : (
                    <input className="input" value={form.district} placeholder="Enter district name"
                      onChange={(e) => set('district', e.target.value)} />
                  )}
                </div>
                <div>
                  <Label required>City</Label>
                  {getCities(form.state, form.district).length ? (
                    <select
                      className="input"
                      value={form.city}
                      onChange={(e) => set('city', e.target.value)}
                    >
                      <option value="">Select city</option>
                      {getCities(form.state, form.district).map((c) => <option key={c}>{c}</option>)}
                    </select>
                  ) : (
                    <input className="input" value={form.city} placeholder="Enter city or locality"
                      onChange={(e) => set('city', e.target.value)} />
                  )}
                </div>
                <div>
                  <Label required>Pincode</Label>
                  <input className="input" maxLength={6} value={form.pincode}
                    onChange={(e) => set('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))} />
                </div>
                <div className="sm:col-span-2">
                  <Label>Google Maps Link</Label>
                  <input className="input" placeholder="https://maps.google.com/..." value={form.googleMapsLocation}
                    onChange={(e) => set('googleMapsLocation', e.target.value)} />
                </div>
                <div>
                  <Label>Latitude</Label>
                  <input className="input" type="number" step="any" value={form.latitude}
                    onChange={(e) => set('latitude', e.target.value)} />
                </div>
                <div>
                  <Label>Longitude</Label>
                  <input className="input" type="number" step="any" value={form.longitude}
                    onChange={(e) => set('longitude', e.target.value)} />
                </div>
                <div>
                  <Label>Emergency Contact</Label>
                  <input className="input" value={form.emergencyContactNumber}
                    onChange={(e) => set('emergencyContactNumber', e.target.value)} />
                </div>
                <div>
                  <Label>Alternate Email</Label>
                  <input className="input" type="email" value={form.alternateEmail}
                    onChange={(e) => set('alternateEmail', e.target.value)} />
                </div>
              </div>
            </div>
          </Section>
        )}

        {/* ══════════════════════════════════════════════════════════════
            SECTION 2 — Operations
        ══════════════════════════════════════════════════════════════ */}
        {activeSection === 2 && (
          <Section title="Operational Details" icon="⚙️">
            <div className="space-y-5">
              <div>
                <Label>Consultation Modes</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {CONSULTATION_MODES.map((m) => (
                    <Chip key={m} active={form.consultationModes.includes(m)} onClick={() => toggleArr('consultationModes', m)}>
                      {m}
                    </Chip>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label>Avg. Consultation (min)</Label>
                  <select className="input" value={form.avgConsultationMinutes}
                    onChange={(e) => set('avgConsultationMinutes', Number(e.target.value))}>
                    {[5,10,15,20,30].map((n) => <option key={n} value={n}>{n} min</option>)}
                  </select>
                </div>
                <div>
                  <Label>Slot Duration (min)</Label>
                  <select className="input" value={form.appointmentSlotMinutes}
                    onChange={(e) => set('appointmentSlotMinutes', Number(e.target.value))}>
                    {[5,10,15,20,30,45,60].map((n) => <option key={n} value={n}>{n} min</option>)}
                  </select>
                </div>
                <div>
                  <Label>Daily Patient Capacity</Label>
                  <input className="input" type="number" min={1} value={form.dailyPatientCapacity}
                    onChange={(e) => set('dailyPatientCapacity', e.target.value)} />
                </div>
              </div>
            </div>
          </Section>
        )}

        {/* ══════════════════════════════════════════════════════════════
            SECTION 3 — Weekly Schedule
        ══════════════════════════════════════════════════════════════ */}
        {activeSection === 3 && (
          <Section title="Weekly Schedule" icon="🕐">
            <div className="space-y-3">
              {form.weeklySchedule.map((day, idx) => (
                <div key={day.day} className={`rounded-xl border p-3 transition-colors ${
                  day.enabled ? 'border-blue-100 bg-blue-50/30' : 'border-gray-100 bg-gray-50/50'
                }`}>
                  <div className="flex items-center gap-3 mb-2">
                    <button type="button"
                      onClick={() => setSchedule(idx, { enabled: !day.enabled })}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${
                        day.enabled ? 'bg-blue-600' : 'bg-gray-200'
                      }`}>
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                        day.enabled ? 'translate-x-4.5' : 'translate-x-0.5'
                      }`} />
                    </button>
                    <span className="text-sm font-semibold text-gray-800 w-24">{day.day}</span>
                    {day.enabled && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1">
                          <input type="time" className="input py-1 px-2 text-xs w-28"
                            value={day.openingTime}
                            onChange={(e) => setSchedule(idx, { openingTime: e.target.value })} />
                          <span className="text-gray-400 text-xs">to</span>
                          <input type="time" className="input py-1 px-2 text-xs w-28"
                            value={day.closingTime}
                            onChange={(e) => setSchedule(idx, { closingTime: e.target.value })} />
                        </div>
                      </div>
                    )}
                  </div>
                  {day.enabled && (
                    <div className="flex items-center gap-2 ml-12 flex-wrap">
                      <span className="text-xs text-gray-400">Break:</span>
                      <input type="time" className="input py-1 px-2 text-xs w-24"
                        value={day.breakStart || ''}
                        placeholder="Start"
                        onChange={(e) => setSchedule(idx, { breakStart: e.target.value })} />
                      <span className="text-xs text-gray-400">–</span>
                      <input type="time" className="input py-1 px-2 text-xs w-24"
                        value={day.breakEnd || ''}
                        placeholder="End"
                        onChange={(e) => setSchedule(idx, { breakEnd: e.target.value })} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ══════════════════════════════════════════════════════════════
            SECTION 4 — Facilities & Services
        ══════════════════════════════════════════════════════════════ */}
        {activeSection === 4 && (
          <Section title="Facilities &amp; Services" icon="🏗️">
            <div className="space-y-5">
              <div>
                <Label>Facilities</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {FACILITIES.map((f) => (
                    <Chip key={f} active={form.facilities.includes(f)} onClick={() => toggleArr('facilities', f)}>{f}</Chip>
                  ))}
                </div>
              </div>
              <div>
                <Label>Languages Spoken</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {LANGUAGES.map((l) => (
                    <Chip key={l} active={form.languagesSpoken.includes(l)} onClick={() => toggleArr('languagesSpoken', l)}>{l}</Chip>
                  ))}
                </div>
              </div>
              <div>
                <Label>Payment Methods</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {PAYMENT_METHODS.map((p) => (
                    <Chip key={p} active={form.paymentMethods.includes(p)} onClick={() => toggleArr('paymentMethods', p)}>{p}</Chip>
                  ))}
                </div>
              </div>
              <div>
                <Label>Insurance Providers</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {INSURANCE_OPTIONS.map((i) => (
                    <Chip key={i} active={form.insuranceSupported.includes(i)} onClick={() => toggleArr('insuranceSupported', i)}>{i}</Chip>
                  ))}
                </div>
              </div>
            </div>
          </Section>
        )}

        {/* ══════════════════════════════════════════════════════════════
            SECTION 5 — Documents & Compliance
        ══════════════════════════════════════════════════════════════ */}
        {activeSection === 5 && (
          <Section title="Documents &amp; Compliance" icon="📋">
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label required>Registration No.</Label>
                  <input className="input" value={form.clinicRegistrationNumber}
                    onChange={(e) => set('clinicRegistrationNumber', e.target.value)} />
                </div>
                <div>
                  <Label>GST Number</Label>
                  <input className="input" value={form.gstNumber}
                    onChange={(e) => set('gstNumber', e.target.value)} />
                </div>
                <div>
                  <Label>PAN Number</Label>
                  <input className="input" value={form.panNumber}
                    onChange={(e) => set('panNumber', e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FileField label="Clinic License" fieldKey="licenseDocumentUrl" required
                  value={form.licenseDocumentUrl} onUpload={handleUpload} uploading={uploading} />
                <FileField label="Medical Establishment Certificate" fieldKey="medicalEstablishmentCertificateUrl" required
                  value={form.medicalEstablishmentCertificateUrl} onUpload={handleUpload} uploading={uploading} />
                <FileField label="GST Certificate" fieldKey="gstCertificateUrl"
                  value={form.gstCertificateUrl} onUpload={handleUpload} uploading={uploading} />
                <FileField label="PAN Card" fieldKey="panCardUrl"
                  value={form.panCardUrl} onUpload={handleUpload} uploading={uploading} />
              </div>

              {/* Additional documents */}
              <div>
                <Label>Additional Documents</Label>
                <div className="flex flex-wrap gap-2 mt-1 mb-2">
                  {form.additionalDocuments.map((url, i) => (
                    <div key={i} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-medium text-gray-700">
                      <span>📎 Doc {i + 1}</span>
                      <button type="button"
                        onClick={() => set('additionalDocuments', form.additionalDocuments.filter((_, j) => j !== i))}
                        className="text-gray-400 hover:text-red-500 ml-1">✕</button>
                    </div>
                  ))}
                </div>
                <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-300 cursor-pointer transition-all">
                  <input type="file" accept=".pdf,image/*" multiple className="hidden"
                    disabled={!!uploading}
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      for (const file of files) {
                        setUploading('additionalDocuments');
                        try {
                          const res = await uploadClinicOwnerDocument(file, 'additionalDocuments');
                          const url = res.data?.data?.url || '';
                          if (url) set('additionalDocuments', [...(form.additionalDocuments || []), url]);
                        } catch { toast.error('Upload failed'); }
                        setUploading('');
                      }
                    }} />
                  <span className="text-xs text-gray-500 font-medium">📎 Upload additional documents</span>
                </label>
              </div>
            </div>
          </Section>
        )}

        {/* ── Navigation + Submit ─────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between gap-3 sticky bottom-4">
          <div className="flex gap-2">
            {activeSection > 0 && (
              <button type="button" onClick={() => setActiveSection((s) => s - 1)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                ← Prev
              </button>
            )}
            {activeSection < SECTIONS.length - 1 && (
              <button type="button" onClick={() => setActiveSection((s) => s + 1)}
                className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors">
                Next →
              </button>
            )}
          </div>

          {/* Section indicator */}
          <div className="flex gap-1.5">
            {SECTIONS.map((_, i) => (
              <button key={i} type="button" onClick={() => setActiveSection(i)}
                className={`w-2 h-2 rounded-full transition-colors ${i === activeSection ? 'bg-blue-600' : 'bg-gray-200'}`} />
            ))}
          </div>

          <button type="button" onClick={handleSubmit}
            disabled={submitting || !!uploading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm">
            {submitting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Submitting…
              </>
            ) : (
              '🚀 Submit for Review'
            )}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ClinicEditResubmit;
