import { useState, useCallback } from 'react';
import axios from 'axios';

/**
 * Hook for role switching functionality
 * 
 * Handles:
 * - Calling the /api/auth/switch-role endpoint
 * - Updating stored access token
 * - Updating auth context
 * - Error handling
 * 
 * Usage:
 * const { switchRole, switching, error } = useRoleSwitcher();
 * await switchRole('CLINIC_OWNER');
 */
const useRoleSwitcher = () => {
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Switch to a different role
   * @param {string} newRole - Role to switch to (e.g., 'CLINIC_OWNER')
   * @returns {Promise<object>} - New token and activeRole
   */
  const switchRole = useCallback(async (newRole) => {
    setSwitching(true);
    setError(null);

    try {
      // Get current access token
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No access token found. Please login again.');
      }

      // Call switch-role API
      const apiUrl = import.meta.env.VITE_API_URL || '/api';
      const response = await axios.post(
        `${apiUrl}/auth/switch-role`,
        { newRole },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const { accessToken, activeRole } = response.data.data;

      // Update stored token
      localStorage.setItem('accessToken', accessToken);

      // Also update axios default headers for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

      console.log('[RoleSwitcher] Role switched successfully:', {
        newRole,
        activeRole,
      });

      return {
        accessToken,
        activeRole,
        success: true,
      };
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to switch role';
      setError(errorMessage);
      
      console.error('[RoleSwitcher] Error switching role:', {
        error: errorMessage,
        details: err.response?.data,
      });

      throw new Error(errorMessage);
    } finally {
      setSwitching(false);
    }
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    switchRole,
    switching,
    error,
    clearError,
  };
};

export default useRoleSwitcher;
