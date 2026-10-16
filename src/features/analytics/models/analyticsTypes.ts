export interface SalesMetrics {
  salesToday: number;
  salesMonthly: number;
  transactionCountToday: number;
  transactionCountMonthly: number;
}

export interface TopProduct {
  productName: string;
  sales: number;
}

export interface BranchComparison {
  branchId: string;
  branchName: string;
  salesToday: number;
  salesMonthly: number;
  transactionCountToday?: number;
  transactionCountMonthly?: number;
  topProducts: TopProduct[];
}

export interface AnalyticsData {
  metrics: SalesMetrics;
  topProducts: TopProduct[];
  branchComparison?: BranchComparison[];
  branchName?: string;
}
