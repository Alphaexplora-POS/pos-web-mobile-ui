import type { PaymentMethod, ReasonCode, ReasonCodeType } from './configTypes';
import { apiRequest, invalidateCache } from '../../../shared/models/apiClient';

const CACHE_OPTIONS = { cache: true as const, cacheTtlMs: 5 * 60_000 };
const PAYMENT_METHODS_KEY = '/reference/payment-methods';
const REASON_CODES_KEY = '/reference/reason-codes';

const toReasonCode = (raw: {
  id: string;
  type: ReasonCodeType;
  label: string;
  isActive: boolean;
}): ReasonCode => ({
  id: raw.id,
  name: raw.label,
  type: raw.type,
  isActive: raw.isActive,
});

export const fetchPaymentMethods = async (): Promise<PaymentMethod[]> => {
  const data = await apiRequest<{ paymentMethods: PaymentMethod[] }>(PAYMENT_METHODS_KEY, CACHE_OPTIONS);
  return data.paymentMethods ?? [];
};

export const createPaymentMethod = async (name: string, type: string): Promise<PaymentMethod> => {
  const data = await apiRequest<PaymentMethod>(PAYMENT_METHODS_KEY, {
    method: 'POST',
    body: JSON.stringify({ name, type }),
  });
  invalidateCache(PAYMENT_METHODS_KEY);
  return data;
};

export const setPaymentMethodActive = async (id: string, isActive: boolean): Promise<void> => {
  await apiRequest<unknown>(`/reference/payment-methods/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
  invalidateCache(PAYMENT_METHODS_KEY);
};

export const updatePaymentMethod = async (id: string, name: string, type: string): Promise<PaymentMethod> => {
  const data = await apiRequest<PaymentMethod>(`/reference/payment-methods/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ name, type }),
  });
  invalidateCache(PAYMENT_METHODS_KEY);
  return data;
};

export const fetchReasonCodes = async (): Promise<ReasonCode[]> => {
  const data = await apiRequest<{ reasonCodes: { id: string; type: ReasonCodeType; label: string; isActive: boolean }[] }>(
    REASON_CODES_KEY,
    CACHE_OPTIONS,
  );
  return (data.reasonCodes ?? []).map(toReasonCode);
};

export const createReasonCode = async (name: string, type: ReasonCodeType): Promise<ReasonCode> => {
  const data = await apiRequest<{ id: string; type: ReasonCodeType; label: string; isActive: boolean }>(
    REASON_CODES_KEY,
    {
      method: 'POST',
      body: JSON.stringify({ label: name, type }),
    },
  );
  invalidateCache(REASON_CODES_KEY);
  return toReasonCode(data);
};

export const setReasonCodeActive = async (id: string, isActive: boolean): Promise<void> => {
  await apiRequest<unknown>(`/reference/reason-codes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
  invalidateCache(REASON_CODES_KEY);
};

export const updateReasonCode = async (id: string, name: string, type: ReasonCodeType): Promise<ReasonCode> => {
  const data = await apiRequest<{ id: string; type: ReasonCodeType; label: string; isActive: boolean }>(
    `/reference/reason-codes/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ label: name, type }),
    },
  );
  invalidateCache(REASON_CODES_KEY);
  return toReasonCode(data);
};