import { useState, useEffect, useCallback } from 'react';
import type { Branch, CreateBranchInput, CreateEmployeeInput, Employee } from '../models/branchTypes';
import {
  fetchBranches,
  createBranch,
  updateBranch,
  deactivateBranch,
  fetchEmployees,
  createEmployee,
  deactivateEmployee,
} from '../models/branchesApi';
import { notifySuccess } from '../../../shared/utils/notify';

export const useBranchesViewModel = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [branchData, empData] = await Promise.all([fetchBranches(), fetchEmployees()]);
      setBranches(branchData);
      setEmployees(empData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreateBranch = async (input: CreateBranchInput) => {
    await createBranch(input);
    notifySuccess('Branch created');
    await load();
  };

  const handleUpdateBranch = async (id: string, input: Partial<CreateBranchInput>) => {
    await updateBranch(id, input);
    notifySuccess('Branch updated');
    await load();
  };

  const handleDeactivateBranch = async (id: string) => {
    await deactivateBranch(id);
    notifySuccess('Branch deactivated');
    await load();
  };

  const handleCreateEmployee = async (input: CreateEmployeeInput) => {
    await createEmployee(input);
    notifySuccess('Employee added');
    await load();
  };

  const handleDeactivateEmployee = async (id: string) => {
    await deactivateEmployee(id);
    notifySuccess('Employee deactivated');
    await load();
  };

  return {
    branches,
    employees,
    isLoading,
    error,
    createBranch: handleCreateBranch,
    updateBranch: handleUpdateBranch,
    deactivateBranch: handleDeactivateBranch,
    createEmployee: handleCreateEmployee,
    deactivateEmployee: handleDeactivateEmployee,
  };
};
