export type AuthRole = 'superadmin' | 'owner' | 'manager';

export type SessionRole = 'superadmin' | 'owner' | 'branch_manager';

export interface Tenant {
  id: string;
  name: string;
  businessType: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  id: string;
  tenantId: string | null;
  branchId: string | null;
  email: string;
  firstName: string;
  lastName: string;
  role: AuthRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  userId: string;
  tenantId: string | null;
  tenantName: string;
  branchId: string | null;
  email: string;
  firstName: string;
  lastName: string;
  role: SessionRole;
  accessToken: string;
}

export interface RegisterInput {
  businessName: string;
  businessType: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}
