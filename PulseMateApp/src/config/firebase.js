/**
 * Firebase Phone Auth — REST API with expo-firebase-recaptcha
 *
 * Uses expo-firebase-recaptcha to get a valid recaptchaToken, then
 * calls the Firebase Auth REST API to send/verify OTPs.
 * Works in Expo Go without any native modules.
 */

export const FIREBASE_API_KEY = 'AIzaSyDrZ9d0zKBLI_Pm-c9o1DAV5q4ldE1I9Nw';

export const firebaseConfig = {
  apiKey: 'AIzaSyDrZ9d0zKBLI_Pm-c9o1DAV5q4ldE1I9Nw',
  authDomain: 'pulsemateconnect.firebaseapp.com',
  projectId: 'pulsemateconnect',
  storageBucket: 'pulsemateconnect.firebasestorage.app',
  messagingSenderId: '157620382332',
  appId: '1:157620382332:web:e4156f49d8616a4ee6b7f9',
};

const BASE = 'https://identitytoolkit.googleapis.com/v1';

/**
 * Send OTP via Firebase REST API.
 * @param {string} phoneNumber   E.164 format e.g. "+917022818878"
 * @param {string} recaptchaToken  Token from FirebaseRecaptchaVerifierModal
 * @returns {Promise<string>}    sessionInfo (pass to verifyPhoneOtp)
 */
export const sendOtpToPhone = async (phoneNumber, recaptchaToken) => {
  const res = await fetch(
    `${BASE}/accounts:sendVerificationCode?key=${FIREBASE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber, recaptchaToken }),
    }
  );
  const data = await res.json();
  if (!res.ok) {
    const code = data?.error?.message || 'UNKNOWN';
    throw Object.assign(new Error(friendlyError(code)), { code });
  }
  return data.sessionInfo;
};

/**
 * Verify OTP and get Firebase ID token.
 * @param {string} sessionInfo  From sendOtpToPhone
 * @param {string} code         6-digit OTP entered by user
 * @returns {Promise<string>}   Firebase idToken — send to your backend
 */
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
    CAPTCHA_CHECK_FAILED: 'reCAPTCHA verification failed. Please try again.',
    INVALID_CODE: 'Invalid OTP. Please check the code and try again.',
    SESSION_EXPIRED: 'OTP expired. Please request a new code.',
    INVALID_SESSION_INFO: 'Session expired. Please request a new OTP.',
    MISSING_CODE: 'Please enter the OTP code.',
    NETWORK_REQUEST_FAILED: 'Network error. Check your internet connection.',
  };
  const key = String(code).split(' ')[0];
  return map[key] || `Error: ${code}`;
};
