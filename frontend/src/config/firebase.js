/**
 * Firebase Web SDK Configuration — PulseMate Connect
 *
 * Initializes Firebase Authentication for web platform.
 * Used for phone authentication with invisible reCAPTCHA.
 *
 * Features:
 *   - Phone authentication
 *   - Invisible reCAPTCHA verification
 *   - ID token generation
 *
 * @module config/firebase
 */

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  signOut 
} from 'firebase/auth';

// ──────────────────────────────────────────────────────────────────────────────
// Firebase Configuration
// ──────────────────────────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate configuration
const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];
const missingKeys = requiredKeys.filter(key => !firebaseConfig[key]);

if (missingKeys.length > 0) {
  console.error(
    '[Firebase] Missing configuration:',
    missingKeys.map(k => `VITE_FIREBASE_${k.toUpperCase()}`).join(', ')
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Initialize Firebase
// ──────────────────────────────────────────────────────────────────────────────

let app;
let auth;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  console.log('[Firebase] Initialized successfully');
} catch (error) {
  console.error('[Firebase] Initialization failed:', error);
  throw new Error('Firebase initialization failed. Check your configuration.');
}

// ──────────────────────────────────────────────────────────────────────────────
// reCAPTCHA Verifier
// ──────────────────────────────────────────────────────────────────────────────

let recaptchaVerifier = null;

/**
 * Initialize invisible reCAPTCHA verifier
 * 
 * @param {string} containerId - DOM element ID for reCAPTCHA
 * @returns {RecaptchaVerifier} Configured reCAPTCHA verifier
 */
export const setupRecaptcha = (containerId = 'recaptcha-container') => {
  try {
    // Clean up existing verifier
    if (recaptchaVerifier) {
      recaptchaVerifier.clear();
      recaptchaVerifier = null;
    }

    // Create new invisible reCAPTCHA verifier
    recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: (response) => {
        console.log('[Firebase] reCAPTCHA solved:', response);
      },
      'expired-callback': () => {
        console.warn('[Firebase] reCAPTCHA expired, resetting...');
        if (recaptchaVerifier) {
          recaptchaVerifier.clear();
          recaptchaVerifier = null;
        }
      },
    });

    console.log('[Firebase] reCAPTCHA verifier initialized');
    return recaptchaVerifier;
  } catch (error) {
    console.error('[Firebase] reCAPTCHA setup failed:', error);
    throw error;
  }
};

/**
 * Clear reCAPTCHA verifier
 */
export const clearRecaptcha = () => {
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
      recaptchaVerifier = null;
      console.log('[Firebase] reCAPTCHA cleared');
    } catch (error) {
      console.error('[Firebase] Error clearing reCAPTCHA:', error);
    }
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// Phone Authentication
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Send OTP to phone number via Firebase
 *
 * @param {string} phoneNumber - Phone number in E.164 format (+919876543210)
 * @param {RecaptchaVerifier} appVerifier - reCAPTCHA verifier instance
 * @returns {Promise<ConfirmationResult>} Confirmation result for OTP verification
 * @throws {Error} If sending OTP fails
 */
export const sendOtpToPhone = async (phoneNumber, appVerifier) => {
  try {
    console.log('[Firebase] Sending OTP to:', phoneNumber);

    const confirmationResult = await signInWithPhoneNumber(
      auth,
      phoneNumber,
      appVerifier
    );

    console.log('[Firebase] OTP sent successfully');
    return confirmationResult;
  } catch (error) {
    console.error('[Firebase] Send OTP error:', error);

    // Map Firebase error codes to user-friendly messages
    const errorMessage = getFirebaseErrorMessage(error);
    throw new Error(errorMessage);
  }
};

/**
 * Verify OTP and get Firebase ID token
 *
 * @param {ConfirmationResult} confirmationResult - Result from sendOtpToPhone
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise<string>} Firebase ID token
 * @throws {Error} If verification fails
 */
export const verifyOtp = async (confirmationResult, otp) => {
  try {
    console.log('[Firebase] Verifying OTP...');

    // Confirm OTP with Firebase
    const userCredential = await confirmationResult.confirm(otp);

    // Get ID token
    const idToken = await userCredential.user.getIdToken();

    console.log('[Firebase] OTP verified successfully');
    return idToken;
  } catch (error) {
    console.error('[Firebase] Verify OTP error:', error);

    // Map Firebase error codes to user-friendly messages
    const errorMessage = getFirebaseErrorMessage(error);
    throw new Error(errorMessage);
  }
};

/**
 * Sign out from Firebase
 */
export const signOutFirebase = async () => {
  try {
    await signOut(auth);
    clearRecaptcha();
    console.log('[Firebase] Signed out successfully');
  } catch (error) {
    console.error('[Firebase] Sign out error:', error);
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// Error Handling
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Convert Firebase error codes to user-friendly messages
 *
 * @param {Error} error - Firebase error
 * @returns {string} User-friendly error message
 */
const getFirebaseErrorMessage = (error) => {
  const code = error.code || '';

  const errorMessages = {
    // Phone authentication errors
    'auth/invalid-phone-number': 'Invalid phone number format. Please enter a valid number.',
    'auth/missing-phone-number': 'Phone number is required.',
    'auth/quota-exceeded': 'SMS quota exceeded. Please try again later.',
    'auth/user-disabled': 'This account has been disabled.',
    
    // OTP verification errors
    'auth/invalid-verification-code': 'Invalid OTP. Please check and try again.',
    'auth/code-expired': 'OTP has expired. Please request a new one.',
    'auth/session-expired': 'Session expired. Please start over.',
    
    // reCAPTCHA errors
    'auth/captcha-check-failed': 'reCAPTCHA verification failed. Please try again.',
    'auth/missing-app-credential': 'App verification failed. Please refresh and try again.',
    
    // Rate limiting
    'auth/too-many-requests': 'Too many requests. Please wait a few minutes and try again.',
    
    // Network errors
    'auth/network-request-failed': 'Network error. Please check your connection and try again.',
    
    // Configuration errors
    'auth/app-not-authorized': 'App not authorized for Firebase Authentication.',
    'auth/api-key-not-valid': 'Invalid Firebase API key.',
  };

  return errorMessages[code] || error.message || 'An error occurred. Please try again.';
};

// ──────────────────────────────────────────────────────────────────────────────
// Exports
// ──────────────────────────────────────────────────────────────────────────────

export { auth };
export default app;
