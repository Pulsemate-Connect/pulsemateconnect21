/**
 * Authentication Store — PulseMate Connect Web
 *
 * Zustand store for managing authentication state across the application.
 *
 * Features:
 *   - User authentication state
 *   - Access token management
 *   - Persistent storage (localStorage)
 *   - Auto-rehydration on app load
 *
 * @module stores/authStore
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ──────────────────────────────────────────────────────────────────────────────
// Store Definition
// ──────────────────────────────────────────────────────────────────────────────

const useAuthStore = create(
  persist(
    (set, get) => ({
      // ── State ────────────────────────────────────────────────────────────
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,

      // ── Actions ──────────────────────────────────────────────────────────

      /**
       * Set authentication data after successful login
       *
       * @param {Object} user - User object
       * @param {string} accessToken - JWT access token
       */
      setAuth: (user, accessToken) => {
        console.log('[AuthStore] Setting authentication:', {
          userId: user?.id,
          role: user?.role,
        });

        set({
          user,
          accessToken,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      /**
       * Update user data (for profile updates)
       *
       * @param {Object} userData - Partial user object to merge
       */
      updateUser: (userData) => {
        const currentUser = get().user;
        
        if (!currentUser) {
          console.warn('[AuthStore] Cannot update user - not authenticated');
          return;
        }

        console.log('[AuthStore] Updating user data');
        
        set({
          user: {
            ...currentUser,
            ...userData,
          },
        });
      },

      /**
       * Update access token (for token refresh)
       *
       * @param {string} newToken - New access token
       */
      setAccessToken: (newToken) => {
        console.log('[AuthStore] Updating access token');
        
        set({
          accessToken: newToken,
        });
      },

      /**
       * Set loading state
       *
       * @param {boolean} loading - Loading state
       */
      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      /**
       * Clear authentication data (logout)
       */
      logout: () => {
        console.log('[AuthStore] Logging out');
        
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      /**
       * Check if user has a specific role
       *
       * @param {string} role - Role to check
       * @returns {boolean}
       */
      hasRole: (role) => {
        const user = get().user;
        return user?.role === role;
      },

      /**
       * Check if user has any of the specified roles
       *
       * @param {string[]} roles - Array of roles to check
       * @returns {boolean}
       */
      hasAnyRole: (roles) => {
        const user = get().user;
        return roles.includes(user?.role);
      },

      /**
       * Get user ID
       *
       * @returns {string|null}
       */
      getUserId: () => {
        return get().user?.id || null;
      },

      /**
       * Get user role
       *
       * @returns {string|null}
       */
      getUserRole: () => {
        return get().user?.role || null;
      },

      /**
       * Check if user profile is complete
       *
       * @returns {boolean}
       */
      isProfileComplete: () => {
        const user = get().user;
        
        if (!user) return false;

        // Check based on role
        switch (user.role) {
          case 'PATIENT':
            return user.patientProfile?.profileCompleted || false;
          case 'DOCTOR':
            return user.doctorProfile?.profileStatus === 'COMPLETE' || false;
          case 'CLINIC_OWNER':
            return user.clinicOwnerProfile?.profileCompleted || false;
          default:
            return true;
        }
      },
    }),
    {
      name: 'pulsemate-auth', // localStorage key
      storage: createJSONStorage(() => localStorage),
      
      // Only persist essential data
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),

      // Rehydration callback
      onRehydrateStorage: () => (state) => {
        if (state?.isAuthenticated) {
          console.log('[AuthStore] Rehydrated authenticated session');
        } else {
          console.log('[AuthStore] No persisted session found');
        }
      },
    }
  )
);

// ──────────────────────────────────────────────────────────────────────────────
// Selector Hooks (for optimized re-renders)
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Hook to get only user data (prevents unnecessary re-renders)
 */
export const useUser = () => useAuthStore((state) => state.user);

/**
 * Hook to get only authentication status
 */
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);

/**
 * Hook to get only loading state
 */
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);

/**
 * Hook to get only access token
 */
export const useAccessToken = () => useAuthStore((state) => state.accessToken);

// ──────────────────────────────────────────────────────────────────────────────
// Exports
// ──────────────────────────────────────────────────────────────────────────────

export default useAuthStore;
