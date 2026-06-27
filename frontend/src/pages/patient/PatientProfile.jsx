import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getPatientProfile, updatePatientProfile } from '../../api/patient.api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import {
  BLOOD_GROUPS, POPULAR_CITIES,
  capitaliseName, calcAge,
  validateName, validateGender, validateDob,
  validateCity, validateEmergencyContact, normalisePhone,
} from '../../utils/profileValidation';

// Only the fields that truly matter for healthcare
const calcCompletion = (user, p) => {
  const checks = [
    { label: 'Name',              done: !!user?.name,             weight: 25 },
    { label: 'Gender',            done: !!p?.gender,              weight: 20 },
    { label: 'Date of Birth',     done: !!(p?.dob || p?.age),     weight: 20 },
    { label: 'Blood Group',       done: !!p?.bloodGroup,          weight: 15 },
    { label: 'Emergency Contact', done: !!p?.emergencyContact,    weight: 20 },
  ];
  const pct = checks.reduce((s, c) => s + (c.done ? c.weight : 0), 0);
  const missing = checks.filter((c) => !c.done).map((c) => c.label);
  return { pct, missing };
};

const PatientProfile = () => {
  const { updateUser } = useAuthStore();
  const [profile, setProfile]       = useState(null);
  const [completion, setCompletion] = useState({ pct: 0, missing: [] });
  const [isLoading, setIsLoading]   = useState(true);
  const [isSaving, setIsSaving]     = useState(false);
  const [isEditing, setIsEditing]   = useState(false);
  const [formData, setFormData]     = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [cityQuery, setCityQuery]   = useState('');
  const [showCityDrop, setShowCityDrop] = useState(false);
  const cityRef = useRef(null);

  const userPhone = useAuthStore.getState().user?.mobile || '';

  const loadProfile = async () => {
    try {
      const res = await getPatientProfile();
      const user = res.data.data.user;
      setProfile(user);
      setCompletion(calcCompletion(user, user?.patientProfile));
      const p = user?.patientProfile;
      setFormData({
        name:             user.name || '',
        gender:           p?.gender || '',
        dob:              p?.dob ? p.dob.split('T')[0] : '',
        city:             p?.city || '',
        bloodGroup:       p?.bloodGroup || '',
        emergencyContact: p?.emergencyContact ? normalisePhone(p.emergencyContact) : '',
        allergies:        p?.allergies || '',
        existingDiseases: p?.existingDiseases || '',
      });
      setCityQuery(p?.city || '');
    } catch {
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadProfile(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (isSaving) return; // double-submit guard

    // Run all validations
    const errs = {
      name:             validateName(formData.name),
      gender:           validateGender(formData.gender),
      dob:              validateDob(formData.dob),
      city:             validateCity(formData.city),
      emergencyContact: validateEmergencyContact(formData.emergencyContact, userPhone),
    };
    setFormErrors(errs);
    if (Object.values(errs).some(Boolean)) {
      toast.error('Please fix the highlighted errors before saving.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await updatePatientProfile({
        name:             formData.name.trim(),
        gender:           formData.gender            || undefined,
        dob:              formData.dob               || undefined,
        city:             formData.city.trim()        || undefined,
        emergencyContact: normalisePhone(formData.emergencyContact).length === 10
                            ? `+91${normalisePhone(formData.emergencyContact)}` : undefined,
        bloodGroup:       formData.bloodGroup,
        allergies:        formData.allergies,
        existingDiseases: formData.existingDiseases,
      });
      const user = res.data.data.user;
      setProfile(user);
      setCompletion(calcCompletion(user, user?.patientProfile));
      setCityQuery(user?.patientProfile?.city || '');
      updateUser({ name: user.name });
      setIsEditing(false);
      setFormErrors({});
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const set = (field, val) => {
    setFormData((f) => ({ ...f, [field]: val }));
    setFormErrors((e) => ({ ...e, [field]: null }));
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

  const p = profile?.patientProfile;
  const age = p?.dob
    ? Math.floor((new Date() - new Date(p.dob)) / (365.25 * 24 * 60 * 60 * 1000))
    : p?.age;

  const completionColor =
    completion.pct === 100 ? 'bg-green-500' :
    completion.pct >= 60   ? 'bg-yellow-500' : 'bg-red-400';

  return (
    <DashboardLayout>
      <div className="page-container max-w-lg">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-text-primary">My Profile</h1>
          {!isEditing && (
            <button onClick={() => setIsEditing(true)} className="btn-outline text-sm py-2 px-4">
              ✏️ Edit
            </button>
          )}
        </div>

        {/* Avatar + name card */}
        <div className="card mb-4 flex items-center gap-4">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-primary-700 font-bold text-2xl">
              {profile?.name?.charAt(0)?.toUpperCase() || 'P'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-text-primary truncate">{profile?.name || 'Patient'}</h2>
            <p className="text-text-muted text-sm">{profile?.mobile}</p>
            {age && <p className="text-sm text-text-muted">{age} years • {p?.gender || ''}</p>}
            {/* Verified / Pending badge */}
            {(profile?.isPhoneVerified || profile?.isEmailVerified) ? (
              <span className="inline-flex items-center gap-1 mt-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                Verified Account
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 mt-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                Verification Pending
              </span>
            )}
          </div>
          {/* Blood group badge */}
          {p?.bloodGroup && (
            <div className="flex-shrink-0 w-12 h-12 bg-red-50 border-2 border-red-200 rounded-xl flex items-center justify-center">
              <span className="text-red-600 font-bold text-sm">{p.bloodGroup}</span>
            </div>
          )}
        </div>

        {/* Completion bar — only show if incomplete */}
        {completion.pct < 100 && (
          <div className="card mb-4 bg-yellow-50 border border-yellow-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-yellow-800">Complete your profile</p>
              <span className="text-sm font-bold text-yellow-700">{completion.pct}%</span>
            </div>
            <div className="w-full bg-yellow-100 rounded-full h-2 mb-2">
              <div
                className={`h-2 rounded-full transition-all duration-700 ${completionColor}`}
                style={{ width: `${completion.pct}%` }}
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {completion.missing.map((m) => (
                <button
                  key={m}
                  onClick={() => setIsEditing(true)}
                  className="text-xs bg-white border border-yellow-300 text-yellow-700 px-2 py-0.5 rounded-full hover:bg-yellow-50"
                >
                  + {m}
                </button>
              ))}
            </div>
          </div>
        )}

        {isEditing ? (
          /* ── Edit Form ──────────────────────────────────────────── */
          <form onSubmit={handleSave} className="card space-y-5">
            <h3 className="font-semibold text-text-primary">Edit Profile</h3>

            {/* Name */}
            <div>
              <label className="label">Full Name <span className="text-red-500">*</span></label>
              <input
                className={`input w-full ${formErrors.name ? 'border-red-400' : ''}`}
                value={formData.name}
                onChange={(e) => set('name', capitaliseName(e.target.value))}
                placeholder="e.g. Rahul Kumar Sharma"
                maxLength={60}
              />
              {formErrors.name && <p className="text-xs text-red-500 mt-1">⚠️ {formErrors.name}</p>}
            </div>

            {/* Gender + DOB */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Gender <span className="text-red-500">*</span></label>
                <select
                  className={`input w-full ${formErrors.gender ? 'border-red-400' : ''}`}
                  value={formData.gender}
                  onChange={(e) => set('gender', e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
                {formErrors.gender && <p className="text-xs text-red-500 mt-1">⚠️ {formErrors.gender}</p>}
              </div>
              <div>
                <label className="label">Date of Birth <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  className={`input w-full ${formErrors.dob ? 'border-red-400' : ''}`}
                  value={formData.dob}
                  max={new Date().toISOString().split('T')[0]}
                  min="1900-01-01"
                  onChange={(e) => set('dob', e.target.value)}
                />
                {formErrors.dob && <p className="text-xs text-red-500 mt-1">⚠️ {formErrors.dob}</p>}
                {!formErrors.dob && calcAge(formData.dob) !== null && (
                  <p className="text-xs text-emerald-600 mt-1">Age: {calcAge(formData.dob)} years</p>
                )}
              </div>
            </div>

            {/* City */}
            <div>
              <label className="label">City <span className="text-red-500">*</span></label>
              <div className="relative" ref={cityRef}>
                <input
                  type="text"
                  className={`input w-full ${formErrors.city ? 'border-red-400' : ''}`}
                  value={cityQuery}
                  placeholder="Search city…"
                  onChange={(e) => { setCityQuery(e.target.value); set('city', e.target.value); setShowCityDrop(true); }}
                  onFocus={() => setShowCityDrop(true)}
                  onBlur={() => setTimeout(() => setShowCityDrop(false), 150)}
                  maxLength={60}
                />
                {showCityDrop && (
                  <ul className="absolute z-50 w-full bg-white border border-border rounded-xl shadow-lg max-h-44 overflow-y-auto mt-1">
                    {(cityQuery.trim().length >= 1
                      ? POPULAR_CITIES.filter(c => c.toLowerCase().includes(cityQuery.toLowerCase()))
                      : POPULAR_CITIES.slice(0, 10)
                    ).map((c) => (
                      <li key={c}
                        className="px-4 py-2 cursor-pointer hover:bg-primary-50 text-sm font-medium text-text-primary"
                        onMouseDown={() => { set('city', c); setCityQuery(c); setShowCityDrop(false); }}>
                        📍 {c}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {formErrors.city && <p className="text-xs text-red-500 mt-1">⚠️ {formErrors.city}</p>}
            </div>

            {/* Blood Group */}
            <div>
              <label className="label">Blood Group <span className="text-red-500">*</span></label>
              <div className="flex flex-wrap gap-2">
                {BLOOD_GROUPS.map((bg) => (
                  <button key={bg} type="button"
                    onClick={() => set('bloodGroup', formData.bloodGroup === bg ? '' : bg)}
                    className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                      formData.bloodGroup === bg
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-border text-text-muted hover:border-gray-300'
                    }`}>
                    {bg}
                  </button>
                ))}
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <label className="label">Emergency Contact <span className="text-red-500">*</span></label>
              <div className={`flex items-center border-2 rounded-xl overflow-hidden ${formErrors.emergencyContact ? 'border-red-400' : 'border-border'}`}>
                <span className="px-3 py-2.5 bg-gray-50 border-r border-border text-sm font-semibold text-gray-600 select-none whitespace-nowrap">🇮🇳 +91</span>
                <input
                  type="tel"
                  className="flex-1 px-3 py-2.5 outline-none text-base"
                  value={normalisePhone(formData.emergencyContact)}
                  onChange={(e) => set('emergencyContact', normalisePhone(e.target.value))}
                  placeholder="9876543210"
                  maxLength={10}
                />
              </div>
              <p className="text-xs text-text-muted mt-0.5">{normalisePhone(formData.emergencyContact).length}/10 digits</p>
              {formErrors.emergencyContact && <p className="text-xs text-red-500 mt-1">⚠️ {formErrors.emergencyContact}</p>}
            </div>

            {/* Allergies */}
            <div>
              <label className="label">Known Allergies <span className="text-text-muted font-normal text-xs">(optional)</span></label>
              <input className="input w-full" value={formData.allergies}
                onChange={(e) => set('allergies', e.target.value)}
                placeholder="e.g. Penicillin, Dust, Peanuts" />
            </div>

            {/* Existing Conditions */}
            <div>
              <label className="label">Existing Conditions <span className="text-text-muted font-normal text-xs">(optional)</span></label>
              <input className="input w-full" value={formData.existingDiseases}
                onChange={(e) => set('existingDiseases', e.target.value)}
                placeholder="e.g. Diabetes, Hypertension" />
            </div>

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => { setIsEditing(false); setFormErrors({}); }} className="btn-ghost flex-1">
                Cancel
              </button>
              <button type="submit" className="btn-primary flex-1" disabled={isSaving}>
                {isSaving ? <LoadingSpinner size="sm" className="mx-auto" /> : '💾 Save'}
              </button>
            </div>
          </form>
        ) : (
          /* ── View Mode ──────────────────────────────────────────── */
          <div className="space-y-3">

            {/* Essential info */}
            <div className="card">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">Essential Info</h3>
              <div className="grid grid-cols-2 gap-4">
                <InfoItem label="Gender"           value={p?.gender} />
                <InfoItem label="Age"              value={age ? `${age} yrs` : null} />
                <InfoItem label="Date of Birth"    value={p?.dob ? new Date(p.dob).toLocaleDateString('en-IN') : null} />
                <InfoItem label="Blood Group"      value={p?.bloodGroup} highlight={!!p?.bloodGroup} />
                <InfoItem label="Emergency Contact" value={p?.emergencyContact} span />
              </div>
            </div>

            {/* Medical info — only show if at least one is filled */}
            {(p?.allergies || p?.existingDiseases) && (
              <div className="card">
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">Medical Info</h3>
                <div className="grid grid-cols-1 gap-3">
                  {p?.allergies && (
                    <div className="flex items-start gap-3 bg-orange-50 rounded-lg p-3">
                      <span className="text-lg">⚠️</span>
                      <div>
                        <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide">Allergies</p>
                        <p className="text-sm text-orange-800 mt-0.5">{p.allergies}</p>
                      </div>
                    </div>
                  )}
                  {p?.existingDiseases && (
                    <div className="flex items-start gap-3 bg-blue-50 rounded-lg p-3">
                      <span className="text-lg">🏥</span>
                      <div>
                        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Existing Conditions</p>
                        <p className="text-sm text-blue-800 mt-0.5">{p.existingDiseases}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Prompt to fill missing critical fields */}
            {completion.pct < 100 && (
              <button
                onClick={() => setIsEditing(true)}
                className="w-full card border-dashed border-2 border-primary-200 text-primary-600 text-sm font-medium py-3 hover:bg-primary-50 transition-colors text-center"
              >
                + Complete your profile ({completion.missing.join(', ')})
              </button>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

const InfoItem = ({ label, value, span, highlight }) => (
  <div className={span ? 'col-span-2' : ''}>
    <p className="text-xs text-text-muted font-medium uppercase tracking-wide">{label}</p>
    {value ? (
      <p className={`mt-0.5 font-medium ${highlight ? 'text-red-600 text-lg' : 'text-text-primary'}`}>
        {value}
      </p>
    ) : (
      <p className="mt-0.5 text-gray-300 text-sm">Not set</p>
    )}
  </div>
);

export default PatientProfile;
