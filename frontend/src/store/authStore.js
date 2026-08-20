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
        const { accessToken, isAuthenticated } = get();
        
        // If we have a token and are authenticated, just set loading to false
        if (accessToken && isAuthenticated) {
          console.log('[AuthStore] Already authenticated, setting isLoading to false');
          set({ isLoading: false });
          return;
        }

        // If no token, don't make API call - just set loading to false
        // This prevents unnecessary 401 errors on initial page load
        if (!accessToken) {
          console.log('[AuthStore] No token in storage, skipping auth check');
          set({ isLoading: false });
          return;
        }

        // Only reach here if we have a token but not authenticated flag
        // (shouldn't happen normally due to persist middleware)
        console.log('[AuthStore] Have token but not authenticated, checking /auth/me');
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
          set({
            user: normalizeUser(user),
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          console.log('[AuthStore] Session check failed:', error.response?.status || error.message);
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
      }),
      onRehydrateStorage: () => (state) => {
        // After rehydration, set isLoading to false if we have auth data
        if (state?.accessToken && state?.isAuthenticated) {
          console.log('[AuthStore] Rehydrated with auth data, setting isLoading to false');
          state.isLoading = false;
        } else {
          console.log('[AuthStore] No auth data after rehydration');
        }
      },
    }
  )
);

export default useAuthStore;
