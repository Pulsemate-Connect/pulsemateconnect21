const rateLimit = require('express-rate-limit');

// ✅ SECURITY FIX: Never skip rate limiting, even in development
const createLimiter = ({ windowMs, max, message, keyGenerator }) =>
  rateLimit({
    windowMs,
    max,
    skip: () => false, // ✅ CRITICAL: Never skip rate limiting
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: keyGenerator || ((req) => req.ip),
    message: {
      success: false,
      message,
    },
  });

const loginLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5, // ✅ SECURITY: Reduced from 20 to 5 attempts
  message: 'Too many login attempts. Please try again later.',
  // Key by email/identifier so each user gets their own counter
  keyGenerator: (req) => (req.body?.identifier || req.body?.email || req.ip).toLowerCase(),
});

const forgotPasswordLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many password reset requests. Please try again later.',
});

const emailVerificationSendLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: 'Too many email verification requests. Please try again later.',
  // Key by email body param so different users don't share the limit
  keyGenerator: (req) => (req.body?.email || req.ip).toLowerCase(),
});

const emailVerificationVerifyLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: 'Too many email verification attempts. Please try again later.',
  keyGenerator: (req) => (req.body?.email || req.ip).toLowerCase(),
});

const resetPasswordLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many password reset attempts. Please try again later.',
});

/**
 * Rate limiter for POST /api/auth/user/firebase-phone-login.
 * Stricter than the old OTP verify limiter since the Firebase token is
 * already time-limited (1 hour), so we only need to prevent bulk abuse.
 */
const firebasePhoneLoginLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // ✅ SECURITY: Changed to 1 hour
  max: 10, // ✅ SECURITY: Reduced from 20 to 10
  message: 'Too many login attempts. Please try again later.',
});

/**
 * Rate limiter for Firebase phone verification endpoints used during
 * clinic-owner and doctor registration.
 * Firebase tokens are already time-limited (1 h) so bulk abuse is the
 * only concern — 10 attempts per 15 min window is generous but safe.
 */
const firebasePhoneVerifyLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // ✅ SECURITY: Changed to 1 hour
  max: 5, // ✅ SECURITY: Reduced from 10 to 5
  message: 'Too many phone verification attempts. Please try again later.',
});

/**
 * ✅ PRODUCTION FIX: Dedicated OTP Rate Limiters
 * 
 * Phone-based rate limiting for Message Central OTP authentication
 * - Prevents DoS while allowing legitimate usage
 * - Keys by phone number (not IP) to prevent NAT/corporate network issues
 * - Separate limits for send vs verify operations
 */

// OTP Send Rate Limiter - Prevents SMS spam
const otpSendLimiter = createLimiter({
  windowMs: process.env.NODE_ENV === 'development' ? 10 * 60 * 1000 : 60 * 60 * 1000, // Dev: 10 min, Prod: 1 hour
  max: process.env.NODE_ENV === 'development' ? 20 : 5, // Dev: 20 requests, Prod: 5 requests
  message: 'Too many OTP requests. Please try again later.',
  keyGenerator: (req) => {
    // Use phone number or email from request body for per-user limiting
    const phone = req.body?.mobile?.replace(/\D/g, '') || req.body?.mobileNumber?.replace(/\D/g, '') || req.body?.phoneNumber?.replace(/\D/g, '');
    const email = req.body?.email?.toLowerCase();
    
    if (email) {
      return `otp_send:email:${email}`;
    } else if (phone) {
      return `otp_send:phone:${phone}`;
    }
    // Fallback to IP if neither phone nor email provided
    return `otp_send_ip:${req.ip}`;
  },
  skip: (req) => {
    // Skip rate limiting for test numbers and test emails in development
    if (process.env.NODE_ENV === 'development' || process.env.ENABLE_TEST_OTP === 'true') {
      // Check test phone numbers
      const phone = req.body?.mobile?.replace(/\D/g, '') || req.body?.mobileNumber?.replace(/\D/g, '') || req.body?.phoneNumber?.replace(/\D/g, '');
      const testNumbers = (process.env.TEST_OTP_NUMBERS || '9999999999,8888888888,7777777777').split(',');
      if (phone && testNumbers.includes(phone)) {
        return true; // Skip rate limiting for test numbers
      }
      
      // Check test emails
      const email = req.body?.email?.toLowerCase();
      const testEmails = (process.env.TEST_OTP_EMAILS || 'test@example.com,demo@example.com,admin@test.com').split(',');
      if (email && testEmails.includes(email)) {
        return true; // Skip rate limiting for test emails
      }
    }
    return false;
  },
});

// OTP Verify Rate Limiter - More lenient to allow multiple attempts
const otpVerifyLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 verification attempts per 15 minutes per phone
  message: 'Too many verification attempts. Please try again in 15 minutes.',
  keyGenerator: (req) => {
    const phone = req.body?.mobile?.replace(/\D/g, '') || req.body?.mobileNumber?.replace(/\D/g, '');
    const email = req.body?.email?.toLowerCase();
    
    if (email) {
      return `otp_verify:email:${email}`;
    } else if (phone) {
      return `otp_verify:phone:${phone}`;
    }
    return `otp_verify_ip:${req.ip}`;
  },
  skip: (req) => {
    // Skip rate limiting for test numbers and test emails in development
    if (process.env.NODE_ENV === 'development' || process.env.ENABLE_TEST_OTP === 'true') {
      // Check test phone numbers
      const phone = req.body?.mobile?.replace(/\D/g, '') || req.body?.mobileNumber?.replace(/\D/g, '');
      const testNumbers = (process.env.TEST_OTP_NUMBERS || '9999999999,8888888888,7777777777').split(',');
      if (phone && testNumbers.includes(phone)) {
        return true; // Skip rate limiting for test numbers
      }
      
      // Check test emails
      const email = req.body?.email?.toLowerCase();
      const testEmails = (process.env.TEST_OTP_EMAILS || 'test@example.com,demo@example.com,admin@test.com').split(',');
      if (email && testEmails.includes(email)) {
        return true; // Skip rate limiting for test emails
      }
    }
    return false;
  },
});

module.exports = {
  otpSendLimiter,
  otpVerifyLimiter,
  loginLimiter,
  forgotPasswordLimiter,
  emailVerificationSendLimiter,
  emailVerificationVerifyLimiter,
  resetPasswordLimiter,
  firebasePhoneLoginLimiter,
  firebasePhoneVerifyLimiter,
};
