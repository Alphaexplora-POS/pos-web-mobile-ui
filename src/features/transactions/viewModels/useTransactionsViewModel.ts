import { useState, useEffect, useCallback } from 'react';
import type { Refund, Transaction, TransactionDateRange, TransactionFilters } from '../models/transactionTypes';
import {
  fetchTransactions,
  fetchRefunds,
  createRefund,
  approveRefund,
  denyRefund,
  completeRefund,
} from '../models/transactionsApi';
import type { ReasonCode, PaymentMethod } from '../../configuration/models/configTypes';
import { fetchReasonCodes, fetchPaymentMethods } from '../../configuration/models/configApi';
import { fetchBranches } from '../../../shared/models/branchesApi';
import { useAuth } from '../../auth/hooks/useAuth';
import { notifySuccess, notifyError } from '../../../shared/utils/notify';

export const useTransactionsViewModel = () => {
  const { session } = useAuth();
  const [range, setRange] = useState<TransactionDateRange>('today');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [reasonCodes, setReasonCodes] = useState<ReasonCode[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const filters: TransactionFilters = { range, startDate, endDate };

  const load = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const [txData, branchData, refundData] = await Promise.all([
        fetchTransactions(filters),
        fetchBranches(),
        fetchRefunds(filters),
      ]);
      const branchMap = new Map(branchData.map((b) => [b.id, b.name]));
      setTransactions(txData.map((t) => ({ ...t, branchName: t.branchName || branchMap.get(t.branchId) || '' })));
      setRefunds(refundData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [range, startDate, endDate]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetchReasonCodes().then(setReasonCodes).catch(() => setReasonCodes([]));
    fetchPaymentMethods().then(setPaymentMethods).catch(() => setPaymentMethods([]));
  }, []);

  const applyCustomDateRange = (start: Date | null, end: Date | null): string | null => {
    if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return 'Select a valid start date and end date.';
    }
    const toDateString = (date: Date): string =>
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const from = toDateString(start);
    const to = toDateString(end);
    if (from > to) return 'End date must be on or after start date.';
    setStartDate(from);
    setEndDate(to);
    setRange('custom');
    return null;
  };

  const run = async (action: () => Promise<unknown>, successMessage: string) => {
    try {
      setError(null);
      await action();
      notifySuccess(successMessage);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  };

  const submitRefund = (input: { transactionId: string; amount: number; reasonId: string }, txOverride?: Transaction) => {
    const tx = txOverride ?? transactions.find((t) => t.id === input.transactionId);
    if (!tx) {
      const error = new Error('Transaction not found');
      notifyError(error);
      throw error;
    }
    const reason = reasonCodes.find((r) => r.id === input.reasonId);
    return run(
      () =>
        createRefund({
          ...input,
          originalClientId: tx.clientId ?? tx.id,
          branchId: tx.branchId,
          sessionId: tx.sessionId ?? '',
          employeeId: tx.employeeId ?? '',
          employeeName: tx.employeeName ?? '',
          initiatedBy: session?.userId ?? '',
          initiatedByName: session ? `${session.firstName} ${session.lastName}`.trim() : '',
          subtotal: tx.subtotal,
          discountTotal: tx.discountTotal,
          reasonLabel: reason?.name,
          refundType: 'full',
          refundItems: tx.items.map((item) => ({
            transactionItemId: item.id ?? '',
            productVariantId: item.productVariantId ?? item.productId ?? '',
            productName: item.productName,
            variantLabel: item.variantSku,
            unitPrice: item.unitPrice,
            quantityReturned: item.quantity,
            refundAmount: Math.round(item.unitPrice * item.quantity * 100) / 100,
            restock: true,
          })),
        }),
      'Refund submitted for approval'
    );
  };

  const handleApproveRefund = (id: string, approvedByName: string) =>
    run(() => approveRefund(id, session?.userId ?? '', approvedByName), 'Refund approved');

  const handleDenyRefund = (id: string, approvedByName: string) =>
    run(() => denyRefund(id, session?.userId ?? '', approvedByName), 'Refund denied');

  const handleCompleteRefund = (id: string, paymentMethodId: string, paymentMethodName: string, amount: number) =>
    run(() => completeRefund(id, paymentMethodId, paymentMethodName, amount), 'Refund completed');

  return {
    range,
    setRange,
    startDate,
    endDate,
    applyCustomDateRange,
    transactions,
    refunds,
    reasonCodes,
    paymentMethods,
    isLoading,
    error,
    refresh: load,
    createRefund: submitRefund,
    approveRefund: handleApproveRefund,
    denyRefund: handleDenyRefund,
    completeRefund: handleCompleteRefund,
  };
};
