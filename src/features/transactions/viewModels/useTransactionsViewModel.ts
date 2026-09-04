import { useState, useEffect, useCallback } from 'react';
import type { Refund, Transaction, TransactionDateRange, TransactionFilters } from '../models/transactionTypes';
import { fetchTransactions, fetchRefunds } from '../models/transactionsApi';

export const useTransactionsViewModel = () => {
  const [range, setRange] = useState<TransactionDateRange>('today');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const filters: TransactionFilters = { range, startDate, endDate };

  const load = useCallback(async () => {
    try {
      const data = await fetchTransactions(filters);
      setTransactions(data);
      const refundData = await fetchRefunds(startDate, endDate);
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

  return {
    range,
    setRange,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    transactions,
    refunds,
    isLoading,
    error,
    refresh: load,
  };
};
