/**
 * Firebase Phone Auth — PulseMate Connect
 *
 * Uses Firebase REST API (Identity Toolkit v1).
 * App verification for real numbers on Android production builds is handled
 * automatically by Firebase using:
 *   - google-services.json (with certificate_hash — Play Store SHA-1)
 *   - The SHA-1 registered in Firebase Console
 *
 * No Firebase JS SDK needed — the REST API works for production builds
 * when the google-services.json and SHA-1 fingerprint are correctly configured.
 */

export const firebaseConfig = {
  apiKey: 'AIzaSyA2PXJxyIZpYOG2tXHDRu95gaaJogKEDBc',
  authDomain: 'pulsemateconnect.firebaseapp.com',
  projectId: 'pulsemateconnect',
  storageBucket: 'pulsemateconnect.firebasestorage.app',
  messagingSenderId: '157620382332',
  appId: '1:157620382332:android:063dba90b53a1c81e6b7f9',
};

const FIREBASE_AUTH_API = 'https://identitytoolkit.googleapis.com/v1';

/**
 * Send OTP via Firebase Phone Auth REST API.
 * @param {string} phoneNumber  E.164 format — e.g. "+917022818878"
 * @returns {Promise<string>} sessionInfo token
 */
export const sendOtpToPhone = async (phoneNumber) => {
  const response = await fetch(
    `${FIREBASE_AUTH_API}/accounts:sendVerificationCode?key=${firebaseConfig.apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber }),
    }
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(friendlyError(data.error?.message || 'Failed to send OTP'));
  }
  return data.sessionInfo;
};

/**
 * Verify OTP and return Firebase ID token.
 * @param {string} sessionInfo  From sendOtpToPhone()
 * @param {string} code         6-digit OTP
 * @returns {Promise<string>} Firebase ID token — send to backend
 */
export const verifyPhoneOtp = async (sessionInfo, code) => {
  const response = await fetch(
    `${FIREBASE_AUTH_API}/accounts:signInWithPhoneNumber?key=${firebaseConfig.apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionInfo, code }),
    }
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(friendlyError(data.error?.message || 'Invalid OTP'));
  }
  return data.idToken;
};

const friendlyError = (message) => {
  const map = {
    INVALID_PHONE_NUMBER: 'Invalid phone number. Enter a valid 10-digit number.',
    TOO_MANY_ATTEMPTS_TRY_LATER: 'Too many attempts. Please wait a few minutes.',
    QUOTA_EXCEEDED: 'SMS quota exceeded. Try again later.',
    INVALID_CODE: 'Invalid OTP. Please check the code and try again.',
    SESSION_EXPIRED: 'OTP expired. Please request a new code.',
    MISSING_CODE: 'Please enter the OTP code.',
    CAPTCHA_CHECK_FAILED: 'Verification failed. Please try again.',
    APP_NOT_AUTHORIZED: 'App verification failed. Please update the app.',
    INVALID_APP_CREDENTIAL: 'App credential invalid. Please update the app.',
    BILLING_NOT_ENABLED: 'SMS service not enabled. Contact support.',
  };
  for (const [key, value] of Object.entries(map)) {
    if (message.includes(key)) return value;
  }
  return message;
};
