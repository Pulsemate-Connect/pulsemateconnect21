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
 * Reverse geocode coordinates to address
 */
export const reverseGeocode = async (lat, lng) => {
  const response = await apiClient.get('/api/location/reverse-geocode', {
    params: { lat, lng },
  });
  return response.data;
};

/**
 * Search for locations by query
 */
export const searchLocation = async (query) => {
  const response = await apiClient.get('/api/location/search', {
    params: { q: query },
  });
  return response.data;
};

export default {
  reverseGeocode,
  searchLocation,
};
