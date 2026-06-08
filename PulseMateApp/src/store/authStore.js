import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { getMe } from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Ref to push notification cleanup fn — set by usePushNotifications
  const onSignOutRef = useRef(null);

  useEffect(() => {
    const restore = async () => {
      try {
        const t = await SecureStore.getItemAsync('accessToken');
        if (t) {
          setToken(t);
          const res = await getMe();
          setUser(res.data.data.user);
        }
      } catch {
        await SecureStore.deleteItemAsync('accessToken');
      } finally {
        setLoading(false);
      }
    };
    restore();
  }, []);

  const signIn = async (accessToken, userData) => {
    await SecureStore.setItemAsync('accessToken', accessToken);
    setToken(accessToken);
    setUser(userData);
  };

  const signOut = useCallback(async () => {
    // Remove FCM token before clearing session
    if (onSignOutRef.current) {
      try { await onSignOutRef.current(); } catch { /* best-effort */ }
    }
    await SecureStore.deleteItemAsync('accessToken');
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = (updates) => setUser((u) => ({ ...u, ...updates }));

  // Called by usePushNotifications to register its cleanup
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
