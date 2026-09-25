import { useState } from 'react';
import { toast } from 'sonner';
import { useConfigViewModel } from '../viewModels/useConfigViewModel';
import PageLayout from '../../../shared/components/PageLayout';
import { ConfigurationSkeleton } from '../../../shared/components/Skeletons';
import ErrorState from '../../../shared/components/ErrorState';
import Select from '../../../shared/components/Select';
import Modal from '../../../shared/components/Modal';
import TableEmptyState from '../../../shared/components/TableEmptyState';
import { useMinimumLoading } from '../../../shared/hooks/useMinimumLoading';
import { PAYMENT_METHOD_TYPES, type PaymentMethodType } from '../models/configTypes';
import { paymentMethodSchema, reasonCodeSchema, firstZodMessage } from '../../../shared/validation/schemas';

type ReasonType = 'refund' | 'inventory';

const ReasonOptions: { value: ReasonType; label: string }[] = [
  { value: 'refund', label: 'Refund' },
  { value: 'inventory', label: 'Inventory' },
];

const StatusBadge: React.FC<{ isActive: boolean }> = ({ isActive }) => (
  <span
    className={`text-xs px-2 py-1 rounded ${
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
    className={`text-xs px-3 py-1.5 rounded-md border border-line transition-colors ${
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
  const loading = useMinimumLoading(vm.isLoading);
  const [activeSection, setActiveSection] = useState<'payment' | 'reasons'>('payment');

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

  if (loading) return <ConfigurationSkeleton />;
  if (vm.error) return <ErrorState message={vm.error} />;

  const editingPayment = vm.paymentMethods.find((m) => m.id === editingPayId);
  const editingReason = vm.reasonCodes.find((r) => r.id === editingReasonId);

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

  const submitPayment = () => {
    const check = paymentMethodSchema.safeParse({ name: payName, type: payType });
    if (!check.success) {
      toast.error(firstZodMessage(check.error));
      return;
    }
    vm.createPaymentMethod(payName, payType);
    setPaymentModalOpen(false);
  };

  const submitReason = () => {
    const check = reasonCodeSchema.safeParse({ label: reasonName, type: reasonType });
    if (!check.success) {
      toast.error(firstZodMessage(check.error));
      return;
    }
    vm.createReasonCode(reasonName, reasonType);
    setReasonModalOpen(false);
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

          <div className="overflow-x-auto">
            {vm.paymentMethods.length === 0 ? (
              <TableEmptyState message="No payment methods yet" />
            ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-canvas border-b border-line">
                  <th className="py-2.5 pl-3 text-left font-medium text-ink-muted">Name</th>
                  <th className="py-2.5 text-left font-medium text-ink-muted">Type</th>
                  <th className="py-2.5 text-left font-medium text-ink-muted">Status</th>
                  <th className="py-2.5 pr-3 text-right font-medium text-ink-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vm.paymentMethods.map((m) => (
                  <tr key={m.id} className="border-b border-line last:border-0 hover:bg-canvas transition-colors">
                    <td className="py-2.5 pl-3 font-medium text-ink-primary">{m.name}</td>
                    <td className="py-2.5 text-ink-secondary">{m.type}</td>
                    <td className="py-2.5">
                      <StatusBadge isActive={m.isActive} />
                    </td>
                    <td className="py-2.5 pr-3">
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
                          onClick={() => vm.togglePaymentMethod(m.id, !m.isActive)}
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

          <div className="overflow-x-auto">
            {vm.reasonCodes.length === 0 ? (
              <TableEmptyState message="No reason codes yet" />
            ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-canvas border-b border-line">
                  <th className="py-2.5 pl-3 text-left font-medium text-ink-muted">Name</th>
                  <th className="py-2.5 text-left font-medium text-ink-muted">Type</th>
                  <th className="py-2.5 text-left font-medium text-ink-muted">Status</th>
                  <th className="py-2.5 pr-3 text-right font-medium text-ink-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vm.reasonCodes.map((r) => (
                  <tr key={r.id} className="border-b border-line last:border-0 hover:bg-canvas transition-colors">
                    <td className="py-2.5 pl-3 font-medium text-ink-primary">{r.name}</td>
                    <td className="py-2.5 text-ink-secondary">{r.type}</td>
                    <td className="py-2.5">
                      <StatusBadge isActive={r.isActive} />
                    </td>
                    <td className="py-2.5 pr-3">
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
                          onClick={() => vm.toggleReasonCode(r.id, !r.isActive)}
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
              <button
                type="submit"
                className="text-sm px-4 py-2 rounded-md bg-brand text-white hover:bg-brand-dark transition-colors"
              >
                Add
              </button>
            </div>
          </form>
        </Modal>
      )}

      {editingPayment && (
        <Modal title="Edit payment method" onClose={() => setEditingPayId(null)}>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const check = paymentMethodSchema.safeParse({ name: editPayName, type: editPayType });
              if (!check.success) {
                toast.error(firstZodMessage(check.error));
                return;
              }
              vm.updatePaymentMethod(editingPayment.id, editPayName, editPayType);
              setEditingPayId(null);
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
              <button
                type="submit"
                className="text-sm px-4 py-2 rounded-md bg-brand text-white hover:bg-brand-dark transition-colors"
              >
                Save
              </button>
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
              <button
                type="submit"
                className="text-sm px-4 py-2 rounded-md bg-brand text-white hover:bg-brand-dark transition-colors"
              >
                Add
              </button>
            </div>
          </form>
        </Modal>
      )}

      {editingReason && (
        <Modal title="Edit reason code" onClose={() => setEditingReasonId(null)}>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const check = reasonCodeSchema.safeParse({ label: editReasonName, type: editReasonType });
              if (!check.success) {
                toast.error(firstZodMessage(check.error));
                return;
              }
              vm.updateReasonCode(editingReason.id, editReasonName, editReasonType);
              setEditingReasonId(null);
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
              <button
                type="submit"
                className="text-sm px-4 py-2 rounded-md bg-brand text-white hover:bg-brand-dark transition-colors"
              >
                Save
              </button>
            </div>
          </form>
        </Modal>
      )}
    </PageLayout>
  );
};

export default Configuration;