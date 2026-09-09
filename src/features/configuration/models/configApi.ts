import type { PaymentMethod, ReasonCode, ReasonCodeType } from './configTypes';
import { USE_MOCK } from '../../../mock/config';
import * as mock from '../../../mock/mockApi';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

export const fetchPaymentMethods = async (): Promise<PaymentMethod[]> => {
  if (USE_MOCK) return mock.fetchPaymentMethods();
  const res = await fetch(`${API_BASE}/payment-methods`);
  if (!res.ok) throw new Error('Failed to fetch payment methods');
  return res.json();
};

export const createPaymentMethod = async (name: string): Promise<PaymentMethod> => {
  if (USE_MOCK) return mock.createPaymentMethod(name);
  const res = await fetch(`${API_BASE}/payment-methods`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Failed to create payment method');
  return res.json();
};

export const setPaymentMethodActive = async (id: string, isActive: boolean): Promise<void> => {
  if (USE_MOCK) return mock.setPaymentMethodActive(id, isActive);
  await fetch(`${API_BASE}/payment-methods/${id}/active`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isActive }),
  });
};

export const updatePaymentMethod = async (id: string, name: string): Promise<PaymentMethod> => {
  if (USE_MOCK) return mock.updatePaymentMethod(id, name);
  const res = await fetch(`${API_BASE}/payment-methods/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Failed to update payment method');
  return res.json();
};

export const fetchReasonCodes = async (): Promise<ReasonCode[]> => {
  if (USE_MOCK) return mock.fetchReasonCodes();
  const res = await fetch(`${API_BASE}/reason-codes`);
  if (!res.ok) throw new Error('Failed to fetch reason codes');
  return res.json();
};

export const createReasonCode = async (name: string, type: ReasonCodeType): Promise<ReasonCode> => {
  if (USE_MOCK) return mock.createReasonCode(name, type);
  const res = await fetch(`${API_BASE}/reason-codes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, type }),
  });
  if (!res.ok) throw new Error('Failed to create reason code');
  return res.json();
};

export const setReasonCodeActive = async (id: string, isActive: boolean): Promise<void> => {
  if (USE_MOCK) return mock.setReasonCodeActive(id, isActive);
  await fetch(`${API_BASE}/reason-codes/${id}/active`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isActive }),
  });
};

export const updateReasonCode = async (id: string, name: string, type: ReasonCodeType): Promise<ReasonCode> => {
  if (USE_MOCK) return mock.updateReasonCode(id, name, type);
  const res = await fetch(`${API_BASE}/reason-codes/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, type }),
  });
  if (!res.ok) throw new Error('Failed to update reason code');
  return res.json();
};
