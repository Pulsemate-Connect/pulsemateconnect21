import api from './axios';

export const sendOtp = (mobile, purpose = 'LOGIN') => api.post('/auth/send-otp', { mobile, purpose });
export const verifyOtp = (mobile, otp, purpose = 'LOGIN', name) => api.post('/auth/verify-otp', { mobile, otp, purpose, name });
export const loginPass = (mobile, password) => api.post('/auth/login-password', { mobile, password });
export const getMe = () => api.get('/auth/me');
export const logout = () => api.post('/auth/logout');
export const getMyNotifications = () => api.get('/notifications/my');
export const markNotificationRead = (id) => api.patch(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => api.patch('/notifications/read-all');
export const registerFcmToken = (token, platform = 'android') => api.post('/notifications/fcm-token', { token, platform });
export const removeFcmToken = (token) => api.delete('/notifications/fcm-token', { data: { token } });

/**
 * Firebase Phone Auth login / register for PATIENTS.
 *
 * Called AFTER the user successfully verifies their phone OTP via Firebase on the client.
 * Sends the Firebase ID token to the backend which verifies it and returns our app JWT.
 *
 * @param {string} firebaseIdToken - ID token from Firebase after verifyPhoneOtp()
 * @param {string} [name] - Optional: user's name (only used when creating a new account)
 */
export const firebasePhoneLogin = (firebaseIdToken, name) =>
  api.post('/auth/patient/firebase-phone-login', { firebaseIdToken, ...(name ? { name } : {}) });

// ── Admin campaign inbox (in-app notifications sent by admin) ─────────────────
export const getInboxNotifications = (params) => api.get('/notifications/inbox', { params });
export const markInboxRead = (id) => api.patch(`/notifications/inbox/${id}/read`);
export const markAllInboxRead = () => api.patch('/notifications/inbox/read-all');
export const registerDeviceToken = (fcmToken, platform = 'ANDROID') =>
  api.post('/device-token/register', { fcmToken, platform });
export const deactivateDeviceToken = (fcmToken) =>
  api.post('/device-token/deactivate', { fcmToken });

// ── Quick Wins: New Notification APIs ─────────────────────────────────────────
export const getUserNotifications = (userId, params = {}) => 
  api.get('/notifications', { params: { userId, ...params } });
export const getUnreadCount = (userId) => 
  api.get('/notifications/unread-count', { params: { userId } });
export const markNotificationAsRead = (notificationId) => 
  api.patch(`/notifications/${notificationId}/read`);
export const markAllNotificationsAsRead = (userId) => 
  api.patch('/notifications/read-all', { userId });

// ── Quick Wins: Dashboard APIs ────────────────────────────────────────────────
export const getClinicDashboard = (clinicId) => 
  api.get(`/dashboard/clinic/${clinicId}`);
export const getClinicDashboardQuick = (clinicId) => 
  api.get(`/dashboard/clinic/${clinicId}/quick`);

// ── Quick Wins: Booking Control APIs ──────────────────────────────────────────
export const stopClinicBookings = (clinicId, reason = '') => 
  api.post(`/clinic/${clinicId}/bookings/stop`, { reason });
export const resumeClinicBookings = (clinicId) => 
  api.post(`/clinic/${clinicId}/bookings/resume`);
export const getClinicBookingStatus = (clinicId) => 
  api.get(`/clinic/${clinicId}/booking-status`);
