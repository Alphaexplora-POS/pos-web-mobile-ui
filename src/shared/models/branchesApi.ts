import type { Branch } from './branchTypes';
import { USE_MOCK } from '../../mock/config';
import * as mock from '../../mock/mockApi';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

export const fetchBranches = async (): Promise<Branch[]> => {
  if (USE_MOCK) return mock.fetchBranches();
  const res = await fetch(`${API_BASE}/branches`);
  if (!res.ok) throw new Error('Failed to fetch branches');
  return res.json();
};
