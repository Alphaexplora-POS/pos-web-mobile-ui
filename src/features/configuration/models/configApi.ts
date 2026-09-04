import type { PaymentMethod, ReasonCode, ReasonCodeType } from './configTypes';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

export const fetchPaymentMethods = async (): Promise<PaymentMethod[]> => {
  const res = await fetch(`${API_BASE}/payment-methods`);
  if (!res.ok) throw new Error('Failed to fetch payment methods');
  return res.json();
};

export const createPaymentMethod = async (name: string): Promise<PaymentMethod> => {
  const res = await fetch(`${API_BASE}/payment-methods`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Failed to create payment method');
  return res.json();
};

export const setPaymentMethodActive = async (id: string, isActive: boolean): Promise<void> => {
  await fetch(`${API_BASE}/payment-methods/${id}/active`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isActive }),
  });
};

export const fetchReasonCodes = async (): Promise<ReasonCode[]> => {
  const res = await fetch(`${API_BASE}/reason-codes`);
  if (!res.ok) throw new Error('Failed to fetch reason codes');
  return res.json();
};

export const createReasonCode = async (name: string, type: ReasonCodeType): Promise<ReasonCode> => {
  const res = await fetch(`${API_BASE}/reason-codes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, type }),
  });
  if (!res.ok) throw new Error('Failed to create reason code');
  return res.json();
};

export const setReasonCodeActive = async (id: string, isActive: boolean): Promise<void> => {
  await fetch(`${API_BASE}/reason-codes/${id}/active`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isActive }),
  });
};
