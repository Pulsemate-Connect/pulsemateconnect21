/**
 * Portal Authorization Service
 * 
 * Separates AUTHENTICATION from AUTHORIZATION
 * 
 * Core Principle:
 * - Authentication answers: "Who is this user?"
 * - Authorization answers: "What is this user allowed to access?"
 * 
 * A mobile number identifies ONE USER who may have MULTIPLE ROLES
 * and access to MULTIPLE PORTALS.
 */

const prisma = require('../config/database');
const logger = require('../config/logger');

/**
 * Get all portals that an authenticated user is authorized to access
 * @param {string} userId - The authenticated user's ID
 * @returns {Promise<Array>} Array of authorized portal names
 */
async function getUserAuthorizedPortals(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        doctorProfile: true,
        receptionistProfile: true,
        adminProfile: true,
        patientProfile: true,
        ownedClinics: {
          select: { id: true }
        }
      }
    });

    if (!user) {
      return [];
    }

    const portals = [];

    // Check PATIENT portal access
    if (user.role === 'PATIENT' || user.patientProfile) {
      portals.push({
        portal: 'PATIENT',
        displayName: 'Patient',
        icon: '👤',
        path: '/patient/dashboard'
      });
    }

    // Check DOCTOR portal access
    if (user.role === 'DOCTOR' || user.doctorProfile) {
      portals.push({
        portal: 'DOCTOR',
        displayName: 'Doctor',
        icon: '👨‍⚕️',
        path: '/doctor/dashboard'
      });
    }

    // Check CLINIC_OWNER portal access
    if (user.role === 'CLINIC_OWNER' || user.ownedClinics?.length > 0) {
      // Check if user has clinic onboarding data OR actual clinics
      const hasClinicData = user.clinicOnboardingData || user.ownedClinics?.length > 0;
      
      if (hasClinicData) {
        portals.push({
          portal: 'CLINIC_PARTNER',
          displayName: 'Clinic Partner',
          icon: '🏥',
          path: '/clinic/dashboard'
        });
      }
    }

    // Check RECEPTIONIST portal access
    if (user.role === 'RECEPTIONIST' || user.receptionistProfile) {
      portals.push({
        portal: 'RECEPTIONIST',
        displayName: 'Reception',
        icon: '📋',
        path: '/reception/dashboard'
      });
    }

    // Check ADMIN portal access
    if (user.role === 'SUPER_ADMIN' || user.adminProfile) {
      portals.push({
        portal: 'ADMIN',
        displayName: 'Admin',
        icon: '⚙️',
        path: '/admin/dashboard'
      });
    }

    logger.info(`[PortalAuth] User ${userId} has access to ${portals.length} portal(s): ${portals.map(p => p.portal).join(', ')}`);

    return portals;
  } catch (error) {
    logger.error('[PortalAuth] Error getting user portals:', error);
    return [];
  }
}

/**
 * Check if a user is authorized to access a specific portal
 * @param {string} userId - The authenticated user's ID
 * @param {string} requestedPortal - The portal being accessed (PATIENT, DOCTOR, CLINIC_PARTNER, RECEPTIONIST, ADMIN)
 * @returns {Promise<Object>} { authorized: boolean, reason?: string }
 */
async function checkPortalAuthorization(userId, requestedPortal) {
  try {
    const portals = await getUserAuthorizedPortals(userId);
    const authorized = portals.some(p => p.portal === requestedPortal);

    if (authorized) {
      logger.info(`[PortalAuth] User ${userId} authorized for ${requestedPortal}`);
      return { authorized: true };
    } else {
      logger.warn(`[PortalAuth] User ${userId} NOT authorized for ${requestedPortal}. Available: ${portals.map(p => p.portal).join(', ')}`);
      return { 
        authorized: false, 
        reason: 'You do not have access to this portal.',
        availablePortals: portals
      };
    }
  } catch (error) {
    logger.error('[PortalAuth] Error checking portal authorization:', error);
    return { 
      authorized: false, 
      reason: 'Unable to verify portal access.' 
    };
  }
}

/**
 * Check if a user can access clinic partner functionality
 * This is called AFTER authentication, not during
 * @param {string} userId - The authenticated user's ID
 * @returns {Promise<Object>} { canAccess: boolean, reason?: string, shouldOnboard?: boolean }
 */
async function checkClinicPartnerAccess(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        ownedClinics: {
          select: { 
            id: true, 
            approvalStatus: true 
          }
        }
      }
    });

    if (!user) {
      return { canAccess: false, reason: 'User not found' };
    }

    // Check if user is CLINIC_OWNER or has clinic onboarding data
    const isClinicOwner = user.role === 'CLINIC_OWNER';
    const hasOnboardingData = user.clinicOnboardingData !== null;
    const hasClinics = user.ownedClinics && user.ownedClinics.length > 0;

    // Case 1: User has completed clinics
    if (hasClinics) {
      return { 
        canAccess: true, 
        hasActiveClinics: true,
        clinics: user.ownedClinics
      };
    }

    // Case 2: User has onboarding data (in progress or submitted)
    if (hasOnboardingData) {
      const onboardingData = user.clinicOnboardingData;
      const isComplete = onboardingData.onboardingComplete === true;
      
      return { 
        canAccess: true, 
        shouldContinueOnboarding: !isComplete,
        onboardingData: onboardingData
      };
    }

    // Case 3: User is CLINIC_OWNER but has no data (can start onboarding)
    if (isClinicOwner) {
      return { 
        canAccess: true, 
        shouldOnboard: true 
      };
    }

    // Case 4: User is not clinic owner and has no clinic data
    // BUT - they might be a SUPER_ADMIN or other role trying to test
    // Allow access but indicate they need to start onboarding
    return { 
      canAccess: true, 
      shouldOnboard: true,
      message: 'You can start clinic partner registration'
    };
  } catch (error) {
    logger.error('[PortalAuth] Error checking clinic partner access:', error);
    return { canAccess: false, reason: 'Unable to verify access' };
  }
}

/**
 * Middleware: Require portal authorization AFTER authentication
 * Use this on routes that need specific portal access
 * 
 * @param {string} requiredPortal - The portal required (PATIENT, DOCTOR, CLINIC_PARTNER, etc.)
 * @returns {Function} Express middleware
 */
function requirePortalAccess(requiredPortal) {
  return async (req, res, next) => {
    try {
      // User must already be authenticated (req.user populated by authenticateUser middleware)
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const result = await checkPortalAuthorization(req.user.id, requiredPortal);

      if (result.authorized) {
        // User is authorized - continue
        req.authorizedPortal = requiredPortal;
        return next();
      } else {
        // User is authenticated but NOT authorized for this portal
        // Return 403 Forbidden with neutral message
        return res.status(403).json({
          success: false,
          message: result.reason || 'You do not have access to this portal.',
          availablePortals: result.availablePortals?.map(p => ({
            portal: p.portal,
            displayName: p.displayName,
            path: p.path
          }))
        });
      }
    } catch (error) {
      logger.error('[PortalAuth] requirePortalAccess middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Unable to verify portal access'
      });
    }
  };
}

module.exports = {
  getUserAuthorizedPortals,
  checkPortalAuthorization,
  checkClinicPartnerAccess,
  requirePortalAccess
};
