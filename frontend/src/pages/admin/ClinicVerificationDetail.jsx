// ─────────────────────────────────────────────────────────────────────────────
//  ClinicVerificationDetail — Full clinic detail + approve/reject/etc actions
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import {
  getAdminClinicDetail,
  approveClinic,
  rejectClinic,
  requestClinicChanges,
  suspendClinic,
} from '../../api/admin.api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatusBadge from '../../components/ui/StatusBadge';
import toast from 'react-hot-toast';
import { getFileUrl } from '../../utils/fileUrl';

// ── Image with graceful fallback ──────────────────────────────────────────────
// Never shows a broken image icon. Falls back to a clean placeholder when:
//  - src is null/empty
//  - URL resolves but returns 404 or a network error (onError fires)
const SafeImage = ({ src, alt, className, fallbackClassName, fallbackIcon, fallbackText }) => {
  // useState MUST be before any conditional return (Rules of Hooks)
  const [broken, setBroken] = useState(false);
  const resolvedSrc = getFileUrl(src);

  if (!resolvedSrc || broken) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 select-none ${fallbackClassName}`}
      >
        <span className="text-3xl leading-none">{fallbackIcon || '🖼️'}</span>
        <span className="text-xs font-semibold tracking-wide">{fallbackText || 'No image'}</span>
      </div>
    );
  }

  return (
    <img
      key={resolvedSrc}
      src={resolvedSrc}
      alt={alt}
      className={className}
      onError={() => setBroken(true)}
      loading="lazy"
    />
  );
};

// ── small helpers ─────────────────────────────────────────────────────────────
const Section = ({ title, icon, children }) => (
  <div className="card mb-4">
    <h2 className="flex items-center gap-2 text-base font-bold text-gray-900 mb-4">
      <span>{icon}</span> {title}
    </h2>
    {children}
  </div>
);

const Field = ({ label, value }) => (
  <div className="mb-3">
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
    <p className="mt-0.5 text-sm text-gray-800">{value || <span className="text-gray-400 italic">—</span>}</p>
  </div>
);

// DocLink — renders image preview or a download button for documents.
// Uses getFileUrl so all paths (absolute or relative) are resolved correctly.
const DocLink = ({ label, url }) => {
  // useState MUST come before any conditional returns (Rules of Hooks)
  const [broken, setBroken] = useState(false);

  const resolvedUrl = getFileUrl(url);

  // Nothing to show
  if (!url || !resolvedUrl) return null;

  // Detect file type from the RESOLVED path (reliable regardless of stored format)
  const lower = resolvedUrl.toLowerCase().split('?')[0]; // strip query strings
  const isImage = /\.(jpg|jpeg|png|webp|gif)$/.test(lower);
  const isPdf   = lower.endsWith('.pdf');

  return (
    <div className="mb-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{label}</p>

      {isImage && !broken ? (
        <a href={resolvedUrl} target="_blank" rel="noopener noreferrer" title="Click to open full size">
          <img
            src={resolvedUrl}
            alt={label}
            className="rounded-xl max-h-48 w-auto object-contain border border-gray-200 bg-gray-50 hover:opacity-90 transition-opacity cursor-zoom-in"
            onError={() => setBroken(true)}
            loading="lazy"
          />
        </a>
      ) : isImage && broken ? (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-50 border border-dashed border-gray-200 text-gray-400 text-xs font-medium">
          🖼️ Image unavailable
        </div>
      ) : isPdf ? (
        <a
          href={resolvedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-700 text-sm font-semibold hover:bg-red-100 border border-red-100 transition-colors"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 7V3.5L18.5 9H13zM8 13h8v1.5H8V13zm0 3h8v1.5H8V16zm0-6h3v1.5H8V10z"/>
          </svg>
          View PDF
        </a>
      ) : (
        <a
          href={resolvedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 text-blue-700 text-sm font-semibold hover:bg-blue-100 border border-blue-100 transition-colors"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          View / Download
        </a>
      )}
    </div>
  );
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// ── Shared modal primitives ───────────────────────────────────────────────────

// Full-screen backdrop + centred card — no dependency on the generic Modal component
const ActionModal = ({ children, onClose }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    role="dialog"
    aria-modal="true"
  >
    {/* Backdrop */}
    <div
      className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    />
    {/* Card */}
    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10 animate-scale-bounce">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        aria-label="Close"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      {children}
    </div>
  </div>
);

// Textarea with label, character count, and inline error message
const ReasonField = ({ label, placeholder, value, onChange, error }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
      {label} <span className="text-red-500">*</span>
    </label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={4}
      className={`w-full px-3 py-2.5 text-sm border rounded-xl resize-none bg-white text-gray-800 placeholder-gray-400
        focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all
        ${error
          ? 'border-red-400 focus:ring-red-300'
          : 'border-gray-200 focus:ring-blue-400 focus:border-transparent'
        }`}
    />
    <div className="flex items-center justify-between mt-1">
      {error
        ? <p className="text-xs text-red-500 font-medium">{error}</p>
        : <span />
      }
      <p className={`text-xs ml-auto ${value.length > 400 ? 'text-red-400' : 'text-gray-400'}`}>
        {value.length}/500
      </p>
    </div>
  </div>
);

// Tiny inline spinner for button loading state
const Spinner = () => (
  <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
  </svg>
);

// ── Main Component ──────────────────────────────────────────────────────────
const ClinicVerificationDetail = () => {
  const { clinicId } = useParams();
  const navigate = useNavigate();
  const [clinic, setClinic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // modal: { type: 'approve'|'reject'|'request-changes'|'suspend'|null, reason: '', reasonTouched: false }
  const [modal, setModal] = useState({ type: null, reason: '', reasonTouched: false });

  const openModal  = (type) => setModal({ type, reason: '', reasonTouched: false });
  const closeModal = ()     => { if (!actionLoading) setModal({ type: null, reason: '', reasonTouched: false }); };

  const loadClinic = () =>
    getAdminClinicDetail(clinicId)
      .then((res) => setClinic(res.data.data?.clinic))
      .catch(() => toast.error('Failed to load clinic'));

  useEffect(() => {
    loadClinic().finally(() => setLoading(false));
  }, [clinicId]); // eslint-disable-line react-hooks/exhaustive-deps

  const needsReason = ['reject', 'request-changes', 'suspend'].includes(modal.type);
  const reasonEmpty = !modal.reason.trim();
  const showReasonError = modal.reasonTouched && needsReason && reasonEmpty;

  const handleAction = async () => {
    if (needsReason && reasonEmpty) {
      setModal((p) => ({ ...p, reasonTouched: true }));
      return;
    }
    setActionLoading(true);
    try {
      const r = modal.reason.trim();
      if      (modal.type === 'approve')          await approveClinic(clinic.id);
      else if (modal.type === 'reject')           await rejectClinic(clinic.id, r);
      else if (modal.type === 'request-changes')  await requestClinicChanges(clinic.id, r);
      else if (modal.type === 'suspend')          await suspendClinic(clinic.id, r);

      const labels = {
        approve: 'Clinic approved successfully',
        reject: 'Clinic rejected',
        'request-changes': 'Changes requested from clinic owner',
        suspend: 'Clinic suspended',
      };
      toast.success(labels[modal.type]);
      closeModal();
      await loadClinic();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <DashboardLayout>
      <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
    </DashboardLayout>
  );

  if (!clinic) return (
    <DashboardLayout>
      <div className="page-container text-center py-20 text-gray-400">Clinic not found</div>
    </DashboardLayout>
  );

  // Extract data from both Clinic table and clinicOnboardingData (original form)
  const onboarding = clinic.clinicOnboardingData || {};
  const step1 = onboarding.clinicInformation || {};
  const step2 = onboarding.servicesOperations || {};
  const step3 = onboarding.clinicDocuments || {};
  const step4 = onboarding.partnerAgreement || {};

  const owner = clinic.owner || {};
  const schedule = Array.isArray(clinic.weeklySchedule) ? clinic.weeklySchedule : 
                   (step2.operatingHours ? Object.entries(step2.operatingHours).map(([day, hours]) => ({
                     day,
                     enabled: hours.isOpen,
                     openingTime: hours.from,
                     closingTime: hours.to,
                     isOpen: hours.isOpen
                   })) : []);
  const additionalDocs = Array.isArray(clinic.additionalDocuments)
    ? clinic.additionalDocuments
    : clinic.additionalDocuments?.docs || [];

  // Helper to get value from Clinic table or fallback to onboarding data
  const getValue = (clinicField, onboardingField) => clinicField || onboardingField || null;

  const canApprove       = !['VERIFIED'].includes(clinic.approvalStatus);
  const canReject        = !['REJECTED'].includes(clinic.approvalStatus);
  const canRequestChanges= !['CHANGES_REQUIRED', 'VERIFIED'].includes(clinic.approvalStatus);
  const canSuspend       = clinic.approvalStatus === 'VERIFIED';

  return (
    <DashboardLayout>
      <div className="page-container max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
          <div>
            <button onClick={() => navigate(-1)} className="text-sm text-blue-600 hover:underline mb-2 inline-block">← Back</button>
            <h1 className="text-2xl font-bold text-gray-900">{clinic.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <StatusBadge status={clinic.approvalStatus} />
              {clinic.submittedAt && (
                <span className="text-xs text-gray-400">
                  Submitted {new Date(clinic.submittedAt).toLocaleDateString('en-IN')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Section 1: Clinic Information (Complete Info from Step 1) ── */}
        <Section title="Clinic Information" icon="🏥">
          {/* Clinic Basic Info */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-100">📋 Clinic Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Clinic Name" value={getValue(clinic.name, step1.clinicName)} />
              <Field label="Clinic Type" value={getValue(clinic.clinicType, step1.clinicType)} />
              <Field label="Display Name" value={getValue(clinic.displayName, step1.displayName) || '(Same as clinic name)'} />
              {(clinic.clinicTypeOther || step1.clinicTypeOther) && <Field label="Custom Type" value={getValue(clinic.clinicTypeOther, step1.clinicTypeOther)} />}
            </div>
          </div>

          {/* Owner / Administrator Details */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-100">👤 Owner / Administrator Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Owner Name" value={step1.ownerName || owner.name || step4.ownerName} />
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Owner Email</p>
                <p className="text-sm text-gray-800">{step1.ownerEmail || owner.email || <span className="text-gray-400 italic">—</span>}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Email Verified</p>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                  owner.isEmailVerified ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {owner.isEmailVerified ? '✅ Yes' : '❌ No'}
                </span>
              </div>
              <Field label="Owner Mobile" value={step1.ownerMobile || owner.mobile} />
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Mobile Verified</p>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                  (step1.mobileVerified || owner.isPhoneVerified) ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {(step1.mobileVerified || owner.isPhoneVerified) ? '✅ Yes' : '❌ No'}
                </span>
              </div>
            </div>
          </div>

          {/* Clinic's Primary Contact */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-100">📞 Clinic's Primary Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field 
                label="Primary Contact Number" 
                value={step1.sameAsOwner ? `${step1.ownerMobile} (Same as owner)` : (step1.primaryContactPhone || clinic.phone)} 
              />
              {!step1.sameAsOwner && step1.primaryContactPhone && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-xs font-semibold text-blue-700 mb-1">ℹ️ Note</p>
                  <p className="text-xs text-blue-600">Clinic uses a different contact number than owner's mobile</p>
                </div>
              )}
            </div>
          </div>

          {/* Clinic Location */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-100">📍 Clinic Location and Address</h3>
            
            {/* Map Coordinates */}
            {(step1.latitude || clinic.latitude) && (step1.longitude || clinic.longitude) && (
              <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-xs font-bold text-blue-700 mb-1">Latitude</p>
                      <p className="text-sm text-blue-900 font-mono font-semibold">{step1.latitude || clinic.latitude}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-blue-700 mb-1">Longitude</p>
                      <p className="text-sm text-blue-900 font-mono font-semibold">{step1.longitude || clinic.longitude}</p>
                    </div>
                  </div>
                  <a
                    href={`https://www.google.com/maps?q=${step1.latitude || clinic.latitude},${step1.longitude || clinic.longitude}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all hover:shadow-lg"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    View Location on Google Maps
                  </a>
                </div>
              </div>
            )}

            {/* Address Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="md:col-span-3">
                <Field label="Complete Address" value={step1.addressLine1 || clinic.address} />
              </div>
              {step1.addressLine2 && <div className="md:col-span-3"><Field label="Address Line 2" value={step1.addressLine2} /></div>}
              {step1.locality && <Field label="Locality" value={step1.locality} />}
              <Field label="Landmark" value={step1.landmark || clinic.landmark} />
              <Field label="City" value={step1.city || clinic.city} />
              <Field label="District" value={step1.district || clinic.district} />
              <Field label="State" value={step1.state || clinic.state} />
              <Field label="Pincode" value={step1.pincode || clinic.pincode} />
              <Field label="Country" value={step1.country || 'India'} />
            </div>
          </div>
        </Section>

        {/* ── Section 2: Services & Operations (Complete Step 2 Data) ── */}
        <Section title="Services & Operations" icon="⚕️">
          {/* Primary Specialties */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-100">🩺 Primary Specialties</h3>
            <p className="text-xs text-gray-500 mb-3 italic">Select all specialties your clinic offers</p>
            <div className="flex flex-wrap gap-2">
              {/* Show specialties from Step 2 form data */}
              {(step2.specialties && step2.specialties.length > 0) ? (
                step2.specialties.map((s) => (
                  <span key={s} className="px-4 py-2 rounded-lg bg-blue-50 text-blue-700 text-sm font-semibold border border-blue-200 hover:bg-blue-100 transition-colors shadow-sm">{s}</span>
                ))
              ) : (clinic.specialties && clinic.specialties.length > 0) ? (
                clinic.specialties.map((s) => (
                  <span key={s} className="px-4 py-2 rounded-lg bg-blue-50 text-blue-700 text-sm font-semibold border border-blue-200 hover:bg-blue-100 transition-colors shadow-sm">{s}</span>
                ))
              ) : (
                <span className="px-4 py-2 rounded-lg bg-gray-50 text-gray-400 text-sm font-medium border border-gray-200">No specialties listed</span>
              )}
              
              {/* Show "Other" specialty if provided */}
              {(step2.specialtyOther || clinic.specialtyOther) && (
                <span className="px-4 py-2 rounded-lg bg-purple-50 text-purple-700 text-sm font-semibold border border-purple-200 hover:bg-purple-100 transition-colors shadow-sm">
                  {step2.specialtyOther || clinic.specialtyOther} <span className="text-xs opacity-70">(Other)</span>
                </span>
              )}
            </div>
          </div>

          {/* Consultation Types */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-100">💬 Consultation Types</h3>
            <p className="text-xs text-gray-500 mb-3 italic">How can patients consult with your doctors?</p>
            
            <div className="flex flex-wrap gap-3">
              {[
                { label: 'In-Person (Offline)', values: ['IN_PERSON', 'OFFLINE', 'In-Person (Offline)'], icon: '🏥' },
                { label: 'Video Call (Online)', values: ['VIDEO_CALL', 'ONLINE', 'Video Call (Online)'], icon: '📹' },
                { label: 'Home Visit', values: ['HOME_VISIT', 'Home Visit'], icon: '🏠' }
              ].map(({ label, values, icon }) => {
                // Get consultation types from multiple possible sources
                const consultationTypes = step2.consultationTypes || clinic.consultationModes || [];
                
                // Check if ANY of the possible values match (case-insensitive and trim whitespace)
                const isActive = Array.isArray(consultationTypes) && values.some(val => 
                  consultationTypes.some(ct => 
                    String(ct).trim().toUpperCase() === String(val).trim().toUpperCase()
                  )
                );
                
                return (
                  <div key={label} className={`px-4 py-3 rounded-lg text-sm font-semibold border-2 transition-all ${
                    isActive
                      ? 'bg-green-50 text-green-700 border-green-300 shadow-sm'
                      : 'bg-gray-50 text-gray-400 border-gray-200 opacity-50 line-through'
                  }`}>
                    <span className="mr-2">{icon}</span>
                    {label}
                  </div>
                );
              })}
            </div>
            
            {/* Show no consultation types message if empty */}
            {(!step2.consultationTypes || step2.consultationTypes.length === 0) && 
             (!clinic.consultationModes || clinic.consultationModes.length === 0) && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-400 italic">
                No consultation types specified
              </div>
            )}
          </div>

          {/* Operating Hours & Schedule */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-100">🕐 Operating Hours & Weekly Schedule</h3>
            <p className="text-xs text-gray-500 mb-3 italic">Define your clinic's operating hours and weekly off days</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">Opening Time</p>
                <div className="px-4 py-2.5 rounded-lg bg-green-50 text-green-700 text-base font-semibold border border-green-200">
                  {step2.openingTime || '—'}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">Closing Time</p>
                <div className="px-4 py-2.5 rounded-lg bg-red-50 text-red-700 text-base font-semibold border border-red-200">
                  {step2.closingTime || '—'}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">Weekly Off Days</p>
                <div className="flex flex-wrap gap-2">
                  {step2.weeklyOffDays && step2.weeklyOffDays.length > 0 ? (
                    step2.weeklyOffDays.map((day) => (
                      <span key={day} className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-sm font-semibold border border-red-200 uppercase">{day}</span>
                    ))
                  ) : (
                    <span className="px-3 py-1.5 rounded-lg bg-gray-50 text-gray-400 text-sm font-medium border border-gray-200">No off days</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Appointment Mode */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-100">📅 Appointment Mode</h3>
            <p className="text-xs text-gray-500 mb-3 italic">How do you accept patients at your clinic?</p>
            <div className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-50 text-blue-700 text-base font-bold border-2 border-blue-200 shadow-sm">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V9h14v10zm0-12H5V5h14v2z"/>
              </svg>
              {step2.appointmentMode || 'Not specified'}
            </div>
          </div>
        </Section>

        {/* ── Section 3: Clinic Documents (Step 3 Data) ── */}
        <Section title="Clinic Documents" icon="📋">
          {/* Mandatory Documents */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-100">📄 Mandatory Documents</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <DocLink label="Clinic Registration Certificate" url={step3.clinicRegistrationCertificate || clinic.clinicRegistrationCertificate} />
              <DocLink label="Medical Establishment License" url={step3.medicalLicense || clinic.medicalLicense} />
              <DocLink label="Owner ID Proof" url={step3.ownerIdProof || clinic.ownerIdProof} />
            </div>
          </div>

          {/* Optional Documents */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-100">📑 Optional Documents</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(step3.gstCertificate || clinic.gstCertificate) && (
                <DocLink label="GST Certificate" url={step3.gstCertificate || clinic.gstCertificate} />
              )}
              {!step3.gstCertificate && !clinic.gstCertificate && (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-400 italic">No GST certificate uploaded</div>
              )}
            </div>
          </div>

          {/* Clinic Photos */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-100">🖼️ Clinic Photos</h3>
            <p className="text-xs text-gray-500 mb-3 italic">Photos help patients recognize and trust your clinic</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Logo */}
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">Clinic Logo</p>
                <SafeImage
                  src={step3.clinicPhotos?.logo || step3.clinicLogo || clinic.clinicLogoUrl}
                  alt="Clinic Logo"
                  className="rounded-xl w-full h-32 object-contain border-2 border-gray-200 bg-white shadow-md hover:shadow-lg transition-shadow"
                  fallbackClassName="w-full h-32"
                  fallbackIcon="🏥"
                  fallbackText="No Logo"
                />
              </div>

              {/* Exterior */}
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">Clinic Exterior</p>
                <SafeImage
                  src={step3.clinicPhotos?.exterior || step3.clinicExterior || clinic.clinicExteriorUrl}
                  alt="Clinic Exterior"
                  className="rounded-xl w-full h-32 object-cover border-2 border-gray-200 bg-gray-50 shadow-md hover:shadow-lg transition-shadow"
                  fallbackClassName="w-full h-32"
                  fallbackIcon="🏢"
                  fallbackText="No Photo"
                />
              </div>

              {/* Reception */}
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">Reception Area</p>
                <SafeImage
                  src={step3.clinicPhotos?.reception || step3.clinicReception || clinic.receptionPhotoUrl}
                  alt="Reception Area"
                  className="rounded-xl w-full h-32 object-cover border-2 border-gray-200 bg-gray-50 shadow-md hover:shadow-lg transition-shadow"
                  fallbackClassName="w-full h-32"
                  fallbackIcon="🪑"
                  fallbackText="No Photo"
                />
              </div>

              {/* Consultation Room */}
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">Consultation Room</p>
                <SafeImage
                  src={step3.clinicPhotos?.consultation || step3.clinicConsultation || clinic.consultationRoomUrl}
                  alt="Consultation Room"
                  className="rounded-xl w-full h-32 object-cover border-2 border-gray-200 bg-gray-50 shadow-md hover:shadow-lg transition-shadow"
                  fallbackClassName="w-full h-32"
                  fallbackIcon="💊"
                  fallbackText="No Photo"
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-100">ℹ️ Additional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Clinic Registration Number" value={step3.clinicRegistrationNumber || clinic.clinicRegistrationNumber} />
              <Field label="GST Number" value={step3.gstNumber || clinic.gstNumber} />
              {(step3.establishedYear || clinic.establishedYear) && <Field label="Established Year" value={step3.establishedYear || clinic.establishedYear} />}
            </div>
          </div>
        </Section>

        {/* ── Section 4: Partner Agreement (Step 4 Data) ── */}
        <Section title="Partner Agreement & Compliance" icon="📜">
          <div className="p-5 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border-2 border-green-200 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white text-2xl">
                ✓
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-green-900 mb-3">Clinic Owner Acceptance</h3>
                <div className="space-y-2 text-sm text-green-800">
                  {step4.confirmAuthorized && (
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">Confirmed authorization to register this clinic</span>
                    </div>
                  )}
                  {step4.termsAccepted && (
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">Read and agreed to PulseMate Connect Clinic Partner Terms & Conditions</span>
                    </div>
                  )}
                  {step4.confirmAccurate && (
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">Confirmed that information and documents are accurate and complete</span>
                    </div>
                  )}
                  {step4.confirmCompliance && (
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">Agreed to comply with healthcare, privacy, and data protection requirements</span>
                    </div>
                  )}
                </div>
                {step4.termsAcceptedAt && (
                  <div className="mt-4 pt-3 border-t border-green-300">
                    <p className="text-xs font-semibold text-green-700">
                      Agreement Accepted: {new Date(step4.termsAcceptedAt).toLocaleString('en-IN', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    {step4.agreementVersion && (
                      <p className="text-xs text-green-600 mt-1">Version: {step4.agreementVersion}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Section>

        {/* Hidden sections remain commented out below */}
        {/* ── Section 3: Consultation Modes ── */}
        {/* TEMPORARILY HIDDEN
        <Section title="Services & Specialties" icon="⚕️">
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Primary Specialties</p>
            <div className="flex flex-wrap gap-2">
              {((clinic.specialties && clinic.specialties.length > 0) ? clinic.specialties : step2.services || []).map((s) => (
                <span key={s} className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">{s}</span>
              ))}
              {!(clinic.specialties?.length || step2.services?.length) && <span className="text-sm text-gray-400 italic">No specialties listed</span>}
              {(clinic.specialtyOther || step2.specialtyOther) && <span className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 text-xs">{clinic.specialtyOther || step2.specialtyOther}</span>}
            </div>
          </div>
        </Section>
        */}

        {/* ── Section 3: Consultation Modes ── */}
        {/* TEMPORARILY HIDDEN
        <Section title="Consultation Modes" icon="💬">
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Consultation Types</p>
            <div className="flex flex-wrap gap-2">
              {['In-Person (Offline)', 'Video Call (Online)', 'Home Visit'].map((mode, idx) => {
                const modeKeys = ['OFFLINE', 'ONLINE', 'HOME_VISIT'];
                const modes = clinic.consultationModes || step2.consultationTypes || step2.appointmentModes || [];
                const isActive = modes.includes(modeKeys[idx]) || modes.includes(mode);
                return (
                  <span key={mode} className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                    isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-400 line-through'
                  }`}>
                    {mode}
                  </span>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Appointment Mode</p>
            <div className="inline-flex px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
              {step2.appointmentMode || 'Not specified'}
            </div>
          </div>
        </Section>
        */}

        {/* ── Section 4: Weekly Timings ── */}
        {/* TEMPORARILY HIDDEN
        <Section title="Operating Hours & Weekly Schedule" icon="🕐">
          <div className="grid grid-cols-3 gap-6 mb-6">
            <Field label="Opening Time" value={step2.openingTime} />
            <Field label="Closing Time" value={step2.closingTime} />
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Weekly Off Days</p>
              <div className="flex flex-wrap gap-2">
                {step2.weeklyOffDays && step2.weeklyOffDays.length > 0 ? (
                  step2.weeklyOffDays.map((day) => (
                    <span key={day} className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-xs font-medium">{day}</span>
                  ))
                ) : (
                  <span className="text-sm text-gray-400 italic">No off days</span>
                )}
              </div>
            </div>
          </div>

          {schedule.length > 0 && (
            <div className="overflow-x-auto">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Detailed Schedule</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Day', 'Status', 'Opening', 'Closing', 'Break Start', 'Break End'].map((h) => (
                      <th key={h} className="pb-2 pr-4 text-left text-xs font-semibold text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {DAYS.map((day) => {
                    const entry = schedule.find((s) => s.day?.toLowerCase() === day.toLowerCase()) || {};
                    const isWeeklyOff = step2.weeklyOffDays?.includes(day);
                    return (
                      <tr key={day}>
                        <td className="py-2 pr-4 font-medium">{day}</td>
                        <td className="py-2 pr-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            isWeeklyOff || (entry.enabled === false) || (!entry.openingTime && !entry.isOpen)
                              ? 'bg-gray-100 text-gray-500'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {isWeeklyOff || (entry.enabled === false) || (!entry.openingTime && !entry.isOpen) ? 'Closed' : 'Open'}
                          </span>
                        </td>
                        <td className="py-2 pr-4 text-gray-500">{entry.openingTime || step2.openingTime || '—'}</td>
                        <td className="py-2 pr-4 text-gray-500">{entry.closingTime || step2.closingTime || '—'}</td>
                        <td className="py-2 pr-4 text-gray-500">{entry.breakStart || '—'}</td>
                        <td className="py-2 pr-4 text-gray-500">{entry.breakEnd || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Section>
        */}

        {/* ── Section 5: Facilities & Patient Services ── */}
        {/* TEMPORARILY HIDDEN
        <Section title="Facilities & Patient Services" icon="🏗️">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Facilities</p>
              <div className="flex flex-wrap gap-2">
                {((clinic.facilities && clinic.facilities.length > 0) ? clinic.facilities : step2.facilities || []).map((f) => (
                  <span key={f} className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs">{f}</span>
                ))}
                {!(clinic.facilities?.length || step2.facilities?.length) && <span className="text-sm text-gray-400 italic">None</span>}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Languages Spoken</p>
              <div className="flex flex-wrap gap-2">
                {((clinic.languagesSpoken && clinic.languagesSpoken.length > 0) ? clinic.languagesSpoken : step2.languages || []).map((l) => (
                  <span key={l} className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs">{l}</span>
                ))}
                {!(clinic.languagesSpoken?.length || step2.languages?.length) && <span className="text-sm text-gray-400 italic">None</span>}
              </div>
            </div>
          </div>
        </Section>
        */}

        {/* ── Section 6: Documents & Compliance ── */}
        {/* TEMPORARILY HIDDEN
        <Section title="Documents & Compliance" icon="📋">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 mb-4">
            <Field label="Clinic Registration Number" value={getValue(clinic.clinicRegistrationNumber, step1.clinicRegistrationNumber) || getValue(null, step3.clinicRegistrationNumber)} />
            <Field label="GST Number" value={getValue(clinic.gstNumber, step3.gstNumber)} />
            <Field label="Established Year" value={step1.establishedYear} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <DocLink label="Clinic Registration Certificate" url={clinic.licenseDocumentUrl || clinic.clinicLicenseDocument || step3.clinicRegistrationCertificate || step3.clinicLicense} />
            <DocLink label="Medical Establishment License" url={clinic.medicalEstablishmentCertificateUrl || step3.medicalEstablishmentLicense || step3.medicalCertificate} />
            <DocLink label="Owner ID Proof" url={step3.ownerIdProof || step3.ownerIdProofUrl} />
            <DocLink label="GST Certificate (Optional)" url={clinic.gstCertificateUrl || step3.gstCertificate} />
          </div>

          {additionalDocs.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Additional Documents</p>
              <div className="flex flex-wrap gap-2">
                {additionalDocs.map((url, i) => (
                  <a key={i} href={getFileUrl(url)} target="_blank" rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-gray-50 text-gray-700 text-xs font-medium hover:bg-gray-100 border border-gray-200">
                    📎 Document {i + 1}
                  </a>
                ))}
              </div>
            </div>
          )}
        </Section>
        */}

        {/* ── Verification Log ── */}
        {clinic.verificationLogs?.length > 0 && (
          <Section title="Verification History" icon="📜">
            <div className="space-y-2">
              {clinic.verificationLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{log.oldStatus}</span>
                      <span className="text-gray-400">→</span>
                      <StatusBadge status={log.newStatus} />
                    </div>
                    {log.remark && <p className="text-xs text-gray-500 mt-1">{log.remark}</p>}
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── Admin Status Notes ── */}
        {(clinic.rejectionReason || clinic.changesRequestedReason || clinic.suspendedReason || clinic.adminNotes) && (
          <Section title="Admin Notes" icon="📝">
            {clinic.rejectionReason && <Field label="Rejection Reason" value={clinic.rejectionReason} />}
            {clinic.changesRequestedReason && <Field label="Changes Requested" value={clinic.changesRequestedReason} />}
            {clinic.suspendedReason && <Field label="Suspension Reason" value={clinic.suspendedReason} />}
            {clinic.adminNotes && <Field label="Admin Notes" value={clinic.adminNotes} />}
          </Section>
        )}

        {/* ── Action Buttons ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mt-6">
          <h2 className="text-base font-bold text-gray-900 mb-1">Admin Actions</h2>
          <p className="text-xs text-gray-400 mb-5">Changes take effect immediately and notify the clinic owner by email.</p>
          <div className="flex flex-wrap gap-3">
            {canApprove && (
              <button
                onClick={() => openModal('approve')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 active:scale-95 transition-all shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Approve Clinic
              </button>
            )}
            {canReject && (
              <button
                onClick={() => openModal('reject')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 active:scale-95 transition-all shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Reject Clinic
              </button>
            )}
            {canRequestChanges && (
              <button
                onClick={() => openModal('request-changes')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 active:scale-95 transition-all shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Request Changes
              </button>
            )}
            {canSuspend && (
              <button
                onClick={() => openModal('suspend')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-700 text-white text-sm font-semibold hover:bg-gray-800 active:scale-95 transition-all shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                Suspend Clinic
              </button>
            )}
            {clinic.approvalStatus === 'VERIFIED' && !canSuspend && (
              <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-50 text-green-700 text-sm font-semibold border border-green-200">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Clinic is Approved
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          ACTION MODALS — each has its own focused design
      ═══════════════════════════════════════════════════════════ */}

      {/* ── Approve Modal ── */}
      {modal.type === 'approve' && (
        <ActionModal onClose={closeModal}>
          {/* Icon header */}
          <div className="flex flex-col items-center text-center px-2 pt-2 pb-1">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Approve Clinic?</h2>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
              <span className="font-semibold text-gray-700">{clinic.name}</span> will become active and visible to patients.
              The clinic owner will be notified by email.
            </p>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={closeModal}
              disabled={actionLoading}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAction}
              disabled={actionLoading}
              className="flex-1 rounded-xl bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {actionLoading
                ? <span className="flex items-center justify-center gap-2"><Spinner />Approving…</span>
                : 'Approve'}
            </button>
          </div>
        </ActionModal>
      )}

      {/* ── Reject Modal ── */}
      {modal.type === 'reject' && (
        <ActionModal onClose={closeModal}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Reject Clinic</h2>
              <p className="text-xs text-gray-400">Clinic owner will be notified with your reason.</p>
            </div>
          </div>
          <ReasonField
            label="Rejection reason"
            placeholder="e.g. Documents are incomplete. Please upload a valid clinic license and medical establishment certificate."
            value={modal.reason}
            onChange={(v) => setModal((p) => ({ ...p, reason: v, reasonTouched: true }))}
            error={showReasonError ? 'Rejection reason is required.' : ''}
          />
          <div className="flex gap-3 mt-5">
            <button
              onClick={closeModal}
              disabled={actionLoading}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAction}
              disabled={actionLoading}
              className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {actionLoading
                ? <span className="flex items-center justify-center gap-2"><Spinner />Rejecting…</span>
                : 'Reject Clinic'}
            </button>
          </div>
        </ActionModal>
      )}

      {/* ── Request Changes Modal ── */}
      {modal.type === 'request-changes' && (
        <ActionModal onClose={closeModal}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Request Changes</h2>
              <p className="text-xs text-gray-400">Describe exactly what the clinic owner should update.</p>
            </div>
          </div>
          <ReasonField
            label="What should the clinic owner update?"
            placeholder="e.g. Please upload clearer photos of the clinic license. The GST number format appears incorrect."
            value={modal.reason}
            onChange={(v) => setModal((p) => ({ ...p, reason: v, reasonTouched: true }))}
            error={showReasonError ? 'Please describe the required changes.' : ''}
          />
          <div className="flex gap-3 mt-5">
            <button
              onClick={closeModal}
              disabled={actionLoading}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAction}
              disabled={actionLoading}
              className="flex-1 rounded-xl bg-orange-500 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              {actionLoading
                ? <span className="flex items-center justify-center gap-2"><Spinner />Sending…</span>
                : 'Send Request'}
            </button>
          </div>
        </ActionModal>
      )}

      {/* ── Suspend Modal ── */}
      {modal.type === 'suspend' && (
        <ActionModal onClose={closeModal}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Suspend Clinic</h2>
              <p className="text-xs text-gray-400">Bookings and patient access will be disabled immediately.</p>
            </div>
          </div>
          {/* Warning banner */}
          <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 text-sm text-amber-800">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <span>All appointments will be halted. The clinic owner will be notified and must contact support to resume.</span>
          </div>
          <ReasonField
            label="Suspension reason"
            placeholder="e.g. Clinic found operating without a valid license. Suspended pending document verification."
            value={modal.reason}
            onChange={(v) => setModal((p) => ({ ...p, reason: v, reasonTouched: true }))}
            error={showReasonError ? 'Suspension reason is required.' : ''}
          />
          <div className="flex gap-3 mt-5">
            <button
              onClick={closeModal}
              disabled={actionLoading}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAction}
              disabled={actionLoading}
              className="flex-1 rounded-xl bg-gray-800 py-2.5 text-sm font-semibold text-white hover:bg-gray-900 disabled:opacity-50 transition-colors"
            >
              {actionLoading
                ? <span className="flex items-center justify-center gap-2"><Spinner />Suspending…</span>
                : 'Suspend Clinic'}
            </button>
          </div>
        </ActionModal>
      )}
    </DashboardLayout>
  );
};

export default ClinicVerificationDetail;
