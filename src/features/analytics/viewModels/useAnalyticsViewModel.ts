import { useState, useEffect } from 'react';
import type { AnalyticsData } from '../models/analyticsTypes';
import { fetchCompanyAnalytics, fetchBranchAnalytics } from '../models/analyticsApi';

export const useAnalyticsViewModel = (isOwner: boolean) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const result = isOwner
          ? await fetchCompanyAnalytics()
          : await fetchBranchAnalytics();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [isOwner]);

  return { data, isLoading, error };
};
