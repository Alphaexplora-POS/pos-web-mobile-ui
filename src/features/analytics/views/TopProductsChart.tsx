import type { TopProduct } from '../models/analyticsTypes';
import { formatAmount } from '../../../shared/utils/formatCurrency';

interface TopProductsChartProps {
  topProducts: TopProduct[];
}

const TopProductsChart: React.FC<TopProductsChartProps> = ({ topProducts }) => {
  if (!topProducts.length) {
    return (
      <div className="flex min-h-[320px] items-center justify-center py-12">
        <p className="text-sm text-ink-muted">No product data available</p>
      </div>
    );
  }

  const total = topProducts.reduce((sum, p) => sum + p.sales, 0);

  return (
    <div className="space-y-2">
      {topProducts.map((p) => {
        const pct = total > 0 ? (p.sales / total) * 100 : 0;
        return (
          <div
            key={p.productName}
            className="flex items-center justify-between gap-4 py-2 border-b border-line/60 last:border-b-0 text-sm"
          >
            <span className="font-medium text-ink-primary truncate">{p.productName}</span>
            <span className="text-ink-secondary shrink-0">
              {pct.toFixed(1)}% · ${formatAmount(p.sales)}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default TopProductsChart;
