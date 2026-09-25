import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthSession, LoginInput, RegisterInput } from '../models/authTypes';
import { fetchMe, loginWithEmail, logout as logoutRequest, registerTenantOwner } from '../models/authApi';
import { markSignedIn, clearSignedIn, hasBeenSignedIn, notifySessionExpired } from '../sessionExpiry';

interface AuthContextValue {
  session: AuthSession | null;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<AuthSession>;
  register: (input: RegisterInput) => Promise<AuthSession>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const sessionRef = useRef<AuthSession | null>(null);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    const onPageHide = () => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      if (nav?.type === 'reload') return;
      if (!sessionRef.current || !hasBeenSignedIn()) return;
      try {
        navigator.sendBeacon(`${API_BASE}/identity/auth/logout`);
      } catch {
        /* best-effort revoke on tab close */
      }
    };
    window.addEventListener('pagehide', onPageHide);
    return () => window.removeEventListener('pagehide', onPageHide);
  }, []);

  useEffect(() => {
    fetchMe()
      .then((stored) => setSession(stored))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!session) return;
    const check = async () => {
      const me = await fetchMe();
      if (!me) {
        notifySessionExpired();
      }
    };
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, [session]);

  const handleLogin = async (input: LoginInput): Promise<AuthSession> => {
    const next = await loginWithEmail(input);
    setSession(next);
    markSignedIn();
    return next;
  };

  const handleRegister = async (input: RegisterInput): Promise<AuthSession> => {
    const next = await registerTenantOwner(input);
    setSession(next);
    markSignedIn();
    return next;
  };

  const handleLogout = async (): Promise<void> => {
    try {
      await logoutRequest();
    } catch {
      /* ignore backend errors on logout */
    }
    clearSignedIn();
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{ session, isLoading, login: handleLogin, register: handleRegister, logout: handleLogout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
