import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import LoadingButton from '../../../shared/components/LoadingButton';
import type { InventoryAdjustAction, InventoryAdjustInput, InventoryItem } from '../models/inventoryTypes';
import { useInventoryViewModel } from '../viewModels/useInventoryViewModel';
import PageLayout from '../../../shared/components/PageLayout';
import { InventorySkeleton } from '../../../shared/components/Skeletons';
import ErrorState from '../../../shared/components/ErrorState';
import Modal from '../../../shared/components/Modal';
import TableEmptyState from '../../../shared/components/TableEmptyState';
import { useRole } from '../../../shared/hooks/useRole';
import Select from '../../../shared/components/Select';
import { sanitizeInteger } from '../../../shared/utils/numeric';
import { useAuth } from '../../auth/hooks/useAuth';
import { useServerPagination } from '../../../shared/hooks/useServerPagination';
import Pagination from '../../../shared/components/Pagination';
import { useUrlSection } from '../../../shared/hooks/useUrlSection';
import { useResponsivePageSize } from '../../../shared/hooks/useResponsivePageSize';
import ViewportTable from '../../../shared/components/ViewportTable';
import { fetchInventoryPage, fetchInventoryAuditLogsPage } from '../models/inventoryApi';

const stockClass = (qty: number) => {
  if (qty <= 0) return 'text-error font-semibold';
  if (qty <= 5) return 'text-warning font-semibold';
  return 'text-success font-medium';
};

const AdjustStockForm: React.FC<{
  items: InventoryItem[];
  branches: { id: string; name: string }[];
  products: { id: string; label: string }[];
  reasonCodes: { id: string; name: string }[];
  employees: { id: string; name: string; email?: string }[];
  isOwner: boolean;
  sessionEmail?: string;
  onAdjust: (input: InventoryAdjustInput) => Promise<void>;
  onDone?: () => void;
}> = ({ items, branches, products, reasonCodes, employees, isOwner, sessionEmail, onAdjust, onDone }) => {
  const initialBranchId = isOwner ? '' : branches[0]?.id ?? '';
  const [branchId, setBranchId] = useState(initialBranchId);

  useEffect(() => {
    if (!isOwner && !branchId && branches[0]?.id) {
      setBranchId(branches[0].id);
    }
  }, [isOwner, branchId, branches]);
  const [productId, setProductId] = useState('');
  const [productVariantId, setProductVariantId] = useState('');
  const [action, setAction] = useState<InventoryAdjustAction>('stock_in');
  const [quantity, setQuantity] = useState('');
  const [reasonId, setReasonId] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const performedBy = useMemo(() => {
    if (!employees.length) return '';
    if (sessionEmail) {
      const emailMatch = employees.find(
        (e) => e.email && e.email.toLowerCase() === sessionEmail.toLowerCase(),
      );
      if (emailMatch) return emailMatch.id;
    }
    return employees[0].id;
  }, [employees, sessionEmail]);
  const performedByName = employees.find((e) => e.id === performedBy)?.name ?? '';

  const branchOptions = branches.map((b) => ({ value: b.id, label: b.name }));

  interface ProductOption {
    key: string;
    label: string;
    productId: string;
    productVariantId: string | null;
  }

  const productOptions = useMemo<ProductOption[]>(() => {
    const seenVariants = new Set<string>();
    const seenProducts = new Set<string>();
    const variants: ProductOption[] = [];
    items.forEach((i) => {
      if (i.productVariantId && !seenVariants.has(i.productVariantId)) {
        seenVariants.add(i.productVariantId);
        seenProducts.add(i.productId);
        variants.push({
          key: i.productVariantId,
          productId: i.productId,
          productVariantId: i.productVariantId,
          label: i.variantLabel ? `${i.productName} · ${i.variantLabel}` : i.productName,
        });
      }
    });
    const plain: ProductOption[] = products
      .filter((p) => !seenProducts.has(p.id))
      .map((p) => ({ key: `p:${p.id}`, productId: p.id, productVariantId: null, label: p.label }));
    return [...variants, ...plain];
  }, [items, products]);

  const branchQuantity = new Map<string, number>();
  items
    .filter((i) => i.branchId === branchId)
    .forEach((i) => {
      const key = i.productVariantId || i.productId;
      branchQuantity.set(key, (branchQuantity.get(key) ?? 0) + i.quantity);
    });
  const selectedKey = productId ? productVariantId || productId : '';
  const selectedQuantity = selectedKey ? (branchQuantity.get(selectedKey) ?? 0) : null;

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
    if (!productId) {
      fail('Select a product');
      return;
    }
    if (!reasonId) {
      fail('Select a reason');
      return;
    }
    if (!performedBy) {
      fail('No active employee available');
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
        productId,
        productVariantId: productVariantId || undefined,
        action,
        quantity: Number(quantity),
        reasonId,
        notes: notes || undefined,
        performedBy,
      });
      setProductId('');
      setProductVariantId('');
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
        {isOwner && (
          <div>
            <label className="block text-sm text-ink-secondary">Branch</label>
            <Select
              value={branchId}
              onChange={(v) => {
                setBranchId(v);
                setProductId('');
              }}
              options={branchOptions}
              placeholder="Select branch"
              className="mt-1 w-full"
            />
          </div>
        )}
        <div>
          <label className="block text-sm text-ink-secondary">Product</label>
          <Select
            value={productVariantId || (productId ? `p:${productId}` : '')}
            onChange={(v) => {
              const opt = productOptions.find((o) => o.key === v);
              setProductVariantId(opt?.productVariantId ?? '');
              setProductId(opt?.productId ?? '');
            }}
            options={productOptions.map((opt) => {
              const qty = branchQuantity.get(opt.productVariantId || opt.productId);
              return {
                value: opt.key,
                label: qty === undefined ? `${opt.label} · no stock yet` : `${opt.label} · (${qty})`,
              };
            })}
            placeholder={branchId ? 'Select product / variant' : 'Select branch first'}
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
            onChange={(e) => setQuantity(sanitizeInteger(e.target.value))}
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
          <label className="block text-sm text-ink-secondary">Notes</label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 w-full rounded-md border border-line px-3 py-2"
          />
        </div>
      </div>
      <p className="text-sm text-ink-muted">Performed by: {performedByName || '—'}</p>
      {error && <p className="text-sm text-error mt-3">{error}</p>}
      <LoadingButton loading={submitting} loadingLabel="Adjusting…" className="mt-4">
        Apply Adjustment
      </LoadingButton>
    </form>
  );
};

const GlobalInventory: React.FC = () => {
  const { isOwner } = useRole();
  const { session } = useAuth();
  const vm = useInventoryViewModel(isOwner, session?.branchId ?? null);
const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useUrlSection<'stock' | 'audit'>(
    'section',
    'stock',
    (v) => (v === 'audit' ? 'audit' : 'stock'),
  );
  const [tableHeight, setTableHeight] = useState<number>(0);
  const [rowHeight, setRowHeight] = useState<number>(0);

  const pageSize = useResponsivePageSize(tableHeight, rowHeight);
  const stockPage = useServerPagination(
    (page) => fetchInventoryPage(page, vm.selectedBranchId ?? undefined, pageSize),
    pageSize,
    {
      fetchSize: pageSize,
      deps: [vm.selectedBranchId ?? '', pageSize],
      queryKey: ['inventory-stock', vm.selectedBranchId ?? '', String(pageSize)],
    },
  );
  const auditPage = useServerPagination(
    (page) => fetchInventoryAuditLogsPage(page, vm.selectedBranchId ? { branchId: vm.selectedBranchId } : undefined, pageSize),
    pageSize,
    {
      fetchSize: pageSize,
      deps: [vm.selectedBranchId ?? '', pageSize],
      queryKey: ['inventory-audit', vm.selectedBranchId ?? '', String(pageSize)],
      refetchInterval: 90_000,
    },
  );

  const loading = (stockPage.loading || auditPage.loading) && stockPage.totalCount === 0 && auditPage.totalCount === 0;

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
              {isOwner
                ? vm.selectedBranchId
                  ? vm.branches.find((b) => b.id === vm.selectedBranchId)?.name
                  : 'Combined Stock'
                : 'Stock'}
            </h2>
            <button
              className="bg-brand text-white px-4 py-1.5 rounded-md hover:bg-brand-dark transition-colors"
              onClick={() => setAdjustModalOpen(true)}
            >
              Adjust Stock
            </button>
          </div>
          <ViewportTable onFitHeightChange={setTableHeight} onRowHeightChange={setRowHeight}>
            <div className="flex-1 overflow-x-auto overflow-y-hidden">
              {stockPage.items.length === 0 ? (
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
                  {stockPage.items.map((item) => (
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
            {stockPage.totalCount > 0 && (
              <Pagination
                page={stockPage.page}
                totalPages={stockPage.totalPages}
                onPageChange={stockPage.goToPage}
                totalCount={stockPage.totalCount}
                pageStart={stockPage.pageStart}
                pageEnd={stockPage.pageEnd}
              />
            )}
          </ViewportTable>
        </div>
        </>
        )}

        {activeSection === 'audit' && (
        <div className="bg-white rounded-lg border border-line p-6">
          <h2 className="text-lg font-semibold text-ink-primary mb-4">Audit Log</h2>
          <ViewportTable onFitHeightChange={setTableHeight} onRowHeightChange={setRowHeight}>
            <div className="flex-1 overflow-x-auto overflow-y-hidden">
              {auditPage.items.length === 0 ? (
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
                    <th className="py-3 text-left font-semibold text-ink-muted">Performed By</th>
                    <th className="py-3 pr-4 text-left font-semibold text-ink-muted">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {auditPage.items.map((log) => (
                    <tr key={log.id} className="border-b border-line last:border-0 hover:bg-canvas transition-colors">
                      <td className="py-3.5 pl-4 font-medium text-ink-primary">{log.productName}</td>
                      <td className="py-3.5">{log.variantSku}</td>
                      {isOwner && <td className="py-3.5">{log.branchName}</td>}
                      <td className="py-3.5">{log.action}</td>
                      <td className="py-3.5 font-medium text-ink-primary">{log.quantityDelta}</td>
                      <td className="py-3.5 text-ink-secondary">{log.performedByName || '—'}</td>
                      <td className="py-3.5 pr-4">{new Date(log.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              )}
            </div>
            {auditPage.totalCount > 0 && (
              <Pagination
                page={auditPage.page}
                totalPages={auditPage.totalPages}
                onPageChange={auditPage.goToPage}
                totalCount={auditPage.totalCount}
                pageStart={auditPage.pageStart}
                pageEnd={auditPage.pageEnd}
              />
            )}
          </ViewportTable>
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
            products={vm.products}
            reasonCodes={inventoryReasonCodes}
            employees={employees}
            isOwner={isOwner}
            sessionEmail={session?.email}
            onAdjust={async (input) => {
              await vm.adjustStock(input);
              stockPage.reset();
              auditPage.reset();
            }}
            onDone={() => setAdjustModalOpen(false)}
          />
        </Modal>
      )}
    </PageLayout>
  );
};

export default GlobalInventory;