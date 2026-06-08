import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// ── API URL resolution ─────────────────────────────────────────────────────
// Dev  : uses extra.apiUrl from app.json  (your LAN IP)
// Prod : uses extra.apiUrlProd from app.json (your deployed backend)
// To switch to production, update "apiUrlProd" in app.json before building.
const isDev = __DEV__;
export const BASE_URL = isDev
  ? (Constants.expoConfig?.extra?.apiUrl ?? 'http://192.168.31.77:5000/api')
  : (Constants.expoConfig?.extra?.apiUrlProd ?? 'https://YOUR_DEPLOYED_BACKEND_URL/api');

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token to every request
api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch { }
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('accessToken');
    }
    return Promise.reject(error);
  }
);

export default api;
