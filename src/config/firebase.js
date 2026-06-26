/**
 * Firebase Phone Auth for React Native (Expo Go compatible)
 *
 * Uses Firebase REST API instead of Firebase SDK for Expo Go compatibility.
 * Works with expo-firebase-recaptcha for reCAPTCHA handling.
 *
 * ── Setup checklist (before production build) ─────────────────────────────
 * ✅ 1. Android app registered in Firebase Console (package: in.pulsemateconnect.app)
 * ✅ 2. Android App ID configured below
 * ✅ 3. API key configured below
 * ⚠️  4. Add SHA-1 from release keystore:  npx eas credentials --platform android
 * ⚠️  5. Download google-services.json → place in PulseMateApp/ root
 * ⚠️  6. Restrict the API key in Google Cloud Console to package in.pulsemateconnect.app
 */

export const firebaseConfig = {
  apiKey:            'AIzaSyA2PXJxyIZpYOG2tXHDRu95gaaJogKEDBc',
  authDomain:        'pulsemateconnect.firebaseapp.com',
  projectId:         'pulsemateconnect',
  messagingSenderId: '157620382332',
  // Android App ID from Firebase Console (package: in.pulsemateconnect.app)
  appId:             '1:157620382332:android:a13dffbc9a712ac2e6b7f9',
};

const FIREBASE_AUTH_API = 'https://identitytoolkit.googleapis.com/v1';

/**
 * Send OTP via Firebase Phone Auth REST API
 * @param {string} phoneNumber  E.164 format e.g. "+917022818878"
 * @param {string} recaptchaToken  Token from FirebaseRecaptchaVerifierModal
 * @returns {Promise<string>} sessionInfo
 */
export const sendOtpToPhone = async (phoneNumber, recaptchaToken) => {
  const response = await fetch(
    `${FIREBASE_AUTH_API}/accounts:sendVerificationCode?key=${firebaseConfig.apiKey}`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ phoneNumber, recaptchaToken }),
    }
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(friendlyError(data.error?.message || 'Failed to send OTP'));
  }
  return data.sessionInfo;
};

/**
 * Verify OTP and return Firebase ID token
 * @param {string} sessionInfo  From sendOtpToPhone
 * @param {string} code         6-digit OTP
 * @returns {Promise<string>} Firebase ID token
 */
export const verifyPhoneOtp = async (sessionInfo, code) => {
  const response = await fetch(
    `${FIREBASE_AUTH_API}/accounts:signInWithPhoneNumber?key=${firebaseConfig.apiKey}`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ sessionInfo, code }),
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
    INVALID_PHONE_NUMBER:       'Invalid phone number. Enter a valid 10-digit number.',
    TOO_MANY_ATTEMPTS_TRY_LATER:'Too many attempts. Please wait a few minutes.',
    QUOTA_EXCEEDED:             'SMS quota exceeded. Try again later.',
    INVALID_CODE:               'Invalid OTP. Please check the code and try again.',
    SESSION_EXPIRED:            'OTP expired. Please request a new code.',
    MISSING_CODE:               'Please enter the OTP code.',
    CAPTCHA_CHECK_FAILED:       'reCAPTCHA failed. Please try again.',
  };
  for (const [key, value] of Object.entries(map)) {
    if (message.includes(key)) return value;
  }
  return message;
};
