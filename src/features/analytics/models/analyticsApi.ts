import type { AnalyticsData, BranchComparison, SalesMetrics, TopProduct } from './analyticsTypes';
import { apiRequest } from '../../../shared/models/apiClient';
import { fetchBranches } from '../../../shared/models/branchesApi';

const toISODate = (date: Date): string => date.toISOString().slice(0, 10);

const today = (): string => toISODate(new Date());

const monthStart = (): string => {
  const date = new Date();
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-01`;
};

const num = (value: unknown): number => Number(value ?? 0) || 0;

const pickNum = (row: SummaryRow | undefined, ...keys: (keyof SummaryRow)[]): number => {
  if (!row) return 0;
  for (const key of keys) {
    if (row[key] !== undefined) return num(row[key]);
  }
  return 0;
};

const zeroMetrics = (): SalesMetrics => ({
  salesToday: 0,
  salesMonthly: 0,
  transactionCountToday: 0,
  transactionCountMonthly: 0,
});

interface SummaryRow {
  totalTransactions?: unknown;
  grossSales?: unknown;
  totalDiscounts?: unknown;
  netSales?: unknown;
  totalRefunded?: unknown;
  total_transactions?: unknown;
  gross_sales?: unknown;
  total_discounts?: unknown;
  net_sales?: unknown;
  total_refunded?: unknown;
}

interface DailySummaryPayload {
  daily_summary?: SummaryRow;
  monthly_summary?: SummaryRow;
}

const toSummary = (row: SummaryRow | undefined) => ({
  totalTransactions: pickNum(row, 'totalTransactions', 'total_transactions'),
  grossSales: pickNum(row, 'grossSales', 'gross_sales'),
  totalDiscounts: pickNum(row, 'totalDiscounts', 'total_discounts'),
  netSales: pickNum(row, 'netSales', 'net_sales'),
  totalRefunded: pickNum(row, 'totalRefunded', 'total_refunded'),
});

const fetchDailySummary = async (branchId: string) => {
  const data = await apiRequest<DailySummaryPayload>(
    `/analytics/daily-summary?branch_id=${encodeURIComponent(branchId)}&sale_date=${today()}`,
  );
  return toSummary(data.daily_summary);
};

const fetchMonthlySummary = async (branchId: string) => {
  const data = await apiRequest<DailySummaryPayload>(
    `/analytics/daily-summary?branch_id=${encodeURIComponent(branchId)}&date_from=${monthStart()}&date_to=${today()}`,
  );
  return toSummary(data.monthly_summary);
};

interface RankingItem {
  productName?: string;
  revenue?: unknown;
}

interface RankingPayload {
  rankings?: RankingItem[];
  branch_rankings?: { branch_id: string; products: RankingItem[] }[];
}

const fetchBranchRanking = async (branchIds: string[]): Promise<TopProduct[]> => {
  if (!branchIds.length) return [];
  const params = new URLSearchParams({
    branch_ids: branchIds.join(','),
    period_type: 'monthly',
    period: monthStart(),
    limit: '10',
  });
  const data = await apiRequest<RankingPayload>(`/analytics/product-ranking?${params.toString()}`);
  const items = Array.isArray(data.rankings)
    ? data.rankings
    : (data.branch_rankings ?? []).flatMap((entry) => entry.products);

  const revenueByName = new Map<string, number>();
  for (const item of items) {
    const name = item?.productName;
    if (!name) continue;
    revenueByName.set(name, (revenueByName.get(name) ?? 0) + num(item.revenue));
  }

  return [...revenueByName.entries()]
    .map(([productName, sales]) => ({ productName, sales }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);
};

export const fetchBranchTopProducts = async (branchId: string): Promise<TopProduct[]> => {
  return fetchBranchRanking([branchId]);
};

export const fetchCompanyAnalytics = async (): Promise<AnalyticsData> => {
  const branches = (await fetchBranches()).filter((branch) => branch.isActive);
  if (!branches.length) {
    return { metrics: zeroMetrics(), topProducts: [], branchComparison: [] };
  }

  const summaries = await Promise.all(
    branches.map(async (branch) => {
      const [daily, monthly] = await Promise.all([fetchDailySummary(branch.id), fetchMonthlySummary(branch.id)]);
      return { branch, daily, monthly };
    }),
  );

  const metrics = summaries.reduce<SalesMetrics>(
    (acc, { daily, monthly }) => ({
      salesToday: acc.salesToday + daily.netSales,
      salesMonthly: acc.salesMonthly + monthly.netSales,
      transactionCountToday: acc.transactionCountToday + daily.totalTransactions,
      transactionCountMonthly: acc.transactionCountMonthly + monthly.totalTransactions,
    }),
    zeroMetrics(),
  );

  const branchComparison: BranchComparison[] = summaries.map(({ branch, daily, monthly }) => ({
    branchId: branch.id,
    branchName: branch.name,
    salesToday: daily.netSales,
    salesMonthly: monthly.netSales,
  }));

  const topProducts = await fetchBranchRanking(branches.map((branch) => branch.id));

  return { metrics, topProducts, branchComparison };
};

export const fetchBranchAnalytics = async (branchId: string): Promise<AnalyticsData> => {
  const [daily, monthly, branches] = await Promise.all([
    fetchDailySummary(branchId),
    fetchMonthlySummary(branchId),
    fetchBranches(),
  ]);

  const branchName = branches.find((branch) => branch.id === branchId)?.name;
  const topProducts = await fetchBranchRanking([branchId]);

  return {
    branchName,
    metrics: {
      salesToday: daily.netSales,
      salesMonthly: monthly.netSales,
      transactionCountToday: daily.totalTransactions,
      transactionCountMonthly: monthly.totalTransactions,
    },
    topProducts,
  };
};