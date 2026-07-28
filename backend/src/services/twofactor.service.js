/**
 * 2Factor SMS Service — PulseMate Connect
 *
 * PRODUCTION-READY 2Factor API integration for mobile app OTP authentication.
 * Used exclusively for mobile (React Native / Expo) patient login.
 *
 * Security Features:
 *   - Real OTP generation via 2Factor API (no dev bypass)
 *   - OTP hashing (bcrypt) - never store plain OTP
 *   - Rate limiting: 3 OTP requests per 15 minutes
 *   - Max 5 verification attempts per OTP
 *   - IP-based rate limiting
 *   - Automatic OTP expiry (5 minutes)
 *   - Audit logging with no sensitive data exposure
 *   - Prevention of enumeration attacks
 *
 * API Documentation: https://2factor.in/docs/
 *
 * @module services/twofactor
 */

const axios = require('axios');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const logger = require('../config/logger');
const { normalizeMobileNumber } = require('../utils/mobile');

// ──────────────────────────────────────────────────────────────────────────────
// Configuration & Validation
// ──────────────────────────────────────────────────────────────────────────────

const TWO_FACTOR_API_KEY = process.env.TWOFACTOR_API_KEY;
const TWO_FACTOR_BASE_URL = 'https://2factor.in/API/V1';
const TWO_FACTOR_TEMPLATE = process.env.TWOFACTOR_TEMPLATE_NAME || 'AUTOGEN';
const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES) || 5;
const OTP_VALIDITY_MS = OTP_EXPIRY_MINUTES * 60 * 1000;

// Security Constants
const MAX_VERIFICATION_ATTEMPTS = 5;
const MAX_OTP_REQUESTS = 3;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const BCRYPT_ROUNDS = 10;

// Storage (use Redis in production for scalability)
// Format: { mobile: { otpHash, sessionId, expiresAt, attempts, createdAt, ipAddress } }
const otpStorage = new Map();

// Rate limiting by phone number
const phoneRateLimit = new Map(); // mobile -> [timestamps]

// Rate limiting by IP address
const ipRateLimit = new Map(); // ip -> [timestamps]

/**
 * Validate 2Factor configuration on startup
 * @throws {Error} If configuration is invalid
 */
const validateConfiguration = () => {
  if (!TWO_FACTOR_API_KEY || TWO_FACTOR_API_KEY.length < 30) {
    throw new Error('TWOFACTOR_API_KEY is not configured or invalid. Set it in environment variables.');
  }
  
  if (OTP_EXPIRY_MINUTES < 1 || OTP_EXPIRY_MINUTES > 10) {
    throw new Error('OTP_EXPIRY_MINUTES must be between 1 and 10 minutes.');
  }
  
  logger.info('[2Factor] Configuration validated successfully');
  logger.info(`[2Factor] OTP expiry: ${OTP_EXPIRY_MINUTES} minutes`);
  logger.info(`[2Factor] Template: ${TWO_FACTOR_TEMPLATE}`);
  logger.info(`[2Factor] Max attempts: ${MAX_VERIFICATION_ATTEMPTS}`);
  logger.info(`[2Factor] Rate limit: ${MAX_OTP_REQUESTS} requests per ${RATE_LIMIT_WINDOW_MS / 60000} minutes`);
};

// Validate on module load
try {
  validateConfiguration();
} catch (error) {
  logger.error(`[2Factor] Configuration error: ${error.message}`);
  throw error;
}

// ──────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Generate a cryptographically secure random 6-digit OTP
 * @returns {string} 6-digit OTP
 */
const generateSecureOtp = () => {
  const buffer = crypto.randomBytes(3);
  const number = buffer.readUIntBE(0, 3);
  const otp = String(number % 1000000).padStart(6, '0');
  return otp;
};

/**
 * Hash OTP using bcrypt
 * @param {string} otp - Plain OTP
 * @returns {Promise<string>} Hashed OTP
 */
const hashOtp = async (otp) => {
  return bcrypt.hash(otp, BCRYPT_ROUNDS);
};

/**
 * Verify OTP against hash
 * @param {string} otp - Plain OTP
 * @param {string} hash - Hashed OTP
 * @returns {Promise<boolean>} True if match
 */
const verifyOtpHash = async (otp, hash) => {
  return bcrypt.compare(otp, hash);
};

/**
 * Generate a unique session ID
 */
const generateSessionId = () => {
  return `2f_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
};

/**
 * Clean up expired OTPs
 */
const cleanupExpiredOtps = () => {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [mobile, data] of otpStorage.entries()) {
    if (now > data.expiresAt) {
      otpStorage.delete(mobile);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    logger.debug(`[2Factor] Cleaned up ${cleaned} expired OTP(s)`);
  }
};

/**
 * Check phone number rate limit
 * @param {string} mobile - Phone number
 * @throws {Error} If rate limit exceeded
 */
const checkPhoneRateLimit = (mobile) => {
  const now = Date.now();
  const timestamps = phoneRateLimit.get(mobile) || [];
  
  // Clean old timestamps outside window
  const validTimestamps = timestamps.filter(ts => (now - ts) < RATE_LIMIT_WINDOW_MS);
  
  if (validTimestamps.length >= MAX_OTP_REQUESTS) {
    const oldestTimestamp = Math.min(...validTimestamps);
    const waitMinutes = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - oldestTimestamp)) / 60000);
    
    logger.warn(`[2Factor] Rate limit exceeded for phone: ${mobile.substring(0, 6)}***`);
    
    const error = new Error(`Too many OTP requests. Please try again in ${waitMinutes} minutes.`);
    error.status = 429;
    error.retryAfter = waitMinutes * 60;
    throw error;
  }
  
  validTimestamps.push(now);
  phoneRateLimit.set(mobile, validTimestamps);
};

/**
 * Check IP address rate limit
 * @param {string} ipAddress - IP address
 * @throws {Error} If rate limit exceeded
 */
const checkIpRateLimit = (ipAddress) => {
  if (!ipAddress) return; // Skip if IP not available
  
  const now = Date.now();
  const timestamps = ipRateLimit.get(ipAddress) || [];
  
  const validTimestamps = timestamps.filter(ts => (now - ts) < RATE_LIMIT_WINDOW_MS);
  
  // Allow more requests per IP (3x phone limit) to account for multiple users
  const IP_MAX_REQUESTS = MAX_OTP_REQUESTS * 3;
  
  if (validTimestamps.length >= IP_MAX_REQUESTS) {
    logger.warn(`[2Factor] IP rate limit exceeded: ${ipAddress}`);
    
    const error = new Error('Too many requests from this network. Please try again later.');
    error.status = 429;
    throw error;
  }
  
  validTimestamps.push(now);
  ipRateLimit.set(ipAddress, validTimestamps);
};

/**
 * Normalize phone number for 2Factor API
 * @param {string} mobile - Phone number
 * @returns {string} Normalized phone
 */
const format2FactorPhone = (mobile) => {
  const normalized = normalizeMobileNumber(mobile);
  
  // Remove +910 prefix if present (should be +91)
  if (normalized.startsWith('+910')) {
    return normalized.replace('+910', '+91');
  }
  
  return normalized;
};

/**
 * Validate Indian mobile number
 * @param {string} mobile - Phone number
 * @throws {Error} If invalid
 */
const validateIndianMobile = (mobile) => {
  if (!mobile || !/^\+91[6-9]\d{9}$/.test(mobile)) {
    const error = new Error('Invalid Indian mobile number. Please enter a valid 10-digit number starting with 6-9.');
    error.status = 400;
    throw error;
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Send OTP via 2Factor SMS API
 * 
 * PRODUCTION-READY: No dev bypass, real OTP only
 *
 * @param {string} mobile - Phone number in E.164 format (+919876543210)
 * @param {string} [ipAddress] - Client IP address for rate limiting
 * @returns {Promise<{sessionId: string}>} Session ID for OTP verification
 * @throws {Error} If API call fails or rate limit exceeded
 */
const sendOtp = async (mobile, ipAddress = null) => {
  // ── 1. Normalize and validate phone number ────────────────────────────
  const normalizedMobile = format2FactorPhone(mobile);
  validateIndianMobile(normalizedMobile);

  // ── 2. Check rate limits ───────────────────────────────────────────────
  checkPhoneRateLimit(normalizedMobile);
  if (ipAddress) {
    checkIpRateLimit(ipAddress);
  }

  // ── 3. Clean up expired OTPs ───────────────────────────────────────────
  cleanupExpiredOtps();

  // ── 4. Invalidate any existing OTP for this mobile ────────────────────
  if (otpStorage.has(normalizedMobile)) {
    otpStorage.delete(normalizedMobile);
    logger.info(`[2Factor] Invalidated previous OTP for ${normalizedMobile.substring(0, 6)}***`);
  }

  // ── 5. Generate secure OTP ─────────────────────────────────────────────
  const otp = generateSecureOtp();
  const otpHash = await hashOtp(otp);
  
  // ── 6. Call 2Factor API to send SMS ────────────────────────────────────
  try {
    const phoneWithoutPlus = normalizedMobile.replace('+', '');
    const url = `${TWO_FACTOR_BASE_URL}/${TWO_FACTOR_API_KEY}/SMS/${phoneWithoutPlus}/AUTOGEN/${TWO_FACTOR_TEMPLATE}`;
    
    logger.info(`[2Factor] Sending OTP to ${normalizedMobile.substring(0, 6)}*** via 2Factor API`);
    
    const response = await axios.get(url, {
      timeout: 15000, // 15 second timeout
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // ── 7. Validate 2Factor response ───────────────────────────────────────
    if (!response.data || response.data.Status !== 'Success') {
      logger.error(`[2Factor] API returned non-success: ${JSON.stringify(response.data)}`);
      throw new Error(response.data?.Details || 'Failed to send OTP. Please try again.');
    }

    const twoFactorSessionId = response.data.Details;
    
    // ── 8. Store hashed OTP with metadata ──────────────────────────────────
    const sessionId = generateSessionId();
    const expiresAt = Date.now() + OTP_VALIDITY_MS;
    
    otpStorage.set(normalizedMobile, {
      otpHash,
      sessionId,
      twoFactorSessionId,
      expiresAt,
      attempts: 0,
      createdAt: Date.now(),
      ipAddress: ipAddress || 'unknown',
    });

    logger.info(`[2Factor] OTP sent successfully. Session: ${sessionId}, Expires in: ${OTP_EXPIRY_MINUTES}m`);
    
    // ── 9. Return session ID only (NEVER return OTP) ───────────────────────
    return {
      sessionId,
      message: `OTP sent successfully to ${normalizedMobile}`,
      expiresIn: OTP_EXPIRY_MINUTES * 60, // seconds
    };
    
  } catch (error) {
    // ── 10. Handle 2Factor API errors ──────────────────────────────────────
    if (error.status === 429) {
      throw error; // Re-throw rate limit errors
    }
    
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      logger.error(`[2Factor] API error ${status}: ${JSON.stringify(data)}`);
      
      let message = 'Failed to send OTP. Please try again.';
      let statusCode = 503;
      
      if (status === 401 || status === 403) {
        message = 'SMS service authentication failed. Please contact support.';
        statusCode = 503;
        logger.error('[2Factor] CRITICAL: API authentication failed. Check TWOFACTOR_API_KEY.');
      } else if (status === 402) {
        message = 'SMS service unavailable. Please contact support.';
        statusCode = 503;
        logger.error('[2Factor] CRITICAL: 2Factor account balance low or expired.');
      } else if (data && data.Details) {
        message = data.Details;
        statusCode = 400;
      }
      
      const err = new Error(message);
      err.status = statusCode;
      throw err;
      
    } else if (error.request) {
      logger.error(`[2Factor] No response from API: ${error.message}`);
      const err = new Error('SMS service is temporarily unavailable. Please try again in a few minutes.');
      err.status = 503;
      throw err;
      
    } else {
      logger.error(`[2Factor] Request error: ${error.message}`);
      const err = new Error('Failed to send OTP. Please try again.');
      err.status = 500;
      throw err;
    }
  }
};

/**
 * Verify OTP entered by user
 * 
 * PRODUCTION-READY: Compares against hashed OTP, no dev bypass
 *
 * @param {string} mobile - Phone number
 * @param {string} sessionId - Session ID from sendOtp
 * @param {string} otp - 6-digit OTP entered by user
 * @param {string} [ipAddress] - Client IP address for logging
 * @returns {Promise<{mobile: string, verified: true}>} Verified mobile number
 * @throws {Error} If verification fails
 */
const verifyOtp = async (mobile, sessionId, otp, ipAddress = null) => {
  // ── 1. Validate inputs ─────────────────────────────────────────────────
  if (!otp || !/^\d{6}$/.test(otp)) {
    logger.warn(`[2Factor] Invalid OTP format from IP: ${ipAddress || 'unknown'}`);
    const error = new Error('Invalid OTP format. Please enter a 6-digit code.');
    error.status = 400;
    throw error;
  }

  const normalizedMobile = format2FactorPhone(mobile);
  validateIndianMobile(normalizedMobile);

  // ── 2. Find OTP data by mobile number ──────────────────────────────────
  const otpData = otpStorage.get(normalizedMobile);
  
  if (!otpData) {
    logger.warn(`[2Factor] No OTP found for ${normalizedMobile.substring(0, 6)}***`);
    // Generic error to prevent enumeration
    const error = new Error('Invalid or expired OTP. Please request a new one.');
    error.status = 400;
    throw error;
  }

  // ── 3. Validate session ID matches ─────────────────────────────────────
  if (otpData.sessionId !== sessionId) {
    logger.warn(`[2Factor] Session ID mismatch for ${normalizedMobile.substring(0, 6)}***`);
    const error = new Error('Invalid session. Please request a new OTP.');
    error.status = 400;
    throw error;
  }

  // ── 4. Check if OTP has expired ────────────────────────────────────────
  const now = Date.now();
  if (now > otpData.expiresAt) {
    otpStorage.delete(normalizedMobile);
    logger.info(`[2Factor] Expired OTP for ${normalizedMobile.substring(0, 6)}***`);
    const error = new Error('OTP has expired. Please request a new one.');
    error.status = 400;
    throw error;
  }

  // ── 5. Check maximum attempts ──────────────────────────────────────────
  if (otpData.attempts >= MAX_VERIFICATION_ATTEMPTS) {
    otpStorage.delete(normalizedMobile);
    logger.warn(`[2Factor] Max attempts exceeded for ${normalizedMobile.substring(0, 6)}*** from IP: ${ipAddress || 'unknown'}`);
    const error = new Error('Maximum verification attempts exceeded. Please request a new OTP.');
    error.status = 429;
    throw error;
  }

  // ── 6. Increment attempt counter ───────────────────────────────────────
  otpData.attempts += 1;
  otpStorage.set(normalizedMobile, otpData);

  // ── 7. Verify OTP against stored hash ──────────────────────────────────
  const isValid = await verifyOtpHash(otp, otpData.otpHash);

  if (!isValid) {
    const remainingAttempts = MAX_VERIFICATION_ATTEMPTS - otpData.attempts;
    
    logger.warn(`[2Factor] Invalid OTP attempt ${otpData.attempts}/${MAX_VERIFICATION_ATTEMPTS} for ${normalizedMobile.substring(0, 6)}*** from IP: ${ipAddress || 'unknown'}`);
    
    if (remainingAttempts === 0) {
      otpStorage.delete(normalizedMobile);
      const error = new Error('Maximum verification attempts exceeded. Please request a new OTP.');
      error.status = 429;
      throw error;
    }
    
    const error = new Error(`Invalid OTP. ${remainingAttempts} attempt${remainingAttempts > 1 ? 's' : ''} remaining.`);
    error.status = 400;
    throw error;
  }

  // ── 8. OTP is valid - Delete immediately to prevent reuse ──────────────
  otpStorage.delete(normalizedMobile);
  
  logger.info(`[2Factor] OTP verified successfully for ${normalizedMobile.substring(0, 6)}*** from IP: ${ipAddress || 'unknown'}`);

  // ── 9. Return verified mobile number ───────────────────────────────────
  return {
    mobile: normalizedMobile,
    verified: true,
  };
};

/**
 * Resend OTP (calls sendOtp internally with rate limiting)
 *
 * @param {string} mobile - Phone number in E.164 format
 * @param {string} [ipAddress] - Client IP address
 * @returns {Promise<{sessionId: string}>} New session ID
 */
const resendOtp = async (mobile, ipAddress = null) => {
  logger.info(`[2Factor] Resending OTP to ${mobile.substring(0, 6)}***`);
  return sendOtp(mobile, ipAddress);
};

/**
 * Get session statistics (for monitoring/debugging)
 * @returns {Object} Statistics
 */
const getSessionStats = () => {
  cleanupExpiredOtps();
  
  return {
    activeOtps: otpStorage.size,
    phoneRateLimitedCount: phoneRateLimit.size,
    ipRateLimitedCount: ipRateLimit.size,
  };
};

/**
 * Clear rate limit for a phone number (admin function)
 * @param {string} mobile - Phone number
 */
const clearPhoneRateLimit = (mobile) => {
  const normalized = format2FactorPhone(mobile);
  phoneRateLimit.delete(normalized);
  logger.info(`[2Factor] Rate limit cleared for ${normalized.substring(0, 6)}***`);
};

/**
 * Clear rate limit for an IP address (admin function)
 * @param {string} ipAddress - IP address
 */
const clearIpRateLimit = (ipAddress) => {
  ipRateLimit.delete(ipAddress);
  logger.info(`[2Factor] IP rate limit cleared for ${ipAddress}`);
};

/**
 * Clear expired OTP for a phone number (admin function)
 * @param {string} mobile - Phone number
 */
const clearOtp = (mobile) => {
  const normalized = format2FactorPhone(mobile);
  if (otpStorage.has(normalized)) {
    otpStorage.delete(normalized);
    logger.info(`[2Factor] OTP cleared for ${normalized.substring(0, 6)}***`);
    return true;
  }
  return false;
};

// ──────────────────────────────────────────────────────────────────────────────
// Periodic cleanup (run every 5 minutes)
// ──────────────────────────────────────────────────────────────────────────────

setInterval(() => {
  cleanupExpiredOtps();
  
  // Clean up old rate limit entries
  const now = Date.now();
  
  // Phone rate limits
  for (const [mobile, timestamps] of phoneRateLimit.entries()) {
    const validTimestamps = timestamps.filter(ts => (now - ts) < RATE_LIMIT_WINDOW_MS);
    if (validTimestamps.length === 0) {
      phoneRateLimit.delete(mobile);
    } else {
      phoneRateLimit.set(mobile, validTimestamps);
    }
  }
  
  // IP rate limits
  for (const [ip, timestamps] of ipRateLimit.entries()) {
    const validTimestamps = timestamps.filter(ts => (now - ts) < RATE_LIMIT_WINDOW_MS);
    if (validTimestamps.length === 0) {
      ipRateLimit.delete(ip);
    } else {
      ipRateLimit.set(ip, validTimestamps);
    }
  }
  
  logger.debug('[2Factor] Periodic cleanup completed');
}, 5 * 60 * 1000);

// ──────────────────────────────────────────────────────────────────────────────
// Exports
// ──────────────────────────────────────────────────────────────────────────────

module.exports = {
  sendOtp,
  verifyOtp,
  resendOtp,
  getSessionStats,
  clearPhoneRateLimit,
  clearIpRateLimit,
  clearOtp,
};
