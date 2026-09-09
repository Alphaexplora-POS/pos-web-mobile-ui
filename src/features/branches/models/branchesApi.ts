export { fetchBranches } from '../../../shared/models/branchesApi';

import type { CreateBranchInput, CreateEmployeeInput, Employee } from './branchTypes';
import type { Branch } from '../../../shared/models/branchTypes';
import { USE_MOCK } from '../../../mock/config';
import * as mock from '../../../mock/mockApi';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

export const createBranch = async (input: CreateBranchInput): Promise<Branch> => {
  if (USE_MOCK) return mock.createBranch(input);
  const res = await fetch(`${API_BASE}/branches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error('Failed to create branch');
  return res.json();
};

export const updateBranch = async (id: string, input: Partial<CreateBranchInput>): Promise<Branch> => {
  if (USE_MOCK) return mock.updateBranch(id, input);
  const res = await fetch(`${API_BASE}/branches/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error('Failed to update branch');
  return res.json();
};

export const deactivateBranch = async (id: string): Promise<void> => {
  if (USE_MOCK) return mock.deactivateBranch(id);
  const res = await fetch(`${API_BASE}/branches/${id}/deactivate`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to deactivate branch');
};

export const fetchEmployees = async (): Promise<Employee[]> => {
  if (USE_MOCK) return mock.fetchEmployees();
  const res = await fetch(`${API_BASE}/employees`);
  if (!res.ok) throw new Error('Failed to fetch employees');
  return res.json();
};

export const createEmployee = async (input: CreateEmployeeInput): Promise<Employee> => {
  if (USE_MOCK) return mock.createEmployee(input);
  const res = await fetch(`${API_BASE}/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error('Failed to create employee');
  return res.json();
};

export const deactivateEmployee = async (id: string): Promise<void> => {
  if (USE_MOCK) return mock.deactivateEmployee(id);
  const res = await fetch(`${API_BASE}/employees/${id}/deactivate`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to deactivate employee');
};
