import { useState } from 'react';
import { toast } from 'sonner';
import PageLayout from '../../../shared/components/PageLayout';
import ErrorState from '../../../shared/components/ErrorState';
import ConfirmModal from '../../../shared/components/ConfirmModal';
import TableEmptyState from '../../../shared/components/TableEmptyState';
import Pagination from '../../../shared/components/Pagination';
import ViewportTable from '../../../shared/components/ViewportTable';
import { SkeletonTable } from '../../../shared/components/Skeletons';
import { useResponsivePageSize } from '../../../shared/hooks/useResponsivePageSize';
import { useServerPagination } from '../../../shared/hooks/useServerPagination';
import {
  approveOwner,
  fetchOwnersPage,
  rejectOwner,
  type ApprovalStatus,
} from '../models/pendingApi';

const TABS: { key: ApprovalStatus; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

const EMPTY_MESSAGES: Record<ApprovalStatus, string> = {
  pending: 'No pending registrations',
  approved: 'No approved registrations yet',
  rejected: 'No rejected registrations',
};

const STATUS_STYLES: Record<ApprovalStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-success-light text-success',
  rejected: 'bg-error/10 text-error',
};

const ActionButton: React.FC<{
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'neutral' | 'danger';
  disabled?: boolean;
}> = ({ children, onClick, variant = 'neutral', disabled = false }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`text-sm px-4 py-1.5 rounded-md border border-line transition-colors disabled:opacity-50 ${
      variant === 'danger' ? 'text-error hover:bg-error/5' : 'text-ink-secondary hover:bg-canvas'
    }`}
  >
    {children}
  </button>
);

const formatDate = (value: string): string => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString();
};

const PendingApprovals: React.FC = () => {
  const [tableHeight, setTableHeight] = useState<number>(0);
  const [rowHeight, setRowHeight] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<ApprovalStatus>('pending');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [approveTarget, setApproveTarget] = useState<{ id: string; name: string } | null>(null);
  const [rejectTarget, setRejectTarget] = useState<{ id: string; name: string } | null>(null);

  const pageSize = useResponsivePageSize(tableHeight, rowHeight);
  const page = useServerPagination(
    (p) => fetchOwnersPage(activeTab, p),
    pageSize,
    { deps: [activeTab], queryKey: ['owner-approvals', activeTab] },
  );

  const handleApprove = async () => {
    if (!approveTarget) return;
    setBusyId(approveTarget.id);
    try {
      await approveOwner(approveTarget.id);
      toast.success('Registration approved. The owner can now sign in.');
      page.reset();
    } catch {
      // apiRequest already surfaces errors for non-GET calls
    } finally {
      setBusyId(null);
      setApproveTarget(null);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setBusyId(rejectTarget.id);
    try {
      await rejectOwner(rejectTarget.id);
      toast.success('Registration rejected.');
      page.reset();
    } catch {
      // apiRequest already surfaces errors for non-GET calls
    } finally {
      setBusyId(null);
      setRejectTarget(null);
    }
  };

  const error = page.error;

  return (
    <PageLayout title="Owner Approvals">
      {error && (
        <div className="mb-4">
          <ErrorState message={error} />
        </div>
      )}
      <div className="bg-white rounded-lg border border-line p-6">
        <div className="mb-4 inline-flex items-center gap-1 rounded-lg border border-line bg-white p-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-1.5 rounded-md text-sm transition-colors ${
                activeTab === tab.key
                  ? 'bg-brand text-white'
                  : 'text-ink-secondary hover:bg-canvas'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <ViewportTable onFitHeightChange={setTableHeight} onRowHeightChange={setRowHeight}>
          <div className="flex-1 overflow-x-auto overflow-y-hidden">
            {page.loading && page.totalCount === 0 ? (
              <SkeletonTable headers={['Owner', 'Business', 'Email', 'Registered', 'Status', '']} rows={5} />
            ) : page.items.length === 0 ? (
              <TableEmptyState message={EMPTY_MESSAGES[activeTab]} />
            ) : (
              <table className="w-full text-base">
                <thead>
                  <tr className="bg-canvas border-b border-line">
                    <th className="py-3 pl-4 text-left font-semibold text-ink-muted">Owner</th>
                    <th className="py-3 text-left font-semibold text-ink-muted">Business</th>
                    <th className="py-3 text-left font-semibold text-ink-muted">Email</th>
                    <th className="py-3 text-left font-semibold text-ink-muted">Registered</th>
                    <th className="py-3 text-left font-semibold text-ink-muted">Status</th>
                    <th className="py-3 pr-4 text-right font-semibold text-ink-muted">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {page.items.map((owner) => (
                    <tr key={owner.id} className="border-b border-line last:border-0 hover:bg-canvas transition-colors">
                      <td className="py-3.5 pl-4 font-medium text-ink-primary">
                        {owner.firstName} {owner.lastName}
                      </td>
                      <td className="py-3.5 text-ink-secondary">{owner.tenantName}</td>
                      <td className="py-3.5 text-ink-secondary">{owner.email}</td>
                      <td className="py-3.5 text-ink-secondary">{formatDate(owner.createdAt)}</td>
                      <td className="py-3.5">
                        <span
                          className={`inline-flex rounded px-2 py-0.5 text-xs font-medium capitalize ${
                            STATUS_STYLES[owner.status as ApprovalStatus] ?? STATUS_STYLES.pending
                          }`}
                        >
                          {owner.status}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4">
                        {activeTab === 'pending' ? (
                          <div className="flex items-center justify-end gap-2">
                            <ActionButton
                              onClick={() =>
                                setApproveTarget({ id: owner.id, name: `${owner.firstName} ${owner.lastName}` })
                              }
                              disabled={busyId === owner.id}
                            >
                              Approve
                            </ActionButton>
                            <ActionButton
                              variant="danger"
                              disabled={busyId === owner.id}
                              onClick={() =>
                                setRejectTarget({ id: owner.id, name: `${owner.firstName} ${owner.lastName}` })
                              }
                            >
                              Reject
                            </ActionButton>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {page.totalCount > 0 && (
            <Pagination
              page={page.page}
              totalPages={page.totalPages}
              onPageChange={page.goToPage}
              totalCount={page.totalCount}
              pageStart={page.pageStart}
              pageEnd={page.pageEnd}
            />
          )}
        </ViewportTable>
      </div>

      {approveTarget && (
        <ConfirmModal
          title="Approve registration"
          message={`Approve "${approveTarget.name}"? They will be able to sign in immediately.`}
          confirmLabel="Approve"
          onConfirm={handleApprove}
          onClose={() => setApproveTarget(null)}
        />
      )}

      {rejectTarget && (
        <ConfirmModal
          title="Reject registration"
          message={`Reject the registration of "${rejectTarget.name}"? They will not be able to sign in.`}
          confirmLabel="Reject"
          onConfirm={handleReject}
          onClose={() => setRejectTarget(null)}
        />
      )}
    </PageLayout>
  );
};

export default PendingApprovals;