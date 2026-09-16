import { useState } from 'react';
import { toast } from 'sonner';
import type { InventoryAdjustAction, InventoryAdjustInput, InventoryItem } from '../models/inventoryTypes';
import { useInventoryViewModel } from '../viewModels/useInventoryViewModel';
import PageLayout from '../../../shared/components/PageLayout';
import LoadingState from '../../../shared/components/LoadingState';
import ErrorState from '../../../shared/components/ErrorState';
import { useRole } from '../../../shared/hooks/useRole';
import Select from '../../../shared/components/Select';

const stockClass = (qty: number) => {
  if (qty <= 0) return 'text-red-600 font-semibold';
  if (qty <= 5) return 'text-amber-600 font-semibold';
  return 'text-green-600 font-medium';
};

const AdjustStockForm: React.FC<{
  items: InventoryItem[];
  reasonCodes: { id: string; name: string }[];
  employees: { id: string; name: string }[];
  onAdjust: (input: InventoryAdjustInput) => Promise<void>;
}> = ({ items, reasonCodes, employees, onAdjust }) => {
  const [itemId, setItemId] = useState('');
  const [action, setAction] = useState<InventoryAdjustAction>('stock_in');
  const [quantity, setQuantity] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [reasonId, setReasonId] = useState('');
  const [notes, setNotes] = useState('');
  const [performedBy, setPerformedBy] = useState(employees[0]?.id ?? '');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedItem = items.find((i) => i.id === itemId);

  const fail = (msg: string) => {
    setError(msg);
    toast.error(msg);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) {
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
      if (action === 'stock_out' && qty > selectedItem.quantity) {
        fail(`Only ${selectedItem.quantity} in stock`);
        return;
      }
    }
    setError(null);
    setSubmitting(true);
    try {
      await onAdjust({
        branchId: selectedItem.branchId,
        productVariantId: selectedItem.productVariantId,
        action,
        quantity: Number(quantity),
        unitCost: action === 'stock_in' && unitCost !== '' ? Number(unitCost) : undefined,
        reasonId,
        notes: notes || undefined,
        performedBy,
      });
      setItemId('');
      setQuantity('');
      setUnitCost('');
      setReasonId('');
      setNotes('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to adjust stock');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Adjust Stock</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-600">Item</label>
          <Select
            value={itemId}
            onChange={(v) => setItemId(v)}
            options={items.map((i) => ({
              value: i.id,
              label: `${i.productName} · ${i.variantSku} · (${i.branchName}: ${i.quantity})`,
            }))}
            placeholder="Select item"
            className="mt-1 w-full"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Action</label>
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
          <label className="block text-sm text-gray-600">Quantity</label>
          <input
            type="number"
            min="0"
            step="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>
        {action === 'stock_in' && (
          <div>
            <label className="block text-sm text-gray-600">Unit Cost (updates weighted average)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>
        )}
        <div>
          <label className="block text-sm text-gray-600">Reason</label>
          <Select
            value={reasonId}
            onChange={(v) => setReasonId(v)}
            options={reasonCodes.map((r) => ({ value: r.id, label: r.name }))}
            placeholder="Select reason"
            className="mt-1 w-full"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Performed By</label>
          <Select
            value={performedBy}
            onChange={(v) => setPerformedBy(v)}
            options={employees.map((emp) => ({ value: emp.id, label: emp.name }))}
            placeholder="Select employee"
            className="mt-1 w-full"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Notes</label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>
      </div>
      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
      <button type="submit" disabled={submitting} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
        {submitting ? 'Adjusting…' : 'Apply Adjustment'}
      </button>
    </form>
  );
};

const GlobalInventory: React.FC = () => {
  const { isOwner } = useRole();
  const vm = useInventoryViewModel(isOwner);

  if (vm.isLoading) return <LoadingState />;
  if (vm.error) return <ErrorState message={vm.error} />;

  const inventoryReasonCodes = vm.reasonCodes.filter((r) => r.type === 'inventory' && r.isActive);
  const employees = vm.employees.filter((e) => e.isActive);

  return (
    <PageLayout title={isOwner ? 'Global Inventory' : 'Branch Inventory'}>
      <div className="space-y-6">
        {isOwner && (
          <div className="bg-white rounded-lg shadow p-4">
            <label className="block text-sm text-gray-600 mb-2">View Stock</label>
            <Select
              value={vm.selectedBranchId ?? ''}
              onChange={(v) => vm.setSelectedBranchId(v || null)}
              options={[
                { value: '', label: 'All Branches (Combined)' },
                ...vm.branches.map((b) => ({ value: b.id, label: b.name })),
              ]}
              className="w-full md:w-64"
            />
            <p className="text-xs text-gray-400 mt-2">
              Combined stock across all branches with per-branch drilldown.
            </p>
          </div>
        )}

        {vm.items.length > 0 && (
          <AdjustStockForm
            items={vm.items}
            reasonCodes={inventoryReasonCodes}
            employees={employees}
            onAdjust={vm.adjustStock}
          />
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {vm.selectedBranchId
              ? vm.branches.find((b) => b.id === vm.selectedBranchId)?.name
              : isOwner
              ? 'Combined Stock'
              : 'Your Branch Stock'}
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
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
                          ? 'bg-gray-100 text-gray-600'
                          : 'bg-blue-100 text-blue-700'
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Audit Log</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
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
    </PageLayout>
  );
};

export default GlobalInventory;