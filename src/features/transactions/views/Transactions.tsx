import { useState } from 'react';
import type { RefundStatus } from '../models/transactionTypes';
import { useTransactionsViewModel } from '../viewModels/useTransactionsViewModel';
import TransactionDetail from './TransactionDetail';
import PageLayout from '../../../shared/components/PageLayout';
import LoadingState from '../../../shared/components/LoadingState';
import ErrorState from '../../../shared/components/ErrorState';
import { formatAmount } from '../../../shared/utils/formatCurrency';
import Select from '../../../shared/components/Select';
import { useAuth } from '../../../features/auth/hooks/useAuth';

const statusChip: Record<RefundStatus, string> = {
  pending_approval: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-blue-100 text-blue-700',
  denied: 'bg-red-100 text-red-700',
  completed: 'bg-green-100 text-green-700',
};

const NewRefundForm: React.FC<{
  transactionId: string;
  maxAmount: number;
  reasonCodes: { id: string; name: string }[];
  onSubmit: (input: { transactionId: string; amount: number; reasonId: string }) => Promise<void>;
}> = ({ transactionId, maxAmount, reasonCodes, onSubmit }) => {
  const [amount, setAmount] = useState(String(maxAmount));
  const [reasonId, setReasonId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(amount);
    if (!value || value <= 0 || value > maxAmount) {
      setError(`Amount must be between 0.01 and ${formatAmount(maxAmount)}`);
      return;
    }
    if (!reasonId) {
      setError('Select a reason');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({ transactionId, amount: value, reasonId });
      setReasonId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create refund');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-4 border-t pt-4 space-y-3">
      <h4 className="font-semibold text-gray-900">Process Refund</h4>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-sm text-gray-600">Amount</label>
          <input
            type="number"
            min="0.01"
            max={maxAmount}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="mt-1 w-full rounded border border-gray-300 px-3 py-1"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm text-gray-600">Reason</label>
          <Select
            value={reasonId}
            onChange={(v) => setReasonId(v)}
            options={reasonCodes.map((r) => ({ value: r.id, label: r.name }))}
            placeholder="Select reason"
            className="mt-1 w-full"
          />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={submitting} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
        {submitting ? 'Creating…' : 'Create Refund'}
      </button>
    </form>
  );
};

const RefundActions: React.FC<{
  status: RefundStatus;
  paymentMethods: { id: string; name: string }[];
  onApprove: () => Promise<void>;
  onDeny: () => Promise<void>;
  onComplete: (paymentMethodId: string, paymentMethodName: string) => Promise<void>;
}> = ({ status, paymentMethods, onApprove, onDeny, onComplete }) => {
  const [paymentMethodId, setPaymentMethodId] = useState(paymentMethods[0]?.id ?? '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  if (status === 'pending_approval') {
    return (
      <div className="flex items-center gap-2">
        <button
          className="text-xs px-3 py-1 rounded bg-green-100 text-green-700 disabled:opacity-50"
          disabled={busy}
          onClick={() => run(onApprove)}
        >
          Approve
        </button>
        <button
          className="text-xs px-3 py-1 rounded bg-red-100 text-red-700 disabled:opacity-50"
          disabled={busy}
          onClick={() => run(onDeny)}
        >
          Deny
        </button>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    );
  }

  if (status === 'approved') {
    return (
      <div className="flex items-center gap-2">
        <Select
          value={paymentMethodId}
          onChange={(v) => setPaymentMethodId(v)}
          options={paymentMethods.map((m) => ({ value: m.id, label: m.name }))}
          className="w-40"
        />
        <button
          className="text-xs px-3 py-1 rounded bg-green-100 text-green-700 disabled:opacity-50"
          disabled={busy}
          onClick={() => {
            const method = paymentMethods.find((m) => m.id === paymentMethodId);
            run(() => onComplete(method?.id ?? '', method?.name ?? ''));
          }}
        >
          Complete
        </button>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    );
  }

  return null;
};

const Transactions: React.FC = () => {
  const vm = useTransactionsViewModel();
  const { session } = useAuth();
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'history' | 'refunds'>('history');
  const { isOwner } = useAuthContextRole();

  const selectedTx = vm.transactions.find((t) => t.id === selectedTxId);
  const approvedByName = session ? `${session.firstName} ${session.lastName}`.trim() : 'Staff';

  if (vm.isLoading) return <LoadingState />;
  if (vm.error) return <ErrorState message={vm.error} />;

  const refundReasonCodes = vm.reasonCodes.filter((r) => r.type === 'refund' && r.isActive);

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
              <div className="bg-white rounded-lg shadow p-6">
                <TransactionDetail transaction={selectedTx} />
                {isOwner && (
                  <NewRefundForm
                    transactionId={selectedTx.id}
                    maxAmount={selectedTx.total}
                    reasonCodes={refundReasonCodes}
                    onSubmit={vm.createRefund}
                  />
                )}
              </div>
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
                <th>Status</th>
                <th>Date</th>
                {isOwner && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {vm.refunds.map((r) => (
                <tr key={r.id} className="border-b align-top">
                  <td className="py-2">{r.id}</td>
                  <td>{r.transactionId}</td>
                  <td>${formatAmount(r.amount)}</td>
                  <td>{r.reasonCode}</td>
                  <td>
                    <span className={`text-xs px-2 py-1 rounded ${statusChip[r.status]}`}>
                      {r.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>{new Date(r.refundedAt).toLocaleString()}</td>
                  {isOwner && (
                    <td className="py-2">
                      <RefundActions
                        status={r.status}
                        paymentMethods={vm.paymentMethods}
                        onApprove={() => vm.approveRefund(r.id, approvedByName)}
                        onDeny={() => vm.denyRefund(r.id, approvedByName)}
                        onComplete={(a, b) => vm.completeRefund(r.id, a, b, r.amount)}
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageLayout>
  );
};

const useAuthContextRole = () => {
  const { session } = useAuth();
  return { isOwner: session?.role === 'owner' };
};

export default Transactions;