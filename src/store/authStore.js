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
  const PERF_AUTH = { start: Date.now(), log: (label) => console.log(`[PERF_AUTH] ${Date.now() - PERF_AUTH.start}ms - ${label}`) };
  PERF_AUTH.log('AuthProvider initializing');
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

    // ✅ SOFT LOGOUT WITH GRACE PERIOD (Cost-Saving Feature)
    // Strategy: Keep refresh token for 30 days, only delete access token
    // - User appears logged out (shows login screen)
    // - But refresh token stays in SecureStore
    // - On next "login": Check if refresh token exists → Silent re-login (NO OTP)
    // - Saves ₹0.12 OTP cost per accidental logout
    // - After 30 days: Token expires naturally, OTP required
    
    const clearStorage = async () => {
      // Only delete access token (causes user to appear logged out)
      // KEEP refresh token for grace period re-login
      await SecureStore.deleteItemAsync('accessToken');
      
      // ❌ DON'T delete refresh token (allow grace period re-login)
      // await SecureStore.deleteItemAsync('refreshToken');  // COMMENTED OUT
      
      console.log('[AuthProvider] ✅ Soft logout: Access token deleted, refresh token kept for grace period');

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

    console.log('[AuthProvider] signOut complete (grace period active)');
  }, []);

  // Register signOut with axios so 401 errors auto-logout
  useEffect(() => {
    console.log('[AuthProvider] Registering global signOut');
    setGlobalSignOut(signOut);
  }, [signOut]);

  useEffect(() => {
    PERF_AUTH.log('Auth restore effect triggered');
    console.log('[AuthProvider] Starting auth restore');
    const restore = async () => {
      try {
        PERF_AUTH.log('Reading accessToken from SecureStore');
        console.log('[AuthProvider] Reading accessToken from SecureStore');
        const t = await SecureStore.getItemAsync('accessToken').catch((e) => {
          console.error('[AuthProvider] SecureStore read error:', e);
          return null;
        });
        PERF_AUTH.log('SecureStore read complete');
        
        if (t) {
          PERF_AUTH.log('Token found, setting token');
          console.log('[AuthProvider] Token found, setting token');
          setToken(t);
          
          // ✅ OPTIMIZATION: Add 3-second timeout to prevent infinite loading
          // If backend is slow/cold-starting, we'll fail fast and show auth screen
          const getMeWithTimeout = Promise.race([
            getMe(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('getMe timeout after 3s')), 3000)
            )
          ]);
          
          try {
            PERF_AUTH.log('Calling getMe API with 3s timeout');
            console.log('[AuthProvider] Calling getMe API');
            const res = await getMeWithTimeout;
            PERF_AUTH.log('getMe API response received');
            if (res?.data?.data?.user) {
              PERF_AUTH.log('User data received, setting user');
              console.log('[AuthProvider] User data received');
              setUser(res.data.data.user);
            } else {
              PERF_AUTH.log('Invalid getMe response');
              console.log('[AuthProvider] Invalid getMe response');
            }
          } catch (err) {
            PERF_AUTH.log(`getMe failed: ${err.message}`);
            console.error('[AuthProvider] getMe failed:', err.message);
            // If timeout or network error, clear tokens and show login
            await SecureStore.deleteItemAsync('accessToken').catch(() => {});
            await SecureStore.deleteItemAsync('refreshToken').catch(() => {});
            setToken(null);
          }
        } else {
          PERF_AUTH.log('No token found');
          console.log('[AuthProvider] No token found');
        }
      } catch (err) {
        PERF_AUTH.log(`Restore error: ${err.message}`);
        console.error('[AuthProvider] Restore error:', err.message);
        try {
          await SecureStore.deleteItemAsync('accessToken');
          await SecureStore.deleteItemAsync('refreshToken');
        } catch (e) { console.error('[AuthProvider] Cleanup error:', e); }
      } finally {
        PERF_AUTH.log('Setting loading to false');
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
