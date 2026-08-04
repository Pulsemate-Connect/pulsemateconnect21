/**
 * Firebase Phone Authentication — PulseMate Connect
 * 
 * Using Firebase JS SDK v10 (Expo Compatible)
 * =======================================================================
 * ✅ Works with Expo managed workflow
 * ✅ Free SMS delivery via Firebase
 * ✅ Built-in Play Integrity security
 * ⚠️  Requires reCAPTCHA verification
 * ⚠️  No auto-SMS retrieval (JS SDK limitation)
 * 
 * IMPLEMENTATION: Firebase Phone Authentication
 * Migration Date: August 4, 2026
 * Previous: Backend SMS (2Factor.in)
 * Current: Firebase JS SDK Phone Auth
 */

import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential,
  RecaptchaVerifier
} from 'firebase/auth';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import api from '../api/axios';

// Firebase configuration from google-services.json
const firebaseConfig = {
  apiKey: "AIzaSyA2PXJxyIZpYOG2tXHDRu95gaaJogKEDBc",
  authDomain: "pulsemateconnect.firebaseapp.com",
  projectId: "pulsemateconnect",
  storageBucket: "pulsemateconnect.firebasestorage.app",
  messagingSenderId: "157620382332",
  appId: "1:157620382332:android:063dba90b53a1c81e6b7f9"
};

// Initialize Firebase (only once)
let app;
let auth;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  console.log('[Firebase] Initialized successfully');
} else {
  app = getApps()[0];
  auth = getAuth(app);
  console.log('[Firebase] Using existing instance');
}

// Global reCAPTCHA verifier instance
let recaptchaVerifier = null;

/**
 * Get environment info for logging
 */
const getEnvironmentInfo = () => {
  const buildType = Constants.appOwnership || 'unknown';
  const isExpoGo = buildType === 'expo';
  const isStandalone = buildType === 'standalone';
  const isDev = __DEV__;
  
  let environment = 'UNKNOWN';
  if (isExpoGo) environment = 'EXPO_GO';
  else if (isStandalone && !isDev) environment = 'PLAY_STORE_PRODUCTION';
  else if (isStandalone && isDev) environment = 'DEVELOPMENT_BUILD';
  else if (isDev) environment = 'DEVELOPMENT';
  else environment = 'PRODUCTION_BUILD';
  
  return {
    environment,
    buildType,
    platform: Platform.OS,
    platformVersion: Platform.Version,
    packageName: Platform.select({
      android: Constants.manifest?.android?.package ||
               Constants.expoConfig?.android?.package ||
               'in.pulsemateconnect.patient',
      ios: Constants.manifest?.ios?.bundleIdentifier ||
           Constants.expoConfig?.ios?.bundleIdentifier ||
           'N/A',
      default: 'N/A'
    })
  };
};

/**
 * Initialize Firebase Auth
 */
export const initializeFirebaseAuth = async () => {
  const env = getEnvironmentInfo();
  
  try {
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════
║ 🔥 FIREBASE PHONE AUTH INITIALIZATION
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${new Date().toISOString()}
║ 🌍 Environment: ${env.environment}
║ 📦 Package: ${env.packageName}
║ 📱 Platform: ${env.platform} ${env.platformVersion}
║ 🔥 Firebase Project: pulsemateconnect
║ 🔐 Auth Domain: pulsemateconnect.firebaseapp.com
║ 🔑 API Key: ${firebaseConfig.apiKey.substring(0, 20)}...
╚═══════════════════════════════════════════════════════════════════════════════
`);
    
    // Test Firebase connection
    const currentUser = auth.currentUser;
    console.log('[Firebase] Current user:', currentUser?.uid || 'None');
    console.log('[Firebase] ✅ Firebase Phone Auth ready');
    
    return true;
  } catch (error) {
    console.error('[Firebase] ❌ Initialization failed:', error);
    throw error;
  }
};

/**
 * Create reCAPTCHA verifier
 * Required for Firebase Phone Auth with JS SDK
 * 
 * Note: In Expo, this uses an invisible reCAPTCHA
 */
const createRecaptchaVerifier = () => {
  if (recaptchaVerifier) {
    console.log('[Firebase] Using existing reCAPTCHA verifier');
    return recaptchaVerifier;
  }

  console.log('[Firebase] Creating new reCAPTCHA verifier');
  
  try {
    recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: (response) => {
        console.log('[Firebase] ✅ reCAPTCHA verified');
      },
      'expired-callback': () => {
        console.warn('[Firebase] ⚠️  reCAPTCHA expired');
        recaptchaVerifier = null;
      },
      'error-callback': (error) => {
        console.error('[Firebase] ❌ reCAPTCHA error:', error);
        recaptchaVerifier = null;
      }
    });
    
    return recaptchaVerifier;
  } catch (error) {
    console.error('[Firebase] Failed to create reCAPTCHA:', error);
    throw new Error('reCAPTCHA initialization failed. Please refresh and try again.');
  }
};

/**
 * Send OTP via Firebase Phone Authentication
 * 
 * @param {string} phoneNumber - Phone in E.164 format (+91XXXXXXXXXX)
 * @returns {Promise<{confirmationResult, phoneNumber, timestamp}>}
 */
export const sendOtpToPhone = async (phoneNumber) => {
  const env = getEnvironmentInfo();
  const timestamp = Date.now();
  
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════════
║ 📱 SEND OTP - FIREBASE PHONE AUTH
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${new Date(timestamp).toISOString()}
║ 🌍 Environment: ${env.environment}
║ 📦 Package: ${env.packageName}
║ 📞 Phone: ${phoneNumber}
║ 🔥 Method: Firebase signInWithPhoneNumber
║ 🔐 Security: reCAPTCHA + Play Integrity
╚═══════════════════════════════════════════════════════════════════════════════
`);

  // Validate phone number
  if (!phoneNumber || !/^\+[1-9]\d{9,14}$/.test(phoneNumber)) {
    const error = new Error('Invalid phone number. Use E.164 format: +91XXXXXXXXXX');
    console.error('[Firebase] ❌ Validation failed:', phoneNumber);
    throw error;
  }

  try {
    // Create reCAPTCHA verifier (invisible)
    console.log('[Firebase] Creating reCAPTCHA verifier...');
    const appVerifier = createRecaptchaVerifier();
    
    console.log('[Firebase] Sending OTP via Firebase Phone Auth...');
    console.log('[Firebase] Phone:', phoneNumber);
    
    // Send OTP - Firebase handles SMS delivery
    const confirmationResult = await signInWithPhoneNumber(
      auth,
      phoneNumber,
      appVerifier
    );
    
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════
║ ✅ FIREBASE OTP SENT SUCCESSFULLY
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${new Date().toISOString()}
║ ⏱️  Time Taken: ${Date.now() - timestamp}ms
║ 📱 Phone: ${phoneNumber}
║ 🔑 Verification ID: ${confirmationResult.verificationId}
║ 🔥 SMS sent via Firebase (FREE)
║ 📦 Environment: ${env.environment}
╚═══════════════════════════════════════════════════════════════════════════════
`);
    
    return {
      confirmationResult,
      phoneNumber,
      verificationId: confirmationResult.verificationId,
      requestId: confirmationResult.verificationId, // For compatibility
      timestamp,
    };
  } catch (error) {
    console.error(`
╔═══════════════════════════════════════════════════════════════════════════════
║ 🔴 FIREBASE OTP SEND FAILED
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${new Date().toISOString()}
║ ⏱️  Time Taken: ${Date.now() - timestamp}ms
║ 📱 Phone: ${phoneNumber}
║ 📦 Environment: ${env.environment}
║ 
║ ❌ ERROR DETAILS:
║ ├─ Code: ${error.code || 'N/A'}
║ ├─ Message: ${error.message || 'Unknown error'}
║ 
║ 📚 Stack: ${error.stack ? error.stack.substring(0, 200) + '...' : 'N/A'}
╚═══════════════════════════════════════════════════════════════════════════════
`);
    
    throw formatFirebaseError(error);
  }
};

/**
 * Verify OTP code via Firebase
 * 
 * @param {object} confirmationResult - Result from sendOtpToPhone
 * @param {string} code - 6-digit OTP code
 * @param {number} sentTimestamp - Timestamp when OTP was sent (optional)
 * @returns {Promise<{user, idToken, accessToken, refreshToken, phoneNumber}>}
 */
export const verifyPhoneOtp = async (confirmationResult, code, sentTimestamp = null) => {
  const env = getEnvironmentInfo();
  const timestamp = Date.now();
  const timeSinceSent = sentTimestamp ? (timestamp - sentTimestamp) / 1000 : 'unknown';
  
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════════
║ 🔐 VERIFY OTP - FIREBASE
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${new Date(timestamp).toISOString()}
║ 🌍 Environment: ${env.environment}
║ 📦 Package: ${env.packageName}
║ 🔑 Code Length: ${code?.length}
║ 🔑 Code Format: ${/^\d{6}$/.test(code) ? 'VALID' : 'INVALID'}
║ ⏱️  Time Since OTP Sent: ${timeSinceSent} seconds
║ 🔥 Method: Firebase confirmationResult.confirm
╚═══════════════════════════════════════════════════════════════════════════════
`);

  // Validate OTP code
  if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
    const error = new Error('Please enter a valid 6-digit OTP code.');
    console.error('[Firebase] ❌ Invalid OTP format');
    throw error;
  }

  if (!confirmationResult || !confirmationResult.confirm) {
    const error = new Error('Invalid confirmation result. Please request a new OTP.');
    console.error('[Firebase] ❌ No confirmation result');
    throw error;
  }

  try {
    console.log('[Firebase] Verifying OTP with Firebase...');
    
    // Verify OTP with Firebase
    const userCredential = await confirmationResult.confirm(code);
    const user = userCredential.user;
    
    console.log('[Firebase] ✅ Firebase OTP verified');
    console.log('[Firebase] User ID:', user.uid);
    console.log('[Firebase] Phone:', user.phoneNumber);
    
    // Get Firebase ID token
    console.log('[Firebase] Getting ID token...');
    const idToken = await user.getIdToken();
    
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════
║ ✅ FIREBASE OTP VERIFIED
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${new Date().toISOString()}
║ ⏱️  Verification Time: ${Date.now() - timestamp}ms
║ ⏱️  Total Time: ${timeSinceSent} seconds since OTP sent
║ 👤 User ID: ${user.uid}
║ 📱 Phone: ${user.phoneNumber}
║ 🎫 ID Token: ${idToken.substring(0, 20)}...
║ 📦 Environment: ${env.environment}
╚═══════════════════════════════════════════════════════════════════════════════
`);
    
    // Exchange Firebase token for backend JWT
    console.log('[Firebase] Exchanging token with backend...');
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
║ 🔴 FIREBASE OTP VERIFICATION FAILED
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${new Date().toISOString()}
║ ⏱️  Time Taken: ${Date.now() - timestamp}ms
║ ⏱️  Time Since Sent: ${timeSinceSent} seconds
║ 📦 Environment: ${env.environment}
║ 
║ ❌ ERROR DETAILS:
║ ├─ Code: ${error.code || 'N/A'}
║ ├─ Message: ${error.message || 'Unknown error'}
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
  console.log('[Firebase] Calling backend for token exchange...');
  
  try {
    const response = await api.post('/auth/firebase-login', {
      firebaseToken: idToken
    });
    
    const data = response.data?.data ?? response.data;
    
    console.log('[Firebase] ✅ Backend authentication successful');
    console.log('[Firebase] User ID:', data.user?.id);
    console.log('[Firebase] Has access token:', !!data.accessToken);
    console.log('[Firebase] Has refresh token:', !!data.refreshToken);
    
    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user
    };
  } catch (error) {
    console.error('[Firebase] ❌ Backend auth failed:', error.message);
    throw new Error('Failed to authenticate with backend. Please try again.');
  }
};

/**
 * Resend OTP
 */
export const resendOtp = async (phoneNumber) => {
  console.log('[Firebase] Resending OTP...');
  return sendOtpToPhone(phoneNumber);
};

/**
 * Sign out
 */
export const signOutUser = async () => {
  try {
    await auth.signOut();
    console.log('[Firebase] ✅ User signed out');
  } catch (error) {
    console.error('[Firebase] ❌ Sign out error:', error);
    throw error;
  }
};

/**
 * Get Firebase auth instance
 */
export const getFirebaseAuth = () => auth;

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
    'auth/captcha-check-failed': 'reCAPTCHA verification failed. Please try again.',
    'auth/missing-app-credential': 'App verification failed. Please update the app.',
    'auth/network-request-failed': 'Network error. Please check your internet connection.',
    'auth/web-storage-unsupported': 'Please enable cookies and try again.',
    'auth/popup-closed-by-user': 'Verification cancelled. Please try again.',
  };
  
  const friendlyMessage = errorMessages[code] || message;
  const err = new Error(friendlyMessage);
  err.code = code;
  
  return err;
};
