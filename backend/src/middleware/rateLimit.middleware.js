const rateLimit = require('express-rate-limit');

const isDev = process.env.NODE_ENV === 'development';

const createLimiter = ({ windowMs, max, message, keyGenerator }) =>
  rateLimit({
    windowMs,
    max: isDev ? 1000 : max,
    skip: () => isDev,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: keyGenerator || ((req) => req.ip),
    message: {
      success: false,
      message,
    },
  });

const otpSendLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many OTP requests. Please try again later.',
});

const otpVerifyLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many OTP verification attempts. Please try again later.',
});

const loginLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
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
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many login attempts. Please try again later.',
});

/**
 * Rate limiter for Firebase phone verification endpoints used during
 * clinic-owner and doctor registration.
 * Firebase tokens are already time-limited (1 h) so bulk abuse is the
 * only concern — 10 attempts per 15 min window is generous but safe.
 */
const firebasePhoneVerifyLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many phone verification attempts. Please try again later.',
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
