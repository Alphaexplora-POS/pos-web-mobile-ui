import { useState } from 'react';
import { useBranchesViewModel } from '../viewModels/useBranchesViewModel';
import BranchForm from './BranchForm';
import EmployeeForm from './EmployeeForm';
import type { EmployeeRole, Branch } from '../models/branchTypes';
import PageLayout from '../../../shared/components/PageLayout';
import LoadingState from '../../../shared/components/LoadingState';
import ErrorState from '../../../shared/components/ErrorState';
import OwnerOnlyBadge from '../../../shared/components/OwnerOnlyBadge';
import Select from '../../../shared/components/Select';
import Modal from '../../../shared/components/Modal';
import { useRole } from '../../../shared/hooks/useRole';
import { useAuth } from '../../auth/hooks/useAuth';

type BranchModalState = { mode: 'create' } | { mode: 'edit'; branch: Branch } | null;

const Branches: React.FC = () => {
  const vm = useBranchesViewModel();
  const { isOwner } = useRole();
  const { session } = useAuth();
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [branchModal, setBranchModal] = useState<BranchModalState>(null);
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);

  const tenantBranches = session?.tenantId
    ? vm.branches.filter((b) => !b.tenantId || b.tenantId === session.tenantId)
    : vm.branches;

  const branchManagerBranch: Branch | null = !isOwner
    ? tenantBranches.find((b) => b.isActive) ?? tenantBranches[0] ?? null
    : null;

  const visibleBranches = isOwner
    ? tenantBranches
    : branchManagerBranch
    ? [branchManagerBranch]
    : [];

  if (vm.isLoading) return <LoadingState />;
  if (vm.error) return <ErrorState message={vm.error} />;

  return (
    <PageLayout
      title="Branch and Employees"
      actions={!isOwner ? <OwnerOnlyBadge label="Branch Manager view" /> : undefined}
    >
      {session && (
        <div className="mb-6 bg-white rounded-lg shadow p-4 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-sm text-ink-secondary">Workspace:</span>
          <span className="text-sm font-semibold text-ink-primary">{session.tenantName || '—'}</span>
          <span className="text-xs text-ink-muted">
            (employees are only shown for this workspace — id …{session.tenantId.slice(-6)})
          </span>
        </div>
      )}
      {!isOwner && (
        <div className="mb-6 bg-white rounded-lg shadow p-4 flex items-center gap-2">
          <span className="text-sm text-ink-secondary">Your Branch:</span>
          <span className="text-sm font-semibold text-ink-primary">
            {branchManagerBranch?.name ?? '—'}
          </span>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-ink-primary">Branches</h2>
              <div className="flex items-center gap-2">
                {isOwner && (
                  <button
                    className="bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark"
                    onClick={() => setBranchModal({ mode: 'create' })}
                  >
                    Add Branch
                  </button>
                )}
                {isOwner && (
                  <label className="text-sm text-ink-secondary">Branch</label>
                )}
                {isOwner && (
                  <Select
                    value={selectedBranchId ?? ''}
                    onChange={(v) => setSelectedBranchId(v || null)}
                    options={[
                      { value: '', label: 'All branches' },
                      ...tenantBranches.map((b) => ({ value: b.id, label: b.name })),
                    ]}
                    className="w-40 shrink-0"
                  />
                )}
              </div>
            </div>
            <div className="space-y-3">
              {visibleBranches.map((b) => (
                <div
                  key={b.id}
                  className={`p-4 rounded-lg border cursor-pointer ${
                    selectedBranchId === b.id
                      ? 'border-brand bg-brand-light'
                      : 'border-line'
                  }`}
                  onClick={() => setSelectedBranchId(b.id)}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-ink-primary">{b.name}</h3>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded ${b.isActive ? 'bg-success-light text-success' : 'bg-surface-hover text-ink-muted'}`}>
                        {b.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {isOwner && (
                        <button
                          className="text-xs px-3 py-1 rounded border border-line text-ink-secondary hover:bg-canvas"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBranchModal({ mode: 'edit', branch: b });
                          }}
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-ink-secondary mt-1">{b.address}</p>
                  <p className="text-sm text-ink-muted">{b.contact}</p>
                  {isOwner && b.isActive && (
                    <button
                      className="mt-3 text-sm text-error hover:text-error"
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-ink-primary">Employees</h2>
              <div className="flex items-center gap-3">
                {isOwner && (
                  <button
                    className="bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark"
                    onClick={() => setEmployeeModalOpen(true)}
                  >
                    Add Employee
                  </button>
                )}
                <span className="text-xs text-ink-muted">{vm.employees.length} in this workspace</span>
              </div>
            </div>
            {vm.employees.length === 0 && (
              <p className="text-sm text-warning mb-3">
                No employees in this workspace yet. Use "Add Employee" to create one with a branch from this workspace.
              </p>
            )}
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-muted border-b">
                  <th className="py-2">Name</th>
                  <th>Role</th>
                  <th>Branch</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vm.employees
                  .filter((e) => (isOwner ? true : e.branchId === branchManagerBranch?.id))
                  .map((e) => {
                    const roleLabel: Record<EmployeeRole, string> = {
                      branch_manager: 'Branch Manager',
                      supervisor: 'Supervisor',
                      cashier: 'Cashier',
                      staff: 'Staff',
                    };
                    const roleBadgeClass: Record<EmployeeRole, string> = {
                      branch_manager: 'bg-brand-light text-brand',
                      supervisor: 'bg-info/10 text-info',
                      cashier: 'bg-warning/10 text-warning',
                      staff: 'bg-surface-hover text-ink-secondary',
                    };
                    return (
                      <tr key={e.id} className="border-b">
                        <td className="py-2">{e.name}</td>
                        <td>
                          <span className={`text-xs px-2 py-1 rounded ${roleBadgeClass[e.role]}`}>
                            {roleLabel[e.role]}
                          </span>
                        </td>
                        <td>{tenantBranches.find((b) => b.id === e.branchId)?.name ?? '-'}</td>
                        <td>
                          <span className={`text-xs px-2 py-1 rounded ${e.isActive ? 'bg-success-light text-success' : 'bg-surface-hover text-ink-muted'}`}>
                            {e.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          {isOwner && e.isActive && (
                            <button
                              className="text-error hover:text-error"
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
          {isOwner && vm.branches.length > tenantBranches.length && (
            <p className="text-xs text-warning">
              {vm.branches.length - tenantBranches.length} branch(es) belong to a different workspace and are hidden.
              Sign in with the account that owns them to see their employees.
            </p>
          )}
        </div>
      </div>

      {isOwner && branchModal && (
        <Modal
          title={branchModal.mode === 'edit' ? 'Edit Branch' : 'Add Branch'}
          onClose={() => setBranchModal(null)}
        >
          <BranchForm
            key={branchModal.mode === 'edit' ? branchModal.branch.id : 'new'}
            isOwner={isOwner}
            initial={branchModal.mode === 'edit' ? branchModal.branch : undefined}
            onSubmit={(data) => {
              if (branchModal.mode === 'edit') {
                vm.updateBranch(branchModal.branch.id, data);
              } else {
                vm.createBranch(data);
              }
              setBranchModal(null);
            }}
          />
        </Modal>
      )}

      {isOwner && employeeModalOpen && (
        <Modal title="Add Employee" onClose={() => setEmployeeModalOpen(false)}>
          <EmployeeForm branches={tenantBranches} isOwner={isOwner} onSubmit={vm.createEmployee} />
        </Modal>
      )}
    </PageLayout>
  );
};

export default Branches;
