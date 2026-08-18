/**
 * Doctor Profile API
 * Handles doctor profile operations with role-based data access
 */

import api from './axios';

/**
 * Doctor's own complete profile (full access)
 * GET /api/doctor/me/profile
 */
export const getMyCompleteProfile = () => api.get('/doctor/me/profile');

/**
 * Update doctor's own profile
 * PATCH /api/doctor/me/profile
 * Allowed fields: bio, consultationFee, languagesKnown, areasOfExpertise, profilePhotoUrl
 */
export const updateMyProfile = (data) => api.patch('/doctor/me/profile', data);

/**
 * Public doctor profile (for patients)
 * GET /api/doctor/:id/public-profile
 * NO authentication required
 */
export const getPublicDoctorProfile = (doctorId) => 
  api.get(`/doctor/${doctorId}/public-profile`);

/**
 * Clinic's view of their doctor
 * GET /api/clinic/doctors/:id/profile
 * Requires CLINIC_OWNER role
 */
export const getClinicDoctorProfile = (doctorId) =>
  api.get(`/clinic/doctors/${doctorId}/profile`);

/**
 * Admin verification view (complete data)
 * GET /api/admin/doctors/:doctorId/verification
 * Requires SUPER_ADMIN role
 */
export const getAdminVerificationProfile = (doctorId) =>
  api.get(`/admin/doctors/${doctorId}/verification`);
