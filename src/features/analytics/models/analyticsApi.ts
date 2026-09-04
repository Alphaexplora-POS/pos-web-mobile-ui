import type { AnalyticsData } from './analyticsTypes';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

export const fetchCompanyAnalytics = async (): Promise<AnalyticsData> => {
  const res = await fetch(`${API_BASE}/analytics/company`);
  if (!res.ok) throw new Error('Failed to fetch company analytics');
  return res.json();
};

export const fetchBranchAnalytics = async (): Promise<AnalyticsData> => {
  const res = await fetch(`${API_BASE}/analytics/branch`);
  if (!res.ok) throw new Error('Failed to fetch branch analytics');
  return res.json();
};
