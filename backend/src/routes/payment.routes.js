const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const {
  initiatePayment,
  verifyPayment,
  markCashPayment,
  getPaymentStatus,
  getPaymentStatusByOrderId,
  getMyPayments,
  requestRefund,
  getBookingStatus,
} = require('../controllers/payment.controller');

router.use(authenticate);

// Patient routes — also allow DOCTOR role to book for themselves
router.get('/booking-status', authorize('PATIENT', 'DOCTOR'), getBookingStatus);
router.post('/initiate', authorize('PATIENT', 'DOCTOR'), initiatePayment);
router.post('/verify', authorize('PATIENT', 'DOCTOR'), verifyPayment);
router.get('/my', authorize('PATIENT', 'DOCTOR'), getMyPayments);
router.post('/refund', authorize('PATIENT', 'CLINIC_OWNER', 'SUPER_ADMIN'), requestRefund);

// Staff routes
router.post('/cash', authorize('RECEPTIONIST', 'CLINIC_OWNER', 'SUPER_ADMIN'), markCashPayment);

// Shared
router.get('/appointment/:appointmentId',
  authorize('PATIENT', 'DOCTOR', 'RECEPTIONIST', 'CLINIC_OWNER', 'SUPER_ADMIN'),
  getPaymentStatus
);

// Poll endpoint — check payment status by Razorpay order ID (for post-redirect polling)
router.get('/status/:orderId',
  authorize('PATIENT', 'DOCTOR'),
  getPaymentStatusByOrderId
);

module.exports = router;
