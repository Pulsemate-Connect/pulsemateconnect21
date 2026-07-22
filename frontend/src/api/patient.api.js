import api from './axios';

export const searchDoctors = (params) =>
  api.get('/patient/doctors', { params });

export const getDoctorProfile = (id) =>
  api.get(`/patient/doctors/${id}`);

export const bookAppointment = (data) =>
  api.post('/patient/appointments', data);

export const getMyAppointments = (params) =>
  api.get('/patient/appointments', { params });

export const getAppointmentDetails = (id) =>
  api.get(`/patient/appointments/${id}`);

export const getLiveQueue = (appointmentId) =>
  api.get(`/patient/queue/${appointmentId}`);

export const cancelAppointment = (id) =>
  api.patch(`/patient/appointments/${id}/cancel`);

export const getPatientProfile = () =>
  api.get('/patient/profile');

export const updatePatientProfile = (data) =>
  api.patch('/patient/profile', data);

export const getNearby = (params) =>
  api.get('/patient/nearby', { params });

export const getAvailableSlots = (doctorId, params) =>
  api.get(`/doctor/${doctorId}/slots`, { params });

export const getClinicSessions = (clinicId) =>
  api.get(`/clinics/${clinicId}/sessions`);

// ── Follow-up eligibility + booking ──────────────────────────────────────────
export const getFollowUpEligibility = (params = {}) =>
  api.get('/patient/follow-up/eligible', { params });

export const bookFollowUp = (data) =>
  api.post('/patient/follow-up/book', data);
