import { useState } from 'react';
import { toast } from 'sonner';
import type { Branch } from '../../../shared/models/branchTypes';
import type { CreateVariantInput, Product, ProductAttribute, ProductVariant } from '../models/productTypes';
import Select from '../../../shared/components/Select';
import { useRole } from '../../../shared/hooks/useRole';
import { variantSchema, firstZodMessage } from '../../../shared/validation/schemas';

interface ProductDetailProps {
  product: Product;
  variants: ProductVariant[];
  attributes: ProductAttribute[];
  branches: Branch[];
  onAddVariant: (input: CreateVariantInput) => void | Promise<void>;
  onUpdateVariant: (variantId: string, input: Partial<CreateVariantInput>) => void | Promise<void>;
  onAddAttribute: (attributeKey: string, attributeValue: string) => void | Promise<void>;
  onUpdateAttribute: (id: string, attributeKey: string, attributeValue: string) => void | Promise<void>;
  onToggleProduct: (isActive: boolean) => void;
  onToggleVariant: (variantId: string, isActive: boolean) => void;
  onEdit: () => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({
  product,
  variants,
  attributes,
  branches,
  onAddVariant,
  onUpdateVariant,
  onAddAttribute,
  onUpdateAttribute,
  onToggleProduct,
  onToggleVariant,
  onEdit,
}) => {
  const { isOwner } = useRole();
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [sku, setSku] = useState('');
  const [branchId, setBranchId] = useState(branches[0]?.id ?? '');
  const [costPrice, setCostPrice] = useState('');
  const [priceOverride, setPriceOverride] = useState('');
  const [attrKey, setAttrKey] = useState('');
  const [attrValue, setAttrValue] = useState('');
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [editingAttrId, setEditingAttrId] = useState<string | null>(null);

  const resetVariantForm = () => {
    setSize('');
    setColor('');
    setSku('');
    setCostPrice('');
    setPriceOverride('');
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
        <div className="flex items-center gap-2">
          {isOwner && (
            <button
              className="text-sm px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
              onClick={onEdit}
            >
              Edit
            </button>
          )}
          <button
            className={`text-sm px-3 py-1 rounded ${product.isActive ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
            onClick={() => onToggleProduct(!product.isActive)}
          >
            {product.isActive ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-600">{product.description}</p>
      <p className="text-sm text-gray-500">Base Price: ${product.basePrice}</p>

      <div>
        <h4 className="font-semibold text-gray-900 mb-2">Variants</h4>
        <form
          className="flex flex-wrap gap-2 mb-3"
          onSubmit={(e) => {
            e.preventDefault();
            const data: CreateVariantInput = {
              size,
              color,
              sku,
              branchId: branchId || undefined,
              costPrice: isOwner && costPrice !== '' ? Number(costPrice) : undefined,
              priceOverride: isOwner && priceOverride !== '' ? Number(priceOverride) : undefined,
            };
            const check = variantSchema.safeParse({
              branchId: branchId || undefined,
              sku,
              size: size || null,
              color: color || null,
              priceOverride: isOwner && priceOverride !== '' ? Number(priceOverride) : undefined,
              costPrice: isOwner && costPrice !== '' ? Number(costPrice) : undefined,
            });
            if (!check.success) {
              toast.error(firstZodMessage(check.error));
              return;
            }
            onAddVariant(data);
            resetVariantForm();
          }}
        >
          <input
            placeholder="Size"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="flex-1 min-w-24 rounded border border-gray-300 px-3 py-1"
          />
          <input
            placeholder="Color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="flex-1 min-w-24 rounded border border-gray-300 px-3 py-1"
          />
          <input
            placeholder="SKU"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            required
            className="flex-1 min-w-24 rounded border border-gray-300 px-3 py-1"
          />
          <Select
            value={branchId}
            onChange={(v) => setBranchId(v)}
            options={branches.map((b) => ({ value: b.id, label: b.name }))}
            title="Assign initial stock to this branch"
            className="flex-1 min-w-24"
          />
          {isOwner && (
            <>
              <input
                placeholder="Cost"
                type="number"
                min="0"
                step="0.01"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                className="flex-1 min-w-20 rounded border border-gray-300 px-3 py-1"
              />
              <input
                placeholder="Price over"
                type="number"
                min="0"
                step="0.01"
                value={priceOverride}
                onChange={(e) => setPriceOverride(e.target.value)}
                className="flex-1 min-w-20 rounded border border-gray-300 px-3 py-1"
              />
            </>
          )}
          <button className="bg-blue-600 text-white px-3 py-1 rounded" type="submit">Add</button>
        </form>
        <div className="space-y-2">
          {variants.map((v) => (
            <div key={v.id} className="border rounded p-2 text-sm space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-medium text-gray-800">{v.size ?? '-'} / {v.color ?? '-'}</span>
                  <span className="text-gray-500">SKU: {v.sku}</span>
                  {isOwner && (
                    <span className="text-gray-500">
                      Cost: ${v.costPrice ?? '-'} · Price: ${v.priceOverride ?? '-'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="text-xs text-gray-600 underline"
                    onClick={() => setEditingVariantId(editingVariantId === v.id ? null : v.id)}
                  >
                    Edit
                  </button>
                  <button
                    className={`px-2 py-1 rounded ${v.isActive ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
                    onClick={() => onToggleVariant(v.id, !v.isActive)}
                  >
                    {v.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
              {editingVariantId === v.id && (
                <VariantEditRow
                  variant={v}
                  branches={branches}
                  isOwner={isOwner}
                  onSave={(input) => {
                    onUpdateVariant(v.id, input);
                    setEditingVariantId(null);
                  }}
                  onCancel={() => setEditingVariantId(null)}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-gray-900 mb-2">Custom Attributes</h4>
        <form
          className="flex gap-2 mb-3"
          onSubmit={(e) => {
            e.preventDefault();
            onAddAttribute(attrKey, attrValue);
            setAttrKey('');
            setAttrValue('');
          }}
        >
          <input
            placeholder="Key (e.g. Material)"
            value={attrKey}
            onChange={(e) => setAttrKey(e.target.value)}
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
            <span key={a.id} className="text-xs bg-gray-100 rounded px-2 py-1 flex items-center gap-1">
              {editingAttrId === a.id ? (
                <AttrEditRow
                  value={a}
                  onSave={(key, value) => {
                    onUpdateAttribute(a.id, key, value);
                    setEditingAttrId(null);
                  }}
                  onCancel={() => setEditingAttrId(null)}
                />
              ) : (
                <>
                  {a.attributeKey}: {a.attributeValue}
                  <button
                    className="text-gray-500 hover:text-gray-800 ml-1"
                    title="Rename attribute"
                    onClick={() => setEditingAttrId(a.id)}
                  >
                    ✎
                  </button>
                </>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

interface VariantEditRowProps {
  variant: ProductVariant;
  branches: Branch[];
  isOwner: boolean;
  onSave: (input: Partial<CreateVariantInput>) => void;
  onCancel: () => void;
}

const VariantEditRow: React.FC<VariantEditRowProps> = ({ variant, branches, isOwner, onSave, onCancel }) => {
  const [size, setSize] = useState(variant.size ?? '');
  const [color, setColor] = useState(variant.color ?? '');
  const [sku, setSku] = useState(variant.sku);
  const [branchId, setBranchId] = useState(branches[0]?.id ?? '');
  const [costPrice, setCostPrice] = useState(variant.costPrice != null ? String(variant.costPrice) : '');
  const [priceOverride, setPriceOverride] = useState(variant.priceOverride != null ? String(variant.priceOverride) : '');

  return (
    <div className="flex flex-wrap gap-2 border-t pt-2">
      <input value={size} onChange={(e) => setSize(e.target.value)} placeholder="Size" className="flex-1 min-w-20 rounded border border-gray-300 px-2 py-1" />
      <input value={color} onChange={(e) => setColor(e.target.value)} placeholder="Color" className="flex-1 min-w-20 rounded border border-gray-300 px-2 py-1" />
      <input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="SKU" className="flex-1 min-w-20 rounded border border-gray-300 px-2 py-1" />
      <Select value={branchId} onChange={(v) => setBranchId(v)} options={branches.map((b) => ({ value: b.id, label: b.name }))} title="Move stock to this branch" className="flex-1 min-w-20" />
      {isOwner && (
        <>
          <input
            value={costPrice}
            type="number"
            min="0"
            step="0.01"
            onChange={(e) => setCostPrice(e.target.value)}
            placeholder="Cost"
            className="flex-1 min-w-16 rounded border border-gray-300 px-2 py-1"
          />
          <input
            value={priceOverride}
            type="number"
            min="0"
            step="0.01"
            onChange={(e) => setPriceOverride(e.target.value)}
            placeholder="Price"
            className="flex-1 min-w-16 rounded border border-gray-300 px-2 py-1"
          />
        </>
      )}
      <div className="flex items-center gap-2">
        <button
          className="text-xs bg-blue-600 text-white px-2 py-1 rounded"
          onClick={() => {
            const input = {
              sku,
              size: size || undefined,
              color: color || undefined,
              branchId: branchId || undefined,
              costPrice: isOwner && costPrice !== '' ? Number(costPrice) : undefined,
              priceOverride: isOwner && priceOverride !== '' ? Number(priceOverride) : undefined,
            };
            const check = variantSchema.safeParse({
              sku,
              size: size || null,
              color: color || null,
              branchId: branchId || undefined,
              costPrice: isOwner && costPrice !== '' ? Number(costPrice) : undefined,
              priceOverride: isOwner && priceOverride !== '' ? Number(priceOverride) : undefined,
            });
            if (!check.success) {
              toast.error(firstZodMessage(check.error));
              return;
            }
            onSave(input);
          }}
        >
          Save
        </button>
        <button className="text-xs text-gray-600 underline" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
};

interface AttrEditRowProps {
  value: ProductAttribute;
  onSave: (key: string, value: string) => void;
  onCancel: () => void;
}

const AttrEditRow: React.FC<AttrEditRowProps> = ({ value, onSave, onCancel }) => {
  const [key, setKey] = useState(value.attributeKey);
  const [val, setVal] = useState(value.attributeValue);

  return (
    <span className="inline-flex items-center gap-1">
      <input value={key} onChange={(e) => setKey(e.target.value)} className="w-20 rounded border border-gray-300 px-1 py-0.5" />
      <span>:</span>
      <input value={val} onChange={(e) => setVal(e.target.value)} className="w-20 rounded border border-gray-300 px-1 py-0.5" />
      <button className="text-blue-600 font-medium" onClick={() => onSave(key, val)}>Save</button>
      <button className="text-gray-500 underline" onClick={onCancel}>Cancel</button>
    </span>
  );
};

export default ProductDetail;