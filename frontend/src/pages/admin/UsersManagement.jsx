import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import {
  createAdminUser,
  deleteAdminUser,
  getAdminUsers,
  getAdminUserDetail,
  updateUserStatus,
  getDeletionRequests,
  cancelDeletionRequest,
} from '../../api/admin.api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import StatusBadge from '../../components/ui/StatusBadge';
import useAuthStore from '../../store/authStore';

const ROLES = ['All', 'PATIENT', 'DOCTOR', 'RECEPTIONIST', 'CLINIC_OWNER', 'SUPER_ADMIN'];
const ADMIN_LEVEL_OPTIONS = ['SUPER_ADMIN', 'SUPPORT', 'FINANCE'];

const ROLE_COLORS = {
  SUPER_ADMIN: 'bg-red-100 text-red-700',
  CLINIC_OWNER: 'bg-purple-100 text-purple-700',
  DOCTOR: 'bg-blue-100 text-blue-700',
  RECEPTIONIST: 'bg-green-100 text-green-700',
  PATIENT: 'bg-gray-100 text-gray-700',
};

// ── User Detail Drawer ────────────────────────────────────────────────────────
const UserDetailDrawer = ({ userId, onClose, onToggleStatus, actionLoading, currentUser }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    getAdminUserDetail(userId)
      .then((res) => setUser(res.data.data.user))
      .catch(() => toast.error('Failed to load user details'))
      .finally(() => setLoading(false));
  }, [userId]);

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  const fmtTime = (d) => d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never';

  const canToggle = user && user.id !== currentUser?.id && !(user.role === 'SUPER_ADMIN' && currentUser?.adminLevel !== 'ROOT');

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">User Details</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
          ) : !user ? (
            <p className="text-center text-gray-400 py-20">User not found</p>
          ) : (
            <div className="space-y-5">

              {/* Avatar + name */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-bold text-primary-700">{user.name?.charAt(0)?.toUpperCase() || '?'}</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{user.name || 'Unknown'}</h3>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <span className={`badge text-xs ${ROLE_COLORS[user.role] || 'badge-gray'}`}>{user.role}</span>
                    <span className={`badge text-xs ${user.isActive ? 'badge-success' : 'badge-error'}`}>
                      {user.isActive ? 'Active' : 'Disabled'}
                    </span>
                    {user.approvalStatus && <StatusBadge status={user.approvalStatus} />}
                    {user.adminProfile?.level && <span className="badge badge-gray text-xs">{user.adminProfile.level}</span>}
                  </div>
                </div>
              </div>

              {/* Contact */}
              <Section title="Contact">
                <Row label="Mobile" value={user.mobile} />
                <Row label="Email" value={user.email || '—'} />
                <Row label="Auth Provider" value={user.authProvider || '—'} />
              </Section>

              {/* Account */}
              <Section title="Account">
                <Row label="User ID" value={<span className="font-mono text-xs break-all">{user.id}</span>} />
                <Row label="Joined" value={fmtDate(user.createdAt)} />
                <Row label="Last Login" value={fmtTime(user.lastLoginAt)} />
                <Row label="Free Booking" value={user.freeBookingUsed ? '✅ Used' : '🎁 Available'} />
                <Row label="Total Appointments" value={user._count?.appointments ?? '—'} />
                <Row label="Total Payments" value={user._count?.payments ?? '—'} />
              </Section>

              {/* Patient profile */}
              {user.patientProfile && (
                <Section title="Patient Profile">
                  <Row label="Gender" value={user.patientProfile.gender || '—'} />
                  <Row label="Age / DOB" value={user.patientProfile.age || (user.patientProfile.dob ? fmtDate(user.patientProfile.dob) : '—')} />
                  <Row label="City" value={user.patientProfile.city || '—'} />
                  <Row label="Blood Group" value={user.patientProfile.bloodGroup || '—'} />
                  <Row label="Emergency Contact" value={user.patientProfile.emergencyContact || '—'} />
                  <Row label="Allergies" value={user.patientProfile.allergies || '—'} />
                  <Row label="Profile Complete" value={user.patientProfile.profileCompleted ? '✅ Yes' : '⚠️ No'} />
                </Section>
              )}

              {/* Doctor profile */}
              {user.doctorProfile && (
                <Section title="Doctor Profile">
                  <Row label="Specialization" value={user.doctorProfile.specialization || '—'} />
                  <Row label="Qualification" value={user.doctorProfile.qualification || '—'} />
                  <Row label="Experience" value={user.doctorProfile.experienceYears ? `${user.doctorProfile.experienceYears} yrs` : '—'} />
                  <Row label="Consultation Fee" value={user.doctorProfile.consultationFee ? `₹${user.doctorProfile.consultationFee}` : '—'} />
                  <Row label="Avg Time/Patient" value={user.doctorProfile.avgConsultationMins ? `${user.doctorProfile.avgConsultationMins} min` : '—'} />
                  <Row label="Verification" value={user.doctorProfile.verificationStatus || '—'} />
                </Section>
              )}

              {/* Owned clinics */}
              {user.ownedClinics?.length > 0 && (
                <Section title="Clinics Owned">
                  {user.ownedClinics.map((c) => (
                    <div key={c.id} className="flex items-center justify-between py-1.5">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{c.name}</p>
                        <p className="text-xs text-gray-400">{c.city}</p>
                      </div>
                      <StatusBadge status={c.approvalStatus} />
                    </div>
                  ))}
                </Section>
              )}

              {/* Recent appointments */}
              {user.appointments?.length > 0 && (
                <Section title="Recent Appointments">
                  {user.appointments.map((a) => (
                    <div key={a.id} className="flex items-center justify-between py-1.5">
                      <p className="text-sm text-gray-700">{fmtDate(a.appointmentDate)}</p>
                      <StatusBadge status={a.status} />
                    </div>
                  ))}
                </Section>
              )}

              {/* Rejection reason */}
              {user.rejectionReason && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-red-500 uppercase mb-1">Rejection Reason</p>
                  <p className="text-sm text-red-800">{user.rejectionReason}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        {user && canToggle && (
          <div className="border-t border-gray-100 px-6 py-4">
            <button
              onClick={() => onToggleStatus(user)}
              disabled={actionLoading === user.id}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors ${
                user.isActive
                  ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                  : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
              }`}
            >
              {actionLoading === user.id ? 'Saving...' : user.isActive ? '🚫 Disable Account' : '✅ Enable Account'}
            </button>
          </div>
        )}
      </div>
    </>
  );
};

// ── Helper sub-components ────────────────────────────────────────────────────
const Section = ({ title, children }) => (
  <div>
    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">{title}</p>
    <div className="bg-gray-50 rounded-xl px-4 py-1 divide-y divide-gray-100">
      {children}
    </div>
  </div>
);

const Row = ({ label, value }) => (
  <div className="flex items-center justify-between py-2.5 gap-3">
    <span className="text-xs font-medium text-gray-500 flex-shrink-0">{label}</span>
    <span className="text-sm text-gray-900 text-right">{value}</span>
  </div>
);

const UsersManagement = () => {
  const currentUser = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [deletionRequests, setDeletionRequests] = useState([]);
  const [isDeletionsLoading, setIsDeletionsLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1 });
  const [selectedUserId, setSelectedUserId] = useState(null); // ← NEW: drawer
  const [adminForm, setAdminForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    level: 'SUPPORT',
  });
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);

  const isRootAdmin = currentUser?.adminLevel === 'ROOT';
  const canToggleStandardUsers = ['ROOT', 'SUPER_ADMIN'].includes(currentUser?.adminLevel);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params = { page: pagination.page, limit: 20 };
      if (roleFilter !== 'All') params.role = roleFilter;
      if (search) params.search = search;

      const res = await getAdminUsers(params);
      setUsers(res.data.data || []);
      setPagination((prev) => ({ ...prev, total: res.data.pagination?.total || 0 }));
    } catch (_) {
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, pagination.page]);

  useEffect(() => {
    if (activeTab === 'deletions') fetchDeletionRequests();
  }, [activeTab]);

  const fetchDeletionRequests = async () => {
    setIsDeletionsLoading(true);
    try {
      const res = await getDeletionRequests();
      setDeletionRequests(res.data.data.users || []);
    } catch (_) {
      toast.error('Failed to load deletion requests');
    } finally {
      setIsDeletionsLoading(false);
    }
  };

  const handleCancelDeletion = async (user) => {
    const confirmed = window.confirm(`Restore account for ${user.mobile}? This will cancel the deletion request.`);
    if (!confirmed) return;
    try {
      await cancelDeletionRequest(user.id);
      toast.success('Account restored');
      fetchDeletionRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel deletion');
    }
  };

  const handleSearch = (event) => {
    event.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchUsers();
  };

  const handleToggleStatus = async (user) => {
    setActionLoading(user.id);
    try {
      await updateUserStatus(user.id, !user.isActive);
      toast.success(`${user.name || 'User'} ${user.isActive ? 'disabled' : 'enabled'}`);
      setSelectedUserId(null); // close drawer after action
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateAdmin = async (event) => {
    event.preventDefault();
    setIsCreatingAdmin(true);

    try {
      await createAdminUser(adminForm);
      toast.success('Admin account created');
      setAdminForm({
        fullName: '',
        phone: '',
        email: '',
        password: '',
        level: 'SUPPORT',
      });
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create admin');
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  const handleDeleteAdmin = async (user) => {
    const confirmed = window.confirm(`Delete admin account for ${user.email || user.name}?`);
    if (!confirmed) return;

    setActionLoading(`delete-${user.id}`);
    try {
      await deleteAdminUser(user.id);
      toast.success('Admin account deleted');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete admin');
    } finally {
      setActionLoading(null);
    }
  };

  const canToggleUser = (user) => {
    if (!canToggleStandardUsers || user.id === currentUser?.id) return false;
    if (user.role === 'SUPER_ADMIN') {
      return isRootAdmin && user.adminProfile?.level !== 'ROOT';
    }
    return true;
  };

  const canDeleteAdmin = (user) =>
    isRootAdmin &&
    user.role === 'SUPER_ADMIN' &&
    user.adminProfile?.level &&
    user.adminProfile.level !== 'ROOT' &&
    user.id !== currentUser?.id;

  return (
    <>
    <DashboardLayout>
      <div className="page-container">
        <div className="mb-6">
          <h1 className="mb-2 text-2xl font-bold text-text-primary">User Management</h1>
          <p className="text-sm text-text-muted">
            Review users across the platform. Root admin can create, disable, and delete admin accounts.
          </p>
        </div>

        {/* ── Tab switcher ───────────────────────────────────────────── */}
        <div className="mb-6 flex gap-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'users' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            All Users
          </button>
          <button
            onClick={() => setActiveTab('deletions')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'deletions' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            🗑️ Deletion Requests
            {deletionRequests.length > 0 && (
              <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {deletionRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* ── Deletion Requests Tab ──────────────────────────────────── */}
        {activeTab === 'deletions' && (
          <div>
            <p className="text-sm text-slate-500 mb-4">
              Accounts below are pending permanent deletion. Data is hard-purged <strong>10 days</strong> after the request (within 15 days total). You can cancel and restore an account before purge.
            </p>

            {isDeletionsLoading ? (
              <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
            ) : deletionRequests.length === 0 ? (
              <EmptyState icon="✓" title="No pending deletions" description="No accounts are currently queued for deletion." />
            ) : (
              <div className="space-y-3">
                {deletionRequests.map((user) => {
                  const requestedDate = new Date(user.deletionRequestedAt).toLocaleDateString('en-IN');
                  const urgency = user.daysLeft <= 2 ? 'text-red-600' : user.daysLeft <= 5 ? 'text-orange-500' : 'text-slate-500';
                  return (
                    <div key={user.id} className="card border border-red-100 bg-red-50/30">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-red-600 text-lg">🗑️</span>
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium text-slate-800">{user.name || 'Unknown'}</p>
                              <span className={`badge text-xs ${ROLE_COLORS[user.role] || 'badge-gray'}`}>{user.role}</span>
                            </div>
                            <p className="text-sm text-slate-500">{user.mobile}</p>
                            {user.email && <p className="text-xs text-slate-400">{user.email}</p>}
                            <p className="text-xs text-slate-400 mt-0.5">Requested: {requestedDate}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <span className={`text-sm font-bold ${urgency}`}>
                            {user.daysLeft === 0 ? 'Purging today' : `${user.daysLeft}d left`}
                          </span>
                          <button
                            onClick={() => handleCancelDeletion(user)}
                            className="text-xs font-semibold text-blue-600 border border-blue-200 px-3 py-1 rounded-lg hover:bg-blue-50"
                          >
                            Restore Account
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── All Users Tab ──────────────────────────────────────────── */}
        {activeTab === 'users' && (
        <div>
        {isRootAdmin ? (
          <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Root Controls</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">Create Admin Account</h2>
              <p className="mt-2 text-sm text-slate-600">
                Create new admin users with only the level they need.
              </p>
            </div>

            <form onSubmit={handleCreateAdmin} className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <input
                type="text"
                placeholder="Full name"
                className="input"
                value={adminForm.fullName}
                onChange={(event) => setAdminForm((current) => ({ ...current, fullName: event.target.value }))}
                required
              />
              <input
                type="text"
                placeholder="Phone (+91...)"
                className="input"
                value={adminForm.phone}
                onChange={(event) => setAdminForm((current) => ({ ...current, phone: event.target.value }))}
                required
              />
              <input
                type="email"
                placeholder="Email"
                className="input"
                value={adminForm.email}
                onChange={(event) => setAdminForm((current) => ({ ...current, email: event.target.value }))}
                required
              />
              <input
                type="password"
                placeholder="Strong password"
                className="input"
                value={adminForm.password}
                onChange={(event) => setAdminForm((current) => ({ ...current, password: event.target.value }))}
                required
              />
              <select
                className="input"
                value={adminForm.level}
                onChange={(event) => setAdminForm((current) => ({ ...current, level: event.target.value }))}
              >
                {ADMIN_LEVEL_OPTIONS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>

              <div className="md:col-span-2 xl:col-span-5 flex justify-end">
                <button type="submit" disabled={isCreatingAdmin} className="btn-primary px-6">
                  {isCreatingAdmin ? 'Creating...' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        ) : null}

        <form onSubmit={handleSearch} className="mb-4 flex gap-3">
          <input
            type="text"
            className="input flex-1"
            placeholder="Search by name, mobile, or email..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button type="submit" className="btn-primary px-6">
            Search
          </button>
        </form>

        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {ROLES.map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                roleFilter === role ? 'bg-primary-600 text-white' : 'border border-border bg-white text-text-muted'
              }`}
            >
              {role}
            </button>
          ))}
        </div>

        <p className="mb-4 text-sm text-text-muted">{pagination.total} users found</p>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : users.length === 0 ? (
          <EmptyState icon="UM" title="No users found" description="Try adjusting your search filters." />
        ) : (
          <div className="space-y-3">
            {users.map((user) => {
              const toggleLoading = actionLoading === user.id;
              const deleteLoading = actionLoading === `delete-${user.id}`;

              return (
                <div
                  key={user.id}
                  className="card cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-150"
                  onClick={() => setSelectedUserId(user.id)}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
                        <span className="text-sm font-semibold text-primary-700">
                          {user.name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-text-primary">{user.name || 'Unknown'}</p>
                          <span className={`badge text-xs ${ROLE_COLORS[user.role] || 'badge-gray'}`}>{user.role}</span>
                          {user.approvalStatus ? <StatusBadge status={user.approvalStatus} /> : null}
                          {user.adminProfile?.level ? <span className="badge badge-gray text-xs">{user.adminProfile.level}</span> : null}
                        </div>
                        <p className="text-sm text-text-muted">{user.mobile}</p>
                        {user.email ? <p className="text-xs text-text-muted">{user.email}</p> : null}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-3">
                      <span className={`badge ${user.isActive ? 'badge-success' : 'badge-error'}`}>
                        {user.isActive ? 'Active' : 'Disabled'}
                      </span>
                      {/* Chevron hint */}
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </div>
        )}
      </div>
    </DashboardLayout>

      {/* ── User Detail Drawer ─────────────────────────────────────── */}
      {selectedUserId && (
        <UserDetailDrawer
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onToggleStatus={handleToggleStatus}
          actionLoading={actionLoading}
          currentUser={currentUser}
        />
      )}
    </>
  );
};

export default UsersManagement;
