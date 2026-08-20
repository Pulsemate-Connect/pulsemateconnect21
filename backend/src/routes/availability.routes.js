'use strict';

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const {
  getDoctorAvailability,
  getAvailableSlots,
  setAvailability,
  updateAvailability,
} = require('../controllers/availability.controller');

// ── Public routes ─────────────────────────────────────────────────────────────
router.get('/:doctorId/availability', getDoctorAvailability);
router.get('/:doctorId/slots', getAvailableSlots);

// ── Doctor-only protected routes ──────────────────────────────────────────────
router.post('/availability', authenticate, authorize('DOCTOR'), setAvailability);
// PATCH is an alias for POST — both upsert availability (frontend uses PATCH in some versions)
router.patch('/availability', authenticate, authorize('DOCTOR'), setAvailability);
router.put('/availability/:id', authenticate, authorize('DOCTOR'), updateAvailability);
// PATCH /:id is an alias for PUT /:id
router.patch('/availability/:id', authenticate, authorize('DOCTOR'), updateAvailability);

module.exports = router;
