import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { getIsSigningOut } from '../store/authStore';

// ── Safe __DEV__ check ─────────────────────────────────────────────────────
// In release builds, __DEV__ may be undefined. Default to false.
const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : false;

// ── API URL resolution ─────────────────────────────────────────────────────
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
    'User-Agent': 'PulseMate Connect App/1.0',
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
    '/auth/logout',
    '/patient/account',
  ].some((path) => url.includes(path));

// Shared refresh promise — prevents multiple concurrent refresh calls
let refreshPromise = null;

// Attach token to every request
api.interceptors.request.use(async (config) => {
  // If signing out, cancel the request silently
  if (getIsSigningOut()) {
    const controller = new AbortController();
    controller.abort();
    config.signal = controller.signal;
    return config;
  }
  try {
    const token = await SecureStore.getItemAsync('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch { }
  if (isDev) {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
  }
  return config;
});

// ── 401/403: attempt silent token refresh, then retry once ─────────────────
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    // If request was aborted (during sign-out), swallow silently
    if (axios.isCancel(error) || error?.code === 'ERR_CANCELED') {
      return Promise.resolve({ data: null, _cancelled: true });
    }

    // If we're already signing out, don't process 401/403 errors
    if (getIsSigningOut()) {
      return Promise.resolve({ data: null, _cancelled: true });
    }

    const originalRequest = error.config || {};
    const status = error.response?.status;

    // Handle 401/403 — sign out without throwing
    if (
      (status === 401 || status === 403) &&
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
          { withCredentials: false }
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

      // Refresh failed — sign out gracefully, do NOT throw
      await SecureStore.deleteItemAsync('accessToken').catch(() => {});
      await SecureStore.deleteItemAsync('refreshToken').catch(() => {});
      if (_globalSignOut) {
        try { _globalSignOut(); } catch { }
      }
      // Return a resolved (empty) response so callers don't crash
      return Promise.resolve({ data: null, _unauthorized: true });
    }

    return Promise.reject(error);
  }
);

export default api;
