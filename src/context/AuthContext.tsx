import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import {
  AUTH_LOGOUT_EVENT,
  clearStoredAuth,
  getStoredToken,
  getStoredUser,
  setStoredAuth,
  type AuthUser,
} from '../lib/auth';

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthResponse = {
  token: string;
  user: AuthUser;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      const token = getStoredToken();
      const storedUser = getStoredUser();

      if (!token || !storedUser) {
        clearStoredAuth();
        if (active) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const response = await api.get<AuthUser>('/auth/me');

        if (response.data.role !== 'admin') {
          clearStoredAuth();
          if (active) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        setStoredAuth(token, response.data);
        if (active) {
          setUser(response.data);
        }
      } catch {
        clearStoredAuth();
        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    function handleLogoutEvent() {
      if (active) {
        setUser(null);
      }
    }

    window.addEventListener(AUTH_LOGOUT_EVENT, handleLogoutEvent);
    void bootstrap();

    return () => {
      active = false;
      window.removeEventListener(AUTH_LOGOUT_EVENT, handleLogoutEvent);
    };
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post<AuthResponse>('/auth/login', { email, password });

    if (response.data.user.role !== 'admin') {
      throw new Error('Esta cuenta no tiene acceso al panel');
    }

    setStoredAuth(response.data.token, response.data.user);
    setUser(response.data.user);
  };

  const logout = () => {
    clearStoredAuth();
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
    }),
    [loading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }

  return context;
}
