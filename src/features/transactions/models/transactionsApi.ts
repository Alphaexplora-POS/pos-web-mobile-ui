import type { Refund, Transaction, TransactionFilters } from './transactionTypes';
import { USE_MOCK_TRANSACTIONS } from '../../../mock/config';
import * as mock from '../../../mock/mockApi';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

export const fetchTransactions = async (filters: TransactionFilters): Promise<Transaction[]> => {
  if (USE_MOCK_TRANSACTIONS) return mock.fetchTransactions(filters);
  const params = new URLSearchParams({ range: filters.range });
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);
  const res = await fetch(`${API_BASE}/transactions?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch transactions');
  return res.json();
};

export const fetchTransactionById = async (id: string): Promise<Transaction> => {
  if (USE_MOCK_TRANSACTIONS) return mock.fetchTransactionById(id);
  const res = await fetch(`${API_BASE}/transactions/${id}`);
  if (!res.ok) throw new Error('Failed to fetch transaction');
  return res.json();
};

export const fetchRefunds = async (startDate?: string, endDate?: string): Promise<Refund[]> => {
  if (USE_MOCK_TRANSACTIONS) return mock.fetchRefunds(startDate, endDate);
  const params = new URLSearchParams();
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);
  const qs = params.toString();
  const res = await fetch(`${API_BASE}/refunds${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error('Failed to fetch refunds');
  return res.json();
};
