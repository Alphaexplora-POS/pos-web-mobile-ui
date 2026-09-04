import { useState } from 'react';
import { useBranchesViewModel } from '../viewModels/useBranchesViewModel';
import BranchForm from './BranchForm';
import EmployeeForm from './EmployeeForm';
import type { EmployeeRole } from '../models/branchTypes';
import PageLayout from '../../../shared/components/PageLayout';
import LoadingState from '../../../shared/components/LoadingState';
import ErrorState from '../../../shared/components/ErrorState';
import OwnerOnlyBadge from '../../../shared/components/OwnerOnlyBadge';
import { useRole } from '../../../shared/hooks/useRole';

const Branches: React.FC = () => {
  const vm = useBranchesViewModel();
  const { isOwner } = useRole();
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  const visibleBranches = isOwner
    ? vm.branches
    : vm.branches.filter((b) => b.id === selectedBranchId);

  if (vm.isLoading) return <LoadingState />;
  if (vm.error) return <ErrorState message={vm.error} />;

  return (
    <PageLayout
      title="Branch and Employees"
      actions={!isOwner ? <OwnerOnlyBadge label="Branch Manager view" /> : undefined}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Branches</h2>
              {isOwner && (
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Branch</label>
                  <select
                    value={selectedBranchId ?? ''}
                    onChange={(e) => setSelectedBranchId(e.target.value || null)}
                    className="rounded border border-gray-300 px-3 py-1 text-sm"
                  >
                    <option value="">All branches</option>
                    {vm.branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="space-y-3">
              {visibleBranches.map((b) => (
                <div
                  key={b.id}
                  className={`p-4 rounded-lg border cursor-pointer ${
                    selectedBranchId === b.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200'
                  }`}
                  onClick={() => setSelectedBranchId(b.id)}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">{b.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded ${b.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {b.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{b.address}</p>
                  <p className="text-sm text-gray-500">{b.contact}</p>
                  {isOwner && b.isActive && (
                    <button
                      className="mt-3 text-sm text-red-600 hover:text-red-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        vm.deactivateBranch(b.id);
                      }}
                    >
                      Deactivate
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Employees</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2">Name</th>
                  <th>Role</th>
                  <th>Branch</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {vm.employees
                  .filter((e) => (isOwner ? true : e.branchId === selectedBranchId))
                  .map((e) => {
                    const roleLabel: Record<EmployeeRole, string> = {
                      branch_manager: 'Branch Manager',
                      cashier: 'Cashier',
                      staff: 'Staff',
                    };
                    return (
                      <tr key={e.id} className="border-b">
                        <td className="py-2">{e.name}</td>
                        <td>{roleLabel[e.role]}</td>
                        <td>{vm.branches.find((b) => b.id === e.branchId)?.name ?? '-'}</td>
                        <td>
                          <span className={`text-xs px-2 py-1 rounded ${e.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {e.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          {isOwner && e.isActive && (
                            <button
                              className="text-red-600 hover:text-red-700"
                              onClick={() => vm.deactivateEmployee(e.id)}
                            >
                              Deactivate
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <BranchForm
            isOwner={isOwner}
            initial={vm.branches.find((b) => b.id === selectedBranchId)}
            onSubmit={(data) => {
              if (selectedBranchId) {
                vm.updateBranch(selectedBranchId, data);
              } else {
                vm.createBranch(data);
              }
            }}
          />
          <EmployeeForm branches={vm.branches} isOwner={isOwner} onSubmit={vm.createEmployee} />
        </div>
      </div>
    </PageLayout>
  );
};

export default Branches;
