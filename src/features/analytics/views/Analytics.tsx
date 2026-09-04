import { useAnalyticsViewModel } from '../viewModels/useAnalyticsViewModel';
import TopProductsChart from './TopProductsChart';
import PageLayout from '../../../shared/components/PageLayout';
import LoadingState from '../../../shared/components/LoadingState';
import ErrorState from '../../../shared/components/ErrorState';
import { useRole } from '../../../shared/hooks/useRole';

const Analytics: React.FC = () => {
  const { isOwner } = useRole();
  const { data, isLoading, error } = useAnalyticsViewModel(isOwner);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!data) return null;

  return (
    <PageLayout title={isOwner ? 'Centralized Analytics' : 'Branch Analytics'}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm text-gray-500">Sales Today</h3>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            ${data.metrics.salesToday.toFixed(2)}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {data.metrics.transactionCountToday} transactions
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm text-gray-500">Sales Monthly</h3>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            ${data.metrics.salesMonthly.toFixed(2)}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {data.metrics.transactionCountMonthly} transactions
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products</h3>
        <TopProductsChart topProducts={data.topProducts} />
      </div>

      {isOwner && data.branchComparison && (
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Compare Branches Side by Side
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.branchComparison.map((b) => (
              <div key={b.branchId} className="border rounded-lg p-4">
                <h4 className="font-semibold text-gray-900">{b.branchName}</h4>
                <p className="text-sm text-gray-500 mt-2">Today</p>
                <p className="text-lg font-bold text-gray-900">${b.salesToday.toFixed(2)}</p>
                <p className="text-sm text-gray-500 mt-2">This Month</p>
                <p className="text-lg font-bold text-gray-900">${b.salesMonthly.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export default Analytics;
