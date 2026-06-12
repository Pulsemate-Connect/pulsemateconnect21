/**
 * Firebase Phone Auth — REST API for web portal.
 *
 * Same approach as the mobile app (no SDK, no reCAPTCHA widget needed for test numbers).
 * Works in browser without any native modules.
 *
 * Flow:
 *   1. sendOtpToPhone(phoneNumber)      → Firebase sends SMS, returns sessionInfo
 *   2. verifyPhoneOtp(sessionInfo, code) → Firebase verifies OTP, returns idToken
 *   3. firebasePhoneLogin(idToken)       → our backend verifies & returns JWT
 */

const FIREBASE_API_KEY = import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDrZ9d0zKBLI_Pm-c9o1DAV5q4ldE1I9Nw';
const BASE = 'https://identitytoolkit.googleapis.com/v1';

export const sendOtpToPhone = async (phoneNumber) => {
  const res = await fetch(
    `${BASE}/accounts:sendVerificationCode?key=${FIREBASE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber,
        recaptchaToken: 'test-reCAPTCHA-token', // bypassed for test numbers
      }),
    }
  );
  const data = await res.json();
  if (!res.ok) {
    const code = data?.error?.message || 'UNKNOWN';
    throw Object.assign(new Error(friendlyError(code)), { code });
  }
  return data.sessionInfo;
};

export const verifyPhoneOtp = async (sessionInfo, code) => {
  const res = await fetch(
    `${BASE}/accounts:signInWithPhoneNumber?key=${FIREBASE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionInfo, code }),
    }
  );
  const data = await res.json();
  if (!res.ok) {
    const errCode = data?.error?.message || 'UNKNOWN';
    throw Object.assign(new Error(friendlyError(errCode)), { code: errCode });
  }
  return data.idToken;
};

const friendlyError = (code) => {
  const map = {
    INVALID_PHONE_NUMBER: 'Invalid phone number. Enter a valid 10-digit number.',
    TOO_MANY_ATTEMPTS_TRY_LATER: 'Too many attempts. Please wait a few minutes.',
    QUOTA_EXCEEDED: 'SMS quota exceeded. Try again later.',
    INVALID_CODE: 'Invalid OTP. Please check the code and try again.',
    SESSION_EXPIRED: 'OTP expired. Please request a new code.',
    INVALID_SESSION_INFO: 'Session expired. Please request a new OTP.',
    MISSING_CODE: 'Please enter the OTP code.',
    NETWORK_REQUEST_FAILED: 'Network error. Check your internet connection.',
  };
  const key = String(code).split(' ')[0];
  return map[key] || `Error: ${code}`;
};
