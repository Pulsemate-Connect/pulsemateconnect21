/**
 * Phone Auth — PulseMate Connect (App - React Native/Expo)
 *
 * Flow (Backend-driven — works in React Native):
 *   1. App → Backend /auth/patient/send-otp → Backend sends SMS via Firebase Admin SDK
 *   2. User enters OTP
 *   3. App → Backend /auth/patient/verify-otp → Backend verifies & returns app JWT
 *   4. User logged in ✅
 *
 * Why this approach for React Native:
 *   - React Native doesn't support Firebase JS SDK (web-only APIs)
 *   - Backend uses Firebase Admin SDK (service account) which can send SMS
 *   - Simpler and works everywhere
 */

import api from '../api/axios';

/**
 * Step 1 — Ask backend to send OTP via Firebase Admin SDK
 * Returns the phone number for Step 2
 */
export const sendOtpToPhone = async (phoneNumber) => {
  try {
    const res = await api.post('/auth/patient/send-otp', {
      mobile: phoneNumber,
      purpose: 'LOGIN',
    });

    if (res.data) {
      return phoneNumber; // used as session token for verifyPhoneOtp
    }

    throw new Error('Failed to send OTP. Please try again.');
  } catch (err) {
    const msg = err?.response?.data?.message || err?.message || 'Failed to send OTP.';
    throw new Error(friendlyError(msg));
  }
};

/**
 * Step 2 — Verify OTP via backend and get app JWT
 * Returns { accessToken, refreshToken, user }
 */
export const verifyPhoneOtp = async (sessionInfo, code) => {
  const phoneNumber = sessionInfo;

  try {
    const res = await api.post('/auth/patient/verify-otp', {
      mobile: phoneNumber,
      otp: code,
      purpose: 'LOGIN',
    });

    const data = res.data?.data ?? res.data;

    if (!data?.accessToken || !data?.user) {
      throw new Error('Verification failed. Please try again.');
    }

    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken ?? null,
      user: data.user,
    };
  } catch (err) {
    const msg = err?.response?.data?.message || err?.message || 'Verification failed.';
    throw new Error(friendlyError(msg));
  }
};

// ── User-friendly error messages ──────────────────────────────────────────────
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
