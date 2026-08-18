import api from './axios';

export const getTodayAppointments = () =>
  api.get('/doctor/today');

export const getDoctorAppointments = (params) =>
  api.get('/patient/appointments', { params }); // Shared endpoint with patients

export const startConsultation = (id) =>
  api.patch(`/doctor/appointments/${id}/start`);

export const completeConsultation = (id, notes) =>
  api.patch(`/doctor/appointments/${id}/complete`, { notes });

export const updateAvailability = (data) =>
  api.patch('/doctor/availability', data);

export const getDoctorProfile = () =>
  api.get('/doctor/profile');

export const updateDoctorProfile = (data) =>
  api.patch('/doctor/profile', data);

// ── Doctor Invitations ───────────────────────────────────────────────────────

/** GET /doctor/invitations - Get all clinic invitations for logged-in doctor */
export const getMyDoctorInvitations = () =>
  api.get('/doctor/invitations');

/** POST /doctor/invitations/:inviteId/respond - Accept/reject/leave clinic invitation */
export const respondToDoctorInvitation = (inviteId, action) =>
  api.post(`/doctor/invitations/${inviteId}/respond`, { action }); // action: 'ACCEPT', 'REJECT', 'LEAVE'

// ── Schedule management ───────────────────────────────────────────────────────

/** GET /doctor/:doctorId/availability?clinicId= — fetch weekly schedule */
export const getDoctorSchedule = (doctorId, params) =>
  api.get(`/doctor/${doctorId}/availability`, { params });

/** POST /doctor/availability — upsert a single day's schedule */
export const setDaySchedule = (data) =>
  api.post('/doctor/availability', data);

/** PUT /doctor/availability/:id — update an existing schedule record */
export const updateDaySchedule = (id, data) =>
  api.put(`/doctor/availability/${id}`, data);
