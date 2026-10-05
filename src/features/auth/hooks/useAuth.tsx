import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthSession, LoginInput, RegisterInput } from '../models/authTypes';
import { fetchMe, loginWithEmail, logout as logoutRequest, registerTenantOwner } from '../models/authApi';
import { markSignedIn, clearSignedIn, notifySessionExpired } from '../sessionExpiry';
import { prefetchAppData } from '../../../shared/models/prefetch';

interface AuthContextValue {
  session: AuthSession | null;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<AuthSession>;
  register: (input: RegisterInput) => Promise<{ email: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const sessionRef = useRef<AuthSession | null>(null);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    fetchMe()
      .then((stored) => setSession(stored ?? null))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!session) return;
    if (session.role !== 'superadmin') prefetchAppData();
    const check = async () => {
      const me = await fetchMe();
      if (me === null) {
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

const handleRegister = async (input: RegisterInput): Promise<{ email: string }> =>
  registerTenantOwner(input);

  const handleLogout = async (): Promise<void> => {
    clearSignedIn();
    setSession(null);
    void logoutRequest().catch(() => {
      /* best-effort revoke, never block sign-out on the backend */
    });
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
