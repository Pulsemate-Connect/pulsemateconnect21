const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { requireAppointmentOwnership } = require('../middleware/ownership.middleware'); // ✅ SECURITY FIX
const {
  searchDoctors,
  getDoctorProfile,
  bookAppointment,
  getMyAppointments,
  getAppointmentDetails,
  getLiveQueue,
  cancelAppointment,
  getProfile,
  updateProfile,
  getNearby,
  deleteAccount,
} = require('../controllers/patient.controller');
const { validate, bookAppointmentSchema } = require('../validators/appointment.validator');

// Public routes (no auth needed for doctor search)
router.get('/doctors', searchDoctors);
router.get('/doctors/:id', getDoctorProfile);
router.get('/nearby', getNearby);

// Protected patient routes — also allow DOCTOR role to use patient features for themselves
router.use(authenticate);

router.post('/appointments', authorize('PATIENT', 'DOCTOR'), validate(bookAppointmentSchema), bookAppointment);
router.get('/appointments', authorize('PATIENT', 'DOCTOR'), getMyAppointments);

// ✅ SECURITY FIX: Add ownership validation to prevent IDOR
router.get('/appointments/:id', authorize('PATIENT', 'DOCTOR'), requireAppointmentOwnership, getAppointmentDetails);
router.get('/queue/:appointmentId', authorize('PATIENT', 'DOCTOR'), requireAppointmentOwnership, getLiveQueue);
router.patch('/appointments/:id/cancel', authorize('PATIENT', 'DOCTOR'), requireAppointmentOwnership, cancelAppointment);

router.get('/profile', authorize('PATIENT', 'DOCTOR'), getProfile);
router.patch('/profile', authorize('PATIENT', 'DOCTOR'), updateProfile);
// Google Play compliant account deletion
router.delete('/account', authorize('PATIENT', 'DOCTOR'), deleteAccount);

module.exports = router;
