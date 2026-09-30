import type { AnalyticsData, BranchComparison, SalesMetrics, TopProduct } from './analyticsTypes';
import { apiRequest } from '../../../shared/models/apiClient';

const num = (value: unknown): number => Number(value ?? 0) || 0;

const zeroMetrics = (): SalesMetrics => ({
  salesToday: 0,
  salesMonthly: 0,
  transactionCountToday: 0,
  transactionCountMonthly: 0,
});

interface OverviewBranchRow {
  branch_id?: string;
  branch_name?: string;
  tx_today?: unknown;
  gross_today?: unknown;
  disc_today?: unknown;
  net_today?: unknown;
  refund_today?: unknown;
  tx_range?: unknown;
  gross_range?: unknown;
  disc_range?: unknown;
  net_range?: unknown;
  refund_range?: unknown;
}

interface OverviewRankingItem {
  productName?: string;
  revenue?: unknown;
}

interface OverviewBranchRanking {
  branch_id?: string;
  products?: OverviewRankingItem[];
}

interface OverviewPayload {
  branches?: OverviewBranchRow[];
  branch_rankings?: OverviewBranchRanking[];
}

const ANALYTICS_CACHE_OPTIONS = { cache: true as const, cacheTtlMs: 60_000 };

const topFrom = (items: OverviewRankingItem[] | undefined, limit = 5): TopProduct[] => {
  const byName = new Map<string, number>();
  for (const item of items ?? []) {
    const name = item?.productName;
    if (!name) continue;
    byName.set(name, (byName.get(name) ?? 0) + num(item.revenue));
  }
  return [...byName.entries()]
    .map(([productName, sales]) => ({ productName, sales }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, limit);
};

const toBranch = (row: OverviewBranchRow, rankings: OverviewBranchRanking[]): BranchComparison => {
  const branchRanking = rankings.find((r) => r.branch_id === row.branch_id)?.products;
  return {
    branchId: row.branch_id ?? '',
    branchName: row.branch_name ?? 'Branch',
    salesToday: num(row.net_today),
    salesMonthly: num(row.net_range),
    transactionCountToday: num(row.tx_today),
    transactionCountMonthly: num(row.tx_range),
    topProducts: topFrom(branchRanking),
  };
};

export const fetchAnalyticsOverview = async (): Promise<AnalyticsData> => {
  const data = await apiRequest<OverviewPayload>('/analytics/overview', ANALYTICS_CACHE_OPTIONS);
  const branchRankings = data.branch_rankings ?? [];
  const branchComparison = (data.branches ?? []).map((row) => toBranch(row, branchRankings));

  const metrics = branchComparison.reduce<SalesMetrics>(
    (acc, b) => ({
      salesToday: acc.salesToday + b.salesToday,
      salesMonthly: acc.salesMonthly + b.salesMonthly,
      transactionCountToday: acc.transactionCountToday + (b.transactionCountToday ?? 0),
      transactionCountMonthly: acc.transactionCountMonthly + (b.transactionCountMonthly ?? 0),
    }),
    zeroMetrics(),
  );

  const allItems = branchRankings.flatMap((r) => r.products ?? []);

  return { metrics, topProducts: topFrom(allItems), branchComparison };
};

export const fetchCompanyAnalytics = async (): Promise<AnalyticsData> => {
  return fetchAnalyticsOverview();
};

export const fetchBranchAnalytics = async (branchId: string): Promise<AnalyticsData> => {
  const overview = await fetchAnalyticsOverview();
  const branch = (overview.branchComparison ?? []).find((b) => b.branchId === branchId);
  if (!branch) {
    return { metrics: zeroMetrics(), topProducts: [], branchComparison: [] };
  }
  return {
    branchName: branch.branchName,
    metrics: {
      salesToday: branch.salesToday,
      salesMonthly: branch.salesMonthly,
      transactionCountToday: branch.transactionCountToday ?? 0,
      transactionCountMonthly: branch.transactionCountMonthly ?? 0,
    },
    topProducts: branch.topProducts,
    branchComparison: overview.branchComparison,
  };
};