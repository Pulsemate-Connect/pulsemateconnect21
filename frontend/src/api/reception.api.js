import api from './axios';

// ── Queue management ──────────────────────────────────────────────────────────
export const getQueue = (doctorId, clinicId, sessionId = null) =>
  api.get(`/reception/queue/${doctorId}`, { params: { clinicId, ...(sessionId ? { sessionId } : {}) } });

export const callNext = (queueId) =>
  api.patch(`/reception/queue/${queueId}/call-next`);

export const pauseQueue = (queueId) =>
  api.patch(`/reception/queue/${queueId}/pause`);

export const resumeQueue = (queueId) =>
  api.patch(`/reception/queue/${queueId}/resume`);

export const closeQueue = (queueId) =>
  api.patch(`/reception/queue/${queueId}/close`);

// ── Queue item actions ────────────────────────────────────────────────────────
export const checkIn = (queueItemId) =>
  api.patch(`/reception/queue/${queueItemId}/check-in`);

export const skipPatient = (id) =>
  api.patch(`/reception/queue-item/${id}/skip`);

export const completePatient = (id) =>
  api.patch(`/reception/queue-item/${id}/complete`);

// ── Booking flows ─────────────────────────────────────────────────────────────
export const addWalkIn = (data) =>
  api.post('/reception/walk-in', data);

export const addFollowUp = (data) =>
  api.post('/reception/follow-up', data);

// ── Check-in by appointment ID (primary workflow — no UUID paste) ─────────────
export const checkInAppointment = (appointmentId) =>
  api.patch(`/reception/appointments/${appointmentId}/check-in`);

// ── Today's appointments + search ────────────────────────────────────────────
export const getTodaysAppointments = (params = {}) =>
  api.get('/reception/appointments/today', { params });

export const searchPatients = (q, clinicId) =>
  api.get('/reception/patients/search', { params: { q, ...(clinicId ? { clinicId } : {}) } });

// ── Dashboard stats ───────────────────────────────────────────────────────────
export const getReceptionDashboardStats = (clinicId) =>
  api.get('/reception/dashboard-stats', { params: clinicId ? { clinicId } : {} });

// ── Session-level live stats (clinic owner dashboard — kept for compat) ───────
export const getSessionQueueStats = (clinicId) =>
  api.get(`/reception/session-stats/${clinicId}`);
