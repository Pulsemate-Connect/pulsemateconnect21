/**
 * Firebase Phone Auth — PulseMate Connect
 *
 * Flow:
 *   1. App calls Firebase REST API sendVerificationCode directly
 *      (same as before — this works because the app is signed with
 *       the registered SHA-1 fingerprint in google-services.json)
 *   2. Firebase sends SMS to user's phone
 *   3. User enters OTP
 *   4. App calls Firebase REST API signInWithPhoneNumber → gets idToken
 *   5. App sends idToken to backend → backend verifies → issues app JWT
 *
 * This is the CORRECT flow for a production Android app.
 * The backend /auth/send-otp route is used as fallback only.
 */

import api from '../api/axios';

const FIREBASE_API_KEY = 'AIzaSyA2PXJxyIZpYOG2tXHDRu95gaaJogKEDBc';
const FIREBASE_AUTH_API = 'https://identitytoolkit.googleapis.com/v1';

/**
 * Send OTP via Firebase REST API directly from the app.
 * The app's SHA-1 fingerprint in google-services.json authenticates it.
 *
 * @param {string} phoneNumber  E.164 format e.g. "+917022818878"
 * @returns {Promise<string>} sessionInfo token
 */
export const sendOtpToPhone = async (phoneNumber) => {
  try {
    const response = await fetch(
      `${FIREBASE_AUTH_API}/accounts:sendVerificationCode?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      }
    );
    const data = await response.json();

    if (data.sessionInfo) {
      return data.sessionInfo;
    }

    // Firebase rejected — fall back to backend OTP
    const errCode = data.error?.message || 'FIREBASE_ERROR';
    console.warn('[Firebase] sendVerificationCode failed:', errCode, '— trying backend fallback');

    return sendOtpViaBackend(phoneNumber);
  } catch (err) {
    console.warn('[Firebase] Network error:', err.message, '— trying backend fallback');
    return sendOtpViaBackend(phoneNumber);
  }
};

/**
 * Backend fallback — used when Firebase REST fails
 * Returns phone number as session token (backend verifies OTP via DB hash)
 */
const sendOtpViaBackend = async (phoneNumber) => {
  await api.post('/auth/send-otp', { mobile: phoneNumber });
  // Prefix to distinguish backend sessions from Firebase sessions
  return `BACKEND:${phoneNumber}`;
};

/**
 * Verify OTP.
 * - If sessionInfo starts with "BACKEND:" → verify via backend
 * - Otherwise → verify via Firebase REST API → get idToken → backend login
 *
 * @param {string} sessionInfo  From sendOtpToPhone
 * @param {string} code         6-digit OTP
 * @returns {Promise<{ accessToken, refreshToken, user }>}
 */
export const verifyPhoneOtp = async (sessionInfo, code) => {
  // Backend fallback path
  if (sessionInfo?.startsWith('BACKEND:')) {
    const mobile = sessionInfo.replace('BACKEND:', '');
    return verifyViaBackend(mobile, code);
  }

  // Firebase path
  try {
    const response = await fetch(
      `${FIREBASE_AUTH_API}/accounts:signInWithPhoneNumber?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionInfo, code }),
      }
    );
    const data = await response.json();

    if (data.idToken) {
      // Send Firebase idToken to backend → get app JWT
      const res = await api.post('/auth/patient/firebase-phone-login', {
        firebaseIdToken: data.idToken,
      });
      return res.data?.data ?? res.data;
    }

    throw new Error(friendlyError(data.error?.message || 'Invalid OTP'));
  } catch (err) {
    if (err.message && !err.message.includes('fetch')) {
      throw err;
    }
    throw new Error(friendlyError(err.message || 'Verification failed'));
  }
};

/**
 * Verify OTP via backend (fallback path)
 */
const verifyViaBackend = async (mobile, code) => {
  const res = await api.post('/auth/verify-otp', { mobile, otp: code });
  return res.data?.data ?? res.data;
};

// ── Error message mapping ─────────────────────────────────────────────────────
const friendlyError = (message = '') => {
  const m = message.toUpperCase();
  if (m.includes('INVALID_PHONE_NUMBER'))     return 'Invalid phone number. Enter a valid 10-digit number.';
  if (m.includes('TOO_MANY_ATTEMPTS'))        return 'Too many attempts. Please wait a few minutes.';
  if (m.includes('QUOTA_EXCEEDED'))           return 'SMS quota exceeded. Try again later.';
  if (m.includes('INVALID_CODE') ||
      m.includes('INVALID OTP'))              return 'Invalid OTP. Please check the code and try again.';
  if (m.includes('SESSION_EXPIRED') ||
      m.includes('OTP EXPIRED'))              return 'OTP expired. Please request a new code.';
  if (m.includes('MISSING_CODE'))             return 'Please enter the OTP code.';
  if (m.includes('MISSING_CLIENT'))           return 'App configuration error. Please update the app.';
  if (m.includes('WAIT'))                     return message;
  return message;
};
