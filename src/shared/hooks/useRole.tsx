import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

type Role = 'owner' | 'branch_manager';

interface RoleContextValue {
  role: Role;
  isOwner: boolean;
  setRole: (role: Role) => void;
}

const RoleContext = createContext<RoleContextValue | null>(null);

export const RoleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<Role>('owner');

  return (
    <RoleContext.Provider value={{ role, isOwner: role === 'owner', setRole }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = (): RoleContextValue => {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used within RoleProvider');
  return ctx;
};
