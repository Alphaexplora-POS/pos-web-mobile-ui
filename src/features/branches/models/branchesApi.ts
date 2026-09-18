export { fetchBranches } from '../../../shared/models/branchesApi';

import type { CreateBranchInput, CreateEmployeeInput, Employee, EmployeeRole } from './branchTypes';
import type { Branch } from '../../../shared/models/branchTypes';
import { toBranch, type RawBranch } from '../../../shared/models/branchesApi';
import { apiRequest } from '../../../shared/models/apiClient';

interface RawEmployee {
  id: string;
  branchId: string;
  firstName: string;
  lastName: string;
  role: string;
  pin: string;
  isActive: boolean;
}

const toBackendRole = (role: EmployeeRole): string => (role === 'branch_manager' ? 'manager' : role);

const toRole = (role: string): EmployeeRole => (role === 'manager' ? 'branch_manager' : (role as EmployeeRole));

const toEmployee = (raw: RawEmployee): Employee => ({
  id: raw.id,
  name: `${raw.firstName} ${raw.lastName}`.trim(),
  email: '',
  role: toRole(raw.role),
  branchId: raw.branchId,
  pin: raw.pin,
  isActive: raw.isActive,
});

const splitName = (name: string): { firstName: string; lastName: string } => {
  const parts = name.trim().split(/\s+/);
  return { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') || parts[0] || '' };
};

export const createBranch = async (input: CreateBranchInput): Promise<Branch> => {
  const data = await apiRequest<RawBranch>('/identity/branches', {
    method: 'POST',
    body: JSON.stringify({ name: input.name, address: input.address, contactNumber: input.contact }),
  });
  return toBranch(data);
};

export const updateBranch = async (id: string, input: Partial<CreateBranchInput>): Promise<Branch> => {
  const data = await apiRequest<RawBranch>(`/identity/branches/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ name: input.name, address: input.address, contactNumber: input.contact }),
  });
  return toBranch(data);
};

export const deactivateBranch = async (id: string): Promise<void> => {
  await apiRequest<unknown>(`/identity/branches/${id}/deactivate`, { method: 'POST' });
};

export const fetchEmployees = async (): Promise<Employee[]> => {
  const data = await apiRequest<{ employees: RawEmployee[] }>('/identity/employees');
  return (data.employees ?? []).map(toEmployee);
};

export const createEmployee = async (input: CreateEmployeeInput): Promise<Employee> => {
  const { firstName, lastName } = splitName(input.name);
  const role = toBackendRole(input.role);
  const data = await apiRequest<RawEmployee>('/identity/employees', {
    method: 'POST',
    body: JSON.stringify({
      branchId: input.branchId,
      firstName,
      lastName,
      role,
      pin: input.pin,
      ...(role === 'manager' ? { email: input.email, password: input.password } : {}),
    }),
  });
  return toEmployee(data);
};

export const deactivateEmployee = async (id: string): Promise<void> => {
  await apiRequest<unknown>(`/identity/employees/${id}/deactivate`, { method: 'POST' });
};