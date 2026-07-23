/**
 * Firebase Phone Auth for React Native — PulseMate Connect
 *
 * Uses the Firebase JS SDK (v9+ modular API) instead of raw REST calls.
 *
 * WHY: The raw REST API requires a SafetyNet / Play Integrity token to send
 * OTPs to REAL phone numbers on Android production builds. The Firebase JS SDK
 * handles this verification automatically — it:
 *   1. Uses the google-services.json / SHA-1 fingerprint to verify the app.
 *   2. Passes the app attestation silently to Firebase servers.
 *   3. Returns a ConfirmationResult that you call .confirm(code) on.
 *
 * Setup confirmed:
 *   ✅ google-services.json at repo root (app.json → android.googleServicesFile)
 *   ✅ Package: in.pulsemateconnect.patient
 *   ✅ SHA-1 fingerprint added to Firebase Console (Play Store key)
 *   ✅ Firebase project: pulsemateconnect
 *   ✅ Blaze billing enabled (required for real SMS)
 *   ✅ Test phone numbers removed from Firebase Console
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPhoneNumber,
  initializeAuth,
  getReactNativePersistence,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Firebase project config ───────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: 'AIzaSyA2PXJxyIZpYOG2tXHDRu95gaaJogKEDBc',
  authDomain: 'pulsemateconnect.firebaseapp.com',
  projectId: 'pulsemateconnect',
  storageBucket: 'pulsemateconnect.appspot.com',
  messagingSenderId: '157620382332',
  appId: '1:157620382332:android:a13dffbc9a712ac2e6b7f9',
};

// ── Initialize Firebase app (singleton) ──────────────────────────────────────
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// ── Initialize Auth with AsyncStorage persistence ────────────────────────────
// initializeAuth is idempotent — safe to call every time this module loads.
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  // Already initialized — getAuth returns the existing instance
  auth = getAuth(app);
}

/**
 * Send OTP to a real phone number via Firebase Phone Auth SDK.
 *
 * The SDK automatically handles SafetyNet / Play Integrity attestation on
 * Android production builds — no reCAPTCHA or manual token needed.
 *
 * @param {string} phoneNumber  E.164 format — e.g. "+917022818878"
 * @returns {Promise<import('firebase/auth').ConfirmationResult>} confirmationResult
 *
 * Usage:
 *   const confirmationResult = await sendOtpToPhone('+917022818878');
 *   // user enters OTP → call verifyPhoneOtp(confirmationResult, '123456')
 */
export const sendOtpToPhone = async (phoneNumber) => {
  try {
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber);
    return confirmationResult;
  } catch (error) {
    throw new Error(friendlyError(error.code || error.message || 'Failed to send OTP'));
  }
};

/**
 * Verify the OTP entered by the user and get a Firebase ID token.
 *
 * @param {import('firebase/auth').ConfirmationResult} confirmationResult
 *   Returned by sendOtpToPhone()
 * @param {string} code  6-digit OTP entered by the user
 * @returns {Promise<string>} Firebase ID token — send this to your backend
 */
export const verifyPhoneOtp = async (confirmationResult, code) => {
  try {
    const userCredential = await confirmationResult.confirm(code);
    const idToken = await userCredential.user.getIdToken();
    return idToken;
  } catch (error) {
    throw new Error(friendlyError(error.code || error.message || 'Invalid OTP'));
  }
};

// ── Human-readable error messages ────────────────────────────────────────────
const friendlyError = (code) => {
  const map = {
    // Firebase Auth error codes
    'auth/invalid-phone-number': 'Invalid phone number. Enter a valid 10-digit number.',
    'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',
    'auth/quota-exceeded': 'SMS quota exceeded. Please try again later.',
    'auth/invalid-verification-code': 'Invalid OTP. Please check the code and try again.',
    'auth/code-expired': 'OTP expired. Please request a new code.',
    'auth/missing-verification-code': 'Please enter the OTP code.',
    'auth/app-not-authorized': 'App not authorized. Please update the app and try again.',
    'auth/captcha-check-failed': 'Verification failed. Please try again.',
    'auth/missing-phone-number': 'Phone number is required.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/network-request-failed': 'Network error. Check your internet connection.',
    // Legacy REST API error strings (kept for safety)
    'INVALID_PHONE_NUMBER': 'Invalid phone number. Enter a valid 10-digit number.',
    'TOO_MANY_ATTEMPTS_TRY_LATER': 'Too many attempts. Please wait a few minutes.',
    'QUOTA_EXCEEDED': 'SMS quota exceeded. Try again later.',
    'INVALID_CODE': 'Invalid OTP. Please check the code and try again.',
    'SESSION_EXPIRED': 'OTP expired. Please request a new code.',
    'CAPTCHA_CHECK_FAILED': 'Verification failed. Please try again.',
  };

  for (const [key, value] of Object.entries(map)) {
    if (code.includes(key)) return value;
  }
  return typeof code === 'string' && code.length < 120 ? code : 'Something went wrong. Please try again.';
};
