import { useState } from 'react';
import { useConfigViewModel } from '../viewModels/useConfigViewModel';
import PageLayout from '../../../shared/components/PageLayout';
import { ConfigurationSkeleton } from '../../../shared/components/Skeletons';
import ErrorState from '../../../shared/components/ErrorState';
import Select from '../../../shared/components/Select';
import Modal from '../../../shared/components/Modal';
import LoadingButton from '../../../shared/components/LoadingButton';
import ConfirmModal from '../../../shared/components/ConfirmModal';
import FieldError from '../../../shared/components/FieldError';
import TableEmptyState from '../../../shared/components/TableEmptyState';
import { useServerPagination } from '../../../shared/hooks/useServerPagination';
import Pagination from '../../../shared/components/Pagination';
import { useUrlSection } from '../../../shared/hooks/useUrlSection';
import { useResponsivePageSize } from '../../../shared/hooks/useResponsivePageSize';
import ViewportTable from '../../../shared/components/ViewportTable';
import { PAYMENT_METHOD_TYPES, type PaymentMethodType } from '../models/configTypes';
import { paymentMethodSchema, reasonCodeSchema } from '../../../shared/validation/schemas';
import { routeFieldError } from '../../../shared/validation/routeFieldError';
import { fetchPaymentMethodsPage, fetchReasonCodesPage } from '../models/configApi';

type ReasonType = 'refund' | 'inventory';

const buildFieldErrors = (error: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } }): Record<string, string> => {
  const fieldErrors = error.flatten().fieldErrors;
  const next: Record<string, string> = {};
  for (const [k, v] of Object.entries(fieldErrors)) {
    const key = k === 'label' ? 'name' : k;
    if (v && v[0]) next[key] = v[0];
  }
  return next;
};

const clearError = (errors: Record<string, string>, setErrors: (e: Record<string, string>) => void, field: string) => {
  if (!errors[field]) return;
  const next = { ...errors };
  delete next[field];
  setErrors(next);
};

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
  variant?: 'neutral' | 'danger' | 'success';
}> = ({ children, onClick, variant = 'neutral' }) => (
  <button
    type="button"
    onClick={onClick}
    className={`text-sm px-4 py-1.5 rounded-md border border-line transition-colors ${
      variant === 'danger'
        ? 'border-error bg-error text-white hover:opacity-90'
        : variant === 'success'
          ? 'border-success bg-success text-white hover:opacity-90'
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
    (page) => fetchPaymentMethodsPage(page, pageSize),
    pageSize,
    { fetchSize: pageSize, deps: [pageSize], queryKey: ['payment-methods', String(pageSize)] },
  );
  const reasonPage = useServerPagination(
    (page) => fetchReasonCodesPage(page, pageSize),
    pageSize,
    { fetchSize: pageSize, deps: [pageSize], queryKey: ['reason-codes', String(pageSize)] },
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

  const [payErrors, setPayErrors] = useState<Record<string, string>>({});
  const [editPayErrors, setEditPayErrors] = useState<Record<string, string>>({});
  const [reasonErrors, setReasonErrors] = useState<Record<string, string>>({});
  const [editReasonErrors, setEditReasonErrors] = useState<Record<string, string>>({});
  const [payError, setPayError] = useState<string | null>(null);
  const [editPayError, setEditPayError] = useState<string | null>(null);
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [editReasonError, setEditReasonError] = useState<string | null>(null);

  if (loading) return <ConfigurationSkeleton />;
  const loadError = vm.error ?? paymentPage.error ?? reasonPage.error;
  if (loadError) return <ErrorState message={loadError} />;

  const editingPayment = paymentPage.items.find((m) => m.id === editingPayId);
  const editingReason = reasonPage.items.find((r) => r.id === editingReasonId);

  const openAddPayment = () => {
    setPayName('');
    setPayType('Other');
    setPayErrors({});
    setPayError(null);
    setPaymentModalOpen(true);
  };

  const openAddReason = () => {
    setReasonName('');
    setReasonType('refund');
    setReasonErrors({});
    setReasonError(null);
    setReasonModalOpen(true);
  };

  const submitPayment = async () => {
    const check = paymentMethodSchema.safeParse({ name: payName, type: payType });
    if (!check.success) {
      setPayErrors(buildFieldErrors(check.error));
      return;
    }
    setPayErrors({});
    setPayError(null);
    setPaySubmitting(true);
    try {
      await vm.createPaymentMethod(payName, payType);
      paymentPage.reset();
      setPaymentModalOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add payment method';
      const field = routeFieldError(message, ['name', 'type']);
      if (field) setPayErrors((prev) => ({ ...prev, [field]: message }));
      else setPayError(message);
    } finally {
      setPaySubmitting(false);
    }
  };

  const submitReason = async () => {
    const check = reasonCodeSchema.safeParse({ label: reasonName, type: reasonType });
    if (!check.success) {
      setReasonErrors(buildFieldErrors(check.error));
      return;
    }
    setReasonErrors({});
    setReasonError(null);
    setReasonSubmitting(true);
    try {
      await vm.createReasonCode(reasonName, reasonType);
      reasonPage.reset();
      setReasonModalOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add reason code';
      const field = routeFieldError(message, ['name', 'type']);
      if (field) setReasonErrors((prev) => ({ ...prev, [field]: message }));
      else setReasonError(message);
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
                              setEditPayErrors({});
                              setEditPayError(null);
                            }}
                          >
                            Edit
                          </ActionButton>
                          <ActionButton
                            variant={m.isActive ? 'danger' : 'success'}
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
                              setEditReasonErrors({});
                              setEditReasonError(null);
                            }}
                          >
                            Edit
                          </ActionButton>
                          <ActionButton
                            variant={r.isActive ? 'danger' : 'success'}
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
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              submitPayment();
            }}
          >
            <div>
              <label className="block text-sm text-ink-secondary">Name</label>
              <input
                value={payName}
                onChange={(e) => {
                  setPayName(e.target.value);
                  clearError(payErrors, setPayErrors, 'name');
                }}
                placeholder="e.g. GCash, Visa, Cash"
                required
                autoFocus
                className={`mt-1 w-full rounded-md px-3 py-2 text-sm border ${
                  payErrors.name ? 'border-error' : 'border-line focus:border-brand focus:outline-none'
                }`}
              />
              <FieldError message={payErrors.name} />
            </div>
            <div>
              <label className="block text-sm text-ink-secondary">Type</label>
              <Select
                value={payType}
                onChange={(v) => {
                  setPayType(v);
                  clearError(payErrors, setPayErrors, 'type');
                }}
                options={PAYMENT_METHOD_TYPES.map((t) => ({ value: t, label: t }))}
                className="mt-1 w-full"
                invalid={Boolean(payErrors.type)}
              />
              <FieldError message={payErrors.type} />
            </div>
            <FieldError message={payError} />
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
            noValidate
            onSubmit={async (e) => {
              e.preventDefault();
              const check = paymentMethodSchema.safeParse({ name: editPayName, type: editPayType });
              if (!check.success) {
                setEditPayErrors(buildFieldErrors(check.error));
                return;
              }
              setEditPayErrors({});
              setEditPayError(null);
              setEditPaySubmitting(true);
              try {
                await vm.updatePaymentMethod(editingPayment.id, editPayName, editPayType);
                paymentPage.reset();
                setEditingPayId(null);
              } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to save payment method';
                const field = routeFieldError(message, ['name', 'type']);
                if (field) setEditPayErrors((prev) => ({ ...prev, [field]: message }));
                else setEditPayError(message);
              } finally {
                setEditPaySubmitting(false);
              }
            }}
          >
            <div>
              <label className="block text-sm text-ink-secondary">Name</label>
              <input
                value={editPayName}
                onChange={(e) => {
                  setEditPayName(e.target.value);
                  clearError(editPayErrors, setEditPayErrors, 'name');
                }}
                required
                autoFocus
                className={`mt-1 w-full rounded-md px-3 py-2 text-sm border ${
                  editPayErrors.name ? 'border-error' : 'border-line focus:border-brand focus:outline-none'
                }`}
              />
              <FieldError message={editPayErrors.name} />
            </div>
            <div>
              <label className="block text-sm text-ink-secondary">Type</label>
              <Select
                value={editPayType}
                onChange={(v) => {
                  setEditPayType(v);
                  clearError(editPayErrors, setEditPayErrors, 'type');
                }}
                options={PAYMENT_METHOD_TYPES.map((t) => ({ value: t, label: t }))}
                className="mt-1 w-full"
                invalid={Boolean(editPayErrors.type)}
              />
              <FieldError message={editPayErrors.type} />
            </div>
            <FieldError message={editPayError} />
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
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              submitReason();
            }}
          >
            <div>
              <label className="block text-sm text-ink-secondary">Name</label>
              <input
                value={reasonName}
                onChange={(e) => {
                  setReasonName(e.target.value);
                  clearError(reasonErrors, setReasonErrors, 'name');
                }}
                placeholder="e.g. Damaged item, Restock"
                required
                autoFocus
                className={`mt-1 w-full rounded-md px-3 py-2 text-sm border ${
                  reasonErrors.name ? 'border-error' : 'border-line focus:border-brand focus:outline-none'
                }`}
              />
              <FieldError message={reasonErrors.name} />
            </div>
            <div>
              <label className="block text-sm text-ink-secondary">Type</label>
              <Select
                value={reasonType}
                onChange={(v) => {
                  setReasonType(v);
                  clearError(reasonErrors, setReasonErrors, 'type');
                }}
                options={ReasonOptions}
                className="mt-1 w-full"
                invalid={Boolean(reasonErrors.type)}
              />
              <FieldError message={reasonErrors.type} />
            </div>
            <FieldError message={reasonError} />
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
            noValidate
            onSubmit={async (e) => {
              e.preventDefault();
              const check = reasonCodeSchema.safeParse({ label: editReasonName, type: editReasonType });
              if (!check.success) {
                setEditReasonErrors(buildFieldErrors(check.error));
                return;
              }
              setEditReasonErrors({});
              setEditReasonError(null);
              setEditReasonSubmitting(true);
              try {
                await vm.updateReasonCode(editingReason.id, editReasonName, editReasonType);
                reasonPage.reset();
                setEditingReasonId(null);
              } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to save reason code';
                const field = routeFieldError(message, ['name', 'type']);
                if (field) setEditReasonErrors((prev) => ({ ...prev, [field]: message }));
                else setEditReasonError(message);
              } finally {
                setEditReasonSubmitting(false);
              }
            }}
          >
            <div>
              <label className="block text-sm text-ink-secondary">Name</label>
              <input
                value={editReasonName}
                onChange={(e) => {
                  setEditReasonName(e.target.value);
                  clearError(editReasonErrors, setEditReasonErrors, 'name');
                }}
                required
                autoFocus
                className={`mt-1 w-full rounded-md px-3 py-2 text-sm border ${
                  editReasonErrors.name ? 'border-error' : 'border-line focus:border-brand focus:outline-none'
                }`}
              />
              <FieldError message={editReasonErrors.name} />
            </div>
            <div>
              <label className="block text-sm text-ink-secondary">Type</label>
              <Select
                value={editReasonType}
                onChange={(v) => {
                  setEditReasonType(v);
                  clearError(editReasonErrors, setEditReasonErrors, 'type');
                }}
                options={ReasonOptions}
                className="mt-1 w-full"
                invalid={Boolean(editReasonErrors.type)}
              />
              <FieldError message={editReasonErrors.type} />
            </div>
            <FieldError message={editReasonError} />
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