import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { CreateVariantInput, Product, ProductVariant } from '../models/productTypes';
import { variantSchema, firstZodMessage } from '../../../shared/validation/schemas';
import LoadingButton from '../../../shared/components/LoadingButton';
import { sanitizeDecimal } from '../../../shared/utils/numeric';

interface VariantFormProps {
  products: Product[];
  productId: string;
  isOwner: boolean;
  editingVariant?: ProductVariant | null;
  onSubmit: (productId: string, input: CreateVariantInput) => Promise<void>;
  onUpdate?: (productId: string, variantId: string, input: Partial<CreateVariantInput>) => Promise<void>;
  onCancelEdit?: () => void;
}

const VariantForm: React.FC<VariantFormProps> = ({ productId, isOwner, editingVariant, onSubmit, onUpdate, onCancelEdit }) => {
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [sku, setSku] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [priceOverride, setPriceOverride] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingVariant) {
      setSize(editingVariant.size ?? '');
      setColor(editingVariant.color ?? '');
      setSku(editingVariant.sku);
      setCostPrice(editingVariant.costPrice != null ? String(editingVariant.costPrice) : '');
      setPriceOverride(editingVariant.priceOverride != null ? String(editingVariant.priceOverride) : '');
    } else {
      setSize('');
      setColor('');
      setSku('');
      setCostPrice('');
      setPriceOverride('');
    }
  }, [editingVariant]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    const input = {
      size: size || undefined,
      color: color || undefined,
      sku,
      costPrice: isOwner && costPrice !== '' ? Number(costPrice) : undefined,
      priceOverride: isOwner && priceOverride !== '' ? Number(priceOverride) : undefined,
    };
    setSubmitting(true);
    try {
      if (editingVariant && onUpdate) {
        await onUpdate(productId, editingVariant.id, input);
      } else {
        await onSubmit(productId, input);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={submit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-ink-secondary">Size</label>
          <input
            placeholder="e.g. Small"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-ink-secondary">Color</label>
          <input
            placeholder="e.g. Red"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm text-ink-secondary">SKU</label>
        <input
          placeholder="Required"
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          required
          className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm"
        />
      </div>
      {isOwner && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-ink-secondary">Cost</label>
            <input
              placeholder="0.00"
              type="number"
              min="0"
              step="0.01"
              value={costPrice}
              onChange={(e) => setCostPrice(sanitizeDecimal(e.target.value))}
              className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-ink-secondary">Price</label>
            <input
              placeholder="0.00"
              type="number"
              min="0"
              step="0.01"
              value={priceOverride}
              onChange={(e) => setPriceOverride(sanitizeDecimal(e.target.value))}
              className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm"
            />
          </div>
        </div>
      )}
      <div className="flex justify-end gap-2">
        <LoadingButton loading={submitting} loadingLabel={editingVariant ? 'Saving…' : 'Adding…'}>
          {editingVariant ? 'Save Changes' : 'Add Variant'}
        </LoadingButton>
        {editingVariant && onCancelEdit && (
          <button
            type="button"
            disabled={submitting}
            className="px-4 py-2 rounded-md border border-line text-ink-secondary hover:bg-canvas disabled:opacity-50"
            onClick={onCancelEdit}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default VariantForm;