const express = require('express');
const {
  patientSendOtpHandler,
  patientVerifyOtpHandler,
  clinicOwnerSendOtpHandler,
  clinicOwnerVerifyOtpHandler,
  clinicOwnerVerifyFirebasePhoneHandler,
  clinicOwnerSendEmailOtpHandler,
  clinicOwnerVerifyEmailOtpHandler,
  clinicOwnerUploadDocumentHandler,
  registerClinicOwnerHandler,
  doctorVerifyFirebasePhoneHandler,
  registerDoctorHandler,
  loginHandler,
  createReceptionistHandler,
  createAdminHandler,
  lookupPincodeHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
  verifyResetTokenHandler,
  refreshTokenHandler,
  logoutHandler,
  logoutAllHandler,
  getMeHandler,
  firebasePhoneLoginHandler,
  patientFirebasePhoneLoginHandler,
} = require('../controllers/auth.controller');
const { clinicOwnerUpload } = require('../middleware/upload.middleware');
const { authenticateUser, requireSuperAdmin, requireAdminLevel, requireClinicOwner, requireVerifiedAccount } = require('../middleware/auth.middleware');
const {
  otpSendLimiter,
  otpVerifyLimiter,
  loginLimiter,
  forgotPasswordLimiter,
  emailVerificationSendLimiter,
  emailVerificationVerifyLimiter,
  resetPasswordLimiter,
  firebasePhoneLoginLimiter,
  firebasePhoneVerifyLimiter,
} = require('../middleware/rateLimit.middleware');
const {
  patientSendOtpSchema,
  patientVerifyOtpSchema,
  clinicOwnerOtpSendSchema,
  clinicOwnerOtpVerifySchema,
  clinicOwnerEmailVerificationSendSchema,
  clinicOwnerEmailOtpVerifySchema,
  clinicOwnerEmailVerificationTokenSchema,
  clinicOwnerRegisterSchema,
  doctorRegisterSchema,
  commonLoginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyResetTokenSchema,
  createReceptionistSchema,
  adminCreateSchema,
  firebasePhoneLoginSchema,
  clinicOwnerFirebasePhoneVerifySchema,
  doctorFirebasePhoneVerifySchema,
  validateRequest,
  validateQuery,
} = require('../validations/auth.validation');

const router = express.Router();

// ── Patient OTP (legacy — kept for older app versions) ────────────────────────
router.post('/patient/send-otp', otpSendLimiter, validateRequest(patientSendOtpSchema), patientSendOtpHandler);
router.post('/patient/verify-otp', otpVerifyLimiter, validateRequest(patientVerifyOtpSchema), patientVerifyOtpHandler);

// ── Patient Firebase Phone Auth (primary) ─────────────────────────────────────
router.post(
  '/patient/firebase-phone-login',
  firebasePhoneLoginLimiter,
  validateRequest(firebasePhoneLoginSchema),
  patientFirebasePhoneLoginHandler
);

// ── Clinic owner phone verification — Firebase Phone Auth (primary) ───────────
router.post(
  '/clinic-owner/verify-firebase-phone',
  firebasePhoneVerifyLimiter,
  validateRequest(clinicOwnerFirebasePhoneVerifySchema),
  clinicOwnerVerifyFirebasePhoneHandler
);

// ── Clinic owner phone verification — legacy custom OTP (backward compat) ─────
router.post('/clinic-owner/send-otp', otpSendLimiter, validateRequest(clinicOwnerOtpSendSchema), clinicOwnerSendOtpHandler);
router.post('/clinic-owner/verify-otp', otpVerifyLimiter, validateRequest(clinicOwnerOtpVerifySchema), clinicOwnerVerifyOtpHandler);

// ── Clinic owner email verification ──────────────────────────────────────────
router.post('/clinic-owner/send-email-otp', emailVerificationSendLimiter, validateRequest(clinicOwnerEmailVerificationSendSchema), clinicOwnerSendEmailOtpHandler);
router.post('/clinic-owner/verify-email-otp', emailVerificationVerifyLimiter, validateRequest(clinicOwnerEmailOtpVerifySchema), clinicOwnerVerifyEmailOtpHandler);
router.post('/clinic-owner/send-email-verification', emailVerificationSendLimiter, validateRequest(clinicOwnerEmailVerificationSendSchema), clinicOwnerSendEmailOtpHandler);
router.get('/clinic-owner/verify-email', emailVerificationVerifyLimiter, validateQuery(clinicOwnerEmailVerificationTokenSchema), clinicOwnerVerifyEmailOtpHandler);
router.post('/send-email-verification', emailVerificationSendLimiter, validateRequest(clinicOwnerEmailVerificationSendSchema), clinicOwnerSendEmailOtpHandler);
router.get('/verify-email-token', emailVerificationVerifyLimiter, validateQuery(clinicOwnerEmailVerificationTokenSchema), clinicOwnerVerifyEmailOtpHandler);

// ── Clinic owner document upload + registration ───────────────────────────────
router.post('/clinic-owner/upload-document', clinicOwnerUpload.single('file'), clinicOwnerUploadDocumentHandler);
router.get('/pincode/:pincode', lookupPincodeHandler);
router.post('/clinic-owner/register', validateRequest(clinicOwnerRegisterSchema), registerClinicOwnerHandler);

// ── Doctor phone verification — Firebase Phone Auth ───────────────────────────
router.post(
  '/doctor/verify-firebase-phone',
  firebasePhoneVerifyLimiter,
  validateRequest(doctorFirebasePhoneVerifySchema),
  doctorVerifyFirebasePhoneHandler
);

// ── Doctor registration ───────────────────────────────────────────────────────
router.post('/doctor/register', validateRequest(doctorRegisterSchema), registerDoctorHandler);

// ── Common auth ───────────────────────────────────────────────────────────────
router.post('/login', loginLimiter, validateRequest(commonLoginSchema), loginHandler);
router.post('/forgot-password', forgotPasswordLimiter, validateRequest(forgotPasswordSchema), forgotPasswordHandler);
router.get('/verify-reset-token', validateQuery(verifyResetTokenSchema), verifyResetTokenHandler);
router.post('/reset-password', resetPasswordLimiter, validateRequest(resetPasswordSchema), resetPasswordHandler);
router.post('/refresh', refreshTokenHandler);
router.post('/logout', logoutHandler);
router.post('/logout-all', authenticateUser, logoutAllHandler);
router.get('/me', authenticateUser, getMeHandler);

router.post(
  '/admin/create',
  authenticateUser,
  requireSuperAdmin,
  requireAdminLevel('ROOT'),
  validateRequest(adminCreateSchema),
  createAdminHandler
);

router.post(
  '/clinic/receptionists',
  authenticateUser,
  requireClinicOwner,
  requireVerifiedAccount,
  validateRequest(createReceptionistSchema),
  createReceptionistHandler
);

// ── Backward-compatible endpoints while the rest of the app migrates ──────────
router.post('/send-otp', otpSendLimiter, validateRequest(patientSendOtpSchema), patientSendOtpHandler);
router.post('/verify-otp', otpVerifyLimiter, validateRequest(patientVerifyOtpSchema), patientVerifyOtpHandler);
router.post('/login-password', loginLimiter, validateRequest(commonLoginSchema), loginHandler);

// ── Firebase Phone Auth — Patient login & register ────────────────────────────
router.post(
  '/user/firebase-phone-login',
  firebasePhoneLoginLimiter,
  validateRequest(firebasePhoneLoginSchema),
  firebasePhoneLoginHandler
);

module.exports = router;
