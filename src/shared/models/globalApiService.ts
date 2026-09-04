import type { User } from './userTypes';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

export const fetchCurrentUser = async (): Promise<User> => {
  const res = await fetch(`${API_BASE}/auth/me`);
  if (!res.ok) throw new Error('Failed to fetch current user');
  return res.json();
};

export const logout = async (): Promise<void> => {
  await fetch(`${API_BASE}/auth/logout`, { method: 'POST' });
};
