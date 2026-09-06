/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PRODUCTION SESSION SERVICE — PulseMate Connect
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Secure server-managed session system with HttpOnly cookies
 * 
 * Features:
 * - Cryptographically secure session token generation
 * - Session token hashing (never store raw tokens)
 * - Session expiration and idle timeout
 * - Session revocation (logout, logout-all, security events)
 * - Device and IP tracking
 * - Multi-device session management
 * - Backward compatible with mobile app (JWT fallback)
 * 
 * Security:
 * - Session tokens are 32-byte cryptographically random
 * - Tokens are hashed with SHA-256 before database storage
 * - Raw tokens are NEVER logged or exposed
 * - HttpOnly cookies prevent JavaScript access
 * - SameSite protection against CSRF
 * 
 * @module services/session.service
 */

const crypto = require('crypto');
const prisma = require('../config/database');
const logger = require('../config/logger');

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

const SESSION_CONFIG = {
  // Session lifetime (max age regardless of activity)
  MAX_AGE_DAYS: parseInt(process.env.SESSION_MAX_AGE_DAYS || '30', 10),
  
  // Idle timeout (session expires after this much inactivity)
  IDLE_TIMEOUT_DAYS: parseInt(process.env.SESSION_IDLE_TIMEOUT_DAYS || '7', 10),
  
  // Admin session settings (stricter)
  ADMIN_MAX_AGE_DAYS: parseInt(process.env.ADMIN_SESSION_MAX_AGE_DAYS || '7', 10),
  ADMIN_IDLE_TIMEOUT_DAYS: parseInt(process.env.ADMIN_SESSION_IDLE_TIMEOUT_DAYS || '1', 10),
  
  // Token length (bytes)
  TOKEN_LENGTH: 32, // 256 bits
};

// ─────────────────────────────────────────────────────────────────────────────
// Token Generation & Hashing
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate cryptographically secure random session token
 * @returns {string} 64-character hex string (32 bytes)
 */
const generateSessionToken = () => {
  return crypto.randomBytes(SESSION_CONFIG.TOKEN_LENGTH).toString('hex');
};

/**
 * Hash session token for secure storage
 * Uses SHA-256 to create one-way hash
 * @param {string} token - Raw session token
 * @returns {string} Hashed token (64-character hex string)
 */
const hashSessionToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// ─────────────────────────────────────────────────────────────────────────────
// Session Creation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new session for a user
 * 
 * @param {Object} params - Session parameters
 * @param {string} params.userId - User ID
 * @param {string} params.authRole - User's active role
 * @param {string} params.loginMethod - Authentication method used
 * @param {string} [params.deviceInfo] - Device information
 * @param {string} [params.ipAddress] - IP address
 * @param {string} [params.userAgent] - User agent string
 * @returns {Promise<{sessionToken: string, session: Object}>} Raw token and session record
 */
const createSession = async ({
  userId,
  authRole,
  loginMethod,
  deviceInfo = null,
  ipAddress = null,
  userAgent = null,
}) => {
  // Generate cryptographically secure token
  const sessionToken = generateSessionToken();
  const sessionTokenHash = hashSessionToken(sessionToken);
  
  // Determine session lifetime based on role
  const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(authRole);
  const maxAgeDays = isAdmin ? SESSION_CONFIG.ADMIN_MAX_AGE_DAYS : SESSION_CONFIG.MAX_AGE_DAYS;
  const idleTimeoutDays = isAdmin ? SESSION_CONFIG.ADMIN_IDLE_TIMEOUT_DAYS : SESSION_CONFIG.IDLE_TIMEOUT_DAYS;
  
  const now = new Date();
  const expiresAt = new Date(now.getTime() + maxAgeDays * 24 * 60 * 60 * 1000);
  
  // Create session in database
  const session = await prisma.session.create({
    data: {
      userId,
      sessionTokenHash,
      refreshTokenHash: null, // ✅ TEMP: Explicitly set to null (backward compatibility)
      authRole,
      loginMethod,
      deviceInfo,
      ipAddress,
      userAgent,
      expiresAt,
      lastActivityAt: now,
      maxIdleMinutes: idleTimeoutDays * 24 * 60, // Convert days to minutes
      isRevoked: false,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          mobile: true,
          role: true,
          roles: true,
          primaryRole: true,
          approvalStatus: true,
          isActive: true,
        },
      },
    },
  });
  
  logger.info('[Session Service] Session created', {
    userId,
    sessionId: session.id,
    authRole,
    loginMethod,
    expiresAt: expiresAt.toISOString(),
    maxAgeDays,
    idleTimeoutDays,
  });
  
  // Return raw token (to be sent to client) and session record
  return {
    sessionToken, // RAW TOKEN - send to client as HttpOnly cookie
    session,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Session Validation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate and retrieve session by token
 * Also updates lastActivityAt to track idle timeout
 * 
 * @param {string} sessionToken - Raw session token from cookie
 * @returns {Promise<Object|null>} Session with user, or null if invalid
 */
const validateSession = async (sessionToken) => {
  if (!sessionToken) return null;
  
  const sessionTokenHash = hashSessionToken(sessionToken);
  
  // Find session by hash
  const session = await prisma.session.findUnique({
    where: { sessionTokenHash },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          mobile: true,
          role: true,
          roles: true,
          primaryRole: true,
          approvalStatus: true,
          isActive: true,
          adminProfile: true,
          doctorProfile: true,
          patientProfile: true,
          clinicOwnerProfile: true,
          receptionistProfile: {
            include: {
              assignedClinic: true,
            },
          },
          ownedClinics: true,
        },
      },
    },
  });
  
  if (!session) {
    logger.debug('[Session Service] Session not found');
    return null;
  }
  
  // Check if session is revoked
  if (session.isRevoked) {
    logger.warn('[Session Service] Session revoked', {
      sessionId: session.id,
      userId: session.userId,
      revokedAt: session.revokedAt,
      reason: session.revokedReason,
    });
    return null;
  }
  
  // Check if session is expired (max age)
  if (new Date() > session.expiresAt) {
    logger.info('[Session Service] Session expired (max age)', {
      sessionId: session.id,
      userId: session.userId,
      expiresAt: session.expiresAt,
    });
    // Auto-revoke expired session
    await revokeSession(session.id, 'EXPIRED');
    return null;
  }
  
  // Check idle timeout
  if (session.maxIdleMinutes) {
    const idleTimeMs = session.maxIdleMinutes * 60 * 1000;
    const lastActivity = new Date(session.lastActivityAt);
    const idleThreshold = new Date(Date.now() - idleTimeMs);
    
    if (lastActivity < idleThreshold) {
      logger.info('[Session Service] Session expired (idle timeout)', {
        sessionId: session.id,
        userId: session.userId,
        lastActivityAt: session.lastActivityAt,
        idleTimeoutMinutes: session.maxIdleMinutes,
      });
      // Auto-revoke idle session
      await revokeSession(session.id, 'IDLE_TIMEOUT');
      return null;
    }
  }
  
  // Check if user is active
  if (!session.user.isActive) {
    logger.warn('[Session Service] User account disabled', {
      sessionId: session.id,
      userId: session.userId,
    });
    return null;
  }
  
  // Update last activity timestamp (for idle timeout tracking)
  // Do this asynchronously to avoid blocking the request
  prisma.session.update({
    where: { id: session.id },
    data: { lastActivityAt: new Date() },
  }).catch((error) => {
    logger.error('[Session Service] Failed to update lastActivityAt', {
      sessionId: session.id,
      error: error.message,
    });
  });
  
  return session;
};

// ─────────────────────────────────────────────────────────────────────────────
// Session Revocation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Revoke a specific session
 * @param {string} sessionId - Session ID
 * @param {string} reason - Revocation reason
 * @returns {Promise<Object>} Revoked session
 */
const revokeSession = async (sessionId, reason = 'USER_LOGOUT') => {
  const session = await prisma.session.update({
    where: { id: sessionId },
    data: {
      isRevoked: true,
      revokedAt: new Date(),
      revokedReason: reason,
    },
  });
  
  logger.info('[Session Service] Session revoked', {
    sessionId,
    userId: session.userId,
    reason,
  });
  
  return session;
};

/**
 * Revoke session by token hash
 * @param {string} sessionToken - Raw session token
 * @param {string} reason - Revocation reason
 * @returns {Promise<Object|null>} Revoked session or null
 */
const revokeSessionByToken = async (sessionToken, reason = 'USER_LOGOUT') => {
  if (!sessionToken) return null;
  
  const sessionTokenHash = hashSessionToken(sessionToken);
  
  const session = await prisma.session.findUnique({
    where: { sessionTokenHash },
  });
  
  if (!session) return null;
  
  return await revokeSession(session.id, reason);
};

/**
 * Revoke all sessions for a user
 * @param {string} userId - User ID
 * @param {string} reason - Revocation reason
 * @returns {Promise<number>} Number of sessions revoked
 */
const revokeAllUserSessions = async (userId, reason = 'LOGOUT_ALL') => {
  const result = await prisma.session.updateMany({
    where: {
      userId,
      isRevoked: false,
    },
    data: {
      isRevoked: true,
      revokedAt: new Date(),
      revokedReason: reason,
    },
  });
  
  logger.info('[Session Service] All user sessions revoked', {
    userId,
    count: result.count,
    reason,
  });
  
  return result.count;
};

/**
 * Revoke all sessions except current one
 * Useful for "logout other devices" functionality
 * @param {string} userId - User ID
 * @param {string} currentSessionId - Current session ID to keep
 * @param {string} reason - Revocation reason
 * @returns {Promise<number>} Number of sessions revoked
 */
const revokeOtherUserSessions = async (userId, currentSessionId, reason = 'LOGOUT_OTHER_DEVICES') => {
  const result = await prisma.session.updateMany({
    where: {
      userId,
      id: { not: currentSessionId },
      isRevoked: false,
    },
    data: {
      isRevoked: true,
      revokedAt: new Date(),
      revokedReason: reason,
    },
  });
  
  logger.info('[Session Service] Other user sessions revoked', {
    userId,
    currentSessionId,
    count: result.count,
    reason,
  });
  
  return result.count;
};

// ─────────────────────────────────────────────────────────────────────────────
// Session Queries
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get all active sessions for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Active sessions
 */
const getUserSessions = async (userId) => {
  return await prisma.session.findMany({
    where: {
      userId,
      isRevoked: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { lastActivityAt: 'desc' },
    select: {
      id: true,
      authRole: true,
      deviceInfo: true,
      ipAddress: true,
      loginMethod: true,
      createdAt: true,
      lastActivityAt: true,
      expiresAt: true,
    },
  });
};

/**
 * Get session by ID
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object|null>} Session or null
 */
const getSessionById = async (sessionId) => {
  return await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          mobile: true,
          role: true,
          roles: true,
          primaryRole: true,
        },
      },
    },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Session Cleanup
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Clean up expired and revoked sessions
 * Should be run periodically (e.g., daily cron job)
 * @returns {Promise<number>} Number of sessions deleted
 */
const cleanupExpiredSessions = async () => {
  const result = await prisma.session.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        {
          isRevoked: true,
          revokedAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // 30 days ago
        },
      ],
    },
  });
  
  logger.info('[Session Service] Expired sessions cleaned up', {
    count: result.count,
  });
  
  return result.count;
};

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  // Configuration
  SESSION_CONFIG,
  
  // Token utilities
  generateSessionToken,
  hashSessionToken,
  
  // Session lifecycle
  createSession,
  validateSession,
  revokeSession,
  revokeSessionByToken,
  revokeAllUserSessions,
  revokeOtherUserSessions,
  
  // Session queries
  getUserSessions,
  getSessionById,
  
  // Maintenance
  cleanupExpiredSessions,
};
