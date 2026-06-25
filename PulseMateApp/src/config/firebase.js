/**
 * Firebase Phone Auth for React Native (Expo Go compatible)
 *
 * Uses Firebase REST API instead of Firebase SDK for Expo Go compatibility.
 * Works with expo-firebase-recaptcha for reCAPTCHA handling.
 *
 * ── Setup checklist (before production build) ─────────────────────────────
 * 1. Go to https://console.firebase.google.com → pulsemateconnect project
 * 2. Project Settings → Your apps → Add app → Android
 *    Package name: com.pulsemate.app
 * 3. Add SHA-1 from release keystore:  eas credentials --platform android
 * 4. Download google-services.json → place in PulseMateApp/ root
 * 5. Copy the Android App ID (1:157620382332:android:XXXXXXXX)
 * 6. Replace REPLACE_WITH_ANDROID_APP_ID below with the actual Android App ID
 * 7. Restrict the API key in Google Cloud Console to package com.pulsemate.app
 */

export const firebaseConfig = {
  apiKey:            'AIzaSyDrZ9d0zKBLI_Pm-c9o1DAV5q4ldE1I9Nw',
  authDomain:        'pulsemateconnect.firebaseapp.com',
  projectId:         'pulsemateconnect',
  messagingSenderId: '157620382332',
  // ⚠️  Replace with Android App ID after registering com.pulsemate.app in Firebase Console
  // Web App ID works for Expo Go testing only — use Android App ID for production builds
  appId:             '1:157620382332:web:e4156f49d8616a4ee6b7f9',
};

const FIREBASE_AUTH_API = 'https://identitytoolkit.googleapis.com/v1';

/**
 * Send OTP via Firebase Phone Auth REST API
 * @param {string} phoneNumber  E.164 format e.g. "+917022818878"
 * @param {string} recaptchaToken  Token from FirebaseRecaptchaVerifierModal
 * @returns {Promise<string>} sessionInfo
 */
export const sendOtpToPhone = async (phoneNumber, recaptchaToken) => {
  const response = await fetch(
    `${FIREBASE_AUTH_API}/accounts:sendVerificationCode?key=${firebaseConfig.apiKey}`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ phoneNumber, recaptchaToken }),
    }
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(friendlyError(data.error?.message || 'Failed to send OTP'));
  }
  return data.sessionInfo;
};

/**
 * Verify OTP and return Firebase ID token
 * @param {string} sessionInfo  From sendOtpToPhone
 * @param {string} code         6-digit OTP
 * @returns {Promise<string>} Firebase ID token
 */
export const verifyPhoneOtp = async (sessionInfo, code) => {
  const response = await fetch(
    `${FIREBASE_AUTH_API}/accounts:signInWithPhoneNumber?key=${firebaseConfig.apiKey}`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ sessionInfo, code }),
    }
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(friendlyError(data.error?.message || 'Invalid OTP'));
  }
  return data.idToken;
};

const friendlyError = (message) => {
  const map = {
    INVALID_PHONE_NUMBER:       'Invalid phone number. Enter a valid 10-digit number.',
    TOO_MANY_ATTEMPTS_TRY_LATER:'Too many attempts. Please wait a few minutes.',
    QUOTA_EXCEEDED:             'SMS quota exceeded. Try again later.',
    INVALID_CODE:               'Invalid OTP. Please check the code and try again.',
    SESSION_EXPIRED:            'OTP expired. Please request a new code.',
    MISSING_CODE:               'Please enter the OTP code.',
    CAPTCHA_CHECK_FAILED:       'reCAPTCHA failed. Please try again.',
  };
  for (const [key, value] of Object.entries(map)) {
    if (message.includes(key)) return value;
  }
  return message;
};
