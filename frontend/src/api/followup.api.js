/**
 * PulseMate — Follow-Up API (web frontend)
 * All endpoints under /api/follow-ups
 */
import api from './axios';

// ── Clinic settings ───────────────────────────────────────────────────────────
export const getFollowUpSettings = (params) => api.get('/follow-ups/clinic-settings', { params });
export const updateFollowUpSettings = (data) => api.patch('/follow-ups/clinic-settings', data);

// ── CRUD ──────────────────────────────────────────────────────────────────────
export const listFollowUps = (params) => api.get('/follow-ups', { params });
export const getFollowUp = (id) => api.get(`/follow-ups/${id}`);
export const createFollowUp = (data) => api.post('/follow-ups', data);
export const updateFollowUp = (id, data) => api.patch(`/follow-ups/${id}`, data);
export const cancelFollowUp = (id, data) => api.patch(`/follow-ups/${id}/cancel`, data);

// ── Helpers ───────────────────────────────────────────────────────────────────
/** GET /api/follow-ups/completed-visits?patientId=&clinicId=&doctorId= */
export const getCompletedVisits = (params) => api.get('/follow-ups/completed-visits', { params });

/** GET /api/follow-ups/patient/:patientId?clinicId= */
export const getPatientFollowUps = (patientId, params) =>
  api.get(`/follow-ups/patient/${patientId}`, { params });
