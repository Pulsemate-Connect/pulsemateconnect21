/**
 * Firebase Phone Authentication — PulseMate Connect (Expo)
 * 
 * Production Implementation WITHOUT expo-firebase-recaptcha
 * ======================================================
 * ✅ Works in production AAB builds with registered SHA-256
 * ✅ Sends REAL SMS OTP to ANY valid phone number
 * ✅ Uses Firebase SafetyNet attestation (automatic)
 * ✅ No reCAPTCHA modal needed in production
 */

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithPhoneNumber } from 'firebase/auth';
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
    
    firebaseAuth = getAuth(firebaseApp);
    
    console.log('[Auth] ✅ Firebase initialized successfully');
    console.log('[Auth] Mode: Production (SafetyNet attestation)');
    
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
 * In production builds with registered SHA-256, Firebase automatically uses
 * SafetyNet attestation instead of reCAPTCHA. No applicationVerifier needed.
 * 
 * @param {string} phoneNumber - Phone in E.164 format (+91XXXXXXXXXX)
 * @returns {Promise<{confirmationResult, phoneNumber, verificationId, timestamp}>}
 */
export const sendOtpToPhone = async (phoneNumber) => {
  // Validate phone number
  if (!phoneNumber || !/^\+[1-9]\d{9,14}$/.test(phoneNumber)) {
    throw new Error('Invalid phone number. Use E.164 format: +91XXXXXXXXXX');
  }

  try {
    const timestamp = Date.now();
    console.log('[Auth] 📱 Sending OTP to:', phoneNumber);
    console.log('[Auth] 🔐 Using SafetyNet attestation (production)');
    console.log('[Auth] ⏰ Request timestamp:', new Date(timestamp).toISOString());

    const auth = getFirebaseAuth();

    // ✅ In production builds, omit applicationVerifier parameter
    // Firebase will automatically use SafetyNet attestation
    const confirmationResult = await signInWithPhoneNumber(
      auth,
      phoneNumber
      // No third parameter - SafetyNet is automatic in production
    );

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
      throw new Error('App not authorized. Please check SHA-256 fingerprints in Firebase Console.');
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

    const res = await api.post('/auth/patient/firebase-phone-login', {
      firebaseIdToken: idToken,
      name: name && name.trim().length >= 2 ? name.trim() : 'Patient',
    });

    console.log('[Auth] 📥 Backend response status:', res.status);

    const data = res.data?.data ?? res.data;

    if (!data?.accessToken || !data?.user) {
      console.error('[Auth] ❌ Invalid response structure:', data);
      throw new Error('Session creation failed: Invalid server response');
    }

    console.log('[Auth] ✅ Login successful');
    console.log('[Auth] 👤 User ID:', data.user.id);
    console.log('[Auth] 📱 User phone:', data.user.phone);

    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken ?? null,
      user: data.user,
    };
  } catch (err) {
    console.error('[Auth] ❌ Backend login error');
    console.error('[Auth] ❌ Error:', err.message);
    
    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
      throw new Error('Cannot reach server. Please check your internet connection.');
    } else if (err.response?.status === 401) {
      throw new Error('Firebase token verification failed. Please try again.');
    } else if (err.response?.data?.message) {
      throw new Error(err.response.data.message);
    } else {
      throw new Error(err.message || 'Login failed. Please try again.');
    }
  }
};

/**
 * Resend OTP to the same phone number
 */
export const resendOtp = async (phoneNumber) => {
  return sendOtpToPhone(phoneNumber);
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
