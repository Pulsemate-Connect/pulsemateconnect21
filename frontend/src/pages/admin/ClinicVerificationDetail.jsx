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

  const owner = clinic.owner || {};
  const schedule = Array.isArray(clinic.weeklySchedule) ? clinic.weeklySchedule : [];
  const additionalDocs = Array.isArray(clinic.additionalDocuments)
    ? clinic.additionalDocuments
    : clinic.additionalDocuments?.docs || [];

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

        {/* ── Section 1: Owner Info ── */}
        <Section title="Owner Information" icon="👤">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6">
            <Field label="Full Name" value={owner.name} />
            <Field label="Mobile" value={owner.mobile} />
            <Field label="Mobile Verified" value={clinic.ownerMobileVerified ? '✅ Yes' : '❌ No'} />
            <Field label="Email" value={owner.email} />
            <Field label="Email Verified" value={clinic.ownerEmailVerified ? '✅ Yes' : '❌ No'} />
            <Field label="Account Status" value={owner.approvalStatus} />
          </div>
        </Section>

        {/* ── Section 2: Clinic Details ── */}
        <Section title="Clinic Details" icon="🏥">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6">
            <Field label="Clinic Name" value={clinic.name} />
            <Field label="Clinic Type" value={clinic.clinicType} />
            {clinic.clinicTypeOther && <Field label="Custom Type" value={clinic.clinicTypeOther} />}
            <Field label="Description" value={clinic.description} />
            <div className="col-span-2 mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Specialties</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {(clinic.specialties || []).map((s) => (
                  <span key={s} className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">{s}</span>
                ))}
                {clinic.specialtyOther && <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs">{clinic.specialtyOther}</span>}
              </div>
            </div>
          </div>

          {/* Logo and Cover Image preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* Logo */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Clinic Logo</p>
              <SafeImage
                src={clinic.clinicLogoUrl}
                alt="Clinic Logo"
                className="rounded-2xl w-24 h-24 object-contain border border-gray-200 bg-white shadow-sm"
                fallbackClassName="w-24 h-24"
                fallbackIcon="🏥"
                fallbackText="No Logo"
              />
            </div>

            {/* Cover Image */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Cover Image</p>
              <SafeImage
                src={clinic.clinicCoverImageUrl}
                alt="Clinic Cover"
                className="rounded-2xl w-full h-40 object-cover border border-gray-200 shadow-sm"
                fallbackClassName="w-full h-40"
                fallbackIcon="🖼️"
                fallbackText="No Cover Image"
              />
            </div>
          </div>
        </Section>

        {/* ── Section 3: Location ── */}
        <Section title="Location & Operations" icon="📍">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6">
            <Field label="Address" value={clinic.address} />
            <Field label="Landmark" value={clinic.landmark} />
            <Field label="Clinic Phone" value={clinic.phone} />
            <Field label="Pincode" value={clinic.pincode} />
            <Field label="State" value={clinic.state} />
            <Field label="District" value={clinic.district} />
            <Field label="City" value={clinic.city} />
            <Field label="Alternate Email" value={clinic.alternateEmail} />
            <Field label="Emergency Contact" value={clinic.emergencyContactNumber} />
            <Field label="Google Maps" value={clinic.googleMapsLocation} />
            <Field label="Latitude" value={clinic.latitude} />
            <Field label="Longitude" value={clinic.longitude} />
          </div>
          {clinic.latitude && clinic.longitude && (
            <a
              href={`https://www.google.com/maps?q=${clinic.latitude},${clinic.longitude}`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline mt-1"
            >
              🗺️ View on Google Maps
            </a>
          )}
        </Section>

        {/* ── Section 4: Consultation Modes ── */}
        <Section title="Consultation Modes" icon="💬">
          <div className="flex flex-wrap gap-2">
            {['OFFLINE', 'ONLINE', 'HOME_VISIT', 'VIDEO', 'CHAT'].map((mode) => (
              <span key={mode} className={`px-3 py-1 rounded-full text-xs font-semibold ${
                (clinic.consultationModes || []).includes(mode)
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-400 line-through'
              }`}>
                {mode.replace('_', ' ')}
              </span>
            ))}
          </div>
        </Section>

        {/* ── Section 5: Weekly Timings ── */}
        <Section title="Weekly Timings" icon="🕐">
          <div className="overflow-x-auto">
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
                  return (
                    <tr key={day}>
                      <td className="py-2 pr-4 font-medium">{day}</td>
                      <td className="py-2 pr-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          entry.enabled !== false && (entry.openingTime || entry.isOpen)
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {entry.enabled !== false && (entry.openingTime || entry.isOpen) ? 'Open' : 'Closed'}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-gray-500">{entry.openingTime || '—'}</td>
                      <td className="py-2 pr-4 text-gray-500">{entry.closingTime || '—'}</td>
                      <td className="py-2 pr-4 text-gray-500">{entry.breakStart || '—'}</td>
                      <td className="py-2 pr-4 text-gray-500">{entry.breakEnd || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Section>

        {/* ── Section 6: Scheduling ── */}
        <Section title="Scheduling Settings" icon="⚙️">
          <div className="grid grid-cols-3 gap-6">
            <Field label="Avg. Consultation Time" value={clinic.avgConsultationMinutes ? `${clinic.avgConsultationMinutes} min` : null} />
            <Field label="Appointment Slot Duration" value={clinic.appointmentSlotMinutes ? `${clinic.appointmentSlotMinutes} min` : null} />
            <Field label="Daily Patient Capacity" value={clinic.dailyPatientCapacity} />
          </div>
        </Section>

        {/* ── Section 7: Facilities & Services ── */}
        <Section title="Facilities & Patient Services" icon="🏗️">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Facilities</p>
              <div className="flex flex-wrap gap-2">
                {(clinic.facilities || []).map((f) => (
                  <span key={f} className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs">{f}</span>
                ))}
                {!clinic.facilities?.length && <span className="text-sm text-gray-400 italic">None</span>}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Languages Spoken</p>
              <div className="flex flex-wrap gap-2">
                {(clinic.languagesSpoken || []).map((l) => (
                  <span key={l} className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs">{l}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Payment Methods</p>
              <div className="flex flex-wrap gap-2">
                {(clinic.paymentMethods || []).map((p) => (
                  <span key={p} className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs">{p}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Insurance Providers</p>
              <div className="flex flex-wrap gap-2">
                {(clinic.insuranceSupported || []).map((i) => (
                  <span key={i} className="px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 text-xs">{i}</span>
                ))}
                {!clinic.insuranceSupported?.length && <span className="text-sm text-gray-400 italic">None</span>}
              </div>
            </div>
          </div>
        </Section>

        {/* ── Section 8: Verification & Compliance ── */}
        <Section title="Verification & Compliance" icon="📋">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6">
            <Field label="Registration Number" value={clinic.clinicRegistrationNumber} />
            {/* clinicLicenseDocument stores the file URL — show it only as a doc link, not raw text */}
            <Field label="GST Number" value={clinic.gstNumber} />
            <Field label="PAN Number" value={clinic.panNumber} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <DocLink label="Clinic License" url={clinic.licenseDocumentUrl || clinic.clinicLicenseDocument} />
            <DocLink label="Medical Establishment Certificate" url={clinic.medicalEstablishmentCertificateUrl} />
            <DocLink label="GST Certificate" url={clinic.gstCertificateUrl} />
            <DocLink label="PAN Card" url={clinic.panCardUrl} />
          </div>
          {additionalDocs.length > 0 && (
            <div className="mt-3">
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
