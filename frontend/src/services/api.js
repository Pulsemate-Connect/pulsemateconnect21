/**
 * API Service — PulseMate Connect Web
 *
 * Axios instance with interceptors for authentication and error handling.
 *
 * Features:
 *   - Automatic token injection
 *   - Token refresh on 401
 *   - Request/response logging
 *   - Error normalization
 *   - CSRF protection via cookies
 *
 * @module services/api
 */

import axios from 'axios';
import useAuthStore from '../stores/authStore'; // ✅ FIXED: Use correct store path

// ──────────────────────────────────────────────────────────────────────────────
// Configuration
// ──────────────────────────────────────────────────────────────────────────────

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const REQUEST_TIMEOUT = 30000; // 30 seconds

// ──────────────────────────────────────────────────────────────────────────────
// Axios Instance
// ──────────────────────────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  withCredentials: true, // Important: Send cookies with every request
  headers: {
    'Content-Type': 'application/json',
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// Request Interceptor
// ──────────────────────────────────────────────────────────────────────────────

api.interceptors.request.use(
  (config) => {
    // Get access token from store
    const token = useAuthStore.getState().accessToken;

    // Inject access token if available
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request in development
    if (import.meta.env.DEV) {
      console.log(`[API] ${config.method.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data,
      });
    }

    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// ──────────────────────────────────────────────────────────────────────────────
// Response Interceptor
// ──────────────────────────────────────────────────────────────────────────────

let isRefreshing = false;
let failedQueue = [];

/**
 * Process failed queue after token refresh
 */
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    // Log response in development
    if (import.meta.env.DEV) {
      console.log(`[API] Response ${response.config.url}:`, response.data);
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Log error in development
    if (import.meta.env.DEV) {
      console.error('[API] Response error:', {
        url: originalRequest?.url,
        status: error.response?.status,
        message: error.response?.data?.message,
      });
    }

    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh token
        console.log('[API] Token expired, refreshing...');

        const { data } = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true } // Send refresh token cookie
        );

        // Update access token in store
        useAuthStore.getState().setAccessToken(data.data.accessToken);

        // Update user data if returned
        if (data.data.user) {
          useAuthStore.getState().updateUser(data.data.user);
        }

        console.log('[API] Token refreshed successfully');

        // Process queued requests
        processQueue(null, data.data.accessToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Token refresh failed - logout user
        console.error('[API] Token refresh failed:', refreshError);
        
        processQueue(refreshError, null);
        useAuthStore.getState().logout();

        // Redirect to login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?session=expired';
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle 403 Forbidden - Insufficient permissions
    if (error.response?.status === 403) {
      console.error('[API] Forbidden - Insufficient permissions');
      
      // You can redirect to an unauthorized page or show a message
      // window.location.href = '/unauthorized';
    }

    // Handle 429 Too Many Requests
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      console.error(`[API] Rate limited. Retry after ${retryAfter} seconds`);
    }

    // Normalize error for consistent handling
    const normalizedError = normalizeError(error);
    return Promise.reject(normalizedError);
  }
);

// ──────────────────────────────────────────────────────────────────────────────
// Error Normalization
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Normalize API errors for consistent handling in components
 *
 * @param {Error} error - Axios error
 * @returns {Object} Normalized error object
 */
const normalizeError = (error) => {
  // Network error (no response from server)
  if (!error.response) {
    return {
      message: 'Network error. Please check your internet connection.',
      status: 0,
      code: 'NETWORK_ERROR',
      originalError: error,
    };
  }

  // Server responded with error
  const { status, data } = error.response;

  return {
    message: data?.message || error.message || 'An error occurred',
    status,
    code: data?.code || 'SERVER_ERROR',
    errors: data?.errors || null, // Validation errors
    originalError: error,
  };
};

// ──────────────────────────────────────────────────────────────────────────────
// API Helper Methods
// ──────────────────────────────────────────────────────────────────────────────

/**
 * GET request wrapper
 */
export const get = (url, config = {}) => api.get(url, config);

/**
 * POST request wrapper
 */
export const post = (url, data, config = {}) => api.post(url, data, config);

/**
 * PUT request wrapper
 */
export const put = (url, data, config = {}) => api.put(url, data, config);

/**
 * PATCH request wrapper
 */
export const patch = (url, data, config = {}) => api.patch(url, data, config);

/**
 * DELETE request wrapper
 */
export const del = (url, config = {}) => api.delete(url, config);

/**
 * Upload file with progress tracking
 *
 * @param {string} url - Upload endpoint
 * @param {FormData} formData - Form data with file
 * @param {Function} onProgress - Progress callback
 * @returns {Promise}
 */
export const upload = (url, formData, onProgress) => {
  return api.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      }
    },
  });
};

// ──────────────────────────────────────────────────────────────────────────────
// Authentication API Methods
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Verify Firebase ID token and login
 *
 * @param {string} firebaseIdToken - Firebase ID token
 * @param {string} [name] - Optional user name
 * @returns {Promise<Object>} User and access token
 */
export const loginWithFirebase = async (firebaseIdToken, name) => {
  const { data } = await post('/auth/patient/firebase-phone-login', {
    firebaseIdToken,
    name,
  });
  return data.data;
};

/**
 * Refresh access token
 *
 * @returns {Promise<Object>} New access token and user
 */
export const refreshToken = async () => {
  const { data } = await post('/auth/refresh', {});
  return data.data;
};

/**
 * Logout (revoke tokens)
 *
 * @returns {Promise<void>}
 */
export const logout = async () => {
  try {
    await post('/auth/logout', {});
  } catch (error) {
    console.error('[API] Logout error:', error);
    // Continue with local logout even if API call fails
  }
};

/**
 * Get current user profile
 *
 * @returns {Promise<Object>} User profile
 */
export const getMe = async () => {
  const { data } = await get('/auth/me');
  return data.data;
};

// ──────────────────────────────────────────────────────────────────────────────
// Exports
// ──────────────────────────────────────────────────────────────────────────────

export default api;
