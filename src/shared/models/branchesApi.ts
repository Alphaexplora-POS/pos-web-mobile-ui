import type { Branch } from './branchTypes';
import { apiRequest } from './apiClient';
import { invalidateResource } from './resourceInvalidation';

export const CACHE_KEY_BRANCHES = 'GET /identity/branches';
export const BRANCHES_CACHE_PREFIX = 'GET /identity/branches';

export const invalidateBranchesCache = (): void => invalidateResource('branches');

const CACHE_OPTIONS = { cache: true as const, cacheTtlMs: 5 * 60_000 };

export interface RawBranch {
  id: string;
  tenantId?: string;
  name: string;
  address: string | null;
  contactNumber: string | null;
  isActive: boolean;
}

export const toBranch = (raw: RawBranch): Branch => ({
  id: raw.id,
  tenantId: raw.tenantId,
  name: raw.name,
  address: raw.address ?? '',
  contact: raw.contactNumber ?? '',
  isActive: raw.isActive,
});

export const fetchBranches = async (): Promise<Branch[]> => {
  const data = await apiRequest<{ branches: RawBranch[] }>('/identity/branches', CACHE_OPTIONS);
  return (data.branches ?? []).map(toBranch);
};