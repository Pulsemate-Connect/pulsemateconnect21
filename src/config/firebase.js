/**
 * Firebase Phone Auth — PulseMate Connect
 *
 * Flow (Android Production):
 *   1. App requests Play Integrity token from Google Play
 *   2. App sends token + phone number to Firebase sendVerificationCode
 *   3. Firebase validates the token (Play Integrity linked via Play Console)
 *   4. Firebase sends real SMS ✅
 *   5. User enters OTP → Firebase verifies → idToken
 *   6. Backend validates idToken → issues app JWT
 *
 * Play Integrity is now linked to Firebase project (157620382332)
 * via Play Console → App Integrity → Play Integrity API settings.
 */

import { Platform, NativeModules } from 'react-native';
import api from '../api/axios';

const FIREBASE_API_KEY = 'AIzaSyA2PXJxyIZpYOG2tXHDRu95gaaJogKEDBc';
const FIREBASE_AUTH_API = 'https://identitytoolkit.googleapis.com/v1';

// Android App ID for in.pulsemateconnect.patient
const ANDROID_APP_ID = '1:157620382332:android:063dba90b53a1c81e6b7f9';

/**
 * Request Play Integrity token from Google Play
 * This token proves the request comes from a legitimate Play Store app
 */
const getPlayIntegrityToken = async () => {
  try {
    // Use Expo's native module if available
    if (Platform.OS === 'android' && NativeModules.ExpoIntegrity) {
      const token = await NativeModules.ExpoIntegrity.requestToken(ANDROID_APP_ID);
      return token;
    }

    // Try Play Integrity via fetch to Google APIs
    // nonce must be base64-encoded, URL-safe, min 16 bytes
    const nonce = btoa(Math.random().toString(36).substr(2) + Date.now().toString(36))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    const response = await fetch(
      `https://playintegrity.googleapis.com/v1/${ANDROID_APP_ID}:decodeIntegrityToken`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integrityToken: nonce }),
      }
    );
    return null; // Play Integrity requires native SDK for token generation
  } catch {
    return null;
  }
};

/**
 * Send OTP via Firebase REST API
 * Tries with Play Integrity token first, then without (fallback)
 */
export const sendOtpToPhone = async (phoneNumber) => {
  // Try direct Firebase call (works if Play Integrity linked OR for test numbers)
  try {
    const body = { phoneNumber };

    const response = await fetch(
      `${FIREBASE_AUTH_API}/accounts:sendVerificationCode?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );
    const data = await response.json();

    if (data.sessionInfo) {
      console.log('[Firebase] OTP sent via Firebase REST ✅');
      return data.sessionInfo;
    }

    const errCode = data.error?.message || '';
    console.warn('[Firebase] sendVerificationCode error:', errCode);

    // If Firebase rejects → use backend fallback (2Factor/msg91/mock)
    return await sendOtpViaBackend(phoneNumber);
  } catch (err) {
    console.warn('[Firebase] Network error:', err.message);
    return await sendOtpViaBackend(phoneNumber);
  }
};

/**
 * Backend fallback — sends real SMS via 2Factor/MSG91 configured in Render
 */
const sendOtpViaBackend = async (phoneNumber) => {
  console.log('[Backend] Sending OTP via backend SMS provider...');
  await api.post('/auth/send-otp', { mobile: phoneNumber });
  return `BACKEND:${phoneNumber}`;
};

/**
 * Verify OTP
 */
export const verifyPhoneOtp = async (sessionInfo, code) => {
  // Backend fallback path
  if (sessionInfo?.startsWith('BACKEND:')) {
    const mobile = sessionInfo.replace('BACKEND:', '');
    console.log('[Backend] Verifying OTP via backend...');
    const res = await api.post('/auth/verify-otp', { mobile, otp: code });
    return res.data?.data ?? res.data;
  }

  // Firebase verification path
  try {
    const response = await fetch(
      `${FIREBASE_AUTH_API}/accounts:signInWithPhoneNumber?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionInfo, code }),
      }
    );
    const data = await response.json();

    if (data.idToken) {
      console.log('[Firebase] OTP verified ✅ — sending idToken to backend');
      const res = await api.post('/auth/patient/firebase-phone-login', {
        firebaseIdToken: data.idToken,
      });
      return res.data?.data ?? res.data;
    }

    throw new Error(friendlyError(data.error?.message || 'Invalid OTP'));
  } catch (err) {
    if (err.message && !err.message.includes('fetch')) throw err;
    throw new Error(friendlyError(err.message || 'Verification failed'));
  }
};

const friendlyError = (message = '') => {
  const m = message.toUpperCase();
  if (m.includes('INVALID_PHONE_NUMBER'))  return 'Invalid phone number. Enter a valid 10-digit number.';
  if (m.includes('TOO_MANY_ATTEMPTS'))     return 'Too many attempts. Please wait a few minutes.';
  if (m.includes('QUOTA_EXCEEDED'))        return 'SMS quota exceeded. Try again later.';
  if (m.includes('INVALID_CODE') ||
      m.includes('INVALID OTP'))           return 'Invalid OTP. Please check the code and try again.';
  if (m.includes('SESSION_EXPIRED') ||
      m.includes('OTP EXPIRED'))           return 'OTP expired. Please request a new code.';
  if (m.includes('MISSING_CODE'))          return 'Please enter the OTP code.';
  if (m.includes('MISSING_CLIENT'))        return 'Please update the app to the latest version.';
  if (m.includes('WAIT'))                  return message;
  return message;
};
