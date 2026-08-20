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
  createPatientByStaff, // NEW: Staff-created patients
} = require('../controllers/patient.controller');
const { validate, bookAppointmentSchema } = require('../validators/appointment.validator');

// Public routes (no auth needed for doctor search)
router.get('/doctors', searchDoctors);
router.get('/doctors/:id', getDoctorProfile);
router.get('/nearby', getNearby);

// Protected patient routes — also allow DOCTOR role to use patient features for themselves
router.use(authenticate);

router.post('/appointments', authorize('PATIENT', 'DOCTOR', 'ADMIN', 'SUPER_ADMIN'), validate(bookAppointmentSchema), bookAppointment);
router.get('/appointments', authorize('PATIENT', 'DOCTOR', 'ADMIN', 'SUPER_ADMIN'), getMyAppointments);

// ✅ SECURITY FIX: Add ownership validation to prevent IDOR
router.get('/appointments/:id', authorize('PATIENT', 'DOCTOR', 'ADMIN', 'SUPER_ADMIN'), requireAppointmentOwnership, getAppointmentDetails);
router.get('/queue/:appointmentId', authorize('PATIENT', 'DOCTOR', 'ADMIN', 'SUPER_ADMIN'), requireAppointmentOwnership, getLiveQueue);
router.patch('/appointments/:id/cancel', authorize('PATIENT', 'DOCTOR', 'ADMIN', 'SUPER_ADMIN'), requireAppointmentOwnership, cancelAppointment);

router.get('/profile', authorize('PATIENT', 'DOCTOR', 'ADMIN', 'SUPER_ADMIN'), getProfile);
router.patch('/profile', authorize('PATIENT', 'DOCTOR', 'ADMIN', 'SUPER_ADMIN'), updateProfile);
// Google Play compliant account deletion
router.delete('/account', authorize('PATIENT', 'DOCTOR'), deleteAccount);

// ✅ NEW: Staff-Created Patient Accounts
// Only DOCTOR, RECEPTIONIST, CLINIC_OWNER, and SUPER_ADMIN can create patient accounts
router.post('/staff/create', 
  authorize('DOCTOR', 'RECEPTIONIST', 'CLINIC_OWNER', 'SUPER_ADMIN'), 
  createPatientByStaff
);

module.exports = router;
