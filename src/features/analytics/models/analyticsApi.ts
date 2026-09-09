import type { AnalyticsData } from './analyticsTypes';
import { USE_MOCK } from '../../../mock/config';
import * as mock from '../../../mock/mockApi';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

export const fetchCompanyAnalytics = async (): Promise<AnalyticsData> => {
  if (USE_MOCK) return mock.fetchCompanyAnalytics();
  const res = await fetch(`${API_BASE}/analytics/company`);
  if (!res.ok) throw new Error('Failed to fetch company analytics');
  return res.json();
};

export const fetchBranchAnalytics = async (): Promise<AnalyticsData> => {
  if (USE_MOCK) return mock.fetchBranchAnalytics();
  const res = await fetch(`${API_BASE}/analytics/branch`);
  if (!res.ok) throw new Error('Failed to fetch branch analytics');
  return res.json();
};
