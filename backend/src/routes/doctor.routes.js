const express = require('express');
const router = express.Router();
const {
  getInvitationByToken,
  acceptInvitation,
  declineInvitation,
  getDoctorProfileByToken,
  updateDoctorProfile,
  submitProfileForVerification,
  sendMobileOtpForInvitation,
  verifyMobileOtpForInvitation,
  sendEmailOtpForInvitation,
  verifyEmailOtpForInvitation,
  getVerificationStatus,
} = require('../controllers/doctor.controller');
const { authenticate } = require('../middleware/auth.middleware');
const {
  requireAuth,
  requireDoctorRole,
  enforceOnboardingStep,
  validateInvitationOwnership,
  getOnboardingStatus,
} = require('../middleware/doctorOnboarding.middleware');

// ============================================================================
// PUBLIC ROUTES - No Authentication Required
// ============================================================================

// Get invitation details (public to view invitation)
router.get('/invitation/:token', getInvitationByToken);

// Accept/decline invitation (public, creates account)
router.post('/invitation/:token/accept', acceptInvitation);
router.post('/invitation/:token/decline', declineInvitation);

// ============================================================================
// SEQUENTIAL ONBOARDING ROUTES - Token-Based Validation
// ============================================================================

// STEP 1: Mobile OTP Verification (after invitation accepted)
router.post(
  '/invitation/:token/send-mobile-otp',
  validateInvitationOwnership,
  sendMobileOtpForInvitation
);
router.post(
  '/invitation/:token/verify-mobile-otp',
  validateInvitationOwnership,
  verifyMobileOtpForInvitation
);

// STEP 2: Email OTP Verification (after mobile verified)
router.post(
  '/invitation/:token/send-email-otp',
  validateInvitationOwnership,
  sendEmailOtpForInvitation
);
router.post(
  '/invitation/:token/verify-email-otp',
  validateInvitationOwnership,
  verifyEmailOtpForInvitation
);

// Get verification status (used by frontend to check progress)
router.get('/invitation/:token/verification-status', validateInvitationOwnership, getVerificationStatus);

// STEP 3: Profile Completion (after both OTPs verified)
router.get('/profile/by-token/:token', validateInvitationOwnership, getDoctorProfileByToken);
router.put('/profile/:invitationToken', validateInvitationOwnership, updateDoctorProfile);
router.post('/profile/:invitationToken/submit', validateInvitationOwnership, submitProfileForVerification);

// ============================================================================
// AUTHENTICATED ROUTES - JWT Required
// ============================================================================

// Get current onboarding status (used by frontend guards)
router.get(
  '/onboarding/status',
  authenticate,
  requireAuth,
  requireDoctorRole,
  getOnboardingStatus
);

// ============================================================================
// DOCTOR DASHBOARD ROUTES - For logged-in doctors
// ============================================================================

const {
  getTodayAppointments,
  getDoctorAppointments,
  getDoctorProfile,
  updateDoctorProfile: updateDoctorDashboardProfile,
  getDoctorAvailability,
  upsertDoctorAvailability,
} = require('../controllers/doctorDashboard.controller');

const {
  getMyCompleteProfile,
  getPublicDoctorProfile,
  updateMyProfile,
} = require('../controllers/doctorProfile.controller');

// Today's appointments
router.get('/today', authenticate, requireAuth, requireDoctorRole, getTodayAppointments);

// All appointments with filters
router.get('/appointments', authenticate, requireAuth, requireDoctorRole, getDoctorAppointments);

// ============================================================================
// DOCTOR PROFILE ROUTES - Role-based data separation
// ============================================================================

// Doctor's own complete profile (full access)
router.get('/me/profile', authenticate, requireAuth, requireDoctorRole, getMyCompleteProfile);
router.patch('/me/profile', authenticate, requireAuth, requireDoctorRole, updateMyProfile);

// Public doctor profile (for patients) - NO authentication required
router.get('/:id/public-profile', getPublicDoctorProfile);

// Legacy profile routes (kept for backward compatibility)
router.get('/profile', authenticate, requireAuth, requireDoctorRole, getDoctorProfile);
router.patch('/profile', authenticate, requireAuth, requireDoctorRole, updateDoctorDashboardProfile);

// Availability/schedule management
router.get('/:doctorId/availability', getDoctorAvailability);
router.post('/availability', authenticate, requireAuth, requireDoctorRole, upsertDoctorAvailability);

module.exports = router;
