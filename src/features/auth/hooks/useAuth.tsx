import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthSession, LoginInput, RegisterInput } from '../models/authTypes';
import { fetchMe, loginWithEmail, logout as logoutRequest, registerTenantOwner } from '../models/authApi';

interface AuthContextValue {
  session: AuthSession | null;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<AuthSession>;
  register: (input: RegisterInput) => Promise<AuthSession>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchMe()
      .then((stored) => setSession(stored))
      .finally(() => setIsLoading(false));
  }, []);

  const handleLogin = async (input: LoginInput): Promise<AuthSession> => {
    const next = await loginWithEmail(input);
    setSession(next);
    return next;
  };

  const handleRegister = async (input: RegisterInput): Promise<AuthSession> => {
    const next = await registerTenantOwner(input);
    setSession(next);
    return next;
  };

  const handleLogout = async (): Promise<void> => {
    await logoutRequest();
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
