export type StockOrigin = 'automatic' | 'manual';

export interface InventoryItem {
  id: string;
  productId: string;
  productVariantId: string;
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
  reasonLabel: string;
  notes: string | null;
  performedBy: string;
  performedByName: string;
  timestamp: string;
}

export type InventoryAdjustAction = 'stock_in' | 'stock_out' | 'adjustment';

export interface InventoryAdjustInput {
  branchId: string;
  productId: string;
  productVariantId?: string;
  action: InventoryAdjustAction;
  quantity: number;
  unitCost?: number;
  reasonId: string;
  notes?: string;
  performedBy: string;
}

export interface InventoryFilters {
  branchId?: string;
  productId?: string;
}
