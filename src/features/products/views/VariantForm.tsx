import { useEffect, useState } from 'react';
import type { CreateVariantInput, Product, ProductVariant } from '../models/productTypes';
import { variantSchema } from '../../../shared/validation/schemas';
import { routeFieldError } from '../../../shared/validation/routeFieldError';
import LoadingButton from '../../../shared/components/LoadingButton';
import FieldError from '../../../shared/components/FieldError';
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
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

  const clearError = (field: string) => {
    if (!errors[field]) return;
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

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
      setErrors(
        Object.fromEntries(
          Object.entries(check.error.flatten().fieldErrors).map(([k, v]) => [k, v?.[0] ?? '']),
        ),
      );
      return;
    }
    setErrors({});
    setError(null);
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
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save variant';
      const field = routeFieldError(message, ['sku']);
      if (field) setErrors((prev) => ({ ...prev, [field]: message }));
      else setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={submit} noValidate>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-ink-secondary">Size</label>
          <input
            placeholder="e.g. Small"
            value={size}
            onChange={(e) => {
              setSize(e.target.value);
              clearError('size');
            }}
            className={`mt-1 w-full rounded-md border px-3 py-2 text-sm ${errors.size ? 'border-error' : 'border-line'}`}
          />
          <FieldError message={errors.size} />
        </div>
        <div>
          <label className="block text-sm text-ink-secondary">Color</label>
          <input
            placeholder="e.g. Red"
            value={color}
            onChange={(e) => {
              setColor(e.target.value);
              clearError('color');
            }}
            className={`mt-1 w-full rounded-md border px-3 py-2 text-sm ${errors.color ? 'border-error' : 'border-line'}`}
          />
          <FieldError message={errors.color} />
        </div>
      </div>
      <div>
        <label className="block text-sm text-ink-secondary">SKU</label>
        <input
          placeholder="Required"
          value={sku}
          onChange={(e) => {
            setSku(e.target.value);
            clearError('sku');
          }}
          required
          className={`mt-1 w-full rounded-md border px-3 py-2 text-sm ${errors.sku ? 'border-error' : 'border-line'}`}
        />
        <FieldError message={errors.sku} />
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
              onChange={(e) => {
                setCostPrice(sanitizeDecimal(e.target.value));
                clearError('costPrice');
              }}
              className={`mt-1 w-full rounded-md border px-3 py-2 text-sm ${errors.costPrice ? 'border-error' : 'border-line'}`}
            />
            <FieldError message={errors.costPrice} />
          </div>
          <div>
            <label className="block text-sm text-ink-secondary">Price</label>
            <input
              placeholder="0.00"
              type="number"
              min="0"
              step="0.01"
              value={priceOverride}
              onChange={(e) => {
                setPriceOverride(sanitizeDecimal(e.target.value));
                clearError('priceOverride');
              }}
              className={`mt-1 w-full rounded-md border px-3 py-2 text-sm ${errors.priceOverride ? 'border-error' : 'border-line'}`}
            />
            <FieldError message={errors.priceOverride} />
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
      <FieldError message={error} />
    </form>
  );
};

export default VariantForm;