import type { InventoryAuditLog, InventoryFilters, InventoryItem } from './inventoryTypes';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

export const fetchCombinedInventory = async (): Promise<InventoryItem[]> => {
  const res = await fetch(`${API_BASE}/inventory/combined`);
  if (!res.ok) throw new Error('Failed to fetch combined inventory');
  return res.json();
};

export const fetchBranchInventory = async (branchId: string): Promise<InventoryItem[]> => {
  const res = await fetch(`${API_BASE}/inventory/branch/${branchId}`);
  if (!res.ok) throw new Error('Failed to fetch branch inventory');
  return res.json();
};

export const fetchInventoryAuditLogs = async (filters?: InventoryFilters): Promise<InventoryAuditLog[]> => {
  const params = new URLSearchParams();
  if (filters?.branchId) params.set('branchId', filters.branchId);
  if (filters?.productId) params.set('productId', filters.productId);
  const qs = params.toString();
  const res = await fetch(`${API_BASE}/inventory/audit${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error('Failed to fetch audit logs');
  return res.json();
};
