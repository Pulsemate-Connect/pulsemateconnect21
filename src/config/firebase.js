/**
 * Firebase Phone Authentication — PulseMate Connect (React Native/Expo)
 *
 * FIREBASE PHONE AUTH FLOW (Production):
 *   1. App calls initializeAuth() once on app startup
 *   2. User enters phone number
 *   3. App calls sendOtpToPhone(phoneNumber)
 *      → Firebase sends real SMS via Google's infrastructure
 *      → Returns ConfirmationResult with verification ID
 *   4. User enters 6-digit OTP from SMS
 *   5. App calls verifyPhoneOtp(confirmationResult, code)
 *      → Firebase verifies OTP locally (no network call)
 *      → Returns User Credential with Firebase ID Token
 *   6. App calls loginWithFirebaseToken(idToken)
 *      → Sends Firebase ID Token to backend
 *      → Backend verifies token using Firebase Admin SDK
 *      → Backend creates/updates user and returns app JWT
 *   7. User logged in ✅
 *
 * KEY DIFFERENCES FROM MOCK/BACKEND-DRIVEN:
 *   ✅ Real SMS sent by Firebase (Google's infrastructure)
 *   ✅ OTP verification happens on client (Firebase SDK)
 *   ✅ OTP never sent to backend
 *   ✅ Backend only receives Firebase ID Token (after successful verification)
 *   ✅ No mock OTP generation or logging
 *   ✅ Supports automatic SMS retrieval (Android/iOS where available)
 *   ✅ reCAPTCHA verification built-in
 *   ✅ Production-ready for Google Play Store
 */

import auth from '@react-native-firebase/auth';
import api from '../api/axios';

// Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyA2PXJxyIZpYOG2tXHDRu95gaaJogKEDBc',
  authDomain: 'pulsemateconnect.firebaseapp.com',
  projectId: 'pulsemateconnect',
  storageBucket: 'pulsemateconnect.appspot.com',
  messagingSenderId: '157620382332',
  appId: '1:157620382332:web:e4156f49d8616a4ee6b7f9',
};

// Note: React Native Firebase auto-initializes from google-services.json
// No manual initialization needed

let confirmationResult = null;

/**
 * Initialize Firebase Auth
 * React Native Firebase auto-initializes from google-services.json
 * This function is kept for API compatibility
 */
export const initializeFirebaseAuth = async () => {
  try {
    console.log('[Firebase] Auth initialized from google-services.json');
    return auth();
  } catch (error) {
    console.error('[Firebase] Initialization error:', error);
    throw new Error('Firebase initialization failed. Please restart the app.');
  }
};

/**
 * Step 1: Send OTP via Firebase Phone Authentication
 *
 * @param {string} phoneNumber - Phone in E.164 format (+91...)
 * @returns {Promise<Object>} - { verificationId, confirmationResult }
 *         confirmationResult has confirm(code) method
 *
 * @throws Error on invalid phone, too many requests, network issues
 */
export const sendOtpToPhone = async (phoneNumber) => {
  // Validate phone format
  if (!phoneNumber || !/^\+[1-9]\d{9,14}$/.test(phoneNumber)) {
    throw new Error('Invalid phone number. Use E.164 format (+91...)');
  }

  try {
    console.log('[Firebase] Sending OTP to', phoneNumber);

    // Firebase Phone Auth - sends real SMS
    const confirmation = await auth().signInWithPhoneNumber(phoneNumber);

    console.log('[Firebase] OTP sent successfully');

    return {
      confirmationResult: confirmation,
    };
  } catch (error) {
    console.error('[Firebase] Phone auth error:', error.code, error.message);
    throw new Error(friendlyPhoneAuthError(error.code || error.message));
  }
};

/**
 * Step 2: Verify OTP entered by user
 *
 * @param {Object} confirmationResult - From sendOtpToPhone()
 * @param {string} code - 6-digit OTP from SMS
 * @returns {Promise<Object>} - { user, credential, idToken }
 *
 * @throws Error on invalid OTP, expired OTP, network issues
 */
export const verifyPhoneOtp = async (confirmationObj, code) => {
  if (!confirmationObj) {
    throw new Error('Invalid confirmation result. Please request a new OTP.');
  }

  if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
    throw new Error('Invalid OTP. Please enter a 6-digit code.');
  }

  try {
    console.log('[Firebase] Verifying OTP...');

    // Confirm the OTP
    const userCredential = await confirmationObj.confirm(code);

    console.log('[Firebase] OTP verified successfully');

    // Get Firebase ID Token
    const idToken = await userCredential.user.getIdToken();

    return {
      user: userCredential.user,
      idToken: idToken,
      phoneNumber: userCredential.user.phoneNumber,
    };
  } catch (error) {
    console.error('[Firebase] OTP verification error:', error.code, error.message);
    throw new Error(friendlyOtpVerificationError(error.code || error.message));
  }
};

/**
 * Step 3: Send Firebase ID Token to backend for authentication
 *
 * Backend will:
 *   1. Verify the Firebase ID Token using Firebase Admin SDK
 *   2. Extract phone number from token
 *   3. Create or update user in database
 *   4. Return application JWT tokens
 *
 * @param {string} idToken - Firebase ID Token from verifyPhoneOtp()
 * @param {string} name - Optional: User display name (for new account creation)
 * @returns {Promise<Object>} - { accessToken, refreshToken, user }
 */
export const loginWithFirebaseToken = async (idToken, name = null) => {
  if (!idToken) {
    throw new Error('Firebase ID Token is required');
  }

  try {
    console.log('[Firebase] Sending ID token to backend...');

    const res = await api.post('/auth/patient/firebase-phone-login', {
      firebaseIdToken: idToken,
      name: name,
    });

    const data = res.data?.data ?? res.data;

    if (!data?.accessToken || !data?.user) {
      throw new Error('Backend authentication failed. Please try again.');
    }

    console.log('[Firebase] Backend authentication successful');

    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken ?? null,
      user: data.user,
    };
  } catch (err) {
    console.error('[Firebase] Backend login error:', err);
    const msg = err?.response?.data?.message || err?.message || 'Authentication failed.';
    throw new Error(friendlyBackendError(msg));
  }
};

/**
 * Resend OTP after initial request expires or times out
 * User can request a new OTP after 60 seconds
 *
 * @param {string} phoneNumber - Phone in E.164 format
 * @returns {Promise<Object>} - { verificationId, confirmationResult }
 */
export const resendOtp = async (phoneNumber) => {
  // Firebase will handle resend automatically if verificationId is provided
  // For now, just re-initiate the full flow
  return sendOtpToPhone(phoneNumber);
};

// ── User-friendly error messages ──────────────────────────────────────────────

const friendlyPhoneAuthError = (code) => {
  const map = {
    'auth/invalid-phone-number':
      'Invalid phone number. Enter a valid number with country code.',
    'auth/too-many-requests':
      'Too many attempts. Please wait a few minutes before trying again.',
    'auth/user-disabled':
      'This phone number has been disabled. Contact support.',
    'auth/operation-not-allowed':
      'Phone authentication is not enabled. Contact support.',
    'auth/captcha-check-failed':
      'reCAPTCHA verification failed. Please check your internet and try again.',
    'auth/network-request-failed':
      'Network error. Please check your internet connection.',
    'auth/internal-error':
      'Firebase error. Please try again.',
    'auth/missing-phone-number':
      'Phone number is required.',
  };

  const message = String(code);
  return map[code] || `Error: ${message}`;
};

const friendlyOtpVerificationError = (code) => {
  const map = {
    'auth/invalid-verification-code':
      'Invalid OTP. Please check the code and try again.',
    'auth/code-expired':
      'OTP has expired. Please request a new code.',
    'auth/missing-verification-code':
      'Please enter the OTP code.',
    'auth/too-many-requests':
      'Too many attempts. Please wait and try again.',
    'auth/session-expired':
      'Session expired. Please request a new OTP.',
    'auth/internal-error':
      'Firebase error. Please try again.',
  };

  const message = String(code);
  return map[code] || `Error: ${message}`;
};

const friendlyBackendError = (msg) => {
  const lowerMsg = String(msg).toLowerCase();

  const errorMap = {
    'firebase': 'Firebase authentication failed. Please try again.',
    'invalid or expired': 'Your session expired. Please request a new OTP.',
    'phone number': 'Phone number issue. Please try again.',
    'network': 'Network error. Check your internet connection.',
  };

  for (const [key, value] of Object.entries(errorMap)) {
    if (lowerMsg.includes(key)) return value;
  }

  return msg || 'Authentication failed. Please try again.';
};

// ── User-friendly error messages ──────────────────────────────────────────────
const friendlyError = (code) => {
  const map = {
    'auth/invalid-phone-number':      'Invalid phone number. Enter a valid 10-digit number.',
    'auth/too-many-requests':         'Too many attempts. Please wait a few minutes.',
    'auth/quota-exceeded':            'SMS quota exceeded. Try again later.',
    'auth/invalid-verification-code': 'Invalid OTP. Please check the code and try again.',
    'auth/code-expired':              'OTP expired. Please request a new code.',
    'auth/session-expired':           'OTP expired. Please request a new code.',
    'auth/missing-verification-code': 'Please enter the OTP code.',
    'auth/network-request-failed':    'Network error. Check your internet connection.',
    'auth/captcha-check-failed':      'reCAPTCHA failed. Please try again.',
    'auth/web-storage-unsupported':   'Please enable cookies/storage in your browser.',
    'auth/operation-not-allowed':     'Phone auth is not enabled. Contact support.',
    'auth/internal-error':            'Firebase error. Please try again.',
  };
  const key = String(code).split(' ')[0];
  return map[key] || `Error: ${code}`;
};
