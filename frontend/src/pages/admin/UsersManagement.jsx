import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import {
  createAdminUser,
  deleteAdminUser,
  deleteUser,
  getAdminUsers,
  updateUserStatus,
} from '../../api/admin.api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import StatusBadge from '../../components/ui/StatusBadge';
import useAuthStore from '../../store/authStore';

const ROLES = ['All', 'PATIENT', 'DOCTOR', 'RECEPTIONIST', 'CLINIC_OWNER', 'SUPER_ADMIN'];
const ADMIN_LEVEL_OPTIONS = ['SUPER_ADMIN', 'SUPPORT', 'FINANCE'];

const ROLE_COLORS = {
  SUPER_ADMIN:   'bg-red-100 text-red-700',
  CLINIC_OWNER:  'bg-purple-100 text-purple-700',
  DOCTOR:        'bg-blue-100 text-blue-700',
  RECEPTIONIST:  'bg-green-100 text-green-700',
  PATIENT:       'bg-gray-100 text-gray-700',
};

// ── Detail row used inside the user modal ──────────────────────────────────
const DetailRow = ({ label, value, mono = false }) =>
  value ? (
    <div className="flex justify-between gap-4 py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide min-w-[120px]">{label}</span>
      <span className={`text-sm text-gray-800 text-right ${mono ? 'font-mono' : 'font-medium'}`}>{value}</span>
    </div>
  ) : null;

// ── User detail modal ─────────────────────────────────────────────────────
const UserDetailModal = ({ user, onClose, onToggle, onDelete, actionLoading, currentUser }) => {
  if (!user) return null;

  const isAdmin      = user.role === 'SUPER_ADMIN';
  const isRootAdmin  = currentUser?.adminLevel === 'ROOT';
  const isSelf       = user.id === currentUser?.id;
  const canToggle    = !isSelf && ['ROOT', 'SUPER_ADMIN'].includes(currentUser?.adminLevel) &&
                       (!isAdmin || (isRootAdmin && user.adminProfile?.level !== 'ROOT'));
  const canDelete    = !isSelf && isRootAdmin &&
                       (isAdmin
                         ? (user.adminProfile?.level && user.adminProfile.level !== 'ROOT')
                         : true);

  const toggleLoading = actionLoading === user.id;
  const deleteLoading = actionLoading === `delete-${user.id}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-lg font-bold text-blue-700">
                {user.name?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">{user.name || 'Unknown'}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-700'}`}>
                  {user.role}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {user.isActive ? 'Active' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-1">
          <DetailRow label="User ID"       value={user.id}              mono />
          <DetailRow label="Mobile"        value={user.mobile} />
          <DetailRow label="Email"         value={user.email} />
          <DetailRow label="Role"          value={user.role} />
          <DetailRow label="Admin Level"   value={user.adminProfile?.level} />
          <DetailRow label="Approval"      value={user.approvalStatus} />
          <DetailRow label="Joined"        value={user.createdAt ? new Date(user.createdAt).toLocaleString('en-IN') : undefined} />
          {user.rejectionReason && (
            <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-100">
              <p className="text-xs font-semibold text-red-600 mb-1">Rejection Reason</p>
              <p className="text-sm text-red-700">{user.rejectionReason}</p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex gap-3 p-5 border-t border-gray-100">
          {canToggle && (
            <button
              onClick={() => onToggle(user)}
              disabled={toggleLoading || deleteLoading}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 ${
                user.isActive
                  ? 'bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100'
                  : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
              }`}
            >
              {toggleLoading ? 'Saving…' : user.isActive ? 'Disable User' : 'Enable User'}
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete(user)}
              disabled={toggleLoading || deleteLoading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-all disabled:opacity-50"
            >
              {deleteLoading ? 'Deleting…' : isAdmin ? 'Delete Admin' : 'Delete User'}
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};


const UsersManagement = () => {
  const currentUser = useAuthStore((state) => state.user);
  const [users, setUsers]           = useState([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [roleFilter, setRoleFilter] = useState('All');
  const [search, setSearch]         = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1 });
  const [selectedUser, setSelectedUser]   = useState(null);
  const [adminForm, setAdminForm] = useState({
    fullName: '', phone: '', email: '', password: '', level: 'SUPPORT',
  });
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);

  const isRootAdmin = currentUser?.adminLevel === 'ROOT';

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

  useEffect(() => { fetchUsers(); }, [roleFilter, pagination.page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchUsers();
  };

  const handleToggleStatus = async (user) => {
    setActionLoading(user.id);
    try {
      await updateUserStatus(user.id, !user.isActive);
      toast.success(`${user.name || 'User'} ${user.isActive ? 'disabled' : 'enabled'}`);
      setSelectedUser((prev) => prev?.id === user.id ? { ...prev, isActive: !user.isActive } : prev);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (user) => {
    const label = user.role === 'SUPER_ADMIN' ? 'admin account' : 'user';
    const confirmed = window.confirm(
      `Permanently delete ${label} for "${user.name || user.email || user.mobile}"?\n\nThis cannot be undone.`
    );
    if (!confirmed) return;

    setActionLoading(`delete-${user.id}`);
    try {
      if (user.role === 'SUPER_ADMIN') {
        await deleteAdminUser(user.id);
      } else {
        await deleteUser(user.id);
      }
      toast.success(`${user.name || 'User'} deleted`);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setIsCreatingAdmin(true);
    try {
      await createAdminUser(adminForm);
      toast.success('Admin account created');
      setAdminForm({ fullName: '', phone: '', email: '', password: '', level: 'SUPPORT' });
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create admin');
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="mb-6">
          <h1 className="mb-2 text-2xl font-bold text-text-primary">User Management</h1>
          <p className="text-sm text-text-muted">
            Click any user to view full details. Root admin can disable, delete, and manage all accounts.
          </p>
        </div>

        {/* Create admin form (root only) */}
        {isRootAdmin && (
          <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Root Controls</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">Create Admin Account</h2>
              <p className="mt-2 text-sm text-slate-600">Create new admin users with only the level they need.</p>
            </div>
            <form onSubmit={handleCreateAdmin} className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <input type="text"     placeholder="Full name"          className="input" value={adminForm.fullName} onChange={(e) => setAdminForm((c) => ({ ...c, fullName: e.target.value }))}  required />
              <input type="text"     placeholder="Phone (+91...)"     className="input" value={adminForm.phone}    onChange={(e) => setAdminForm((c) => ({ ...c, phone:    e.target.value }))}  required />
              <input type="email"    placeholder="Email"              className="input" value={adminForm.email}    onChange={(e) => setAdminForm((c) => ({ ...c, email:    e.target.value }))}  required />
              <input type="password" placeholder="Strong password"    className="input" value={adminForm.password} onChange={(e) => setAdminForm((c) => ({ ...c, password: e.target.value }))}  required />
              <select className="input" value={adminForm.level} onChange={(e) => setAdminForm((c) => ({ ...c, level: e.target.value }))}>
                {ADMIN_LEVEL_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
              <div className="md:col-span-2 xl:col-span-5 flex justify-end">
                <button type="submit" disabled={isCreatingAdmin} className="btn-primary px-6">
                  {isCreatingAdmin ? 'Creating...' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-4 flex gap-3">
          <input
            type="text" className="input flex-1"
            placeholder="Search by name, mobile, or email..."
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn-primary px-6">Search</button>
        </form>

        {/* Role filter */}
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
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : users.length === 0 ? (
          <EmptyState icon="UM" title="No users found" description="Try adjusting your search filters." />
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => setSelectedUser(user)}
                className="card w-full text-left hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5 transition-all duration-150 group"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 group-hover:bg-blue-100 transition-colors">
                      <span className="text-sm font-semibold text-primary-700">
                        {user.name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-text-primary">{user.name || 'Unknown'}</p>
                        <span className={`badge text-xs ${ROLE_COLORS[user.role] || 'badge-gray'}`}>{user.role}</span>
                        {user.approvalStatus && <StatusBadge status={user.approvalStatus} />}
                        {user.adminProfile?.level && <span className="badge badge-gray text-xs">{user.adminProfile.level}</span>}
                      </div>
                      <p className="text-sm text-text-muted">{user.mobile}</p>
                      {user.email && <p className="text-xs text-text-muted">{user.email}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`badge ${user.isActive ? 'badge-success' : 'badge-error'}`}>
                      {user.isActive ? 'Active' : 'Disabled'}
                    </span>
                    <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.total > 20 && (
          <div className="flex justify-center gap-3 mt-6">
            <button
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
              disabled={pagination.page <= 1}
              className="btn-secondary px-4 disabled:opacity-40"
            >← Prev</button>
            <span className="text-sm text-gray-500 self-center">Page {pagination.page}</span>
            <button
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
              disabled={pagination.page * 20 >= pagination.total}
              className="btn-secondary px-4 disabled:opacity-40"
            >Next →</button>
          </div>
        )}
      </div>

      {/* User detail modal */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onToggle={handleToggleStatus}
          onDelete={handleDeleteUser}
          actionLoading={actionLoading}
          currentUser={currentUser}
        />
      )}
    </DashboardLayout>
  );
};

export default UsersManagement;
