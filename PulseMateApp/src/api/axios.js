import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// ── API URL resolution ─────────────────────────────────────────────────────
const isDev = __DEV__;
export const BASE_URL = isDev
  ? (Constants.expoConfig?.extra?.apiUrlDev ?? 'http://192.168.31.240:5000/api')
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
      // Call global sign-out which clears auth state → AuthNavigator shows Login
      if (_globalSignOut) {
        try { _globalSignOut(); } catch { }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
