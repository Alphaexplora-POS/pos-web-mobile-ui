import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthSession, LoginInput, RegisterInput } from '../models/authTypes';
import { fetchMe, loginWithEmail, logout as logoutRequest, registerTenantOwner } from '../models/authApi';
import { markSignedIn, clearSignedIn, notifySessionExpired } from '../sessionExpiry';
import { prefetchAppData, resetAppPrefetch } from '../../../shared/models/prefetch';
import { clearApiCache } from '../../../shared/models/apiClient';
import { queryClient } from '../../../shared/models/queryClient';

const clearSessionData = (): void => {
  clearApiCache();
  queryClient.clear();
  resetAppPrefetch();
};

interface AuthContextValue {
  session: AuthSession | null;
  isLoading: boolean;
  sessionError: string | null;
  retrySession: () => Promise<void>;
  login: (input: LoginInput) => Promise<AuthSession>;
  register: (input: RegisterInput) => Promise<{ email: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const sessionRef = useRef<AuthSession | null>(null);
  const restoreRequestRef = useRef(0);
  const pendingLogoutRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const restoreSession = useCallback(async (): Promise<void> => {
    const requestId = ++restoreRequestRef.current;
    setIsLoading(true);
    setSessionError(null);
    try {
      const stored = await fetchMe();
      if (requestId !== restoreRequestRef.current) return;
      if (stored === undefined) {
        setSessionError('Could not check your session. Check your connection and try again.');
        return;
      }
      sessionRef.current = stored;
      setSession(stored);
      if (stored) {
        markSignedIn();
      } else {
        clearSignedIn();
        clearSessionData();
      }
    } catch {
      if (requestId === restoreRequestRef.current) {
        setSessionError('Could not check your session. Check your connection and try again.');
      }
    } finally {
      if (requestId === restoreRequestRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void restoreSession();
    return () => { restoreRequestRef.current += 1; };
  }, [restoreSession]);

  useEffect(() => {
    if (!session) return;
    if (session.role !== 'superadmin') prefetchAppData();
    const check = async () => {
      const me = await fetchMe();
      if (sessionRef.current !== session) return;
      if (me === null) {
        notifySessionExpired();
      }
    };
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, [session]);

  const handleLogin = async (input: LoginInput): Promise<AuthSession> => {
    await pendingLogoutRef.current;
    const next = await loginWithEmail(input);
    restoreRequestRef.current += 1;
    clearSessionData();
    sessionRef.current = next;
    setSession(next);
    setSessionError(null);
    setIsLoading(false);
    markSignedIn();
    return next;
  };

const handleRegister = async (input: RegisterInput): Promise<{ email: string }> =>
  registerTenantOwner(input);

  const handleLogout = async (): Promise<void> => {
    restoreRequestRef.current += 1;
    clearSignedIn();
    clearSessionData();
    sessionRef.current = null;
    setSession(null);
    setSessionError(null);
    setIsLoading(false);
    const pending = pendingLogoutRef.current ?? logoutRequest().catch(() => {
      /* best-effort revoke, never block sign-out on the backend */
    });
    pendingLogoutRef.current = pending;
    await pending;
    if (pendingLogoutRef.current === pending) pendingLogoutRef.current = null;
  };

  return (
    <AuthContext.Provider
      value={{ session, isLoading, sessionError, retrySession: restoreSession, login: handleLogin, register: handleRegister, logout: handleLogout }}
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
