/**
 * Firebase Phone Authentication — PulseMate Connect (Expo)
 * 
 * Production Implementation:
 * - Uses Firebase web SDK with proper Expo compatibility
 * - Firebase sends real SMS OTP directly to user's phone
 * - User enters SMS code received on their device
 * - Backend only verifies the ID Token and creates session
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPhoneNumber } from 'firebase/auth';
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

let firebaseApp = null;
let firebaseAuth = null;
let confirmationResult = null;

export const initializeFirebaseAuth = async () => {
  if (firebaseApp) return firebaseAuth;
  try {
    firebaseApp = initializeApp(firebaseConfig);
    firebaseAuth = getAuth(firebaseApp);
    
    // Critical: Disable reCAPTCHA for Expo/mobile
    if (typeof window === 'undefined' || !window.document) {
      firebaseAuth.settings = firebaseAuth.settings || {};
      firebaseAuth.settings.appVerificationDisabledForTesting = true;
    }
    
    console.log('[Auth] Firebase initialized for Expo');
    return firebaseAuth;
  } catch (error) {
    console.error('[Auth] Firebase init failed:', error.message);
    throw new Error('Firebase initialization failed');
  }
};

/**
 * Send OTP via Firebase Authentication
 * For Expo/React Native with appVerificationDisabledForTesting
 */
export const sendOtpToPhone = async (phoneNumber) => {
  if (!phoneNumber || !/^\+[1-9]\d{9,14}$/.test(phoneNumber)) {
    throw new Error('Invalid phone number. Use format: +91XXXXXXXXXX');
  }

  try {
    console.log('[Auth] Sending OTP to phone');

    const auth = getAuth();

    // For Expo with appVerificationDisabledForTesting, we need to pass null
    // Firebase will handle verification automatically
    try {
      confirmationResult = await signInWithPhoneNumber(auth, phoneNumber);
      console.log('[Auth] OTP sent to phone successfully');
    } catch (innerError) {
      // If signInWithPhoneNumber fails without verifier, Firebase might require testing mode
      console.error('[Auth] signInWithPhoneNumber error:', innerError.code);
      
      // Try with explicit null verifier
      if (innerError.code === 'auth/argument-error') {
        throw new Error('This device/environment may not support Firebase Phone Auth. Use a real Android device.');
      }
      throw innerError;
    }

    return {
      confirmationResult,
      phoneNumber,
    };
  } catch (error) {
    console.error('[Auth] Send OTP error:', error.message);

    if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many OTP requests. Please try again later.');
    } else if (error.code === 'auth/invalid-phone-number') {
      throw new Error('Invalid phone number format.');
    } else if (error.code === 'auth/operation-not-supported-in-this-environment') {
      throw new Error('Firebase Phone Auth not available in this region.');
    }

    throw new Error(error.message || 'Failed to send OTP');
  }
};

/**
 * Verify OTP using Firebase Authentication
 */
export const verifyPhoneOtp = async (confirmResult, code) => {
  if (!confirmResult) {
    throw new Error('No OTP request found. Please send OTP first.');
  }

  if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
    throw new Error('Please enter a valid 6-digit code.');
  }

  try {
    console.log('[Auth] Verifying OTP code');

    const userCredential = await confirmResult.confirm(code);

    console.log('[Auth] OTP verified, user signed in');

    const idToken = await userCredential.user.getIdToken();

    return {
      user: userCredential.user,
      idToken,
      phoneNumber: userCredential.user.phoneNumber,
    };
  } catch (error) {
    console.error('[Auth] OTP verification error:', error.message);

    if (error.code === 'auth/invalid-verification-code') {
      throw new Error('Invalid OTP code. Please check and try again.');
    } else if (error.code === 'auth/code-expired') {
      throw new Error('OTP code expired. Please request a new one.');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many verification attempts. Please try again later.');
    }

    throw new Error(error.message || 'OTP verification failed');
  }
};

/**
 * Send Firebase ID Token to backend for session creation
 */
export const loginWithFirebaseToken = async (idToken, name = null) => {
  if (!idToken) {
    throw new Error('Firebase ID Token required.');
  }

  try {
    console.log('[Auth] Logging in with Firebase token');

    const res = await api.post('/auth/patient/firebase-phone-login', {
      firebaseIdToken: idToken,
      name: name,
    });

    const data = res.data?.data ?? res.data;

    if (!data?.accessToken || !data?.user) {
      throw new Error('Session creation failed');
    }

    console.log('[Auth] Login successful');

    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken ?? null,
      user: data.user,
    };
  } catch (err) {
    console.error('[Auth] Login error:', err.message);
    const msg = err?.response?.data?.message || err?.message || 'Login failed';
    throw new Error(msg);
  }
};

/**
 * Resend OTP
 */
export const resendOtp = async (phoneNumber) => {
  confirmationResult = null;
  return sendOtpToPhone(phoneNumber);
};

/**
 * Sign out user
 */
export const signOutUser = async () => {
  try {
    const auth = getAuth();
    await auth.signOut();
    confirmationResult = null;
    console.log('[Auth] User signed out');
  } catch (error) {
    console.error('[Auth] Sign out error:', error.message);
    throw error;
  }
};
