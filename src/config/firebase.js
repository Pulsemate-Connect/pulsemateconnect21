/**
 * Firebase Phone Auth — PulseMate Connect
 *
 * ── Why this changed ────────────────────────────────────────────────────────
 * The Firebase REST API endpoint `sendVerificationCode` requires one of:
 *   • A reCAPTCHA token (web only)
 *   • A SafetyNet / Play Integrity token  (Android production builds)
 *   • An App Check token
 *
 * Without these, Firebase returns MISSING_CLIENT_IDENTIFIER.
 *
 * ── Solution ────────────────────────────────────────────────────────────────
 * OTP send + verify are handled entirely by the PulseMate backend:
 *   POST /auth/send-otp   → backend sends SMS via its own OTP service
 *   POST /auth/verify-otp → backend verifies OTP and issues app JWT
 *
 * No Firebase REST API calls are needed for the OTP flow.
 * No Google Sign-In is initialized on startup.
 * ────────────────────────────────────────────────────────────────────────────
 */

import api from '../api/axios';

// ── Firebase project config (kept for reference / future use) ────────────────
export const firebaseConfig = {
  apiKey:            'AIzaSyA2PXJxyIZpYOG2tXHDRu95gaaJogKEDBc',
  authDomain:        'pulsemateconnect.firebaseapp.com',
  projectId:         'pulsemateconnect',
  messagingSenderId: '157620382332',
  appId:             '1:157620382332:android:063dba90b53a1c81e6b7f9', // in.pulsemateconnect.patient
};

/**
 * Send OTP via backend SMS service.
 * Routes through POST /auth/send-otp — no Firebase REST call.
 *
 * @param {string} phoneNumber  E.164 format e.g. "+917022818878"
 * @returns {Promise<string>} A session token (the phone number) to pass to verifyOtp
 */
export const sendOtpToPhone = async (phoneNumber) => {
  try {
    await api.post('/auth/send-otp', { mobile: phoneNumber });
    // Return the phone number as the "session" — backend uses it as the key
    return phoneNumber;
  } catch (err) {
    // Surface a clean error message
    const serverMsg = err?.response?.data?.message;
    throw new Error(friendlyError(serverMsg || err?.message || 'Failed to send OTP. Please try again.'));
  }
};

/**
 * Verify OTP via backend.
 * Routes through POST /auth/verify-otp — returns app JWT directly.
 *
 * @param {string} sessionInfo  The phone number returned from sendOtpToPhone
 * @param {string} code         6-digit OTP
 * @param {string} [name]       Optional name for new users
 * @returns {Promise<{ accessToken: string, refreshToken?: string, user: object }>}
 */
export const verifyPhoneOtp = async (sessionInfo, code, name) => {
  try {
    const res = await api.post('/auth/verify-otp', {
      mobile: sessionInfo,
      otp: code,
      ...(name ? { name } : {}),
    });
    // Backend returns { data: { accessToken, user, refreshToken? } }
    return res.data?.data ?? res.data;
  } catch (err) {
    const serverMsg = err?.response?.data?.message;
    throw new Error(friendlyError(serverMsg || err?.message || 'Verification failed. Please try again.'));
  }
};

// ── Error message mapping ─────────────────────────────────────────────────────
const friendlyError = (message = '') => {
  const m = message.toUpperCase();
  if (m.includes('INVALID_PHONE_NUMBER'))        return 'Invalid phone number. Enter a valid 10-digit number.';
  if (m.includes('TOO_MANY_ATTEMPTS'))            return 'Too many attempts. Please wait a few minutes.';
  if (m.includes('QUOTA_EXCEEDED'))               return 'SMS quota exceeded. Try again later.';
  if (m.includes('INVALID_CODE') ||
      m.includes('INVALID OTP'))                  return 'Invalid OTP. Please check the code and try again.';
  if (m.includes('SESSION_EXPIRED') ||
      m.includes('OTP EXPIRED'))                  return 'OTP expired. Please request a new code.';
  if (m.includes('MISSING_CODE'))                 return 'Please enter the OTP code.';
  if (m.includes('MISSING_CLIENT_IDENTIFIER'))    return 'Configuration error. Please restart the app and try again.';
  if (m.includes('WAIT') || m.includes('WAIT ')) return message; // keep "wait X seconds" messages as-is
  return message;
};
