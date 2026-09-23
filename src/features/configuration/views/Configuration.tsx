import { useState } from 'react';
import { toast } from 'sonner';
import { useConfigViewModel } from '../viewModels/useConfigViewModel';
import PageLayout from '../../../shared/components/PageLayout';
import LoadingState from '../../../shared/components/LoadingState';
import ErrorState from '../../../shared/components/ErrorState';
import Select from '../../../shared/components/Select';
import { PAYMENT_METHOD_TYPES, type PaymentMethodType } from '../models/configTypes';
import { paymentMethodSchema, reasonCodeSchema, firstZodMessage } from '../../../shared/validation/schemas';

const Configuration: React.FC = () => {
  const vm = useConfigViewModel();
  const [payName, setPayName] = useState('');
  const [payType, setPayType] = useState<PaymentMethodType>('Other');
  const [reasonName, setReasonName] = useState('');
  const [reasonType, setReasonType] = useState<'refund' | 'inventory'>('refund');
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editPayName, setEditPayName] = useState('');
  const [editPayType, setEditPayType] = useState<PaymentMethodType>('Other');
  const [editingReasonId, setEditingReasonId] = useState<string | null>(null);
  const [editReasonName, setEditReasonName] = useState('');
  const [editReasonType, setEditReasonType] = useState<'refund' | 'inventory'>('refund');

  if (vm.isLoading) return <LoadingState />;
  if (vm.error) return <ErrorState message={vm.error} />;

  return (
    <PageLayout title="Configuration">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-ink-primary mb-4">Payment Methods</h2>
          <form
            className="flex gap-2 mb-4"
            onSubmit={(e) => {
              e.preventDefault();
              const check = paymentMethodSchema.safeParse({ name: payName, type: payType });
              if (!check.success) {
                toast.error(firstZodMessage(check.error));
                return;
              }
              vm.createPaymentMethod(payName, payType);
              setPayName('');
            }}
          >
            <input
              placeholder="Payment method name"
              value={payName}
              onChange={(e) => setPayName(e.target.value)}
              required
              className="flex-1 rounded border border-line px-3 py-2"
            />
            <Select
              value={payType}
              onChange={(v) => setPayType(v)}
              options={PAYMENT_METHOD_TYPES.map((t) => ({ value: t, label: t }))}
              className="w-36 shrink-0"
            />
            <button type="submit" className="bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark">
              Add
            </button>
          </form>
          <div className="space-y-2">
            {vm.paymentMethods.map((m) => (
              <div key={m.id} className="flex items-center justify-between border rounded p-3">
                {editingPaymentId === m.id ? (
                  <form
                    className="flex items-center gap-2 flex-1"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const check = paymentMethodSchema.safeParse({ name: editPayName, type: editPayType });
                      if (!check.success) {
                        toast.error(firstZodMessage(check.error));
                        return;
                      }
                      vm.updatePaymentMethod(m.id, editPayName, editPayType);
                      setEditingPaymentId(null);
                    }}
                  >
                    <input
                      value={editPayName}
                      onChange={(e) => setEditPayName(e.target.value)}
                      required
                      className="flex-1 rounded border border-line px-3 py-2"
                    />
                    <Select
                      value={editPayType}
                      onChange={(v) => setEditPayType(v)}
                      options={PAYMENT_METHOD_TYPES.map((t) => ({ value: t, label: t }))}
                      className="w-36 shrink-0"
                    />
                    <button type="submit" className="text-sm px-3 py-1 rounded bg-brand text-white">
                      Save
                    </button>
                    <button
                      type="button"
                      className="text-sm px-3 py-1 rounded bg-surface-hover text-ink-secondary"
                      onClick={() => setEditingPaymentId(null)}
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-ink-primary font-medium">{m.name}</span>
                      <span className="ml-2 text-xs px-2 py-1 rounded bg-surface-hover text-ink-muted">
                        {m.type}
                      </span>
                      <button
                        className="text-sm px-3 py-1 rounded bg-surface-hover text-ink-secondary hover:bg-surface-hover"
                        onClick={() => {
                          setEditingPaymentId(m.id);
                          setEditPayName(m.name);
                          setEditPayType(m.type as PaymentMethodType);
                        }}
                      >
                        Edit
                      </button>
                    </div>
                    <button
                      className={`text-sm px-3 py-1 rounded ${m.isActive ? 'bg-error/10 text-error' : 'bg-success-light text-success'}`}
                      onClick={() => vm.togglePaymentMethod(m.id, !m.isActive)}
                    >
                      {m.isActive ? 'Deactivate' : 'Reactivate'}
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-ink-primary mb-4">Reason Codes</h2>
          <form
            className="flex gap-2 mb-4"
            onSubmit={(e) => {
              e.preventDefault();
              const check = reasonCodeSchema.safeParse({ label: reasonName, type: reasonType });
              if (!check.success) {
                toast.error(firstZodMessage(check.error));
                return;
              }
              vm.createReasonCode(reasonName, reasonType);
              setReasonName('');
            }}
          >
            <input
              placeholder="Reason code name"
              value={reasonName}
              onChange={(e) => setReasonName(e.target.value)}
              required
              className="flex-1 rounded border border-line px-3 py-2"
            />
            <Select
              value={reasonType}
              onChange={(v) => setReasonType(v)}
              options={[
                { value: 'refund' as const, label: 'Refund' },
                { value: 'inventory' as const, label: 'Inventory' },
              ]}
              className="w-32 shrink-0"
            />
            <button type="submit" className="bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark">
              Add
            </button>
          </form>
          <div className="space-y-2">
            {vm.reasonCodes.map((r) => (
              <div key={r.id} className="flex items-center justify-between border rounded p-3">
                {editingReasonId === r.id ? (
                  <form
                    className="flex items-center gap-2 flex-1"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const check = reasonCodeSchema.safeParse({ label: editReasonName, type: editReasonType });
                      if (!check.success) {
                        toast.error(firstZodMessage(check.error));
                        return;
                      }
                      vm.updateReasonCode(r.id, editReasonName, editReasonType);
                      setEditingReasonId(null);
                    }}
                  >
                    <input
                      value={editReasonName}
                      onChange={(e) => setEditReasonName(e.target.value)}
                      required
                      className="flex-1 rounded border border-line px-3 py-2"
                    />
                    <Select
                      value={editReasonType}
                      onChange={(v) => setEditReasonType(v)}
                      options={[
                        { value: 'refund' as const, label: 'Refund' },
                        { value: 'inventory' as const, label: 'Inventory' },
                      ]}
                      className="w-32 shrink-0"
                    />
                    <button type="submit" className="text-sm px-3 py-1 rounded bg-brand text-white">
                      Save
                    </button>
                    <button
                      type="button"
                      className="text-sm px-3 py-1 rounded bg-surface-hover text-ink-secondary"
                      onClick={() => setEditingReasonId(null)}
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-ink-primary font-medium">{r.name}</span>
                      <span className="ml-2 text-xs px-2 py-1 rounded bg-surface-hover text-ink-muted">
                        {r.type}
                      </span>
                      <button
                        className="text-sm px-3 py-1 rounded bg-surface-hover text-ink-secondary hover:bg-surface-hover"
                        onClick={() => {
                          setEditingReasonId(r.id);
                          setEditReasonName(r.name);
                          setEditReasonType(r.type);
                        }}
                      >
                        Edit
                      </button>
                    </div>
                    <button
                      className={`text-sm px-3 py-1 rounded ${r.isActive ? 'bg-error/10 text-error' : 'bg-success-light text-success'}`}
                      onClick={() => vm.toggleReasonCode(r.id, !r.isActive)}
                    >
                      {r.isActive ? 'Deactivate' : 'Reactivate'}
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Configuration;
