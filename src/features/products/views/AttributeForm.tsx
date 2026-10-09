import { useEffect, useState } from 'react';
import type { Product, ProductAttribute } from '../models/productTypes';
import LoadingButton from '../../../shared/components/LoadingButton';
import FieldError from '../../../shared/components/FieldError';

interface AttributeFormProps {
  products: Product[];
  productId: string;
  editingAttribute?: ProductAttribute | null;
  onSubmit: (productId: string, attributeKey: string, attributeValue: string) => Promise<void>;
  onUpdate?: (productId: string, id: string, attributeKey: string, attributeValue: string) => Promise<void>;
  onCancelEdit?: () => void;
}

const AttributeForm: React.FC<AttributeFormProps> = ({ productId, editingAttribute, onSubmit, onUpdate, onCancelEdit }) => {
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingAttribute) {
      setKey(editingAttribute.attributeKey);
      setValue(editingAttribute.attributeValue);
    } else {
      setKey('');
      setValue('');
    }
  }, [editingAttribute]);

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
    const nextErrors: Record<string, string> = {};
    if (!key.trim()) nextErrors.key = 'Key is required';
    if (!value.trim()) nextErrors.value = 'Value is required';
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setError(null);
    setSubmitting(true);
    try {
      if (editingAttribute && onUpdate) {
        await onUpdate(productId, editingAttribute.id, key.trim(), value.trim());
      } else {
        await onSubmit(productId, key.trim(), value.trim());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save attribute');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={submit} noValidate>
      <div>
        <label className="block text-sm text-ink-secondary">Key</label>
        <input
          placeholder="e.g. Material"
          value={key}
          onChange={(e) => {
            setKey(e.target.value);
            clearError('key');
          }}
          required
          className={`mt-1 w-full rounded-md border px-3 py-2 text-sm ${errors.key ? 'border-error' : 'border-line'}`}
        />
        <FieldError message={errors.key} />
      </div>
      <div>
        <label className="block text-sm text-ink-secondary">Value</label>
        <input
          placeholder="e.g. Cotton"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            clearError('value');
          }}
          required
          className={`mt-1 w-full rounded-md border px-3 py-2 text-sm ${errors.value ? 'border-error' : 'border-line'}`}
        />
        <FieldError message={errors.value} />
      </div>
      <div className="flex justify-end gap-2">
        <LoadingButton loading={submitting} loadingLabel={editingAttribute ? 'Saving…' : 'Adding…'}>
          {editingAttribute ? 'Save Changes' : 'Add Attribute'}
        </LoadingButton>
        {editingAttribute && onCancelEdit && (
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

export default AttributeForm;