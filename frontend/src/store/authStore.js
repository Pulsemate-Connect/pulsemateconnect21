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
        // If we already have a token, skip the API call and just set loading to false
        const { accessToken } = get();
        if (accessToken) {
          console.log('[AuthStore] Token exists, setting isLoading to false');
          set((state) => ({ ...state, isLoading: false }));
          return;
        }

        console.log('[AuthStore] No token, checking /auth/me');
        set((state) => ({ ...state, isLoading: true }));
        try {
          const response = await getMe();
          const { user } = response.data.data;
          set({
            user: normalizeUser(user),
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (_) {
          console.log('[AuthStore] No persisted session found');
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
