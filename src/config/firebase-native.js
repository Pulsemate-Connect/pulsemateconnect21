/**
 * Firebase Phone Authentication — PulseMate Connect
 * 
 * Using Firebase JS SDK (Web-based, Expo-compatible)
 * =======================================================================
 * ✅ Works with Expo managed workflow
 * ✅ Works in development and production builds
 * ✅ reCAPTCHA required for web-based verification
 * ✅ Simpler setup, no native module linking
 * 
 * IMPLEMENTATION: Firebase JS SDK v9+ (firebase/auth)
 * Migration Date: August 4, 2026
 * Previous: React Native Firebase (incompatible with Expo)
 * Current: Firebase JS SDK (Expo-compatible)
 */

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPhoneNumber,
  RecaptchaVerifier
} from 'firebase/auth';
import { Platform } from 'react-native';
import api from '../api/axios';

// Firebase config from google-services.json
export const firebaseConfig = {
  apiKey: "AIzaSyA2PXJxyIZpYOG2tXHDRu95gaaJogKEDBc",
  authDomain: "pulsemateconnect.firebaseapp.com",
  projectId: "pulsemateconnect",
  storageBucket: "pulsemateconnect.firebasestorage.app",
  messagingSenderId: "157620382332",
  appId: "1:157620382332:android:063dba90b53a1c81e6b7f9"
};

// Lazy initialization - only init when needed
let app;
let auth;
let initializationAttempted = false;
let initializationError = null;

/**
 * Internal function to initialize Firebase (called lazily)
 */
const ensureFirebaseInitialized = () => {
  // Return immediately if already initialized
  if (auth) {
    return auth;
  }
  
  // Don't retry if previous attempt failed
  if (initializationError) {
    throw initializationError;
  }
  
  // Mark that we're attempting initialization
  if (initializationAttempted) {
    throw new Error('Firebase initialization already attempted but auth is undefined');
  }
  
  initializationAttempted = true;
  
  try {
    console.log('[Firebase JS SDK] Starting lazy initialization...');
    console.log('[Firebase JS SDK] Firebase config:', JSON.stringify(firebaseConfig, null, 2));
    
    app = initializeApp(firebaseConfig);
    console.log('[Firebase JS SDK] App initialized:', typeof app);
    console.log('[Firebase JS SDK] App name:', app?.name);
    
    auth = getAuth(app);
    console.log('[Firebase JS SDK] getAuth called');
    console.log('[Firebase JS SDK] Auth type:', typeof auth);
    console.log('[Firebase JS SDK] Auth value:', auth);
    console.log('[Firebase JS SDK] Auth is null:', auth === null);
    console.log('[Firebase JS SDK] Auth is undefined:', auth === undefined);
    console.log('[Firebase JS SDK] Auth is object:', auth !== null && typeof auth === 'object');
    
    // Verify auth object is valid
    if (!auth || typeof auth !== 'object') {
      const error = new Error(`Firebase Auth initialization failed. getAuth() returned: ${typeof auth}. This usually means:\n1. Firebase package is not installed correctly\n2. There's a version mismatch\n3. The auth module failed to load in React Native`);
      initializationError = error;
      throw error;
    }
    
    console.log('[Firebase JS SDK] ✅ Initialized successfully');
    return auth;
  } catch (error) {
    console.error('[Firebase JS SDK] ❌ Initialization error:', error);
    console.error('[Firebase JS SDK] Error stack:', error.stack);
    initializationError = error;
    throw error;
  }
};

/**
 * Initialize Firebase Auth (JS SDK)
 * Note: Firebase JS SDK is already initialized above
 */
export const initializeFirebaseAuth = async () => {
  const timestamp = Date.now();
  
  try {
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════
║ 🔥 FIREBASE PHONE AUTH INITIALIZATION (JS SDK)
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${new Date(timestamp).toISOString()}
║ 📱 Platform: ${Platform.OS} ${Platform.Version}
║ 🔧 Development Mode: ${__DEV__ ? 'YES' : 'NO'}
║ 🔥 SDK: Firebase JS SDK v9+ (Expo-compatible)
║ 🔐 Verification: reCAPTCHA (Web-based)
║ 📦 Package: in.pulsemateconnect.patient
╚═══════════════════════════════════════════════════════════════════════════════
`);
    
    // Lazily initialize Firebase
    const authInstance = ensureFirebaseInitialized();
    
    console.log('[Firebase JS SDK] Checking auth object...');
    console.log('[Firebase JS SDK] auth:', authInstance);
    console.log('[Firebase JS SDK] auth type:', typeof authInstance);
    console.log('[Firebase JS SDK] auth === null:', authInstance === null);
    console.log('[Firebase JS SDK] auth === undefined:', authInstance === undefined);
    
    if (typeof authInstance !== 'object' || !authInstance) {
      const errorMsg = `Firebase Auth has wrong type. Expected object, got ${typeof authInstance}`;
      console.error('[Firebase JS SDK] ❌', errorMsg);
      throw new Error(errorMsg);
    }
    
    console.log('[Firebase JS SDK] auth is object:', authInstance !== null && typeof authInstance === 'object');
    console.log('[Firebase JS SDK] Current user:', authInstance.currentUser?.uid || 'None');
    console.log('[Firebase JS SDK] ✅ Firebase Auth ready');
    
    return authInstance;
  } catch (error) {
    console.error('[Firebase JS SDK] ❌ Initialization failed:', error);
    console.error('[Firebase JS SDK] Error name:', error.name);
    console.error('[Firebase JS SDK] Error message:', error.message);
    console.error('[Firebase JS SDK] Error stack:', error.stack);
    console.error('[Firebase JS SDK] Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
    // Create detailed error message
    const detailedError = new Error(
      `Firebase initialization failed:\n` +
      `- Platform: ${Platform.OS}\n` +
      `- Error: ${error.message}\n` +
      `- Auth object: ${auth}\n` +
      `- Auth type: ${typeof auth}\n` +
      `\nPossible causes:\n` +
      `1. Firebase package (v10.14.1) may not be compatible with React Native 0.81.5\n` +
      `2. getAuth() is returning undefined - this is a known issue\n` +
      `3. You should use Backend SMS authentication instead (src/config/firebase.js)\n` +
      `\nStack: ${error.stack}`
    );
    throw detailedError;
  }
};

/**
 * Send OTP via Firebase Phone Authentication (JS SDK)
 * 
 * @param {string} phoneNumber - Phone in E.164 format (+91XXXXXXXXXX)
 * @param {object} recaptchaVerifier - RecaptchaVerifier instance from screen
 * @returns {Promise<{confirmationResult}>}
 */
export const sendOtpToPhone = async (phoneNumber, recaptchaVerifier) => {
  const timestamp = Date.now();
  
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════════
║ 📱 SEND OTP - FIREBASE JS SDK
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${new Date(timestamp).toISOString()}
║ 📞 Phone: ${phoneNumber}
║ 🔥 Method: signInWithPhoneNumber (JS SDK)
║ 🔐 Security: reCAPTCHA Verifier
║ 📦 Platform: ${Platform.OS} ${Platform.Version}
╚═══════════════════════════════════════════════════════════════════════════════
`);

  // Validate phone number
  if (!phoneNumber || !/^\+[1-9]\d{9,14}$/.test(phoneNumber)) {
    throw new Error('Invalid phone number. Use E.164 format: +91XXXXXXXXXX');
  }

  // Validate reCAPTCHA verifier
  if (!recaptchaVerifier) {
    throw new Error('reCAPTCHA verifier is required for Firebase JS SDK');
  }

  try {
    // Ensure Firebase is initialized
    const authInstance = ensureFirebaseInitialized();
    
    console.log('[Firebase JS SDK] Sending OTP via Firebase...');
    console.log('[Firebase JS SDK] Phone:', phoneNumber);
    console.log('[Firebase JS SDK] Has reCAPTCHA:', !!recaptchaVerifier);
    console.log('[Firebase JS SDK] Auth instance:', typeof authInstance);
    
    // Send OTP using Firebase JS SDK
    const confirmationResult = await signInWithPhoneNumber(authInstance, phoneNumber, recaptchaVerifier);
    
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════
║ ✅ FIREBASE OTP SENT SUCCESSFULLY (JS SDK)
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${new Date().toISOString()}
║ ⏱️  Time Taken: ${Date.now() - timestamp}ms
║ 📱 Phone: ${phoneNumber}
║ 🔑 Verification ID: ${confirmationResult.verificationId || 'N/A'}
║ 🔥 SMS sent via Firebase (JS SDK)
║ 🔐 reCAPTCHA verified
╚═══════════════════════════════════════════════════════════════════════════════
`);
    
    return {
      confirmation: confirmationResult,
      confirmationResult: confirmationResult,
      phoneNumber,
      verificationId: confirmationResult.verificationId,
      timestamp,
    };
  } catch (error) {
    console.error(`
╔═══════════════════════════════════════════════════════════════════════════════
║ 🔴 FIREBASE OTP SEND FAILED (JS SDK)
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${new Date().toISOString()}
║ 📱 Phone: ${phoneNumber}
║ ❌ Error: ${error.message}
║ 🔍 Code: ${error.code}
╚═══════════════════════════════════════════════════════════════════════════════
`);
    
    throw formatFirebaseError(error);
  }
};

/**
 * Verify OTP code via Firebase (JS SDK)
 * 
 * @param {object} confirmationResult - ConfirmationResult from sendOtpToPhone
 * @param {string} code - 6-digit OTP code
 * @param {number} sentTimestamp - Timestamp when OTP was sent (optional)
 * @returns {Promise<{user, idToken, accessToken, refreshToken, phoneNumber}>}
 */
export const verifyPhoneOtp = async (confirmationResult, code, sentTimestamp = null) => {
  const timestamp = Date.now();
  const timeSinceSent = sentTimestamp ? (timestamp - sentTimestamp) / 1000 : 'unknown';
  
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════════
║ 🔐 VERIFY OTP - FIREBASE JS SDK
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${new Date(timestamp).toISOString()}
║ 📱 Platform: ${Platform.OS} ${Platform.Version}
║ 🔑 Code Length: ${code?.length}
║ 🔑 Code Format: ${/^\d{6}$/.test(code) ? 'VALID' : 'INVALID'}
║ ⏱️  Time Since OTP Sent: ${timeSinceSent} seconds
║ 🔥 Method: confirmationResult.confirm()
╚═══════════════════════════════════════════════════════════════════════════════
`);

  // Validate OTP code
  if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
    const error = new Error('Please enter a valid 6-digit OTP code.');
    console.error('[Firebase JS SDK] ❌ Invalid OTP format');
    throw error;
  }

  if (!confirmationResult || !confirmationResult.confirm) {
    const error = new Error('Invalid confirmation result. Please request a new OTP.');
    console.error('[Firebase JS SDK] ❌ No confirmation result');
    throw error;
  }

  try {
    console.log('[Firebase JS SDK] Verifying OTP with Firebase...');
    
    // Verify OTP with Firebase (JS SDK)
    const credential = await confirmationResult.confirm(code);
    const user = credential.user;
    
    console.log('[Firebase JS SDK] ✅ Firebase OTP verified');
    console.log('[Firebase JS SDK] User UID:', user.uid);
    console.log('[Firebase JS SDK] Phone:', user.phoneNumber);
    
    // Get Firebase ID token
    console.log('[Firebase JS SDK] Getting ID token...');
    const idToken = await user.getIdToken();
    
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════
║ ✅ FIREBASE OTP VERIFIED (JS SDK)
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${new Date().toISOString()}
║ ⏱️  Verification Time: ${Date.now() - timestamp}ms
║ ⏱️  Total Time: ${timeSinceSent} seconds since OTP sent
║ 👤 User UID: ${user.uid}
║ 📱 Phone: ${user.phoneNumber}
║ 🎫 ID Token: ${idToken.substring(0, 20)}...
║ 📦 Platform: ${Platform.OS}
╚═══════════════════════════════════════════════════════════════════════════════
`);
    
    // Exchange Firebase token for backend JWT
    console.log('[Firebase JS SDK] Exchanging token with backend...');
    const backendAuth = await loginWithFirebaseToken(idToken);
    
    return {
      user: backendAuth.user,
      idToken,
      accessToken: backendAuth.accessToken,
      refreshToken: backendAuth.refreshToken,
      phoneNumber: user.phoneNumber
    };
  } catch (error) {
    console.error(`
╔═══════════════════════════════════════════════════════════════════════════════
║ 🔴 FIREBASE OTP VERIFICATION FAILED (JS SDK)
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${new Date().toISOString()}
║ ⏱️  Time Taken: ${Date.now() - timestamp}ms
║ ⏱️  Time Since Sent: ${timeSinceSent} seconds
║ ❌ Error: ${error.message}
║ 🔍 Code: ${error.code}
╚═══════════════════════════════════════════════════════════════════════════════
`);
    
    throw formatFirebaseError(error);
  }
};

/**
 * Login with Firebase ID token
 * Exchange Firebase token for backend JWT tokens
 */
export const loginWithFirebaseToken = async (idToken) => {
  console.log('[Firebase JS SDK] Calling backend for token exchange...');
  
  try {
    const response = await api.post('/auth/patient/firebase-phone-login', {
      firebaseIdToken: idToken
    });
    
    const data = response.data?.data ?? response.data;
    
    console.log('[Firebase JS SDK] ✅ Backend authentication successful');
    console.log('[Firebase JS SDK] User ID:', data.user?.id);
    console.log('[Firebase JS SDK] Has access token:', !!data.accessToken);
    console.log('[Firebase JS SDK] Has refresh token:', !!data.refreshToken);
    
    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user
    };
  } catch (error) {
    console.error('[Firebase JS SDK] ❌ Backend auth failed:', error.message);
    throw new Error('Failed to authenticate with backend. Please try again.');
  }
};

/**
 * Resend OTP
 */
export const resendOtp = async (phoneNumber, recaptchaVerifier) => {
  console.log('[Firebase JS SDK] Resending OTP...');
  return sendOtpToPhone(phoneNumber, recaptchaVerifier);
};

/**
 * Sign out
 */
export const signOutUser = async () => {
  try {
    const authInstance = ensureFirebaseInitialized();
    await authInstance.signOut();
    console.log('[Firebase JS SDK] ✅ User signed out');
  } catch (error) {
    console.error('[Firebase JS SDK] ❌ Sign out error:', error);
    throw error;
  }
};

/**
 * Get Firebase auth instance
 */
export const getFirebaseAuth = () => {
  try {
    return ensureFirebaseInitialized();
  } catch (error) {
    console.error('[Firebase JS SDK] getFirebaseAuth failed:', error.message);
    return null;
  }
};

/**
 * Create reCAPTCHA verifier (must be called from screen component)
 * This is exported for screens to use when setting up reCAPTCHA
 */
export { RecaptchaVerifier };

/**
 * Format Firebase errors to user-friendly messages
 */
const formatFirebaseError = (error) => {
  const code = error.code || '';
  const message = error.message || 'An error occurred';
  
  // Map Firebase error codes to user-friendly messages
  const errorMessages = {
    'auth/invalid-phone-number': 'Invalid phone number format.',
    'auth/missing-phone-number': 'Phone number is required.',
    'auth/quota-exceeded': 'SMS quota exceeded. Please try again later.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/operation-not-allowed': 'Phone authentication is not enabled.',
    'auth/invalid-verification-code': 'Invalid OTP code. Please check and try again.',
    'auth/invalid-verification-id': 'Verification session expired. Please request a new OTP.',
    'auth/code-expired': 'OTP has expired. Please request a new one.',
    'auth/session-expired': 'Session expired. Please start over.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/missing-app-credential': 'App verification failed. Please update the app.',
    'auth/network-request-failed': 'Network error. Please check your internet connection.',
    'auth/app-not-authorized': 'App not authorized. Check Firebase Console configuration.',
    'auth/captcha-check-failed': 'reCAPTCHA verification failed. Please try again.',
  };
  
  const friendlyMessage = errorMessages[code] || message;
  const err = new Error(friendlyMessage);
  err.code = code;
  
  return err;
};

// Export auth for compatibility (lazy getter)
export default {
  get auth() {
    try {
      return ensureFirebaseInitialized();
    } catch (error) {
      console.error('[Firebase JS SDK] Cannot access auth:', error.message);
      return null;
    }
  }
};
