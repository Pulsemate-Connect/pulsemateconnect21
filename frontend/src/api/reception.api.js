import api from './axios';

export const getQueue = (doctorId, clinicId, sessionId = null) =>
  api.get(`/reception/queue/${doctorId}`, { params: { clinicId, ...(sessionId ? { sessionId } : {}) } });

export const addWalkIn = (data) =>
  api.post('/reception/walk-in', data);

export const addFollowUp = (data) =>
  api.post('/reception/follow-up', data);

export const checkIn = (queueItemId) =>
  api.patch(`/reception/queue/${queueItemId}/check-in`);

export const callNext = (queueId) =>
  api.patch(`/reception/queue/${queueId}/call-next`);

export const skipPatient = (id) =>
  api.patch(`/reception/queue-item/${id}/skip`);

export const completePatient = (id) =>
  api.patch(`/reception/queue-item/${id}/complete`);

export const pauseQueue = (queueId) =>
  api.patch(`/reception/queue/${queueId}/pause`);

export const resumeQueue = (queueId) =>
  api.patch(`/reception/queue/${queueId}/resume`);

// Session-level live queue stats for clinic owner dashboard (Req #13)
export const getSessionQueueStats = (clinicId) =>
  api.get(`/reception/session-stats/${clinicId}`);
