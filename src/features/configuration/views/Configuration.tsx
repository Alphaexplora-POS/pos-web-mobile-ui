import { useState } from 'react';
import { toast } from 'sonner';
import { useConfigViewModel } from '../viewModels/useConfigViewModel';
import PageLayout from '../../../shared/components/PageLayout';
import { ConfigurationSkeleton } from '../../../shared/components/Skeletons';
import ErrorState from '../../../shared/components/ErrorState';
import Select from '../../../shared/components/Select';
import Modal from '../../../shared/components/Modal';
import LoadingButton from '../../../shared/components/LoadingButton';
import ConfirmModal from '../../../shared/components/ConfirmModal';
import TableEmptyState from '../../../shared/components/TableEmptyState';
import { useServerPagination } from '../../../shared/hooks/useServerPagination';
import Pagination from '../../../shared/components/Pagination';
import { useUrlSection } from '../../../shared/hooks/useUrlSection';
import { useResponsivePageSize } from '../../../shared/hooks/useResponsivePageSize';
import ViewportTable from '../../../shared/components/ViewportTable';
import { PAYMENT_METHOD_TYPES, type PaymentMethodType } from '../models/configTypes';
import { paymentMethodSchema, reasonCodeSchema, firstZodMessage } from '../../../shared/validation/schemas';
import { fetchPaymentMethodsPage, fetchReasonCodesPage } from '../models/configApi';

type ReasonType = 'refund' | 'inventory';

const ReasonOptions: { value: ReasonType; label: string }[] = [
  { value: 'refund', label: 'Refund' },
  { value: 'inventory', label: 'Inventory' },
];

const StatusBadge: React.FC<{ isActive: boolean }> = ({ isActive }) => (
  <span
    className={`text-sm px-3 py-1 rounded ${
      isActive ? 'bg-success-light text-success' : 'bg-surface-hover text-ink-muted'
    }`}
  >
    {isActive ? 'Active' : 'Inactive'}
  </span>
);

const ActionButton: React.FC<{
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'neutral' | 'danger';
}> = ({ children, onClick, variant = 'neutral' }) => (
  <button
    type="button"
    onClick={onClick}
    className={`text-sm px-4 py-1.5 rounded-md border border-line transition-colors ${
      variant === 'danger'
        ? 'text-error hover:bg-error/5'
        : 'text-ink-secondary hover:bg-canvas'
    }`}
  >
    {children}
  </button>
);

const Configuration: React.FC = () => {
  const vm = useConfigViewModel();
  const [tableHeight, setTableHeight] = useState<number>(0);
  const [rowHeight, setRowHeight] = useState<number>(0);
  const [activeSection, setActiveSection] = useUrlSection<'payment' | 'reasons'>(
    'section',
    'payment',
    (v) => (v === 'reasons' ? 'reasons' : 'payment'),
  );

  const pageSize = useResponsivePageSize(tableHeight, rowHeight);
  const paymentPage = useServerPagination(
    (page) => fetchPaymentMethodsPage(page),
    pageSize,
    { deps: [], queryKey: ['payment-methods'] },
  );
  const reasonPage = useServerPagination(
    (page) => fetchReasonCodesPage(page),
    pageSize,
    { deps: [], queryKey: ['reason-codes'] },
  );

  const loading = (paymentPage.loading || reasonPage.loading) && paymentPage.totalCount === 0 && reasonPage.totalCount === 0;

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [payName, setPayName] = useState('');
  const [payType, setPayType] = useState<PaymentMethodType>('Other');
  const [editingPayId, setEditingPayId] = useState<string | null>(null);
  const [editPayName, setEditPayName] = useState('');
  const [editPayType, setEditPayType] = useState<PaymentMethodType>('Other');

  const [reasonModalOpen, setReasonModalOpen] = useState(false);
  const [reasonName, setReasonName] = useState('');
  const [reasonType, setReasonType] = useState<ReasonType>('refund');
  const [editingReasonId, setEditingReasonId] = useState<string | null>(null);
  const [editReasonName, setEditReasonName] = useState('');
  const [editReasonType, setEditReasonType] = useState<ReasonType>('refund');

  const [confirmState, setConfirmState] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void | Promise<void>;
  } | null>(null);

  const [paySubmitting, setPaySubmitting] = useState(false);
  const [editPaySubmitting, setEditPaySubmitting] = useState(false);
  const [reasonSubmitting, setReasonSubmitting] = useState(false);
  const [editReasonSubmitting, setEditReasonSubmitting] = useState(false);

  if (loading) return <ConfigurationSkeleton />;
  const loadError = vm.error ?? paymentPage.error ?? reasonPage.error;
  if (loadError) return <ErrorState message={loadError} />;

  const editingPayment = paymentPage.items.find((m) => m.id === editingPayId);
  const editingReason = reasonPage.items.find((r) => r.id === editingReasonId);

  const openAddPayment = () => {
    setPayName('');
    setPayType('Other');
    setPaymentModalOpen(true);
  };

  const openAddReason = () => {
    setReasonName('');
    setReasonType('refund');
    setReasonModalOpen(true);
  };

  const submitPayment = async () => {
    const check = paymentMethodSchema.safeParse({ name: payName, type: payType });
    if (!check.success) {
      toast.error(firstZodMessage(check.error));
      return;
    }
    setPaySubmitting(true);
    try {
      await vm.createPaymentMethod(payName, payType);
      paymentPage.reset();
      setPaymentModalOpen(false);
    } finally {
      setPaySubmitting(false);
    }
  };

  const submitReason = async () => {
    const check = reasonCodeSchema.safeParse({ label: reasonName, type: reasonType });
    if (!check.success) {
      toast.error(firstZodMessage(check.error));
      return;
    }
    setReasonSubmitting(true);
    try {
      await vm.createReasonCode(reasonName, reasonType);
      reasonPage.reset();
      setReasonModalOpen(false);
    } finally {
      setReasonSubmitting(false);
    }
  };

  return (
    <PageLayout title="Configuration">
      <div className="mb-6 inline-flex items-center gap-1 rounded-lg border border-line bg-white p-1">
        <button
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeSection === 'payment'
              ? 'bg-brand text-white'
              : 'text-ink-secondary hover:text-ink-primary hover:bg-surface-hover'
          }`}
          onClick={() => setActiveSection('payment')}
        >
          Payment Methods
        </button>
        <button
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeSection === 'reasons'
              ? 'bg-brand text-white'
              : 'text-ink-secondary hover:text-ink-primary hover:bg-surface-hover'
          }`}
          onClick={() => setActiveSection('reasons')}
        >
          Reason Codes
        </button>
      </div>

      {activeSection === 'payment' && (
        <div className="bg-white rounded-lg border border-line p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-ink-primary">Payment Methods</h2>
            <button
              className="bg-brand text-white px-4 py-1.5 rounded-md hover:bg-brand-dark transition-colors"
              onClick={openAddPayment}
            >
              Add Payment Method
            </button>
          </div>

          <ViewportTable onFitHeightChange={setTableHeight} onRowHeightChange={setRowHeight}>
            <div className="flex-1 overflow-x-auto overflow-y-hidden">
              {paymentPage.items.length === 0 ? (
                <TableEmptyState message="No payment methods yet" />
              ) : (
              <table className="w-full text-base">
                <thead>
                  <tr className="bg-canvas border-b border-line">
                    <th className="py-3 pl-4 text-left font-semibold text-ink-muted">Name</th>
                    <th className="py-3 text-left font-semibold text-ink-muted">Type</th>
                    <th className="py-3 text-left font-semibold text-ink-muted">Status</th>
                    <th className="py-3 pr-4 text-right font-semibold text-ink-muted">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentPage.items.map((m) => (
                    <tr key={m.id} className="border-b border-line last:border-0 hover:bg-canvas transition-colors">
                      <td className="py-3.5 pl-4 font-medium text-ink-primary">{m.name}</td>
                      <td className="py-3.5 text-ink-secondary">{m.type}</td>
                      <td className="py-3.5">
                        <StatusBadge isActive={m.isActive} />
                      </td>
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center justify-end gap-2">
                          <ActionButton
                            onClick={() => {
                              setEditingPayId(m.id);
                              setEditPayName(m.name);
                              setEditPayType(m.type as PaymentMethodType);
                            }}
                          >
                            Edit
                          </ActionButton>
                          <ActionButton
                            variant="danger"
                            onClick={() =>
                              setConfirmState({
                                title: m.isActive ? 'Deactivate Payment Method' : 'Reactivate Payment Method',
                                message: `${m.isActive ? 'Deactivate' : 'Reactivate'} payment method "${m.name}"?`,
                                confirmLabel: m.isActive ? 'Deactivate' : 'Reactivate',
                                onConfirm: () =>
                                  vm.togglePaymentMethod(m.id, !m.isActive).then(() => paymentPage.reset()),
                              })
                            }
                          >
                            {m.isActive ? 'Deactivate' : 'Reactivate'}
                          </ActionButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              )}
            </div>
            {paymentPage.totalCount > 0 && (
              <Pagination
                page={paymentPage.page}
                totalPages={paymentPage.totalPages}
                onPageChange={paymentPage.goToPage}
                totalCount={paymentPage.totalCount}
                pageStart={paymentPage.pageStart}
                pageEnd={paymentPage.pageEnd}
              />
            )}
          </ViewportTable>
        </div>
      )}

      {activeSection === 'reasons' && (
        <div className="bg-white rounded-lg border border-line p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-ink-primary">Reason Codes</h2>
            <button
              className="bg-brand text-white px-4 py-1.5 rounded-md hover:bg-brand-dark transition-colors"
              onClick={openAddReason}
            >
              Add Reason Code
            </button>
          </div>

          <ViewportTable onFitHeightChange={setTableHeight} onRowHeightChange={setRowHeight}>
            <div className="flex-1 overflow-x-auto overflow-y-hidden">
              {reasonPage.items.length === 0 ? (
                <TableEmptyState message="No reason codes yet" />
              ) : (
              <table className="w-full text-base">
                <thead>
                  <tr className="bg-canvas border-b border-line">
                    <th className="py-3 pl-4 text-left font-semibold text-ink-muted">Name</th>
                    <th className="py-3 text-left font-semibold text-ink-muted">Type</th>
                    <th className="py-3 text-left font-semibold text-ink-muted">Status</th>
                    <th className="py-3 pr-4 text-right font-semibold text-ink-muted">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reasonPage.items.map((r) => (
                    <tr key={r.id} className="border-b border-line last:border-0 hover:bg-canvas transition-colors">
                      <td className="py-3.5 pl-4 font-medium text-ink-primary">{r.name}</td>
                      <td className="py-3.5 text-ink-secondary">{r.type}</td>
                      <td className="py-3.5">
                        <StatusBadge isActive={r.isActive} />
                      </td>
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center justify-end gap-2">
                          <ActionButton
                            onClick={() => {
                              setEditingReasonId(r.id);
                              setEditReasonName(r.name);
                              setEditReasonType(r.type);
                            }}
                          >
                            Edit
                          </ActionButton>
                          <ActionButton
                            variant="danger"
                            onClick={() =>
                              setConfirmState({
                                title: r.isActive ? 'Deactivate Reason Code' : 'Reactivate Reason Code',
                                message: `${r.isActive ? 'Deactivate' : 'Reactivate'} reason code "${r.name}"?`,
                                confirmLabel: r.isActive ? 'Deactivate' : 'Reactivate',
                                onConfirm: () => vm.toggleReasonCode(r.id, !r.isActive).then(() => reasonPage.reset()),
                              })
                            }
                          >
                            {r.isActive ? 'Deactivate' : 'Reactivate'}
                          </ActionButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              )}
            </div>
            {reasonPage.totalCount > 0 && (
              <Pagination
                page={reasonPage.page}
                totalPages={reasonPage.totalPages}
                onPageChange={reasonPage.goToPage}
                totalCount={reasonPage.totalCount}
                pageStart={reasonPage.pageStart}
                pageEnd={reasonPage.pageEnd}
              />
            )}
          </ViewportTable>
        </div>
      )}

      {paymentModalOpen && (
        <Modal title="Add payment method" onClose={() => setPaymentModalOpen(false)}>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              submitPayment();
            }}
          >
            <div>
              <label className="block text-sm text-ink-secondary">Name</label>
              <input
                value={payName}
                onChange={(e) => setPayName(e.target.value)}
                placeholder="e.g. GCash, Visa, Cash"
                required
                autoFocus
                className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-ink-secondary">Type</label>
              <Select
                value={payType}
                onChange={(v) => setPayType(v)}
                options={PAYMENT_METHOD_TYPES.map((t) => ({ value: t, label: t }))}
                className="mt-1 w-full"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                className="text-sm px-4 py-2 rounded-md border border-line text-ink-secondary hover:bg-canvas transition-colors"
                onClick={() => setPaymentModalOpen(false)}
              >
                Cancel
              </button>
              <LoadingButton loading={paySubmitting} loadingLabel="Adding…" className="text-sm px-4 py-2">
                Add
              </LoadingButton>
            </div>
          </form>
        </Modal>
      )}

      {editingPayment && (
        <Modal title="Edit payment method" onClose={() => setEditingPayId(null)}>
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const check = paymentMethodSchema.safeParse({ name: editPayName, type: editPayType });
              if (!check.success) {
                toast.error(firstZodMessage(check.error));
                return;
              }
              setEditPaySubmitting(true);
              try {
                await vm.updatePaymentMethod(editingPayment.id, editPayName, editPayType);
                paymentPage.reset();
                setEditingPayId(null);
              } finally {
                setEditPaySubmitting(false);
              }
            }}
          >
            <div>
              <label className="block text-sm text-ink-secondary">Name</label>
              <input
                value={editPayName}
                onChange={(e) => setEditPayName(e.target.value)}
                required
                autoFocus
                className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-ink-secondary">Type</label>
              <Select
                value={editPayType}
                onChange={(v) => setEditPayType(v)}
                options={PAYMENT_METHOD_TYPES.map((t) => ({ value: t, label: t }))}
                className="mt-1 w-full"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                className="text-sm px-4 py-2 rounded-md border border-line text-ink-secondary hover:bg-canvas transition-colors"
                onClick={() => setEditingPayId(null)}
              >
                Cancel
              </button>
              <LoadingButton loading={editPaySubmitting} loadingLabel="Saving…" className="text-sm px-4 py-2">
                Save
              </LoadingButton>
            </div>
          </form>
        </Modal>
      )}

      {reasonModalOpen && (
        <Modal title="Add reason code" onClose={() => setReasonModalOpen(false)}>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              submitReason();
            }}
          >
            <div>
              <label className="block text-sm text-ink-secondary">Name</label>
              <input
                value={reasonName}
                onChange={(e) => setReasonName(e.target.value)}
                placeholder="e.g. Damaged item, Restock"
                required
                autoFocus
                className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-ink-secondary">Type</label>
              <Select
                value={reasonType}
                onChange={(v) => setReasonType(v)}
                options={ReasonOptions}
                className="mt-1 w-full"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                className="text-sm px-4 py-2 rounded-md border border-line text-ink-secondary hover:bg-canvas transition-colors"
                onClick={() => setReasonModalOpen(false)}
              >
                Cancel
              </button>
              <LoadingButton loading={reasonSubmitting} loadingLabel="Adding…" className="text-sm px-4 py-2">
                Add
              </LoadingButton>
            </div>
          </form>
        </Modal>
      )}

      {editingReason && (
        <Modal title="Edit reason code" onClose={() => setEditingReasonId(null)}>
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const check = reasonCodeSchema.safeParse({ label: editReasonName, type: editReasonType });
              if (!check.success) {
                toast.error(firstZodMessage(check.error));
                return;
              }
              setEditReasonSubmitting(true);
              try {
                await vm.updateReasonCode(editingReason.id, editReasonName, editReasonType);
                reasonPage.reset();
                setEditingReasonId(null);
              } finally {
                setEditReasonSubmitting(false);
              }
            }}
          >
            <div>
              <label className="block text-sm text-ink-secondary">Name</label>
              <input
                value={editReasonName}
                onChange={(e) => setEditReasonName(e.target.value)}
                required
                autoFocus
                className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-ink-secondary">Type</label>
              <Select
                value={editReasonType}
                onChange={(v) => setEditReasonType(v)}
                options={ReasonOptions}
                className="mt-1 w-full"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                className="text-sm px-4 py-2 rounded-md border border-line text-ink-secondary hover:bg-canvas transition-colors"
                onClick={() => setEditingReasonId(null)}
              >
                Cancel
              </button>
              <LoadingButton loading={editReasonSubmitting} loadingLabel="Saving…" className="text-sm px-4 py-2">
                Save
              </LoadingButton>
            </div>
          </form>
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

export default Configuration;