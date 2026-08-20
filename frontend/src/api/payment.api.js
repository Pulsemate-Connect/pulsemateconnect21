import api from './axios';

// Step 1 — create pending appointment + Razorpay order
export const initiatePayment = (bookingData) =>
  api.post('/payments/initiate', bookingData);

// Step 2 — verify payment + confirm appointment (called from Razorpay handler callback)
export const verifyPayment = (data) =>
  api.post('/payments/verify', data);

// Poll payment status by Razorpay order ID (used after redirect when handler may have been missed)
export const getPaymentStatusByOrderId = (orderId) =>
  api.get(`/payments/status/${orderId}`);

// Receptionist cash payment
export const markCashPayment = (data) =>
  api.post('/payments/cash', data);

export const getPaymentStatus = (appointmentId) =>
  api.get(`/payments/appointment/${appointmentId}`);

export const getMyPayments = (params) =>
  api.get('/payments/my', { params });

export const requestRefund = (data) =>
  api.post('/payments/refund', data);

export const getBookingStatus = () =>
  api.get('/payments/booking-status');
