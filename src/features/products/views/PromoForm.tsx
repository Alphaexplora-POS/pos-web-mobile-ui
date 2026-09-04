import { useState } from 'react';
import type { Category, Product, PromoType } from '../models/productTypes';

interface PromoFormProps {
  products: Product[];
  categories: Category[];
  onSubmit: (data: {
    name: string;
    type: PromoType;
    productIds: string[];
    categoryIds: string[];
    percentOff?: number;
    fixedAmountOff?: number;
    bundleRule?: string;
    combinable: boolean;
    status: 'active' | 'scheduled' | 'inactive';
    startDate?: string;
    endDate?: string;
  }) => void;
}

const PromoForm: React.FC<PromoFormProps> = ({ products, categories, onSubmit }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<PromoType>('percentage');
  const [productIds, setProductIds] = useState<string[]>([]);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [percentOff, setPercentOff] = useState('');
  const [fixedAmountOff, setFixedAmountOff] = useState('');
  const [bundleRule, setBundleRule] = useState('');
  const [combinable, setCombinable] = useState(false);
  const [status, setStatus] = useState<'active' | 'scheduled' | 'inactive'>('active');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const toggleProduct = (id: string) => {
    setProductIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleCategory = (id: string) => {
    setCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <form
      className="bg-white rounded-lg shadow p-6 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          name,
          type,
          productIds,
          categoryIds,
          percentOff: type === 'percentage' ? Number(percentOff) : undefined,
          fixedAmountOff: type === 'fixed' ? Number(fixedAmountOff) : undefined,
          bundleRule: type === 'bundle' ? bundleRule : undefined,
          combinable,
          status,
          startDate: status === 'scheduled' ? startDate : undefined,
          endDate: status === 'scheduled' ? endDate : undefined,
        });
        setName('');
        setProductIds([]);
        setCategoryIds([]);
        setPercentOff('');
        setFixedAmountOff('');
        setBundleRule('');
      }}
    >
      <h3 className="text-lg font-semibold text-gray-900">Add Promotion</h3>
      <div>
        <label className="block text-sm text-gray-600">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-600">Promo Type</label>
        <div className="flex gap-4 mt-1">
          {(['percentage', 'fixed', 'bundle'] as PromoType[]).map((t) => (
            <label key={t} className="flex items-center gap-2 text-sm">
              <input type="radio" checked={type === t} onChange={() => setType(t)} />
              {t === 'percentage' ? 'Percentage' : t === 'fixed' ? 'Fixed Amount' : 'Bundle'}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-600">Applicable Categories</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {categories.map((c) => (
            <label
              key={c.id}
              className={`text-xs px-3 py-1 rounded border cursor-pointer ${categoryIds.includes(c.id) ? 'bg-blue-100 border-blue-400' : 'border-gray-300'}`}
            >
              <input
                type="checkbox"
                className="hidden"
                checked={categoryIds.includes(c.id)}
                onChange={() => toggleCategory(c.id)}
              />
              {c.name}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-600">Applicable Products</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {products.map((p) => (
            <label
              key={p.id}
              className={`text-xs px-3 py-1 rounded border cursor-pointer ${productIds.includes(p.id) ? 'bg-blue-100 border-blue-400' : 'border-gray-300'}`}
            >
              <input
                type="checkbox"
                className="hidden"
                checked={productIds.includes(p.id)}
                onChange={() => toggleProduct(p.id)}
              />
              {p.name}
            </label>
          ))}
        </div>
      </div>

      {type === 'percentage' && (
        <div>
          <label className="block text-sm text-gray-600">Percent Off</label>
          <input
            type="number"
            min="0"
            max="100"
            value={percentOff}
            onChange={(e) => setPercentOff(e.target.value)}
            required
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>
      )}
      {type === 'fixed' && (
        <div>
          <label className="block text-sm text-gray-600">Fixed Amount Off</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={fixedAmountOff}
            onChange={(e) => setFixedAmountOff(e.target.value)}
            required
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>
      )}
      {type === 'bundle' && (
        <div>
          <label className="block text-sm text-gray-600">Bundle Rule (e.g. Buy 3 for 1000)</label>
          <input
            value={bundleRule}
            onChange={(e) => setBundleRule(e.target.value)}
            required
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>
      )}

      <div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={combinable} onChange={(e) => setCombinable(e.target.checked)} />
          Combinable with other promos
        </label>
      </div>

      <div>
        <label className="block text-sm text-gray-600">Status</label>
        <div className="flex gap-4 mt-1">
          {(['active', 'scheduled', 'inactive'] as const).map((s) => (
            <label key={s} className="flex items-center gap-2 text-sm">
              <input type="radio" checked={status === s} onChange={() => setStatus(s)} />
              {s === 'active' ? 'Now' : s === 'scheduled' ? 'Later' : 'Inactive'}
            </label>
          ))}
        </div>
      </div>

      {status === 'scheduled' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>
        </div>
      )}

      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
        Create Promotion
      </button>
    </form>
  );
};

export default PromoForm;
