import { useQuery } from '@tanstack/react-query';
import type { AnalyticsData } from '../models/analyticsTypes';
import { fetchCompanyAnalytics, fetchBranchAnalytics } from '../models/analyticsApi';

export const useAnalyticsViewModel = (isOwner: boolean, branchId: string | null = null) => {
  const query = useQuery<AnalyticsData>({
    queryKey: ['analytics', isOwner, branchId ?? ''],
    queryFn: () => (isOwner ? fetchCompanyAnalytics() : fetchBranchAnalytics(branchId ?? '')),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchInterval: 90_000,
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.isError ? (query.error instanceof Error ? query.error.message : 'Failed to load analytics') : null,
  };
};