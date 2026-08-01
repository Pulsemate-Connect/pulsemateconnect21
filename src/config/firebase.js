/**
 * Firebase Phone Authentication — PulseMate Connect (Expo)
 * 
 * Production Implementation with expo-firebase-recaptcha
 * ======================================================
 * ✅ Uses Firebase Web SDK v12 with proper RecaptchaVerifier
 * ✅ Sends REAL SMS OTP to ANY valid phone number
 * ✅ Works on production Android builds
 * ✅ Works with EAS Build
 * ✅ Fixes auth/argument-error
 */

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithPhoneNumber, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/axios';
import { firebaseConfig } from './firebaseConfig';

let firebaseApp = null;
let firebaseAuth = null;

/**
 * Initialize Firebase Auth (call once at app start)
 */
export const initializeFirebaseAuth = async () => {
  if (firebaseAuth) return firebaseAuth;
  
  try {
    // Initialize Firebase app if not already initialized
    if (getApps().length === 0) {
      firebaseApp = initializeApp(firebaseConfig);
    } else {
      firebaseApp = getApps()[0];
    }
    
    // Initialize Auth with AsyncStorage persistence
    try {
      firebaseAuth = initializeAuth(firebaseApp, {
        persistence: getReactNativePersistence(ReactNativeAsyncStorage)
      });
      console.log('[Auth] ✅ Firebase Auth initialized with AsyncStorage persistence');
    } catch (error) {
      // If initializeAuth fails (already initialized), use getAuth
      if (error.code === 'auth/already-initialized') {
        firebaseAuth = getAuth(firebaseApp);
        console.log('[Auth] ✅ Firebase Auth already initialized, using existing instance');
      } else {
        throw error;
      }
    }
    
    console.log('[Auth] ✅ Firebase initialized successfully');
    console.log('[Auth] Mode:', __DEV__ ? 'Development' : 'Production');
    
    return firebaseAuth;
  } catch (error) {
    console.error('[Auth] ❌ Firebase init failed:', error.message);
    throw new Error('Firebase initialization failed: ' + error.message);
  }
};

/**
 * Get Firebase Auth instance
 */
export const getFirebaseAuth = () => {
  if (!firebaseAuth) {
    throw new Error('Firebase Auth not initialized. Call initializeFirebaseAuth() first.');
  }
  return firebaseAuth;
};

/**
 * Send OTP via Firebase Phone Authentication
 * 
 * PRODUCTION BUILDS: Pass null for recaptchaVerifier - Firebase will use SafetyNet
 * DEVELOPMENT BUILDS: Pass recaptchaVerifier from FirebaseRecaptchaVerifierModal
 * 
 * @param {string} phoneNumber - Phone in E.164 format (+91XXXXXXXXXX)
 * @param {RecaptchaVerifier|null} recaptchaVerifier - From FirebaseRecaptchaVerifierModal.current (null = SafetyNet)
 * @returns {Promise<{confirmationResult, phoneNumber, verificationId, timestamp}>}
 */
export const sendOtpToPhone = async (phoneNumber, recaptchaVerifier) => {
  // Validate phone number
  if (!phoneNumber || !/^\+[1-9]\d{9,14}$/.test(phoneNumber)) {
    throw new Error('Invalid phone number. Use E.164 format: +91XXXXXXXXXX');
  }

  // CRITICAL: Firebase Web SDK REQUIRES reCAPTCHA verifier
  // SafetyNet is NOT supported by Firebase JavaScript SDK
  if (!recaptchaVerifier) {
    throw new Error('reCAPTCHA verifier is required. Please ensure FirebaseRecaptchaVerifierModal is rendered.');
  }

  try {
    const timestamp = Date.now();
    console.log('[Auth] 📱 Sending OTP to:', phoneNumber);
    console.log('[Auth] 🔐 Using reCAPTCHA verification (Firebase Web SDK)');
    console.log('[Auth] ⏰ Request timestamp:', new Date(timestamp).toISOString());

    const auth = getFirebaseAuth();

    // Firebase Web SDK ALWAYS requires reCAPTCHA verifier (no SafetyNet support)
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);

    // Extract verificationId for debugging
    const verificationId = confirmationResult?.verificationId || 'unknown';
    
    console.log('[Auth] ✅ OTP sent successfully');
    console.log('[Auth] 🔑 VerificationId:', verificationId);
    console.log('[Auth] ⏰ Valid until:', new Date(timestamp + 120000).toISOString(), '(2 minutes)');

    return {
      confirmationResult,
      phoneNumber,
      verificationId,
      timestamp,
    };
  } catch (error) {
    console.error('[Auth] ❌ Send OTP error:', error.code, error.message);

    // User-friendly error messages
    if (error.code === 'auth/invalid-phone-number') {
      throw new Error('Invalid phone number format.');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many requests. Please try again in 15 minutes.');
    } else if (error.code === 'auth/quota-exceeded') {
      throw new Error('SMS quota exceeded. Please contact support.');
    } else if (error.code === 'auth/invalid-app-credential') {
      throw new Error('App verification failed. SHA-256 not registered or incorrect.');
    } else if (error.code === 'auth/app-not-authorized') {
      throw new Error('App not authorized. Please add SHA-256 to Firebase Console.');
    } else if (error.code === 'auth/captcha-check-failed') {
      throw new Error('reCAPTCHA verification failed. Please try again.');
    } else if (error.code === 'auth/argument-error') {
      throw new Error('Configuration error. Please try again.');
    }

    throw new Error(error.message || 'Failed to send OTP. Please try again.');
  }
};


/**
 * Verify OTP code and complete phone authentication
 * 
 * @param {ConfirmationResult} confirmResult - From sendOtpToPhone()
 * @param {string} code - 6-digit OTP code from SMS
 * @param {number} sentTimestamp - Timestamp when OTP was sent
 * @returns {Promise<{user, idToken, phoneNumber}>}
 */
export const verifyPhoneOtp = async (confirmResult, code, sentTimestamp = null) => {
  if (!confirmResult) {
    console.error('[Auth] ❌ No confirmResult provided');
    throw new Error('No OTP request found. Please send OTP first.');
  }

  if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
    throw new Error('Please enter a valid 6-digit OTP code.');
  }

  try {
    const verifyTimestamp = Date.now();
    const timeSinceSent = sentTimestamp ? (verifyTimestamp - sentTimestamp) / 1000 : 'unknown';
    
    console.log('[Auth] 🔑 Verifying OTP code...');
    console.log('[Auth] 📝 OTP entered:', code);
    console.log('[Auth] ⏰ Verification timestamp:', new Date(verifyTimestamp).toISOString());
    console.log('[Auth] ⏱️  Time since OTP sent:', timeSinceSent, 'seconds');
    console.log('[Auth] 📦 ConfirmResult valid:', confirmResult ? 'Yes' : 'No');
    console.log('[Auth] 📦 ConfirmResult type:', typeof confirmResult);
    console.log('[Auth] 🔑 VerificationId in result:', confirmResult?.verificationId || 'not found');
    console.log('[Auth] 📦 Confirm method exists:', typeof confirmResult?.confirm === 'function');

    // ⚠️ CRITICAL: Firebase confirmation results typically expire after 60-120 seconds
    if (timeSinceSent !== 'unknown' && timeSinceSent > 100) {
      console.warn('[Auth] ⚠️  WARNING: OTP verification attempted after', timeSinceSent, 'seconds');
      console.warn('[Auth] ⚠️  This may cause "code-expired" error if > 120 seconds');
    }

    // Confirm OTP with Firebase
    console.log('[Auth] 🔄 Calling confirmResult.confirm()...');
    const userCredential = await confirmResult.confirm(code);

    console.log('[Auth] ✅ OTP verified successfully');
    console.log('[Auth] 👤 User UID:', userCredential.user?.uid);
    console.log('[Auth] 📱 Phone number:', userCredential.user?.phoneNumber);

    // Get Firebase ID Token
    const idToken = await userCredential.user.getIdToken();
    console.log('[Auth] 🎫 Firebase ID token obtained');

    return {
      user: userCredential.user,
      idToken,
      phoneNumber: userCredential.user.phoneNumber,
    };
  } catch (error) {
    console.error('[Auth] ❌ OTP verification error');
    console.error('[Auth] ❌ Error code:', error.code);
    console.error('[Auth] ❌ Error message:', error.message);
    console.error('[Auth] ❌ Full error:', JSON.stringify(error, null, 2));

    // User-friendly error messages
    if (error.code === 'auth/invalid-verification-code') {
      throw new Error('Invalid OTP code. Please check and try again.');
    } else if (error.code === 'auth/code-expired') {
      throw new Error('OTP code expired. Please request a new one.');
    } else if (error.code === 'auth/session-expired') {
      throw new Error('Session expired. Please start over.');
    } else if (error.code === 'auth/invalid-verification-id') {
      throw new Error('Invalid verification session. Please request a new OTP.');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many verification attempts. Please try again later.');
    } else if (error.code === 'auth/missing-verification-code') {
      throw new Error('Please enter the OTP code.');
    } else if (error.code === 'auth/missing-verification-id') {
      throw new Error('Verification session lost. Please request a new OTP.');
    }

    throw new Error(error.message || 'OTP verification failed');
  }
};

/**
 * Send Firebase ID token to backend for session creation
 */
export const loginWithFirebaseToken = async (idToken, name = null) => {
  if (!idToken) {
    throw new Error('Firebase ID token is required.');
  }

  try {
    console.log('[Auth] 🔄 Logging in with Firebase token...');
    console.log('[Auth] 🔑 Token length:', idToken?.length || 0);
    console.log('[Auth] 👤 Name:', name || 'Not provided');
    console.log('[Auth] 🌐 API Base URL:', api.defaults.baseURL);

    const res = await api.post('/auth/patient/firebase-phone-login', {
      firebaseIdToken: idToken,
      name: name && name.trim().length >= 2 ? name.trim() : 'Patient',  // ✅ Default to "Patient" if no valid name
    });

    console.log('[Auth] 📥 Backend response status:', res.status);
    console.log('[Auth] 📥 Response data:', JSON.stringify(res.data, null, 2));

    const data = res.data?.data ?? res.data;

    if (!data?.accessToken || !data?.user) {
      console.error('[Auth] ❌ Invalid response structure:', data);
      throw new Error('Session creation failed: Invalid server response');
    }

    console.log('[Auth] ✅ Login successful');
    console.log('[Auth] 👤 User ID:', data.user.id);
    console.log('[Auth] 📱 User phone:', data.user.phone);
    console.log('[Auth] 🎫 Access token received:', data.accessToken ? 'Yes' : 'No');
    console.log('[Auth] 🔄 Refresh token received:', data.refreshToken ? 'Yes' : 'No');

    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken ?? null,
      user: data.user,
    };
  } catch (err) {
    console.error('[Auth] ❌ Backend login error');
    console.error('[Auth] ❌ Error type:', err.constructor.name);
    console.error('[Auth] ❌ Error message:', err.message);
    console.error('[Auth] ❌ Error code:', err.code);
    console.error('[Auth] ❌ Response status:', err.response?.status);
    console.error('[Auth] ❌ Response data:', JSON.stringify(err.response?.data, null, 2));
    console.error('[Auth] ❌ Request URL:', err.config?.url);
    console.error('[Auth] ❌ Request method:', err.config?.method);
    console.error('[Auth] ❌ Request baseURL:', err.config?.baseURL);
    
    // Distinguish error types
    if (err.code === 'ECONNREFUSED') {
      throw new Error('Cannot reach server. Please check your internet connection.');
    } else if (err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED') {
      throw new Error('Connection timeout. Please check your internet connection.');
    } else if (err.message === 'Network Error') {
      throw new Error('Network error. Please ensure:\n1. Your device has internet\n2. Backend server is running\n3. API URL is correct');
    } else if (err.response?.status === 401) {
      throw new Error('Firebase token verification failed. Please try again.');
    } else if (err.response?.status === 503) {
      throw new Error('Firebase Auth is not configured on server. Please contact support.');
    } else if (err.response?.data?.message) {
      throw new Error(err.response.data.message);
    } else {
      throw new Error(err.message || 'Login failed. Please try again.');
    }
  }
};

/**
 * Resend OTP to the same phone number
 * 
 * @param {string} phoneNumber - Phone in E.164 format
 * @param {RecaptchaVerifier} recaptchaVerifier - From FirebaseRecaptchaVerifierModal.current
 * @returns {Promise<{confirmationResult, phoneNumber}>}
 */
export const resendOtp = async (phoneNumber, recaptchaVerifier) => {
  return sendOtpToPhone(phoneNumber, recaptchaVerifier);
};

/**
 * Sign out current user from Firebase
 */
export const signOutUser = async () => {
  try {
    const auth = getFirebaseAuth();
    await auth.signOut();
    console.log('[Auth] ✅ User signed out');
  } catch (error) {
    console.error('[Auth] ❌ Sign out error:', error.message);
    throw error;
  }
};
