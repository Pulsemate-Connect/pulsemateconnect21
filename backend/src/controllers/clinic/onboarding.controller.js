'use strict';

const prisma = require('../../config/database');
const { sendSuccess, sendError } = require('../../utils/response');

/**
 * POST /api/clinic/onboarding/step1
 * Save Step 1: Clinic Information
 */
const saveStep1 = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      clinicName,
      clinicType,
      clinicTypeOther,
      displayName,
      ownerName,
      ownerEmail,
      ownerMobile,
      mobileVerified,
      primaryContactPhone,
      sameAsOwner,
      latitude,
      longitude,
      addressLine1,
      addressLine2,
      landmark,
      city,
      state,
      pincode,
      country,
    } = req.body;

    // Validation
    if (!clinicName || !clinicType || !ownerName || !ownerEmail || !ownerMobile) {
      return sendError(res, 'Required fields missing', 400);
    }

    if (!mobileVerified) {
      return sendError(res, 'Please verify your mobile number before proceeding', 400);
    }

    if (!latitude || !longitude) {
      return sendError(res, 'Please select your clinic location on the map', 400);
    }

    if (!addressLine1 || !addressLine2 || !city || !state || !pincode) {
      return sendError(res, 'Complete address is required', 400);
    }

    // Update user details
    await prisma.user.update({
      where: { id: userId },
      data: {
        name: ownerName,
        email: ownerEmail,
        mobile: ownerMobile,
        isPhoneVerified: mobileVerified,
      },
    });

    // Check if clinic already exists for this owner
    let clinic = await prisma.clinic.findFirst({
      where: { ownerId: userId },
    });

    // Build full address from components
    const fullAddress = [addressLine1, addressLine2, landmark, city, state, pincode]
      .filter(Boolean)
      .join(', ');

    const clinicData = {
      name: clinicName,
      clinicType: clinicType === 'OTHER' ? clinicTypeOther : clinicType,
      clinicTypeOther: clinicType === 'OTHER' ? clinicTypeOther : null,
      phone: sameAsOwner ? ownerMobile : primaryContactPhone,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      address: fullAddress,
      landmark: landmark || null,
      city,
      state,
      pincode,
      approvalStatus: 'PENDING',
      isActive: false, // Inactive until approved
      submittedAt: new Date(),
    };

    if (clinic) {
      // Update existing clinic
      clinic = await prisma.clinic.update({
        where: { id: clinic.id },
        data: clinicData,
      });
    } else {
      // Create new clinic
      clinic = await prisma.clinic.create({
        data: {
          ...clinicData,
          ownerId: userId,
        },
      });
    }

    // Create or update clinic owner profile
    await prisma.clinicOwnerProfile.upsert({
      where: { userId },
      create: {
        userId,
        primaryClinicId: clinic.id,
        profileCompleted: false, // Will be true after all steps
      },
      update: {
        primaryClinicId: clinic.id,
      },
    });

    return sendSuccess(
      res,
      {
        clinicId: clinic.id,
        onboardingStep: 1,
        clinic,
      },
      'Step 1 completed successfully'
    );
  } catch (error) {
    console.error('[saveStep1] Error:', error);
    next(error);
  }
};

/**
 * GET /api/clinic/onboarding/progress
 * Get current onboarding progress
 */
const getProgress = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get clinic owner profile
    const ownerProfile = await prisma.clinicOwnerProfile.findUnique({
      where: { userId },
      include: {
        primaryClinic: true,
      },
    });

    if (!ownerProfile) {
      return sendSuccess(res, {
        currentStep: 1,
        completedSteps: [],
        clinicData: null,
        profileCompleted: false,
      });
    }

    const clinic = ownerProfile.primaryClinic;

    // Determine current step based on data completeness
    let currentStep = 1;
    const completedSteps = [];

    // Step 1: Clinic Information
    if (clinic && clinic.name && clinic.latitude && clinic.longitude && clinic.address) {
      completedSteps.push(1);
      currentStep = 2;
    }

    // Step 2: Services & Operations (future)
    // if (clinic.openingTime && clinic.closingTime) {
    //   completedSteps.push(2);
    //   currentStep = 3;
    // }

    // Step 3: Documents (future)
    // if (clinic.licenseDocumentUrl) {
    //   completedSteps.push(3);
    //   currentStep = 4;
    // }

    return sendSuccess(res, {
      currentStep,
      completedSteps,
      clinicData: clinic,
      profileCompleted: ownerProfile.profileCompleted,
    });
  } catch (error) {
    console.error('[getProgress] Error:', error);
    next(error);
  }
};

/**
 * POST /api/clinic/onboarding/save-progress
 * Auto-save partial progress
 */
const saveProgress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { step, data } = req.body;

    // For now, we just acknowledge the save
    // In production, you might want to store partial data in a separate table

    return sendSuccess(res, { saved: true }, 'Progress saved');
  } catch (error) {
    console.error('[saveProgress] Error:', error);
    next(error);
  }
};

/**
 * GET /api/clinic/onboarding/resume
 * Resume onboarding from saved progress
 */
const resumeOnboarding = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const ownerProfile = await prisma.clinicOwnerProfile.findUnique({
      where: { userId },
      include: {
        primaryClinic: true,
        user: true,
      },
    });

    if (!ownerProfile || !ownerProfile.primaryClinic) {
      return sendSuccess(res, {
        hasProgress: false,
        currentStep: 1,
      });
    }

    const clinic = ownerProfile.primaryClinic;
    const user = ownerProfile.user;

    // Parse address back into components if possible
    const addressParts = clinic.address ? clinic.address.split(', ') : [];
    const addressLine1 = addressParts[0] || '';
    const addressLine2 = addressParts[1] || '';

    // Reconstruct Step 1 data
    const step1Data = {
      clinicName: clinic.name,
      clinicType: clinic.clinicType,
      clinicTypeOther: clinic.clinicTypeOther,
      displayName: clinic.displayName,
      ownerName: user.name,
      ownerEmail: user.email,
      ownerMobile: user.mobile,
      mobileVerified: user.isPhoneVerified,
      primaryContactPhone: clinic.phone,
      sameAsOwner: clinic.phone === user.mobile,
      latitude: clinic.latitude,
      longitude: clinic.longitude,
      addressLine1,
      addressLine2,
      landmark: clinic.landmark,
      city: clinic.city,
      state: clinic.state,
      pincode: clinic.pincode,
      country: 'India',
    };

    return sendSuccess(res, {
      hasProgress: true,
      currentStep: clinic.approvalStatus === 'VERIFIED' ? 4 : 1,
      step1Data,
      clinic,
    });
  } catch (error) {
    console.error('[resumeOnboarding] Error:', error);
    next(error);
  }
};

module.exports = {
  saveStep1,
  getProgress,
  saveProgress,
  resumeOnboarding,
};
