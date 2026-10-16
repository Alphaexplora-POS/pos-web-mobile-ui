export const PAYMENT_METHOD_TYPES = ['Cash', 'Card', 'E-wallet', 'Bank transfer', 'Other'] as const;

export type PaymentMethodType = (typeof PAYMENT_METHOD_TYPES)[number];

export interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
}

export type ReasonCodeType = 'refund' | 'inventory';

export interface ReasonCode {
  id: string;
  name: string;
  type: ReasonCodeType;
  isActive: boolean;
}
