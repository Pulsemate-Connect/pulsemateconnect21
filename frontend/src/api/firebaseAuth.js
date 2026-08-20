/**
 * Firebase Phone Auth — using Firebase JS SDK (v9 modular).
 *
 * Strategy: create a brand-new invisible div each time we need reCAPTCHA,
 * attach it to document.body, use it, then remove it after.
 * This completely avoids the "reCAPTCHA has already been rendered" error.
 */

import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from 'firebase/auth';

// ── Firebase config ────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY             || 'AIzaSyDrZ9d0zKBLI_Pm-c9o1DAV5q4ldE1I9Nw',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN         || 'pulsemateconnect.firebaseapp.com',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID          || 'pulsemateconnect',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '157620382332',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID              || '1:157620382332:web:e4156f49d8616a4ee6b7f9',
};

// Initialize Firebase once
const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth        = getAuth(firebaseApp);

let _verifier   = null;
let _container  = null;   // the dynamically created div

/** Remove old verifier and its container from DOM */
export const clearRecaptcha = () => {
  if (_verifier) {
    try { _verifier.clear(); } catch (_) {}
    _verifier = null;
  }
  if (_container && _container.parentNode) {
    _container.parentNode.removeChild(_container);
  }
  _container = null;

  // Also nuke any leftover grecaptcha widgets Firebase may have injected
  document.querySelectorAll('[id^="__firebase_recaptcha"]').forEach(el => {
    try { el.remove(); } catch (_) {}
  });
};

/** @deprecated kept for backward compat */
export const forceResetRecaptcha = clearRecaptcha;
/** @deprecated not needed with new approach — kept so callers don't break */
export const initRecaptcha = (_id) => null;

/**
 * Send OTP via Firebase Phone Auth.
 * Creates a fresh invisible reCAPTCHA container each call.
 *
 * @param {string} phoneNumber  E.164 format e.g. "+917022818878"
 * @returns {Promise<ConfirmationResult>}
 */
export const sendOtpToPhone = async (phoneNumber) => {
  // 1. Tear down any previous instance
  clearRecaptcha();

  // 2. Create a fresh hidden div and append to body
  _container = document.createElement('div');
  _container.id = `__recaptcha_${Date.now()}`;
  _container.style.cssText = 'position:fixed;bottom:0;right:0;opacity:0;pointer-events:none;';
  document.body.appendChild(_container);

  // 3. Create a fresh RecaptchaVerifier on that container
  _verifier = new RecaptchaVerifier(auth, _container, {
    size: 'invisible',
    callback: () => {},
    'expired-callback': () => { clearRecaptcha(); },
  });

  try {
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, _verifier);
    // Keep container alive until after OTP verification (verifier is still referenced)
    return confirmationResult;
  } catch (err) {
    clearRecaptcha();
    throw new Error(friendlyError(err.code || err.message));
  }
};

/**
 * Verify OTP and get Firebase ID token.
 *
 * @param {ConfirmationResult} confirmationResult  From sendOtpToPhone
 * @param {string}             code               6-digit OTP
 * @returns {Promise<string>}  Firebase idToken
 */
export const verifyPhoneOtp = async (confirmationResult, code) => {
  try {
    const result  = await confirmationResult.confirm(code);
    const idToken = await result.user.getIdToken();
    clearRecaptcha(); // clean up after successful verification
    return idToken;
  } catch (err) {
    throw new Error(friendlyError(err.code || err.message));
  }
};

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
