import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Hook to fetch and manage doctor onboarding status
 * Used by OnboardingGuard to enforce sequential flow
 * 
 * @returns {Object} { status, loading, error, refetch, canAccessClinic, nextStep }
 */
export const useOnboardingStatus = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get JWT token from localStorage
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return null;
      }

      const response = await axios.get(`${API_URL}/api/doctor/onboarding/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const statusData = response.data.data;
      setStatus(statusData);
      setLoading(false);
      
      return statusData;
    } catch (err) {
      console.error('[useOnboardingStatus] Error fetching status:', err);
      setError(err.response?.data?.message || 'Failed to fetch onboarding status');
      setLoading(false);
      return null;
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return {
    // Current onboarding status
    status,
    // Loading state
    loading,
    // Error message
    error,
    // Function to refetch status
    refetch: fetchStatus,
    // Convenience flags
    canAccessClinic: status?.canAccessClinic || false,
    onboardingStatus: status?.onboardingStatus,
    nextStep: status?.nextStep,
    correctRoute: status?.correctRoute,
    invitationToken: status?.invitationToken,
    allowedRoutes: status?.allowedRoutes || [],
  };
};

export default useOnboardingStatus;
