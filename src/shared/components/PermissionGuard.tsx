import { useRole } from '../hooks/useRole';
import type { ReactNode } from 'react';

interface PermissionGuardProps {
  allowOwner?: boolean;
  allowBranchManager?: boolean;
  children: ReactNode;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({
  allowOwner = true,
  allowBranchManager = true,
  children,
}) => {
  const { role } = useRole();

  if (role === 'owner' && allowOwner) return <>{children}</>;
  if (role === 'branch_manager' && allowBranchManager) return <>{children}</>;
  return null;
};

export default PermissionGuard;
