import { useState } from 'react';
import { toast } from 'sonner';
import type { InventoryAdjustAction, InventoryAdjustInput, InventoryItem } from '../models/inventoryTypes';
import { useInventoryViewModel } from '../viewModels/useInventoryViewModel';
import PageLayout from '../../../shared/components/PageLayout';
import LoadingState from '../../../shared/components/LoadingState';
import ErrorState from '../../../shared/components/ErrorState';
import Modal from '../../../shared/components/Modal';
import { useRole } from '../../../shared/hooks/useRole';
import Select from '../../../shared/components/Select';

const stockClass = (qty: number) => {
  if (qty <= 0) return 'text-error font-semibold';
  if (qty <= 5) return 'text-warning font-semibold';
  return 'text-success font-medium';
};

const AdjustStockForm: React.FC<{
  items: InventoryItem[];
  branches: { id: string; name: string }[];
  variants: { id: string; label: string }[];
  reasonCodes: { id: string; name: string }[];
  employees: { id: string; name: string }[];
  onAdjust: (input: InventoryAdjustInput) => Promise<void>;
}> = ({ items, branches, variants, reasonCodes, employees, onAdjust }) => {
  const [branchId, setBranchId] = useState('');
  const [variantId, setVariantId] = useState('');
  const [action, setAction] = useState<InventoryAdjustAction>('stock_in');
  const [quantity, setQuantity] = useState('');
  const [reasonId, setReasonId] = useState('');
  const [notes, setNotes] = useState('');
  const [performedBy, setPerformedBy] = useState(employees[0]?.id ?? '');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const branchOptions = branches.map((b) => ({ value: b.id, label: b.name }));

  const branchQuantity = new Map(
    items
      .filter((i) => i.branchId === branchId)
      .map((i) => [i.productVariantId, i.quantity]),
  );
  const selectedQuantity = variantId ? (branchQuantity.get(variantId) ?? 0) : null;

  const fail = (msg: string) => {
    setError(msg);
    toast.error(msg);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchId) {
      fail('Select a branch');
      return;
    }
    if (!variantId) {
      fail('Select an item');
      return;
    }
    if (!reasonId) {
      fail('Select a reason');
      return;
    }
    if (!performedBy) {
      fail('Select who performed the adjustment');
      return;
    }
    if (action === 'stock_in' || action === 'stock_out') {
      const qty = Number(quantity);
      if (!qty || qty <= 0) {
        fail('Quantity must be positive');
        return;
      }
      if (action === 'stock_out' && qty > (selectedQuantity ?? 0)) {
        fail(`Only ${selectedQuantity ?? 0} in stock at this branch`);
        return;
      }
    }
    setError(null);
    setSubmitting(true);
    try {
      await onAdjust({
        branchId,
        productVariantId: variantId,
        action,
        quantity: Number(quantity),
        reasonId,
        notes: notes || undefined,
        performedBy,
      });
      setVariantId('');
      setQuantity('');
      setReasonId('');
      setNotes('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to adjust stock');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-ink-secondary">Branch</label>
          <Select
            value={branchId}
            onChange={(v) => {
              setBranchId(v);
              setVariantId('');
            }}
            options={branchOptions}
            placeholder="Select branch"
            className="mt-1 w-full"
          />
        </div>
        <div>
          <label className="block text-sm text-ink-secondary">Item</label>
          <Select
            value={variantId}
            onChange={(v) => setVariantId(v)}
            options={variants.map((v) => {
              const qty = branchQuantity.get(v.id);
              return {
                value: v.id,
                label: qty === undefined ? `${v.label} · no stock yet` : `${v.label} · (${qty})`,
              };
            })}
            placeholder={branchId ? 'Select item' : 'Select branch first'}
            className="mt-1 w-full"
          />
        </div>
        <div>
          <label className="block text-sm text-ink-secondary">Action</label>
          <Select
            value={action}
            onChange={(v) => setAction(v)}
            options={[
              { value: 'stock_in' as const, label: 'Stock In (restock)' },
              { value: 'stock_out' as const, label: 'Stock Out (write-off)' },
              { value: 'adjustment' as const, label: 'Set Quantity' },
            ]}
            className="mt-1 w-full"
          />
        </div>
        <div>
          <label className="block text-sm text-ink-secondary">Quantity</label>
          <input
            type="number"
            min="0"
            step="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            className="mt-1 w-full rounded border border-line px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm text-ink-secondary">Reason</label>
          <Select
            value={reasonId}
            onChange={(v) => setReasonId(v)}
            options={reasonCodes.map((r) => ({ value: r.id, label: r.name }))}
            placeholder="Select reason"
            className="mt-1 w-full"
          />
        </div>
        <div>
          <label className="block text-sm text-ink-secondary">Performed By</label>
          <Select
            value={performedBy}
            onChange={(v) => setPerformedBy(v)}
            options={employees.map((emp) => ({ value: emp.id, label: emp.name }))}
            placeholder="Select employee"
            className="mt-1 w-full"
          />
        </div>
        <div>
          <label className="block text-sm text-ink-secondary">Notes</label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 w-full rounded border border-line px-3 py-2"
          />
        </div>
      </div>
      {error && <p className="text-sm text-error mt-3">{error}</p>}
      <button type="submit" disabled={submitting} className="mt-4 bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark disabled:opacity-50">
        {submitting ? 'Adjusting…' : 'Apply Adjustment'}
      </button>
    </form>
  );
};

const GlobalInventory: React.FC = () => {
  const { isOwner } = useRole();
  const vm = useInventoryViewModel(isOwner);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);

  if (vm.isLoading) return <LoadingState />;
  if (vm.error) return <ErrorState message={vm.error} />;

  const inventoryReasonCodes = vm.reasonCodes.filter((r) => r.type === 'inventory' && r.isActive);
  const employees = vm.employees.filter((e) => e.isActive);

  return (
    <PageLayout title={isOwner ? 'Global Inventory' : 'Branch Inventory'}>
      <div className="space-y-6">
        {isOwner && (
          <div className="bg-white rounded-lg shadow p-4">
            <label className="block text-sm text-ink-secondary mb-2">View Stock</label>
            <Select
              value={vm.selectedBranchId ?? ''}
              onChange={(v) => vm.setSelectedBranchId(v || null)}
              options={[
                { value: '', label: 'All Branches (Combined)' },
                ...vm.branches.map((b) => ({ value: b.id, label: b.name })),
              ]}
              className="w-full md:w-64"
            />
            <p className="text-xs text-ink-muted mt-2">
              Combined stock across all branches with per-branch drilldown.
            </p>
          </div>
        )}

        <button
          className="bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark"
          onClick={() => setAdjustModalOpen(true)}
        >
          Adjust Stock
        </button>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-ink-primary mb-4">
            {vm.selectedBranchId
              ? vm.branches.find((b) => b.id === vm.selectedBranchId)?.name
              : isOwner
              ? 'Combined Stock'
              : 'Your Branch Stock'}
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-muted border-b">
                <th className="py-2">Product</th>
                <th>SKU</th>
                {isOwner && <th>Branch</th>}
                <th>Quantity</th>
                <th>Origin</th>
              </tr>
            </thead>
            <tbody>
              {vm.items.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="py-2">{item.productName}</td>
                  <td>{item.variantSku}</td>
                  {isOwner && <td>{item.branchName}</td>}
                  <td className={stockClass(item.quantity)}>{item.quantity}</td>
                  <td>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        item.origin === 'automatic'
                          ? 'bg-surface-hover text-ink-secondary'
                          : 'bg-brand-light text-brand'
                      }`}
                    >
                      {item.origin === 'automatic' ? 'Auto (Variant)' : 'Manual'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-ink-primary mb-4">Audit Log</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-muted border-b">
                <th className="py-2">Product</th>
                <th>SKU</th>
                {isOwner && <th>Branch</th>}
                <th>Action</th>
                <th>Delta</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {vm.auditLogs.map((log) => (
                <tr key={log.id} className="border-b">
                  <td className="py-2">{log.productName}</td>
                  <td>{log.variantSku}</td>
                  {isOwner && <td>{log.branchName}</td>}
                  <td>{log.action}</td>
                  <td>{log.quantityDelta}</td>
                  <td>{new Date(log.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {adjustModalOpen && (
        <Modal title="Adjust Stock" onClose={() => setAdjustModalOpen(false)}>
          <AdjustStockForm
            items={vm.combinedItems}
            branches={
              isOwner ? vm.branches : vm.branches.filter((b) => b.id === vm.selectedBranchId)
            }
            variants={vm.variants}
            reasonCodes={inventoryReasonCodes}
            employees={employees}
            onAdjust={vm.adjustStock}
          />
        </Modal>
      )}
    </PageLayout>
  );
};

export default GlobalInventory;