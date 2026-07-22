const otpRepository = require('../repositories/otp.repository');
const logger = require('../config/logger');
const { generateOtp, hashOtp, verifyOtpHash } = require('../utils/hash');
const { sendOtpSms } = require('./sms.service');

const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10);
const OTP_MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10);
const OTP_RESEND_COOLDOWN_SECONDS = parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS || '60', 10);

const SMS_PROVIDER = (process.env.SMS_PROVIDER || 'mock').toLowerCase().trim();

const dispatchOtp = async (mobile, otp) => {
  try {
    await sendOtpSms(mobile, otp);
  } catch (err) {
    // Never crash the request if SMS fails — log and continue
    logger.error(`SMS dispatch failed for ${mobile}: ${err.message}`);
  }
};

const sendOtp = async (mobile, purpose = 'LOGIN') => {
  const recent = await otpRepository.findRecentActive(
    mobile,
    purpose,
    new Date(Date.now() - OTP_RESEND_COOLDOWN_SECONDS * 1000)
  );

  if (recent) {
    const secondsLeft = Math.ceil((recent.createdAt.getTime() + OTP_RESEND_COOLDOWN_SECONDS * 1000 - Date.now()) / 1000);
    const error = new Error(`Please wait ${secondsLeft} seconds before requesting a new OTP`);
    error.status = 429;
    throw error;
  }

  await otpRepository.invalidateOutstanding(mobile, purpose);

  const otp = generateOtp(6);

  // When using Firebase provider, Firebase generates and sends its own OTP code.
  // We still store a record in DB for rate-limiting/cooldown tracking,
  // but the actual OTP hash is not used for verification (Firebase handles that).
  await otpRepository.create({
    mobile,
    purpose,
    otpHash: await hashOtp(otp), // stored but only used for non-Firebase providers
    expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
    maxAttempts: OTP_MAX_ATTEMPTS,
  });

  await dispatchOtp(mobile, otp);

  return { message: 'OTP sent successfully' };
};

const verifyOtp = async (mobile, otp, purpose = 'LOGIN') => {
  // ── Firebase provider: verify via Firebase REST API ────────────────────────
  if (SMS_PROVIDER === 'firebase') {
    return verifyOtpViaFirebase(mobile, otp, purpose);
  }

  // ── All other providers: verify against DB hash ────────────────────────────
  return verifyOtpViaDatabase(mobile, otp, purpose);
};

// ── Firebase verification ─────────────────────────────────────────────────────
const verifyOtpViaFirebase = async (mobile, otp, purpose) => {
  const { _verifyFirebaseOtp } = require('./sms.service');

  try {
    // Verify OTP with Firebase — returns Firebase ID token
    await _verifyFirebaseOtp(mobile, otp);

    // Mark DB record as used (for rate limiting)
    const record = await otpRepository.findLatestValid(mobile, purpose);
    if (record) {
      await otpRepository.update(record.id, {
        isUsed: true,
        verifiedAt: new Date(),
        attempts: { increment: 1 },
      });
    }

    logger.info(`[OTP] Firebase verification success for ${mobile}`);
    return true;
  } catch (err) {
    // Increment attempts in DB for rate limiting
    const record = await otpRepository.findLatestValid(mobile, purpose).catch(() => null);
    if (record) {
      await otpRepository.update(record.id, { attempts: { increment: 1 } }).catch(() => {});
    }

    const friendlyMsg = friendlyFirebaseError(err.message);
    const error = new Error(friendlyMsg);
    error.status = err.status || 400;
    throw error;
  }
};

// ── Database verification (non-Firebase providers) ────────────────────────────
const verifyOtpViaDatabase = async (mobile, otp, purpose) => {
  const record = await otpRepository.findLatestValid(mobile, purpose);

  if (!record) {
    const error = new Error('OTP expired or not found. Please request a new OTP.');
    error.status = 400;
    throw error;
  }

  if (record.attempts >= record.maxAttempts) {
    await otpRepository.update(record.id, { isUsed: true });
    const error = new Error('Maximum OTP attempts exceeded. Please request a new OTP.');
    error.status = 429;
    throw error;
  }

  const isValid = await verifyOtpHash(otp, record.otpHash);
  await otpRepository.update(record.id, {
    attempts: { increment: 1 },
    ...(isValid ? { isUsed: true, verifiedAt: new Date() } : {}),
  });

  if (!isValid) {
    const remaining = Math.max(record.maxAttempts - (record.attempts + 1), 0);
    const error = new Error(`Invalid OTP. ${remaining} attempts remaining.`);
    error.status = 400;
    throw error;
  }

  return true;
};

// ── Firebase error → user-friendly message ────────────────────────────────────
const friendlyFirebaseError = (message = '') => {
  const m = message.toUpperCase();
  if (m.includes('INVALID_CODE'))           return 'Invalid OTP. Please check and try again.';
  if (m.includes('SESSION_EXPIRED'))        return 'OTP expired. Please request a new code.';
  if (m.includes('TOO_MANY_ATTEMPTS'))      return 'Too many attempts. Please wait a few minutes.';
  if (m.includes('QUOTA_EXCEEDED'))         return 'SMS quota exceeded. Try again later.';
  if (m.includes('INVALID_PHONE_NUMBER'))   return 'Invalid phone number.';
  if (m.includes('MISSING_CLIENT'))         return 'Configuration error. Please try again.';
  return message;
};

module.exports = { sendOtp, verifyOtp };
