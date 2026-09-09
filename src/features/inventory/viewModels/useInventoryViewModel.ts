import { useState, useEffect, useCallback } from 'react';
import type { InventoryAuditLog, InventoryFilters, InventoryItem } from '../models/inventoryTypes';
import {
  fetchCombinedInventory,
  fetchBranchInventory,
  fetchInventoryAuditLogs,
} from '../models/inventoryApi';
import { fetchBranches } from '../../../shared/models/branchesApi';
import type { Branch } from '../../../shared/models/branchTypes';

export const useInventoryViewModel = (isOwner: boolean) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<InventoryAuditLog[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
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

  const load = useCallback(
    async (branchId?: string) => {
      try {
        if (isOwner) {
          const data = branchId
            ? await fetchBranchInventory(branchId)
            : await fetchCombinedInventory();
          setItems(data);
        } else if (branchId) {
          const data = await fetchBranchInventory(branchId);
          setItems(data);
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
      const first = branches.find((b) => b.isActive) ?? branches[0];
      if (first) setSelectedBranchId(first.id);
    }
  }, [isOwner, selectedBranchId, branches]);

  return {
    items,
    auditLogs,
    branches,
    selectedBranchId,
    setSelectedBranchId,
    isLoading,
    error,
    refresh: () => load(selectedBranchId ?? undefined),
    refreshAudit: loadAudit,
  };
};
