import api from './axios';

export const searchDoctors = (params) => api.get('/patient/doctors', { params });
export const getDoctorProfile = (id) => api.get(`/patient/doctors/${id}`);
export const getNearby = (params) => api.get('/patient/nearby', { params });
export const bookAppointment = (data) => api.post('/patient/appointments', data);
export const getMyAppointments = (params) => api.get('/patient/appointments', { params });
export const getAppointmentDetail = (id) => api.get(`/patient/appointments/${id}`);
export const cancelAppointment = (id) => api.patch(`/patient/appointments/${id}/cancel`);
export const getLiveQueue = (apptId) => api.get(`/patient/queue/${apptId}`);
export const getPatientProfile = () => api.get('/patient/profile');
export const updatePatientProfile = (data) => api.patch('/patient/profile', data);
export const initiatePayment = (data) => api.post('/payments/initiate', data);
export const verifyPayment = (data) => api.post('/payments/verify', data);
export const getMyPayments = (params) => api.get('/payments/my', { params });
export const getBookingStatus = () => api.get('/payments/booking-status');
export const getAvailableSlots = (doctorId, params) => api.get(`/doctor/${doctorId}/slots`, { params });
export const getDoctorAvailability = (doctorId, params) => api.get(`/doctor/${doctorId}/availability`, { params });
export const getClinicSessions = (clinicId) => api.get(`/clinics/${clinicId}/sessions`);
export const requestRefund = (data) => api.post('/payments/refund', data);
// Google Play compliant account deletion
export const deleteAccount = () => api.delete('/patient/account');
