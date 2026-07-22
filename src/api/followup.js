/**
 * PulseMate — Follow-Up API calls
 * All endpoints under /api/follow-ups
 */
import api from './axios';

// ── Patient ───────────────────────────────────────────────────────────────────
/** GET /api/follow-ups/my  — patient sees their own follow-ups */
export const getMyFollowUps = (params) => api.get('/follow-ups/my', { params });

// ── Staff (CLINIC_OWNER, DOCTOR, RECEPTIONIST) ────────────────────────────────
/** GET /api/follow-ups?clinicId=&status=&patientId=&doctorId=&page=&limit= */
export const listFollowUps = (params) => api.get('/follow-ups', { params });

/** GET /api/follow-ups/:id */
export const getFollowUp = (id) => api.get(`/follow-ups/${id}`);

/** POST /api/follow-ups */
export const createFollowUp = (data) => api.post('/follow-ups', data);

/** PATCH /api/follow-ups/:id */
export const updateFollowUp = (id, data) => api.patch(`/follow-ups/${id}`, data);

/** PATCH /api/follow-ups/:id/cancel */
export const cancelFollowUp = (id, data) => api.patch(`/follow-ups/${id}/cancel`, data);

/** GET /api/follow-ups/completed-visits?patientId=&clinicId=&doctorId= */
export const getCompletedVisits = (params) => api.get('/follow-ups/completed-visits', { params });

/** GET /api/follow-ups/patient/:patientId?clinicId= */
export const getPatientFollowUps = (patientId, params) =>
  api.get(`/follow-ups/patient/${patientId}`, { params });

// ── Clinic settings ───────────────────────────────────────────────────────────
/** GET /api/follow-ups/clinic-settings?clinicId= */
export const getFollowUpSettings = (params) => api.get('/follow-ups/clinic-settings', { params });

/** PATCH /api/follow-ups/clinic-settings */
export const updateFollowUpSettings = (data) => api.patch('/follow-ups/clinic-settings', data);
