/**
 * Authentication Store — PulseMate Connect Web
 *
 * Zustand store for managing authentication state across the application.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * PRODUCTION SESSION-BASED AUTHENTICATION
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * SECURITY CHANGE: Access tokens are NO LONGER stored in localStorage
 * 
 * Old architecture (INSECURE):
 * - accessToken stored in localStorage
 * - Vulnerable to XSS attacks
 * - Client-side token management
 * 
 * New architecture (SECURE):
 * - Session managed via HttpOnly cookies (backend sends automatically)
 * - JavaScript CANNOT access the session cookie
 * - No authentication credentials in localStorage
 * - Session restored via /auth/me API call on app start
 * 
 * What IS stored in localStorage:
 * - User profile data (safe, non-sensitive)
 * - UI preferences
 * 
 * What is NOT stored:
 * - accessToken (security risk)
 * - sessionToken (managed by browser cookies)
 * - Any authentication credentials
 * 
 * Session restoration flow:
 * 1. App starts with isLoading=true
 * 2. Call GET /auth/me (cookie sent automatically)
 * 3. If valid session: Restore user state
 * 4. If invalid: Redirect to login
 * 5. Set isLoading=false
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
      // ✅ REMOVED: accessToken (no longer stored - security improvement)
      isAuthenticated: false,
      isLoading: true, // ✅ NEW: Start with loading state for session restoration
      isInitialized: false, // ✅ NEW: Track if session restoration attempted
      authSource: null, // ✅ NEW: Track authentication source (SESSION_COOKIE or JWT_BEARER)
      sessionId: null, // ✅ NEW: Track session ID for logout operations

      // ── Actions ──────────────────────────────────────────────────────────

      /**
       * Set authentication data after successful login
       * 
       * ✅ SECURITY: No longer stores accessToken in localStorage
       * The session cookie is automatically managed by the browser
       * 
       * @param {Object} user - User object
       * @param {Object} [authMeta] - Optional auth metadata (sessionId, authSource)
       */
      setAuth: (user, authMeta = {}) => {
        console.log('[AuthStore] Setting authentication:', {
          userId: user?.id,
          role: user?.role,
          authSource: authMeta.authSource,
        });

        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          isInitialized: true,
          authSource: authMeta.authSource || 'UNKNOWN',
          sessionId: authMeta.sessionId || null,
        });
      },

      /**
       * Clear authentication state (logout)
       * 
       * ✅ SECURITY: Clears user data but NOT the cookie
       * The cookie is cleared by the backend /auth/logout endpoint
       */
      clearAuth: () => {
        console.log('[AuthStore] Clearing authentication');
        
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isInitialized: true,
          authSource: null,
          sessionId: null,
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
       * Set loading state
       * Used during session restoration or authentication operations
       *
       * @param {boolean} loading - Loading state
       */
      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      /**
       * Set initialized state
       * Marks that session restoration has been attempted
       * 
       * @param {boolean} initialized - Initialized state
       */
      setInitialized: (initialized) => {
        set({ isInitialized: initialized });
      },

      /**
       * Restore session from backend (called on app start)
       * 
       * ✅ PRODUCTION SESSION RESTORATION
       * This is the KEY function that enables persistent login
       * 
       * Flow:
       * 1. Set loading state
       * 2. Call /auth/me (cookie sent automatically)
       * 3. If successful: User is authenticated
       * 4. If failed: User is not authenticated
       * 5. Mark as initialized
       * 
       * This function should be called by the app wrapper/router
       * 
       * @param {Function} apiCall - Function that calls /auth/me
       * @returns {Promise<boolean>} True if session restored, false otherwise
       */
      restoreSession: async (apiCall) => {
        console.log('[AuthStore] Attempting session restoration...');
        
        set({ isLoading: true });
        
        try {
          const response = await apiCall();
          
          if (response?.data?.user) {
            console.log('[AuthStore] Session restored successfully', {
              userId: response.data.user.id,
              authSource: response.data.auth?.authSource,
            });
            
            set({
              user: response.data.user,
              isAuthenticated: true,
              isLoading: false,
              isInitialized: true,
              authSource: response.data.auth?.authSource || 'SESSION_COOKIE',
              sessionId: response.data.auth?.sessionId || null,
            });
            
            return true;
          }
          
          // No user returned - not authenticated
          console.log('[AuthStore] No session found - user not authenticated');
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialized: true,
          });
          
          return false;
        } catch (error) {
          // Session restoration failed - user not authenticated
          console.log('[AuthStore] Session restoration failed:', error.message);
          
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialized: true,
          });
          
          return false;
        }
      },

      /**
       * Legacy logout function (for backward compatibility)
       * @deprecated Use clearAuth() instead
       */
      logout: () => {
        get().clearAuth();
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
      
      // ✅ SECURITY: Only persist NON-SENSITIVE data
      // DO NOT persist tokens or credentials
      partialize: (state) => ({
        user: state.user, // Safe user profile data
        // ✅ REMOVED: accessToken (security improvement)
        // ✅ DO NOT persist: sessionId, authSource (transient data)
      }),

      // Rehydration callback
      onRehydrateStorage: () => (state) => {
        if (state?.user) {
          console.log('[AuthStore] Rehydrated user profile from localStorage');
          // ✅ IMPORTANT: Even though we have user data, we must verify session
          // The actual session restoration happens via restoreSession()
          state.isAuthenticated = false; // Assume not authenticated until verified
          state.isLoading = true; // Start in loading state
          state.isInitialized = false; // Not yet initialized
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
 * Hook to get initialization status
 */
export const useAuthInitialized = () => useAuthStore((state) => state.isInitialized);

// ──────────────────────────────────────────────────────────────────────────────
// Exports
// ──────────────────────────────────────────────────────────────────────────────

export default useAuthStore;
