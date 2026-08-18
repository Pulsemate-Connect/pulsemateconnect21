/**
 * Doctor Onboarding Middleware - Strict Sequential Flow Enforcement
 * 
 * This middleware enforces the sequential onboarding flow and prevents step skipping.
 * It validates:
 * - Authentication (JWT token)
 * - Role (DOCTOR)
 * - Invitation ownership
 * - Current onboarding status
 * - Permission to access requested step
 */

const prisma = require('../config/database');
const logger = require('../config/logger');

/**
 * Onboarding Status Hierarchy
 * Each status allows access to specific routes only
 */
const ONBOARDING_FLOW = {
  // Invitation accepted, needs to verify mobile
  INVITATION_ACCEPTED: {
    allowedRoutes: ['/invitation/:token/send-mobile-otp', '/invitation/:token/verify-mobile-otp'],
    nextStep: 'MOBILE_VERIFICATION',
    message: 'Please verify your mobile number to continue'
  },
  
  // Mobile verified, needs to verify email
  MOBILE_VERIFIED: {
    allowedRoutes: ['/invitation/:token/send-email-otp', '/invitation/:token/verify-email-otp'],
    nextStep: 'EMAIL_VERIFICATION',
    message: 'Please verify your email address to continue'
  },
  
  // Both verified, needs to complete profile
  PROFILE_IN_PROGRESS: {
    allowedRoutes: ['/profile', '/profile/update', '/profile/submit'],
    nextStep: 'PROFILE_COMPLETION',
    message: 'Please complete your professional profile'
  },
  
  // Profile completed, needs to submit credentials
  CREDENTIALS_PENDING: {
    allowedRoutes: ['/credentials', '/credentials/upload', '/credentials/submit'],
    nextStep: 'CREDENTIALS_SUBMISSION',
    message: 'Please submit your professional credentials and documents'
  },
  
  // Credentials submitted, waiting for admin verification
  VERIFICATION_PENDING: {
    allowedRoutes: ['/verification/status', '/profile'], // Read-only profile access
    nextStep: 'ADMIN_VERIFICATION',
    message: 'Your credentials are under review by PulseMate admin'
  },
  
  // Admin requested changes
  CHANGES_REQUIRED: {
    allowedRoutes: ['/profile', '/profile/update', '/credentials', '/credentials/upload', '/credentials/resubmit'],
    nextStep: 'RESUBMISSION',
    message: 'Admin has requested changes. Please update and resubmit'
  },
  
  // Admin rejected
  REJECTED: {
    allowedRoutes: ['/verification/status'],
    nextStep: 'BLOCKED',
    message: 'Your application was rejected. Please contact support'
  },
  
  // Admin verified, can access clinic
  VERIFIED: {
    allowedRoutes: ['/dashboard', '/appointments', '/queue', '/profile', '/schedule'],
    nextStep: 'CLINIC_ACCESS',
    message: 'Welcome! You have full clinic access'
  }
};

/**
 * Get doctor's current onboarding status
 */
async function getDoctorOnboardingStatus(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        doctorProfile: {
          include: {
            invitation: true
          }
        },
        receivedInvitations: {
          where: {
            status: {
              in: ['INVITATION_ACCEPTED', 'PROFILE_IN_PROGRESS', 'VERIFICATION_PENDING', 'CHANGES_REQUIRED', 'VERIFIED', 'REJECTED']
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!user) {
      return { status: null, invitation: null, profile: null };
    }

    // Get the active invitation
    const invitation = user.receivedInvitations[0] || user.doctorProfile?.invitation;
    
    if (!invitation) {
      return { status: null, invitation: null, profile: user.doctorProfile };
    }

    // Determine exact onboarding status based on invitation and profile state
    let onboardingStatus = invitation.status;

    // Refine status based on verification states
    if (invitation.status === 'INVITATION_ACCEPTED') {
      if (!user.isPhoneVerified) {
        onboardingStatus = 'INVITATION_ACCEPTED'; // Need mobile verification
      } else if (!user.isEmailVerified) {
        onboardingStatus = 'MOBILE_VERIFIED'; // Need email verification
      } else {
        onboardingStatus = 'PROFILE_IN_PROGRESS'; // Ready for profile
      }
    }

    // Check if credentials are pending
    if (invitation.status === 'PROFILE_IN_PROGRESS' && user.doctorProfile?.profileSubmittedAt) {
      onboardingStatus = 'CREDENTIALS_PENDING';
    }

    return {
      status: onboardingStatus,
      invitation,
      profile: user.doctorProfile,
      user
    };
  } catch (error) {
    logger.error('[DoctorOnboarding] Error getting status:', error);
    throw error;
  }
}

/**
 * Check if route is allowed for current onboarding status
 */
function isRouteAllowed(currentStatus, requestedRoute) {
  const statusConfig = ONBOARDING_FLOW[currentStatus];
  
  if (!statusConfig) {
    return false;
  }

  // Check if requested route matches any allowed pattern
  return statusConfig.allowedRoutes.some(allowedRoute => {
    // Simple pattern matching (you can enhance this with regex)
    const pattern = allowedRoute.replace(':token', '[^/]+');
    const regex = new RegExp(`^${pattern}$`);
    return regex.test(requestedRoute);
  });
}

/**
 * Get correct route for current status
 */
function getCorrectRouteForStatus(status, invitationToken) {
  const statusConfig = ONBOARDING_FLOW[status];
  
  if (!statusConfig || !statusConfig.allowedRoutes.length) {
    return '/doctor/login';
  }

  // Return first allowed route (primary route for this status)
  const route = statusConfig.allowedRoutes[0];
  return route.replace(':token', invitationToken);
}

/**
 * Middleware: Require Authentication
 */
const requireAuth = (req, res, next) => {
  if (!req.user || !req.user.id) {
    logger.warn('[DoctorOnboarding] Unauthorized access attempt');
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }
  next();
};

/**
 * Middleware: Require Doctor Role
 */
const requireDoctorRole = async (req, res, next) => {
  try {
    if (req.user.role !== 'DOCTOR') {
      logger.warn(`[DoctorOnboarding] Non-doctor access attempt: ${req.user.role}`);
      return res.status(403).json({
        success: false,
        message: 'This route is only accessible to doctors',
        code: 'ROLE_FORBIDDEN'
      });
    }
    next();
  } catch (error) {
    logger.error('[DoctorOnboarding] Role check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error validating role',
      code: 'ROLE_CHECK_ERROR'
    });
  }
};

/**
 * Middleware: Enforce Onboarding Step
 * Validates that the doctor is at the correct onboarding step for the requested route
 */
const enforceOnboardingStep = (requiredStatus) => {
  return async (req, res, next) => {
    try {
      // Get doctor's current onboarding status
      const { status, invitation, profile, user } = await getDoctorOnboardingStatus(req.user.id);

      logger.info(`[DoctorOnboarding] User ${req.user.id} status: ${status}, required: ${requiredStatus}`);

      // If no invitation found
      if (!invitation) {
        logger.warn(`[DoctorOnboarding] No invitation found for user ${req.user.id}`);
        return res.status(404).json({
          success: false,
          message: 'No active invitation found',
          code: 'NO_INVITATION'
        });
      }

      // Check if current status matches required status
      if (status !== requiredStatus) {
        const correctRoute = getCorrectRouteForStatus(status, invitation.invitationToken);
        const statusConfig = ONBOARDING_FLOW[status];

        logger.warn(`[DoctorOnboarding] Status mismatch: current=${status}, required=${requiredStatus}`);

        return res.status(403).json({
          success: false,
          message: statusConfig?.message || 'You cannot access this step yet',
          code: 'STEP_NOT_ALLOWED',
          currentStatus: status,
          requiredStatus: requiredStatus,
          correctRoute: correctRoute,
          nextStep: statusConfig?.nextStep
        });
      }

      // Attach onboarding data to request for controller use
      req.onboarding = {
        status,
        invitation,
        profile,
        user
      };

      next();
    } catch (error) {
      logger.error('[DoctorOnboarding] Enforcement error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error validating onboarding status',
        code: 'ONBOARDING_CHECK_ERROR'
      });
    }
  };
};

/**
 * Middleware: Validate Invitation Token Ownership
 * Ensures the authenticated user owns the invitation token in the URL
 */
const validateInvitationOwnership = async (req, res, next) => {
  try {
    // Support both 'token' and 'invitationToken' parameter names
    const { token, invitationToken } = req.params;
    const tokenValue = token || invitationToken;
    
    if (!tokenValue) {
      return res.status(400).json({
        success: false,
        message: 'Invitation token required',
        code: 'TOKEN_REQUIRED'
      });
    }

    // Find invitation
    const invitation = await prisma.doctorInvitation.findUnique({
      where: { invitationToken: tokenValue }
    });

    if (!invitation) {
      logger.warn(`[DoctorOnboarding] Invalid invitation token: ${tokenValue}`);
      return res.status(404).json({
        success: false,
        message: 'Invalid invitation link',
        code: 'INVALID_TOKEN'
      });
    }

    // Check expiration
    if (new Date() > invitation.tokenExpiresAt) {
      logger.warn(`[DoctorOnboarding] Expired invitation: ${tokenValue}`);
      return res.status(410).json({
        success: false,
        message: 'This invitation has expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    // Validate ownership (if user is authenticated)
    if (req.user && req.user.id) {
      if (invitation.doctorUserId && invitation.doctorUserId !== req.user.id) {
        logger.warn(`[DoctorOnboarding] Invitation ownership mismatch: token=${tokenValue}, user=${req.user.id}`);
        return res.status(403).json({
          success: false,
          message: 'This invitation does not belong to you',
          code: 'OWNERSHIP_MISMATCH'
        });
      }
    }

    // Attach invitation to request
    req.invitation = invitation;
    next();
  } catch (error) {
    logger.error('[DoctorOnboarding] Invitation validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error validating invitation',
      code: 'VALIDATION_ERROR'
    });
  }
};

/**
 * Get onboarding status endpoint
 * This is called by frontend on every protected page load
 */
const getOnboardingStatus = async (req, res, next) => {
  try {
    const { status, invitation, profile } = await getDoctorOnboardingStatus(req.user.id);

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'No active invitation found',
        code: 'NO_INVITATION'
      });
    }

    const statusConfig = ONBOARDING_FLOW[status];
    const correctRoute = getCorrectRouteForStatus(status, invitation.invitationToken);

    return res.status(200).json({
      success: true,
      data: {
        authenticated: true,
        userId: req.user.id,
        role: req.user.role,
        onboardingStatus: status,
        invitationToken: invitation.invitationToken,
        clinicId: invitation.clinicId,
        nextStep: statusConfig?.nextStep,
        message: statusConfig?.message,
        correctRoute: correctRoute,
        allowedRoutes: statusConfig?.allowedRoutes || [],
        profileCompletionPercentage: profile?.profileCompletionPercentage || 0,
        canAccessClinic: status === 'VERIFIED'
      }
    });
  } catch (error) {
    logger.error('[DoctorOnboarding] Get status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching onboarding status',
      code: 'STATUS_ERROR'
    });
  }
};

module.exports = {
  requireAuth,
  requireDoctorRole,
  enforceOnboardingStep,
  validateInvitationOwnership,
  getDoctorOnboardingStatus,
  getOnboardingStatus,
  isRouteAllowed,
  getCorrectRouteForStatus,
  ONBOARDING_FLOW
};
