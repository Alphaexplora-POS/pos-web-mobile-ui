export type { Branch } from '../../../shared/models/branchTypes';

export type EmployeeRole = 'branch_manager' | 'supervisor' | 'cashier' | 'staff';

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: EmployeeRole;
  branchId: string;
  pin: string;
  isActive: boolean;
}

export interface CreateBranchInput {
  name: string;
  address: string;
  contact: string;
}

export interface CreateEmployeeInput {
  name: string;
  role: EmployeeRole;
  branchId: string;
  email?: string;
  password?: string;
  pin: string;
}
