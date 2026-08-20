import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create axios instance with auth token
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Save Step 1 data (Clinic Information)
 */
export const saveStep1Data = async (data) => {
  const response = await apiClient.post('/api/clinic/onboarding/step1', data);
  return response.data;
};

/**
 * Get onboarding progress
 */
export const getOnboardingProgress = async () => {
  const response = await apiClient.get('/api/clinic/onboarding/progress');
  return response.data;
};

/**
 * Save partial progress (auto-save)
 */
export const saveProgress = async (step, data) => {
  const response = await apiClient.post('/api/clinic/onboarding/save-progress', {
    step,
    data,
  });
  return response.data;
};

/**
 * Resume onboarding from saved progress
 */
export const resumeOnboarding = async () => {
  const response = await apiClient.get('/api/clinic/onboarding/resume');
  return response.data;
};

export default {
  saveStep1Data,
  getOnboardingProgress,
  saveProgress,
  resumeOnboarding,
};
