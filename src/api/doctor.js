import api from './axios';

/**
 * Doctor Profile API
 * For doctors viewing/updating their own profile
 */

// Get doctor's own complete profile (includes photo, clinics, documents)
export const getMyProfile = () => api.get('/doctor/me/profile');

// Update doctor's own profile
export const updateMyProfile = (data) => api.patch('/doctor/me/profile', data);

// Get doctor's appointments
export const getDoctorAppointments = (params) => api.get('/doctor/appointments', { params });

// Get today's appointments
export const getTodayAppointments = () => api.get('/doctor/appointments/today');

// Update appointment status
export const updateAppointmentStatus = (id, data) => api.patch(`/doctor/appointments/${id}/status`, data);

// Get doctor's availability
export const getDoctorAvailability = (params) => api.get('/doctor/availability', { params });

// Update doctor's availability
export const upsertDoctorAvailability = (data) => api.post('/doctor/availability', data);
