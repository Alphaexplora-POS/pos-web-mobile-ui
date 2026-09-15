import { useState, useEffect, useCallback } from 'react';
import type { PaymentMethod, ReasonCode, ReasonCodeType } from '../models/configTypes';
import {
  fetchPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  setPaymentMethodActive,
  fetchReasonCodes,
  createReasonCode,
  updateReasonCode,
  setReasonCodeActive,
} from '../models/configApi';

export const useConfigViewModel = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [reasonCodes, setReasonCodes] = useState<ReasonCode[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [payments, reasons] = await Promise.all([
        fetchPaymentMethods(),
        fetchReasonCodes(),
      ]);
      setPaymentMethods(payments);
      setReasonCodes(reasons);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreatePaymentMethod = async (name: string, type: string) => {
    await createPaymentMethod(name, type);
    await load();
  };

  const handleTogglePaymentMethod = async (id: string, isActive: boolean) => {
    await setPaymentMethodActive(id, isActive);
    await load();
  };

  const handleUpdatePaymentMethod = async (id: string, name: string, type: string) => {
    await updatePaymentMethod(id, name, type);
    await load();
  };

  const handleCreateReasonCode = async (name: string, type: ReasonCodeType) => {
    await createReasonCode(name, type);
    await load();
  };

  const handleToggleReasonCode = async (id: string, isActive: boolean) => {
    await setReasonCodeActive(id, isActive);
    await load();
  };

  const handleUpdateReasonCode = async (id: string, name: string, type: ReasonCodeType) => {
    await updateReasonCode(id, name, type);
    await load();
  };

  return {
    paymentMethods,
    reasonCodes,
    isLoading,
    error,
    createPaymentMethod: handleCreatePaymentMethod,
    togglePaymentMethod: handleTogglePaymentMethod,
    updatePaymentMethod: handleUpdatePaymentMethod,
    createReasonCode: handleCreateReasonCode,
    toggleReasonCode: handleToggleReasonCode,
    updateReasonCode: handleUpdateReasonCode,
  };
};
