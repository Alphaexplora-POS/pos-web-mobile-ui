import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { Product, ProductAttribute } from '../models/productTypes';
import LoadingButton from '../../../shared/components/LoadingButton';

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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim() || !value.trim()) {
      toast.error('Enter both a key and a value');
      return;
    }
    setSubmitting(true);
    try {
      if (editingAttribute && onUpdate) {
        await onUpdate(productId, editingAttribute.id, key.trim(), value.trim());
      } else {
        await onSubmit(productId, key.trim(), value.trim());
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={submit}>
      <div>
        <label className="block text-sm text-ink-secondary">Key</label>
        <input
          placeholder="e.g. Material"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          required
          className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm text-ink-secondary">Value</label>
        <input
          placeholder="e.g. Cotton"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required
          className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm"
        />
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
    </form>
  );
};

export default AttributeForm;