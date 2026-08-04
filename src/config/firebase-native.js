/**
 * Firebase Phone Authentication — PulseMate Connect
 * 
 * Using React Native Firebase (Native Modules)
 * =======================================================================
 * ✅ Native Android/iOS implementation
 * ✅ No reCAPTCHA required (Play Integrity/SafetyNet)
 * ✅ SMS Auto-retrieval on Android
 * ✅ Better performance (native code)
 * ✅ Smaller bundle size
 * 
 * IMPLEMENTATION: React Native Firebase (@react-native-firebase/auth)
 * Migration Date: August 4, 2026
 * Previous: Firebase JS SDK (web-based)
 * Current: React Native Firebase (native)
 */

import auth from '@react-native-firebase/auth';
import { Platform } from 'react-native';
import api from '../api/axios';

/**
 * Initialize Firebase Auth
 * Note: React Native Firebase auto-initializes from google-services.json
 */
export const initializeFirebaseAuth = async () => {
  const timestamp = Date.now();
  
  try {
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════
║ 🔥 FIREBASE PHONE AUTH INITIALIZATION (Native)
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${new Date(timestamp).toISOString()}
║ 📱 Platform: ${Platform.OS} ${Platform.Version}
║ 🔧 Development Mode: ${__DEV__ ? 'YES' : 'NO'}
║ 🔥 SDK: React Native Firebase (Native)
║ 🔐 Verification: Play Integrity (No reCAPTCHA)
║ 📦 Package: in.pulsemateconnect.patient
╚═══════════════════════════════════════════════════════════════════════════════
`);
    
    // Check if Firebase is initialized
    const currentUser = auth().currentUser;
    console.log('[Firebase Native] Current user:', currentUser?.uid || 'None');
    console.log('[Firebase Native] ✅ Firebase Auth ready');
    
    return true;
  } catch (error) {
    console.error('[Firebase Native] ❌ Initialization failed:', error);
    throw error;
  }
};

/**
 * Send OTP via Firebase Phone Authentication (Native)
 * 
 * @param {string} phoneNumber - Phone in E.164 format (+91XXXXXXXXXX)
 * @returns {Promise<{confirmation}>}
 */
export const sendOtpToPhone = async (phoneNumber) => {
  const timestamp = Date.now();
  
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════════
║ 📱 SEND OTP - REACT NATIVE FIREBASE
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${new Date(timestamp).toISOString()}
║ 📞 Phone: ${phoneNumber}
║ 🔥 Method: auth().signInWithPhoneNumber()
║ 🔐 Security: Play Integrity (Android) / APNs (iOS)
║ 📦 Platform: ${Platform.OS} ${Platform.Version}
╚═══════════════════════════════════════════════════════════════════════════════
`);

  // Validate phone number
  if (!phoneNumber || !/^\+[1-9]\d{9,14}$/.test(phoneNumber)) {
    throw new Error('Invalid phone number. Use E.164 format: +91XXXXXXXXXX');
  }

  try {
    console.log('[Firebase Native] Sending OTP via React Native Firebase...');
    
    // Send OTP - Firebase handles SMS delivery natively
    const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
    
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════
║ ✅ FIREBASE OTP SENT SUCCESSFULLY (Native)
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${new Date().toISOString()}
║ ⏱️  Time Taken: ${Date.now() - timestamp}ms
║ 📱 Phone: ${phoneNumber}
║ 🔑 Verification ID: ${confirmation.verificationId || 'N/A'}
║ 🔥 SMS sent via Firebase (native)
║ ✨ Auto-retrieval: ${Platform.OS === 'android' ? 'YES (SMS Retriever API)' : 'NO (iOS)'}
╚═══════════════════════════════════════════════════════════════════════════════
`);
    
    return {
      confirmation,
      confirmationResult: confirmation, // For compatibility
      phoneNumber,
      verificationId: confirmation.verificationId,
      timestamp,
    };
  } catch (error) {
    console.error(`
╔═══════════════════════════════════════════════════════════════════════════════
║ 🔴 FIREBASE OTP SEND FAILED (Native)
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
 * Verify OTP code via Firebase (Native)
 * 
 * @param {object} confirmation - Confirmation from sendOtpToPhone
 * @param {string} code - 6-digit OTP code
 * @param {number} sentTimestamp - Timestamp when OTP was sent (optional)
 * @returns {Promise<{user, idToken, accessToken, refreshToken, phoneNumber}>}
 */
export const verifyPhoneOtp = async (confirmation, code, sentTimestamp = null) => {
  const timestamp = Date.now();
  const timeSinceSent = sentTimestamp ? (timestamp - sentTimestamp) / 1000 : 'unknown';
  
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════════
║ 🔐 VERIFY OTP - REACT NATIVE FIREBASE
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${new Date(timestamp).toISOString()}
║ 📱 Platform: ${Platform.OS} ${Platform.Version}
║ 🔑 Code Length: ${code?.length}
║ 🔑 Code Format: ${/^\d{6}$/.test(code) ? 'VALID' : 'INVALID'}
║ ⏱️  Time Since OTP Sent: ${timeSinceSent} seconds
║ 🔥 Method: confirmation.confirm()
╚═══════════════════════════════════════════════════════════════════════════════
`);

  // Validate OTP code
  if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
    const error = new Error('Please enter a valid 6-digit OTP code.');
    console.error('[Firebase Native] ❌ Invalid OTP format');
    throw error;
  }

  if (!confirmation || !confirmation.confirm) {
    const error = new Error('Invalid confirmation result. Please request a new OTP.');
    console.error('[Firebase Native] ❌ No confirmation result');
    throw error;
  }

  try {
    console.log('[Firebase Native] Verifying OTP with Firebase...');
    
    // Verify OTP with Firebase (Native)
    const credential = await confirmation.confirm(code);
    const user = credential.user;
    
    console.log('[Firebase Native] ✅ Firebase OTP verified');
    console.log('[Firebase Native] User UID:', user.uid);
    console.log('[Firebase Native] Phone:', user.phoneNumber);
    
    // Get Firebase ID token
    console.log('[Firebase Native] Getting ID token...');
    const idToken = await user.getIdToken();
    
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════
║ ✅ FIREBASE OTP VERIFIED (Native)
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
    console.log('[Firebase Native] Exchanging token with backend...');
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
║ 🔴 FIREBASE OTP VERIFICATION FAILED (Native)
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
  console.log('[Firebase Native] Calling backend for token exchange...');
  
  try {
    const response = await api.post('/auth/patient/firebase-phone-login', {
      firebaseIdToken: idToken
    });
    
    const data = response.data?.data ?? response.data;
    
    console.log('[Firebase Native] ✅ Backend authentication successful');
    console.log('[Firebase Native] User ID:', data.user?.id);
    console.log('[Firebase Native] Has access token:', !!data.accessToken);
    console.log('[Firebase Native] Has refresh token:', !!data.refreshToken);
    
    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user
    };
  } catch (error) {
    console.error('[Firebase Native] ❌ Backend auth failed:', error.message);
    throw new Error('Failed to authenticate with backend. Please try again.');
  }
};

/**
 * Resend OTP
 */
export const resendOtp = async (phoneNumber) => {
  console.log('[Firebase Native] Resending OTP...');
  return sendOtpToPhone(phoneNumber);
};

/**
 * Sign out
 */
export const signOutUser = async () => {
  try {
    await auth().signOut();
    console.log('[Firebase Native] ✅ User signed out');
  } catch (error) {
    console.error('[Firebase Native] ❌ Sign out error:', error);
    throw error;
  }
};

/**
 * Get Firebase auth instance
 */
export const getFirebaseAuth = () => auth();

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
    'auth/captcha-check-failed': 'Verification failed. Please try again.',
  };
  
  const friendlyMessage = errorMessages[code] || message;
  const err = new Error(friendlyMessage);
  err.code = code;
  
  return err;
};

export default auth;
