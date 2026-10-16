import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../../features/auth/hooks/useAuth';
import type { Role } from '../models/userTypes';

interface RoleContextValue {
  role: Role;
  isOwner: boolean;
  isSuperAdmin: boolean;
}

const RoleContext = createContext<RoleContextValue | null>(null);

export const RoleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { session } = useAuth();
  const role: Role = session ? session.role : 'owner';

  return (
    <RoleContext.Provider
      value={{ role, isOwner: role === 'owner', isSuperAdmin: role === 'superadmin' }}
    >
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = (): RoleContextValue => {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used within RoleProvider');
  return ctx;
};