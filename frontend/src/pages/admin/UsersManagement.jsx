import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import {
  createAdminUser,
  deleteAdminUser,
  getAdminUsers,
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

const UsersManagement = () => {
  const currentUser = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'deletions'
  const [users, setUsers] = useState([]);
  const [deletionRequests, setDeletionRequests] = useState([]);
  const [isDeletionsLoading, setIsDeletionsLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1 });
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
                <div key={user.id} className="card">
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
                        {user.rejectionReason ? <p className="mt-1 text-xs text-red-600">Reason: {user.rejectionReason}</p> : null}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-3">
                      <span className={`badge ${user.isActive ? 'badge-success' : 'badge-error'}`}>
                        {user.isActive ? 'Active' : 'Disabled'}
                      </span>

                      {canToggleUser(user) ? (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(user)}
                          disabled={toggleLoading || deleteLoading}
                          className={`text-sm font-medium ${
                            user.isActive ? 'text-error hover:text-red-700' : 'text-secondary-600 hover:text-secondary-700'
                          }`}
                        >
                          {toggleLoading ? 'Saving...' : user.isActive ? 'Disable' : 'Enable'}
                        </button>
                      ) : null}

                      {canDeleteAdmin(user) ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteAdmin(user)}
                          disabled={toggleLoading || deleteLoading}
                          className="text-sm font-medium text-red-700 hover:text-red-800"
                        >
                          {deleteLoading ? 'Deleting...' : 'Delete Admin'}
                        </button>
                      ) : null}
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
  );
};

export default UsersManagement;
