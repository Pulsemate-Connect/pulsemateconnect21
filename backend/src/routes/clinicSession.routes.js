// ─────────────────────────────────────────────────────────────────────────────
//  Clinic Session Routes — PulseMate Connect
//  Public routes for fetching clinic sessions
// ─────────────────────────────────────────────────────────────────────────────
const express = require('express');
const router = express.Router();
const { getClinicSessions } = require('../controllers/clinicSession.controller');

// Public route: Get sessions for a specific clinic
router.get('/:clinicId/sessions', getClinicSessions);

module.exports = router;
