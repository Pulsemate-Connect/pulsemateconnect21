/**
 * Firebase Phone Auth for React Native (Expo + EAS Build compatible)
 * 
 * Uses Firebase REST API directly — no native SDK or reCAPTCHA widget needed.
 */

// ── Firebase config (same project as web app) ─────────────────────────────────
export const firebaseConfig = {
  apiKey: 'AIzaSyDrZ9d0zKBLI_Pm-c9o1DAV5q4ldE1I9Nw',
  authDomain: 'pulsemateconnect.firebaseapp.com',
  projectId: 'pulsemateconnect',
  messagingSenderId: '157620382332',
  appId: '1:157620382332:web:e4156f49d8616a4ee6b7f9',
};

const FIREBASE_AUTH_API = 'https://identitytoolkit.googleapis.com/v1';

/**
 * Send OTP via Firebase Phone Auth REST API
 * No reCAPTCHA token needed — Firebase REST API handles verification server-side.
 *
 * @param {string} phoneNumber - E.164 format e.g. "+917022818878"
 * @returns {Promise<string>} sessionInfo - Pass to verifyPhoneOtp
 */
export const sendOtpToPhone = async (phoneNumber) => {
  try {
    const response = await fetch(
      `${FIREBASE_AUTH_API}/accounts:sendVerificationCode?key=${firebaseConfig.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber,
          // safetyNetToken / recaptchaToken not sent — Firebase allows REST API
          // calls when the Android app's SHA-256 fingerprint is registered in
          // the Firebase project. Register fingerprints at:
          // Firebase Console → Project Settings → Your apps → Add fingerprint
          // Fingerprints needed:
          //   Debug:      46:00:0C:3E:1A:D5:79:6F:FF:1E:61:FC:EC:ED:8E:61:21:FF:15:A7
          //   Production: Get from Play Console → Setup → App integrity → App signing
        }),
      }
    );

    const data = await response.json();

    if (__DEV__) {
      console.log('[Firebase OTP] Response status:', response.status);
      console.log('[Firebase OTP] Response data:', JSON.stringify(data));
    }

    if (!response.ok) {
      const errMsg = data.error?.message || 'Failed to send OTP';
      console.error('[Firebase OTP] Error:', errMsg);
      throw new Error(friendlyError(errMsg));
    }

    return data.sessionInfo;
  } catch (error) {
    if (__DEV__) console.error('[Firebase OTP] sendOtpToPhone failed:', error.message);
    throw new Error(error.message || 'Failed to send OTP. Please try again.');
  }
};

/**
 * Verify OTP and get Firebase ID token
 * 
 * @param {string} sessionInfo - From sendOtpToPhone
 * @param {string} code - 6-digit OTP entered by user
 * @returns {Promise<string>} Firebase ID token - send to backend
 */
export const verifyPhoneOtp = async (sessionInfo, code) => {
  try {
    const response = await fetch(
      `${FIREBASE_AUTH_API}/accounts:signInWithPhoneNumber?key=${firebaseConfig.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionInfo,
          code,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(friendlyError(data.error?.message || 'Invalid OTP'));
    }

    return data.idToken;
  } catch (error) {
    throw new Error(error.message || 'Verification failed. Please try again.');
  }
};

const friendlyError = (message) => {
  const errorMap = {
    'INVALID_PHONE_NUMBER': 'Invalid phone number. Enter a valid 10-digit number.',
    'TOO_MANY_ATTEMPTS_TRY_LATER': 'Too many attempts. Please wait a few minutes.',
    'QUOTA_EXCEEDED': 'SMS quota exceeded. Try again later.',
    'INVALID_CODE': 'Invalid OTP. Please check the code and try again.',
    'SESSION_EXPIRED': 'OTP expired. Please request a new code.',
    'MISSING_CODE': 'Please enter the OTP code.',
    'CAPTCHA_CHECK_FAILED': 'Verification failed. Please try again.',
    // This error means the app SHA-256 fingerprint is not registered in Firebase.
    // Fix: Firebase Console → Project Settings → Your Android app → Add fingerprint
    'MISSING_CLIENT_IDENTIFIER': 'App verification failed. Please contact support or try again later.',
    'MISSING_APP_CREDENTIAL': 'App verification failed. Please contact support.',
    'INVALID_APP_CREDENTIAL': 'App credential is invalid. Please reinstall the app.',
    'MISSING_OR_INVALID_NONCE': 'Verification session expired. Please try again.',
    'BILLING_NOT_ENABLED': 'SMS service unavailable. Please contact support.',
  };

  for (const [key, value] of Object.entries(errorMap)) {
    if (message.includes(key)) {
      return value;
    }
  }

  return message;
};
