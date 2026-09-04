import type { Branch } from './branchTypes';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

export const fetchBranches = async (): Promise<Branch[]> => {
  const res = await fetch(`${API_BASE}/branches`);
  if (!res.ok) throw new Error('Failed to fetch branches');
  return res.json();
};
