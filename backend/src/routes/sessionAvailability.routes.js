/**
 * Session Availability Routes
 * 
 * Public endpoints for real-time session slot availability
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const {
  getClinicSessionAvailability,
  getDoctorSessionAvailability,
  validateSessionCapacity,
} = require('../controllers/sessionAvailability.controller');

// Public routes - anyone can check availability
router.get('/clinics/:clinicId/sessions/availability', getClinicSessionAvailability);
router.get('/doctor/:doctorId/sessions/availability', getDoctorSessionAvailability);

// Protected route - validate capacity before booking (requires auth)
router.post('/sessions/validate', authenticate, validateSessionCapacity);

module.exports = router;
