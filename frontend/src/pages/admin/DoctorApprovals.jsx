import { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import {
  getPendingDoctorApprovals,
  decideDoctorApproval,
} from '../../api/admin.api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import toast from 'react-hot-toast';
import { FileText, X } from 'lucide-react';

const ACTION_CONFIG = {
  VERIFIED: {
    title: 'Approve doctor application',
    confirmLabel: 'Approve',
    accent: 'bg-green-600 hover:bg-green-700',
    helper: 'Approving this doctor will make them visible to patients and allow them to accept appointments.',
  },
  REJECTED: {
    title: 'Reject doctor application',
    confirmLabel: 'Reject',
    accent: 'bg-red-600 hover:bg-red-700',
    helper: 'Add a clear reason so the doctor knows what needs to be corrected or verified.',
  },
  SUSPENDED: {
    title: 'Suspend doctor application',
    confirmLabel: 'Suspend',
    accent: 'bg-gray-800 hover:bg-gray-900',
    helper: 'Use suspension for cases that should be blocked pending further investigation.',
  },
};

const DoctorApprovals = () => {
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [filterStatus, setFilterStatus] = useState('PENDING'); // NEW: Add filter
  const [decisionState, setDecisionState] = useState({
    open: false,
    entity: null,
    status: 'VERIFIED',
    reason: '',
  });

  const loadDoctors = async () => {
    setIsLoading(true);
    try {
      const res = await getPendingDoctorApprovals();
      console.log('Pending Doctors Response:', res.data); // DEBUG LOG
      setDoctors(res.data.data?.doctors || []);
    } catch (err) {
      console.error('Load Doctors Error:', err); // DEBUG LOG
      toast.error('Failed to load pending doctors');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  const openDecisionModal = (entity, status) => {
    setDecisionState({
      open: true,
      entity,
      status,
      reason: '',
    });
  };

  const closeDecisionModal = () => {
    setDecisionState({
      open: false,
      entity: null,
      status: 'VERIFIED',
      reason: '',
    });
  };

  const handleDecision = async () => {
    const { entity, status, reason } = decisionState;
    if (!entity) return;
    if (status !== 'VERIFIED' && !reason.trim()) {
      toast.error('Reason is required for rejection or suspension');
      return;
    }

    setActionLoading(entity.id);
    try {
      await decideDoctorApproval(entity.id, { status, reason: reason.trim() || undefined });
      toast.success(`Doctor marked as ${status.toLowerCase()}`);
      closeDecisionModal();
      loadDoctors();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not provided';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Doctor Approvals</h1>
            <p className="mt-1 text-text-muted">
              Review and verify doctor applications before they can accept appointments
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:w-auto">
            <SummaryCard
              label="Pending Approvals"
              value={doctors.length}
              tone="bg-yellow-50 text-yellow-700"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : doctors.length === 0 ? (
          <EmptyState
            icon="🩺"
            title="No pending doctors"
            description="There are no doctor applications waiting for review right now."
          />
        ) : (
          <div className="space-y-4">
            {doctors.map((doctor) => {
              const profile = doctor.doctorProfile || {};
              const invitation = doctor.invitation || {};

              return (
                <div key={doctor.id} className="card">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3 flex-1">
                      {/* Header with Profile Photo */}
                      <div className="flex items-start gap-4">
                        {/* Profile Photo */}
                        {profile.profilePhotoUrl ? (
                          <img 
                            src={profile.profilePhotoUrl} 
                            alt={profile.fullLegalName || doctor.name}
                            className="w-20 h-20 rounded-full object-cover border-2 border-blue-500"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-semibold text-xl">
                            {(profile.fullLegalName || doctor.name)?.charAt(0)?.toUpperCase() || 'D'}
                          </div>
                        )}
                        
                        {/* Name and Badges */}
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold text-text-primary">
                              {profile.fullLegalName || doctor.name}
                            </h3>
                            <StatusBadge status={profile.verificationStatus || 'PENDING'} />
                            {profile.medicalSystem && (
                              <span className="badge badge-success text-xs">
                                {profile.medicalSystem}
                              </span>
                            )}
                            {profile.specialization && (
                              <span className="badge badge-info text-xs">
                                {profile.specialization}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Basic Info Grid */}
                      <div className="grid gap-2 text-sm text-text-muted sm:grid-cols-2">
                        <p>
                          <span className="font-semibold">Mobile:</span> {doctor.mobile}
                        </p>
                        <p>
                          <span className="font-semibold">Email:</span>{' '}
                          {doctor.email || 'Not provided'}
                        </p>
                        <p>
                          <span className="font-semibold">Gender:</span>{' '}
                          {profile.gender || 'Not provided'}
                        </p>
                        <p>
                          <span className="font-semibold">DOB:</span>{' '}
                          {formatDate(profile.dateOfBirth)}
                        </p>
                        {invitation.clinic && (
                          <p>
                            <span className="font-semibold">Invited by:</span>{' '}
                            {invitation.clinic.name}
                          </p>
                        )}
                        {profile.profileSubmittedAt && (
                          <p>
                            <span className="font-semibold">Submitted:</span>{' '}
                            {formatDate(profile.profileSubmittedAt)}
                          </p>
                        )}
                      </div>

                      {/* Professional Information Panel */}
                      <div className="rounded-2xl bg-blue-50 p-4 text-sm text-blue-900">
                        <p className="font-semibold mb-2">Professional Information</p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <p>
                            <span className="font-semibold">Qualification:</span>{' '}
                            {profile.qualification || 'Not provided'}
                          </p>
                          <p>
                            <span className="font-semibold">Experience:</span>{' '}
                            {profile.experienceYears ?? 0} years
                          </p>
                          <p>
                            <span className="font-semibold">Registration No:</span>{' '}
                            {profile.medicalRegistrationNumber || 'Not provided'}
                          </p>
                          <p>
                            <span className="font-semibold">Registration Authority:</span>{' '}
                            {profile.registrationAuthority || 'Not provided'}
                          </p>
                          <p>
                            <span className="font-semibold">Registration Year:</span>{' '}
                            {profile.registrationYear || 'Not provided'}
                          </p>
                          <p>
                            <span className="font-semibold">Consultation Fee:</span>{' '}
                            {profile.consultationFee ? `₹${profile.consultationFee}` : 'Not set'}
                          </p>
                        </div>
                      </div>

                      {/* Bio & Languages Panel */}
                      <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-700">
                        {profile.bio && (
                          <>
                            <p className="font-semibold">About:</p>
                            <p className="mt-1">{profile.bio}</p>
                          </>
                        )}
                        {profile.languagesKnown?.length > 0 && (
                          <p className="mt-2">
                            <span className="font-semibold">Languages:</span>{' '}
                            {profile.languagesKnown.join(', ')}
                          </p>
                        )}
                        {profile.areasOfExpertise?.length > 0 && (
                          <p className="mt-2">
                            <span className="font-semibold">Expertise:</span>{' '}
                            {profile.areasOfExpertise.join(', ')}
                          </p>
                        )}
                      </div>

                      {/* Documents Panel */}
                      {profile.certificates &&
                        Array.isArray(profile.certificates) &&
                        profile.certificates.length > 0 && (
                          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                            <p className="font-semibold text-slate-900 mb-2">
                              Uploaded Documents
                            </p>
                            <div className="space-y-2">
                              {profile.certificates.map((doc, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                                >
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-blue-600" />
                                    <div>
                                      <p className="font-medium text-xs">
                                        {doc.type?.replace(/_/g, ' ').toUpperCase()}
                                      </p>
                                      <p className="text-gray-400 text-xs">{doc.fileName}</p>
                                    </div>
                                  </div>
                                  {doc.url && (
                                    <a
                                      href={doc.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-blue-600 text-xs underline hover:text-blue-700"
                                    >
                                      View
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>

                    {/* Action Panel */}
                    <ActionPanel
                      busy={actionLoading === doctor.id}
                      onApprove={() => openDecisionModal(doctor, 'VERIFIED')}
                      onReject={() => openDecisionModal(doctor, 'REJECTED')}
                      onSuspend={() => openDecisionModal(doctor, 'SUSPENDED')}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Decision Modal */}
        <Modal
          isOpen={decisionState.open}
          onClose={closeDecisionModal}
          title={ACTION_CONFIG[decisionState.status].title}
          size="md"
        >
          <div className="space-y-4">
            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-sm font-medium text-gray-900">
                {decisionState.entity?.doctorProfile?.fullLegalName ||
                  decisionState.entity?.name ||
                  'Doctor'}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                {ACTION_CONFIG[decisionState.status].helper}
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Reason{' '}
                {decisionState.status === 'VERIFIED' ? '(optional)' : '(required)'}
              </label>
              <textarea
                rows={4}
                value={decisionState.reason}
                onChange={(e) =>
                  setDecisionState((prev) => ({ ...prev, reason: e.target.value }))
                }
                placeholder={
                  decisionState.status === 'VERIFIED'
                    ? 'Add an internal note if needed.'
                    : 'Explain why this application is being rejected or suspended.'
                }
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeDecisionModal}
                className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDecision}
                disabled={actionLoading === decisionState.entity?.id}
                className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white ${ACTION_CONFIG[decisionState.status].accent} disabled:opacity-50`}
              >
                {actionLoading === decisionState.entity?.id
                  ? 'Saving...'
                  : ACTION_CONFIG[decisionState.status].confirmLabel}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

const SummaryCard = ({ label, value, tone }) => (
  <div className={`rounded-2xl px-4 py-3 text-center ${tone}`}>
    <p className="text-2xl font-bold">{value}</p>
    <p className="text-xs font-medium">{label}</p>
  </div>
);

const ActionPanel = ({ busy, onApprove, onReject, onSuspend }) => (
  <div className="flex min-w-[190px] flex-col gap-2">
    <button
      type="button"
      onClick={onApprove}
      disabled={busy}
      className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
    >
      {busy ? 'Working...' : 'Approve'}
    </button>
    <button
      type="button"
      onClick={onReject}
      disabled={busy}
      className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
    >
      {busy ? 'Working...' : 'Reject'}
    </button>
    <button
      type="button"
      onClick={onSuspend}
      disabled={busy}
      className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
    >
      Suspend
    </button>
  </div>
);

export default DoctorApprovals;
