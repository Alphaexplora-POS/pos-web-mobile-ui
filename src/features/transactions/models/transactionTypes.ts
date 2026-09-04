export type TransactionDateRange = 'today' | 'week' | 'month' | 'custom';

export interface TransactionItem {
  productId: string;
  productName: string;
  variantSku: string;
  quantity: number;
  unitPrice: number;
  discount: number;
}

export interface Transaction {
  id: string;
  branchId: string;
  branchName: string;
  items: TransactionItem[];
  subtotal: number;
  discountTotal: number;
  paymentMethod: string;
  total: number;
  timestamp: string;
}

export interface Refund {
  id: string;
  transactionId: string;
  amount: number;
  reasonCode: string;
  refundedAt: string;
}

export interface TransactionFilters {
  range: TransactionDateRange;
  startDate?: string;
  endDate?: string;
}
