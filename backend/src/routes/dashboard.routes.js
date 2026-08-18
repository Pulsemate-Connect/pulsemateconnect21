// ═════════════════════════════════════════════════════════════════════════════
//  Dashboard Routes — PulseMate Connect
// ═════════════════════════════════════════════════════════════════════════════
const express = require('express');
const router = express.Router();
const { authenticate, authorize, requireVerifiedAccount } = require('../middleware/auth.middleware');
const { getClinicDashboard, getQuickStats } = require('../controllers/dashboard.controller');

// All routes require authentication
router.use(authenticate);

// Dashboard routes - require VERIFIED account status
router.get(
  '/clinic/:clinicId',
  authorize('CLINIC_OWNER', 'RECEPTIONIST', 'SUPER_ADMIN'),
  requireVerifiedAccount, // ✅ FIX: Require approved/verified account
  getClinicDashboard
);

router.get(
  '/clinic/:clinicId/quick',
  authorize('CLINIC_OWNER', 'RECEPTIONIST', 'SUPER_ADMIN'),
  requireVerifiedAccount, // ✅ FIX: Require approved/verified account
  getQuickStats
);

module.exports = router;
