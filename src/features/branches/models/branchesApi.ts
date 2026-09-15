export { fetchBranches } from '../../../shared/models/branchesApi';

import type { CreateBranchInput, CreateEmployeeInput, Employee, EmployeeRole } from './branchTypes';
import type { Branch } from '../../../shared/models/branchTypes';
import { toBranch, type RawBranch } from '../../../shared/models/branchesApi';
import { USE_MOCK } from '../../../mock/config';
import * as mock from '../../../mock/mockApi';
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
  if (USE_MOCK) return mock.createBranch(input);
  const data = await apiRequest<RawBranch>('/identity/branches', {
    method: 'POST',
    body: JSON.stringify({ name: input.name, address: input.address, contactNumber: input.contact }),
  });
  return toBranch(data);
};

export const updateBranch = async (id: string, input: Partial<CreateBranchInput>): Promise<Branch> => {
  if (USE_MOCK) return mock.updateBranch(id, input);
  const data = await apiRequest<RawBranch>(`/identity/branches/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ name: input.name, address: input.address, contactNumber: input.contact }),
  });
  return toBranch(data);
};

export const deactivateBranch = async (id: string): Promise<void> => {
  if (USE_MOCK) return mock.deactivateBranch(id);
  await apiRequest<unknown>(`/identity/branches/${id}/deactivate`, { method: 'POST' });
};

export const fetchEmployees = async (): Promise<Employee[]> => {
  if (USE_MOCK) return mock.fetchEmployees();
  const data = await apiRequest<{ employees: RawEmployee[] }>('/identity/employees');
  return (data.employees ?? []).map(toEmployee);
};

export const createEmployee = async (input: CreateEmployeeInput): Promise<Employee> => {
  if (USE_MOCK) return mock.createEmployee(input);
  const { firstName, lastName } = splitName(input.name);
  const data = await apiRequest<RawEmployee>('/identity/employees', {
    method: 'POST',
    body: JSON.stringify({
      branchId: input.branchId,
      firstName,
      lastName,
      role: toBackendRole(input.role),
      pin: input.pin,
    }),
  });
  return toEmployee(data);
};

export const deactivateEmployee = async (id: string): Promise<void> => {
  if (USE_MOCK) return mock.deactivateEmployee(id);
  await apiRequest<unknown>(`/identity/employees/${id}/deactivate`, { method: 'POST' });
};