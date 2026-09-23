import type { CreateRefundInput, CreateSaleInput, PosSession, Refund, RefundStatus, SessionSummary, Transaction, TransactionFilters } from './transactionTypes';
import { apiRequest } from '../../../shared/models/apiClient';

interface RawTransactionItem {
  id: string;
  productVariantId: string;
  productName: string;
  variantLabel: string;
  unitPrice: string | number;
  quantity: number;
}

interface RawPayment {
  paymentMethodId: string;
  paymentMethodName: string;
  amount: string | number;
}

interface RawTransaction {
  id: string;
  branchId: string;
  clientId: string;
  sessionId: string;
  employeeId: string;
  employeeName: string;
  subtotal: string | number;
  totalDiscount: string | number;
  totalAmount: string | number;
  status: string;
  createdAt: string;
  items: RawTransactionItem[];
  payments: RawPayment[];
}

interface RawRefund {
  id: string;
  transactionId: string;
  refundAmount: string | number;
  reasonLabel: string | null;
  createdAt: string;
  status: string;
}

interface RawSession {
  id: string;
  branchId: string;
  employeeId: string;
  openedAt: string;
  closedAt: string | null;
  status: string;
  branch?: { id: string; name: string } | null;
  employee?: { id: string; firstName: string; lastName: string } | null;
}

const num = (v: string | number): number => (typeof v === 'number' ? v : Number(v));

const toTransactionItem = (raw: RawTransactionItem): Transaction['items'][number] => ({
  id: raw.id,
  productVariantId: raw.productVariantId,
  productId: raw.productVariantId,
  productName: raw.productName,
  variantSku: raw.variantLabel,
  quantity: raw.quantity,
  unitPrice: num(raw.unitPrice),
  discount: 0,
});

const toTransaction = (raw: RawTransaction): Transaction => ({
  id: raw.id,
  branchId: raw.branchId,
  branchName: '',
  clientId: raw.clientId,
  sessionId: raw.sessionId,
  employeeId: raw.employeeId,
  employeeName: raw.employeeName,
  items: (raw.items ?? []).map(toTransactionItem),
  subtotal: num(raw.subtotal),
  discountTotal: num(raw.totalDiscount),
  paymentMethod: raw.payments?.[0]?.paymentMethodName ?? '',
  total: num(raw.totalAmount),
  timestamp: raw.createdAt,
});

const toRefund = (raw: RawRefund): Refund => ({
  id: raw.id,
  transactionId: raw.transactionId,
  amount: num(raw.refundAmount),
  reasonCode: raw.reasonLabel ?? '',
  refundedAt: raw.createdAt,
  status: raw.status as RefundStatus,
});

const toSession = (raw: RawSession): PosSession => ({
  id: raw.id,
  branchId: raw.branchId,
  branchName: raw.branch?.name ?? '',
  employeeId: raw.employeeId,
  employeeName: raw.employee ? `${raw.employee.firstName} ${raw.employee.lastName}`.trim() : '',
  openedAt: raw.openedAt,
  closedAt: raw.closedAt ?? undefined,
  status: raw.status === 'closed' ? 'closed' : 'open',
});

const localDayStart = (d: Date): string => {
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return start.toISOString();
};

const localDayEnd = (d: Date): string => {
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  return end.toISOString();
};

const buildDateRange = (filters: TransactionFilters): { dateFrom?: string; dateTo?: string } => {
  const now = new Date();
  if (filters.range === 'today') return { dateFrom: localDayStart(now), dateTo: localDayEnd(now) };
  if (filters.range === 'week') {
    const from = new Date(now);
    from.setDate(now.getDate() - 6);
    return { dateFrom: localDayStart(from), dateTo: localDayEnd(now) };
  }
  if (filters.range === 'month') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    return { dateFrom: localDayStart(from), dateTo: localDayEnd(now) };
  }
  const from = filters.startDate ? localDayStart(new Date(`${filters.startDate}T00:00:00`)) : undefined;
  const to = filters.endDate ? localDayEnd(new Date(`${filters.endDate}T00:00:00`)) : undefined;
  return { dateFrom: from, dateTo: to };
};

export const fetchTransactions = async (filters: TransactionFilters): Promise<Transaction[]> => {
  const { dateFrom, dateTo } = buildDateRange(filters);
  const params = new URLSearchParams();
  if (dateFrom) params.set('date_from', dateFrom);
  if (dateTo) params.set('date_to', dateTo);
  params.set('limit', '200');
  const data = await apiRequest<{ transactions: RawTransaction[] }>(`/transaction/sales?${params.toString()}`);
  return (data.transactions ?? []).map(toTransaction);
};

export const fetchTransactionById = async (id: string): Promise<Transaction> => {
  const data = await apiRequest<RawTransaction>(`/transaction/sales/${id}`);
  return toTransaction(data);
};

export const fetchRefunds = async (filters: TransactionFilters): Promise<Refund[]> => {
  const { dateFrom, dateTo } = buildDateRange(filters);
  const params = new URLSearchParams();
  if (dateFrom) params.set('date_from', dateFrom);
  if (dateTo) params.set('date_to', dateTo);
  params.set('limit', '200');
  const data = await apiRequest<{ refunds: RawRefund[] }>(`/refund/refunds?${params.toString()}`);
  return (data.refunds ?? []).map(toRefund);
};

export const createRefund = async (input: CreateRefundInput): Promise<Refund> => {
  const data = await apiRequest<{ id: string; status: string }>('/refund/refunds', {
    method: 'POST',
    body: JSON.stringify({
      transactionId: input.transactionId,
      originalClientId: input.originalClientId ?? input.transactionId,
      branchId: input.branchId ?? '',
      sessionId: input.sessionId ?? '',
      employeeId: input.employeeId ?? '',
      employeeName: input.employeeName ?? '',
      initiatedBy: input.initiatedBy ?? '',
      initiatedByName: input.initiatedByName ?? '',
      subtotal: input.subtotal ?? 0,
      totalDiscount: input.discountTotal ?? 0,
      totalRefundAmount: input.amount,
      refundType: input.refundType ?? 'full',
      reasonId: input.reasonId || undefined,
      reasonLabel: input.reasonLabel || undefined,
      items: input.refundItems ?? [],
    }),
  });
  return {
    id: data.id,
    transactionId: input.transactionId,
    amount: input.amount,
    reasonCode: input.reasonLabel ?? '',
    refundedAt: new Date().toISOString(),
    status: data.status as RefundStatus,
  };
};

export const approveRefund = async (id: string, approvedBy: string, approvedByName: string): Promise<void> => {
  await apiRequest<unknown>(`/refund/refunds/${id}/approve`, {
    method: 'PATCH',
    body: JSON.stringify({ approvedBy, approvedByName }),
  });
};

export const denyRefund = async (id: string, approvedBy: string, approvedByName: string): Promise<void> => {
  await apiRequest<unknown>(`/refund/refunds/${id}/deny`, {
    method: 'PATCH',
    body: JSON.stringify({ approvedBy, approvedByName }),
  });
};

export const completeRefund = async (id: string, paymentMethodId: string, paymentMethodName: string, amount: number): Promise<void> => {
  await apiRequest<unknown>(`/refund/refunds/${id}/complete`, {
    method: 'PATCH',
    body: JSON.stringify({ paymentMethodId, paymentMethodName, amount }),
  });
};

export const createSale = async (input: CreateSaleInput): Promise<Transaction> => {
  if (!input.sessionId) throw new Error('Open a shift before recording a sale');
  const subtotal = Math.round(input.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0) * 100) / 100;
  const totalAmount = Math.round((subtotal - input.totalDiscount) * 100) / 100;
  const data = await apiRequest<RawTransaction>('/transaction/sales', {
    method: 'POST',
    body: JSON.stringify({
      clientId: input.clientId ?? crypto.randomUUID(),
      branchId: input.branchId,
      sessionId: input.sessionId,
      employeeId: input.employeeId,
      employeeName: input.employeeName,
      customerName: input.customerName,
      subtotal,
      totalDiscount: input.totalDiscount,
      totalAmount,
      status: 'completed',
      items: input.items.map((i) => ({
        productVariantId: i.variantId,
        productName: i.productName,
        variantLabel: i.variantLabel,
        unitPrice: i.unitPrice,
        quantity: i.quantity,
        lineTotal: Math.round(i.unitPrice * i.quantity * 100) / 100,
      })),
      payments: [{ paymentMethodId: input.paymentMethodId, paymentMethodName: input.paymentMethodName, amount: totalAmount }],
    }),
  });
  return toTransaction(data);
};

export const openSession = async (branchId: string, employeeId: string): Promise<PosSession> => {
  const data = await apiRequest<RawSession>('/identity/sessions', {
    method: 'POST',
    body: JSON.stringify({ branchId, employeeId }),
  });
  return toSession(data);
};

export const closeSession = async (id: string): Promise<PosSession> => {
  const data = await apiRequest<RawSession>(`/identity/sessions/${id}/close`, { method: 'PATCH' });
  return toSession(data);
};

export const fetchSessions = async (): Promise<PosSession[]> => {
  const data = await apiRequest<RawSession[]>('/identity/sessions/active');
  return (Array.isArray(data) ? data : []).map(toSession);
};

export const fetchSessionSummary = async (id: string): Promise<SessionSummary> => {
  return apiRequest<SessionSummary>(`/identity/sessions/${id}/summary`);
};