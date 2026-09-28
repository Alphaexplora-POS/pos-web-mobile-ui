import { useState } from 'react';
import { useBranchesViewModel } from '../viewModels/useBranchesViewModel';
import BranchForm from './BranchForm';
import EmployeeForm from './EmployeeForm';
import type { EmployeeRole, Branch } from '../models/branchTypes';
import PageLayout from '../../../shared/components/PageLayout';
import { BranchesSkeleton } from '../../../shared/components/Skeletons';
import ErrorState from '../../../shared/components/ErrorState';
import OwnerOnlyBadge from '../../../shared/components/OwnerOnlyBadge';
import Select from '../../../shared/components/Select';
import Modal from '../../../shared/components/Modal';
import TableEmptyState from '../../../shared/components/TableEmptyState';
import { useRole } from '../../../shared/hooks/useRole';
import { useAuth } from '../../auth/hooks/useAuth';
import { useMinimumLoading } from '../../../shared/hooks/useMinimumLoading';
import ConfirmModal from '../../../shared/components/ConfirmModal';

type BranchModalState = { mode: 'create' } | { mode: 'edit'; branch: Branch } | null;

type ConfirmState = {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void | Promise<void>;
} | null;

const Branches: React.FC = () => {
  const vm = useBranchesViewModel();
  const { isOwner } = useRole();
  const { session } = useAuth();
  const loading = useMinimumLoading(vm.isLoading);
  const [activeSection, setActiveSection] = useState<'branches' | 'employees'>('branches');
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [branchModal, setBranchModal] = useState<BranchModalState>(null);
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);

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

  if (loading) return <BranchesSkeleton />;
  if (vm.error) return <ErrorState message={vm.error} />;

  return (
    <PageLayout
      title="Branch and Employees"
      actions={!isOwner ? <OwnerOnlyBadge label="Branch Manager view" /> : undefined}
    >
      {session && (
        <div className="mb-6 bg-white rounded-lg border border-line p-4 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-sm text-ink-secondary">Workspace:</span>
          <span className="text-sm font-semibold text-ink-primary">{session.tenantName || '—'}</span>
          <span className="text-xs text-ink-muted">
            (employees are only shown for this workspace — id …{session.tenantId.slice(-6)})
          </span>
        </div>
      )}
      {!isOwner && (
        <div className="mb-6 bg-white rounded-lg border border-line p-4 flex items-center gap-2">
          <span className="text-sm text-ink-secondary">Your Branch:</span>
          <span className="text-sm font-semibold text-ink-primary">
            {branchManagerBranch?.name ?? '—'}
          </span>
        </div>
      )}

      <div className="mb-6 inline-flex items-center gap-1 rounded-lg border border-line bg-white p-1">
        <button
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeSection === 'branches'
              ? 'bg-brand text-white'
              : 'text-ink-secondary hover:text-ink-primary hover:bg-surface-hover'
          }`}
          onClick={() => setActiveSection('branches')}
        >
          Branches
        </button>
        <button
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeSection === 'employees'
              ? 'bg-brand text-white'
              : 'text-ink-secondary hover:text-ink-primary hover:bg-surface-hover'
          }`}
          onClick={() => setActiveSection('employees')}
        >
          Employees
        </button>
      </div>

      {activeSection === 'branches' ? (
        <div>
          {isOwner && vm.branches.length > tenantBranches.length && (
            <p className="mb-4 text-xs text-warning">
              {vm.branches.length - tenantBranches.length} branch(es) belong to a different workspace and are hidden.
              Sign in with the account that owns them to see their employees.
            </p>
          )}
          <div className="bg-white rounded-lg border border-line p-6 min-h-[26rem]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-ink-primary">Branches</h2>
              <div className="flex items-center gap-2">
                {isOwner && (
                  <button
                    className="bg-brand text-white px-4 py-1.5 rounded-md hover:bg-brand-dark transition-colors"
                    onClick={() => setBranchModal({ mode: 'create' })}
                  >
                    Add Branch
                  </button>
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
              {visibleBranches.length === 0 && (
                <TableEmptyState message="No branches yet" />
              )}
              {visibleBranches.map((b) => (
                <div
                  key={b.id}
                  className={`p-4 rounded-lg border transition-colors cursor-pointer min-h-24 flex flex-col justify-center ${
                    selectedBranchId === b.id
                      ? 'border-brand bg-brand-light'
                      : 'border-line hover:border-line-strong hover:bg-canvas'
                  }`}
                  onClick={() =>
                    setSelectedBranchId((prev) => (prev === b.id ? null : b.id))
                  }
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-ink-primary">{b.name}</h3>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded ${b.isActive ? 'bg-success-light text-success' : 'bg-surface-hover text-ink-muted'}`}>
                        {b.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {isOwner && (
                        <button
                          className="text-xs px-3 py-1 rounded-md border border-line text-ink-secondary hover:bg-canvas transition-colors"
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
                  {isOwner && (
                    <button
                      className={`mt-3 text-sm ${b.isActive ? 'text-error hover:text-error' : 'text-brand hover:text-brand-dark'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmState({
                          title: b.isActive ? 'Deactivate Branch' : 'Reactivate Branch',
                          message: `${b.isActive ? 'Deactivate' : 'Reactivate'} branch "${b.name}"?`,
                          confirmLabel: b.isActive ? 'Deactivate' : 'Reactivate',
                          onConfirm: b.isActive
                            ? () => vm.deactivateBranch(b.id)
                            : () => vm.activateBranch(b.id),
                        });
                      }}
                    >
                      {b.isActive ? 'Deactivate' : 'Reactivate'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-line p-6 min-h-[26rem]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-ink-primary">Employees</h2>
            <div className="flex items-center gap-3">
              {isOwner && (
                <button
                  className="bg-brand text-white px-4 py-2 rounded-md hover:bg-brand-dark transition-colors"
                  onClick={() => setEmployeeModalOpen(true)}
                >
                  Add Employee
                </button>
              )}
              <span className="text-xs text-ink-muted">{vm.employees.length} in this workspace</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            {vm.employees.length === 0 ? (
              <TableEmptyState message="No employees in this workspace yet" />
            ) : (
            <table className="w-full text-base">
              <thead>
                <tr className="bg-canvas border-b border-line">
                  <th className="py-3 pl-4 text-left font-semibold text-ink-muted">Name</th>
                  <th className="py-3 text-left font-semibold text-ink-muted">Role</th>
                  <th className="py-3 text-left font-semibold text-ink-muted">Branch</th>
                  <th className="py-3 text-left font-semibold text-ink-muted">Status</th>
                  {isOwner && <th className="py-3 pr-4 text-left font-semibold text-ink-muted">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {vm.employees
                  .filter((e) => (isOwner ? true : e.branchId === branchManagerBranch?.id))
                  .map((e) => (
                    <tr key={e.id} className="border-b border-line last:border-0 hover:bg-canvas transition-colors">
                      <td className="py-3.5 pl-4 font-medium text-ink-primary">{e.name}</td>
                      <td className="py-3.5">
                        <span className={`text-sm px-3 py-1 rounded ${roleBadgeClass[e.role]}`}>
                          {roleLabel[e.role]}
                        </span>
                      </td>
                      <td className="py-3.5">{tenantBranches.find((b) => b.id === e.branchId)?.name ?? '-'}</td>
                      <td className="py-3.5">
                        <span className={`text-sm px-3 py-1 rounded ${e.isActive ? 'bg-success-light text-success' : 'bg-surface-hover text-ink-muted'}`}>
                          {e.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      {isOwner && (
                        <td className="py-3.5 pr-4">
                          <button
                            className={`text-sm ${e.isActive ? 'text-error hover:text-error' : 'text-brand hover:text-brand-dark'}`}
                            onClick={() =>
                              setConfirmState({
                                title: e.isActive ? 'Deactivate Employee' : 'Reactivate Employee',
                                message: `${e.isActive ? 'Deactivate' : 'Reactivate'} employee "${e.name}"?`,
                                confirmLabel: e.isActive ? 'Deactivate' : 'Reactivate',
                                onConfirm: e.isActive
                                  ? () => vm.deactivateEmployee(e.id)
                                  : () => vm.activateEmployee(e.id),
                              })
                            }
                          >
                            {e.isActive ? 'Deactivate' : 'Reactivate'}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
            )}
          </div>
        </div>
      )}

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
          <EmployeeForm
            branches={tenantBranches}
            isOwner={isOwner}
            onSubmit={async (data) => {
              await vm.createEmployee(data);
              setEmployeeModalOpen(false);
            }}
          />
        </Modal>
      )}

      {confirmState && (
        <ConfirmModal
          title={confirmState.title}
          message={confirmState.message}
          confirmLabel={confirmState.confirmLabel}
          onConfirm={async () => {
            await confirmState.onConfirm();
            setConfirmState(null);
          }}
          onClose={() => setConfirmState(null)}
        />
      )}
    </PageLayout>
  );
};

export default Branches;
