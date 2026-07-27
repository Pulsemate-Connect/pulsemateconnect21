/**
 * 2Factor SMS Service — PulseMate Connect
 *
 * Production-ready 2Factor API integration for mobile app OTP authentication.
 * Used exclusively for mobile (React Native / Expo) patient login.
 *
 * Features:
 *   - Send OTP via 2Factor SMS API
 *   - Verify OTP with session management
 *   - Rate limiting and retry logic
 *   - Comprehensive error handling
 *   - Audit logging
 *
 * API Documentation: https://2factor.in/docs/
 *
 * @module services/twofactor
 */

const axios = require('axios');
const logger = require('../config/logger');
const { normalizeMobileNumber } = require('../utils/mobile');

// ──────────────────────────────────────────────────────────────────────────────
// Configuration
// ──────────────────────────────────────────────────────────────────────────────

const TWO_FACTOR_API_KEY = process.env.TWO_FACTOR_API_KEY;
const TWO_FACTOR_BASE_URL = 'https://2factor.in/API/V1';
const TWO_FACTOR_TEMPLATE = process.env.TWO_FACTOR_TEMPLATE || 'AUTOGEN'; // or custom template name
const OTP_LENGTH = 6;
const OTP_VALIDITY_SECONDS = 300; // 5 minutes

// In-memory session storage (consider Redis for production scale)
// Format: { sessionId: { mobile, otp, expiresAt, attempts } }
const otpSessions = new Map();

// Rate limiting: max 3 OTP requests per phone per 5 minutes
const sendRateLimit = new Map(); // mobile -> [timestamps]
const RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_MAX = 3;

// ──────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Check if 2Factor API is configured
 */
const isConfigured = () => {
  if (!TWO_FACTOR_API_KEY) {
    logger.warn('2Factor API key not configured. Set TWO_FACTOR_API_KEY in environment.');
    return false;
  }
  return true;
};

/**
 * Generate a random session ID
 */
const generateSessionId = () => {
  return `2f_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

/**
 * Clean up expired sessions
 */
const cleanupExpiredSessions = () => {
  const now = Date.now();
  for (const [sessionId, session] of otpSessions.entries()) {
    if (now > session.expiresAt) {
      otpSessions.delete(sessionId);
      logger.debug(`[2Factor] Cleaned up expired session: ${sessionId}`);
    }
  }
};

/**
 * Check rate limit for phone number
 */
const checkRateLimit = (mobile) => {
  const now = Date.now();
  const timestamps = sendRateLimit.get(mobile) || [];
  
  // Clean old timestamps outside window
  const validTimestamps = timestamps.filter(ts => (now - ts) < RATE_LIMIT_WINDOW);
  
  if (validTimestamps.length >= RATE_LIMIT_MAX) {
    const oldestTimestamp = Math.min(...validTimestamps);
    const waitSeconds = Math.ceil((RATE_LIMIT_WINDOW - (now - oldestTimestamp)) / 1000);
    
    const error = new Error(`Too many OTP requests. Please try again in ${waitSeconds} seconds.`);
    error.status = 429;
    error.retryAfter = waitSeconds;
    throw error;
  }
  
  validTimestamps.push(now);
  sendRateLimit.set(mobile, validTimestamps);
};

/**
 * Remove 0 after +91 if present (2Factor expects +919876543210 not +9109876543210)
 */
const format2FactorPhone = (mobile) => {
  const normalized = normalizeMobileNumber(mobile);
  
  // If number starts with +910, remove the 0
  if (normalized.startsWith('+910')) {
    return normalized.replace('+910', '+91');
  }
  
  return normalized;
};

// ──────────────────────────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Send OTP via 2Factor SMS API
 *
 * @param {string} mobile - Phone number in E.164 format (+919876543210)
 * @returns {Promise<{sessionId: string, devOtp?: string}>} Session ID for OTP verification (and OTP in dev mode)
 * @throws {Error} If API call fails or rate limit exceeded
 */
const sendOtp = async (mobile) => {
  // ── 1. Validate configuration ──────────────────────────────────────────
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (!isDevelopment && !isConfigured()) {
    const error = new Error('2Factor SMS service is not configured. Please try again later.');
    error.status = 503;
    throw error;
  }

  // ── 2. Normalize and validate phone number ────────────────────────────
  const normalizedMobile = format2FactorPhone(mobile);
  
  if (!normalizedMobile || !/^\+91[6-9]\d{9}$/.test(normalizedMobile)) {
    const error = new Error('Invalid Indian mobile number. Please enter a valid 10-digit number.');
    error.status = 400;
    throw error;
  }

  // ── 3. Check rate limit (skip in development) ─────────────────────────
  if (!isDevelopment) {
    checkRateLimit(normalizedMobile);
  }

  // ── 4. Clean up old sessions ───────────────────────────────────────────
  cleanupExpiredSessions();

  // ── 5. Invalidate previous session for this mobile ────────────────────
  for (const [sessionId, session] of otpSessions.entries()) {
    if (session.mobile === normalizedMobile) {
      otpSessions.delete(sessionId);
      logger.debug(`[2Factor] Invalidated previous session for ${normalizedMobile}`);
    }
  }

  // ── DEVELOPMENT MODE: Generate fake OTP ────────────────────────────────
  if (isDevelopment) {
    const devOtp = '123456'; // Fixed OTP for development
    const sessionId = generateSessionId();
    const expiresAt = Date.now() + (OTP_VALIDITY_SECONDS * 1000);
    
    otpSessions.set(sessionId, {
      mobile: normalizedMobile,
      twoFactorSessionId: 'dev_session',
      devOtp, // Store OTP for verification
      expiresAt,
      attempts: 0,
      createdAt: Date.now(),
    });

    logger.info(`\n${'='.repeat(60)}`);
    logger.info(`🚀 DEVELOPMENT MODE - OTP GENERATED`);
    logger.info(`${'='.repeat(60)}`);
    logger.info(`📱 Phone: ${normalizedMobile}`);
    logger.info(`🔑 OTP: ${devOtp}`);
    logger.info(`⏰ Valid for: ${OTP_VALIDITY_SECONDS} seconds`);
    logger.info(`🆔 Session: ${sessionId}`);
    logger.info(`${'='.repeat(60)}\n`);
    
    return {
      sessionId,
      devOtp, // Return OTP in response for Expo Go testing
      message: 'OTP generated (DEV MODE)',
      expiresIn: OTP_VALIDITY_SECONDS,
    };
  }

  // ── PRODUCTION MODE: Call 2Factor API ──────────────────────────────────
  try {
    // ── 6. Call 2Factor API ──────────────────────────────────────────────
    const phoneWithoutPlus = normalizedMobile.replace('+', ''); // Remove + for 2Factor API
    const url = `${TWO_FACTOR_BASE_URL}/${TWO_FACTOR_API_KEY}/SMS/${phoneWithoutPlus}/AUTOGEN/${TWO_FACTOR_TEMPLATE}`;
    
    logger.info(`[2Factor] Sending OTP to ${normalizedMobile}`);
    
    const response = await axios.get(url, {
      timeout: 10000, // 10 second timeout
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // ── 7. Handle 2Factor response ─────────────────────────────────────── 
    if (response.data && response.data.Status === 'Success') {
      const twoFactorSessionId = response.data.Details; // 2Factor's session ID
      
      // Create our own session for verification
      const sessionId = generateSessionId();
      const expiresAt = Date.now() + (OTP_VALIDITY_SECONDS * 1000);
      
      otpSessions.set(sessionId, {
        mobile: normalizedMobile,
        twoFactorSessionId,
        expiresAt,
        attempts: 0,
        createdAt: Date.now(),
      });

      logger.info(`[2Factor] OTP sent successfully. SessionId: ${sessionId}`);
      
      return {
        sessionId,
        message: 'OTP sent successfully to your mobile number',
        expiresIn: OTP_VALIDITY_SECONDS,
      };
    } else {
      // API returned non-success status
      logger.error(`[2Factor] API returned non-success: ${JSON.stringify(response.data)}`);
      throw new Error(response.data.Details || 'Failed to send OTP. Please try again.');
    }
  } catch (error) {
    // ── 8. Handle errors ───────────────────────────────────────────────── 
    if (error.response) {
      // 2Factor API error response
      const status = error.response.status;
      const data = error.response.data;
      
      logger.error(`[2Factor] API error ${status}: ${JSON.stringify(data)}`);
      
      // Map common 2Factor error codes to user-friendly messages
      let message = 'Failed to send OTP. Please try again.';
      
      if (status === 401) {
        message = 'SMS service authentication failed. Please contact support.';
      } else if (status === 402) {
        message = 'SMS service account balance low. Please contact support.';
      } else if (data && data.Details) {
        message = data.Details;
      }
      
      const err = new Error(message);
      err.status = status >= 500 ? 503 : 400;
      throw err;
    } else if (error.request) {
      // Request made but no response
      logger.error(`[2Factor] No response from API: ${error.message}`);
      const err = new Error('SMS service is temporarily unavailable. Please try again.');
      err.status = 503;
      throw err;
    } else {
      // Error setting up request or rate limit error
      if (error.status === 429) {
        throw error; // Re-throw rate limit error
      }
      
      logger.error(`[2Factor] Request setup error: ${error.message}`);
      const err = new Error('Failed to send OTP. Please try again.');
      err.status = 500;
      throw err;
    }
  }
};

/**
 * Verify OTP using 2Factor API (or dev OTP in development mode)
 *
 * @param {string} sessionId - Session ID returned from sendOtp
 * @param {string} otp - 6-digit OTP entered by user
 * @returns {Promise<{mobile: string}>} Verified mobile number
 * @throws {Error} If verification fails
 */
const verifyOtp = async (sessionId, otp) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // ── 1. Validate configuration (skip in dev mode) ───────────────────────
  if (!isDevelopment && !isConfigured()) {
    const error = new Error('2Factor SMS service is not configured. Please try again later.');
    error.status = 503;
    throw error;
  }

  // ── 2. Validate OTP format ─────────────────────────────────────────────
  if (!otp || !/^\d{6}$/.test(otp)) {
    const error = new Error('Invalid OTP format. Please enter a 6-digit code.');
    error.status = 400;
    throw error;
  }

  // ── 3. Find session ────────────────────────────────────────────────────
  const session = otpSessions.get(sessionId);
  
  if (!session) {
    const error = new Error('Invalid or expired session. Please request a new OTP.');
    error.status = 400;
    throw error;
  }

  // ── 4. Check session expiry ────────────────────────────────────────────
  const now = Date.now();
  if (now > session.expiresAt) {
    otpSessions.delete(sessionId);
    const error = new Error('OTP has expired. Please request a new one.');
    error.status = 400;
    throw error;
  }

  // ── 5. Check max attempts ──────────────────────────────────────────────
  const MAX_ATTEMPTS = 5;
  if (session.attempts >= MAX_ATTEMPTS) {
    otpSessions.delete(sessionId);
    const error = new Error('Maximum verification attempts exceeded. Please request a new OTP.');
    error.status = 429;
    throw error;
  }

  // ── 6. Increment attempts ──────────────────────────────────────────────
  session.attempts += 1;
  otpSessions.set(sessionId, session);

  // ── DEVELOPMENT MODE: Verify against stored dev OTP ────────────────────
  if (isDevelopment && session.devOtp) {
    if (otp === session.devOtp) {
      otpSessions.delete(sessionId);
      
      logger.info(`\n${'='.repeat(60)}`);
      logger.info(`✅ DEVELOPMENT MODE - OTP VERIFIED`);
      logger.info(`${'='.repeat(60)}`);
      logger.info(`📱 Phone: ${session.mobile}`);
      logger.info(`🔑 OTP: ${otp}`);
      logger.info(`${'='.repeat(60)}\n`);
      
      return {
        mobile: session.mobile,
        verified: true,
      };
    } else {
      const remainingAttempts = MAX_ATTEMPTS - session.attempts;
      
      logger.warn(`[2Factor] DEV MODE - Invalid OTP. ${remainingAttempts} attempts remaining.`);
      
      const error = new Error(
        remainingAttempts > 0
          ? `Invalid OTP. ${remainingAttempts} attempts remaining. (Dev OTP is: ${session.devOtp})`
          : 'Maximum verification attempts exceeded. Please request a new OTP.'
      );
      error.status = 400;
      
      if (remainingAttempts === 0) {
        otpSessions.delete(sessionId);
      }
      
      throw error;
    }
  }

  // ── PRODUCTION MODE: Verify with 2Factor API ───────────────────────────
  try {
    // ── 7. Verify with 2Factor API ──────────────────────────────────────
    const url = `${TWO_FACTOR_BASE_URL}/${TWO_FACTOR_API_KEY}/SMS/VERIFY/${session.twoFactorSessionId}/${otp}`;
    
    logger.info(`[2Factor] Verifying OTP for session ${sessionId} (attempt ${session.attempts})`);
    
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // ── 8. Handle verification response ─────────────────────────────────
    if (response.data && response.data.Status === 'Success' && response.data.Details === 'OTP Matched') {
      // Success! Delete session
      otpSessions.delete(sessionId);
      
      logger.info(`[2Factor] OTP verified successfully for ${session.mobile}`);
      
      return {
        mobile: session.mobile,
        verified: true,
      };
    } else {
      // OTP doesn't match
      const remainingAttempts = MAX_ATTEMPTS - session.attempts;
      
      logger.warn(`[2Factor] OTP verification failed. ${remainingAttempts} attempts remaining.`);
      
      const error = new Error(
        remainingAttempts > 0
          ? `Invalid OTP. ${remainingAttempts} attempts remaining.`
          : 'Maximum verification attempts exceeded. Please request a new OTP.'
      );
      error.status = 400;
      
      if (remainingAttempts === 0) {
        otpSessions.delete(sessionId);
      }
      
      throw error;
    }
  } catch (error) {
    // ── 9. Handle errors ───────────────────────────────────────────────── 
    if (error.status && error.message) {
      // Already formatted error
      throw error;
    }
    
    if (error.response) {
      // 2Factor API error
      logger.error(`[2Factor] Verification API error: ${JSON.stringify(error.response.data)}`);
      
      const err = new Error('OTP verification failed. Please try again.');
      err.status = 400;
      throw err;
    } else if (error.request) {
      // No response
      logger.error(`[2Factor] No response from verification API: ${error.message}`);
      
      const err = new Error('SMS service is temporarily unavailable. Please try again.');
      err.status = 503;
      throw err;
    } else {
      // Other error
      logger.error(`[2Factor] Verification error: ${error.message}`);
      
      const err = new Error('OTP verification failed. Please try again.');
      err.status = 500;
      throw err;
    }
  }
};

/**
 * Resend OTP (calls sendOtp internally with rate limiting)
 *
 * @param {string} mobile - Phone number in E.164 format
 * @returns {Promise<{sessionId: string}>} New session ID
 */
const resendOtp = async (mobile) => {
  logger.info(`[2Factor] Resending OTP to ${mobile}`);
  return sendOtp(mobile);
};

/**
 * Get session statistics (for monitoring/debugging)
 */
const getSessionStats = () => {
  cleanupExpiredSessions();
  
  return {
    activeSessions: otpSessions.size,
    rateLimitedNumbers: sendRateLimit.size,
  };
};

/**
 * Clear rate limit for a phone number (admin function)
 */
const clearRateLimit = (mobile) => {
  const normalized = format2FactorPhone(mobile);
  sendRateLimit.delete(normalized);
  logger.info(`[2Factor] Rate limit cleared for ${normalized}`);
};

// ──────────────────────────────────────────────────────────────────────────────
// Periodic cleanup (run every 5 minutes)
// ──────────────────────────────────────────────────────────────────────────────

setInterval(() => {
  cleanupExpiredSessions();
  
  // Clean up old rate limit entries
  const now = Date.now();
  for (const [mobile, timestamps] of sendRateLimit.entries()) {
    const validTimestamps = timestamps.filter(ts => (now - ts) < RATE_LIMIT_WINDOW);
    if (validTimestamps.length === 0) {
      sendRateLimit.delete(mobile);
    } else {
      sendRateLimit.set(mobile, validTimestamps);
    }
  }
}, 5 * 60 * 1000);

// ──────────────────────────────────────────────────────────────────────────────
// Exports
// ──────────────────────────────────────────────────────────────────────────────

module.exports = {
  sendOtp,
  verifyOtp,
  resendOtp,
  getSessionStats,
  clearRateLimit,
  isConfigured,
};
