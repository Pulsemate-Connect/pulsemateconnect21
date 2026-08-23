const prisma = require('../config/database');
const logger = require('../config/logger');
const {
  createSessionTokens,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  revokeAllRefreshTokens,
} = require('../services/token.service');
const { hashPassword, verifyPassword } = require('../utils/hash');
const { sendSuccess, sendError } = require('../utils/response');
const { createAuditLog } = require('../services/audit.service');
const { REFRESH_COOKIE_NAME, clearRefreshTokenCookie, setRefreshTokenCookie } = require('../utils/cookies');
const { normalizeMobileNumber } = require('../utils/mobile');
const {
  createPasswordResetToken,
  validatePasswordResetToken,
  markTokenUsed,
} = require('../services/password-reset.service');
const {
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendSuperAdminPasswordChangedSecurityEmail,
  sendSuperAdminResetEmail,
} = require('../services/email.service');
const {
  sendEmailVerification,
  verifyEmailVerificationToken,
} = require('../services/email-verification.service');
const { verifyFirebaseToken } = require('../config/firebase');
const firebasePhoneVerificationRepo = require('../repositories/firebase-phone-verification.repository');
const messageCentralService = require('../services/messagecentral.service');
const jwt = require('jsonwebtoken');

const buildFileUrl = (req, file) => {
  // When Cloudinary is active, req.file.path contains the full Cloudinary URL.
  // When using local disk, req.file.filename is the stored filename.
  if (file.path && /^https?:\/\//i.test(file.path)) {
    // Cloudinary URL — return as-is
    return file.path;
  }
  // Local disk storage — build absolute URL
  const origin = process.env.BACKEND_URL ||
    `${req.protocol}://${req.get('host')}`;
  return `${origin}/uploads/clinic-owner/${file.filename}`;
};

const baseUserInclude = {
  adminProfile: true,
  doctorProfile: true,
  receptionistProfile: {
    include: {
      assignedClinic: true,
    },
  },
  clinicOwnerProfile: true,
  ownedClinics: true,
  patientProfile: true,
};

const toAuthUser = (user) => ({
  id: user.id,
  name: user.name,
  phone: user.mobile,
  email: user.email,
  role: user.role,
  status: user.approvalStatus,
  isPhoneVerified: user.isPhoneVerified,
  isEmailVerified: user.isEmailVerified,
  rejectionReason: user.rejectionReason,
  suspendedReason: user.suspendedReason,
  doctorProfile: user.doctorProfile || null,
  receptionistProfile: user.receptionistProfile || null,
  clinicOwnerProfile: user.clinicOwnerProfile || null,
  patientProfile: user.patientProfile || null,
  ownedClinics: user.ownedClinics || [],
  adminLevel: user.adminProfile?.level || null,
  clinicStaff: user.clinicStaff || [],
});

const getSessionMetadata = (req) => ({
  ipAddress: req.ip,
  deviceInfo: req.headers['x-device-info'] || req.headers['user-agent'] || null,
});

const issueAuthTokens = async (res, user, req) => {
  const tokens = await createSessionTokens(user, user.role, getSessionMetadata(req));
  // ✅ PERSISTENT LOGIN: Set 30-day cookie (matches refresh token expiry)
  setRefreshTokenCookie(res, tokens.refreshToken, 30 * 24 * 60 * 60 * 1000);
  return tokens;
};

const buildMePayload = async (userId) =>
  prisma.user.findUnique({
    where: { id: userId },
    include: {
      ...baseUserInclude,
      clinicStaff: {
        where: { isActive: true },
        include: { clinic: true },
      },
      refreshTokens: {
        where: { revokedAt: null, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

const resolveIdentifier = (identifier) => {
  const value = identifier.trim();
  if (value.includes('@')) {
    return { email: value.toLowerCase(), mobile: undefined };
  }
  return { email: undefined, mobile: normalizeMobileNumber(value) };
};

const getPasswordUserByIdentifier = async (identifier) => {
  const lookup = resolveIdentifier(identifier);
  return prisma.user.findFirst({
    where: {
      OR: [
        lookup.email ? { email: lookup.email } : undefined,
        lookup.mobile ? { mobile: lookup.mobile } : undefined,
      ].filter(Boolean),
    },
    include: baseUserInclude,
  });
};

const blockIfPasswordLoginDisallowed = (user, res) => {
  if (!user || !user.passwordHash || user.role === 'PATIENT') {
    logger.warn('[blockIfPasswordLoginDisallowed] Blocked: No user, no passwordHash, or PATIENT role');
    return sendError(res, 'Invalid credentials', 401);
  }
  if (user.approvalStatus === 'SUSPENDED') {
    logger.warn(`[blockIfPasswordLoginDisallowed] Blocked: SUSPENDED - ${user.email}`);
    return sendError(res, user.suspendedReason || 'Account is suspended', 403);
  }
  if (user.approvalStatus === 'REJECTED') {
    logger.warn(`[blockIfPasswordLoginDisallowed] Blocked: REJECTED - ${user.email}`);
    return sendError(res, user.rejectionReason || 'Account has been rejected', 403);
  }
  // Block login for users in pending/review states (primarily clinic owners)
  if (user.approvalStatus === 'PENDING') {
    logger.warn(`[blockIfPasswordLoginDisallowed] Blocked: PENDING - ${user.email}`);
    return sendError(res, 'Your clinic application is pending verification. Please wait for admin approval.', 403);
  }
  if (user.approvalStatus === 'UNDER_REVIEW') {
    logger.warn(`[blockIfPasswordLoginDisallowed] Blocked: UNDER_REVIEW - ${user.email}`);
    return sendError(res, 'Your clinic application is currently under review. Please wait for admin approval.', 403);
  }
  if (user.approvalStatus === 'CHANGES_REQUIRED') {
    logger.warn(`[blockIfPasswordLoginDisallowed] Blocked: CHANGES_REQUIRED - ${user.email}`);
    return sendError(res, 'Your clinic application requires changes. Please check your email for details or contact support.', 403);
  }
  // Final check: only allow VERIFIED users (except SUPER_ADMIN who may have different rules)
  if (user.approvalStatus !== 'VERIFIED' && user.role !== 'SUPER_ADMIN') {
    logger.warn(`[blockIfPasswordLoginDisallowed] Blocked: Not VERIFIED and not SUPER_ADMIN - ${user.email} | Status: ${user.approvalStatus} | Role: ${user.role}`);
    return sendError(res, 'Your account must be verified before you can log in.', 403);
  }
  if (!user.isActive) {
    logger.warn(`[blockIfPasswordLoginDisallowed] Blocked: isActive=false - ${user.email}`);
    return sendError(res, 'Account is disabled', 403);
  }
  logger.info(`[blockIfPasswordLoginDisallowed] Passed all checks - ${user.email} | Role: ${user.role} | Status: ${user.approvalStatus}`);
  return null;
};

/**
 * POST /api/auth/patient/firebase-phone-login
 *
 * Patient login using Firebase Phone Auth (supports both web & mobile app).
 * Frontend (web/app) performs OTP via Firebase, sends the Firebase ID token here.
 * Backend verifies the token, extracts phone, creates/logs in patient.
 */
const patientFirebasePhoneLoginHandler = async (req, res, next) => {
  try {
    const { firebaseIdToken, name } = req.body;

    // ── 1. Verify Firebase token ───────────────────────────────────────────
    let decoded;
    try {
      decoded = await verifyFirebaseToken(firebaseIdToken);
    } catch (firebaseError) {
      if (firebaseError.status === 503) {
        return sendError(res, 'Firebase Auth is not configured. Contact support.', 503);
      }
      return sendError(res, 'Invalid or expired Firebase token. Please try again.', 401);
    }

    // ── 2. Extract phone from trusted token (never from body) ─────────────
    const rawPhone = decoded.phone_number;
    if (!rawPhone) {
      return sendError(res, 'No phone number in Firebase token. Use Phone Auth provider.', 400);
    }
    const mobile = normalizeMobileNumber(rawPhone);
    if (!mobile || !/^\+[1-9]\d{9,14}$/.test(mobile)) {
      return sendError(res, 'Invalid phone number format in Firebase token.', 400);
    }

    // ── 3. Find or create patient ─────────────────────────────────────────
    let user = await prisma.user.findUnique({
      where: { mobile },
      include: baseUserInclude,
    });

    let isNewUser = false;
    if (!user) {
      // Create new patient
      user = await prisma.user.create({
        data: {
          mobile,
          name: name || null,
          role: 'PATIENT',
          approvalStatus: 'VERIFIED',
          isPhoneVerified: true,
          firebaseUid: decoded.uid,
          authProvider: 'FIREBASE_PHONE',
          patientProfile: { create: {} },
        },
        include: baseUserInclude,
      });
      isNewUser = true;
    } else if (user.role !== 'PATIENT') {
      return sendError(res, 'This phone belongs to a staff account. Use staff login.', 403);
    } else {
      // Existing patient - update login time and name if needed
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          isPhoneVerified: true,
          lastLoginAt: new Date(),
          firebaseUid: decoded.uid,
          authProvider: 'FIREBASE_PHONE',
          ...(name && !user.name ? { name } : {}),
        },
        include: baseUserInclude,
      });
    }

    // ── 4. Issue JWT tokens ───────────────────────────────────────────────
    const tokens = await issueAuthTokens(res, user, req);
    
    await createAuditLog({
      userId: user.id,
      action: isNewUser ? 'PATIENT_REGISTERED_FIREBASE' : 'PATIENT_LOGIN_FIREBASE',
      entityType: 'User',
      entityId: user.id,
      ipAddress: req.ip,
    });

    return sendSuccess(
      res,
      {
        accessToken: tokens.accessToken,
        // Include refreshToken in body so mobile clients (React Native / Expo)
        // can store it in SecureStore for silent token rotation.
        // Web clients ignore this and rely on the httpOnly cookie set above.
        refreshToken: tokens.refreshToken,
        user: { ...toAuthUser(user), isNewUser },
      },
      isNewUser ? 'Patient account created successfully' : 'Login successful'
    );
  } catch (error) {
    console.error('[patientFirebasePhoneLogin] 500:', error?.message, '| code:', error?.code, '| meta:', JSON.stringify(error?.meta));
    next(error);
  }
};

/**
 * POST /api/auth/clinic-owner/verify-firebase-phone
 *
 * Verifies the clinic owner's phone number using Firebase Phone Auth.
 * The frontend performs OTP via Firebase, then sends the Firebase ID token here.
 * Backend verifies the token, extracts the phone number (never from request body),
 * and creates a short-lived server-side verification record for use at registration.
 *
 * Replaces the old custom OTP send + verify flow for clinic owners.
 */
const clinicOwnerVerifyFirebasePhoneHandler = async (req, res, next) => {
  try {
    const { firebaseIdToken } = req.body;

    // ── 1. Verify Firebase token ───────────────────────────────────────────
    let decoded;
    try {
      decoded = await verifyFirebaseToken(firebaseIdToken);
    } catch (firebaseError) {
      if (firebaseError.status === 503) {
        return sendError(res, 'Firebase Auth is not configured on this server. Contact support.', 503);
      }
      return sendError(res, 'Invalid or expired Firebase token. Please try again.', 401);
    }

    // ── 2. Extract phone from trusted token (never from body) ─────────────
    const rawPhone = decoded.phone_number;
    if (!rawPhone) {
      return sendError(res, 'No phone number found in Firebase token. Use Phone Auth provider.', 400);
    }
    const mobile = normalizeMobileNumber(rawPhone);
    if (!mobile || !/^\+[1-9]\d{9,14}$/.test(mobile)) {
      return sendError(res, 'Invalid phone number format in Firebase token.', 400);
    }

    // ── 3. Ensure phone is not already registered ─────────────────────────
    const existing = await prisma.user.findUnique({
      where: { mobile },
      select: { 
        id: true, 
        approvalStatus: true,
        clinicOnboardingData: true 
      },
    });
    
    if (existing) {
      // Check if user has a pending application
      if (existing.approvalStatus === 'PENDING') {
        return sendError(res, 'An application with this phone number is already pending review. Please wait for admin approval or contact support.', 409);
      }
      
      // Check if user is already verified/approved
      if (existing.approvalStatus === 'VERIFIED' || existing.approvalStatus === 'APPROVED') {
        return sendError(res, 'A user with this phone number already exists and is active.', 409);
      }
      
      // For other statuses (REJECTED, SUSPENDED, etc.)
      return sendError(res, 'A user with this phone number already exists', 409);
    }

    // ── 4. Invalidate any previous pending records, create new one ────────
    const EXPIRY_MINUTES = 10; // ✅ FIX: Changed from 120 to 10 minutes for security
    await firebasePhoneVerificationRepo.invalidateOutstanding(mobile, 'CLINIC_OWNER_REGISTER');
    await firebasePhoneVerificationRepo.create({
      mobile,
      firebaseUid: decoded.uid,
      purpose: 'CLINIC_OWNER_REGISTER',
      expiresAt: new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000),
    });

    return sendSuccess(
      res,
      { ownerMobileVerified: true, mobile },
      'Phone number verified successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/clinic-owner/save-step1
 * 
 * Saves Step 1 clinic onboarding data to database as draft.
 * Called when user clicks "Next" button on Step 1.
 */
const saveClinicOnboardingStep1Handler = async (req, res, next) => {
  try {
    const clinicOnboardingService = require('../services/clinicOnboarding.service');
    
    // Get authenticated user ID
    if (!req.user || !req.user.id) {
      return sendError(res, 'Authentication required. Please login again.', 401);
    }

    const authenticatedUserId = req.user.id;
    
    logger.info(`[Onboarding Step 1] User ${authenticatedUserId} saving clinic information`);

    // Validate user ownership (no cross-user data manipulation)
    await clinicOnboardingService.validateUserOwnership(authenticatedUserId, req.body.userId);

    const {
      // Clinic Details
      clinicName,
      clinicType,
      clinicTypeOther,
      displayName,
      
      // Owner Details (mobile should already be verified)
      ownerName,
      ownerEmail,
      ownerMobile,
      
      // Primary Contact
      primaryContactPhone,
      
      // Location
      latitude,
      longitude,
      
      // Address Details
      addressLine1,
      addressLine2,
      locality,
      landmark,
      city,
      state,
      pincode,
      country,
    } = req.body;

    // Prepare Step 1 data
    const clinicInformationData = {
      clinicName: clinicName || null,
      clinicType: clinicType || null,
      clinicTypeOther: clinicTypeOther || null,
      displayName: displayName || null,
      ownerName: ownerName || null,
      ownerEmail: ownerEmail || null,
      ownerMobile: ownerMobile || null,
      primaryContactPhone: primaryContactPhone || null,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      addressLine1: addressLine1 || null,
      addressLine2: addressLine2 || null,
      locality: locality || null,
      landmark: landmark || null,
      city: city || null,
      state: state || null,
      pincode: pincode || null,
      country: country || 'India',
    };

    // Save Step 1 using service (ensures ownership and consistency)
    const registrationState = await clinicOnboardingService.saveStep1(
      authenticatedUserId,
      clinicInformationData
    );

    logger.info(`[Onboarding Step 1] Saved for user ${authenticatedUserId}`);

    return sendSuccess(
      res,
      {
        userId: registrationState.userId,
        step: 1,
        completed: registrationState.steps.step1.completed,
        currentStep: registrationState.currentStep,
        registrationState,
      },
      'Clinic information saved successfully'
    );
  } catch (error) {
    logger.error('[Onboarding Step 1] Save error:', error);
    
    // Return specific error messages
    if (error.message.includes('session has changed') || error.message.includes('User not found')) {
      return sendError(res, error.message, 403);
    }
    
    next(error);
  }
};

/**
 * Step 2: Save Services & Operations data
 * Called when user clicks "Next" button on Step 2.
 */
const saveServicesOperationsHandler = async (req, res, next) => {
  try {
    const clinicOnboardingService = require('../services/clinicOnboarding.service');
    
    // Get authenticated user ID
    if (!req.user || !req.user.id) {
      return sendError(res, 'Authentication required. Please login again.', 401);
    }

    const authenticatedUserId = req.user.id;
    
    logger.info(`[Onboarding Step 2] User ${authenticatedUserId} saving services & operations`);

    // Validate user ownership
    await clinicOnboardingService.validateUserOwnership(authenticatedUserId, req.body.userId);

    const {
      specialties,
      specialtyOther,
      consultationTypes,
      openingTime,
      closingTime,
      weeklyOffDays,
      appointmentMode,
    } = req.body;

    // Prepare Step 2 data
    const servicesOperationsData = {
      specialties: specialties || [],
      specialtyOther: specialtyOther || null,
      consultationTypes: consultationTypes || [],
      openingTime: openingTime || null,
      closingTime: closingTime || null,
      weeklyOffDays: weeklyOffDays || [],
      appointmentMode: appointmentMode || null,
    };

    // Save Step 2 using service (validates Step 1 completed)
    const registrationState = await clinicOnboardingService.saveStep2(
      authenticatedUserId,
      servicesOperationsData
    );

    logger.info(`[Onboarding Step 2] Saved for user ${authenticatedUserId}`);

    return sendSuccess(
      res,
      {
        userId: registrationState.userId,
        step: 2,
        completed: registrationState.steps.step2.completed,
        currentStep: registrationState.currentStep,
        registrationState,
      },
      'Services & operations saved successfully'
    );
  } catch (error) {
    logger.error('[Onboarding Step 2] Save error:', error);
    
    if (error.message.includes('session has changed') || error.message.includes('Step 1')) {
      return sendError(res, error.message, 400);
    }
    
    next(error);
  }
};

/**
 * Step 3: Save Clinic Documents data
 * Called when user clicks "Next" button on Step 3.
 * Handles file uploads and stores document URLs + additional info.
 */
const saveClinicDocumentsHandler = async (req, res, next) => {
  try {
    const clinicOnboardingService = require('../services/clinicOnboarding.service');
    
    // Get authenticated user ID from JWT
    if (!req.user || !req.user.id) {
      return sendError(res, 'Authentication required. Please login again.', 401);
    }

    const authenticatedUserId = req.user.id;
    
    logger.info(`[Onboarding Step 3] User ${authenticatedUserId} saving clinic documents`);

    // Validate user ownership (prevents cross-user data manipulation)
    await clinicOnboardingService.validateUserOwnership(authenticatedUserId, req.body.userId);

    const {
      clinicRegistrationNumber,
      gstNumber,
    } = req.body;

    // Files are uploaded via multer middleware
    const files = req.files || {};

    // Extract file URLs from uploaded files
    const getFileUrl = (file) => {
      if (!file) return null;
      
      // Cloudinary provides secure_url or url (starts with http)
      if (file.path && file.path.startsWith('http')) {
        return file.path;
      }
      
      // For local storage (multer), extract relative path
      if (file.path) {
        const filePath = file.path;
        const normalizedPath = filePath.replace(/\\/g, '/');
        const uploadsMatch = normalizedPath.match(/uploads\/.*$/);
        if (uploadsMatch) {
          return uploadsMatch[0];
        }
        logger.warn(`[Onboarding] Could not extract relative path from: ${filePath}`);
        return null;
      }
      
      return null;
    };

    // Build clinic photos object with individual photos
    const clinicPhotos = {
      logo: getFileUrl(files.clinicLogo?.[0]),
      exterior: getFileUrl(files.clinicExterior?.[0]),
      reception: getFileUrl(files.clinicReception?.[0]),
      consultation: getFileUrl(files.clinicConsultation?.[0]),
    };

    // DEBUG: Log what paths we extracted
    logger.info(`[Onboarding] Extracted file paths:`, {
      logo: clinicPhotos.logo,
      exterior: clinicPhotos.exterior,
      documents: {
        registration: getFileUrl(files.clinicRegistrationCertificate?.[0]),
        license: getFileUrl(files.medicalLicense?.[0]),
        idProof: getFileUrl(files.ownerIdProof?.[0]),
      }
    });

    // Prepare Clinic Documents data object
    const clinicDocumentsData = {
      clinicRegistrationCertificate: getFileUrl(files.clinicRegistrationCertificate?.[0]),
      medicalLicense: getFileUrl(files.medicalLicense?.[0]),
      ownerIdProof: getFileUrl(files.ownerIdProof?.[0]),
      gstCertificate: getFileUrl(files.gstCertificate?.[0]),
      clinicPhotos: clinicPhotos,
      clinicRegistrationNumber: clinicRegistrationNumber || null,
      gstNumber: gstNumber || null,
    };

    // Save Step 3 using service (validates Steps 1 and 2 completed)
    const registrationState = await clinicOnboardingService.saveStep3(
      authenticatedUserId,
      clinicDocumentsData
    );

    logger.info(`[Onboarding Step 3] Saved for user ${authenticatedUserId}`);

    return sendSuccess(
      res,
      {
        userId: registrationState.userId,
        step: 3,
        completed: registrationState.steps.step3.completed,
        currentStep: registrationState.currentStep,
        registrationState,
      },
      'Clinic documents saved successfully'
    );
  } catch (error) {
    logger.error('[Onboarding Step 3] Save error:', error);
    
    // Return specific error messages
    if (error.message.includes('session has changed') || error.message.includes('Step')) {
      return sendError(res, error.message, 400);
    }
    
    next(error);
  }
};

/**
 * Step 4: Submit Final Application
 * Called when user accepts terms and clicks "Submit Application" on Step 4.
 * Updates user status to PENDING and marks onboarding as complete.
 */
const submitClinicApplicationHandler = async (req, res, next) => {
  try {
    const {
      termsAccepted,
      confirmAuthorized,
      confirmAccurate,
      confirmCompliance,
      termsAcceptedAt,
      agreementVersion,
    } = req.body;

    // Validate all required acceptances
    if (!termsAccepted) {
      return sendError(res, 'You must accept the terms and conditions', 400);
    }
    if (!confirmAuthorized) {
      return sendError(res, 'You must confirm that you are authorized to register this clinic', 400);
    }
    if (!confirmAccurate) {
      return sendError(res, 'You must confirm that the information submitted is accurate', 400);
    }
    if (!confirmCompliance) {
      return sendError(res, 'You must agree to comply with applicable requirements', 400);
    }

    // ✅ FIX: Get authenticated user from req.user (set by authenticateUser middleware)
    if (!req.user) {
      return sendError(res, 'Authentication required. Please login again.', 401);
    }

    logger.info(`[SubmitApplication] User ${req.user.id} (${req.user.mobile}) submitting application`);

    // Fetch fresh user data with onboarding data
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        mobile: true,
        name: true,
        role: true,
        approvalStatus: true,
        clinicOnboardingData: true,
      },
    });

    if (!user) {
      logger.error(`[SubmitApplication] User ${req.user.id} not found in database`);
      return sendError(res, 'User not found', 404);
    }

    // Get existing onboarding data
    const onboardingData = user.clinicOnboardingData || {};
    
    logger.info(`[SubmitApplication] User ${user.id} onboarding data:`, {
      hasStep1: !!onboardingData.clinicInformation,
      hasStep2: !!onboardingData.servicesOperations,
      hasStep3: !!onboardingData.clinicDocuments,
      lastStep: onboardingData.lastUpdatedStep,
    });

    // Check if user has completed previous steps
    if (!onboardingData.clinicInformation) {
      logger.warn(`[SubmitApplication] User ${user.id} missing Step 1 data`);
      return sendError(res, 'Please complete Step 1: Clinic Information first', 400);
    }
    if (!onboardingData.servicesOperations) {
      logger.warn(`[SubmitApplication] User ${user.id} missing Step 2 data`);
      return sendError(res, 'Please complete Step 2: Services & Operations first', 400);
    }
    if (!onboardingData.clinicDocuments) {
      logger.warn(`[SubmitApplication] User ${user.id} missing Step 3 data`);
      return sendError(res, 'Please complete Step 3: Clinic Documents first', 400);
    }

    // Prepare Partner Agreement data with all acceptance fields
    const partnerAgreementData = {
      termsAccepted: true,
      confirmAuthorized: true,
      confirmAccurate: true,
      confirmCompliance: true,
      termsAcceptedAt: termsAcceptedAt || new Date().toISOString(),
      agreementVersion: agreementVersion || 'v1.0-draft',
      submittedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };

    // Extract clinic data from onboarding steps FIRST (we need this for user update)
    const step1 = onboardingData.clinicInformation || {};
    const step2 = onboardingData.servicesOperations || {};
    const step3 = onboardingData.clinicDocuments || {};

    // Update user with final submission AND email/mobile from Step 1
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        // Only update email if user doesn't have one (don't overwrite existing email)
        email: user.email || step1.ownerEmail,
        // Only update mobile if user doesn't have one (don't overwrite existing mobile)
        mobile: user.mobile || step1.ownerMobile,
        // Update name if provided in Step 1 and user doesn't have one
        name: user.name || step1.ownerName || partnerAgreementData.ownerName,
        approvalStatus: 'PENDING',
        clinicOnboardingData: {
          ...onboardingData,
          partnerAgreement: partnerAgreementData,
          lastUpdatedStep: 'partnerAgreement',
          lastUpdatedAt: new Date(),
          onboardingComplete: true,
          submittedAt: new Date(),
        },
      },
      select: { 
        id: true, 
        mobile: true, 
        name: true,
        email: true,
        approvalStatus: true,
        clinicOnboardingData: true 
      },
    });

    // Check if clinic already exists for this user
    let clinic = await prisma.clinic.findFirst({
      where: {
        ownerId: updatedUser.id,
        OR: [
          { approvalStatus: 'PENDING' },
          { approvalStatus: 'CHANGES_REQUIRED' },
        ],
      },
    });

    const clinicData = {
      name: step1.clinicName,
      ownerId: updatedUser.id,
      phone: step1.primaryContactPhone || step1.ownerMobile || updatedUser.mobile,
      // ✅ REMOVED: email field doesn't exist on Clinic model
      address: step1.addressLine1 || step1.address,
      city: step1.city,
      district: step1.district,
      state: step1.state,
      pincode: step1.pincode,
      landmark: step1.landmark,
      latitude: step1.latitude ? parseFloat(step1.latitude) : null,
      longitude: step1.longitude ? parseFloat(step1.longitude) : null,
      googleMapsLocation: step1.googleMapsLocation,
      clinicType: step1.clinicType,
      clinicRegistrationNumber: step1.clinicRegistrationNumber,
      approvalStatus: 'PENDING',
      submittedAt: new Date(),
      lastResubmittedAt: clinic ? new Date() : undefined, // Track resubmissions
      // Step 2 data
      specialties: step2.services || [],
      openingHours: step2.operatingHours ? JSON.stringify(step2.operatingHours) : null,
      consultationModes: step2.appointmentModes || step2.consultationTypes || [],
      facilities: step2.facilities || [],
      languagesSpoken: step2.languages || [],
      // Step 3 data
      licenseDocumentUrl: step3.clinicLicense || step3.clinicRegistrationCertificate,
      medicalEstablishmentCertificateUrl: step3.medicalCertificate || step3.medicalEstablishmentLicense,
      gstCertificateUrl: step3.gstCertificate,
      panCardUrl: step3.panCard,
      gstNumber: step3.gstNumber,
      panNumber: step3.panNumber,
      isActive: false,  // Inactive until approved
    };

    if (clinic) {
      // Update existing clinic with new data (resubmission)
      clinic = await prisma.clinic.update({
        where: { id: clinic.id },
        data: clinicData,
      });
      logger.info(`[Onboarding] Clinic record updated (resubmission): ${clinic.id} for user ${updatedUser.id}`);
    } else {
      // Create new clinic record
      clinic = await prisma.clinic.create({
        data: clinicData,
      });
      logger.info(`[Onboarding] Clinic record created: ${clinic.id} for user ${updatedUser.id}`);
    }

    logger.info(`[Onboarding] Application submitted for user ${updatedUser.id}, status: PENDING, clinicId: ${clinic.id}`);

    // TODO: Send confirmation email to clinic owner
    // TODO: Send notification to admin for review

    return sendSuccess(
      res,
      {
        userId: updatedUser.id,
        clinicId: clinic.id,
        step: 'partnerAgreement',
        submitted: true,
        approvalStatus: updatedUser.approvalStatus,
        data: updatedUser.clinicOnboardingData,
      },
      'Application submitted successfully. Awaiting admin approval.'
    );
  } catch (error) {
    logger.error('[Onboarding] Submit Application error:', error);
    next(error);
  }
};

/**
 * GET /api/auth/clinic-owner/get-onboarding-data
 * 
 * Fetches the clinic onboarding data for the current user.
 * Used to auto-fill fields in later steps (like owner name in Step 4).
 */
const getClinicOnboardingDataHandler = async (req, res, next) => {
  try {
    // Get the most recent user with clinic onboarding data
    // In production, this should come from authenticated session
    const users = await prisma.user.findMany({
      where: {
        clinicOnboardingData: { not: prisma.DbNull },
      },
      orderBy: { updatedAt: 'desc' },
      take: 1,
      select: {
        id: true,
        clinicOnboardingData: true,
      },
    });

    if (!users || users.length === 0) {
      return sendError(res, 'No onboarding data found', 404);
    }

    return sendSuccess(
      res,
      {
        clinicOnboardingData: users[0].clinicOnboardingData,
      },
      'Onboarding data retrieved successfully'
    );
  } catch (error) {
    logger.error('[Onboarding] Get data error:', error);
    next(error);
  }
};

const clinicOwnerSendEmailOtpHandler = async (req, res, next) => {
  try {
    const { email, ownerName } = req.body;
    const normalizedEmail = email.toLowerCase();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { 
        id: true, 
        approvalStatus: true,
        clinicOnboardingData: true 
      },
    });

    if (existing) {
      // Check if user has a pending application
      if (existing.approvalStatus === 'PENDING') {
        return sendError(res, 'An application with this email is already pending review. Please wait for admin approval or contact support.', 409);
      }
      
      // Check if user is already verified/approved
      if (existing.approvalStatus === 'VERIFIED' || existing.approvalStatus === 'APPROVED') {
        return sendError(res, 'A user with this email already exists and is active.', 409);
      }
      
      // For other statuses (REJECTED, SUSPENDED, etc.)
      return sendError(res, 'A user with this email already exists', 409);
    }

    const result = await sendEmailVerification(normalizedEmail, ownerName);

    // In development, return the OTP in the response for easy testing
    const responseData = process.env.NODE_ENV !== 'production' && result.otp
      ? { devOtp: result.otp }
      : {};

    return sendSuccess(res, responseData, 'Verification code sent successfully');
  } catch (error) {
    next(error);
  }
};

const clinicOwnerVerifyEmailOtpHandler = async (req, res, next) => {
  try {
    // Normalize email to lowercase — verification record was stored lowercase
    const rawEmail = req.body.email || req.query.email;
    const email = rawEmail ? rawEmail.toLowerCase() : undefined;
    const otp = req.body.otp || req.query.token;

    if (!email || !otp) {
      return sendError(res, 'Email and OTP/token are required', 400);
    }

    // ✅ FIX: Check if email is already registered BEFORE verifying OTP
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { 
        id: true, 
        approvalStatus: true,
        clinicOnboardingData: true 
      },
    });
    
    if (existing) {
      // Check if user has a pending application
      if (existing.approvalStatus === 'PENDING') {
        return sendError(res, 'An application with this email is already pending review. Please wait for admin approval or contact support.', 409);
      }
      
      // Check if user is already verified/approved
      if (existing.approvalStatus === 'VERIFIED' || existing.approvalStatus === 'APPROVED') {
        return sendError(res, 'A user with this email already exists and is active. Please use login instead.', 409);
      }
      
      // For other statuses (REJECTED, SUSPENDED, etc.)
      return sendError(res, 'A user with this email already exists', 409);
    }

    const verified = await verifyEmailVerificationToken(email, otp);

    return sendSuccess(
      res,
      {
        email: verified.email,
        ownerEmailVerified: true,
        emailVerifiedAt: verified.verifiedAt || new Date(),
      },
      'Email verified successfully'
    );
  } catch (error) {
    next(error);
  }
};



const registerClinicOwnerHandler = async (req, res, next) => {
  try {
    const {
      ownerName,
      phone,
      email,
      password,
      clinicName,
      clinicType,
      clinicTypeOther,
      clinicDescription,
      clinicAddress,
      landmark,
      city,
      state,
      district,
      pincode,
      googleMapsLocation,
      latitude,
      longitude,
      clinicPhone,
      emergencyContactNumber,
      alternateEmail,
      consultationModes,
      weeklySchedule,
      averageConsultationTimeMinutes,
      appointmentSlotMinutes,
      dailyPatientCapacity,
      gstNumber,
      panNumber,
      openingHours,
      specialties,
      specialtyOther,
      doctorCount,
      clinicLogoUrl,
      clinicCoverImageUrl,
      facilities,
      languagesSpoken,
      paymentMethods,
      insuranceSupported,
      clinicRegistrationNumber,
      licenseDocumentUrl,
      medicalEstablishmentCertificateUrl,
      gstCertificateUrl,
      panCardUrl,
      additionalDocuments,
      ownerMobileVerified,
      ownerEmailVerified,
    } = req.body;

    const existing = await prisma.user.findFirst({
      where: { OR: [{ mobile: phone }, { email: email.toLowerCase() }] },
    });
    if (existing) {
      return sendError(res, 'User with this phone or email already exists', 409);
    }

    const duplicateClinicSignals = await prisma.clinic.findFirst({
      where: {
        OR: [
          clinicRegistrationNumber ? { clinicRegistrationNumber } : undefined,
          gstNumber ? { gstNumber } : undefined,
          panNumber ? { panNumber } : undefined,
          clinicPhone ? { phone: clinicPhone } : undefined,
        ].filter(Boolean),
      },
      select: {
        id: true,
        name: true,
        clinicRegistrationNumber: true,
        gstNumber: true,
        panNumber: true,
        phone: true,
      },
    });

    if (duplicateClinicSignals) {
      return sendError(
        res,
        `A clinic application already exists with matching registration or contact details (${duplicateClinicSignals.name}).`,
        409
      );
    }

    const verifiedPhoneRecord = await firebasePhoneVerificationRepo.findLatestValid(phone, 'CLINIC_OWNER_REGISTER');

    if (!ownerMobileVerified || !verifiedPhoneRecord) {
      return sendError(res, 'Owner mobile verification via Firebase is required before submitting the clinic application', 400);
    }

    const verifiedEmailRecord = await prisma.emailVerification.findFirst({
      where: {
        email: email.toLowerCase(),
        purpose: 'CLINIC_OWNER_REGISTER',
        verifiedAt: { not: null },
        isUsed: true,
      },
      orderBy: { verifiedAt: 'desc' },
    });

    if (!ownerEmailVerified || !verifiedEmailRecord) {
      return sendError(res, 'Owner email verification is required before submitting the clinic application', 400);
    }

    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: ownerName,
          mobile: phone,
          email: email.toLowerCase(),
          role: 'CLINIC_OWNER',
          approvalStatus: 'PENDING',
          passwordHash: await hashPassword(password),
          isPhoneVerified: true,
          isEmailVerified: true,
          firebaseUid: verifiedPhoneRecord.firebaseUid,
          authProvider: 'FIREBASE_PHONE',
        },
      });

      const clinic = await tx.clinic.create({
        data: {
          ownerId: user.id,
          name: clinicName,
          clinicType: clinicType || null,
          address: clinicAddress,
          landmark: landmark || null,
          city,
          state,
          pincode,
          phone: clinicPhone,
          googleMapsLocation: googleMapsLocation || null,
          latitude: latitude ?? null,
          longitude: longitude ?? null,
          emergencyContactNumber: emergencyContactNumber || null,
          alternateEmail: alternateEmail || null,
          consultationModes: consultationModes || [],
          weeklySchedule: weeklySchedule || [],
          avgConsultationMinutes: averageConsultationTimeMinutes ?? null,
          appointmentSlotMinutes: appointmentSlotMinutes ?? null,
          dailyPatientCapacity: dailyPatientCapacity ?? null,
          gstNumber: gstNumber || null,
          panNumber: panNumber || null,
          openingHours,
          description: clinicDescription || null,
          specialties,
          doctorCount: doctorCount ?? null,
          clinicLogoUrl: clinicLogoUrl || null,
          clinicCoverImageUrl: clinicCoverImageUrl || null,
          facilities: facilities || [],
          languagesSpoken: languagesSpoken || [],
          paymentMethods: paymentMethods || [],
          insuranceSupported: insuranceSupported || [],
          clinicRegistrationNumber,
          clinicLicenseDocument: licenseDocumentUrl,
          licenseDocumentUrl,
          medicalEstablishmentCertificateUrl: medicalEstablishmentCertificateUrl || null,
          gstCertificateUrl: gstCertificateUrl || null,
          panCardUrl: panCardUrl || null,
          additionalDocuments: additionalDocuments || [],
          ownerMobileVerified: true,
          ownerEmailVerified: true,
          mobileOtpVerifiedAt: verifiedPhoneRecord.verifiedAt || new Date(),
          emailVerifiedAt: verifiedEmailRecord.verifiedAt || new Date(),
          approvalStatus: 'PENDING',
          isVerified: false,
          submittedAt: new Date(),
        },
      });

      if (clinicTypeOther || specialtyOther) {
        await tx.$executeRaw`
          UPDATE clinics
          SET
            "clinicTypeOther" = ${clinicTypeOther || null},
            "specialtyOther" = ${specialtyOther || null}
          WHERE id = ${clinic.id}
        `;
      }

      if (district) {
        await tx.$executeRaw`
          UPDATE clinics
          SET "district" = ${district}
          WHERE id = ${clinic.id}
        `;
      }

      await tx.clinicStaff.create({
        data: {
          clinicId: clinic.id,
          userId: user.id,
          role: 'OWNER',
        },
      });

      // Create clinic owner profile
      const ownerProfile = await tx.clinicOwnerProfile.create({
        data: {
          userId: user.id,
          primaryClinicId: clinic.id,
          businessName: clinicName,
          gstNumber: gstNumber || null,
          panNumber: panNumber || null,
          profileCompleted: false,
        },
      });

      return { user, clinic, ownerProfile };
    });

    await createAuditLog({
      userId: created.user.id,
      action: 'CLINIC_OWNER_REGISTERED',
      entityType: 'Clinic',
      entityId: created.clinic.id,
      ipAddress: req.ip,
    });

    // Mark the Firebase phone verification record as consumed
    await firebasePhoneVerificationRepo.markUsed(verifiedPhoneRecord.id);

    return sendSuccess(
      res,
      {
        user: {
          id: created.user.id,
          role: created.user.role,
          status: created.user.approvalStatus,
        },
        clinic: created.clinic,
        nextSteps: [
          'Your clinic application has been submitted for review.',
          'PulseMate admin will verify the clinic details and documents.',
          'You can sign in after approval is completed.',
        ],
      },
      'Registration submitted. Awaiting super admin verification.',
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/doctor/verify-firebase-phone
 *
 * Verifies the doctor's phone number using Firebase Phone Auth.
 * Same pattern as clinic owner — frontend handles OTP, sends ID token here.
 * Backend verifies, extracts phone, creates a short-lived verification record.
 */
const doctorVerifyFirebasePhoneHandler = async (req, res, next) => {
  try {
    const { firebaseIdToken } = req.body;

    // ── 1. Verify Firebase token ───────────────────────────────────────────
    let decoded;
    try {
      decoded = await verifyFirebaseToken(firebaseIdToken);
    } catch (firebaseError) {
      if (firebaseError.status === 503) {
        return sendError(res, 'Firebase Auth is not configured on this server. Contact support.', 503);
      }
      return sendError(res, 'Invalid or expired Firebase token. Please try again.', 401);
    }

    // ── 2. Extract phone from trusted token (never from body) ─────────────
    const rawPhone = decoded.phone_number;
    if (!rawPhone) {
      return sendError(res, 'No phone number found in Firebase token. Use Phone Auth provider.', 400);
    }
    const mobile = normalizeMobileNumber(rawPhone);
    if (!mobile || !/^\+[1-9]\d{9,14}$/.test(mobile)) {
      return sendError(res, 'Invalid phone number format in Firebase token.', 400);
    }

    // ── 3. Ensure phone is not already registered ─────────────────────────
    const existing = await prisma.user.findUnique({
      where: { mobile },
      select: { id: true },
    });
    if (existing) {
      return sendError(res, 'A user with this phone number already exists', 409);
    }

    // ── 4. Invalidate any previous pending records, create new one ────────
    const EXPIRY_MINUTES = 10; // ✅ FIX: Changed from 15 to 10 minutes for consistency
    await firebasePhoneVerificationRepo.invalidateOutstanding(mobile, 'DOCTOR_REGISTER');
    await firebasePhoneVerificationRepo.create({
      mobile,
      firebaseUid: decoded.uid,
      purpose: 'DOCTOR_REGISTER',
      expiresAt: new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000),
    });

    return sendSuccess(
      res,
      { mobileVerified: true, mobile },
      'Phone number verified successfully'
    );
  } catch (error) {
    next(error);
  }
};

const registerDoctorHandler = async (req, res, next) => {
  try {
    const {
      name,
      phone,
      email,
      password,
      qualification,
      specialization,
      experience,
      medicalRegistrationNumber,
      documentUrl,
      consultationFee,
      onlineConsultationEnabled,
    } = req.body;

    const existing = await prisma.user.findFirst({
      where: { OR: [{ mobile: phone }, { email: email.toLowerCase() }] },
    });
    if (existing) {
      return sendError(res, 'User with this phone or email already exists', 409);
    }

    // ── Require Firebase phone verification ───────────────────────────────
    const verifiedPhoneRecord = await firebasePhoneVerificationRepo.findLatestValid(phone, 'DOCTOR_REGISTER');
    if (!verifiedPhoneRecord) {
      return sendError(res, 'Mobile number verification via Firebase is required before registering', 400);
    }

    const doctor = await prisma.user.create({
      data: {
        name,
        mobile: phone,
        email: email.toLowerCase(),
        role: 'DOCTOR',
        approvalStatus: 'PENDING',
        passwordHash: await hashPassword(password),
        isPhoneVerified: true,
        firebaseUid: verifiedPhoneRecord.firebaseUid,
        authProvider: 'FIREBASE_PHONE',
        doctorProfile: {
          create: {
            approvalStatus: 'PENDING',
            qualification,
            specialization,
            experienceYears: experience,
            medicalRegistrationNumber,
            documentUrl,
            certificates: documentUrl ? [documentUrl] : [],
            consultationFee,
            onlineAvailable: onlineConsultationEnabled,
            offlineAvailable: true,
          },
        },
      },
      include: baseUserInclude,
    });

    await createAuditLog({
      userId: doctor.id,
      action: 'DOCTOR_REGISTERED',
      entityType: 'User',
      entityId: doctor.id,
      ipAddress: req.ip,
    });

    // Mark the Firebase phone verification record as consumed
    await firebasePhoneVerificationRepo.markUsed(verifiedPhoneRecord.id);

    return sendSuccess(
      res,
      {
        user: toAuthUser(doctor),
      },
      'Doctor profile submitted. Awaiting verification.',
      201
    );
  } catch (error) {
    next(error);
  }
};

const clinicOwnerUploadDocumentHandler = async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 'Please choose a file to upload', 400);
    }

    return sendSuccess(
      res,
      {
        url: buildFileUrl(req, req.file),
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      },
      'Document uploaded successfully',
      201
    );
  } catch (error) {
    next(error);
  }
};

const loginHandler = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    logger.info(`[Login] Attempt for identifier: ${identifier}`);
    
    const user = await getPasswordUserByIdentifier(identifier);
    if (!user) {
      logger.warn(`[Login] User not found for identifier: ${identifier}`);
      return sendError(res, 'Invalid credentials', 401);
    }
    
    logger.info(`[Login] User found: ${user.email} | Role: ${user.role} | Status: ${user.approvalStatus} | Active: ${user.isActive}`);
    
    const blocked = blockIfPasswordLoginDisallowed(user, res);
    if (blocked) {
      logger.warn(`[Login] User blocked: ${user.email}`);
      return blocked;
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      logger.warn(`[Login] Invalid password for user: ${user.email}`);
      return sendError(res, 'Invalid credentials', 401);
    }
    
    logger.info(`[Login] Password verified for user: ${user.email}`);

    logger.info(`[Login] Password verified for user: ${user.email}`);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
      include: baseUserInclude,
    });

    const tokens = await issueAuthTokens(res, updatedUser, req);
    await createAuditLog({
      userId: updatedUser.id,
      action: `LOGIN_${updatedUser.role}`,
      entityType: 'User',
      entityId: updatedUser.id,
      ipAddress: req.ip,
    });

    logger.info(`[Login] Success for user: ${updatedUser.email} | Role: ${updatedUser.role}`);
    
    return sendSuccess(res, {
      accessToken: tokens.accessToken,
      user: toAuthUser(updatedUser),
    }, 'Login successful');
  } catch (error) {
    logger.error(`[Login] Error: ${error.message}`);
    next(error);
  }
};

const forgotPasswordHandler = async (req, res, next) => {
  try {
    const safeMessage = 'If an account exists with this email, password reset instructions have been sent.';
    const user = await prisma.user.findUnique({
      where: { email: req.body.email.toLowerCase() },
      include: baseUserInclude,
    });

    if (!user) {
      return sendSuccess(res, {}, safeMessage);
    }

    if (
      user.role === 'PATIENT' ||
      user.approvalStatus === 'SUSPENDED' ||
      user.approvalStatus === 'REJECTED' ||
      (user.role === 'SUPER_ADMIN' && user.approvalStatus !== 'VERIFIED')
    ) {
      return sendSuccess(res, {}, safeMessage);
    }

    if (!['CLINIC_OWNER', 'DOCTOR', 'RECEPTIONIST', 'SUPER_ADMIN'].includes(user.role)) {
      return sendSuccess(res, {}, safeMessage);
    }

    const { rawToken, purpose } = await createPasswordResetToken(user);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${rawToken}`;

    if (user.role === 'SUPER_ADMIN') {
      await sendSuperAdminResetEmail(user.email, resetLink, user.name);
      await createAuditLog({
        userId: user.id,
        action: 'SUPER_ADMIN_PASSWORD_RESET_REQUESTED',
        entityType: 'User',
        entityId: user.id,
        metadata: { purpose },
        ipAddress: req.ip,
      });
    } else {
      await sendPasswordResetEmail(user.email, resetLink, user.name);
      await createAuditLog({
        userId: user.id,
        action: 'PASSWORD_RESET_REQUESTED',
        entityType: 'User',
        entityId: user.id,
        metadata: { purpose },
        ipAddress: req.ip,
      });
    }

    return sendSuccess(
      res,
      process.env.NODE_ENV !== 'production' ? { resetToken: rawToken } : {},
      safeMessage
    );
  } catch (error) {
    next(error);
  }
};

const resetPasswordHandler = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    let stored;
    try {
      stored = await validatePasswordResetToken(token);
    } catch (_) {
      return sendError(res, 'Reset link is invalid or expired.', 400);
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: stored.userId },
      include: baseUserInclude,
    });

    if (
      !existingUser ||
      existingUser.role === 'PATIENT' ||
      existingUser.approvalStatus === 'SUSPENDED' ||
      existingUser.approvalStatus === 'REJECTED'
    ) {
      return sendError(res, 'Reset link is invalid or expired.', 400);
    }

    const user = await prisma.user.update({
      where: { id: existingUser.id },
      data: { passwordHash: await hashPassword(newPassword) },
      include: baseUserInclude,
    });

    await markTokenUsed(stored.id);
    await revokeAllRefreshTokens(user.id);
    clearRefreshTokenCookie(res);

    await createAuditLog({
      userId: user.id,
      action: user.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN_PASSWORD_RESET_COMPLETED' : 'PASSWORD_RESET_COMPLETED',
      entityType: 'User',
      entityId: user.id,
      ipAddress: req.ip,
    });

    await sendPasswordChangedEmail(user.email, user.name);
    if (user.role === 'SUPER_ADMIN') {
      await sendSuperAdminPasswordChangedSecurityEmail(user.email, user.name);
    }

    return sendSuccess(res, {}, 'Password reset successfully. Please login again.');
  } catch (error) {
    next(error);
  }
};

const verifyResetTokenHandler = async (req, res, next) => {
  try {
    const { token } = req.query;

    try {
      const stored = await validatePasswordResetToken(token);
      if (
        stored.user.role === 'PATIENT' ||
        stored.user.approvalStatus === 'SUSPENDED' ||
        stored.user.approvalStatus === 'REJECTED'
      ) {
        return res.status(400).json({ valid: false, message: 'Reset link is invalid or expired' });
      }
      return res.json({ valid: true });
    } catch (_) {
      return res.status(400).json({ valid: false, message: 'Reset link is invalid or expired' });
    }
  } catch (error) {
    next(error);
  }
};

const refreshTokenHandler = async (req, res, next) => {
  try {
    // Web clients send the refresh token via httpOnly cookie.
    // Mobile clients (React Native / Expo) cannot use httpOnly cookies, so
    // they send the refresh token in the request body as { refreshToken: '...' }.
    const rawRefreshToken =
      req.cookies?.[REFRESH_COOKIE_NAME] ||
      req.body?.refreshToken ||
      null;

    if (!rawRefreshToken) return sendError(res, 'Refresh token not found', 401);

    const refreshed = await rotateRefreshToken(rawRefreshToken, null, getSessionMetadata(req));

    // Set cookie for web clients (no-op on mobile — cookies are not persisted)
    // ✅ PERSISTENT LOGIN: Use 30-day cookie max age (matches refresh token expiry)
    setRefreshTokenCookie(res, refreshed.refreshToken, 30 * 24 * 60 * 60 * 1000);

    return sendSuccess(res, {
      accessToken: refreshed.accessToken,
      // Also return the new refresh token in the body so mobile can store it
      refreshToken: refreshed.refreshToken,
      user: toAuthUser(refreshed.user),
    }, 'Token refreshed');
  } catch (error) {
    clearRefreshTokenCookie(res);
    next(error);
  }
};

const logoutHandler = async (req, res, next) => {
  try {
    // ✅ SOFT LOGOUT WITH 7-DAY GRACE PERIOD (Cost-Saving Feature)
    // 
    // Strategy: DON'T revoke the refresh token on logout
    // - User appears "logged out" (frontend shows login screen)
    // - But refresh token remains valid in database for 30 days
    // - Frontend keeps token in secure storage (doesn't delete it)
    // - If user "logs in" again within 30 days: Uses existing token (NO OTP needed)
    // - Saves ₹0.12 OTP cost per accidental logout or quick return
    //
    // Security: Token still expires after 30 days of inactivity
    // User can force "hard logout" (revoke all tokens) from settings if needed
    
    const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
    
    // DON'T revoke the token - let it remain valid
    // This allows "silent re-login" without OTP if user returns
    
    // Note: For HARD logout (immediate revocation), use /logout-all endpoint instead
    // That endpoint calls: await revokeRefreshToken(rawRefreshToken);
    
    // Just clear cookie (for web browsers)
    // Mobile app should NOT delete token from secure storage
    clearRefreshTokenCookie(res);
    
    logger.info('[Auth] Soft logout - token remains valid for grace period re-login');
    
    return sendSuccess(
      res,
      { 
        gracePeriodDays: 30,
        message: 'You can log back in without OTP within 30 days'
      },
      'Logged out successfully'
    );
  } catch (error) {
    next(error);
  }
};

const logoutAllHandler = async (req, res, next) => {
  try {
    await revokeAllUserTokens(req.user.id);
    clearRefreshTokenCookie(res);
    return sendSuccess(res, {}, 'Logged out from all devices');
  } catch (error) {
    next(error);
  }
};

const getMeHandler = async (req, res, next) => {
  try {
    const user = await buildMePayload(req.user.id);
    return sendSuccess(res, { user: toAuthUser(user), profile: user }, 'User profile fetched');
  } catch (error) {
    next(error);
  }
};

const createReceptionistHandler = async (req, res, next) => {
  try {
    const { name, phone, email, password } = req.body;

    const clinic = await prisma.clinic.findFirst({
      where: { ownerId: req.user.id, approvalStatus: 'VERIFIED' },
      orderBy: { createdAt: 'asc' },
    });

    if (!clinic) {
      return sendError(res, 'Verified clinic not found for this owner', 404);
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ mobile: phone }, { email: email.toLowerCase() }] },
    });
    if (existing) return sendError(res, 'User with this phone or email already exists', 409);

    const receptionist = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          mobile: phone,
          email: email.toLowerCase(),
          role: 'RECEPTIONIST',
          approvalStatus: 'VERIFIED',
          passwordHash: await hashPassword(password),
          isPhoneVerified: true,
          receptionistProfile: {
            create: {
              assignedClinicId: clinic.id,
              createdByOwnerId: req.user.id,
            },
          },
        },
        include: baseUserInclude,
      });

      await tx.clinicStaff.create({
        data: {
          clinicId: clinic.id,
          userId: user.id,
          role: 'RECEPTIONIST',
        },
      });

      return user;
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'RECEPTIONIST_CREATED',
      entityType: 'User',
      entityId: receptionist.id,
      ipAddress: req.ip,
    });

    return sendSuccess(res, { user: toAuthUser(receptionist) }, 'Receptionist created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const createAdminHandler = async (req, res, next) => {
  try {
    const { fullName, phone, email, password, level } = req.body;
    const existing = await prisma.user.findFirst({
      where: { OR: [{ mobile: phone }, { email: email.toLowerCase() }] },
    });
    if (existing) return sendError(res, 'User with this phone or email already exists', 409);

    const admin = await prisma.user.create({
      data: {
        name: fullName,
        mobile: phone,
        email: email.toLowerCase(),
        role: 'SUPER_ADMIN',
        approvalStatus: 'VERIFIED',
        isPhoneVerified: true,
        isEmailVerified: true,
        passwordHash: await hashPassword(password),
        adminProfile: {
          create: {
            level,
            createdById: req.user.id,
          },
        },
      },
      include: baseUserInclude,
    });

    return sendSuccess(res, { user: toAuthUser(admin) }, 'Admin account created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const lookupPincodeHandler = async (req, res, next) => {
  try {
    const pincode = String(req.params.pincode || '').replace(/\D/g, '').trim();
    if (pincode.length !== 6) {
      return sendError(res, 'Pincode must be 6 digits', 400);
    }

    const response = await fetch(`https://aniket-thapa.github.io/india-pincode-api/pincodes/${pincode}.json`);
    const data = await response.json();
    const offices = Array.isArray(data?.offices) ? data.offices : [];

    if (!offices.length) {
      return sendError(res, 'No location found for this pincode', 404);
    }

    const districts = [...new Set(offices.map((office) => office.district || data.district).filter(Boolean))];
    const cities = [...new Set(
      offices
        .map((office) => {
          const name = String(office.officeName || '').trim();
          // Strip suffix like "B.O", "S.O", "H.O" — keep only the locality name
          return name.split(/\s+/)[0] || name;
        })
        .filter(Boolean)
    )];
    const state = String(data.state || '').trim();

    return sendSuccess(
      res,
      {
        pincode,
        state,
        districts,
        cities,
      },
      'Pincode location fetched successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/user/firebase-phone-login
 *
 * Patient-only Firebase Phone Auth login / register.
 *
 * Flow:
 *  1. Mobile app uses Firebase Phone Auth to send OTP and verify it.
 *  2. After confirmation, app gets a Firebase ID token and sends it here.
 *  3. Backend verifies the token using Firebase Admin SDK.
 *  4. Extracts the phone_number from the decoded token (trusted source).
 *  5. Normalizes the phone number to E.164 / +91XXXXXXXXXX format.
 *  6. Looks up the user by mobile number.
 *  7. If user exists → logs them in, updates lastLoginAt + firebaseUid.
 *  8. If user does not exist → creates a new PATIENT account.
 *  9. Returns our app JWT access token + user profile.
 *
 * Security notes:
 *  - Mobile number is NEVER taken directly from the request body.
 *    It is always extracted from the Firebase-verified token.
 *  - firebaseUid is stored and kept in sync for audit purposes.
 */
const firebasePhoneLoginHandler = async (req, res, next) => {
  try {
    const { firebaseIdToken, name } = req.body;

    // ── 1. Verify Firebase ID token ───────────────────────────────────────
    let decoded;
    try {
      decoded = await verifyFirebaseToken(firebaseIdToken);
    } catch (firebaseError) {
      // Distinguish configuration errors from bad tokens
      if (firebaseError.status === 503) {
        return sendError(res, 'Firebase Auth is not configured on this server. Contact support.', 503);
      }
      return sendError(res, 'Invalid or expired Firebase token. Please try again.', 401);
    }

    // ── 2. Extract & validate phone number from trusted Firebase token ────
    const rawPhone = decoded.phone_number;
    if (!rawPhone) {
      return sendError(res, 'No phone number found in Firebase token. Use Phone Auth provider.', 400);
    }

    // Normalize to E.164 (+91XXXXXXXXXX for Indian numbers)
    const mobile = normalizeMobileNumber(rawPhone);
    if (!mobile || !/^\+[1-9]\d{9,14}$/.test(mobile)) {
      return sendError(res, 'Invalid phone number format in Firebase token.', 400);
    }

    const firebaseUid = decoded.uid;

    // ── 3. Find or create patient user ─────────────────────────────────────
    let user = await prisma.user.findUnique({
      where: { mobile },
      include: baseUserInclude,
    });

    let isNewUser = false;

    if (!user) {
      // ── 3a. New user — create PATIENT account ────────────────────────────
      user = await prisma.user.create({
        data: {
          mobile,
          name: name || null,
          role: 'PATIENT',
          approvalStatus: 'VERIFIED',
          isPhoneVerified: true,
          firebaseUid,
          authProvider: 'FIREBASE_PHONE',
          patientProfile: { create: {} },
        },
        include: baseUserInclude,
      });
      isNewUser = true;
    } else {
      // ── 3b. Existing user — safety checks ────────────────────────────────
      if (user.role !== 'PATIENT') {
        return sendError(
          res,
          'This phone number belongs to a staff account. Use the staff login portal.',
          403
        );
      }

      if (!user.isActive) {
        return sendError(res, 'Your account has been disabled. Please contact support.', 403);
      }

      if (user.approvalStatus === 'SUSPENDED') {
        return sendError(res, user.suspendedReason || 'Your account is suspended.', 403);
      }

      // ── 3c. Update lastLoginAt + sync firebaseUid if needed ──────────────
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          isPhoneVerified: true,
          lastLoginAt: new Date(),
          authProvider: 'FIREBASE_PHONE',
          ...(user.firebaseUid !== firebaseUid ? { firebaseUid } : {}),
          ...(name && !user.name ? { name } : {}),
        },
        include: baseUserInclude,
      });
    }

    // ── 4. Issue our app JWT ───────────────────────────────────────────────
    const tokens = await issueAuthTokens(res, user, req);

    await createAuditLog({
      userId: user.id,
      action: isNewUser ? 'PATIENT_REGISTERED_FIREBASE' : 'PATIENT_LOGIN_FIREBASE',
      entityType: 'User',
      entityId: user.id,
      ipAddress: req.ip,
      metadata: { provider: 'FIREBASE_PHONE' },
    });

    return sendSuccess(
      res,
      {
        accessToken: tokens.accessToken,
        // Include refreshToken in body so mobile clients (React Native / Expo)
        // can store it in SecureStore for silent token rotation.
        // Web clients ignore this and rely on the httpOnly cookie set above.
        refreshToken: tokens.refreshToken,
        user: { ...toAuthUser(user), isNewUser },
      },
      isNewUser ? 'Account created successfully' : 'Login successful'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/patient/send-otp (LEGACY)
 * 
 * Send OTP using Message Central VerifyNow
 * Step 1 of 2-factor auth migration
 * 
 * NOTE: This is the OLD implementation kept for backward compatibility
 * The NEW implementation is sendOtpHandler_MessageCentral
 */
const sendOtpHandler_Legacy = async (req, res, next) => {
  try {
    const { mobileNumber, mobile, purpose = 'LOGIN' } = req.body;
    
    // Support both 'mobile' and 'mobileNumber' fields
    const phoneNumber = mobile || mobileNumber;
    
    // Validate input
    if (!phoneNumber) {
      return sendError(res, 'Mobile number is required', 400);
    }

    // Clean and validate mobile number
    const cleanNumber = phoneNumber.replace(/\D/g, '').replace(/^91/, '');
    if (cleanNumber.length !== 10) {
      return sendError(res, 'Invalid mobile number format. Please enter 10-digit number.', 400);
    }

    // Validate purpose
    const validPurposes = ['LOGIN', 'SIGNUP', 'VERIFY_MOBILE', 'RESET_PASSWORD'];
    if (!validPurposes.includes(purpose)) {
      return sendError(res, 'Invalid OTP purpose', 400);
    }

    // For signup/registration, check if user already exists
    if (purpose === 'SIGNUP' || purpose === 'VERIFY_MOBILE') {
      const existingUser = await prisma.user.findUnique({
        where: { mobile: cleanNumber },
        select: { id: true, role: true },
      });
      
      // ✅ MULTI-ROLE FIX: Allow existing users to signup for different roles
      // Only block if same role already exists
      // Example: Existing PATIENT can become CLINIC_OWNER
      if (existingUser) {
        // For now, just allow OTP to be sent
        // The verifyOtpHandler will handle role assignment logic
        logger.info(`[Auth] Existing user found for ${cleanNumber} with role ${existingUser.role}`);
        // Don't block - let them proceed to OTP verification
      }
    }

    // ✅ TEST MODE: Use fixed OTP ONLY for specific test numbers
    // Real numbers will use Message Central (even if Message Central fails, we'll show proper error)
    const isTestMode = process.env.NODE_ENV === 'development' || process.env.ENABLE_TEST_OTP === 'true';
    const testNumbers = (process.env.TEST_OTP_NUMBERS || '9999999999,8888888888,7777777777').split(',');
    const testOtp = process.env.TEST_OTP_CODE || '123456';
    
    // Use test mode ONLY if number is in the test numbers list
    if (isTestMode && testNumbers.includes(cleanNumber)) {
      logger.info(`[Auth] 🧪 TEST MODE: Using test OTP for ${cleanNumber}`);
      
      // Store in database for verification
      await prisma.otpVerification.create({
        data: {
          mobile: cleanNumber,
          purpose: purpose,
          otpHash: await hashPassword(testOtp),
          expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
          attempts: 0,
          maxAttempts: 5,
        }
      });

      logger.info(`[Auth] 🧪 TEST OTP: ${testOtp} for ${cleanNumber}`);

      return sendSuccess(res, {
        message: `TEST MODE: OTP is ${testOtp}`,
        expiresIn: 300,
        _testMode: true,
        _testOtp: testOtp, // Only send in dev mode
        _reason: 'test number'
      });
    }

    // ✅ PRODUCTION: Send real OTP via Message Central for all non-test numbers
    try {
      logger.info(`[Auth] Sending real OTP via Message Central to ${cleanNumber}`);
      
      // Send OTP via Message Central
      const result = await messageCentralService.sendOTP(cleanNumber, 6);

      // Store OTP verification record with Message Central verification ID
      await prisma.otpVerification.create({
        data: {
          mobile: cleanNumber,
          purpose: purpose,
          otpHash: result.verificationId, // Store verificationId (NOT the OTP itself)
          expiresAt: new Date(Date.now() + result.timeout * 1000),
          attempts: 0,
          maxAttempts: 5,
        }
      });

      logger.info(`[Auth] OTP sent to ${result.mobileNumber} via Message Central for purpose: ${purpose}`);

      return sendSuccess(res, {
        message: 'OTP sent successfully to your mobile',
        expiresIn: result.timeout,
      });
    } catch (messageCentralError) {
      logger.error('[Auth] Message Central error:', messageCentralError);
      
      // If Message Central fails, return proper error (don't fallback to test OTP for real numbers)
      return sendError(res, 
        messageCentralError.message || 'Failed to send OTP. Please try again or contact support.', 
        500
      );
    }
  } catch (error) {
    logger.error('[Auth] Send OTP error:', error);
    return sendError(res, error.message || 'Failed to send OTP. Please try again.', 500);
  }
};

/**
 * POST /api/auth/patient/verify-otp (LEGACY)
 * 
 * Verify OTP and login/register patient using Message Central
 * Step 2 of 2-factor auth migration
 * 
 * NOTE: This is the OLD implementation kept for backward compatibility
 * The NEW implementation is verifyOtpHandler_MessageCentral
 */
const verifyOtpHandler_Legacy = async (req, res, next) => {
  try {
    const { otp, mobileNumber, mobile, name, role = 'PATIENT' } = req.body;

    // Support both 'mobile' and 'mobileNumber' fields
    const phoneNumber = mobile || mobileNumber;

    // Validate input
    if (!otp || !phoneNumber) {
      return sendError(res, 'OTP and mobile number are required', 400);
    }

    // Clean OTP
    const cleanOtp = otp.replace(/\D/g, '');
    if (cleanOtp.length !== 6) {
      return sendError(res, 'Invalid OTP format. Please enter 6-digit code.', 400);
    }

    // Clean mobile number
    const cleanNumber = phoneNumber.replace(/\D/g, '').replace(/^91/, '');
    if (cleanNumber.length !== 10) {
      return sendError(res, 'Invalid mobile number format.', 400);
    }

    // Validate role
    const validRoles = ['PATIENT', 'CLINIC_OWNER'];
    const userRole = validRoles.includes(role) ? role : 'PATIENT';

    // ✅ TEST MODE: Validate test OTP for test numbers
    const isTestMode = process.env.NODE_ENV === 'development' || process.env.ENABLE_TEST_OTP === 'true';
    const testNumbers = (process.env.TEST_OTP_NUMBERS || '9999999999,8888888888,7777777777').split(',');
    const testOtp = process.env.TEST_OTP_CODE || '123456';
    
    if (isTestMode && testNumbers.includes(cleanNumber)) {
      logger.info(`[Auth] 🧪 TEST MODE: Verifying test OTP for ${cleanNumber}`);
      
      // Check if test OTP matches
      if (cleanOtp !== testOtp) {
        logger.warn(`[Auth] 🧪 TEST MODE: Invalid OTP. Expected: ${testOtp}, Got: ${cleanOtp}`);
        return sendError(res, 'Invalid OTP. For test mode, use: ' + testOtp, 401);
      }

      // Check if verification record exists and is not expired
      const otpRecord = await prisma.otpVerification.findFirst({
        where: {
          mobile: cleanNumber,
          expiresAt: { gte: new Date() },
          isUsed: false,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!otpRecord) {
        return sendError(res, 'OTP expired or not found. Please request a new one.', 401);
      }

      logger.info(`[Auth] 🧪 TEST MODE: OTP verified successfully for ${cleanNumber}`);
      
      // Mark OTP as used
      await prisma.otpVerification.update({
        where: { id: otpRecord.id },
        data: { isUsed: true, verifiedAt: new Date() },
      });

      // Find or create user based on role
      let user = await prisma.user.findUnique({
        where: { mobile: cleanNumber },
        include: baseUserInclude,
      });

      let isNewUser = false;
      if (!user) {
        // Create new user with specified role
        const userData = {
          mobile: cleanNumber,
          role: userRole,
          approvalStatus: userRole === 'PATIENT' ? 'VERIFIED' : 'PENDING',
          isPhoneVerified: true,
          authProvider: 'TEST_MODE',
        };

        if (name) userData.name = name;

        if (userRole === 'PATIENT') {
          userData.patientProfile = { create: {} };
        } else if (userRole === 'CLINIC_OWNER') {
          userData.clinicOwnerProfile = { create: { profileCompleted: false } };
        }

        user = await prisma.user.create({
          data: userData,
          include: baseUserInclude,
        });
        isNewUser = true;
        logger.info(`[Auth] 🧪 TEST MODE: New ${userRole} registered: ${user.id} (${cleanNumber})`);
      } else {
        // Existing user - update login time
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            isPhoneVerified: true,
            lastLoginAt: new Date(),
            authProvider: 'TEST_MODE',
            ...(name && !user.name ? { name } : {}),
          },
          include: baseUserInclude,
        });
        logger.info(`[Auth] 🧪 TEST MODE: ${user.role} login: ${user.id} (${cleanNumber})`);
      }

      // Issue JWT tokens
      const tokens = await issueAuthTokens(res, user, req);

      await createAuditLog({
        userId: user.id,
        action: isNewUser ? `${user.role}_REGISTERED_TEST_MODE` : `${user.role}_LOGIN_TEST_MODE`,
        entityType: 'User',
        entityId: user.id,
        ipAddress: req.ip,
        metadata: { provider: 'TEST_MODE' },
      });

      return sendSuccess(
        res,
        {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user: { ...toAuthUser(user), isNewUser },
          _testMode: true
        },
        isNewUser ? 'TEST MODE: Account created successfully' : 'TEST MODE: Login successful'
      );
    }

    // ✅ PRODUCTION: Validate OTP from database
    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        mobile: cleanNumber,
        expiresAt: { gte: new Date() },
        isUsed: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return sendError(res, 'OTP expired or not found. Please request a new one.', 401);
    }

    // Check max attempts
    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      return sendError(res, 'Maximum OTP attempts exceeded. Please request a new OTP.', 401);
    }

    // Verify OTP based on source (test mode vs Message Central)
    let isValid = false;
    
    // Check if this is a test number
    const isTestNumber = testNumbers.includes(cleanNumber);
    
    if (isTestNumber) {
      // Test number: verify against hash
      isValid = await verifyPassword(cleanOtp, otpRecord.otpHash);
      logger.info(`[Auth] Test number OTP verification: ${isValid}`);
    } else {
      // Real number: verify with Message Central API
      try {
        const verificationId = otpRecord.otpHash; // We stored verificationId in otpHash field
        logger.info(`[Auth] Verifying OTP with Message Central (verificationId: ${verificationId})`);
        
        const result = await messageCentralService.validateOTP(verificationId, cleanOtp);
        isValid = result.success && result.verificationStatus === 'VERIFICATION_COMPLETED';
        
        logger.info(`[Auth] Message Central validation result: ${isValid}`);
      } catch (mcError) {
        logger.error('[Auth] Message Central validation error:', mcError);
        
        // Increment attempts
        await prisma.otpVerification.update({
          where: { id: otpRecord.id },
          data: { attempts: otpRecord.attempts + 1 },
        });
        
        // Handle specific Message Central errors
        if (mcError.message === 'WRONG_OTP') {
          const remainingAttempts = otpRecord.maxAttempts - (otpRecord.attempts + 1);
          return sendError(res, `Invalid OTP. ${remainingAttempts} attempts remaining.`, 401);
        } else if (mcError.message === 'OTP_EXPIRED') {
          return sendError(res, 'OTP has expired. Please request a new one.', 401);
        } else if (mcError.message === 'ALREADY_VERIFIED') {
          return sendError(res, 'This OTP has already been used.', 401);
        }
        
        return sendError(res, 'Failed to verify OTP. Please try again.', 500);
      }
    }
    
    if (!isValid) {
      // Increment attempts
      await prisma.otpVerification.update({
        where: { id: otpRecord.id },
        data: { attempts: otpRecord.attempts + 1 },
      });
      
      const remainingAttempts = otpRecord.maxAttempts - (otpRecord.attempts + 1);
      return sendError(
        res,
        `Invalid OTP. ${remainingAttempts} attempts remaining.`,
        401
      );
    }

    // Mark OTP as used
    await prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: { isUsed: true, verifiedAt: new Date() },
    });

    logger.info(`[Auth] OTP verified successfully for ${cleanNumber}`);

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { mobile: cleanNumber },
      include: baseUserInclude,
    });

    let isNewUser = false;
    if (!user) {
      // Create new user with specified role
      const userData = {
        mobile: cleanNumber,
        role: userRole,
        approvalStatus: userRole === 'PATIENT' ? 'VERIFIED' : 'PENDING',
        isPhoneVerified: true,
        authProvider: 'MESSAGE_CENTRAL',
      };

      if (name) userData.name = name;

      if (userRole === 'PATIENT') {
        userData.patientProfile = { create: {} };
      } else if (userRole === 'CLINIC_OWNER') {
        userData.clinicOwnerProfile = { create: { profileCompleted: false } };
      }

      user = await prisma.user.create({
        data: userData,
        include: baseUserInclude,
      });
      isNewUser = true;
      logger.info(`[Auth] New ${userRole} registered: ${user.id} (${cleanNumber})`);
    } else {
      // Existing user - update login time
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          isPhoneVerified: true,
          lastLoginAt: new Date(),
          authProvider: 'MESSAGE_CENTRAL',
          ...(name && !user.name ? { name } : {}),
        },
        include: baseUserInclude,
      });
      logger.info(`[Auth] ${user.role} login: ${user.id} (${cleanNumber})`);
    }

    // Issue JWT tokens
    const tokens = await issueAuthTokens(res, user, req);

    await createAuditLog({
      userId: user.id,
      action: isNewUser ? `${user.role}_REGISTERED_MESSAGE_CENTRAL` : `${user.role}_LOGIN_MESSAGE_CENTRAL`,
      entityType: 'User',
      entityId: user.id,
      ipAddress: req.ip,
      metadata: { provider: 'MESSAGE_CENTRAL' },
    });

    return sendSuccess(
      res,
      {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: { ...toAuthUser(user), isNewUser },
      },
      isNewUser ? 'Account created successfully' : 'Login successful'
    );
  } catch (error) {
    logger.error('[Auth] Verify OTP error:', error);
    next(error);
  }
};

/**
 * POST /api/auth/register-email-otp/send
 * Send OTP to email for clinic partner registration OR login
 * @param {string} email - User's email
 * @param {string} name - User's name (optional for login)
 * @param {string} purpose - 'SIGNUP' (registration) or 'LOGIN' (existing user login)
 */
const sendRegistrationEmailOtp = async (req, res, next) => {
  try {
    const { email, name, purpose = 'SIGNUP' } = req.body;
    const cleanEmail = email.toLowerCase().trim();
    
    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return sendError(res, 'Invalid email format', 400);
    }
    
    // Check if user already exists with this email
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
      select: { 
        id: true, 
        role: true, 
        approvalStatus: true,
        clinicOnboardingData: true 
      },
    });
    
    // Different validation for SIGNUP vs LOGIN
    if (purpose === 'SIGNUP') {
      // For registration, reject if email already exists with active/pending account
      if (existingUser) {
        // ✅ SPECIAL CASE: If user is PENDING but has NO clinic data (incomplete onboarding),
        // allow them to continue by treating this as a LOGIN to resume onboarding
        if (existingUser.approvalStatus === 'PENDING') {
          const hasClinicData = existingUser.clinicOnboardingData !== null;
          
          if (!hasClinicData) {
            // User started registration but never completed onboarding
            // Allow OTP send so they can login and continue
            logger.info(`[Auth] PENDING user ${cleanEmail} has no clinic data, allowing OTP send to resume onboarding`);
            // Continue to send OTP (don't return error)
          } else {
            // User has completed onboarding and is awaiting admin approval
            return sendError(res, 'An application with this email is already pending review. Please wait for admin approval or contact support.', 409);
          }
        } else if (existingUser.approvalStatus === 'VERIFIED' || existingUser.approvalStatus === 'APPROVED') {
          return sendError(res, 'A user with this email already exists. Please use login instead.', 409);
        } else {
          // For other statuses (REJECTED, etc), allow (they can re-register)
          logger.info(`[Auth] Existing user found for ${cleanEmail} with status ${existingUser.approvalStatus}, allowing re-registration`);
        }
      }
    } else if (purpose === 'LOGIN') {
      // For login, require that email exists
      if (!existingUser) {
        return sendError(res, 'Email not registered. Please create an account first.', 404);
      }
      
      // ✅ ARCHITECTURE FIX: Allow authentication regardless of role
      // Authorization will be checked AFTER authentication succeeds
      // Do NOT block based on role at authentication stage
      
      logger.info(`[Auth] Sending login OTP to existing user ${cleanEmail} (role: ${existingUser.role}, status: ${existingUser.approvalStatus})`);
    }
    
    // Check if test email
    const isTestMode = process.env.ENABLE_TEST_OTP === 'true';
    const testEmails = (process.env.TEST_OTP_EMAILS || 'test@example.com,demo@example.com').split(',');
    const testOtp = process.env.TEST_OTP_CODE || '123456';
    
    if (isTestMode && testEmails.includes(cleanEmail)) {
      logger.info(`[Auth] 🧪 TEST MODE: Using test OTP for ${cleanEmail}`);
      
      // Store in database for verification
      await prisma.otpVerification.create({
        data: {
          mobile: cleanEmail, // Reuse mobile field for email
          purpose: purpose === 'LOGIN' ? 'LOGIN' : 'SIGNUP',
          otpHash: await hashPassword(testOtp),
          expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
          attempts: 0,
          maxAttempts: 5,
        }
      });

      logger.info(`[Auth] 🧪 TEST OTP: ${testOtp} for ${cleanEmail}`);

      return sendSuccess(res, {
        message: `TEST MODE: OTP is ${testOtp}`,
        expiresIn: 300,
        _testMode: true,
        _testOtp: testOtp,
      });
    }
    
    // Real email: Send via Resend
    const otp = String(Math.floor(100000 + Math.random() * 900000)); // 6-digit OTP
    
    // Send email via Resend
    const { sendClinicOwnerVerificationOtpEmail } = require('../services/email.service');
    await sendClinicOwnerVerificationOtpEmail(cleanEmail, otp, name || 'User');
    
    // Store OTP hash in database
    await prisma.otpVerification.create({
      data: {
        mobile: cleanEmail, // Reuse mobile field for email
        purpose: purpose === 'LOGIN' ? 'LOGIN' : 'SIGNUP',
        otpHash: await hashPassword(otp),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        attempts: 0,
        maxAttempts: 5,
      }
    });
    
    logger.info(`[Auth] OTP sent to ${cleanEmail} via email for ${purpose}`);
    
    return sendSuccess(res, {
      message: 'OTP sent successfully to your email',
      expiresIn: 600,
    });
  } catch (error) {
    logger.error('[Auth] Send registration email OTP error:', error);
    return sendError(res, error.message || 'Failed to send OTP', 500);
  }
};

/**
 * POST /api/auth/register-email-otp/verify
 * Verify email OTP and register/login clinic owner
 */
const verifyRegistrationEmailOtp = async (req, res, next) => {
  try {
    const { email, otp, name, role = 'CLINIC_OWNER' } = req.body;
    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = otp.replace(/\D/g, '');
    
    if (cleanOtp.length !== 6) {
      return sendError(res, 'Invalid OTP format', 400);
    }
    
    // Find OTP record - check both SIGNUP and LOGIN purposes
    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        mobile: cleanEmail, // We stored email in mobile field
        purpose: { in: ['SIGNUP', 'LOGIN'] }, // ✅ FIX: Accept both SIGNUP and LOGIN
        expiresAt: { gte: new Date() },
        isUsed: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return sendError(res, 'OTP expired or not found', 401);
    }

    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      return sendError(res, 'Maximum OTP attempts exceeded', 401);
    }

    // Verify OTP
    const isValid = await verifyPassword(cleanOtp, otpRecord.otpHash);
    
    if (!isValid) {
      await prisma.otpVerification.update({
        where: { id: otpRecord.id },
        data: { attempts: otpRecord.attempts + 1 },
      });
      
      const remainingAttempts = otpRecord.maxAttempts - (otpRecord.attempts + 1);
      return sendError(res, `Invalid OTP. ${remainingAttempts} attempts remaining.`, 401);
    }

    // Mark OTP as used
    await prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: { isUsed: true, verifiedAt: new Date() },
    });

    logger.info(`[Auth] Email OTP verified successfully for ${cleanEmail}`);

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: baseUserInclude,
    });

    let isNewUser = false;
    if (!user) {
      // Create new user with CLINIC_OWNER role
      // Generate a unique placeholder mobile since mobile field is required
      const placeholderMobile = `+91${Date.now().toString().slice(-10)}`;
      
      user = await prisma.user.create({
        data: {
          email: cleanEmail,
          mobile: placeholderMobile, // Placeholder mobile (required field)
          name: name,
          role: 'CLINIC_OWNER',
          approvalStatus: 'PENDING', // ✅ FIX: Set to PENDING - must complete onboarding and get admin approval
          isEmailVerified: true,
          authProvider: 'EMAIL_OTP',
          clinicOwnerProfile: { create: { profileCompleted: false } },
        },
        include: baseUserInclude,
      });
      isNewUser = true;
      logger.info(`[Auth] New CLINIC_OWNER registered: ${user.id} (${cleanEmail})`);
    } else {
      // Existing user - update email verification
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          isEmailVerified: true,
          lastLoginAt: new Date(),
          authProvider: 'EMAIL_OTP',
          ...(name && !user.name ? { name } : {}),
        },
        include: baseUserInclude,
      });
      logger.info(`[Auth] ${user.role} login via email OTP: ${user.id} (${cleanEmail}), status: ${user.approvalStatus}`);
    }

    // ✅ SECURITY FIX: Block login only for REJECTED and SUSPENDED clinic owners (existing users)
    // Allow PENDING, UNDER_REVIEW, CHANGES_REQUIRED to login and see their dashboard
    if (!isNewUser && user.role === 'CLINIC_OWNER') {
      if (user.approvalStatus === 'REJECTED') {
        logger.warn(`[Auth] Login blocked: CLINIC_OWNER ${user.id} status is REJECTED`);
        return sendError(res, 'Your clinic registration has been rejected by the admin. Please contact support for more information.', 403);
      }
      
      if (user.approvalStatus === 'SUSPENDED') {
        logger.warn(`[Auth] Login blocked: CLINIC_OWNER ${user.id} status is SUSPENDED`);
        return sendError(res, 'Your clinic account has been suspended. Please contact support.', 403);
      }
    }

    // ✅ Check if user has a clinic registered
    const hasClinic = user.role === 'CLINIC_OWNER' 
      ? await prisma.clinic.count({ where: { ownerId: user.id } }) > 0
      : false;

    logger.info(`[Auth] hasClinic check: userId=${user.id}, role=${user.role}, isNewUser=${isNewUser}, hasClinic=${hasClinic}`);

    // Issue JWT tokens
    const tokens = await issueAuthTokens(res, user, req);

    await createAuditLog({
      userId: user.id,
      action: isNewUser ? 'CLINIC_OWNER_REGISTERED_EMAIL_OTP' : 'CLINIC_OWNER_LOGIN_EMAIL_OTP',
      entityType: 'User',
      entityId: user.id,
      ipAddress: req.ip,
      metadata: { provider: 'EMAIL_OTP', isNewUser, hasClinic },
    });

    // ✅ DEBUG: Log the complete response data structure
    const responseData = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: { ...toAuthUser(user), isNewUser, hasClinic },
    };
    
    logger.info(`[Auth] Response data structure: ${JSON.stringify({
      hasAccessToken: !!responseData.accessToken,
      hasRefreshToken: !!responseData.refreshToken,
      userId: responseData.user?.id,
      userRole: responseData.user?.role,
      isNewUser: responseData.user?.isNewUser,
      hasClinic: responseData.user?.hasClinic,
      allUserKeys: Object.keys(responseData.user || {})
    }, null, 2)}`);

    return sendSuccess(
      res,
      responseData,
      isNewUser ? 'Account created successfully' : 'Login successful'
    );
  } catch (error) {
    logger.error('[Auth] Verify registration email OTP error:', error);
    next(error);
  }
};


/**
 * POST /api/auth/send-otp
 * Send OTP to mobile number using Message Central (with test number support)
 */
const sendOtpHandler_MessageCentral = async (req, res, next) => {
  try {
    const { phoneNumber, purpose = 'LOGIN' } = req.body;
    
    logger.info('[OTP] sendOtpHandler_MessageCentral called with phoneNumber:', phoneNumber, 'purpose:', purpose);
    
    if (!phoneNumber) {
      logger.warn('[OTP] Phone number missing in request');
      return sendError(res, 'Phone number is required', 400);
    }
    
    // Normalize phone number
    const normalizedPhone = normalizeMobileNumber(phoneNumber);
    logger.info('[OTP] Normalized phone:', normalizedPhone);
    
    // Extract 10-digit number (remove +91)
    const mobileNumber = normalizedPhone.replace(/^\+91/, '');
    
    if (mobileNumber.length !== 10 || !/^\d{10}$/.test(mobileNumber)) {
      logger.warn('[OTP] Invalid phone number format:', mobileNumber);
      return sendError(res, 'Invalid Indian mobile number', 400);
    }
    
    // ✅ Check if user exists with this mobile number
    const existingUser = await prisma.user.findUnique({
      where: { mobile: normalizedPhone },
      select: { 
        id: true, 
        role: true, 
        approvalStatus: true,
        clinicOnboardingData: true 
      },
    });
    
    // Different validation for SIGNUP vs LOGIN vs ONBOARDING
    if (purpose === 'SIGNUP') {
      // For registration, reject if mobile already exists with active/pending account
      if (existingUser) {
        // ✅ SPECIAL CASE: If user is PENDING but has NO clinic data (incomplete onboarding),
        // allow them to continue by treating this as a LOGIN to resume onboarding
        if (existingUser.approvalStatus === 'PENDING') {
          const hasClinicData = existingUser.clinicOnboardingData !== null;
          
          if (!hasClinicData) {
            // User started registration but never completed onboarding
            // Allow OTP send so they can login and continue
            logger.info(`[OTP] PENDING user ${normalizedPhone} has no clinic data, allowing OTP send to resume onboarding`);
            // Continue to send OTP (don't return error)
          } else {
            // User has completed onboarding and is awaiting admin approval
            return sendError(res, 'An application with this mobile number is already pending review. Please wait for admin approval or contact support.', 409);
          }
        } else if (existingUser.approvalStatus === 'VERIFIED' || existingUser.approvalStatus === 'APPROVED') {
          return sendError(res, 'A user with this mobile number already exists. Please use login instead.', 409);
        } else {
          // For other statuses (REJECTED, etc), allow (they can re-register)
          logger.info(`[OTP] Existing user found for ${normalizedPhone} with status ${existingUser.approvalStatus}, allowing re-registration`);
        }
      }
    } else if (purpose === 'LOGIN') {
      // For login, require that mobile exists
      if (!existingUser) {
        return sendError(res, 'Mobile number not registered. Please create an account first.', 404);
      }
      
      // ✅ ARCHITECTURE FIX: Allow authentication regardless of role
      // Authorization will be checked AFTER authentication succeeds
      // Do NOT block based on role at authentication stage
      
      logger.info(`[OTP] Sending login OTP to existing user ${normalizedPhone} (role: ${existingUser.role}, status: ${existingUser.approvalStatus})`);
    } else if (purpose === 'ONBOARDING') {
      // ✅ FIX: For onboarding, CHECK if user already exists with this mobile
      // Block if another user already has this mobile number
      if (existingUser) {
        // Check approval status
        if (existingUser.approvalStatus === 'PENDING') {
          return sendError(res, 'An application with this mobile number is already pending review. Please wait for admin approval or contact support.', 409);
        } else if (existingUser.approvalStatus === 'VERIFIED' || existingUser.approvalStatus === 'APPROVED') {
          return sendError(res, 'A user with this mobile number already exists and is active. Please use a different mobile number.', 409);
        } else {
          // For REJECTED/SUSPENDED, still block to prevent confusion
          return sendError(res, 'A user with this mobile number already exists.', 409);
        }
      }
      logger.info(`[OTP] ONBOARDING mode: Mobile ${normalizedPhone} is available - sending OTP`);
    }
    
    // ✅ TEST MODE: Check if this is a test number
    const isTestMode = process.env.ENABLE_TEST_OTP === 'true';
    const testNumbers = (process.env.TEST_OTP_NUMBERS || '9999999999,8888888888,7777777777').split(',');
    const testOtp = process.env.TEST_OTP_CODE || '123456';
    
    if (isTestMode && testNumbers.includes(mobileNumber)) {
      logger.info(`[OTP] 🧪 TEST MODE: Using test OTP for ${mobileNumber}`);
      
      // Return success immediately for test numbers
      // The frontend has special handling for test numbers
      return sendSuccess(
        res,
        {
          verificationId: 'TEST_' + Date.now(), // Fake verification ID
          timeout: 180,
          mobileNumber: normalizedPhone,
          _testMode: true, // Internal flag
        },
        'OTP sent successfully (test mode)'
      );
    }
    
    // ✅ PRODUCTION: Send real OTP via Message Central
    logger.info(`[OTP] Sending real OTP via Message Central to: ${normalizedPhone}`);
    
    try {
      // Send OTP via Message Central
      const result = await messageCentralService.sendOTP(mobileNumber, 6);
      
      logger.info('[OTP] OTP sent successfully:', result);
      
      return sendSuccess(
        res,
        {
          verificationId: result.verificationId,
          timeout: result.timeout,
          mobileNumber: result.mobileNumber,
        },
        'OTP sent successfully'
      );
    } catch (messageCentralError) {
      // Log the specific Message Central error
      logger.error('[OTP] Message Central service error:', messageCentralError.message);
      logger.error('[OTP] Message Central error stack:', messageCentralError.stack);
      
      // Return user-friendly error message
      const errorMessage = messageCentralError.message || 'Failed to send OTP via SMS service';
      return sendError(res, errorMessage, 500);
    }
  } catch (error) {
    logger.error('[OTP] Send OTP handler error:', error);
    logger.error('[OTP] Error stack:', error.stack);
    
    // ALWAYS return JSON error response (never let it go to next middleware)
    return sendError(
      res,
      error.message || 'Failed to send OTP. Please try again.',
      500
    );
  }
};

/**
 * POST /api/auth/verify-otp
 * Verify OTP code using Message Central (with test number support)
 */
const verifyOtpHandler_MessageCentral = async (req, res, next) => {
  try {
    const { phoneNumber, otp, verificationId, purpose = 'LOGIN' } = req.body;
    
    logger.info('[OTP] verifyOtpHandler_MessageCentral called');
    logger.info('[OTP] Phone:', phoneNumber, 'OTP:', otp, 'VerificationId:', verificationId, 'Purpose:', purpose);
    
    if (!otp) {
      logger.warn('[OTP] OTP code missing in request');
      return sendError(res, 'OTP code is required', 400);
    }
    
    if (!phoneNumber) {
      logger.warn('[OTP] Phone number missing in request');
      return sendError(res, 'Phone number is required', 400);
    }
    
    // Normalize phone number
    const normalizedPhone = normalizeMobileNumber(phoneNumber);
    const mobileNumber = normalizedPhone.replace(/^\+91/, '');
    
    // ✅ TEST MODE: Check if this is a test number
    const isTestMode = process.env.ENABLE_TEST_OTP === 'true';
    const testNumbers = (process.env.TEST_OTP_NUMBERS || '9999999999,8888888888,7777777777').split(',');
    const testOtp = process.env.TEST_OTP_CODE || '123456';
    
    if (isTestMode && testNumbers.includes(mobileNumber)) {
      logger.info(`[OTP] 🧪 TEST MODE: Verifying test OTP for ${mobileNumber}`);
      
      if (otp !== testOtp) {
        logger.warn(`[OTP] 🧪 TEST MODE: Invalid OTP. Expected: ${testOtp}, Got: ${otp}`);
        return sendError(res, 'Invalid OTP code. For test mode, use: ' + testOtp, 400);
      }
      
      logger.info(`[OTP] 🧪 TEST MODE: OTP verified successfully for ${mobileNumber}`);
      
      // ✅ ONBOARDING MODE: Just verify the OTP, don't create user or issue tokens
      if (purpose === 'ONBOARDING') {
        logger.info(`[OTP] 🧪 TEST MODE + ONBOARDING: Mobile verified, not creating user`);
        
        // Check if another user already has this mobile
        const existingUser = await prisma.user.findFirst({
          where: {
            OR: [
              { mobile: normalizedPhone },
              { mobile: mobileNumber },
            ]
          },
          select: { id: true, approvalStatus: true }
        });
        
        if (existingUser) {
          if (existingUser.approvalStatus === 'PENDING') {
            return sendError(res, 'An application with this mobile number is already pending review.', 409);
          } else if (existingUser.approvalStatus === 'VERIFIED' || existingUser.approvalStatus === 'APPROVED') {
            return sendError(res, 'This mobile number is already registered to another account.', 409);
          } else {
            return sendError(res, 'A user with this mobile number already exists.', 409);
          }
        }
        
        return sendSuccess(
          res,
          {
            verified: true,
            mobileNumber: normalizedPhone,
            verificationStatus: 'VERIFICATION_COMPLETED',
            _testMode: true,
            _onboardingMode: true,
          },
          'Mobile number verified successfully'
        );
      }
      
      // ✅ SAVE TO DATABASE: Create or update user with verified phone (LOGIN/SIGNUP mode)
      try {
        // Check if user already exists - try both with and without +91 prefix
        let user = await prisma.user.findFirst({
          where: {
            OR: [
              { mobile: normalizedPhone }, // With +91
              { mobile: mobileNumber },     // Without +91
            ]
          },
          include: baseUserInclude,
        });
        
        if (user) {
          // User exists - CHECK APPROVAL STATUS before allowing login (TEST MODE)
          logger.info(`[OTP] 🧪 TEST MODE: Updating existing user ${user.id} phone verification status`);
          
          // Block login only for SUSPENDED and REJECTED users
          // Allow PENDING, UNDER_REVIEW, CHANGES_REQUIRED to login and see their status
          if (user.approvalStatus === 'SUSPENDED') {
            return sendError(res, user.suspendedReason || 'Account is suspended', 403);
          }
          if (user.approvalStatus === 'REJECTED') {
            return sendError(res, user.rejectionReason || 'Account has been rejected', 403);
          }
          if (!user.isActive) {
            return sendError(res, 'Account is disabled', 403);
          }
          
          // Update verification status
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              isPhoneVerified: true,
              lastLoginAt: new Date(),
            },
            include: baseUserInclude,
          });
          logger.info(`[OTP] 🧪 TEST MODE: ✅ User ${user.id} phone verified in database`);
          
          // ✅ Issue login tokens for existing user
          const tokens = await issueAuthTokens(res, user, req);
          
          await createAuditLog({
            userId: user.id,
            action: 'CLINIC_OWNER_LOGIN_MOBILE_OTP',
            entityType: 'User',
            entityId: user.id,
            ipAddress: req.ip,
          });
          
          return sendSuccess(
            res,
            {
              verified: true,
              mobileNumber: normalizedPhone,
              verificationStatus: 'VERIFICATION_COMPLETED',
              _testMode: true,
              // Return tokens for login
              accessToken: tokens.accessToken,
              refreshToken: tokens.refreshToken,
              user: toAuthUser(user),
            },
            'Login successful'
          );
        } else {
          // User doesn't exist - create minimal user record for verification persistence
          logger.info(`[OTP] 🧪 TEST MODE: Creating new user record for ${mobileNumber}`);
          user = await prisma.user.create({
            data: {
              mobile: mobileNumber,
              role: 'CLINIC_OWNER', // Default role for clinic onboarding
              isPhoneVerified: true,
              approvalStatus: 'PENDING',
              authProvider: 'TEST_OTP',
            },
            include: baseUserInclude,
          });
          logger.info(`[OTP] 🧪 TEST MODE: ✅ Created user ${user.id} with verified phone in database`);
          
          // ✅ Issue login tokens for new user
          const tokens = await issueAuthTokens(res, user, req);
          
          await createAuditLog({
            userId: user.id,
            action: 'CLINIC_OWNER_REGISTER_MOBILE_OTP',
            entityType: 'User',
            entityId: user.id,
            ipAddress: req.ip,
          });
          
          return sendSuccess(
            res,
            {
              verified: true,
              mobileNumber: normalizedPhone,
              verificationStatus: 'VERIFICATION_COMPLETED',
              _testMode: true,
              // Return tokens for login
              accessToken: tokens.accessToken,
              refreshToken: tokens.refreshToken,
              user: toAuthUser(user),
            },
            'Registration and login successful (test mode)'
          );
        }
      } catch (dbError) {
        // Log database error but don't fail the OTP verification
        logger.error('[OTP] 🧪 TEST MODE: Database save error (non-fatal):', dbError);
        // Continue - verification was successful even if DB save failed
      }
      
      return sendSuccess(
        res,
        {
          verified: true,
          mobileNumber: normalizedPhone,
          verificationStatus: 'VERIFICATION_COMPLETED',
          _testMode: true,
        },
        'OTP verified successfully (test mode)'
      );
    }
    
    // ✅ PRODUCTION: Validate with Message Central
    if (!verificationId) {
      logger.warn('[OTP] Verification ID missing for real number');
      return sendError(res, 'Verification ID is required', 400);
    }
    
    logger.info(`[OTP] Verifying OTP with Message Central for verification ID: ${verificationId}`);
    
    // Validate OTP via Message Central
    const result = await messageCentralService.validateOTP(verificationId, otp);
    
    logger.info('[OTP] OTP verified successfully:', result);
    
    // ✅ ONBOARDING MODE: Verify OTP and create/get consistent user
    if (purpose === 'ONBOARDING') {
      logger.info(`[OTP] ONBOARDING mode: Mobile verified via Message Central`);
      
      const clinicOnboardingService = require('../services/clinicOnboarding.service');
      
      // Normalize mobile for database (remove +91 prefix)
      const dbMobile = normalizedPhone.replace(/^\+91/, '');
      
      // Get or create clinic owner user - ensures single user per mobile
      const user = await clinicOnboardingService.getOrCreateClinicOwner(dbMobile);
      
      // Check if they can continue (not VERIFIED/APPROVED already)
      if (user.approvalStatus === 'VERIFIED' || user.approvalStatus === 'APPROVED') {
        return sendError(res, 'This mobile number is already registered to an approved account. Please use login instead.', 409);
      }
      
      if (user.approvalStatus === 'REJECTED') {
        return sendError(res, 'Your previous application was rejected. Please contact support.', 403);
      }
      
      if (user.approvalStatus === 'SUSPENDED') {
        return sendError(res, 'Your account is suspended. Please contact support.', 403);
      }
      
      logger.info(`[OTP] ONBOARDING: User ${user.id} ready for registration (status: ${user.approvalStatus})`);
      
      // Return user data for authentication
      return sendSuccess(
        res,
        {
          verified: true,
          mobileNumber: result.mobileNumber,
          verificationStatus: result.verificationStatus,
          user: {
            id: user.id,
            mobile: user.mobile,
            email: user.email,
            name: user.name,
            role: user.role,
            approvalStatus: user.approvalStatus,
            isPhoneVerified: user.isPhoneVerified,
            isEmailVerified: user.isEmailVerified,
          },
          _onboardingMode: true,
        },
        'Mobile number verified successfully'
      );
    }
    
    // ✅ SAVE TO DATABASE: Create or update user with verified phone (LOGIN/SIGNUP mode)
    try {
      // Normalize mobile number for database
      const dbMobile = normalizedPhone.replace(/^\+91/, '');
      
      // Check if user already exists - try both with and without +91 prefix
      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { mobile: normalizedPhone }, // With +91
            { mobile: dbMobile },         // Without +91
          ]
        },
        include: baseUserInclude,
      });
      
      if (user) {
        // User exists - CHECK APPROVAL STATUS before allowing login
        logger.info(`[OTP] Updating existing user ${user.id} phone verification status`);
        
        // Block login only for SUSPENDED and REJECTED users
        // Allow PENDING, UNDER_REVIEW, CHANGES_REQUIRED to login and see their status
        if (user.approvalStatus === 'SUSPENDED') {
          return sendError(res, user.suspendedReason || 'Account is suspended', 403);
        }
        if (user.approvalStatus === 'REJECTED') {
          return sendError(res, user.rejectionReason || 'Account has been rejected', 403);
        }
        if (!user.isActive) {
          return sendError(res, 'Account is disabled', 403);
        }
        
        // Update verification status
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            isPhoneVerified: true,
            lastLoginAt: new Date(),
          },
          include: baseUserInclude,
        });
        logger.info(`[OTP] ✅ User ${user.id} phone verified in database`);
        
        // ✅ Issue login tokens for existing user
        const tokens = await issueAuthTokens(res, user, req);
        
        await createAuditLog({
          userId: user.id,
          action: 'CLINIC_OWNER_LOGIN_MOBILE_OTP',
          entityType: 'User',
          entityId: user.id,
          ipAddress: req.ip,
        });
        
        return sendSuccess(
          res,
          {
            verified: result.success,
            mobileNumber: result.mobileNumber,
            verificationStatus: result.verificationStatus,
            // Return tokens for login
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: toAuthUser(user),
          },
          'Login successful'
        );
      } else {
        // User doesn't exist - create minimal user record for verification persistence
        logger.info(`[OTP] Creating new user record for ${dbMobile}`);
        user = await prisma.user.create({
          data: {
            mobile: dbMobile,
            role: 'CLINIC_OWNER', // Default role for clinic onboarding
            isPhoneVerified: true,
            approvalStatus: 'PENDING',
            authProvider: 'MESSAGE_CENTRAL_OTP',
          },
          include: baseUserInclude,
        });
        logger.info(`[OTP] ✅ Created user ${user.id} with verified phone in database`);
        
        // ✅ Issue login tokens for new user
        const tokens = await issueAuthTokens(res, user, req);
        
        await createAuditLog({
          userId: user.id,
          action: 'CLINIC_OWNER_REGISTER_MOBILE_OTP',
          entityType: 'User',
          entityId: user.id,
          ipAddress: req.ip,
        });
        
        return sendSuccess(
          res,
          {
            verified: result.success,
            mobileNumber: result.mobileNumber,
            verificationStatus: result.verificationStatus,
            // Return tokens for login
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: toAuthUser(user),
          },
          'Registration and login successful'
        );
      }
    } catch (dbError) {
      // Log database error but don't fail the OTP verification
      logger.error('[OTP] Database save error (non-fatal):', dbError);
      logger.error('[OTP] Error stack:', dbError.stack);
      // Continue - verification was successful even if DB save failed
    }
    
    return sendSuccess(
      res,
      {
        verified: result.success,
        mobileNumber: result.mobileNumber,
        verificationStatus: result.verificationStatus,
      },
      'OTP verified successfully'
    );
  } catch (error) {
    logger.error('[OTP] Verify OTP error:', error);
    logger.error('[OTP] Error stack:', error.stack);
    
    // Send user-friendly error messages
    if (error.message.includes('Invalid OTP')) {
      return sendError(res, 'Invalid OTP code. Please try again.', 400);
    } else if (error.message.includes('expired')) {
      return sendError(res, 'OTP has expired. Please request a new one.', 400);
    } else if (error.message.includes('already been used')) {
      return sendError(res, 'This OTP has already been used.', 400);
    }
    
    // Always return a proper JSON error response
    return sendError(
      res,
      error.message || 'Failed to verify OTP. Please try again.',
      500
    );
  }
};

/**
 * GET /api/auth/check-user-exists
 * Check if a user exists with the given mobile or email (for LOGIN validation)
 */
const checkUserExistsHandler = async (req, res, next) => {
  try {
    const { mobile, email } = req.query;
    
    if (!mobile && !email) {
      return sendError(res, 'Mobile or email is required', 400);
    }
    
    let user = null;
    
    if (mobile) {
      // Normalize phone number
      const normalizedPhone = normalizeMobileNumber(mobile);
      const mobileNumber = normalizedPhone.replace(/^\+91/, '');
      
      if (mobileNumber.length !== 10 || !/^\d{10}$/.test(mobileNumber)) {
        return sendError(res, 'Invalid Indian mobile number', 400);
      }
      
      logger.info(`[Auth] Checking if user exists with mobile: ${mobileNumber} or ${normalizedPhone}`);
      
      // ✅ FIX: Search with both formats (with and without +91 prefix)
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { mobile: normalizedPhone }, // With +91
            { mobile: mobileNumber },     // Without +91
          ]
        },
        select: {
          id: true,
          mobile: true,
          email: true,
          role: true,
          approvalStatus: true,
        },
      });
    } else if (email) {
      const normalizedEmail = email.toLowerCase();
      
      logger.info(`[Auth] Checking if user exists with email: ${normalizedEmail}`);
      
      user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: {
          id: true,
          mobile: true,
          email: true,
          role: true,
          approvalStatus: true,
        },
      });
    }
    
    if (user) {
      logger.info(`[Auth] User found with ${mobile ? 'mobile' : 'email'}: ${user.id}`);
      return sendSuccess(
        res,
        {
          exists: true,
          userId: user.id,
          role: user.role,
          status: user.approvalStatus,
        },
        'User exists'
      );
    } else {
      logger.info(`[Auth] No user found with ${mobile ? 'mobile' : 'email'}`);
      return sendSuccess(
        res,
        {
          exists: false,
        },
        'User does not exist'
      );
    }
  } catch (error) {
    logger.error('[Auth] Check user exists error:', error);
    next(error);
  }
};

/**
 * GET /api/auth/check-mobile-verification/:mobile
 * Check if a mobile number is already verified in the database
 */
const checkMobileVerificationHandler = async (req, res, next) => {
  try {
    const { mobile } = req.params;
    
    if (!mobile) {
      return sendError(res, 'Mobile number is required', 400);
    }
    
    // Normalize phone number
    const normalizedPhone = normalizeMobileNumber(mobile);
    const mobileNumber = normalizedPhone.replace(/^\+91/, '');
    
    if (mobileNumber.length !== 10 || !/^\d{10}$/.test(mobileNumber)) {
      return sendError(res, 'Invalid Indian mobile number', 400);
    }
    
    logger.info(`[OTP] Checking verification status for: ${mobileNumber}`);
    
    // Check if user exists with this mobile and is phone verified
    const user = await prisma.user.findUnique({
      where: { mobile: mobileNumber },
      select: {
        id: true,
        mobile: true,
        isPhoneVerified: true,
        role: true,
      },
    });
    
    if (user && user.isPhoneVerified) {
      logger.info(`[OTP] Mobile ${mobileNumber} is verified in database`);
      return sendSuccess(
        res,
        {
          verified: true,
          mobile: mobileNumber,
          userId: user.id,
        },
        'Mobile number is verified'
      );
    } else {
      logger.info(`[OTP] Mobile ${mobileNumber} is not verified in database`);
      return sendSuccess(
        res,
        {
          verified: false,
          mobile: mobileNumber,
        },
        'Mobile number is not verified'
      );
    }
  } catch (error) {
    logger.error('[OTP] Check verification error:', error);
    logger.error('[OTP] Error stack:', error.stack);
    
    return sendError(
      res,
      error.message || 'Failed to check verification status',
      500
    );
  }
};

/**
 * POST /api/auth/doctor/send-mobile-otp - Send mobile OTP for doctor login
 * Public route - sends OTP to doctor's mobile number
 */
const doctorSendMobileOtpLogin = async (req, res, next) => {
  try {
    const { mobile } = req.body;

    if (!mobile) {
      return sendError(res, 'Mobile number is required', 400);
    }

    const normalizedMobile = normalizeMobileNumber(mobile);
    const mobileWithoutPrefix = normalizedMobile.replace(/^\+91/, '');

    // Find doctor user with this mobile (search both formats)
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { mobile: normalizedMobile, role: 'DOCTOR' },
          { mobile: mobileWithoutPrefix, role: 'DOCTOR' },
        ],
      },
    });

    if (!user) {
      return sendError(res, 'No doctor account found with this mobile number', 404);
    }

    if (!user.isPhoneVerified) {
      return sendError(res, 'Mobile number not verified. Please complete your profile verification first.', 403);
    }

    if (user.approvalStatus === 'SUSPENDED') {
      return sendError(res, user.suspendedReason || 'Account is suspended', 403);
    }

    if (user.approvalStatus === 'REJECTED') {
      return sendError(res, user.rejectionReason || 'Account has been rejected', 403);
    }

    // Generate 6-digit OTP
    const testNumbers = (process.env.TEST_OTP_NUMBERS || '').split(',');
    const cleanMobile = normalizedMobile.replace(/\D/g, '').replace(/^91/, '');
    const isTestNumber = process.env.ENABLE_TEST_OTP === 'true' && testNumbers.includes(cleanMobile);
    
    // Use fixed OTP for test numbers, random for real numbers
    const otp = isTestNumber ? (process.env.TEST_OTP_CODE || '123456') : Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Hash OTP before storing
    const bcrypt = require('bcryptjs');
    const otpHash = await bcrypt.hash(otp, 10);

    // Store OTP hash in database (use the same format as stored in user table)
    await prisma.otpVerification.create({
      data: {
        mobile: user.mobile, // Use the exact mobile format from user record
        otpHash,
        expiresAt,
        purpose: 'LOGIN',
      },
    });

    // Send OTP via SMS (or log for test numbers)
    if (isTestNumber) {
      // Test number - just log OTP
      logger.info(`[DoctorLogin] 🧪 TEST MODE - OTP for ${normalizedMobile}: ${otp}`);
      console.log(`\n═══════════════════════════════════════`);
      console.log(`📱 DOCTOR LOGIN OTP`);
      console.log(`Mobile: ${normalizedMobile}`);
      console.log(`OTP: ${otp}`);
      console.log(`═══════════════════════════════════════\n`);
    } else {
      // Real number - send via Message Central SMS API
      try {
        const axios = require('axios');
        const authToken = await messageCentralService.generateAuthToken();
        
        const smsMessage = `Your PulseMate doctor login OTP is: ${otp}. Valid for 10 minutes. Do not share with anyone.`;
        
        // Message Central MessageNow SMS API
        const smsResponse = await axios.post(
          `${process.env.MESSAGE_CENTRAL_BASE_URL || 'https://cpaas.messagecentral.com'}/core/v1/sms`,
          {
            to: cleanMobile,
            message: smsMessage,
            type: 'TXN',
            countryCode: '91'
          },
          {
            headers: {
              'authToken': authToken,
              'Content-Type': 'application/json'
            },
            timeout: 15000
          }
        );

        if (smsResponse.data && smsResponse.data.responseCode === 200) {
          logger.info(`[DoctorLogin] ✅ SMS sent to ${normalizedMobile}`);
          console.log(`[DoctorLogin] ✓ SMS delivered successfully`);
        } else {
          throw new Error(`SMS API returned error: ${JSON.stringify(smsResponse.data)}`);
        }
      } catch (smsError) {
        logger.error(`[DoctorLogin] ❌ SMS send failed:`, {
          error: smsError.message,
          response: smsError.response?.data,
          status: smsError.response?.status
        });
        
        // Fallback: Log OTP for manual verification
        console.log(`\n⚠️  SMS SEND FAILED - Manual OTP for ${normalizedMobile}: ${otp}\n`);
      }
    }

    logger.info(`[DoctorLogin] Mobile OTP sent to ${normalizedMobile}`);

    return sendSuccess(res, {}, 'OTP sent to your mobile number');
  } catch (error) {
    logger.error('[DoctorLogin] Send mobile OTP error:', error);
    next(error);
  }
};

/**
 * POST /api/auth/doctor/verify-mobile-otp - Verify mobile OTP and login doctor
 * Public route - verifies OTP and issues auth tokens
 */
const doctorVerifyMobileOtpLogin = async (req, res, next) => {
  try {
    const { mobile, otp } = req.body;

    if (!mobile || !otp) {
      return sendError(res, 'Mobile number and OTP are required', 400);
    }

    const normalizedMobile = normalizeMobileNumber(mobile);
    const mobileWithoutPrefix = normalizedMobile.replace(/^\+91/, '');

    // Find doctor user (search both formats)
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { mobile: normalizedMobile, role: 'DOCTOR' },
          { mobile: mobileWithoutPrefix, role: 'DOCTOR' },
        ],
      },
      include: baseUserInclude,
    });

    if (!user) {
      return sendError(res, 'No doctor account found', 404);
    }

    // Find all valid OTP records for this mobile (search both formats)
    const otpRecords = await prisma.otpVerification.findMany({
      where: {
        OR: [
          { mobile: normalizedMobile },
          { mobile: mobileWithoutPrefix },
        ],
        purpose: 'LOGIN',
        isUsed: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecords || otpRecords.length === 0) {
      return sendError(res, 'Invalid or expired OTP', 400);
    }

    // Find matching OTP using bcrypt comparison
    const bcrypt = require('bcryptjs');
    let matchedOtpRecord = null;
    
    for (const record of otpRecords) {
      const isMatch = await bcrypt.compare(otp, record.otpHash);
      if (isMatch) {
        matchedOtpRecord = record;
        break;
      }
    }

    if (!matchedOtpRecord) {
      return sendError(res, 'Invalid or expired OTP', 400);
    }

    // Mark OTP as used
    await prisma.otpVerification.update({
      where: { id: matchedOtpRecord.id },
      data: { isUsed: true, verifiedAt: new Date() },
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Issue auth tokens
    const tokens = await issueAuthTokens(res, user, req);

    await createAuditLog({
      userId: user.id,
      action: 'DOCTOR_LOGIN_MOBILE_OTP',
      entityType: 'User',
      entityId: user.id,
      ipAddress: req.ip,
    });

    logger.info(`[DoctorLogin] Mobile OTP login successful for ${user.name}`);

    return sendSuccess(res, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: toAuthUser(user),
    }, 'Login successful');
  } catch (error) {
    logger.error('[DoctorLogin] Verify mobile OTP error:', error);
    next(error);
  }
};

/**
 * POST /api/auth/doctor/send-email-otp - Send email OTP for doctor login
 * Public route - sends OTP to doctor's email
 */
const doctorSendEmailOtpLogin = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return sendError(res, 'Email is required', 400);
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find doctor user with this email
    const user = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        role: 'DOCTOR',
      },
    });

    if (!user) {
      return sendError(res, 'No doctor account found with this email', 404);
    }

    if (!user.isEmailVerified) {
      return sendError(res, 'Email not verified. Please complete your profile verification first.', 403);
    }

    if (user.approvalStatus === 'SUSPENDED') {
      return sendError(res, user.suspendedReason || 'Account is suspended', 403);
    }

    if (user.approvalStatus === 'REJECTED') {
      return sendError(res, user.rejectionReason || 'Account has been rejected', 403);
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Hash OTP before storing
    const bcrypt = require('bcryptjs');
    const tokenHash = await bcrypt.hash(otp, 10);

    // Store OTP hash in database
    await prisma.emailVerification.create({
      data: {
        email: normalizedEmail,
        tokenHash,
        expiresAt,
        purpose: 'LOGIN',
      },
    });

    // Send OTP via email
    const testEmails = (process.env.TEST_OTP_EMAILS || '').split(',');
    
    if (process.env.ENABLE_TEST_OTP === 'true' && testEmails.includes(normalizedEmail)) {
      // Test email - just log OTP
      logger.info(`[DoctorLogin] 🧪 TEST MODE - OTP for ${normalizedEmail}: ${otp}`);
      console.log(`\n═══════════════════════════════════════`);
      console.log(`📧 DOCTOR LOGIN OTP`);
      console.log(`Email: ${normalizedEmail}`);
      console.log(`OTP: ${otp}`);
      console.log(`═══════════════════════════════════════\n`);
    } else {
      // Real email - send via email service
      try {
        const { sendEmailOtp } = require('../services/email.service');
        await sendEmailOtp(normalizedEmail, user.name, otp);
        logger.info(`[DoctorLogin] ✅ Email sent to ${normalizedEmail}`);
      } catch (emailError) {
        logger.error(`[DoctorLogin] ❌ Failed to send email:`, emailError.message);
        // Don't throw error - OTP is stored, user can still verify
        console.log(`\n⚠️  EMAIL FAILED - Manual OTP for ${normalizedEmail}: ${otp}\n`);
      }
    }

    logger.info(`[DoctorLogin] Email OTP sent to ${normalizedEmail}`);

    return sendSuccess(res, {}, 'OTP sent to your email address');
  } catch (error) {
    logger.error('[DoctorLogin] Send email OTP error:', error);
    next(error);
  }
};

/**
 * POST /api/auth/doctor/verify-email-otp - Verify email OTP and login doctor
 * Public route - verifies OTP and issues auth tokens
 */
const doctorVerifyEmailOtpLogin = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return sendError(res, 'Email and OTP are required', 400);
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find doctor user
    const user = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        role: 'DOCTOR',
      },
      include: baseUserInclude,
    });

    if (!user) {
      return sendError(res, 'No doctor account found', 404);
    }

    // Find all valid OTP records for this email
    const otpRecords = await prisma.emailVerification.findMany({
      where: {
        email: normalizedEmail,
        purpose: 'LOGIN',
        isUsed: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecords || otpRecords.length === 0) {
      return sendError(res, 'Invalid or expired OTP', 400);
    }

    // Find matching OTP using bcrypt comparison
    const bcrypt = require('bcryptjs');
    let matchedOtpRecord = null;
    
    for (const record of otpRecords) {
      const isMatch = await bcrypt.compare(otp, record.tokenHash);
      if (isMatch) {
        matchedOtpRecord = record;
        break;
      }
    }

    if (!matchedOtpRecord) {
      return sendError(res, 'Invalid or expired OTP', 400);
    }

    // Mark OTP as used
    await prisma.emailVerification.update({
      where: { id: matchedOtpRecord.id },
      data: { isUsed: true, verifiedAt: new Date() },
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Issue auth tokens
    const tokens = await issueAuthTokens(res, user, req);

    await createAuditLog({
      userId: user.id,
      action: 'DOCTOR_LOGIN_EMAIL_OTP',
      entityType: 'User',
      entityId: user.id,
      ipAddress: req.ip,
    });

    logger.info(`[DoctorLogin] Email OTP login successful for ${user.name}`);

    return sendSuccess(res, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: toAuthUser(user),
    }, 'Login successful');
  } catch (error) {
    logger.error('[DoctorLogin] Verify email OTP error:', error);
    next(error);
  }
};

module.exports = {
  // Firebase Phone Auth
  patientFirebasePhoneLoginHandler,
  clinicOwnerVerifyFirebasePhoneHandler,
  doctorVerifyFirebasePhoneHandler,
  
  // Check User Existence
  checkUserExistsHandler,
  // Message Central OTP Auth (NEW - for clinic onboarding)
  sendOtpHandler: sendOtpHandler_MessageCentral,
  verifyOtpHandler: verifyOtpHandler_MessageCentral,
  checkMobileVerificationHandler,
  
  // Email OTP Registration (Clinic Partner)
  sendRegistrationEmailOtp,
  verifyRegistrationEmailOtp,
  
  // Email Verification
  clinicOwnerSendEmailOtpHandler,
  clinicOwnerVerifyEmailOtpHandler,
  clinicOwnerSendEmailVerificationHandler: clinicOwnerSendEmailOtpHandler,
  clinicOwnerVerifyEmailHandler: clinicOwnerVerifyEmailOtpHandler,
  
  // ✅ NEW: Doctor OTP Login
  doctorSendMobileOtpLogin,
  doctorVerifyMobileOtpLogin,
  doctorSendEmailOtpLogin,
  doctorVerifyEmailOtpLogin,
  
  // Onboarding
  saveClinicOnboardingStep1Handler,
  saveServicesOperationsHandler,
  saveClinicDocumentsHandler,
  submitClinicApplicationHandler,
  getClinicOnboardingDataHandler,
  
  // Registration
  clinicOwnerUploadDocumentHandler,
  registerClinicOwnerHandler,
  registerDoctorHandler,
  
  // Password Login
  loginHandler,
  clinicOwnerLoginHandler: loginHandler,
  doctorLoginHandler: loginHandler,
  receptionistLoginHandler: loginHandler,
  adminLoginHandler: loginHandler,
  
  // Staff Management
  createReceptionistHandler,
  createAdminHandler,
  
  // Utilities
  lookupPincodeHandler,
  
  // Password Reset
  forgotPasswordHandler,
  resetPasswordHandler,
  verifyResetTokenHandler,
  
  // Token Management
  refreshTokenHandler,
  logoutHandler,
  logoutAllHandler,
  
  // User Info
  getMeHandler,
};
