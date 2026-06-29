// ═════════════════════════════════════════════════════════════════════════════
//  Dashboard Routes — PulseMate Connect
// ═════════════════════════════════════════════════════════════════════════════
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { getClinicDashboard, getQuickStats } = require('../controllers/dashboard.controller');

// All routes require authentication
router.use(authenticate);

// Dashboard routes
router.get(
  '/clinic/:clinicId',
  authorize('CLINIC_OWNER', 'RECEPTIONIST', 'SUPER_ADMIN'),
  getClinicDashboard
);

router.get(
  '/clinic/:clinicId/quick',
  authorize('CLINIC_OWNER', 'RECEPTIONIST', 'SUPER_ADMIN'),
  getQuickStats
);

module.exports = router;
