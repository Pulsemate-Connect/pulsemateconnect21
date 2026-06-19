import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { getMe } from '../api/auth';
import { setGlobalSignOut } from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const onSignOutRef = useRef(null);

  const signOut = useCallback(async () => {
    if (onSignOutRef.current) {
      try { await onSignOutRef.current(); } catch { }
    }
    await SecureStore.deleteItemAsync('accessToken');
    setToken(null);
    setUser(null);
  }, []);

  // Register signOut with axios so 401 errors auto-logout
  useEffect(() => {
    setGlobalSignOut(signOut);
  }, [signOut]);

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

  const updateUser = (updates) => setUser((u) => ({ ...u, ...updates }));

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
