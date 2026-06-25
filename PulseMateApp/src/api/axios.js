import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// ── API URL resolution — always uses production URL in builds ─────────────
// Dev IP is NEVER bundled into production. Use eas.json build env vars.
export const BASE_URL =
  Constants.expoConfig?.extra?.apiUrl ??
  'https://api.pulsemateconnect.in/api';

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

// ── 401: clear token + trigger sign-out → navigates to Login automatically ─
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('accessToken');
      if (_globalSignOut) {
        try { _globalSignOut(); } catch { }
      }
    }
    // Map network errors to user-friendly messages
    if (!error.response && error.code === 'ECONNABORTED') {
      error.friendlyMessage = 'Request timed out. Please check your internet connection.';
    } else if (!error.response && (error.message?.includes('Network Error') || error.message?.includes('network'))) {
      error.friendlyMessage = 'No internet connection. Please check your network and try again.';
    }
    return Promise.reject(error);
  }
);

export default api;
