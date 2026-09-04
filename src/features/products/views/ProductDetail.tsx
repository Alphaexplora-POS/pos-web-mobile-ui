import { useState } from 'react';
import type { Product, ProductAttribute, ProductVariant } from '../models/productTypes';
import OwnerOnlyBadge from '../../../shared/components/OwnerOnlyBadge';
import { useRole } from '../../../shared/hooks/useRole';

interface ProductDetailProps {
  product: Product;
  variants: ProductVariant[];
  attributes: ProductAttribute[];
  onAddVariant: (size: string, color: string, sku: string) => void;
  onAddAttribute: (name: string, value: string) => void;
  onToggleProduct: (isActive: boolean) => void;
  onToggleVariant: (variantId: string, isActive: boolean) => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({
  product,
  variants,
  attributes,
  onAddVariant,
  onAddAttribute,
  onToggleProduct,
  onToggleVariant,
}) => {
  const { isOwner } = useRole();
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [sku, setSku] = useState('');
  const [attrName, setAttrName] = useState('');
  const [attrValue, setAttrValue] = useState('');

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
        <button
          className={`text-sm px-3 py-1 rounded ${product.isActive ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
          onClick={() => onToggleProduct(!product.isActive)}
        >
          {product.isActive ? 'Deactivate' : 'Activate'}
        </button>
      </div>
      <p className="text-sm text-gray-600">{product.description}</p>
      <p className="text-sm text-gray-500">Base Price: ${product.basePrice}</p>

      <div>
        <h4 className="font-semibold text-gray-900 mb-2">Variants</h4>
        <form
          className="flex gap-2 mb-3"
          onSubmit={(e) => {
            e.preventDefault();
            onAddVariant(size, color, sku);
            setSize('');
            setColor('');
            setSku('');
          }}
        >
          <input
            placeholder="Size"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="flex-1 rounded border border-gray-300 px-3 py-1"
          />
          <input
            placeholder="Color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="flex-1 rounded border border-gray-300 px-3 py-1"
          />
          <input
            placeholder="SKU"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            required
            className="flex-1 rounded border border-gray-300 px-3 py-1"
          />
          <button className="bg-blue-600 text-white px-3 py-1 rounded" type="submit">Add</button>
        </form>
        <div className="space-y-2">
          {variants.map((v) => (
            <div key={v.id} className="flex items-center justify-between text-sm border rounded p-2">
              <span>
                {v.size ?? '-'} / {v.color ?? '-'} / {v.sku}
              </span>
              <button
                className={`px-2 py-1 rounded ${v.isActive ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
                onClick={() => onToggleVariant(v.id, !v.isActive)}
              >
                {v.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {isOwner && (
        <div className="border rounded p-4 bg-amber-50/40">
          <div className="flex items-center gap-2 mb-3">
            <h4 className="font-semibold text-gray-900">Variant Pricing</h4>
            <OwnerOnlyBadge label="Cost Price / Price Override" />
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Manual, direct edit — no stock movement. Distinct from weighted-average calc on mobile stock-in.
          </p>
          <div className="space-y-2">
            {variants.map((v) => (
              <div key={v.id} className="flex items-center justify-between text-sm border rounded p-2 bg-white">
                <span>{v.sku}</span>
                <span className="text-gray-600">
                  Cost: ${v.costPrice ?? '-'} · Price: ${v.priceOverride ?? '-'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h4 className="font-semibold text-gray-900 mb-2">Custom Attributes</h4>
        <form
          className="flex gap-2 mb-3"
          onSubmit={(e) => {
            e.preventDefault();
            onAddAttribute(attrName, attrValue);
            setAttrName('');
            setAttrValue('');
          }}
        >
          <input
            placeholder="Name (e.g. Material)"
            value={attrName}
            onChange={(e) => setAttrName(e.target.value)}
            required
            className="flex-1 rounded border border-gray-300 px-3 py-1"
          />
          <input
            placeholder="Value"
            value={attrValue}
            onChange={(e) => setAttrValue(e.target.value)}
            required
            className="flex-1 rounded border border-gray-300 px-3 py-1"
          />
          <button className="bg-blue-600 text-white px-3 py-1 rounded" type="submit">Add</button>
        </form>
        <div className="flex flex-wrap gap-2">
          {attributes.map((a) => (
            <span key={a.id} className="text-xs bg-gray-100 rounded px-2 py-1">
              {a.name}: {a.value}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
