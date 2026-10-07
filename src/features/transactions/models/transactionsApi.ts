import type { CreateRefundInput, CreateSaleInput, PosSession, Refund, RefundStatus, SessionSummary, Transaction, TransactionFilters } from './transactionTypes';
import { apiRequest, invalidateCache } from '../../../shared/models/apiClient';
import { SERVER_PAGE_SIZE, toServerPage, type ServerPage } from '../../../shared/hooks/useServerPagination';

const CACHE_OPTIONS = { cache: true as const, cacheTtlMs: 60_000 };

export const invalidateTransactionsCache = (): void => {
  invalidateCache('GET /transaction/sales');
  invalidateCache('GET /refund/refunds');
  invalidateCache('GET /identity/sessions');
};

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
  branchName?: string | null;
  clientId: string;
  sessionId: string;
  employeeId: string;
  employeeName: string;
  orNumber?: string | null;
  invoiceNumber?: string | null;
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
  branchName: raw.branchName ?? '',
  clientId: raw.clientId,
  sessionId: raw.sessionId,
  employeeId: raw.employeeId,
  employeeName: raw.employeeName,
  orNumber: raw.orNumber ?? undefined,
  invoiceNumber: raw.invoiceNumber ?? undefined,
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

const BUSINESS_HOURS_AHEAD = 8; // Asia/Manila (UTC+8, no DST) - matches BusinessZone on the POS app

/** Wall-clock "now" in the business zone, carried on a fake UTC date. */
const businessNow = (): Date => new Date(Date.now() + BUSINESS_HOURS_AHEAD * 3_600_000);

/** Business-day start/end as true UTC instants, independent of the browser's timezone. */
const businessDayBounds = (d: Date): { start: Date; end: Date } => {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const day = d.getUTCDate();
  const shift = -BUSINESS_HOURS_AHEAD * 3_600_000;
  return {
    start: new Date(Date.UTC(y, m, day) + shift),
    end: new Date(Date.UTC(y, m, day, 23, 59, 59, 999) + shift),
  };
};

const dayBoundsFromString = (date: string): { start: Date; end: Date } => {
  const [y, m, d] = date.split('-').map(Number);
  return businessDayBounds(new Date(Date.UTC(y, m - 1, d)));
};

const buildDateRange = (filters: TransactionFilters): { dateFrom?: string; dateTo?: string } => {
  const now = businessNow();
  if (filters.range === 'today') {
    const b = businessDayBounds(now);
    return { dateFrom: b.start.toISOString(), dateTo: b.end.toISOString() };
  }
  if (filters.range === 'week') {
    const week = new Date(now);
    week.setUTCDate(week.getUTCDate() - 6);
    const from = businessDayBounds(week);
    const to = businessDayBounds(now);
    return { dateFrom: from.start.toISOString(), dateTo: to.end.toISOString() };
  }
  if (filters.range === 'month') {
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const from = businessDayBounds(monthStart);
    const to = businessDayBounds(now);
    return { dateFrom: from.start.toISOString(), dateTo: to.end.toISOString() };
  }
  const from = filters.startDate ? dayBoundsFromString(filters.startDate).start.toISOString() : undefined;
  const to = filters.endDate ? dayBoundsFromString(filters.endDate).end.toISOString() : undefined;
  return { dateFrom: from, dateTo: to };
};

export const fetchTransactions = async (filters: TransactionFilters): Promise<Transaction[]> => {
  const { dateFrom, dateTo } = buildDateRange(filters);
  const params = new URLSearchParams();
  if (dateFrom) params.set('date_from', dateFrom);
  if (dateTo) params.set('date_to', dateTo);
  params.set('limit', '100');
  const data = await apiRequest<{ transactions: RawTransaction[] }>(
    `/transaction/sales?${params.toString()}`,
    CACHE_OPTIONS,
  );
  return (data.transactions ?? []).map(toTransaction);
};

export const fetchTransactionsPage = async (
  page: number,
  filters: TransactionFilters,
): Promise<ServerPage<Transaction>> => {
  const { dateFrom, dateTo } = buildDateRange(filters);
  const params = new URLSearchParams();
  if (dateFrom) params.set('date_from', dateFrom);
  if (dateTo) params.set('date_to', dateTo);
  params.set('page', String(page));
  params.set('limit', String(SERVER_PAGE_SIZE));
  params.set('sortDirection', 'desc');
  const data = await apiRequest<{ transactions: RawTransaction[] }>(
    `/transaction/sales?${params.toString()}`,
  );
  const transactions = (data.transactions ?? []).map(toTransaction);
  return toServerPage<Transaction>({ ...data, transactions }, 'transactions');
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
  params.set('limit', '100');
  const data = await apiRequest<{ refunds: RawRefund[] }>(`/refund/refunds?${params.toString()}`, CACHE_OPTIONS);
  return (data.refunds ?? []).map(toRefund);
};

export const fetchRefundsPage = async (
  page: number,
  filters: TransactionFilters,
): Promise<ServerPage<Refund>> => {
  const { dateFrom, dateTo } = buildDateRange(filters);
  const params = new URLSearchParams();
  if (dateFrom) params.set('date_from', dateFrom);
  if (dateTo) params.set('date_to', dateTo);
  params.set('page', String(page));
  params.set('limit', String(SERVER_PAGE_SIZE));
  params.set('sortDirection', 'desc');
  const data = await apiRequest<{ refunds: RawRefund[] }>(`/refund/refunds?${params.toString()}`);
  const refunds = (data.refunds ?? []).map(toRefund);
  return toServerPage<Refund>({ ...data, refunds }, 'refunds');
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
  invalidateTransactionsCache();
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
  invalidateTransactionsCache();
};

export const denyRefund = async (id: string, approvedBy: string, approvedByName: string): Promise<void> => {
  await apiRequest<unknown>(`/refund/refunds/${id}/deny`, {
    method: 'PATCH',
    body: JSON.stringify({ approvedBy, approvedByName }),
  });
  invalidateTransactionsCache();
};

export const completeRefund = async (id: string, paymentMethodId: string, paymentMethodName: string, amount: number): Promise<void> => {
  await apiRequest<unknown>(`/refund/refunds/${id}/complete`, {
    method: 'PATCH',
    body: JSON.stringify({ paymentMethodId, paymentMethodName, amount }),
  });
  invalidateTransactionsCache();
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
  invalidateTransactionsCache();
  return toTransaction(data);
};

export const openSession = async (branchId: string, employeeId: string): Promise<PosSession> => {
  const data = await apiRequest<RawSession>('/identity/sessions', {
    method: 'POST',
    body: JSON.stringify({ branchId, employeeId }),
  });
  invalidateCache('GET /identity/sessions');
  return toSession(data);
};

export const closeSession = async (id: string): Promise<PosSession> => {
  const data = await apiRequest<RawSession>(`/identity/sessions/${id}/close`, { method: 'PATCH' });
  invalidateCache('GET /identity/sessions');
  return toSession(data);
};

export const fetchSessions = async (): Promise<PosSession[]> => {
  const data = await apiRequest<RawSession[]>('/identity/sessions/active', CACHE_OPTIONS);
  return (Array.isArray(data) ? data : []).map(toSession);
};

export const fetchSessionSummary = async (id: string): Promise<SessionSummary> => {
  return apiRequest<SessionSummary>(`/identity/sessions/${id}/summary`, CACHE_OPTIONS);
};