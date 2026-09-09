import { useInventoryViewModel } from '../viewModels/useInventoryViewModel';
import PageLayout from '../../../shared/components/PageLayout';
import LoadingState from '../../../shared/components/LoadingState';
import ErrorState from '../../../shared/components/ErrorState';
import { useRole } from '../../../shared/hooks/useRole';

const stockClass = (qty: number) => {
  if (qty <= 0) return 'text-red-600 font-semibold';
  if (qty <= 5) return 'text-amber-600 font-semibold';
  return 'text-green-600 font-medium';
};

const GlobalInventory: React.FC = () => {
  const { isOwner } = useRole();
  const vm = useInventoryViewModel(isOwner);

  if (vm.isLoading) return <LoadingState />;
  if (vm.error) return <ErrorState message={vm.error} />;

  return (
    <PageLayout title={isOwner ? 'Global Inventory' : 'Branch Inventory'}>
      <div className="space-y-6">
        {isOwner && (
          <div className="bg-white rounded-lg shadow p-4">
            <label className="block text-sm text-gray-600 mb-2">View Stock</label>
            <select
              value={vm.selectedBranchId ?? ''}
              onChange={(e) => vm.setSelectedBranchId(e.target.value || null)}
              className="w-full md:w-64 rounded border border-gray-300 px-3 py-2"
            >
              <option value="">All Branches (Combined)</option>
              {vm.branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            {isOwner && (
              <p className="text-xs text-gray-400 mt-2">
                Combined stock across all branches with per-branch drilldown.
              </p>
            )}
          </div>
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
