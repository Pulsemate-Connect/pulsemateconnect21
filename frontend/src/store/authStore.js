import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getMe, logout as logoutApi } from '../api/auth.api';

const normalizeUser = (user) =>
  user
    ? {
      ...user,
      mobile: user.phone ?? user.mobile ?? '',
      approvalStatus: user.approvalStatus ?? user.status ?? '',
      // Keep status as an alias so ProtectedRoute checks work regardless of which field is used
      status: user.approvalStatus ?? user.status ?? '',
    }
    : null;

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,
      _hasHydrated: false, // Track if store has completed hydration

      setAuth: (user, accessToken) => {
        console.log('[AuthStore] setAuth called:', { user: user?.id, role: user?.role, accessToken: accessToken?.substring(0, 20) + '...' });
        
        // Validate token matches user role (prevent role mismatches)
        try {
          const [, payloadB64] = accessToken.split('.');
          const payload = JSON.parse(atob(payloadB64));
          
          if (payload.role !== user.role) {
            console.error('[AuthStore] Token/user role mismatch!', {
              tokenRole: payload.role,
              userRole: user.role,
              userId: user.id
            });
            console.warn('[AuthStore] ⚠️  You may have an old cached token. Clear browser storage and log in again.');
            // Don't set auth if roles don't match - user needs fresh token
            return;
          }
          
          // Check if token is expired
          if (payload.exp && payload.exp * 1000 < Date.now()) {
            console.error('[AuthStore] Cannot set expired token');
            return;
          }
        } catch (e) {
          console.error('[AuthStore] Failed to validate token:', e);
          // Continue anyway - validation is best-effort
        }
        
        set({
          user: normalizeUser(user),
          accessToken,
          isAuthenticated: true,
          isLoading: false,
        });
      },
      
      // Alias for setAuth - used by clinic auth modal
      login: (payload) => {
        const { user, token } = payload;
        console.log('[AuthStore] login called (alias for setAuth):', { user: user?.id, role: user?.role });
        set({
          user: normalizeUser(user),
          accessToken: token,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      clearAuth: () => {
        console.log('[AuthStore] clearAuth called');
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      updateUser: (patch) =>
        set((state) => ({
          user: state.user ? normalizeUser({ ...state.user, ...patch }) : state.user,
        })),

      logout: async () => {
        console.log('[AuthStore] logout called');
        try {
          await logoutApi();
        } catch (_) {
          // noop
        }

        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      checkAuth: async () => {
        const { accessToken, isAuthenticated, _hasHydrated } = get();
        
        console.log('[AuthStore] checkAuth called:', { 
          hasToken: !!accessToken, 
          isAuthenticated, 
          hasHydrated: _hasHydrated 
        });

        // Wait for hydration to complete before checking auth
        if (!_hasHydrated) {
          console.log('[AuthStore] Waiting for hydration to complete');
          // Wait a bit and try again
          await new Promise(resolve => setTimeout(resolve, 50));
          return get().checkAuth();
        }

        // If we have a token and are authenticated, just set loading to false
        if (accessToken && isAuthenticated) {
          console.log('[AuthStore] Already authenticated, setting isLoading to false');
          set({ isLoading: false });
          return;
        }

        // If no token, don't make API call - just set loading to false
        // This prevents unnecessary 401 errors on initial page load
        if (!accessToken) {
          console.log('[AuthStore] No token in storage, setting isLoading to false');
          set({ 
            isLoading: false,
            isAuthenticated: false,
            user: null 
          });
          return;
        }

        // Only reach here if we have a token but not authenticated flag
        // (shouldn't happen normally due to persist middleware, but handle it)
        console.log('[AuthStore] Have token but not authenticated flag, validating with backend');
        set({ isLoading: true });
        
        // Add 5-second safety timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth check timeout')), 5000)
        );
        
        try {
          const response = await Promise.race([
            getMe(),
            timeoutPromise
          ]);
          const { user } = response.data.data;
          console.log('[AuthStore] Backend validation successful');
          set({
            user: normalizeUser(user),
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          console.error('[AuthStore] Session validation failed:', error.response?.status || error.message);
          // Clear invalid session
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },
    }),
    {
      name: 'pulsemate-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
        // DO NOT persist isLoading or _hasHydrated
      }),
      onRehydrateStorage: () => (state, error) => {
        console.log('[AuthStore] onRehydrateStorage callback called');
        
        if (error) {
          console.error('[AuthStore] Rehydration error:', error);
          return;
        }

        // Mark hydration as complete and set loading to false
        // This is critical for second login to work
        if (state) {
          console.log('[AuthStore] Hydration complete:', { 
            hasUser: !!state.user, 
            hasToken: !!state.accessToken,
            isAuthenticated: state.isAuthenticated 
          });
          
          // Validate rehydrated token
          if (state.accessToken && state.user) {
            try {
              const [, payloadB64] = state.accessToken.split('.');
              const payload = JSON.parse(atob(payloadB64));
              
              // Check if token is expired
              if (payload.exp && payload.exp * 1000 < Date.now()) {
                console.warn('[AuthStore] Rehydrated token is expired, clearing auth');
                state.user = null;
                state.accessToken = null;
                state.isAuthenticated = false;
                return;
              }
              
              // Check if token role matches user role
              if (payload.role !== state.user.role) {
                console.error('[AuthStore] Rehydrated token/user role mismatch!', {
                  tokenRole: payload.role,
                  userRole: state.user.role,
                  userId: state.user.id,
                  tokenUserId: payload.sub
                });
                console.warn('[AuthStore] Clearing invalid auth state');
                state.user = null;
                state.accessToken = null;
                state.isAuthenticated = false;
                return;
              }
              
              console.log('[AuthStore] Rehydrated token validated successfully');
            } catch (e) {
              console.error('[AuthStore] Failed to validate rehydrated token:', e);
              // Clear potentially corrupt data
              state.user = null;
              state.accessToken = null;
              state.isAuthenticated = false;
              return;
            }
          }
          
          // Set both flags to prevent race conditions
          state._hasHydrated = true;
          state.isLoading = false;
        }
      },
    }
  )
);

export default useAuthStore;
