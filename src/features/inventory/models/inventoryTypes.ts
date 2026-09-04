export type StockOrigin = 'automatic' | 'manual';

export interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  variantSku: string;
  branchId: string;
  branchName: string;
  quantity: number;
  origin: StockOrigin;
}

export interface InventoryAuditLog {
  id: string;
  productName: string;
  variantSku: string;
  branchName: string;
  action: string;
  quantityDelta: number;
  timestamp: string;
}

export interface InventoryFilters {
  branchId?: string;
  productId?: string;
}
