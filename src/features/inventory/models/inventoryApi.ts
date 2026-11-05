import type { InventoryAdjustInput, InventoryAuditLog, InventoryFilters, InventoryItem } from './inventoryTypes';
import { apiRequest, invalidateCache } from '../../../shared/models/apiClient';
import { SERVER_PAGE_SIZE, toServerPage, type ServerPage } from '../../../shared/hooks/useServerPagination';

const CACHE_OPTIONS = { cache: true as const, cacheTtlMs: 60_000 };

export const invalidateInventoryCache = (): void => {
  invalidateCache('GET /inventory');
};

interface RawStockRow {
  id: string;
  branch_id: string;
  product_variant_id: string;
  product_sku: string;
  quantity: number;
  reorder_point: number | null;
  updated_at: string;
  branch_name?: string | null;
  size?: string | null;
  color?: string | null;
  product_id?: string | null;
  product_name?: string | null;
}

const toInventoryItem = (raw: RawStockRow): InventoryItem => ({
  id: raw.id,
  productId: raw.product_id ?? '',
  productVariantId: raw.product_variant_id,
  productName: raw.product_name ?? raw.product_sku,
  variantLabel: [raw.size, raw.color].filter(Boolean).join(' · '),
  variantSku: raw.product_sku,
  branchId: raw.branch_id,
  branchName: raw.branch_name ?? '',
  quantity: raw.quantity,
  origin: 'manual',
});

interface RawAuditLog {
  id: string;
  branch_id: string;
  product_variant_id: string;
  product_sku: string;
  action: 'stock_in' | 'stock_out' | 'adjustment';
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  reason_label: string;
  notes: string | null;
  performed_by: string;
  performed_by_name: string;
  created_at: string;
  branch_name?: string | null;
  product_name?: string | null;
}

const toAuditLog = (raw: RawAuditLog): InventoryAuditLog => ({
  id: raw.id,
  productName: raw.product_name ?? raw.product_sku,
  variantSku: raw.product_sku,
  branchName: raw.branch_name ?? '',
  action: raw.action === 'stock_in' ? 'Stock In' : raw.action === 'stock_out' ? 'Stock Out' : 'Stock Adjustment',
  quantityDelta: Math.abs(raw.quantity_change),
  reasonLabel: raw.reason_label ?? '',
  notes: raw.notes ?? null,
  performedBy: raw.performed_by,
  performedByName: raw.performed_by_name ?? '',
  timestamp: raw.created_at,
});

export const adjustInventory = async (input: InventoryAdjustInput): Promise<InventoryItem> => {
  const data = await apiRequest<{ productVariantId: string; quantity: number; auditLogId: string }>(
    '/inventory/adjust',
    {
      method: 'POST',
      body: JSON.stringify({
        branchId: input.branchId,
        productId: input.productId,
        productVariantId: input.productVariantId,
        action: input.action,
        quantity: input.quantity,
        unitCost: input.unitCost,
        reasonId: input.reasonId,
        notes: input.notes,
        performedBy: input.performedBy,
      }),
    },
  );
  invalidateCache('GET /inventory');
  return {
    id: data.auditLogId,
    productId: '',
    productVariantId: data.productVariantId,
    productName: '',
    variantLabel: '',
    variantSku: '',
    branchId: input.branchId,
    branchName: '',
    quantity: data.quantity,
    origin: 'manual',
  };
};

export const fetchCombinedInventory = async (): Promise<InventoryItem[]> => {
  const data = await apiRequest<{ inventory: RawStockRow[] }>('/inventory?scope=global&limit=100', CACHE_OPTIONS);
  return (data.inventory ?? []).map(toInventoryItem);
};

export const fetchInventoryPage = async (
  page: number,
  branchId?: string,
  limit: number = SERVER_PAGE_SIZE,
): Promise<ServerPage<InventoryItem>> => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (branchId) {
    params.set('branchId', branchId);
  } else {
    params.set('scope', 'global');
  }
  const data = await apiRequest<{ inventory: RawStockRow[] }>(`/inventory?${params.toString()}`);
  const inventory = (data.inventory ?? []).map(toInventoryItem);
  return toServerPage<InventoryItem>({ ...data, inventory }, 'inventory');
};

export const fetchInventoryAuditLogsPage = async (
  page: number,
  filters?: InventoryFilters,
  limit: number = SERVER_PAGE_SIZE,
): Promise<ServerPage<InventoryAuditLog>> => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sortDirection: 'asc',
  });
  if (filters?.branchId) params.set('branchId', filters.branchId);
  if (filters?.productId) params.set('productVariantId', filters.productId);
  const data = await apiRequest<{ auditLogs: RawAuditLog[] }>(
    `/inventory/audit-logs?${params.toString()}`,
  );
  const auditLogs = (data.auditLogs ?? []).map(toAuditLog);
  return toServerPage<InventoryAuditLog>({ ...data, auditLogs }, 'auditLogs');
};

export const fetchBranchInventory = async (branchId: string): Promise<InventoryItem[]> => {
  const data = await apiRequest<{ inventory: RawStockRow[] }>(
    `/inventory?branchId=${encodeURIComponent(branchId)}&limit=100`,
    CACHE_OPTIONS,
  );
  return (data.inventory ?? []).map(toInventoryItem);
};

export const fetchInventoryAuditLogs = async (filters?: InventoryFilters): Promise<InventoryAuditLog[]> => {
  const params = new URLSearchParams();
  params.set('limit', '100');
  if (filters?.branchId) params.set('branchId', filters.branchId);
  if (filters?.productId) params.set('productVariantId', filters.productId);
  const qs = params.toString();
  const data = await apiRequest<{ auditLogs: RawAuditLog[] }>(
    `/inventory/audit-logs${qs ? `?${qs}` : ''}`,
    CACHE_OPTIONS,
  );
  return (data.auditLogs ?? []).map(toAuditLog);
};
