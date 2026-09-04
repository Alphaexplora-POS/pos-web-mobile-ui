export interface PaymentMethod {
  id: string;
  name: string;
  isActive: boolean;
}

export type ReasonCodeType = 'refund' | 'inventory';

export interface ReasonCode {
  id: string;
  name: string;
  type: ReasonCodeType;
  isActive: boolean;
}
