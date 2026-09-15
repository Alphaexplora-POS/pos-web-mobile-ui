import type { PaymentMethod, ReasonCode, ReasonCodeType } from './configTypes';
import { apiRequest } from '../../../shared/models/apiClient';

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
  const data = await apiRequest<{ paymentMethods: PaymentMethod[] }>('/reference/payment-methods');
  return data.paymentMethods ?? [];
};

export const createPaymentMethod = async (name: string, type: string): Promise<PaymentMethod> => {
  const data = await apiRequest<PaymentMethod>('/reference/payment-methods', {
    method: 'POST',
    body: JSON.stringify({ name, type }),
  });
  return data;
};

export const setPaymentMethodActive = async (id: string, isActive: boolean): Promise<void> => {
  await apiRequest<unknown>(`/reference/payment-methods/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
};

export const updatePaymentMethod = async (id: string, name: string, type: string): Promise<PaymentMethod> => {
  const data = await apiRequest<PaymentMethod>(`/reference/payment-methods/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ name, type }),
  });
  return data;
};

export const fetchReasonCodes = async (): Promise<ReasonCode[]> => {
  const data = await apiRequest<{ reasonCodes: { id: string; type: ReasonCodeType; label: string; isActive: boolean }[] }>(
    '/reference/reason-codes',
  );
  return (data.reasonCodes ?? []).map(toReasonCode);
};

export const createReasonCode = async (name: string, type: ReasonCodeType): Promise<ReasonCode> => {
  const data = await apiRequest<{ id: string; type: ReasonCodeType; label: string; isActive: boolean }>(
    '/reference/reason-codes',
    {
      method: 'POST',
      body: JSON.stringify({ label: name, type }),
    },
  );
  return toReasonCode(data);
};

export const setReasonCodeActive = async (id: string, isActive: boolean): Promise<void> => {
  await apiRequest<unknown>(`/reference/reason-codes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
};

export const updateReasonCode = async (id: string, name: string, type: ReasonCodeType): Promise<ReasonCode> => {
  const data = await apiRequest<{ id: string; type: ReasonCodeType; label: string; isActive: boolean }>(
    `/reference/reason-codes/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ label: name, type }),
    },
  );
  return toReasonCode(data);
};