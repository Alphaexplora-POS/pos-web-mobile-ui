import type { Branch } from './branchTypes';
import { USE_MOCK_IDENTITY } from '../../mock/config';
import * as mock from '../../mock/mockApi';
import { apiRequest } from './apiClient';

export interface RawBranch {
  id: string;
  name: string;
  address: string | null;
  contactNumber: string | null;
  isActive: boolean;
}

export const toBranch = (raw: RawBranch): Branch => ({
  id: raw.id,
  name: raw.name,
  address: raw.address ?? '',
  contact: raw.contactNumber ?? '',
  isActive: raw.isActive,
});

export const fetchBranches = async (): Promise<Branch[]> => {
  if (USE_MOCK_IDENTITY) return mock.fetchBranches();
  const data = await apiRequest<{ branches: RawBranch[] }>('/identity/branches');
  return (data.branches ?? []).map(toBranch);
};