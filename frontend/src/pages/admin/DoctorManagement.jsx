import { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getAllDoctors, decideDoctorApproval, disableDoctor, enableDoctor, deleteDoctorPermanently } from '../../api/admin.api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import toast from 'react-hot-toast';
import { 
  FileText, 
  Search, 
  Filter, 
  RefreshCw,
  User,
  Phone,
  Mail,
  Calendar,
  Award,
  Stethoscope,
  MapPin,
  DollarSign,
  Languages,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Ban,
  Trash2,
  Play
} from 'lucide-react';

const VERIFICATION_STATUS = {
  ALL: { label: 'All', color: 'gray', icon: User },
  PENDING: { label: 'Pending Approval', color: 'yellow', icon: Clock },
  VERIFIED: { label: 'Approved', color: 'green', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: 'red', icon: XCircle },
  SUSPENDED: { label: 'Suspended', color: 'gray', icon: AlertCircle },
};

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

const DoctorManagement = () => {
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [specializationFilter, setSpecializationFilter] = useState('ALL');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [decisionState, setDecisionState] = useState({
    open: false,
    entity: null,
    status: 'VERIFIED',
    reason: '',
  });
  const [disableState, setDisableState] = useState({
    open: false,
    doctor: null,
    reason: '',
  });
  const [deleteState, setDeleteState] = useState({
    open: false,
    doctor: null,
    confirmText: '',
  });

  // Calculate statistics
  const stats = {
    total: doctors.length,
    pending: doctors.filter(d => d.doctorProfile?.verificationStatus === 'PENDING').length,
    verified: doctors.filter(d => d.doctorProfile?.verificationStatus === 'VERIFIED').length,
    rejected: doctors.filter(d => d.doctorProfile?.verificationStatus === 'REJECTED').length,
    suspended: doctors.filter(d => d.approvalStatus === 'SUSPENDED').length,
  };

  // Get unique specializations
  const specializations = ['ALL', ...new Set(
    doctors
      .map(d => d.doctorProfile?.specialization)
      .filter(Boolean)
  )];

  const loadDoctors = async () => {
    setIsLoading(true);
    try {
      const res = await getAllDoctors();
      const allDoctors = res.data.data?.doctors || res.data.data || [];
      console.log('All Doctors Response:', allDoctors);
      setDoctors(allDoctors);
      setFilteredDoctors(allDoctors);
    } catch (err) {
      console.error('Load Doctors Error:', err);
      toast.error('Failed to load doctors');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = doctors;

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(d => 
        d.doctorProfile?.verificationStatus === statusFilter ||
        (statusFilter === 'SUSPENDED' && d.approvalStatus === 'SUSPENDED')
      );
    }

    // Specialization filter
    if (specializationFilter !== 'ALL') {
      filtered = filtered.filter(d => 
        d.doctorProfile?.specialization === specializationFilter
      );
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(d => 
        d.name?.toLowerCase().includes(query) ||
        d.email?.toLowerCase().includes(query) ||
        d.mobile?.includes(query) ||
        d.doctorProfile?.fullLegalName?.toLowerCase().includes(query) ||
        d.doctorProfile?.medicalRegistrationNumber?.toLowerCase().includes(query) ||
        d.doctorProfile?.specialization?.toLowerCase().includes(query)
      );
    }

    setFilteredDoctors(filtered);
  }, [doctors, statusFilter, specializationFilter, searchQuery]);

  const handleRefresh = () => {
    loadDoctors();
    toast.success('Refreshed');
  };

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
      setSelectedDoctor(null);
      loadDoctors();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDisable = async () => {
    const { doctor, reason } = disableState;
    if (!doctor) return;
    if (!reason.trim()) {
      toast.error('Reason is required for disabling a doctor');
      return;
    }

    setActionLoading(doctor.id);
    try {
      await disableDoctor(doctor.id, reason.trim());
      toast.success('Doctor disabled successfully');
      setDisableState({ open: false, doctor: null, reason: '' });
      setSelectedDoctor(null);
      loadDoctors();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to disable doctor');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEnable = async (doctor) => {
    setActionLoading(doctor.id);
    try {
      await enableDoctor(doctor.id);
      toast.success('Doctor re-enabled successfully');
      setSelectedDoctor(null);
      loadDoctors();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to enable doctor');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    const { doctor, confirmText } = deleteState;
    if (!doctor) return;
    if (confirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    setActionLoading(doctor.id);
    try {
      await deleteDoctorPermanently(doctor.id, confirmText);
      toast.success('Doctor permanently deleted');
      setDeleteState({ open: false, doctor: null, confirmText: '' });
      setSelectedDoctor(null);
      loadDoctors();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete doctor');
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

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setSpecializationFilter('ALL');
  };

  return (
    <DashboardLayout>
      <div className="page-container">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Doctor Management</h1>
            <p className="mt-1 text-text-muted">
              Review clinic applications, verify documents, and manage approval status
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard
            icon={<User className="h-5 w-5" />}
            label="Total Doctors"
            value={stats.total}
            color="bg-blue-50 text-blue-700 border-blue-200"
            isActive={statusFilter === 'ALL'}
            onClick={() => setStatusFilter('ALL')}
          />
          <StatCard
            icon={<Clock className="h-5 w-5" />}
            label="Pending Approval"
            value={stats.pending}
            color="bg-yellow-50 text-yellow-700 border-yellow-200"
            isActive={statusFilter === 'PENDING'}
            onClick={() => setStatusFilter('PENDING')}
          />
          <StatCard
            icon={<CheckCircle className="h-5 w-5" />}
            label="Approved"
            value={stats.verified}
            color="bg-green-50 text-green-700 border-green-200"
            isActive={statusFilter === 'VERIFIED'}
            onClick={() => setStatusFilter('VERIFIED')}
          />
          <StatCard
            icon={<XCircle className="h-5 w-5" />}
            label="Rejected"
            value={stats.rejected}
            color="bg-red-50 text-red-700 border-red-200"
            isActive={statusFilter === 'REJECTED'}
            onClick={() => setStatusFilter('REJECTED')}
          />
          <StatCard
            icon={<AlertCircle className="h-5 w-5" />}
            label="Suspended"
            value={stats.suspended}
            color="bg-gray-50 text-gray-700 border-gray-200"
            isActive={statusFilter === 'SUSPENDED'}
            onClick={() => setStatusFilter('SUSPENDED')}
          />
        </div>

        {/* Filters & Search */}
        <div className="mb-6 card">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, mobile, reg. number..."
                className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Specialization Filter */}
            <select
              value={specializationFilter}
              onChange={(e) => setSpecializationFilter(e.target.value)}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {specializations.map(spec => (
                <option key={spec} value={spec}>
                  {spec === 'ALL' ? 'All Specializations' : spec}
                </option>
              ))}
            </select>

            {/* Clear Filters */}
            {(searchQuery || statusFilter !== 'ALL' || specializationFilter !== 'ALL') && (
              <button
                onClick={clearFilters}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium whitespace-nowrap"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>

        {/* Doctor List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredDoctors.length === 0 ? (
          <EmptyState
            icon="🩺"
            title="No doctors found"
            description={searchQuery || statusFilter !== 'ALL' || specializationFilter !== 'ALL' 
              ? "Try changing the search or filter options."
              : "There are no doctor applications in the system yet."}
          />
        ) : (
          <div className="space-y-4">
            {filteredDoctors.map((doctor) => {
              const profile = doctor.doctorProfile || {};
              const invitation = doctor.invitation || {};

              return (
                <div 
                  key={doctor.id} 
                  className="card hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedDoctor(doctor)}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    {/* Main Content */}
                    <div className="space-y-3 flex-1">
                      {/* Header */}
                      <div className="flex items-start gap-4">
                        {/* Profile Photo */}
                        {profile.profilePhotoUrl ? (
                          <img 
                            src={profile.profilePhotoUrl} 
                            alt={profile.fullLegalName || doctor.name}
                            className="w-16 h-16 rounded-full object-cover border-2 border-primary-500"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold text-xl shadow-md">
                            {(profile.fullLegalName || doctor.name)?.charAt(0)?.toUpperCase() || 'D'}
                          </div>
                        )}
                        
                        {/* Name and Badges */}
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-text-primary">
                              {profile.fullLegalName || doctor.name}
                            </h3>
                            <StatusBadge status={profile.verificationStatus || 'PENDING'} />
                            {doctor.approvalStatus === 'SUSPENDED' && (
                              <span className="badge badge-error text-xs">SUSPENDED</span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
                            {profile.medicalSystem && (
                              <span className="flex items-center gap-1">
                                <Stethoscope className="h-3 w-3" />
                                {profile.medicalSystem}
                              </span>
                            )}
                            {profile.specialization && (
                              <span className="flex items-center gap-1">
                                <Award className="h-3 w-3" />
                                {profile.specialization}
                              </span>
                            )}
                            {profile.experienceYears && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {profile.experienceYears} years exp.
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quick Info Grid */}
                      <div className="grid gap-2 text-sm sm:grid-cols-2">
                        <div className="flex items-center gap-2 text-text-muted">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{doctor.mobile}</span>
                        </div>
                        <div className="flex items-center gap-2 text-text-muted">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span>{doctor.email || 'Not provided'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-text-muted">
                          <Award className="h-4 w-4 text-gray-400" />
                          <span>{profile.medicalRegistrationNumber || 'No reg. number'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-text-muted">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          <span>{profile.consultationFee ? `₹${profile.consultationFee}` : 'Not set'}</span>
                        </div>
                      </div>

                      {/* Invitation Info */}
                      {invitation.clinic && (
                        <div className="rounded-lg bg-blue-50 p-3 text-sm">
                          <span className="font-semibold text-blue-900">Invited by:</span>{' '}
                          <span className="text-blue-700">{invitation.clinic.name}</span>
                          {profile.profileSubmittedAt && (
                            <span className="text-blue-600"> • Submitted {formatDate(profile.profileSubmittedAt)}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons (Only for pending) */}
                    {profile.verificationStatus === 'PENDING' && (
                      <div className="flex flex-row lg:flex-col gap-2 lg:min-w-[160px]">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDecisionModal(doctor, 'VERIFIED');
                          }}
                          disabled={actionLoading === doctor.id}
                          className="flex-1 lg:flex-none rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDecisionModal(doctor, 'REJECTED');
                          }}
                          disabled={actionLoading === doctor.id}
                          className="flex-1 lg:flex-none rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Doctor Detail Modal */}
        <DoctorDetailModal
          doctor={selectedDoctor}
          isOpen={!!selectedDoctor}
          onClose={() => setSelectedDoctor(null)}
          onApprove={(doctor) => openDecisionModal(doctor, 'VERIFIED')}
          onReject={(doctor) => openDecisionModal(doctor, 'REJECTED')}
          onSuspend={(doctor) => openDecisionModal(doctor, 'SUSPENDED')}
          onDisable={(doctor) => setDisableState({ open: true, doctor, reason: '' })}
          onEnable={handleEnable}
          onDelete={(doctor) => setDeleteState({ open: true, doctor, confirmText: '' })}
          actionLoading={actionLoading}
          formatDate={formatDate}
        />

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

        {/* Disable Doctor Modal */}
        <Modal
          isOpen={disableState.open}
          onClose={() => setDisableState({ open: false, doctor: null, reason: '' })}
          title="Disable Doctor Account"
          size="md"
        >
          <div className="space-y-4">
            <div className="rounded-2xl bg-yellow-50 border border-yellow-200 p-4">
              <div className="flex items-start gap-3">
                <Ban className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-900">
                    {disableState.doctor?.doctorProfile?.fullLegalName || disableState.doctor?.name || 'Doctor'}
                  </p>
                  <p className="mt-1 text-sm text-yellow-700">
                    This will suspend the doctor account and hide them from the marketplace. The account can be re-enabled later.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Reason <span className="text-red-500">(required)</span>
              </label>
              <textarea
                rows={4}
                value={disableState.reason}
                onChange={(e) => setDisableState(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Explain why this doctor is being disabled..."
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDisableState({ open: false, doctor: null, reason: '' })}
                className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDisable}
                disabled={actionLoading === disableState.doctor?.id || !disableState.reason.trim()}
                className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50"
              >
                {actionLoading === disableState.doctor?.id ? 'Disabling...' : 'Disable Doctor'}
              </button>
            </div>
          </div>
        </Modal>

        {/* Delete Doctor Modal */}
        <Modal
          isOpen={deleteState.open}
          onClose={() => setDeleteState({ open: false, doctor: null, confirmText: '' })}
          title="⚠️ Permanently Delete Doctor"
          size="md"
        >
          <div className="space-y-4">
            <div className="rounded-2xl bg-red-50 border border-red-200 p-4">
              <div className="flex items-start gap-3">
                <Trash2 className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900">
                    {deleteState.doctor?.doctorProfile?.fullLegalName || deleteState.doctor?.name || 'Doctor'}
                  </p>
                  <p className="mt-1 text-sm text-red-700 font-semibold">
                    ⚠️ THIS ACTION CANNOT BE UNDONE
                  </p>
                  <p className="mt-2 text-sm text-red-600">
                    This will permanently delete all doctor data including profile, documents, and relationships. 
                    Use "Disable" instead if you want to temporarily suspend the account.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Type <span className="font-mono text-red-600">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={deleteState.confirmText}
                onChange={(e) => setDeleteState(prev => ({ ...prev, confirmText: e.target.value }))}
                placeholder="Type DELETE"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteState({ open: false, doctor: null, confirmText: '' })}
                className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={actionLoading === deleteState.doctor?.id || deleteState.confirmText !== 'DELETE'}
                className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading === deleteState.doctor?.id ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

// Stat Card Component
const StatCard = ({ icon, label, value, color, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`rounded-2xl border-2 px-4 py-3 text-center transition-all ${
      isActive ? `${color} shadow-md scale-105` : 'bg-white text-gray-600 border-gray-200 hover:shadow-md'
    }`}
  >
    <div className="flex items-center justify-center gap-2 mb-1">
      {icon}
      <p className="text-2xl font-bold">{value}</p>
    </div>
    <p className="text-xs font-medium">{label}</p>
  </button>
);

// Doctor Detail Modal Component
const DoctorDetailModal = ({ doctor, isOpen, onClose, onApprove, onReject, onSuspend, onDisable, onEnable, onDelete, actionLoading, formatDate }) => {
  if (!doctor) return null;

  const profile = doctor.doctorProfile || {};
  const invitation = doctor.invitation || {};

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Doctor Details" size="xl">
      <div className="space-y-6 max-h-[70vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start gap-4 pb-4 border-b">
          {profile.profilePhotoUrl ? (
            <img 
              src={profile.profilePhotoUrl} 
              alt={profile.fullLegalName || doctor.name}
              className="w-24 h-24 rounded-full object-cover border-2 border-primary-500"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold text-3xl shadow-md">
              {(profile.fullLegalName || doctor.name)?.charAt(0)?.toUpperCase() || 'D'}
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{profile.fullLegalName || doctor.name}</h2>
            <div className="flex flex-wrap gap-2 mt-2">
              <StatusBadge status={profile.verificationStatus || 'PENDING'} />
              {profile.medicalSystem && (
                <span className="badge badge-success">{profile.medicalSystem}</span>
              )}
              {profile.specialization && (
                <span className="badge badge-info">{profile.specialization}</span>
              )}
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="rounded-xl bg-blue-50 p-4">
          <h3 className="font-semibold text-blue-900 mb-3">Contact Information</h3>
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            <div className="flex items-center gap-2 text-blue-800">
              <Phone className="h-4 w-4" />
              <span>{doctor.mobile}</span>
            </div>
            <div className="flex items-center gap-2 text-blue-800">
              <Mail className="h-4 w-4" />
              <span>{doctor.email || 'Not provided'}</span>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="rounded-xl bg-gray-50 p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Personal Information</h3>
          <div className="grid gap-3 sm:grid-cols-2 text-sm text-gray-700">
            <div>
              <span className="font-semibold">Gender:</span> {profile.gender || 'Not provided'}
            </div>
            <div>
              <span className="font-semibold">Date of Birth:</span> {formatDate(profile.dateOfBirth)}
            </div>
          </div>
        </div>

        {/* Professional Information */}
        <div className="rounded-xl bg-green-50 p-4">
          <h3 className="font-semibold text-green-900 mb-3">Professional Information</h3>
          <div className="grid gap-3 sm:grid-cols-2 text-sm text-green-800">
            <div>
              <span className="font-semibold">Qualification:</span> {profile.qualification || 'Not provided'}
            </div>
            <div>
              <span className="font-semibold">Experience:</span> {profile.experienceYears ?? 0} years
            </div>
            <div>
              <span className="font-semibold">Registration No:</span> {profile.medicalRegistrationNumber || 'Not provided'}
            </div>
            <div>
              <span className="font-semibold">Registration Authority:</span> {profile.registrationAuthority || 'Not provided'}
            </div>
            <div>
              <span className="font-semibold">Registration Year:</span> {profile.registrationYear || 'Not provided'}
            </div>
            <div>
              <span className="font-semibold">Consultation Fee:</span> {profile.consultationFee ? `₹${profile.consultationFee}` : 'Not set'}
            </div>
          </div>
        </div>

        {/* Bio & Languages */}
        {(profile.bio || profile.languagesKnown?.length > 0 || profile.areasOfExpertise?.length > 0) && (
          <div className="rounded-xl bg-purple-50 p-4">
            <h3 className="font-semibold text-purple-900 mb-3">Additional Information</h3>
            <div className="space-y-2 text-sm text-purple-800">
              {profile.bio && (
                <div>
                  <span className="font-semibold">About:</span>
                  <p className="mt-1">{profile.bio}</p>
                </div>
              )}
              {profile.languagesKnown?.length > 0 && (
                <div>
                  <span className="font-semibold">Languages:</span> {profile.languagesKnown.join(', ')}
                </div>
              )}
              {profile.areasOfExpertise?.length > 0 && (
                <div>
                  <span className="font-semibold">Expertise:</span> {profile.areasOfExpertise.join(', ')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Documents */}
        {profile.certificates && Array.isArray(profile.certificates) && profile.certificates.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Uploaded Documents</h3>
            <div className="space-y-2">
              {profile.certificates.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary-600" />
                    <div>
                      <p className="font-medium text-sm text-gray-900">
                        {doc.type?.replace(/_/g, ' ').toUpperCase()}
                      </p>
                      <p className="text-gray-500 text-xs">{doc.fileName}</p>
                    </div>
                  </div>
                  {doc.url && (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary-600 text-sm font-medium hover:text-primary-700 underline"
                    >
                      View Document
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Invitation Info */}
        {invitation.clinic && (
          <div className="rounded-xl bg-orange-50 p-4">
            <h3 className="font-semibold text-orange-900 mb-3">Invitation Details</h3>
            <div className="text-sm text-orange-800 space-y-1">
              <p><span className="font-semibold">Invited by Clinic:</span> {invitation.clinic.name}</p>
              {invitation.invitedBy && (
                <p><span className="font-semibold">Invited by:</span> {invitation.invitedBy.name}</p>
              )}
              <p><span className="font-semibold">Invitation Date:</span> {formatDate(invitation.createdAt)}</p>
              {profile.profileSubmittedAt && (
                <p><span className="font-semibold">Profile Submitted:</span> {formatDate(profile.profileSubmittedAt)}</p>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {profile.verificationStatus === 'PENDING' && (
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={() => {
                onApprove(doctor);
                onClose();
              }}
              className="flex-1 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700"
            >
              Approve Doctor
            </button>
            <button
              onClick={() => {
                onReject(doctor);
                onClose();
              }}
              className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700"
            >
              Reject Doctor
            </button>
            <button
              onClick={() => {
                onSuspend(doctor);
                onClose();
              }}
              className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Suspend
            </button>
          </div>
        )}

        {/* Management Buttons - Always visible for verified/rejected/suspended doctors */}
        {profile.verificationStatus !== 'PENDING' && (
          <div className="flex flex-wrap gap-3 pt-4 border-t">
            {doctor.approvalStatus === 'SUSPENDED' ? (
              <button
                onClick={() => {
                  onEnable(doctor);
                  onClose();
                }}
                disabled={actionLoading === doctor.id}
                className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                <Play className="h-4 w-4" />
                {actionLoading === doctor.id ? 'Enabling...' : 'Re-enable Doctor'}
              </button>
            ) : (
              <button
                onClick={() => {
                  onDisable(doctor);
                  onClose();
                }}
                disabled={actionLoading === doctor.id}
                className="flex items-center gap-2 rounded-xl bg-yellow-600 px-4 py-3 text-sm font-semibold text-white hover:bg-yellow-700 disabled:opacity-50"
              >
                <Ban className="h-4 w-4" />
                {actionLoading === doctor.id ? 'Disabling...' : 'Disable Doctor'}
              </button>
            )}
            <button
              onClick={() => {
                onDelete(doctor);
                onClose();
              }}
              disabled={actionLoading === doctor.id}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              {actionLoading === doctor.id ? 'Deleting...' : 'Delete Permanently'}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default DoctorManagement;
