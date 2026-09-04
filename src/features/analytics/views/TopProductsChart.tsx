import type { TopProduct } from '../models/analyticsTypes';

interface TopProductsChartProps {
  topProducts: TopProduct[];
}

const TopProductsChart: React.FC<TopProductsChartProps> = ({ topProducts }) => {
  const max = Math.max(...topProducts.map((p) => p.sales), 1);

  return (
    <div className="space-y-3">
      {topProducts.map((p) => (
        <div key={p.productName}>
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>{p.productName}</span>
            <span>${p.sales}</span>
          </div>
          <div className="h-4 bg-gray-100 rounded overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded"
              style={{ width: `${(p.sales / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default TopProductsChart;
