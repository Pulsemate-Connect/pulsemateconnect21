const express = require('express');
const {
  clinicOwnerVerifyFirebasePhoneHandler,
  clinicOwnerSendEmailOtpHandler,
  clinicOwnerVerifyEmailOtpHandler,
  clinicOwnerUploadDocumentHandler,
  registerClinicOwnerHandler,
  saveClinicOnboardingStep1Handler,
  saveServicesOperationsHandler,
  saveClinicDocumentsHandler,
  submitClinicApplicationHandler,
  getClinicOnboardingDataHandler,
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
  patientFirebasePhoneLoginHandler,
  sendOtpHandler,
  verifyOtpHandler,
  checkMobileVerificationHandler,
  checkUserExistsHandler,
  sendRegistrationEmailOtp,
  verifyRegistrationEmailOtp,
  doctorSendMobileOtpLogin,
  doctorVerifyMobileOtpLogin,
  doctorSendEmailOtpLogin,
  doctorVerifyEmailOtpLogin,
} = require('../controllers/auth.controller');
const { clinicOwnerUpload } = require('../middleware/upload.middleware');
const { authenticateUser, requireSuperAdmin, requireAdminLevel, requireClinicOwner, requireVerifiedAccount } = require('../middleware/auth.middleware');
const {
  loginLimiter,
  forgotPasswordLimiter,
  emailVerificationSendLimiter,
  emailVerificationVerifyLimiter,
  resetPasswordLimiter,
  firebasePhoneLoginLimiter,
  firebasePhoneVerifyLimiter,
  otpSendLimiter,
  otpVerifyLimiter,
} = require('../middleware/rateLimit.middleware');
const {
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

// ──────────────────────────────────────────────────────────────────────────────
// FIREBASE PHONE AUTHENTICATION — PRODUCTION IMPLEMENTATION
// ──────────────────────────────────────────────────────────────────────────────
//
// OTP Generation & Delivery: Handled entirely by Firebase SDK
// - No backend OTP generation
// - No console logging of OTPs
// - Real SMS delivery via Firebase infrastructure
//
// Backend Responsibilities:
// 1. Verify Firebase ID Token using Firebase Admin SDK
// 2. Create/update user in database
// 3. Return application JWT tokens
//
// ALL authentication now uses Firebase Phone Auth (Native for mobile, JS SDK for web)
// ──────────────────────────────────────────────────────────────────────────────

// ── Patient Firebase Phone Auth (mobile + web) ────────────────────────────────
router.post(
  '/patient/firebase-phone-login',
  firebasePhoneLoginLimiter,
  validateRequest(firebasePhoneLoginSchema),
  patientFirebasePhoneLoginHandler
);

// ── MESSAGE CENTRAL VERIFYNOW OTP (Migration Path) ────────────────────────────
// ✅ PRODUCTION FIX: Using dedicated OTP rate limiters
// - otpSendLimiter: 5 requests/hour per phone number
// - otpVerifyLimiter: 10 attempts/15min per phone number
// - Phone-based keys prevent NAT/corporate network blocking
router.post(
  '/patient/send-otp',
  otpSendLimiter, // ✅ Dedicated OTP send limiter (5/hour per phone)
  sendOtpHandler
);

router.post(
  '/patient/verify-otp',
  otpVerifyLimiter, // ✅ Dedicated OTP verify limiter (10/15min per phone)
  verifyOtpHandler
);

// ── Clinic Partner OTP Authentication (Message Central) ───────────────────────
router.post(
  '/send-otp',
  otpSendLimiter,
  sendOtpHandler
);

router.post(
  '/verify-otp',
  otpVerifyLimiter,
  verifyOtpHandler
);

// Check if mobile number is already verified
router.get(
  '/check-mobile-verification/:mobile',
  checkMobileVerificationHandler
);

// Check if user exists (for login validation)
router.get(
  '/check-user-exists',
  checkUserExistsHandler
);

// ── Email OTP Registration (Clinic Partner) ───────────────────────────────────
router.post(
  '/register-email-otp/send',
  otpSendLimiter, // Reuse existing rate limiter
  sendRegistrationEmailOtp
);

router.post(
  '/register-email-otp/verify',
  otpVerifyLimiter, // Reuse existing rate limiter
  verifyRegistrationEmailOtp
);

router.post(
  '/register',
  validateRequest(clinicOwnerRegisterSchema),
  registerClinicOwnerHandler
);

// ── Clinic owner phone verification — Firebase Phone Auth ─────────────────────
router.post(
  '/clinic-owner/verify-firebase-phone',
  firebasePhoneVerifyLimiter,
  validateRequest(clinicOwnerFirebasePhoneVerifySchema),
  clinicOwnerVerifyFirebasePhoneHandler
);

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

// ── Clinic onboarding (save draft steps) ──────────────────────────────────────
router.get('/clinic-owner/get-onboarding-data', authenticateUser, getClinicOnboardingDataHandler);
router.post('/clinic-owner/save-clinic-information', authenticateUser, saveClinicOnboardingStep1Handler);
router.post('/clinic-owner/save-services-operations', authenticateUser, saveServicesOperationsHandler);
router.post('/clinic-owner/save-clinic-documents', 
  authenticateUser,
  clinicOwnerUpload.fields([
    { name: 'clinicRegistrationCertificate', maxCount: 1 },
    { name: 'medicalLicense', maxCount: 1 },
    { name: 'ownerIdProof', maxCount: 1 },
    { name: 'gstCertificate', maxCount: 1 },
    { name: 'clinicLogo', maxCount: 1 },
    { name: 'clinicExterior', maxCount: 1 },
    { name: 'clinicReception', maxCount: 1 },
    { name: 'clinicConsultation', maxCount: 1 },
  ]),
  saveClinicDocumentsHandler
);

// Step 4: Submit Final Application
router.post('/clinic-owner/submit-application', authenticateUser, requireClinicOwner, submitClinicApplicationHandler);

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

// ✅ NEW: Doctor OTP Login Routes
router.post('/doctor/send-mobile-otp', otpSendLimiter, doctorSendMobileOtpLogin);
router.post('/doctor/verify-mobile-otp', otpVerifyLimiter, doctorVerifyMobileOtpLogin);
router.post('/doctor/send-email-otp', otpSendLimiter, doctorSendEmailOtpLogin);
router.post('/doctor/verify-email-otp', otpVerifyLimiter, doctorVerifyEmailOtpLogin);

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

module.exports = router;
