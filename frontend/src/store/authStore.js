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
          
          // Set both flags to prevent race conditions
          state._hasHydrated = true;
          state.isLoading = false;
        }
      },
    }
  )
);

export default useAuthStore;
