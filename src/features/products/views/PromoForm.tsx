import { useState } from 'react';
import type { Category, CreatePromoInput, Product, PromoType } from '../models/productTypes';

interface PromoFormProps {
  products: Product[];
  categories: Category[];
  onSubmit: (data: CreatePromoInput) => void | Promise<void>;
}

const PromoForm: React.FC<PromoFormProps> = ({ products, categories, onSubmit }) => {
  const [name, setName] = useState('');
  const [promoType, setPromoType] = useState<PromoType>('percentage');
  const [percentOff, setPercentOff] = useState('');
  const [fixedAmountOff, setFixedAmountOff] = useState('');
  const [bundleRule, setBundleRule] = useState('');
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [productIds, setProductIds] = useState<string[]>([]);
  const [isStackable, setIsStackable] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const toggleCategory = (id: string) =>
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const toggleProduct = (id: string) =>
    setProductIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <form
      className="bg-white rounded-lg shadow p-6 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          name,
          promoType,
          config:
            promoType === 'percentage'
              ? { percentOff: Number(percentOff) }
              : promoType === 'fixed'
              ? { fixedAmountOff: Number(fixedAmountOff) }
              : { bundleRule },
          isStackable,
          isActive,
          startDate: isActive && startDate ? startDate : undefined,
          endDate: isActive && endDate ? endDate : undefined,
          applicableItems: [
            ...categoryIds.map((id) => ({ scope: 'category' as const, categoryId: id })),
            ...productIds.map((id) => ({ scope: 'product' as const, productId: id })),
          ],
        });
        setName('');
        setPercentOff('');
        setFixedAmountOff('');
        setBundleRule('');
        setCategoryIds([]);
        setProductIds([]);
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
              <input type="radio" checked={promoType === t} onChange={() => setPromoType(t)} />
              {t === 'percentage' ? 'Percentage' : t === 'fixed' ? 'Fixed Amount' : 'Bundle'}
            </label>
          ))}
        </div>
      </div>

      {promoType === 'percentage' && (
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
      {promoType === 'fixed' && (
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
      {promoType === 'bundle' && (
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

      <div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isStackable} onChange={(e) => setIsStackable(e.target.checked)} />
          Stackable with other promos
        </label>
      </div>

      <div>
        <label className="block text-sm text-gray-600">Status</label>
        <div className="flex gap-4 mt-1">
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" checked={isActive} onChange={() => setIsActive(true)} />
            Active
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" checked={!isActive} onChange={() => setIsActive(false)} />
            Inactive
          </label>
        </div>
      </div>

      {isActive && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600">Start Date (optional)</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">End Date (optional)</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
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