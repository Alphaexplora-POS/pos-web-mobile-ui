import { Fragment, useState } from 'react';
import { toast } from 'sonner';
import type { CreateVariantInput, Product, ProductAttribute, ProductVariant } from '../models/productTypes';
import { useRole } from '../../../shared/hooks/useRole';
import TableEmptyState from '../../../shared/components/TableEmptyState';
import { variantSchema, firstZodMessage } from '../../../shared/validation/schemas';

interface ProductDetailProps {
  product: Product;
  variants: ProductVariant[];
  attributes: ProductAttribute[];
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

  const handleAddVariant = (e: React.FormEvent) => {
    e.preventDefault();
    const data: CreateVariantInput = {
      size,
      color,
      sku,
      costPrice: isOwner && costPrice !== '' ? Number(costPrice) : undefined,
      priceOverride: isOwner && priceOverride !== '' ? Number(priceOverride) : undefined,
    };
    const check = variantSchema.safeParse({
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
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-line p-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2 py-1 rounded ${product.isActive ? 'bg-success-light text-success' : 'bg-surface-hover text-ink-muted'}`}>
              {product.isActive ? 'Active' : 'Inactive'}
            </span>
            <span className="text-sm font-medium text-ink-primary">Base Price: ${product.basePrice}</span>
          </div>
          <div className="flex items-center gap-2">
            {isOwner && (
              <button
                className="text-sm px-3 py-1 rounded-md border border-line text-ink-secondary hover:bg-surface-hover transition-colors"
                onClick={onEdit}
              >
                Edit
              </button>
            )}
            <button
              className={`text-sm px-3 py-1 rounded-md ${product.isActive ? 'bg-error/10 text-error' : 'bg-success-light text-success'}`}
              onClick={() => onToggleProduct(!product.isActive)}
            >
              {product.isActive ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        </div>
        <p className="text-sm text-ink-secondary">{product.description}</p>
      </div>

      <div>
        <h4 className="font-semibold text-ink-primary mb-1">Variants</h4>
        <p className="text-xs text-ink-muted mb-3">
          {variants.length} variant(s) for this product
        </p>

        <form
          className="mb-4 flex flex-wrap items-end gap-2 rounded-lg border border-line p-3"
          onSubmit={handleAddVariant}
        >
          <div className="flex-1 min-w-32">
            <label className="block text-xs text-ink-muted mb-1">Size</label>
            <input
              placeholder="e.g. Small"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="w-full rounded-md border border-line px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex-1 min-w-32">
            <label className="block text-xs text-ink-muted mb-1">Color</label>
            <input
              placeholder="e.g. Red"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full rounded-md border border-line px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex-1 min-w-32">
            <label className="block text-xs text-ink-muted mb-1">SKU</label>
            <input
              placeholder="Required"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              required
              className="w-full rounded-md border border-line px-3 py-1.5 text-sm"
            />
          </div>
          {isOwner && (
            <>
              <div className="flex-1 min-w-24">
                <label className="block text-xs text-ink-muted mb-1">Cost</label>
                <input
                  placeholder="0.00"
                  type="number"
                  min="0"
                  step="0.01"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  className="w-full rounded-md border border-line px-3 py-1.5 text-sm"
                />
              </div>
              <div className="flex-1 min-w-24">
                <label className="block text-xs text-ink-muted mb-1">Price</label>
                <input
                  placeholder="0.00"
                  type="number"
                  min="0"
                  step="0.01"
                  value={priceOverride}
                  onChange={(e) => setPriceOverride(e.target.value)}
                  className="w-full rounded-md border border-line px-3 py-1.5 text-sm"
                />
              </div>
            </>
          )}
          <button className="bg-brand text-white px-4 py-1.5 rounded-md hover:bg-brand-dark transition-colors text-sm" type="submit">
            Add Variant
          </button>
        </form>

        <div className="overflow-x-auto">
          {variants.length === 0 ? (
            <TableEmptyState message="No variants yet. Add one above" />
          ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-canvas border-b border-line">
                <th className="py-2.5 pl-3 text-left font-medium text-ink-muted">Variant</th>
                <th className="py-2.5 text-left font-medium text-ink-muted">SKU</th>
                {isOwner && <th className="py-2.5 text-left font-medium text-ink-muted">Cost</th>}
                {isOwner && <th className="py-2.5 text-left font-medium text-ink-muted">Price</th>}
                <th className="py-2.5 text-left font-medium text-ink-muted">Status</th>
                <th className="py-2.5 pr-3 text-left font-medium text-ink-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((v) => (
                  <Fragment key={v.id}>
                    <tr className="border-b border-line last:border-0 hover:bg-canvas transition-colors">
                      <td className="py-2.5 pl-3 font-medium text-ink-primary">
                        {v.size ?? v.color ?? 'Default'}
                      </td>
                      <td className="py-2.5">{v.sku}</td>
                      {isOwner && (
                        <td className="py-2.5">{v.costPrice != null ? `$${v.costPrice}` : '-'}</td>
                      )}
                      {isOwner && (
                        <td className="py-2.5">{v.priceOverride != null ? `$${v.priceOverride}` : '-'}</td>
                      )}
                      <td className="py-2.5">
                        <span className={`text-xs px-2 py-1 rounded ${v.isActive ? 'bg-success-light text-success' : 'bg-surface-hover text-ink-muted'}`}>
                          {v.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-2">
                          <button
                            className="text-xs text-ink-secondary underline"
                            onClick={() => setEditingVariantId(editingVariantId === v.id ? null : v.id)}
                          >
                            Edit
                          </button>
                          <button
                            className={`text-xs px-2 py-1 rounded ${v.isActive ? 'bg-error/10 text-error' : 'bg-success-light text-success'}`}
                            onClick={() => onToggleVariant(v.id, !v.isActive)}
                          >
                            {v.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {editingVariantId === v.id && (
                      <tr className="bg-brand-light">
                        <td colSpan={isOwner ? 6 : 4} className="px-3 py-3">
                          <VariantEditRow
                            variant={v}
                            isOwner={isOwner}
                            onSave={(input) => {
                              onUpdateVariant(v.id, input);
                              setEditingVariantId(null);
                            }}
                            onCancel={() => setEditingVariantId(null)}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
            </tbody>
          </table>
          )}
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-ink-primary mb-1">Custom Attributes</h4>
        <p className="text-xs text-ink-muted mb-3">Extra product details like material or origin</p>
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
            className="flex-1 rounded-md border border-line px-3 py-1.5 text-sm"
          />
          <input
            placeholder="Value"
            value={attrValue}
            onChange={(e) => setAttrValue(e.target.value)}
            required
            className="flex-1 rounded-md border border-line px-3 py-1.5 text-sm"
          />
          <button className="bg-brand text-white px-3 py-1.5 rounded-md hover:bg-brand-dark transition-colors text-sm" type="submit">Add</button>
        </form>
        <div className="flex flex-wrap gap-2">
          {attributes.length === 0 ? (
            <div className="w-full rounded-lg border border-line">
              <TableEmptyState message="No attributes yet" />
            </div>
          ) : (
          attributes.map((a) => (
            <span key={a.id} className="text-xs bg-surface-hover rounded px-2 py-1 flex items-center gap-1">
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
                    className="text-ink-muted hover:text-ink-primary ml-1"
                    title="Rename attribute"
                    onClick={() => setEditingAttrId(a.id)}
                  >
                    ✎
                  </button>
                </>
              )}
            </span>
          )))}
        </div>
      </div>
    </div>
  );
};

interface VariantEditRowProps {
  variant: ProductVariant;
  isOwner: boolean;
  onSave: (input: Partial<CreateVariantInput>) => void;
  onCancel: () => void;
}

const VariantEditRow: React.FC<VariantEditRowProps> = ({ variant, isOwner, onSave, onCancel }) => {
  const [size, setSize] = useState(variant.size ?? '');
  const [color, setColor] = useState(variant.color ?? '');
  const [sku, setSku] = useState(variant.sku);
  const [costPrice, setCostPrice] = useState(variant.costPrice != null ? String(variant.costPrice) : '');
  const [priceOverride, setPriceOverride] = useState(variant.priceOverride != null ? String(variant.priceOverride) : '');

  return (
    <div className="flex flex-wrap items-center gap-2">
        <input value={size} onChange={(e) => setSize(e.target.value)} placeholder="Size" className="flex-1 min-w-20 rounded-md border border-line px-2 py-1 text-sm" />
        <input value={color} onChange={(e) => setColor(e.target.value)} placeholder="Color" className="flex-1 min-w-20 rounded-md border border-line px-2 py-1 text-sm" />
        <input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="SKU" className="flex-1 min-w-20 rounded-md border border-line px-2 py-1 text-sm" />
        {isOwner && (
          <>
            <input
              value={costPrice}
              type="number"
              min="0"
              step="0.01"
              onChange={(e) => setCostPrice(e.target.value)}
              placeholder="Cost"
              className="flex-1 min-w-16 rounded-md border border-line px-2 py-1 text-sm"
            />
            <input
              value={priceOverride}
              type="number"
              min="0"
              step="0.01"
              onChange={(e) => setPriceOverride(e.target.value)}
              placeholder="Price"
              className="flex-1 min-w-16 rounded-md border border-line px-2 py-1 text-sm"
            />
          </>
        )}
        <div className="flex items-center gap-2">
          <button
            className="text-xs bg-brand text-white px-2 py-1 rounded-md"
            onClick={() => {
              const input = {
                sku,
                size: size || undefined,
                color: color || undefined,
                costPrice: isOwner && costPrice !== '' ? Number(costPrice) : undefined,
                priceOverride: isOwner && priceOverride !== '' ? Number(priceOverride) : undefined,
              };
              const check = variantSchema.safeParse({
                sku,
                size: size || null,
                color: color || null,
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
          <button className="text-xs text-ink-secondary underline" onClick={onCancel}>Cancel</button>
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
      <input value={key} onChange={(e) => setKey(e.target.value)} className="w-20 rounded-md border border-line px-1 py-0.5" />
      <span>:</span>
      <input value={val} onChange={(e) => setVal(e.target.value)} className="w-20 rounded-md border border-line px-1 py-0.5" />
      <button className="text-brand font-medium" onClick={() => onSave(key, val)}>Save</button>
      <button className="text-ink-muted underline" onClick={onCancel}>Cancel</button>
    </span>
  );
};

export default ProductDetail;