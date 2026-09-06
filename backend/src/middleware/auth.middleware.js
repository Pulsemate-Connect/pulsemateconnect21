const prisma = require('../config/database');
const { verifyAccessToken } = require('../services/token.service');
const { validateSession } = require('../services/session.service');
const { SESSION_COOKIE_NAME } = require('../utils/cookies');
const { sendError } = require('../utils/response');

const includeUserProfile = {
  adminProfile: true,
  doctorProfile: true,
  receptionistProfile: {
    include: {
      assignedClinic: true,
    },
  },
  ownedClinics: true,
};

// ✅ PERFORMANCE: Simple in-memory user cache to reduce database lookups
// Cache expires after 5 minutes
const userCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedUser(userId) {
  const cached = userCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.user;
  }
  return null;
}

function setCachedUser(userId, user) {
  userCache.set(userId, {
    user,
    timestamp: Date.now()
  });
  
  // Auto-cleanup after TTL
  setTimeout(() => {
    userCache.delete(userId);
  }, CACHE_TTL);
}

// Clear cache every 10 minutes to prevent memory bloat
setInterval(() => {
  const now = Date.now();
  for (const [userId, cached] of userCache.entries()) {
    if (now - cached.timestamp >= CACHE_TTL) {
      userCache.delete(userId);
    }
  }
}, 10 * 60 * 1000);

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PRODUCTION AUTHENTICATION MIDDLEWARE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Dual authentication system:
 * 1. Web browsers: Session cookie (primary, most secure)
 * 2. Mobile apps: JWT Bearer token (backward compatible)
 * 
 * Priority: Cookie session > JWT Bearer token
 * 
 * Security features:
 * - HttpOnly session cookies (XSS protection)
 * - Session validation with expiration and idle timeout
 * - Server-side session revocation
 * - User cache for performance
 * - Account status validation
 */
const authenticateUser = async (req, res, next) => {
  try {
    let user = null;
    let authSource = null;
    let sessionInfo = null;
    
    // ─────────────────────────────────────────────────────────────────────────
    // PRIORITY 1: Session Cookie (Web Browsers - Most Secure)
    // ─────────────────────────────────────────────────────────────────────────
    const sessionToken = req.cookies?.[SESSION_COOKIE_NAME];
    
    if (sessionToken) {
      const session = await validateSession(sessionToken);
      
      if (session && session.user) {
        user = session.user;
        authSource = 'SESSION_COOKIE';
        sessionInfo = {
          sessionId: session.id,
          authRole: session.authRole,
          loginMethod: session.loginMethod,
          createdAt: session.createdAt,
          lastActivityAt: session.lastActivityAt,
        };
        
        // Store session ID in request for logout/revocation
        req.sessionId = session.id;
      }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // PRIORITY 2: JWT Bearer Token (Mobile Apps - Backward Compatible)
    // ─────────────────────────────────────────────────────────────────────────
    if (!user) {
      const authHeader = req.headers.authorization;
      
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        const decoded = verifyAccessToken(token);
        
        // ✅ PERFORMANCE: Try cache first
        user = getCachedUser(decoded.sub);
        
        if (!user) {
          // Cache miss - fetch from database
          user = await prisma.user.findUnique({
            where: { id: decoded.sub },
            include: includeUserProfile,
          });
          
          if (user) {
            // Store in cache for future requests
            setCachedUser(decoded.sub, user);
          }
        }
        
        authSource = 'JWT_BEARER';
        
        // Store JWT info in request
        req.auth = {
          ...decoded,
          // For backward compatibility, add multi-role fields if they don't exist in old tokens
          roles: decoded.roles || [decoded.role || user?.role],
          primaryRole: decoded.primaryRole || decoded.role || user?.primaryRole || user?.role,
          activeRole: decoded.activeRole || decoded.role || user?.primaryRole || user?.role,
        };
      }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Validation
    // ─────────────────────────────────────────────────────────────────────────
    if (!user) {
      return sendError(res, 'Authentication required', 401);
    }
    
    if (!user.isActive) {
      return sendError(res, 'Account is disabled', 403);
    }
    
    // SUSPENDED and REJECTED clinic owners are still allowed to:
    //  - read their own clinic status  (GET  /clinics/my-status)
    //  - resubmit their clinic         (PATCH /clinics/my-resubmit)
    // All other endpoints remain blocked.
    const CLINIC_SELF_SERVICE_PATHS = ['/api/clinics/my-status', '/api/clinics/my-resubmit'];
    const isSelfService = CLINIC_SELF_SERVICE_PATHS.some((p) => req.path === p || req.originalUrl.startsWith(p));

    if (user.approvalStatus === 'SUSPENDED' && !isSelfService) {
      return sendError(res, user.suspendedReason || 'Account is suspended', 403);
    }
    if (user.approvalStatus === 'REJECTED' && !isSelfService) {
      return sendError(res, user.rejectionReason || 'Account has been rejected', 403);
    }

    // Attach user to request
    req.user = user;
    
    // Attach auth metadata
    if (authSource === 'SESSION_COOKIE') {
      req.auth = {
        sub: user.id,
        role: sessionInfo.authRole, // For backward compatibility
        roles: user.roles || [user.role],
        primaryRole: user.primaryRole || user.role,
        activeRole: sessionInfo.authRole,
        status: user.approvalStatus,
        sessionId: sessionInfo.sessionId,
        authSource: 'SESSION_COOKIE',
      };
    } else if (!req.auth) {
      // Fallback if JWT auth didn't set req.auth
      req.auth = {
        sub: user.id,
        role: user.role,
        roles: user.roles || [user.role],
        primaryRole: user.primaryRole || user.role,
        activeRole: user.primaryRole || user.role,
        status: user.approvalStatus,
        authSource: 'JWT_BEARER',
      };
    }
    
    // Log authentication for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('[Auth Middleware] Authenticated', {
        userId: user.id,
        authSource,
        role: req.auth.activeRole,
        path: req.path,
      });
    }
    
    next();
  } catch (error) {
    // Clear invalid session cookie if present
    if (req.cookies?.[SESSION_COOKIE_NAME]) {
      res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
    }
    
    return sendError(
      res, 
      error.name === 'TokenExpiredError' ? 'Access token expired' : 'Invalid access token', 
      401
    );
  }
};

const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user) return sendError(res, 'Authentication required', 401);
  
  // Multi-role support: Check activeRole from JWT (or fall back to user.role)
  const userRole = req.auth?.activeRole || req.user.role;
  
  if (!roles.includes(userRole)) {
    // ✅ ENHANCED DEBUGGING: Log authorization failures for troubleshooting
    console.error('[AUTH FAILURE]', {
      timestamp: new Date().toISOString(),
      userId: req.user.id,
      userName: req.user.name,
      userRole: userRole,
      userAllRoles: req.auth?.roles || [req.user.role],
      requiredRoles: roles,
      endpoint: req.originalUrl || req.url,
      method: req.method,
      approvalStatus: req.user.approvalStatus,
      isActive: req.user.isActive,
    });
    return sendError(res, 'You do not have permission to perform this action', 403);
  }
  next();
};

/**
 * NEW: Check if user has ANY of the specified roles in their roles array
 * Useful for endpoints that can be accessed by multiple roles
 * Example: requireAnyRole('DOCTOR', 'CLINIC_OWNER')
 */
const requireAnyRole = (...roles) => (req, res, next) => {
  if (!req.user) return sendError(res, 'Authentication required', 401);
  
  const userRoles = req.auth?.roles || [req.user.role];
  const hasAnyRole = roles.some(role => userRoles.includes(role));
  
  if (!hasAnyRole) {
    console.error('[AUTH FAILURE] No matching role', {
      timestamp: new Date().toISOString(),
      userId: req.user.id,
      userRoles: userRoles,
      requiredRoles: roles,
      endpoint: req.originalUrl || req.url,
    });
    return sendError(res, 'You do not have permission to perform this action', 403);
  }
  next();
};

const requireVerifiedAccount = (req, res, next) => {
  if (!req.user) return sendError(res, 'Authentication required', 401);
  
  if (req.user.approvalStatus === 'PENDING') {
    return sendError(res, 'Your account is pending admin approval. You will be notified once approved.', 403);
  }
  
  if (req.user.approvalStatus === 'UNDER_REVIEW') {
    return sendError(res, 'Your account is under review. Please wait for admin approval.', 403);
  }
  
  if (req.user.approvalStatus === 'CHANGES_REQUIRED') {
    return sendError(res, 'Changes are required for your account. Please check your email for details.', 403);
  }
  
  if (req.user.approvalStatus !== 'VERIFIED') {
    return sendError(res, 'Your account verification is pending', 403);
  }
  
  next();
};

const requireVerifiedClinic = async (req, res, next) => {
  const clinicId =
    req.params.clinicId ||
    req.params.id ||
    req.body.clinicId ||
    req.body.assignedClinic ||
    req.query.clinicId;

  if (!clinicId) return sendError(res, 'Clinic ID is required', 400);

  try {
    const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
    if (!clinic) return sendError(res, 'Clinic not found', 404);
    if (clinic.approvalStatus !== 'VERIFIED' || !clinic.isActive) {
      return sendError(res, 'Clinic verification is required before using this feature.', 403);
    }
    req.clinic = clinic;
    next();
  } catch (err) {
    next(err);
  }
};

const requireClinicOwner = authorizeRoles('CLINIC_OWNER');
const requireDoctor = authorizeRoles('DOCTOR');
const requireReceptionist = authorizeRoles('RECEPTIONIST');
const requireSuperAdmin = authorizeRoles('SUPER_ADMIN');

const requireVerifiedDoctor = async (req, res, next) => {
  if (!req.user?.doctorProfile) {
    return sendError(res, 'Doctor profile not found', 404);
  }

  if (req.user.doctorProfile.approvalStatus !== 'VERIFIED') {
    return sendError(res, 'Doctor profile verification is pending', 403);
  }

  next();
};

const requireClinicAccess = async (req, res, next) => {
  const clinicId = req.params.clinicId || req.params.id || req.body.clinicId || req.query.clinicId;
  if (!clinicId) return sendError(res, 'Clinic ID is required', 400);
  
  const userRole = req.auth?.activeRole || req.user.role;
  if (userRole === 'SUPER_ADMIN') return next();

  if (userRole === 'CLINIC_OWNER') {
    const clinic = await prisma.clinic.findFirst({ where: { id: clinicId, ownerId: req.user.id } });
    if (!clinic) return sendError(res, 'You do not have access to this clinic', 403);
    req.clinic = clinic;
    return next();
  }

  const staff = await prisma.clinicStaff.findFirst({
    where: { clinicId, userId: req.user.id, isActive: true },
  });
  if (!staff) return sendError(res, 'You do not have access to this clinic', 403);

  req.clinicStaff = staff;
  next();
};

const requireApprovalStatuses = (...statuses) => (req, res, next) => {
  if (!statuses.includes(req.user?.approvalStatus)) {
    return sendError(res, `Account status ${req.user?.approvalStatus} is not allowed for this action`, 403);
  }
  next();
};

const requireAdminLevel = (...levels) => (req, res, next) => {
  if (!req.user?.adminProfile) return sendError(res, 'Admin access required', 403);
  if (!levels.includes(req.user.adminProfile.level)) {
    return sendError(res, 'Insufficient admin permissions', 403);
  }
  next();
};

module.exports = {
  authenticateUser,
  authenticate: authenticateUser,
  authorizeRoles,
  authorize: authorizeRoles,
  requireRole: authorizeRoles,
  requireAnyRole, // NEW: Check if user has any of the roles
  requireVerifiedAccount,
  requireVerifiedClinic,
  requireClinicVerified: requireVerifiedClinic,
  requireClinicOwner,
  requireDoctor,
  requireReceptionist,
  requireSuperAdmin,
  requireVerifiedDoctor,
  requireDoctorVerified: requireVerifiedDoctor,
  requireClinicAccess,
  requireApprovalStatuses,
  requireAdminLevel,
};
