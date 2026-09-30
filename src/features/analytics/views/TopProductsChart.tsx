import type { TopProduct } from '../models/analyticsTypes';
import { formatAmount } from '../../../shared/utils/formatCurrency';
import { usePagination } from '../../../shared/hooks/usePagination';
import { useResponsivePageSize } from '../../../shared/hooks/useResponsivePageSize';
import { useState } from 'react';
import Pagination from '../../../shared/components/Pagination';
import ViewportTable from '../../../shared/components/ViewportTable';

interface TopProductsChartProps {
  topProducts: TopProduct[];
}

const TopProductsChart: React.FC<TopProductsChartProps> = ({ topProducts }) => {
  const [tableHeight, setTableHeight] = useState<number>(0);
  const [rowHeight, setRowHeight] = useState<number>(0);
  const pageSize = useResponsivePageSize(tableHeight, rowHeight);
  const pagination = usePagination(topProducts, pageSize);

  if (!topProducts.length) {
    return (
      <div className="flex min-h-[320px] items-center justify-center py-12">
        <p className="text-sm text-ink-muted">No product data available</p>
      </div>
    );
  }

  return (
    <ViewportTable onFitHeightChange={setTableHeight} onRowHeightChange={setRowHeight}>
      <div className="flex-1 space-y-2">
        {pagination.pageItems.map((p) => {
          return (
            <div
              key={p.productName}
              className="flex items-center justify-between gap-4 py-2 border-b border-line/60 last:border-b-0 text-sm"
            >
              <span className="font-medium text-ink-primary truncate">{p.productName}</span>
              <span className="text-ink-secondary shrink-0">{formatAmount(p.sales)}</span>
            </div>
          );
        })}
      </div>
      {pagination.totalCount > 0 && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={pagination.goToPage}
          totalCount={pagination.totalCount}
          pageStart={pagination.pageStart}
          pageEnd={pagination.pageEnd}
        />
      )}
    </ViewportTable>
  );
};

export default TopProductsChart;