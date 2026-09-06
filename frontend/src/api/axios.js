import axios from 'axios';
import useAuthStore from '../stores/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AXIOS CLIENT — Production Session-Based Authentication
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * SECURITY CHANGES:
 * 1. Session cookies sent automatically (withCredentials: true)
 * 2. NO access token in Authorization header for session-based auth
 * 3. Cookies are HttpOnly and managed by browser
 * 4. Session validated on every request via middleware
 * 
 * Authentication flow:
 * - Login: Backend sets HttpOnly session cookie
 * - Requests: Cookie sent automatically with every request
 * - No JavaScript access to session cookie (XSS protection)
 * - Logout: Backend clears session cookie
 * 
 * Backward compatibility:
 * - Mobile apps can still use JWT Bearer tokens
 * - Check for accessToken in store for mobile support
 */

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // ✅ CRITICAL: Send cookies with every request
  timeout: 10000, // 10 second timeout - prevents infinite hanging
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshPromise = null;

const shouldSkipRefresh = (url = '') =>
  [
    '/auth/login',
    '/auth/login-password',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/verify-reset-token',
    '/auth/send-otp',
    '/auth/verify-otp',
    '/auth/register',
    '/auth/patient/send-otp',
    '/auth/patient/verify-otp',
    '/auth/clinic-owner/send-otp',
    '/auth/clinic-owner/verify-otp',
    '/auth/clinic-owner/send-email-otp',
    '/auth/clinic-owner/verify-email-otp',
    '/auth/clinic-owner/send-email-verification',
    '/auth/clinic-owner/upload-document',
    '/auth/clinic-owner/register',
    '/auth/doctor/register',
    '/user-auth/send-otp',
    '/user-auth/verify-otp',
    '/device-token/deactivate',
  ].some((path) => url.includes(path));

// ✅ REMOVED: Authorization header injection
// Session cookies are sent automatically by browser
// No need to manually add Authorization header for web browsers
//
// For mobile apps (if they send accessToken), it would be handled differently
api.interceptors.request.use((config) => {
  // ✅ SESSION-BASED: Cookies sent automatically by browser
  // No need to add Authorization header
  
  // ✅ BACKWARD COMPATIBLE: Support mobile apps that may still use JWT
  // Only add Authorization header if explicitly provided in request config
  // Mobile apps should NOT use this for web browsers
  if (config.headers?.Authorization) {
    // Keep existing Authorization header if provided
    return config;
  }
  
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    
    // Handle 403 Forbidden - Account rejected/suspended/pending
    if (error.response?.status === 403) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Access forbidden';
      
      // Check if this is an approval status error
      const isApprovalError = 
        errorMessage.toLowerCase().includes('rejected') ||
        errorMessage.toLowerCase().includes('suspended') ||
        errorMessage.toLowerCase().includes('pending');
      
      if (isApprovalError) {
        console.log('[Axios Interceptor] 403 - Account status issue, clearing auth');
        useAuthStore.getState().clearAuth();
        
        // Only redirect if we're on a protected route
        const currentPath = window.location.pathname;
        const isPublicRoute = 
          currentPath === '/' ||
          currentPath.startsWith('/login') ||
          currentPath.startsWith('/register') ||
          currentPath.startsWith('/forgot-password') ||
          currentPath.startsWith('/reset-password') ||
          currentPath.startsWith('/portal') ||
          currentPath.startsWith('/clinic-partner') ||
          currentPath.startsWith('/privacy') ||
          currentPath.startsWith('/terms') ||
          currentPath.startsWith('/about') ||
          currentPath.startsWith('/contact') ||
          currentPath.startsWith('/admin') && !currentPath.startsWith('/admin/');
        
        if (!isPublicRoute) {
          // Determine which login page to redirect to based on current path
          let loginPath = '/login';
          if (currentPath.startsWith('/patient')) {
            loginPath = '/login/patient';
          } else if (currentPath.startsWith('/doctor')) {
            loginPath = '/login/doctor';
          } else if (currentPath.startsWith('/receptionist') || currentPath.startsWith('/reception')) {
            loginPath = '/staff/login';
          } else if (currentPath.startsWith('/clinic') || currentPath.startsWith('/owner')) {
            loginPath = '/login/clinic-owner';
          }
          
          // Redirect to appropriate login page with error message
          window.location.href = loginPath + '?error=' + encodeURIComponent(errorMessage);
        }
        
        return Promise.reject(error);
      }
    }
    
    // Handle 401 Unauthorized - Session expired or invalid
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/me') && // ✅ Don't retry /auth/me
      !shouldSkipRefresh(originalRequest.url)
    ) {
      originalRequest._retry = true;

      try {
        // ✅ SESSION-BASED: Try to refresh session
        // This uses the refresh token cookie automatically
        refreshPromise ??= axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        const response = await refreshPromise;
        refreshPromise = null;

        const { user } = response.data.data;
        
        // ✅ Update auth store with refreshed user data
        // No accessToken to update (session-based)
        if (user) {
          useAuthStore.getState().setAuth(user, {
            authSource: 'SESSION_COOKIE',
          });
        }
        
        // Retry original request with refreshed session
        return api(originalRequest);
      } catch (refreshError) {
        refreshPromise = null;
        console.log('[Axios Interceptor] Session refresh failed, clearing auth');
        useAuthStore.getState().clearAuth();
        
        // Only redirect if we're on a protected route
        const currentPath = window.location.pathname;
        const isPublicRoute = 
          currentPath === '/' ||
          currentPath.startsWith('/login') ||
          currentPath.startsWith('/register') ||
          currentPath.startsWith('/forgot-password') ||
          currentPath.startsWith('/reset-password') ||
          currentPath.startsWith('/portal') ||
          currentPath.startsWith('/clinic-partner') ||
          currentPath.startsWith('/privacy') ||
          currentPath.startsWith('/terms') ||
          currentPath.startsWith('/about') ||
          currentPath.startsWith('/contact') ||
          currentPath.startsWith('/admin') && !currentPath.startsWith('/admin/');
        
        if (!isPublicRoute) {
          // Determine which login page to redirect to based on current path
          let loginPath = '/login';
          if (currentPath.startsWith('/patient')) {
            loginPath = '/login/patient';
          } else if (currentPath.startsWith('/doctor')) {
            loginPath = '/login/doctor';
          } else if (currentPath.startsWith('/receptionist') || currentPath.startsWith('/reception')) {
            loginPath = '/staff/login';
          } else if (currentPath.startsWith('/clinic') || currentPath.startsWith('/owner')) {
            loginPath = '/login/clinic-owner';
          }
          
          console.log('[Axios Interceptor] Redirecting to:', loginPath);
          window.location.href = loginPath;
        }
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
