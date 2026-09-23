export type TransactionDateRange = 'today' | 'week' | 'month' | 'custom';

export interface TransactionItem {
  id?: string;
  productVariantId?: string;
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
  clientId?: string;
  sessionId?: string;
  employeeId?: string;
  employeeName?: string;
  items: TransactionItem[];
  subtotal: number;
  discountTotal: number;
  paymentMethod: string;
  total: number;
  timestamp: string;
}

export type RefundStatus = 'pending_approval' | 'approved' | 'denied' | 'completed';

export interface Refund {
  id: string;
  transactionId: string;
  amount: number;
  reasonCode: string;
  refundedAt: string;
  status: RefundStatus;
}

export interface CreateRefundInput {
  transactionId: string;
  amount: number;
  reasonId: string;
  originalClientId?: string;
  branchId?: string;
  sessionId?: string;
  employeeId?: string;
  employeeName?: string;
  initiatedBy?: string;
  initiatedByName?: string;
  subtotal?: number;
  discountTotal?: number;
  reasonLabel?: string;
  refundType?: string;
  refundItems?: RefundItemInput[];
}

export interface RefundItemInput {
  transactionItemId: string;
  productVariantId?: string;
  productName: string;
  variantLabel: string;
  unitPrice: number;
  quantityReturned: number;
  refundAmount: number;
  restock?: boolean;
}

export interface PosItemLine {
  productId: string;
  productName: string;
  variantId: string;
  variantSku: string;
  variantLabel: string;
  unitPrice: number;
  quantity: number;
}

export interface CreateSaleInput {
  clientId?: string;
  branchId: string;
  sessionId: string | null;
  employeeId: string;
  employeeName: string;
  customerName?: string;
  items: PosItemLine[];
  paymentMethodId: string;
  paymentMethodName: string;
  totalDiscount: number;
}

export interface PosSession {
  id: string;
  branchId: string;
  branchName: string;
  employeeId: string;
  employeeName: string;
  openedAt: string;
  closedAt?: string;
  status: 'open' | 'closed';
}

export interface SessionSummary {
  transactionCount: number;
  grossSales: number;
}

export interface TransactionFilters {
  range: TransactionDateRange;
  startDate?: string;
  endDate?: string;
}
