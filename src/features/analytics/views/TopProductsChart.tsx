import type { TopProduct } from '../models/analyticsTypes';
import { formatAmount } from '../../../shared/utils/formatCurrency';

interface TopProductsChartProps {
  topProducts: TopProduct[];
}

const TopProductsChart: React.FC<TopProductsChartProps> = ({ topProducts }) => {
  if (!topProducts.length) {
    return <p className="text-sm text-ink-muted py-8 text-center">No product data available</p>;
  }

  const max = Math.max(...topProducts.map((p) => p.sales), 1);

  return (
    <div className="space-y-4">
      {topProducts.map((p) => {
        const pct = (p.sales / max) * 100;
        return (
          <div key={p.productName}>
            <div className="flex justify-between text-sm text-ink-secondary mb-1">
              <span className="font-medium text-ink-primary">{p.productName}</span>
              <span>${formatAmount(p.sales)}</span>
            </div>
            <div className="h-2 bg-surface-hover rounded-full overflow-hidden">
              <div
                className="h-full bg-brand rounded-full transition-all duration-200"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TopProductsChart;
