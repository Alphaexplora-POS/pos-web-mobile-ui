import { useState } from 'react';
import { useConfigViewModel } from '../viewModels/useConfigViewModel';
import PageLayout from '../../../shared/components/PageLayout';
import LoadingState from '../../../shared/components/LoadingState';
import ErrorState from '../../../shared/components/ErrorState';
import { PAYMENT_METHOD_TYPES, type PaymentMethodType } from '../models/configTypes';

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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h2>
          <form
            className="flex gap-2 mb-4"
            onSubmit={(e) => {
              e.preventDefault();
              vm.createPaymentMethod(payName, payType);
              setPayName('');
            }}
          >
            <input
              placeholder="Payment method name"
              value={payName}
              onChange={(e) => setPayName(e.target.value)}
              required
              className="flex-1 rounded border border-gray-300 px-3 py-2"
            />
            <select
              value={payType}
              onChange={(e) => setPayType(e.target.value as PaymentMethodType)}
              className="rounded border border-gray-300 px-3 py-2"
            >
              {PAYMENT_METHOD_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
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
                      vm.updatePaymentMethod(m.id, editPayName, editPayType);
                      setEditingPaymentId(null);
                    }}
                  >
                    <input
                      value={editPayName}
                      onChange={(e) => setEditPayName(e.target.value)}
                      required
                      className="flex-1 rounded border border-gray-300 px-3 py-2"
                    />
                    <select
                      value={editPayType}
                      onChange={(e) => setEditPayType(e.target.value as PaymentMethodType)}
                      className="rounded border border-gray-300 px-3 py-2"
                    >
                      {PAYMENT_METHOD_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className="text-sm px-3 py-1 rounded bg-blue-600 text-white">
                      Save
                    </button>
                    <button
                      type="button"
                      className="text-sm px-3 py-1 rounded bg-gray-100 text-gray-600"
                      onClick={() => setEditingPaymentId(null)}
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-800 font-medium">{m.name}</span>
                      <span className="ml-2 text-xs px-2 py-1 rounded bg-gray-100 text-gray-500">
                        {m.type}
                      </span>
                      <button
                        className="text-sm px-3 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
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
                      className={`text-sm px-3 py-1 rounded ${m.isActive ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Reason Codes</h2>
          <form
            className="flex gap-2 mb-4"
            onSubmit={(e) => {
              e.preventDefault();
              vm.createReasonCode(reasonName, reasonType);
              setReasonName('');
            }}
          >
            <input
              placeholder="Reason code name"
              value={reasonName}
              onChange={(e) => setReasonName(e.target.value)}
              required
              className="flex-1 rounded border border-gray-300 px-3 py-2"
            />
            <select
              value={reasonType}
              onChange={(e) => setReasonType(e.target.value as 'refund' | 'inventory')}
              className="rounded border border-gray-300 px-3 py-2"
            >
              <option value="refund">Refund</option>
              <option value="inventory">Inventory</option>
            </select>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
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
                      vm.updateReasonCode(r.id, editReasonName, editReasonType);
                      setEditingReasonId(null);
                    }}
                  >
                    <input
                      value={editReasonName}
                      onChange={(e) => setEditReasonName(e.target.value)}
                      required
                      className="flex-1 rounded border border-gray-300 px-3 py-2"
                    />
                    <select
                      value={editReasonType}
                      onChange={(e) => setEditReasonType(e.target.value as 'refund' | 'inventory')}
                      className="rounded border border-gray-300 px-3 py-2"
                    >
                      <option value="refund">Refund</option>
                      <option value="inventory">Inventory</option>
                    </select>
                    <button type="submit" className="text-sm px-3 py-1 rounded bg-blue-600 text-white">
                      Save
                    </button>
                    <button
                      type="button"
                      className="text-sm px-3 py-1 rounded bg-gray-100 text-gray-600"
                      onClick={() => setEditingReasonId(null)}
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-800 font-medium">{r.name}</span>
                      <span className="ml-2 text-xs px-2 py-1 rounded bg-gray-100 text-gray-500">
                        {r.type}
                      </span>
                      <button
                        className="text-sm px-3 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
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
                      className={`text-sm px-3 py-1 rounded ${r.isActive ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
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
