import { useState, useEffect, useCallback } from 'react';
import type { InventoryAdjustInput, InventoryAuditLog, InventoryFilters, InventoryItem } from '../models/inventoryTypes';
import {
  fetchCombinedInventory,
  fetchBranchInventory,
  fetchInventoryAuditLogs,
  adjustInventory,
} from '../models/inventoryApi';
import { fetchBranches } from '../../../shared/models/branchesApi';
import type { Branch } from '../../../shared/models/branchTypes';
import type { ReasonCode } from '../../configuration/models/configTypes';
import { fetchReasonCodes } from '../../configuration/models/configApi';
import { fetchProducts } from '../../products/models/productsApi';
import { notifySuccess } from '../../../shared/utils/notify';

export const useInventoryViewModel = (isOwner: boolean, managerBranchId?: string | null) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [combinedItems, setCombinedItems] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<{ id: string; label: string }[]>([]);
  const [auditLogs, setAuditLogs] = useState<InventoryAuditLog[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [reasonCodes, setReasonCodes] = useState<ReasonCode[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadBranches = useCallback(async () => {
    try {
      const data = await fetchBranches();
      setBranches(data);
    } catch {
      setBranches([]);
    }
  }, []);

  useEffect(() => {
    fetchReasonCodes().then(setReasonCodes).catch(() => setReasonCodes([]));
    fetchProducts()
      .then((ps) => setProducts(ps.map((p) => ({ id: p.id, label: p.name }))))
      .catch(() => setProducts([]));
  }, []);

  const load = useCallback(
    async (branchId?: string) => {
      setIsLoading(true);
      try {
        if (isOwner) {
          const combined = await fetchCombinedInventory();
          setCombinedItems(combined);
          setItems(combined);
          if (branchId) {
            const data = await fetchBranchInventory(branchId);
            setItems(data);
          }
        } else if (branchId) {
          const data = await fetchBranchInventory(branchId);
          setItems(data);
          setCombinedItems(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    },
    [isOwner]
  );

  const loadAudit = useCallback(async (filters?: InventoryFilters) => {
    try {
      const data = await fetchInventoryAuditLogs(filters);
      setAuditLogs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  const adjustStock = useCallback(async (input: InventoryAdjustInput) => {
    await adjustInventory(input);
    notifySuccess('Stock adjusted');
    await load(selectedBranchId ?? undefined);
    await loadAudit(selectedBranchId ? { branchId: selectedBranchId } : undefined);
  }, [load, loadAudit, selectedBranchId]);

  useEffect(() => {
    load(selectedBranchId ?? undefined);
  }, [load, selectedBranchId]);

  useEffect(() => {
    if (isOwner) {
      loadAudit();
    } else if (selectedBranchId) {
      loadAudit({ branchId: selectedBranchId });
    }
  }, [loadAudit, isOwner, selectedBranchId]);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  useEffect(() => {
    if (!isOwner && selectedBranchId === null && branches.length > 0) {
      const first = managerBranchId
        ? branches.find((b) => b.id === managerBranchId)
        : undefined;
      const target = first ?? (branches.find((b) => b.isActive) ?? branches[0]);
      if (target) setSelectedBranchId(target.id);
    }
  }, [isOwner, selectedBranchId, branches, managerBranchId]);

  return {
    items,
    combinedItems,
    products,
    auditLogs,
    branches,
    selectedBranchId,
    setSelectedBranchId,
    reasonCodes,
    isLoading,
    error,
    refresh: () => load(selectedBranchId ?? undefined),
    refreshAudit: loadAudit,
    adjustStock,
  };
};