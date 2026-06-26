import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// ── API URL resolution ─────────────────────────────────────────────────────
const isDev = __DEV__;
export const BASE_URL = isDev
  ? (Constants.expoConfig?.extra?.apiUrl ?? 'https://api.pulsemateconnect.in/api')
  : (Constants.expoConfig?.extra?.apiUrlProd ?? 'https://api.pulsemateconnect.in/api');

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'bypass-tunnel-reminder': 'true',
    'ngrok-skip-browser-warning': 'true',
    'User-Agent': 'PulseMateApp/1.0',
  },
});

// ── Global sign-out callback — set by AuthProvider ─────────────────────────
// Avoids circular import between axios ↔ authStore
let _globalSignOut = null;
export const setGlobalSignOut = (fn) => { _globalSignOut = fn; };

// Routes that must NOT trigger a token refresh attempt
const shouldSkipRefresh = (url = '') =>
  [
    '/auth/login',
    '/auth/login-password',
    '/auth/patient/firebase-phone-login',
    '/auth/patient/send-otp',
    '/auth/patient/verify-otp',
    '/auth/refresh',
    '/user-auth/send-otp',
    '/user-auth/verify-otp',
    '/device-token/deactivate',
  ].some((path) => url.includes(path));

// Shared refresh promise — prevents multiple concurrent refresh calls
let refreshPromise = null;

// Attach token to every request
api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch { }
  if (__DEV__) {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
  }
  return config;
});

// ── 401: attempt silent token refresh, then retry once ─────────────────────
// Mirrors the web axios interceptor behaviour so mobile sessions last as long
// as the refresh token is valid (7 days) instead of expiring after 15 minutes.
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config || {};

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !shouldSkipRefresh(originalRequest.url)
    ) {
      originalRequest._retry = true;

      try {
        // Use a shared promise so concurrent 401s only refresh once
        const storedRefreshToken = await SecureStore.getItemAsync('refreshToken').catch(() => null);
        refreshPromise ??= axios.post(
          `${BASE_URL}/auth/refresh`,
          storedRefreshToken ? { refreshToken: storedRefreshToken } : {},
          { withCredentials: false } // mobile uses SecureStore, not cookies
        );
        const refreshRes = await refreshPromise;
        refreshPromise = null;

        const newAccessToken = refreshRes.data?.data?.accessToken;
        const newRefreshToken = refreshRes.data?.data?.refreshToken;
        if (newAccessToken) {
          await SecureStore.setItemAsync('accessToken', newAccessToken);
          if (newRefreshToken) {
            await SecureStore.setItemAsync('refreshToken', newRefreshToken);
          }
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch {
        refreshPromise = null;
      }

      // Refresh failed — sign out
      await SecureStore.deleteItemAsync('accessToken');
      if (_globalSignOut) {
        try { _globalSignOut(); } catch { }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
