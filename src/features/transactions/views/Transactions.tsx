import { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import type { RefundStatus } from '../models/transactionTypes';
import { useTransactionsViewModel } from '../viewModels/useTransactionsViewModel';
import TransactionDetail from './TransactionDetail';
import PageLayout from '../../../shared/components/PageLayout';
import { TransactionsSkeleton } from '../../../shared/components/Skeletons';
import ErrorState from '../../../shared/components/ErrorState';
import { formatAmount } from '../../../shared/utils/formatCurrency';
import Select from '../../../shared/components/Select';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { useRole } from '../../../shared/hooks/useRole';
import TableEmptyState from '../../../shared/components/TableEmptyState';
import { useMinimumLoading } from '../../../shared/hooks/useMinimumLoading';

const statusChip: Record<RefundStatus, string> = {
  pending_approval: 'bg-warning/10 text-warning',
  approved: 'bg-brand-light text-brand',
  denied: 'bg-error/10 text-error',
  completed: 'bg-success-light text-success',
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
      <h4 className="font-semibold text-ink-primary">Process Refund</h4>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-sm text-ink-secondary">Amount</label>
          <input
            type="number"
            min="0.01"
            max={maxAmount}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-line px-3 py-2"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm text-ink-secondary">Reason</label>
          <Select
            value={reasonId}
            onChange={(v) => setReasonId(v)}
            options={reasonCodes.map((r) => ({ value: r.id, label: r.name }))}
            placeholder="Select reason"
            className="mt-1 w-full"
          />
        </div>
      </div>
      {error && <p className="text-sm text-error">{error}</p>}
      <button type="submit" disabled={submitting} className="bg-brand text-white px-4 py-2 rounded-md hover:bg-brand-dark disabled:opacity-50 transition-colors">
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
          className="text-xs px-3 py-1 rounded-md bg-success-light text-success transition-colors disabled:opacity-50"
          disabled={busy}
          onClick={() => run(onApprove)}
        >
          Approve
        </button>
        <button
          className="text-xs px-3 py-1 rounded-md bg-error/10 text-error transition-colors disabled:opacity-50"
          disabled={busy}
          onClick={() => run(onDeny)}
        >
          Deny
        </button>
        {error && <span className="text-xs text-error">{error}</span>}
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
          className="text-xs px-3 py-1 rounded bg-success-light text-success disabled:opacity-50"
          disabled={busy}
          onClick={() => {
            const method = paymentMethods.find((m) => m.id === paymentMethodId);
            run(() => onComplete(method?.id ?? '', method?.name ?? ''));
          }}
        >
          Complete
        </button>
        {error && <span className="text-xs text-error">{error}</span>}
      </div>
    );
  }

  return null;
};

const Transactions: React.FC = () => {
  const vm = useTransactionsViewModel();
  const loading = useMinimumLoading(vm.isLoading);
  const { session } = useAuth();
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'history' | 'refunds'>('history');
  const { isOwner } = useRole();
  const [customDate, setCustomDate] = useState<Date | null>(null);

  const selectCustom = (date: Date) => {
    setCustomDate(date);
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    vm.setStartDate(`${yyyy}-${mm}-${dd}`);
    vm.setEndDate(`${yyyy}-${mm}-${dd}`);
  };

  const selectedTx = vm.transactions.find((t) => t.id === selectedTxId);
  const approvedByName = session ? `${session.firstName} ${session.lastName}`.trim() : 'Staff';

  if (loading) return <TransactionsSkeleton />;
  if (vm.error) return <ErrorState message={vm.error} />;

  const refundReasonCodes = vm.reasonCodes.filter((r) => r.type === 'refund' && r.isActive);

  return (
    <PageLayout title="Transaction History">
      <div className="mb-6 bg-white rounded-lg border border-line p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="inline-flex items-center gap-1 rounded-lg bg-canvas p-1">
            {(['today', 'week', 'month'] as const).map((r) => (
              <button
                key={r}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  vm.range === r
                    ? 'bg-brand text-white'
                    : 'text-ink-secondary hover:text-ink-primary hover:bg-white'
                }`}
                onClick={() => vm.setRange(r)}
              >
                {r === 'today' ? 'Today' : r === 'week' ? 'Week' : 'Month'}
              </button>
            ))}
          </div>
          <DatePicker
            selected={customDate}
            onChange={(date: Date | null) => {
              if (date) {
                vm.setRange('custom');
                selectCustom(date);
              }
            }}
            showYearDropdown
            showMonthDropdown
            dropdownMode="select"
            customInput={
              <button
                type="button"
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors inline-flex items-center gap-1.5 ${
                  vm.range === 'custom'
                    ? 'bg-brand text-white'
                    : 'bg-white border border-line text-ink-secondary hover:text-ink-primary'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Customize Date
              </button>
            }
          />
        </div>
      </div>

      <div className="mb-6 inline-flex items-center gap-1 rounded-lg border border-line bg-white p-1">
        <button
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'history'
              ? 'bg-brand text-white'
              : 'text-ink-secondary hover:text-ink-primary hover:bg-surface-hover'
          }`}
          onClick={() => setActiveTab('history')}
        >
          Transactions
        </button>
        <button
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'refunds'
              ? 'bg-brand text-white'
              : 'text-ink-secondary hover:text-ink-primary hover:bg-surface-hover'
          }`}
          onClick={() => setActiveTab('refunds')}
        >
          Refund History
        </button>
      </div>

      {activeTab === 'history' ? (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-line p-6">
            <h2 className="text-lg font-semibold text-ink-primary mb-4">
              Transactions
              <span className="ml-2 text-sm font-normal text-ink-muted">
                {vm.transactions.length} found
              </span>
            </h2>
            <div className="overflow-x-auto">
              {vm.transactions.length === 0 ? (
                <TableEmptyState message="No transactions in this period" />
              ) : (
              <table className="w-full text-base">
                <thead>
                  <tr className="bg-canvas border-b border-line">
                    <th className="py-3 pl-4 text-left font-semibold text-ink-muted">Branch</th>
                    <th className="py-3 text-left font-semibold text-ink-muted">Items</th>
                    <th className="py-3 text-left font-semibold text-ink-muted">Payment</th>
                    <th className="py-3 text-left font-semibold text-ink-muted">Date</th>
                    <th className="py-3 pr-4 text-left font-semibold text-ink-muted">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {vm.transactions.map((t) => (
                    <tr
                      key={t.id}
                      className={`border-b border-line last:border-0 cursor-pointer transition-colors ${
                        selectedTxId === t.id ? 'bg-brand-light' : 'hover:bg-canvas'
                      }`}
                      onClick={() => setSelectedTxId(t.id)}
                    >
                      <td className="py-3.5 pl-4 font-medium text-ink-primary">{t.branchName}</td>
                      <td className="py-3.5 text-ink-secondary">{t.items.length} items</td>
                      <td className="py-3.5 text-ink-secondary">{t.paymentMethod}</td>
                      <td className="py-3.5 text-ink-secondary">{new Date(t.timestamp).toLocaleString()}</td>
                      <td className="py-3.5 pr-4 font-semibold text-ink-primary">${formatAmount(t.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              )}
            </div>
          </div>

          {selectedTx && (
            <div className="flex-1 bg-white rounded-lg border border-line p-6">
              <div className="h-full flex flex-col">
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
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-line p-6">
          <h2 className="text-lg font-semibold text-ink-primary mb-4">Refund History</h2>
          <div className="overflow-x-auto">
            {vm.refunds.length === 0 ? (
                <TableEmptyState message="No refunds in this period" />
              ) : (
            <table className="w-full text-base">
              <thead>
                <tr className="bg-canvas border-b border-line">
                  <th className="py-3 pl-4 text-left font-semibold text-ink-muted">Refund</th>
                  <th className="py-3 text-left font-semibold text-ink-muted">Transaction</th>
                  <th className="py-3 text-left font-semibold text-ink-muted">Amount</th>
                  <th className="py-3 text-left font-semibold text-ink-muted">Reason</th>
                  <th className="py-3 text-left font-semibold text-ink-muted">Status</th>
                  <th className="py-3 text-left font-semibold text-ink-muted">Date</th>
                  {isOwner && <th className="py-3 pr-4 text-left font-semibold text-ink-muted">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {vm.refunds.map((r) => (
                  <tr key={r.id} className="border-b border-line last:border-0 hover:bg-canvas transition-colors align-top">
                    <td className="py-3.5 pl-4 font-mono text-sm">{r.id}</td>
                    <td className="py-3.5 font-mono text-sm">{r.transactionId}</td>
                    <td className="py-3.5 font-semibold text-ink-primary">${formatAmount(r.amount)}</td>
                    <td className="py-3.5">{r.reasonCode}</td>
                    <td className="py-3.5">
                      <span className={`text-sm px-3 py-1 rounded ${statusChip[r.status]}`}>
                        {r.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5">{new Date(r.refundedAt).toLocaleString()}</td>
                    {isOwner && (
                      <td className="py-3.5 pr-4">
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
            )}
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export default Transactions;
