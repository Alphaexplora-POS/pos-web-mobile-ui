import type { PaymentMethod, ReasonCode, ReasonCodeType } from './configTypes';
import { apiRequest } from '../../../shared/models/apiClient';
import { invalidateResource } from '../../../shared/models/resourceInvalidation';
import { SERVER_PAGE_SIZE, toServerPage, type ServerPage } from '../../../shared/hooks/useServerPagination';

const CACHE_OPTIONS = { cache: true as const, cacheTtlMs: 5 * 60_000 };
const PAYMENT_METHODS_KEY = '/reference/payment-methods';
const REASON_CODES_KEY = '/reference/reason-codes';

interface RawReasonCode {
  id: string;
  type: ReasonCodeType;
  label: string;
  isActive: boolean;
}

const toReasonCode = (raw: RawReasonCode): ReasonCode => ({
  id: raw.id,
  name: raw.label,
  type: raw.type,
  isActive: raw.isActive,
});

export const fetchPaymentMethodsPage = async (page: number, limit: number = SERVER_PAGE_SIZE): Promise<ServerPage<PaymentMethod>> => {
  const data = await apiRequest<{ paymentMethods: PaymentMethod[] }>(
    `${PAYMENT_METHODS_KEY}?page=${page}&limit=${limit}&sortDirection=asc`,
  );
  return toServerPage<PaymentMethod>(data, 'paymentMethods');
};

export const fetchReasonCodesPage = async (page: number, limit: number = SERVER_PAGE_SIZE): Promise<ServerPage<ReasonCode>> => {
  const data = await apiRequest<{ reasonCodes: RawReasonCode[] }>(
    `${REASON_CODES_KEY}?page=${page}&limit=${limit}&sortDirection=asc`,
  );
  const reasonCodes = (data.reasonCodes ?? []).map(toReasonCode);
  return toServerPage<ReasonCode>({ ...data, reasonCodes }, 'reasonCodes');
};

export const fetchPaymentMethods = async (): Promise<PaymentMethod[]> => {
  const data = await apiRequest<{ paymentMethods: PaymentMethod[] }>(
    `${PAYMENT_METHODS_KEY}?limit=100`,
    CACHE_OPTIONS,
  );
  return data.paymentMethods ?? [];
};

export const createPaymentMethod = async (name: string, type: string): Promise<PaymentMethod> => {
  const data = await apiRequest<PaymentMethod>(PAYMENT_METHODS_KEY, {
    method: 'POST',
    body: JSON.stringify({ name, type }),
  });
  invalidateResource('paymentMethods');
  return data;
};

export const setPaymentMethodActive = async (id: string, isActive: boolean): Promise<void> => {
  await apiRequest<unknown>(`/reference/payment-methods/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
  invalidateResource('paymentMethods');
};

export const updatePaymentMethod = async (id: string, name: string, type: string): Promise<PaymentMethod> => {
  const data = await apiRequest<PaymentMethod>(`/reference/payment-methods/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ name, type }),
  });
  invalidateResource('paymentMethods');
  return data;
};

export const fetchReasonCodes = async (): Promise<ReasonCode[]> => {
  const data = await apiRequest<{ reasonCodes: RawReasonCode[] }>(`${REASON_CODES_KEY}?limit=100`, CACHE_OPTIONS);
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
  invalidateResource('reasonCodes');
  return toReasonCode(data);
};

export const setReasonCodeActive = async (id: string, isActive: boolean): Promise<void> => {
  await apiRequest<unknown>(`/reference/reason-codes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
  invalidateResource('reasonCodes');
};

export const updateReasonCode = async (id: string, name: string, type: ReasonCodeType): Promise<ReasonCode> => {
  const data = await apiRequest<{ id: string; type: ReasonCodeType; label: string; isActive: boolean }>(
    `/reference/reason-codes/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ label: name, type }),
    },
  );
  invalidateResource('reasonCodes');
  return toReasonCode(data);
};