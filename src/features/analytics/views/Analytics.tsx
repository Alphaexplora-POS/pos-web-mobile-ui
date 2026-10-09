import { useEffect, useRef, useState } from 'react';
import { useAnalyticsViewModel } from '../viewModels/useAnalyticsViewModel';
import TopProductsChart from './TopProductsChart';
import PageLayout from '../../../shared/components/PageLayout';
import { AnalyticsSkeleton } from '../../../shared/components/Skeletons';
import ErrorState from '../../../shared/components/ErrorState';
import { useRole } from '../../../shared/hooks/useRole';
import { useAuth } from '../../auth/hooks/useAuth';
import Select from '../../../shared/components/Select';
import type { TopProduct } from '../models/analyticsTypes';
import { usePagination } from '../../../shared/hooks/usePagination';
import Pagination from '../../../shared/components/Pagination';
import { useResponsiveCardPageSize } from '../../../shared/hooks/useResponsivePageSize';

const Analytics: React.FC = () => {
  const { isOwner } = useRole();
  const { session } = useAuth();
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [selectedTopProducts, setSelectedTopProducts] = useState<TopProduct[]>([]);
  const [branchSales, setBranchSales] = useState<{ today: number; monthly: number } | null>(null);

  const { data, isLoading, error } = useAnalyticsViewModel(isOwner, session?.branchId ?? null);

  const branchPanelRef = useRef<HTMLDivElement | null>(null);
  const [branchPanelHeight, setBranchPanelHeight] = useState<number>(0);

  useEffect(() => {
    const el = branchPanelRef.current;
    if (!el) return;
    const measure = () => setBranchPanelHeight(Math.round(el.clientHeight));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const branchPerfPageSize = useResponsiveCardPageSize(branchPanelHeight);
  const branchPerfPagination = usePagination(data?.branchComparison ?? [], branchPerfPageSize);

  useEffect(() => {
    if (!isOwner) return;
    if (!selectedBranch) {
      setSelectedTopProducts(data?.topProducts ?? []);
      setBranchSales(null);
      return;
    }
    const entry = data?.branchComparison?.find((b) => b.branchId === selectedBranch);
    setSelectedTopProducts(entry?.topProducts ?? []);
    setBranchSales(entry ? { today: entry.salesToday, monthly: entry.salesMonthly } : null);
  }, [isOwner, selectedBranch, data]);

  const branchOptions = [
    { value: '', label: 'All branches' },
    ...(data?.branchComparison ?? []).map((b) => ({ value: b.branchId, label: b.branchName })),
  ];

  if (error) return <ErrorState message={error} />;
  if (isLoading || !data) return <AnalyticsSkeleton title={isOwner ? 'Centralized Analytics' : 'Branch Analytics'} owner={isOwner} />;

  if (!isOwner) {
    return (
      <PageLayout title="Branch Analytics">
        <div className="mb-6 bg-white rounded-lg border border-line p-4 flex items-center gap-2">
          <span className="text-sm text-ink-secondary">Your Branch:</span>
          <span className="text-sm font-semibold text-ink-primary">{data.branchName ?? '—'}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg border border-line p-6">
            <h3 className="text-sm text-ink-muted">Sales Today</h3>
            <p className="text-3xl font-bold text-ink-primary mt-1">
              ₱{data.metrics.salesToday.toFixed(2)}
            </p>
            <p className="text-sm text-ink-muted mt-1">
              {data.metrics.transactionCountToday} transactions
            </p>
          </div>
          <div className="bg-white rounded-lg border border-line p-6">
            <h3 className="text-sm text-ink-muted">Sales Monthly</h3>
            <p className="text-3xl font-bold text-ink-primary mt-1">
              ₱{data.metrics.salesMonthly.toFixed(2)}
            </p>
            <p className="text-sm text-ink-muted mt-1">
              {data.metrics.transactionCountMonthly} transactions
            </p>
          </div>
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
            ₱{data.metrics.salesToday.toFixed(2)}
          </p>
          <p className="text-sm text-ink-muted mt-1">
            {data.metrics.transactionCountToday} transactions
          </p>
        </div>
        <div className="bg-white rounded-lg border border-line p-6">
          <h3 className="text-sm text-ink-muted">Sales Monthly</h3>
          <p className="text-3xl font-bold text-ink-primary mt-1">
            ₱{data.metrics.salesMonthly.toFixed(2)}
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
            {selectedBranch && branchSales && (
              <div className="mt-4 grid grid-cols-2 gap-4 rounded-lg border border-line p-4">
                <div>
                  <p className="text-xs text-ink-muted">Branch Sales Today</p>
                  <p className="text-lg font-semibold text-ink-primary mt-1">
                    ₱{branchSales.today.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-ink-muted">Branch Sales Monthly</p>
                  <p className="text-lg font-semibold text-ink-primary mt-1">
                    ₱{branchSales.monthly.toFixed(2)}
                  </p>
                </div>
              </div>
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

        <div ref={branchPanelRef} className="flex flex-col bg-white rounded-lg border border-line p-6">
          <h3 className="text-base font-semibold text-ink-primary mb-1">Branch Performance</h3>
          <p className="text-xs text-ink-muted mb-4">Sales by location</p>
          {data.branchComparison && data.branchComparison.length === 0 ? (
            <p className="text-sm text-ink-muted py-8 text-center">No branch data available</p>
          ) : (
            <div className="space-y-3">
              {branchPerfPagination.pageItems.map((b) => (
                <div key={b.branchId} className="p-4 rounded-lg border border-line min-h-24 flex flex-col justify-center">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-ink-primary">{b.branchName}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <p className="text-xs text-ink-muted">Today</p>
                      <p className="text-sm font-semibold text-ink-primary">
                        ₱{b.salesToday.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-ink-muted">This Month</p>
                      <p className="text-sm font-semibold text-ink-primary">
                        ₱{b.salesMonthly.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {branchPerfPagination.totalCount > 0 && (
            <Pagination
              page={branchPerfPagination.page}
              totalPages={branchPerfPagination.totalPages}
              onPageChange={branchPerfPagination.goToPage}
              totalCount={branchPerfPagination.totalCount}
              pageStart={branchPerfPagination.pageStart}
              pageEnd={branchPerfPagination.pageEnd}
            />
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default Analytics;