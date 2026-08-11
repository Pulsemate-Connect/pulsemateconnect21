'use strict';

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const {
  saveStep1,
  getProgress,
  saveProgress,
  resumeOnboarding,
} = require('../../controllers/clinic/onboarding.controller');

// All routes require CLINIC_OWNER authentication
router.use(authenticate);
router.use(authorize(['CLINIC_OWNER']));

/**
 * POST /api/clinic/onboarding/step1
 * Save Step 1: Clinic Information
 */
router.post('/step1', saveStep1);

/**
 * GET /api/clinic/onboarding/progress
 * Get current onboarding progress
 */
router.get('/progress', getProgress);

/**
 * POST /api/clinic/onboarding/save-progress
 * Auto-save partial progress (for localStorage sync)
 */
router.post('/save-progress', saveProgress);

/**
 * GET /api/clinic/onboarding/resume
 * Resume onboarding from saved database progress
 */
router.get('/resume', resumeOnboarding);

module.exports = router;
