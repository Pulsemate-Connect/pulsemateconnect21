import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMe } from '../api/auth';
import { setGlobalSignOut } from '../api/axios';

const AuthContext = createContext(null);

// ── Shared flag so axios interceptor knows we are in the middle of signing out
// Prevents re-entrant 401 → signOut loops
let _isSigningOut = false;
export const getIsSigningOut = () => _isSigningOut;

export const AuthProvider = ({ children }) => {
  console.log('[AuthProvider] Initializing');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const onSignOutRef = useRef(null);

  const signOut = useCallback(async () => {
    // Prevent double-execution
    if (_isSigningOut) {
      console.log('[AuthProvider] signOut already in progress, skipping');
      return;
    }
    _isSigningOut = true;
    console.log('[AuthProvider] signOut called');

    // Run any registered callback (e.g. deregister push token)
    if (onSignOutRef.current) {
      try { await onSignOutRef.current(); } catch (e) {
        console.warn('[AuthProvider] signOut callback error (non-fatal):', e?.message);
      }
      onSignOutRef.current = null;
    }

    // Clear ALL storage — SecureStore tokens + any AsyncStorage cache
    const clearStorage = async () => {
      const secureKeys = ['accessToken', 'refreshToken'];
      await Promise.allSettled(secureKeys.map(k => SecureStore.deleteItemAsync(k)));

      // Clear AsyncStorage cache (React Query, socket token, misc)
      try {
        const allKeys = await AsyncStorage.getAllKeys();
        if (allKeys?.length) await AsyncStorage.multiRemove(allKeys);
      } catch (e) {
        console.warn('[AuthProvider] AsyncStorage clear error (non-fatal):', e?.message);
      }
    };

    try { await clearStorage(); } catch {}

    // Clear React state — this triggers RootNavigator to switch to AuthNavigator
    setToken(null);
    setUser(null);

    // Reset flag after a short delay so any in-flight requests can drain
    setTimeout(() => { _isSigningOut = false; }, 1000);

    console.log('[AuthProvider] signOut complete');
  }, []);

  // Register signOut with axios so 401 errors auto-logout
  useEffect(() => {
    console.log('[AuthProvider] Registering global signOut');
    setGlobalSignOut(signOut);
  }, [signOut]);

  useEffect(() => {
    console.log('[AuthProvider] Starting auth restore');
    const restore = async () => {
      try {
        console.log('[AuthProvider] Reading accessToken from SecureStore');
        const t = await SecureStore.getItemAsync('accessToken').catch((e) => {
          console.error('[AuthProvider] SecureStore read error:', e);
          return null;
        });
        
        if (t) {
          console.log('[AuthProvider] Token found, setting token');
          setToken(t);
          try {
            console.log('[AuthProvider] Calling getMe API');
            const res = await getMe();
            if (res?.data?.data?.user) {
              console.log('[AuthProvider] User data received');
              setUser(res.data.data.user);
            } else {
              console.log('[AuthProvider] Invalid getMe response');
            }
          } catch (err) {
            console.error('[AuthProvider] getMe failed:', err.message);
            await SecureStore.deleteItemAsync('accessToken').catch(() => {});
            await SecureStore.deleteItemAsync('refreshToken').catch(() => {});
          }
        } else {
          console.log('[AuthProvider] No token found');
        }
      } catch (err) {
        console.error('[AuthProvider] Restore error:', err.message);
        try {
          await SecureStore.deleteItemAsync('accessToken');
          await SecureStore.deleteItemAsync('refreshToken');
        } catch (e) { console.error('[AuthProvider] Cleanup error:', e); }
      } finally {
        console.log('[AuthProvider] Setting loading to false');
        setLoading(false);
      }
    };
    restore();
  }, []);

  const signIn = async (accessToken, userData, refreshToken) => {
    _isSigningOut = false; // reset flag on new sign-in
    await SecureStore.setItemAsync('accessToken', accessToken);
    if (refreshToken) {
      await SecureStore.setItemAsync('refreshToken', refreshToken);
    }
    setToken(accessToken);
    setUser(userData);
  };

  const updateUser = (updates) => setUser((u) => u ? { ...u, ...updates } : u);

  const registerSignOutCallback = useCallback((fn) => {
    onSignOutRef.current = fn;
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, signIn, signOut, updateUser, registerSignOutCallback }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
