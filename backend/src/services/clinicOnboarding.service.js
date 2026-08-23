/**
 * Clinic Onboarding Service
 * 
 * Centralized service for managing clinic owner registration/onboarding flow.
 * Ensures single user, single registration, consistent state.
 * 
 * @module services/clinicOnboarding
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../config/logger');

/**
 * Get or create clinic owner user after mobile verification
 * 
 * @param {string} mobile - Normalized mobile number (without +91)
 * @param {string} name - Owner name (optional)
 * @returns {Promise<Object>} User object
 */
async function getOrCreateClinicOwner(mobile, name = null) {
  logger.info(`[ClinicOnboarding] Getting or creating clinic owner for mobile: ${mobile}`);
  
  // Try to find existing user with this mobile
  let user = await prisma.user.findFirst({
    where: {
      mobile,
      role: 'CLINIC_OWNER',
    },
    select: {
      id: true,
      mobile: true,
      email: true,
      name: true,
      role: true,
      approvalStatus: true,
      isPhoneVerified: true,
      isEmailVerified: true,
      clinicOnboardingData: true,
      createdAt: true,
    },
  });

  if (user) {
    logger.info(`[ClinicOnboarding] Found existing clinic owner: ${user.id}`);
    
    // Update verification status if needed
    if (!user.isPhoneVerified) {
      logger.info(`[ClinicOnboarding] Updating phone verification for user: ${user.id}`);
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          isPhoneVerified: true,
          lastLoginAt: new Date(),
        },
        select: {
          id: true,
          mobile: true,
          email: true,
          name: true,
          role: true,
          approvalStatus: true,
          isPhoneVerified: true,
          isEmailVerified: true,
          clinicOnboardingData: true,
          createdAt: true,
        },
      });
    }

    return user;
  }

  // Create new clinic owner user
  logger.info(`[ClinicOnboarding] Creating new clinic owner for mobile: ${mobile}`);
  user = await prisma.user.create({
    data: {
      mobile,
      name: name || undefined,
      role: 'CLINIC_OWNER',
      approvalStatus: 'PENDING',
      isPhoneVerified: true,
      authProvider: 'OTP_ONBOARDING',
      lastLoginAt: new Date(),
      clinicOnboardingData: {
        registrationStartedAt: new Date().toISOString(),
        currentStep: 1,
        steps: {
          step1: { completed: false },
          step2: { completed: false },
          step3: { completed: false },
          step4: { completed: false },
        },
      },
    },
    select: {
      id: true,
      mobile: true,
      email: true,
      name: true,
      role: true,
      approvalStatus: true,
      isPhoneVerified: true,
      isEmailVerified: true,
      clinicOnboardingData: true,
      createdAt: true,
    },
  });

  logger.info(`[ClinicOnboarding] Created clinic owner: ${user.id}`);
  return user;
}

/**
 * Get registration state for authenticated user
 * 
 * @param {string} userId - Authenticated user ID
 * @returns {Promise<Object>} Registration state
 */
async function getRegistrationState(userId) {
  logger.info(`[ClinicOnboarding] Getting registration state for user: ${userId}`);
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      mobile: true,
      email: true,
      name: true,
      role: true,
      approvalStatus: true,
      isPhoneVerified: true,
      isEmailVerified: true,
      clinicOnboardingData: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.role !== 'CLINIC_OWNER') {
    throw new Error('User is not a clinic owner');
  }

  const onboardingData = user.clinicOnboardingData || {};
  
  return {
    userId: user.id,
    mobile: user.mobile,
    email: user.email,
    name: user.name,
    approvalStatus: user.approvalStatus,
    isPhoneVerified: user.isPhoneVerified,
    isEmailVerified: user.isEmailVerified,
    currentStep: onboardingData.currentStep || 1,
    steps: {
      step1: {
        completed: !!onboardingData.clinicInformation,
        data: onboardingData.clinicInformation || null,
      },
      step2: {
        completed: !!onboardingData.servicesOperations,
        data: onboardingData.servicesOperations || null,
      },
      step3: {
        completed: !!onboardingData.clinicDocuments,
        data: onboardingData.clinicDocuments || null,
      },
      step4: {
        completed: !!onboardingData.partnerAgreement,
        data: onboardingData.partnerAgreement || null,
      },
    },
    onboardingComplete: onboardingData.onboardingComplete || false,
    submittedAt: onboardingData.submittedAt || null,
  };
}

/**
 * Validate that the authenticated user owns this registration
 * 
 * @param {string} authenticatedUserId - User ID from JWT
 * @param {string} requestUserId - User ID from request (optional, for validation)
 * @returns {Promise<void>}
 * @throws {Error} If user mismatch detected
 */
async function validateUserOwnership(authenticatedUserId, requestUserId = null) {
  if (requestUserId && authenticatedUserId !== requestUserId) {
    logger.error(`[ClinicOnboarding] User mismatch: authenticated=${authenticatedUserId}, request=${requestUserId}`);
    throw new Error('Your registration session has changed. Please sign in again to continue this application.');
  }
}

/**
 * Save Step 1 data (Clinic Information)
 * 
 * @param {string} userId - Authenticated user ID
 * @param {Object} clinicInfoData - Step 1 data
 * @returns {Promise<Object>} Updated registration state
 */
async function saveStep1(userId, clinicInfoData) {
  logger.info(`[ClinicOnboarding] Saving Step 1 for user: ${userId}`);
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, clinicOnboardingData: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.role !== 'CLINIC_OWNER') {
    throw new Error('User is not a clinic owner');
  }

  const onboardingData = user.clinicOnboardingData || {};
  
  const updatedData = {
    ...onboardingData,
    clinicInformation: {
      ...clinicInfoData,
      completedAt: new Date().toISOString(),
    },
    currentStep: 2,
    lastUpdatedStep: 'clinicInformation',
    lastUpdatedAt: new Date().toISOString(),
    steps: {
      ...(onboardingData.steps || {}),
      step1: { completed: true, completedAt: new Date().toISOString() },
    },
  };

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: clinicInfoData.ownerName || user.name,
      email: clinicInfoData.ownerEmail || user.email,
      clinicOnboardingData: updatedData,
    },
  });

  logger.info(`[ClinicOnboarding] Step 1 saved for user: ${userId}`);
  
  return getRegistrationState(userId);
}

/**
 * Save Step 2 data (Services & Operations)
 * 
 * @param {string} userId - Authenticated user ID
 * @param {Object} servicesData - Step 2 data
 * @returns {Promise<Object>} Updated registration state
 */
async function saveStep2(userId, servicesData) {
  logger.info(`[ClinicOnboarding] Saving Step 2 for user: ${userId}`);
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, clinicOnboardingData: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.role !== 'CLINIC_OWNER') {
    throw new Error('User is not a clinic owner');
  }

  const onboardingData = user.clinicOnboardingData || {};
  
  // Validate Step 1 completed
  if (!onboardingData.clinicInformation) {
    throw new Error('Please complete Step 1: Clinic Information first');
  }

  const updatedData = {
    ...onboardingData,
    servicesOperations: {
      ...servicesData,
      completedAt: new Date().toISOString(),
    },
    currentStep: 3,
    lastUpdatedStep: 'servicesOperations',
    lastUpdatedAt: new Date().toISOString(),
    steps: {
      ...(onboardingData.steps || {}),
      step2: { completed: true, completedAt: new Date().toISOString() },
    },
  };

  await prisma.user.update({
    where: { id: userId },
    data: {
      clinicOnboardingData: updatedData,
    },
  });

  logger.info(`[ClinicOnboarding] Step 2 saved for user: ${userId}`);
  
  return getRegistrationState(userId);
}

/**
 * Save Step 3 data (Clinic Documents)
 * 
 * @param {string} userId - Authenticated user ID
 * @param {Object} documentsData - Step 3 data
 * @returns {Promise<Object>} Updated registration state
 */
async function saveStep3(userId, documentsData) {
  logger.info(`[ClinicOnboarding] Saving Step 3 for user: ${userId}`);
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, clinicOnboardingData: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.role !== 'CLINIC_OWNER') {
    throw new Error('User is not a clinic owner');
  }

  const onboardingData = user.clinicOnboardingData || {};
  
  // Validate Steps 1 and 2 completed
  if (!onboardingData.clinicInformation) {
    throw new Error('Please complete Step 1: Clinic Information first');
  }
  if (!onboardingData.servicesOperations) {
    throw new Error('Please complete Step 2: Services & Operations first');
  }

  const updatedData = {
    ...onboardingData,
    clinicDocuments: {
      ...documentsData,
      completedAt: new Date().toISOString(),
    },
    currentStep: 4,
    lastUpdatedStep: 'clinicDocuments',
    lastUpdatedAt: new Date().toISOString(),
    steps: {
      ...(onboardingData.steps || {}),
      step3: { completed: true, completedAt: new Date().toISOString() },
    },
  };

  await prisma.user.update({
    where: { id: userId },
    data: {
      clinicOnboardingData: updatedData,
    },
  });

  logger.info(`[ClinicOnboarding] Step 3 saved for user: ${userId}`);
  
  return getRegistrationState(userId);
}

/**
 * Validate all steps before final submission
 * 
 * @param {string} userId - Authenticated user ID
 * @returns {Promise<Object>} Validation result
 */
async function validateAllSteps(userId) {
  logger.info(`[ClinicOnboarding] Validating all steps for user: ${userId}`);
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      isPhoneVerified: true,
      isEmailVerified: true,
      clinicOnboardingData: true,
      approvalStatus: true,
    },
  });

  if (!user) {
    return { valid: false, error: 'User not found' };
  }

  if (user.role !== 'CLINIC_OWNER') {
    return { valid: false, error: 'User is not a clinic owner' };
  }

  if (!user.isPhoneVerified) {
    return { valid: false, error: 'Please verify your mobile number first' };
  }

  const onboardingData = user.clinicOnboardingData || {};

  if (!onboardingData.clinicInformation) {
    return { valid: false, error: 'Please complete Step 1: Clinic Information' };
  }

  if (!onboardingData.servicesOperations) {
    return { valid: false, error: 'Please complete Step 2: Services & Operations' };
  }

  if (!onboardingData.clinicDocuments) {
    return { valid: false, error: 'Please complete Step 3: Clinic Documents' };
  }

  if (onboardingData.onboardingComplete && onboardingData.submittedAt) {
    return { valid: false, error: 'This clinic application has already been submitted' };
  }

  return {
    valid: true,
    user,
    onboardingData,
  };
}

/**
 * Submit final application (Step 4)
 * 
 * @param {string} userId - Authenticated user ID
 * @param {Object} agreementData - Step 4 agreement data
 * @returns {Promise<Object>} Submission result
 */
async function submitApplication(userId, agreementData) {
  logger.info(`[ClinicOnboarding] Submitting application for user: ${userId}`);
  
  // Validate all steps
  const validation = await validateAllSteps(userId);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const { user, onboardingData } = validation;

  // Create partner agreement data
  const partnerAgreementData = {
    termsAccepted: agreementData.termsAccepted,
    confirmAuthorized: agreementData.confirmAuthorized,
    confirmAccurate: agreementData.confirmAccurate,
    confirmCompliance: agreementData.confirmCompliance,
    termsAcceptedAt: agreementData.termsAcceptedAt || new Date().toISOString(),
    agreementVersion: agreementData.agreementVersion || 'v1.0',
    completedAt: new Date().toISOString(),
  };

  // Update onboarding data with submission
  const updatedOnboardingData = {
    ...onboardingData,
    partnerAgreement: partnerAgreementData,
    currentStep: 4,
    lastUpdatedStep: 'partnerAgreement',
    lastUpdatedAt: new Date().toISOString(),
    onboardingComplete: true,
    submittedAt: new Date().toISOString(),
    steps: {
      ...(onboardingData.steps || {}),
      step4: { completed: true, completedAt: new Date().toISOString() },
    },
  };

  // Update user status
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      approvalStatus: 'PENDING',
      clinicOnboardingData: updatedOnboardingData,
    },
    select: {
      id: true,
      mobile: true,
      email: true,
      name: true,
      role: true,
      approvalStatus: true,
      clinicOnboardingData: true,
    },
  });

  logger.info(`[ClinicOnboarding] Application submitted for user: ${userId}`);
  
  return {
    success: true,
    userId: updatedUser.id,
    approvalStatus: updatedUser.approvalStatus,
    submittedAt: updatedOnboardingData.submittedAt,
  };
}

module.exports = {
  getOrCreateClinicOwner,
  getRegistrationState,
  validateUserOwnership,
  saveStep1,
  saveStep2,
  saveStep3,
  validateAllSteps,
  submitApplication,
};
