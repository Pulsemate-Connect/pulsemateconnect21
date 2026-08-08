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
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 OTP sends per hour per phone number
  message: 'Too many OTP requests. Please try again after an hour.',
  keyGenerator: (req) => {
    // Use phone number from request body for per-user limiting
    const phone = req.body?.mobileNumber?.replace(/\D/g, '');
    // Fallback to IP if phone not provided (shouldn't happen in normal flow)
    return phone ? `otp_send:${phone}` : `otp_send_ip:${req.ip}`;
  },
});

// OTP Verify Rate Limiter - More lenient to allow multiple attempts
const otpVerifyLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 verification attempts per 15 minutes per phone
  message: 'Too many verification attempts. Please try again in 15 minutes.',
  keyGenerator: (req) => {
    const phone = req.body?.mobileNumber?.replace(/\D/g, '');
    return phone ? `otp_verify:${phone}` : `otp_verify_ip:${req.ip}`;
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
