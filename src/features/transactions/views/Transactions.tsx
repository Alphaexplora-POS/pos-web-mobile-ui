import { useState } from 'react';
import { useTransactionsViewModel } from '../viewModels/useTransactionsViewModel';
import TransactionDetail from './TransactionDetail';
import PageLayout from '../../../shared/components/PageLayout';
import LoadingState from '../../../shared/components/LoadingState';
import ErrorState from '../../../shared/components/ErrorState';
import { formatAmount } from '../../../shared/utils/formatCurrency';

const Transactions: React.FC = () => {
  const vm = useTransactionsViewModel();
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'history' | 'refunds'>('history');

  const selectedTx = vm.transactions.find((t) => t.id === selectedTxId);

  if (vm.isLoading) return <LoadingState />;
  if (vm.error) return <ErrorState message={vm.error} />;

  return (
    <PageLayout title="Transaction History">
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6 bg-white rounded-lg shadow p-4">
        <label className="block text-sm text-gray-600">Filter</label>
        <div className="flex gap-2">
          {(['today', 'week', 'month', 'custom'] as const).map((r) => (
            <button
              key={r}
              className={`px-3 py-1 rounded text-sm ${vm.range === r ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              onClick={() => vm.setRange(r)}
            >
              {r === 'today' ? 'Today' : r === 'week' ? 'Week' : r === 'month' ? 'Month' : 'Custom'}
            </button>
          ))}
        </div>
        {vm.range === 'custom' && (
          <div className="flex gap-2">
            <input
              type="date"
              value={vm.startDate}
              onChange={(e) => vm.setStartDate(e.target.value)}
              className="rounded border border-gray-300 px-2 py-1"
            />
            <input
              type="date"
              value={vm.endDate}
              onChange={(e) => vm.setEndDate(e.target.value)}
              className="rounded border border-gray-300 px-2 py-1"
            />
          </div>
        )}
      </div>

      <div className="flex gap-4 mb-6">
        <button
          className={`px-4 py-2 rounded ${activeTab === 'history' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border'}`}
          onClick={() => setActiveTab('history')}
        >
          Transactions
        </button>
        <button
          className={`px-4 py-2 rounded ${activeTab === 'refunds' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border'}`}
          onClick={() => setActiveTab('refunds')}
        >
          Refund History
        </button>
      </div>

      {activeTab === 'history' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-2">
            {vm.transactions.map((t) => (
              <div
                key={t.id}
                className={`p-3 rounded-lg border cursor-pointer ${selectedTxId === t.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                onClick={() => setSelectedTxId(t.id)}
              >
                <div className="flex justify-between">
                  <span className="font-medium text-gray-800">{t.branchName}</span>
                  <span className="text-sm font-semibold text-gray-900">${formatAmount(t.total)}</span>
                </div>
                <p className="text-xs text-gray-500">
                  {new Date(t.timestamp).toLocaleString()} · {t.paymentMethod}
                </p>
              </div>
            ))}
          </div>
          <div className="lg:col-span-2">
            {selectedTx ? (
              <TransactionDetail transaction={selectedTx} />
            ) : (
              <div className="bg-white rounded-lg shadow p-6 text-gray-400 text-center">
                Select a transaction to view details
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Refund History</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2">Refund</th>
                <th>Transaction</th>
                <th>Amount</th>
                <th>Reason</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {vm.refunds.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="py-2">{r.id}</td>
                  <td>{r.transactionId}</td>
                  <td>${formatAmount(r.amount)}</td>
                  <td>{r.reasonCode}</td>
                  <td>{new Date(r.refundedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageLayout>
  );
};

export default Transactions;
