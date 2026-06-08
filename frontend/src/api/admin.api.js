import api from './axios';

export const getAdminDashboard = () =>
  api.get('/admin/dashboard');

// ── Clinic management ──────────────────────────────────────────────────────
export const getAllAdminClinics = (params) =>
  api.get('/admin/all-clinics', { params });

export const getAdminClinicStats = (params) =>
  api.get('/admin/all-clinics/stats', { params });

export const getAdminClinicDetail = (id) =>
  api.get(`/admin/all-clinics/${id}`);

export const approveClinic = (id) =>
  api.patch(`/admin/clinics/${id}/approve`);

export const rejectClinic = (id, reason) =>
  api.patch(`/admin/clinics/${id}/reject`, { reason });

export const requestClinicChanges = (id, reason) =>
  api.patch(`/admin/clinics/${id}/request-changes`, { reason });

export const suspendClinic = (id, reason) =>
  api.patch(`/admin/clinics/${id}/suspend`, { reason });

// ── Legacy approval endpoints (ClinicApprovals.jsx still uses these) ────────
// These proxy to the admin routes which are the canonical implementation.
export const getAdminClinics = (params) =>
  api.get('/admin/all-clinics', { params });

export const getPendingClinicApprovals = () =>
  api.get('/admin/pending-clinics');

export const getPendingDoctorApprovals = () =>
  api.get('/admin/pending-doctors');

export const decideClinicApproval = (clinicId, data) =>
  api.patch(`/approvals/clinics/${clinicId}`, data);

export const decideDoctorApproval = (doctorUserId, data) =>
  api.patch(`/approvals/doctors/${doctorUserId}`, data);

// ── User management ──────────────────────────────────────────────────────
export const getAdminUsers = (params) =>
  api.get('/admin/users', { params });

export const updateUserStatus = (id, isActive) =>
  api.patch(`/admin/users/${id}/status`, { isActive });

export const createAdminUser = (data) =>
  api.post('/admin/admins', data);

export const deleteAdminUser = (id) =>
  api.delete(`/admin/admins/${id}`);

export const resetDatabase = () =>
  api.post('/admin/reset-database');
