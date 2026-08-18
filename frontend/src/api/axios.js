import axios from 'axios';
import useAuthStore from '../store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
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

api.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
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
    
    // Handle 401 Unauthorized - Try token refresh
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !shouldSkipRefresh(originalRequest.url)
    ) {
      originalRequest._retry = true;

      try {
        refreshPromise ??= axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        const response = await refreshPromise;
        refreshPromise = null;

        const { accessToken, user } = response.data.data;
        useAuthStore.getState().setAuth(user, accessToken);
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        refreshPromise = null;
        console.log('[Axios Interceptor] Token refresh failed, clearing auth');
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
