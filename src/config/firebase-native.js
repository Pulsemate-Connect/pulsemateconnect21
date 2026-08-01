/**
 * Firebase Native Auth - React Native Firebase
 * 
 * Uses @react-native-firebase which supports native SafetyNet attestation
 * NO reCAPTCHA modal required in production!
 */

import auth from '@react-native-firebase/auth';
import api from '../api/axios';

/**
 * Initialize Firebase Auth
 * React Native Firebase initializes automatically via google-services.json
 */
export const initializeFirebaseAuth = async () => {
  console.log('[Auth] ✅ React Native Firebase initialized automatically');
  console.log('[Auth] Mode:', __DEV__ ? 'Development' : 'Production');
  return auth();
};

/**
 * Get Firebase Auth instance
 */
export const getFirebaseAuth = () => {
  return auth();
};

/**
 * Send OTP via Firebase Phone Authentication
 * 
 * React Native Firebase AUTOMATICALLY uses SafetyNet in production
 * NO rec aptchaVerifier parameter needed!
 * 
 * @param {string} phoneNumber - Phone in E.164 format (+91XXXXXXXXXX)
 * @returns {Promise<{confirmation, phoneNumber, timestamp}>}
 */
export const sendOtpToPhone = async (phoneNumber) => {
  // Validate phone number
  if (!phoneNumber || !/^\+[1-9]\d{9,14}$/.test(phoneNumber)) {
    throw new Error('Invalid phone number. Use E.164 format: +91XXXXXXXXXX');
  }

  try {
    const timestamp = Date.now();
    console.log('[Auth] 📱 Sending OTP to:', phoneNumber);
    console.log('[Auth] 🔐 Using Native SafetyNet (React Native Firebase)');
    console.log('[Auth] ⏰ Request timestamp:', new Date(timestamp).toISOString());

    // React Native Firebase automatically uses SafetyNet in production
    // NO recaptchaVerifier needed!
    const confirmation = await auth().signInWithPhoneNumber(phoneNumber);

    console.log('[Auth] ✅ OTP sent successfully');
    console.log('[Auth] 🔑 VerificationId:', confirmation.verificationId);
    console.log('[Auth] ⏰ Valid until:', new Date(timestamp + 120000).toISOString(), '(2 minutes)');

    return {
      confirmation,
      phoneNumber,
      verificationId: confirmation.verificationId,
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
    } else if (error.code === 'auth/app-not-authorized') {
      throw new Error('App not authorized. Please add SHA-256 to Firebase Console.');
    } else if (error.code === 'auth/captcha-check-failed') {
      throw new Error('SafetyNet verification failed. Please try again.');
    } else if (error.code === 'auth/missing-client-identifier') {
      throw new Error('App configuration error. Please check Firebase setup.');
    }

    throw new Error(error.message || 'Failed to send OTP. Please try again.');
  }
};

/**
 * Verify OTP code and complete phone authentication
 * 
 * @param {ConfirmationResult} confirmation - From sendOtpToPhone()
 * @param {string} code - 6-digit OTP code from SMS
 * @param {number} sentTimestamp - Timestamp when OTP was sent
 * @returns {Promise<{user, idToken, phoneNumber}>}
 */
export const verifyPhoneOtp = async (confirmation, code, sentTimestamp = null) => {
  if (!confirmation) {
    console.error('[Auth] ❌ No confirmation provided');
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

    // Confirm OTP with Firebase
    const userCredential = await confirmation.confirm(code);

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

    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken ?? null,
      user: data.user,
    };
  } catch (err) {
    console.error('[Auth] ❌ Backend login error:', err.message);
    
    if (err.response?.status === 401) {
      throw new Error('Firebase token verification failed. Please try again.');
    } else if (err.response?.data?.message) {
      throw new Error(err.response.data.message);
    }
    
    throw new Error(err.message || 'Login failed. Please try again.');
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
    await auth().signOut();
    console.log('[Auth] ✅ User signed out');
  } catch (error) {
    console.error('[Auth] ❌ Sign out error:', error.message);
    throw error;
  }
};
