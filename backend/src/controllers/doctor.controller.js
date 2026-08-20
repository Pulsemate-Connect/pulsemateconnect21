const prisma = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');
const { createAuditLog } = require('../services/audit.service');
const logger = require('../config/logger');

/**
 * GET /api/doctor/invitation/:token - Get invitation details by token
 * Public route - no authentication required
 */
const getInvitationByToken = async (req, res, next) => {
  try {
    const { token } = req.params;

    const invitation = await prisma.doctorInvitation.findUnique({
      where: { invitationToken: token },
      include: {
        clinic: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            state: true,
            phone: true,
          },
        },
        invitedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!invitation) {
      return sendError(res, 'Invalid invitation link', 404);
    }

    // Check if token expired
    if (new Date() > invitation.tokenExpiresAt) {
      // Update status to expired if not already
      if (invitation.status === 'INVITATION_SENT') {
        await prisma.doctorInvitation.update({
          where: { id: invitation.id },
          data: { status: 'INVITATION_EXPIRED' },
        });
      }
      return sendError(res, 'This invitation has expired', 410);
    }

    return sendSuccess(res, { invitation });
  } catch (error) {
    logger.error('[GetInvitation] Error:', error);
    next(error);
  }
};

/**
 * POST /api/doctor/invitation/:token/accept - Accept invitation and create user account
 * Public route - creates user account and sends OTP for verification
 */
const acceptInvitation = async (req, res, next) => {
  try {
    const { token } = req.params;

    const invitation = await prisma.doctorInvitation.findUnique({
      where: { invitationToken: token },
      include: {
        clinic: true,
      },
    });

    if (!invitation) {
      return sendError(res, 'Invalid invitation link', 404);
    }

    // Check if already accepted
    if (invitation.status === 'INVITATION_ACCEPTED') {
      return sendError(res, 'Invitation already accepted', 400);
    }

    // Check if declined
    if (invitation.status === 'INVITATION_DECLINED') {
      return sendError(res, 'This invitation was declined', 400);
    }

    // Check if expired
    if (new Date() > invitation.tokenExpiresAt || invitation.status === 'INVITATION_EXPIRED') {
      return sendError(res, 'This invitation has expired', 410);
    }

    // ✅ NEW: Create user account if doesn't exist
    let userId = invitation.doctorUserId;
    let userCreated = false;
    
    if (!userId) {
      // Check if user already exists with this mobile/email
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { mobile: invitation.doctorMobile },
            invitation.doctorEmail ? { email: invitation.doctorEmail.toLowerCase() } : undefined,
          ].filter(Boolean),
        },
      });

      if (existingUser) {
        // Link existing user to invitation
        userId = existingUser.id;
        
        // Update user role to DOCTOR if not already
        if (existingUser.role !== 'DOCTOR') {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { role: 'DOCTOR' },
          });
        }
      } else {
        // Create new user account
        const newUser = await prisma.user.create({
          data: {
            name: invitation.doctorName,
            mobile: invitation.doctorMobile,
            email: invitation.doctorEmail?.toLowerCase() || null,
            role: 'DOCTOR',
            approvalStatus: 'PENDING',
            isPhoneVerified: false, // ✅ MUST verify phone
            isEmailVerified: !invitation.doctorEmail, // Only require email verification if email exists
          },
        });
        userId = newUser.id;
        userCreated = true;
      }

      // Link user to invitation
      await prisma.doctorInvitation.update({
        where: { id: invitation.id },
        data: { doctorUserId: userId },
      });
    }

    // Update invitation status
    const updatedInvitation = await prisma.doctorInvitation.update({
      where: { id: invitation.id },
      data: {
        status: 'INVITATION_ACCEPTED',
        acceptedAt: new Date(),
      },
      include: {
        clinic: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            state: true,
          },
        },
      },
    });

    logger.info(`[AcceptInvitation] Doctor ${invitation.doctorName} accepted invitation from clinic ${invitation.clinic.name}${userCreated ? ' (new user created)' : ''}`);

    return sendSuccess(res, { 
      invitation: updatedInvitation,
      userId,
      requiresMobileVerification: true,
      requiresEmailVerification: !!invitation.doctorEmail,
    }, 'Invitation accepted successfully. Please verify your mobile and email.');
  } catch (error) {
    logger.error('[AcceptInvitation] Error:', error);
    next(error);
  }
};

/**
 * POST /api/doctor/invitation/:token/decline - Decline invitation
 */
const declineInvitation = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { reason } = req.body;

    const invitation = await prisma.doctorInvitation.findUnique({
      where: { invitationToken: token },
    });

    if (!invitation) {
      return sendError(res, 'Invalid invitation link', 404);
    }

    // Check if already processed
    if (invitation.status !== 'INVITATION_SENT' && invitation.status !== 'INVITATION_ACCEPTED') {
      return sendError(res, 'Invitation already processed', 400);
    }

    // Update invitation status
    await prisma.doctorInvitation.update({
      where: { id: invitation.id },
      data: {
        status: 'INVITATION_DECLINED',
        declinedAt: new Date(),
        declinedReason: reason || null,
      },
    });

    logger.info(`[DeclineInvitation] Doctor ${invitation.doctorName} declined invitation`);

    return sendSuccess(res, {}, 'Invitation declined');
  } catch (error) {
    logger.error('[DeclineInvitation] Error:', error);
    next(error);
  }
};

/**
 * GET /api/doctor/profile/by-token/:token - Get doctor profile by invitation token
 * Used to check if profile already exists and get current data
 */
const getDoctorProfileByToken = async (req, res, next) => {
  try {
    const { token } = req.params;

    const invitation = await prisma.doctorInvitation.findUnique({
      where: { invitationToken: token },
      include: {
        doctorProfile: true,
        clinic: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!invitation) {
      return sendError(res, 'Invalid invitation link', 404);
    }

    return sendSuccess(res, {
      invitation,
      profile: invitation.doctorProfile,
    });
  } catch (error) {
    logger.error('[GetDoctorProfile] Error:', error);
    next(error);
  }
};

/**
 * PUT /api/doctor/profile/:invitationToken - Update doctor profile
 * Public route - uses invitation token for authorization instead of JWT
 */
const updateDoctorProfile = async (req, res, next) => {
  try {
    const { invitationToken } = req.params;
    const formData = req.body;

    const invitation = await prisma.doctorInvitation.findUnique({
      where: { invitationToken },
      include: {
        doctorProfile: true,
      },
    });

    if (!invitation) {
      return sendError(res, 'Invalid invitation', 404);
    }

    // ✅ SECURITY: Enforce status - must be PROFILE_IN_PROGRESS or CREDENTIALS_PENDING or CHANGES_REQUIRED
    const allowedStatuses = ['PROFILE_IN_PROGRESS', 'CREDENTIALS_PENDING', 'CHANGES_REQUIRED'];
    if (!allowedStatuses.includes(invitation.status)) {
      return sendError(res, 'Profile editing not allowed in current status. Please complete verification steps first.', 403);
    }

    // Check if token expired
    if (new Date() > invitation.tokenExpiresAt) {
      return sendError(res, 'Invitation token has expired', 410);
    }

    // ✅ SECURITY: Verify mobile and email first
    const user = await prisma.user.findUnique({
      where: { id: invitation.doctorUserId },
    });

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    if (!user.isPhoneVerified) {
      return sendError(res, 'Please verify your mobile number first', 403);
    }

    if (invitation.doctorEmail && !user.isEmailVerified) {
      return sendError(res, 'Please verify your email address first', 403);
    }

    // Map form data to schema fields
    const profileData = {
      // Step 1: Personal Information
      fullLegalName: formData.fullLegalName,
      dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : null,
      gender: formData.gender,
      profilePhotoUrl: formData.profilePhotoUrl,
      
      // Step 2: Professional Information
      medicalSystem: formData.medicalSystem,
      qualification: formData.qualification,
      // Use custom value if "Other / Not Listed" was selected
      specialization: formData.specialization === 'Other / Not Listed' 
        ? formData.customSpecialization 
        : formData.specialization,
      // Only save registration number if it's not empty (to avoid unique constraint issues)
      medicalRegistrationNumber: formData.medicalRegistrationNumber || null,
      registrationAuthority: formData.registrationAuthority === 'Other / Not Listed'
        ? formData.customRegistrationAuthority
        : formData.registrationAuthority,
      registrationYear: formData.registrationYear ? parseInt(formData.registrationYear) : null,
      
      // Step 3: Documents (stored as JSON)
      certificates: formData.documents && formData.documents.length > 0 
        ? formData.documents 
        : null,
      
      // Step 4: Professional Profile
      experienceYears: formData.experienceYears ? parseInt(formData.experienceYears) : 0,
      languagesKnown: formData.languagesKnown || [],
      bio: formData.bio,
      consultationFee: formData.consultationFee ? parseFloat(formData.consultationFee) : null,
      areasOfExpertise: formData.areasOfExpertise || [],
      
      // Metadata
      lastEditedAt: new Date(),
    };

    // Remove null/undefined values
    Object.keys(profileData).forEach(key => {
      if (profileData[key] === undefined) {
        delete profileData[key];
      }
    });

    // Update or create doctor profile
    let profile;
    if (invitation.doctorProfileId) {
      // Update existing profile
      profile = await prisma.doctorProfile.update({
        where: { id: invitation.doctorProfileId },
        data: profileData,
      });
    } else {
      // Create new doctor profile
      profile = await prisma.doctorProfile.create({
        data: {
          userId: invitation.doctorUserId,
          invitationId: invitation.id,
          languagesKnown: [], // Default empty array
          profileStatus: 'INCOMPLETE',
          verificationStatus: 'NOT_VERIFIED',
          ...profileData,
        },
      });

      // Link profile to invitation
      await prisma.doctorInvitation.update({
        where: { id: invitation.id },
        data: {
          doctorProfileId: profile.id,
        },
      });
    }

    logger.info(`[UpdateProfile] Doctor profile updated for invitation ${invitation.id} (status: ${invitation.status})`);

    return sendSuccess(res, { profile }, 'Profile updated successfully');
  } catch (error) {
    logger.error('[UpdateProfile] Error:', error);
    
    // Handle Prisma unique constraint errors
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'field';
      return sendError(res, `This ${field} is already registered. Please use a different value.`, 409);
    }
    
    next(error);
  }
};

/**
 * POST /api/doctor/profile/:invitationToken/submit - Submit profile for verification
 * Public route - uses invitation token for authorization instead of JWT
 */
const submitProfileForVerification = async (req, res, next) => {
  try {
    const { invitationToken } = req.params;

    const invitation = await prisma.doctorInvitation.findUnique({
      where: { invitationToken },
      include: {
        doctorProfile: true,
      },
    });

    if (!invitation) {
      return sendError(res, 'Invalid invitation', 404);
    }

    // ✅ SECURITY: Enforce status - must be PROFILE_IN_PROGRESS or CHANGES_REQUIRED
    const allowedStatuses = ['PROFILE_IN_PROGRESS', 'CHANGES_REQUIRED'];
    if (!allowedStatuses.includes(invitation.status)) {
      return sendError(res, 'Profile submission not allowed in current status', 403);
    }

    // Check if token expired
    if (new Date() > invitation.tokenExpiresAt) {
      return sendError(res, 'Invitation token has expired', 410);
    }

    if (!invitation.doctorProfile) {
      return sendError(res, 'Profile not found. Please complete your profile first.', 404);
    }

    // ✅ SECURITY: Verify mobile and email first
    const user = await prisma.user.findUnique({
      where: { id: invitation.doctorUserId },
    });

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    if (!user.isPhoneVerified) {
      return sendError(res, 'Please verify your mobile number before submitting profile', 403);
    }

    if (invitation.doctorEmail && !user.isEmailVerified) {
      return sendError(res, 'Please verify your email address before submitting profile', 403);
    }

    // Validate required fields
    const profile = invitation.doctorProfile;
    const requiredFields = [
      'fullLegalName',
      'dateOfBirth',
      'gender',
      'medicalSystem',
      'qualification',
      'specialization',
      'medicalRegistrationNumber',
      'registrationAuthority',
      'registrationYear',
    ];

    const missingFields = requiredFields.filter((field) => !profile[field]);
    if (missingFields.length > 0) {
      return sendError(res, `Missing required fields: ${missingFields.join(', ')}`, 400);
    }

    // ✅ STATUS TRANSITION: PROFILE_IN_PROGRESS → VERIFICATION_PENDING
    await prisma.$transaction([
      prisma.doctorProfile.update({
        where: { id: profile.id },
        data: {
          profileStatus: 'COMPLETE',
          verificationStatus: 'PENDING',
          profileSubmittedAt: new Date(),
          profileCompletionPercentage: 100,
        },
      }),
      prisma.doctorInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'VERIFICATION_PENDING',
          submittedAt: new Date(),
        },
      }),
      // Update user approval status to pending
      prisma.user.update({
        where: { id: invitation.doctorUserId },
        data: {
          approvalStatus: 'PENDING',
        },
      }),
    ]);

    await createAuditLog({
      userId: invitation.doctorUserId,
      action: 'DOCTOR_PROFILE_SUBMITTED',
      entityType: 'DoctorProfile',
      entityId: profile.id,
      metadata: { invitationId: invitation.id },
      ipAddress: req.ip,
    });

    logger.info(`[SubmitProfile] ✅ Doctor profile submitted for verification: ${profile.id} - Status: PROFILE_IN_PROGRESS → VERIFICATION_PENDING`);

    return sendSuccess(res, {
      statusTransition: 'PROFILE_IN_PROGRESS → VERIFICATION_PENDING',
      nextStep: 'ADMIN_VERIFICATION'
    }, 'Profile submitted for verification successfully');
  } catch (error) {
    logger.error('[SubmitProfile] Error:', error);
    next(error);
  }
};

/**
 * POST /api/doctor/invitation/:token/send-mobile-otp - Send mobile OTP for verification
 * Public route - sends OTP to doctor's mobile number
 */
const sendMobileOtpForInvitation = async (req, res, next) => {
  try {
    const { token } = req.params;

    const invitation = await prisma.doctorInvitation.findUnique({
      where: { invitationToken: token },
    });

    if (!invitation || !invitation.doctorUserId) {
      return sendError(res, 'Invalid invitation or user not created', 404);
    }

    // ✅ SECURITY: Must be in INVITATION_ACCEPTED status to send mobile OTP
    if (invitation.status !== 'INVITATION_ACCEPTED') {
      return sendError(res, 'Invalid onboarding status. Please accept the invitation first.', 403);
    }

    const user = await prisma.user.findUnique({
      where: { id: invitation.doctorUserId },
    });

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    if (user.isPhoneVerified) {
      return sendError(res, 'Mobile number already verified', 400);
    }

    const testNumbers = (process.env.TEST_OTP_NUMBERS || '').split(',');
    const cleanMobile = user.mobile.replace(/\D/g, '').replace(/^91/, '');
    
    if (process.env.ENABLE_TEST_OTP === 'true' && testNumbers.includes(cleanMobile)) {
      // Test number - Generate and store custom OTP
      const otp = process.env.TEST_OTP_CODE || '123456';
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      const bcrypt = require('bcryptjs');
      const otpHash = await bcrypt.hash(otp, 10);

      await prisma.otpVerification.create({
        data: {
          mobile: user.mobile,
          otpHash,
          expiresAt,
          purpose: 'VERIFY_MOBILE',
        },
      });

      logger.info(`[SendMobileOTP] 🧪 TEST MODE - OTP for ${user.mobile}: ${otp}`);
      console.log(`\n═══════════════════════════════════════`);
      console.log(`📱 DOCTOR VERIFICATION OTP (TEST)`);
      console.log(`Mobile: ${user.mobile}`);
      console.log(`OTP: ${otp}`);
      console.log(`═══════════════════════════════════════\n`);
    } else {
      // Real number - Use Message Central VerifyNow OTP API
      try {
        const messageCentralService = require('../services/messagecentral.service');
        
        // Send OTP via Message Central (they generate and send it)
        const result = await messageCentralService.sendOTP(cleanMobile, 6);
        
        logger.info(`[SendMobileOTP] ✅ Message Central OTP sent to ${user.mobile}`);
        logger.info(`[SendMobileOTP] VerificationId: ${result.verificationId}, Timeout: ${result.timeout}s`);
        
        // Store verificationId in database for later validation
        await prisma.otpVerification.create({
          data: {
            mobile: user.mobile,
            otpHash: result.verificationId, // Store verificationId in otpHash field
            expiresAt: new Date(Date.now() + result.timeout * 1000),
            purpose: 'VERIFY_MOBILE',
          },
        });
        
        console.log(`[SendMobileOTP] ✓ OTP sent via Message Central to ${user.mobile}`);
      } catch (smsError) {
        logger.error(`[SendMobileOTP] ❌ Message Central OTP failed:`, {
          error: smsError.message,
          response: smsError.response?.data
        });
        
        // Fallback: Generate custom OTP and log it
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        const bcrypt = require('bcryptjs');
        const otpHash = await bcrypt.hash(otp, 10);

        await prisma.otpVerification.create({
          data: {
            mobile: user.mobile,
            otpHash,
            expiresAt,
            purpose: 'VERIFY_MOBILE',
          },
        });
        
        console.log(`\n⚠️  SMS FAILED - Manual OTP for ${user.mobile}: ${otp}`);
        console.log(`Error: ${smsError.message}\n`);
      }
    }

    logger.info(`[SendMobileOTP] OTP processed for ${user.mobile} (doctor ${user.name})`);

    return sendSuccess(res, {}, 'OTP sent to your mobile number');
  } catch (error) {
    logger.error('[SendMobileOTP] Error:', error);
    next(error);
  }
};

/**
 * POST /api/doctor/invitation/:token/verify-mobile-otp - Verify mobile OTP
 * Public route - verifies mobile number with OTP
 */
const verifyMobileOtpForInvitation = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { otp } = req.body;

    if (!otp || otp.length !== 6) {
      return sendError(res, 'Valid 6-digit OTP is required', 400);
    }

    const invitation = await prisma.doctorInvitation.findUnique({
      where: { invitationToken: token },
    });

    if (!invitation || !invitation.doctorUserId) {
      return sendError(res, 'Invalid invitation or user not created', 404);
    }

    // ✅ SECURITY: Enforce status - must be INVITATION_ACCEPTED
    if (invitation.status !== 'INVITATION_ACCEPTED') {
      return sendError(res, 'Invalid onboarding status. Please accept the invitation first.', 403);
    }

    const user = await prisma.user.findUnique({
      where: { id: invitation.doctorUserId },
    });

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Find valid OTP records (not used, not expired)
    const otpRecords = await prisma.otpVerification.findMany({
      where: {
        mobile: user.mobile,
        purpose: 'VERIFY_MOBILE',
        isUsed: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (otpRecords.length === 0) {
      return sendError(res, 'No valid OTP found. Please request a new OTP.', 400);
    }

    const bcrypt = require('bcryptjs');
    let validOtpRecord = null;
    let isMessageCentralOtp = false;

    // Check if otpHash looks like a Message Central verificationId (format: VN-...)
    if (otpRecords[0].otpHash && otpRecords[0].otpHash.startsWith('VN-')) {
      // This is a Message Central verification - validate with their API
      try {
        const messageCentralService = require('../services/messagecentral.service');
        const result = await messageCentralService.validateOTP(otpRecords[0].otpHash, otp);
        
        if (result.success && result.verificationStatus === 'VERIFICATION_COMPLETED') {
          validOtpRecord = otpRecords[0];
          isMessageCentralOtp = true;
          logger.info(`[VerifyMobileOTP] Message Central verification successful for ${user.mobile}`);
        }
      } catch (mcError) {
        logger.error(`[VerifyMobileOTP] Message Central verification failed:`, mcError.message);
        return sendError(res, mcError.message || 'Invalid OTP', 400);
      }
    } else {
      // Traditional bcrypt OTP - check against all valid records
      for (const record of otpRecords) {
        const isMatch = await bcrypt.compare(otp, record.otpHash);
        if (isMatch) {
          validOtpRecord = record;
          break;
        }
      }
    }

    if (!validOtpRecord) {
      return sendError(res, 'Invalid OTP', 400);
    }

    // Mark OTP as used and verify phone
    await prisma.$transaction([
      prisma.otpVerification.update({
        where: { id: validOtpRecord.id },
        data: { isUsed: true, verifiedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { isPhoneVerified: true },
      }),
    ]);

    logger.info(`[VerifyMobileOTP] ✅ Mobile verified for doctor ${user.name} - Status: INVITATION_ACCEPTED → (ready for email verification or profile)`);

    return sendSuccess(res, { 
      mobileVerified: true,
      nextStep: invitation.doctorEmail ? 'EMAIL_VERIFICATION' : 'PROFILE_COMPLETION'
    }, 'Mobile number verified successfully');
  } catch (error) {
    logger.error('[VerifyMobileOTP] Error:', error);
    next(error);
  }
};

/**
 * POST /api/doctor/invitation/:token/send-email-otp - Send email OTP for verification
 * Public route - sends OTP to doctor's email
 */
const sendEmailOtpForInvitation = async (req, res, next) => {
  try {
    const { token } = req.params;

    const invitation = await prisma.doctorInvitation.findUnique({
      where: { invitationToken: token },
    });

    if (!invitation || !invitation.doctorUserId) {
      return sendError(res, 'Invalid invitation or user not created', 404);
    }

    // ✅ SECURITY: Must be in INVITATION_ACCEPTED status
    if (invitation.status !== 'INVITATION_ACCEPTED') {
      return sendError(res, 'Invalid onboarding status. Please accept the invitation first.', 403);
    }

    const user = await prisma.user.findUnique({
      where: { id: invitation.doctorUserId },
    });

    if (!user || !user.email) {
      return sendError(res, 'User not found or email not provided', 404);
    }

    // ✅ SECURITY: Must verify mobile first
    if (!user.isPhoneVerified) {
      return sendError(res, 'Please verify your mobile number first', 403);
    }

    if (user.isEmailVerified) {
      return sendError(res, 'Email already verified', 400);
    }

    // ✅ TEST MODE: Check if this is a test email
    const isTestMode = process.env.ENABLE_TEST_OTP === 'true';
    const testEmails = (process.env.TEST_OTP_EMAILS || '').split(',');
    const isTestEmail = isTestMode && testEmails.includes(user.email);
    const testOtp = process.env.TEST_OTP_CODE || '123456';

    // Generate 6-digit OTP (use test OTP for test emails)
    const otp = isTestEmail ? testOtp : Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Hash OTP as token
    const bcrypt = require('bcryptjs');
    const tokenHash = await bcrypt.hash(otp, 10);

    // Store OTP hash in database
    await prisma.emailVerification.create({
      data: {
        email: user.email,
        tokenHash,
        expiresAt,
        purpose: 'EMAIL_VERIFICATION',
      },
    });

    // Send OTP via email (skip for test emails)
    if (!isTestEmail) {
      const { sendEmailOtp } = require('../services/email.service');
      await sendEmailOtp(user.email, user.name, otp);
    }

    if (isTestEmail) {
      logger.info(`[SendEmailOTP] 🧪 TEST MODE: Using test OTP for ${user.email}`);
    } else {
      logger.info(`[SendEmailOTP] OTP sent to ${user.email} for doctor ${user.name}`);
    }

    return sendSuccess(res, {}, 'OTP sent to your email address');
  } catch (error) {
    logger.error('[SendEmailOTP] Error:', error);
    next(error);
  }
};

/**
 * POST /api/doctor/invitation/:token/verify-email-otp - Verify email OTP
 * Public route - verifies email with OTP
 */
const verifyEmailOtpForInvitation = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { otp } = req.body;

    if (!otp || otp.length !== 6) {
      return sendError(res, 'Valid 6-digit OTP is required', 400);
    }

    const invitation = await prisma.doctorInvitation.findUnique({
      where: { invitationToken: token },
    });

    if (!invitation || !invitation.doctorUserId) {
      return sendError(res, 'Invalid invitation or user not created', 404);
    }

    // ✅ SECURITY: Enforce status - must be INVITATION_ACCEPTED
    if (invitation.status !== 'INVITATION_ACCEPTED') {
      return sendError(res, 'Invalid onboarding status. Please accept the invitation first.', 403);
    }

    const user = await prisma.user.findUnique({
      where: { id: invitation.doctorUserId },
    });

    if (!user || !user.email) {
      return sendError(res, 'User not found or email not provided', 404);
    }

    // ✅ SECURITY: Must verify mobile first
    if (!user.isPhoneVerified) {
      return sendError(res, 'Please verify your mobile number first', 403);
    }

    // Find valid OTP records (not used, not expired)
    const otpRecords = await prisma.emailVerification.findMany({
      where: {
        email: user.email,
        purpose: 'EMAIL_VERIFICATION',
        isUsed: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (otpRecords.length === 0) {
      return sendError(res, 'No valid OTP found. Please request a new OTP.', 400);
    }

    // Check OTP against all valid records
    const bcrypt = require('bcryptjs');
    let validOtpRecord = null;

    for (const record of otpRecords) {
      const isMatch = await bcrypt.compare(otp, record.tokenHash);
      if (isMatch) {
        validOtpRecord = record;
        break;
      }
    }

    if (!validOtpRecord) {
      return sendError(res, 'Invalid OTP', 400);
    }

    // ✅ STATUS TRANSITION: INVITATION_ACCEPTED → PROFILE_IN_PROGRESS (when both OTPs verified)
    await prisma.$transaction([
      prisma.emailVerification.update({
        where: { id: validOtpRecord.id },
        data: { isUsed: true, verifiedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { isEmailVerified: true },
      }),
      prisma.doctorInvitation.update({
        where: { id: invitation.id },
        data: { status: 'PROFILE_IN_PROGRESS' },
      }),
    ]);

    logger.info(`[VerifyEmailOTP] ✅ Email verified for doctor ${user.name} - Status: INVITATION_ACCEPTED → PROFILE_IN_PROGRESS`);

    return sendSuccess(res, { 
      emailVerified: true,
      nextStep: 'PROFILE_COMPLETION',
      statusTransition: 'INVITATION_ACCEPTED → PROFILE_IN_PROGRESS'
    }, 'Email verified successfully. You can now complete your profile.');
  } catch (error) {
    logger.error('[VerifyEmailOTP] Error:', error);
    next(error);
  }
};

/**
 * GET /api/doctor/invitation/:token/verification-status - Check verification status
 * Public route - checks if mobile and email are verified
 */
const getVerificationStatus = async (req, res, next) => {
  try {
    const { token } = req.params;

    const invitation = await prisma.doctorInvitation.findUnique({
      where: { invitationToken: token },
    });

    if (!invitation || !invitation.doctorUserId) {
      return sendError(res, 'Invalid invitation or user not created', 404);
    }

    const user = await prisma.user.findUnique({
      where: { id: invitation.doctorUserId },
      select: {
        isPhoneVerified: true,
        isEmailVerified: true,
        email: true,
        mobile: true,
      },
    });

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    const requiresEmailVerification = !!user.email;
    const allVerified = user.isPhoneVerified && (!requiresEmailVerification || user.isEmailVerified);

    return sendSuccess(res, {
      mobileVerified: user.isPhoneVerified,
      emailVerified: user.isEmailVerified,
      requiresEmailVerification,
      allVerified,
    });
  } catch (error) {
    logger.error('[GetVerificationStatus] Error:', error);
    next(error);
  }
};

module.exports = {
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
};
