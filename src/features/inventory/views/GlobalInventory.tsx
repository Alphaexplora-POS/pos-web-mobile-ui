import { useState } from 'react';
import { toast } from 'sonner';
import type { InventoryAdjustAction, InventoryAdjustInput, InventoryItem } from '../models/inventoryTypes';
import { useInventoryViewModel } from '../viewModels/useInventoryViewModel';
import PageLayout from '../../../shared/components/PageLayout';
import { InventorySkeleton } from '../../../shared/components/Skeletons';
import ErrorState from '../../../shared/components/ErrorState';
import Modal from '../../../shared/components/Modal';
import TableEmptyState from '../../../shared/components/TableEmptyState';
import { useRole } from '../../../shared/hooks/useRole';
import Select from '../../../shared/components/Select';
import { useMinimumLoading } from '../../../shared/hooks/useMinimumLoading';

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
  onDone?: () => void;
}> = ({ items, branches, variants, reasonCodes, employees, onAdjust, onDone }) => {
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
      onDone?.();
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
            className="mt-1 w-full rounded-md border border-line px-3 py-2"
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
            className="mt-1 w-full rounded-md border border-line px-3 py-2"
          />
        </div>
      </div>
      {error && <p className="text-sm text-error mt-3">{error}</p>}
      <button type="submit" disabled={submitting} className="mt-4 bg-brand text-white px-4 py-2 rounded-md hover:bg-brand-dark disabled:opacity-50 transition-colors">
        {submitting ? 'Adjusting…' : 'Apply Adjustment'}
      </button>
    </form>
  );
};

const GlobalInventory: React.FC = () => {
  const { isOwner } = useRole();
  const vm = useInventoryViewModel(isOwner);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'stock' | 'audit'>('stock');
  const loading = useMinimumLoading(vm.isLoading);

  if (loading)
    return <InventorySkeleton title={isOwner ? 'Global Inventory' : 'Branch Inventory'} />;
  if (vm.error) return <ErrorState message={vm.error} />;

  const inventoryReasonCodes = vm.reasonCodes.filter((r) => r.type === 'inventory' && r.isActive);
  const employees = vm.employees.filter((e) => e.isActive);

  return (
    <PageLayout title={isOwner ? 'Global Inventory' : 'Branch Inventory'}>
      <div className="space-y-6">
        <div className="inline-flex items-center gap-1 rounded-lg border border-line bg-white p-1">
          <button
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeSection === 'stock'
                ? 'bg-brand text-white'
                : 'text-ink-secondary hover:text-ink-primary hover:bg-surface-hover'
            }`}
            onClick={() => setActiveSection('stock')}
          >
            Stock
          </button>
          <button
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeSection === 'audit'
                ? 'bg-brand text-white'
                : 'text-ink-secondary hover:text-ink-primary hover:bg-surface-hover'
            }`}
            onClick={() => setActiveSection('audit')}
          >
            Audit Log
          </button>
        </div>

        {activeSection === 'stock' && (
        <>
          {isOwner && (
            <div className="bg-white rounded-lg border border-line p-4">
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
        <div className="bg-white rounded-lg border border-line p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-ink-primary">
              {vm.selectedBranchId
                ? vm.branches.find((b) => b.id === vm.selectedBranchId)?.name
                : isOwner
                ? 'Combined Stock'
                : 'Your Branch Stock'}
            </h2>
            <button
              className="bg-brand text-white px-4 py-1.5 rounded-md hover:bg-brand-dark transition-colors"
              onClick={() => setAdjustModalOpen(true)}
            >
              Adjust Stock
            </button>
          </div>
          <div className="overflow-x-auto">
            {vm.items.length === 0 ? (
              <TableEmptyState message="No stock found" />
            ) : (
            <table className="w-full text-base">
              <thead>
                <tr className="bg-canvas border-b border-line">
                  <th className="py-3 pl-4 text-left font-semibold text-ink-muted">Item</th>
                  <th className="py-3 text-left font-semibold text-ink-muted">SKU</th>
                  {isOwner && <th className="py-3 text-left font-semibold text-ink-muted">Branch</th>}
                  <th className="py-3 text-left font-semibold text-ink-muted">Qty On Hand</th>
                  <th className="py-3 pr-4 text-left font-semibold text-ink-muted">Source</th>
                </tr>
              </thead>
              <tbody>
                {vm.items.map((item) => (
                  <tr key={item.id} className="border-b border-line last:border-0 hover:bg-canvas transition-colors">
                    <td className="py-3.5 pl-4 font-medium text-ink-primary">{item.productName}</td>
                    <td className="py-3.5">{item.variantSku}</td>
                    {isOwner && <td className="py-3.5">{item.branchName}</td>}
                    <td className={`py-3.5 ${stockClass(item.quantity)}`}>{item.quantity}</td>
                    <td className="py-3.5 pr-4">
                      <span
                        className={`text-sm px-3 py-1 rounded ${
                          item.origin === 'automatic'
                            ? 'bg-surface-hover text-ink-secondary'
                            : 'bg-brand-light text-brand'
                        }`}
                      >
                        {item.origin === 'automatic' ? 'Auto' : 'Manual'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
          </div>
        </div>
        </>
        )}

        {activeSection === 'audit' && (
        <div className="bg-white rounded-lg border border-line p-6">
          <h2 className="text-lg font-semibold text-ink-primary mb-4">Audit Log</h2>
          <div className="overflow-x-auto">
            {vm.auditLogs.length === 0 ? (
              <TableEmptyState message="No audit logs yet" />
            ) : (
            <table className="w-full text-base">
              <thead>
                <tr className="bg-canvas border-b border-line">
                  <th className="py-3 pl-4 text-left font-semibold text-ink-muted">Product</th>
                  <th className="py-3 text-left font-semibold text-ink-muted">SKU</th>
                  {isOwner && <th className="py-3 text-left font-semibold text-ink-muted">Branch</th>}
                  <th className="py-3 text-left font-semibold text-ink-muted">Action</th>
                  <th className="py-3 text-left font-semibold text-ink-muted">Delta</th>
                  <th className="py-3 pr-4 text-left font-semibold text-ink-muted">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {vm.auditLogs.map((log) => (
                  <tr key={log.id} className="border-b border-line last:border-0 hover:bg-canvas transition-colors">
                    <td className="py-3.5 pl-4 font-medium text-ink-primary">{log.productName}</td>
                    <td className="py-3.5">{log.variantSku}</td>
                    {isOwner && <td className="py-3.5">{log.branchName}</td>}
                    <td className="py-3.5">{log.action}</td>
                    <td className="py-3.5">{log.quantityDelta}</td>
                    <td className="py-3.5 pr-4">{new Date(log.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
          </div>
        </div>
        )}
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
            onDone={() => setAdjustModalOpen(false)}
          />
        </Modal>
      )}
    </PageLayout>
  );
};

export default GlobalInventory;