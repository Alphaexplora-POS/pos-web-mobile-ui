import type { Branch } from './branchTypes';
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
  const data = await apiRequest<{ branches: RawBranch[] }>('/identity/branches');
  return (data.branches ?? []).map(toBranch);
};