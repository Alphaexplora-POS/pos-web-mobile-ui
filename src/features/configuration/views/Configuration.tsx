import { useState } from 'react';
import { useConfigViewModel } from '../viewModels/useConfigViewModel';
import PageLayout from '../../../shared/components/PageLayout';
import LoadingState from '../../../shared/components/LoadingState';
import ErrorState from '../../../shared/components/ErrorState';

const Configuration: React.FC = () => {
  const vm = useConfigViewModel();
  const [payName, setPayName] = useState('');
  const [reasonName, setReasonName] = useState('');
  const [reasonType, setReasonType] = useState<'refund' | 'inventory'>('refund');

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
              vm.createPaymentMethod(payName);
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
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Add
            </button>
          </form>
          <div className="space-y-2">
            {vm.paymentMethods.map((m) => (
              <div key={m.id} className="flex items-center justify-between border rounded p-3">
                <span className="text-gray-800 font-medium">{m.name}</span>
                <button
                  className={`text-sm px-3 py-1 rounded ${m.isActive ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
                  onClick={() => vm.togglePaymentMethod(m.id, !m.isActive)}
                >
                  {m.isActive ? 'Deactivate' : 'Reactivate'}
                </button>
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
                <div>
                  <span className="text-gray-800 font-medium">{r.name}</span>
                  <span className="ml-2 text-xs px-2 py-1 rounded bg-gray-100 text-gray-500">
                    {r.type}
                  </span>
                </div>
                <button
                  className={`text-sm px-3 py-1 rounded ${r.isActive ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
                  onClick={() => vm.toggleReasonCode(r.id, !r.isActive)}
                >
                  {r.isActive ? 'Deactivate' : 'Reactivate'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Configuration;
