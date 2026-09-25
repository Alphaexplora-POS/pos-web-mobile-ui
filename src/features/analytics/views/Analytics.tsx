import { useEffect, useState } from 'react';
import { useAnalyticsViewModel } from '../viewModels/useAnalyticsViewModel';
import TopProductsChart from './TopProductsChart';
import PageLayout from '../../../shared/components/PageLayout';
import { AnalyticsSkeleton } from '../../../shared/components/Skeletons';
import ErrorState from '../../../shared/components/ErrorState';
import { useRole } from '../../../shared/hooks/useRole';
import { useAuth } from '../../auth/hooks/useAuth';
import Select from '../../../shared/components/Select';
import { useMinimumLoading } from '../../../shared/hooks/useMinimumLoading';
import { fetchBranches } from '../../../shared/models/branchesApi';
import { fetchBranchTopProducts } from '../models/analyticsApi';
import type { Branch } from '../../../shared/models/branchTypes';
import type { TopProduct } from '../models/analyticsTypes';

const Analytics: React.FC = () => {
  const { isOwner } = useRole();
  const { session } = useAuth();
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedTopProducts, setSelectedTopProducts] = useState<TopProduct[]>([]);
  const [isBranchLoading, setIsBranchLoading] = useState(false);
  const [branchError, setBranchError] = useState<string | null>(null);

  const { data, isLoading, error } = useAnalyticsViewModel(
    isOwner,
    session?.branchId ?? null,
  );
  const loading = useMinimumLoading(isLoading);

  useEffect(() => {
    if (!isOwner) return;
    setBranches([]);
    fetchBranches()
      .then((all) => setBranches(all.filter((b) => b.isActive)))
      .catch(() => {});
  }, [isOwner]);

  useEffect(() => {
    if (!isOwner) return;
    if (!selectedBranch) {
      setSelectedTopProducts(data?.topProducts ?? []);
      return;
    }
    let active = true;
    setIsBranchLoading(true);
    setBranchError(null);
    fetchBranchTopProducts(selectedBranch)
      .then((products) => {
        if (active) setSelectedTopProducts(products);
      })
      .catch((err) => {
        if (active) setBranchError(err instanceof Error ? err.message : 'Failed to load branch products');
      })
      .finally(() => {
        if (active) setIsBranchLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isOwner, selectedBranch, data?.topProducts]);

  const branchOptions = [
    { value: '', label: 'All branches' },
    ...branches.map((b) => ({ value: b.id, label: b.name })),
  ];

  if (loading) return <AnalyticsSkeleton title={isOwner ? 'Centralized Analytics' : 'Branch Analytics'} owner={isOwner} />;
  if (error) return <ErrorState message={error} />;
  if (!data) return null;

  if (!isOwner) {
    return (
      <PageLayout title="Branch Analytics">
        <div className="mb-6 bg-white rounded-lg border border-line p-4 flex items-center gap-2">
          <span className="text-sm text-ink-secondary">Your Branch:</span>
          <span className="text-sm font-semibold text-ink-primary">{data.branchName ?? '—'}</span>
        </div>
        <div className="bg-white rounded-lg border border-line p-6">
          <h3 className="text-base font-semibold text-ink-primary mb-4">Top Products</h3>
          <TopProductsChart topProducts={data.topProducts} />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Centralized Analytics">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-line p-6">
          <h3 className="text-sm text-ink-muted">Sales Today</h3>
          <p className="text-3xl font-bold text-ink-primary mt-1">
            ${data.metrics.salesToday.toFixed(2)}
          </p>
          <p className="text-sm text-ink-muted mt-1">
            {data.metrics.transactionCountToday} transactions
          </p>
        </div>
        <div className="bg-white rounded-lg border border-line p-6">
          <h3 className="text-sm text-ink-muted">Sales Monthly</h3>
          <p className="text-3xl font-bold text-ink-primary mt-1">
            ${data.metrics.salesMonthly.toFixed(2)}
          </p>
          <p className="text-sm text-ink-muted mt-1">
            {data.metrics.transactionCountMonthly} transactions
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
        <div className="xl:col-span-2 bg-white rounded-lg border border-line p-6">
          <div className="mb-4">
            <span className="block text-sm font-medium text-ink-secondary">Branch</span>
            <div className="mt-1 w-56">
              <Select
                value={selectedBranch}
                onChange={setSelectedBranch}
                options={branchOptions}
                placeholder="All branches"
              />
            </div>
            {isBranchLoading && (
              <span className="block mt-2 text-sm text-ink-muted">Loading products…</span>
            )}
            {branchError && (
              <span className="block mt-2 text-sm text-error">{branchError}</span>
            )}
          </div>

          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-semibold text-ink-primary">Top Products</h3>
            {selectedBranch && (
              <span className="text-xs font-medium text-brand">Branch view</span>
            )}
          </div>
          <p className="text-xs text-ink-muted mb-4">
            {selectedBranch ? 'Best sellers for selected branch' : 'Best sellers across all branches'}
          </p>
          <TopProductsChart topProducts={selectedTopProducts} />
        </div>

        <div className="bg-white rounded-lg border border-line p-6">
          <h3 className="text-base font-semibold text-ink-primary mb-1">Branch Performance</h3>
          <p className="text-xs text-ink-muted mb-4">Sales by location</p>
          {data.branchComparison && data.branchComparison.length === 0 ? (
            <p className="text-sm text-ink-muted py-8 text-center">No branch data available</p>
          ) : (
            <div className="space-y-3">
              {data.branchComparison?.map((b) => (
                <div key={b.branchId} className="p-3 rounded-lg border border-line">
                  <span className="text-sm font-medium text-ink-primary">{b.branchName}</span>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <p className="text-xs text-ink-muted">Today</p>
                      <p className="text-sm font-semibold text-ink-primary">
                        ${b.salesToday.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-ink-muted">This Month</p>
                      <p className="text-sm font-semibold text-ink-primary">
                        ${b.salesMonthly.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default Analytics;