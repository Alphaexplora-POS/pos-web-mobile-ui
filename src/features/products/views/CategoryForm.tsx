import { useEffect, useState } from 'react';
import Select from '../../../shared/components/Select';
import LoadingButton from '../../../shared/components/LoadingButton';
import FieldError from '../../../shared/components/FieldError';
import type { Category } from '../models/productTypes';
import { categorySchema } from '../../../shared/validation/schemas';
import { routeFieldError } from '../../../shared/validation/routeFieldError';

interface CategoryFormProps {
  categories: Category[];
  onSubmit: (name: string, parentId: string | null) => void | Promise<void>;
  onUpdate: (id: string, name: string, parentId: string | null) => void | Promise<void>;
  editingCategory: Category | null;
  onCancelEdit: () => void;
}

const CategoryForm: React.FC<CategoryFormProps> = ({
  categories,
  onSubmit,
  onUpdate,
  editingCategory,
  onCancelEdit,
}) => {
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [categoryType, setCategoryType] = useState<'parent' | 'child'>('parent');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingCategory) {
      setName(editingCategory.name);
      const hasParent = Boolean(editingCategory.parentId);
      setCategoryType(hasParent ? 'child' : 'parent');
      setParentId(editingCategory.parentId ?? '');
    } else {
      setName('');
      setParentId('');
      setCategoryType('parent');
    }
  }, [editingCategory]);

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
    const check = categorySchema.safeParse({ name });
    if (!check.success) {
      setErrors(
        Object.fromEntries(
          Object.entries(check.error.flatten().fieldErrors).map(([k, v]) => [k, v?.[0] ?? '']),
        ),
      );
      return;
    }
    if (categoryType === 'child' && !parentId) {
      setErrors({ parentId: 'Please select a parent category' });
      return;
    }
    const resolvedParentId = categoryType === 'parent' ? null : parentId;
    setErrors({});
    setError(null);
    setSubmitting(true);
    try {
      if (editingCategory) {
        await onUpdate(editingCategory.id, name, resolvedParentId);
      } else {
        await onSubmit(name, resolvedParentId);
      }
      setName('');
      setParentId('');
      setCategoryType('parent');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save category';
      const field = routeFieldError(message, ['name']);
      if (field) setErrors((prev) => ({ ...prev, [field]: message }));
      else setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const parentOptions = categories
    .filter((c) => c.parentId === null && c.id !== editingCategory?.id)
    .map((c) => ({ value: c.id, label: c.name }));

  return (
    <form
      className="space-y-4"
      onSubmit={submit}
      noValidate
    >
      <div>
        <label className="block text-sm text-ink-secondary">Category Name</label>
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            clearError('name');
          }}
          required
          className={`mt-1 w-full rounded border px-3 py-2 ${errors.name ? 'border-error' : 'border-line'}`}
        />
        <FieldError message={errors.name} />
      </div>
      <div>
        <label className="block text-sm text-ink-secondary">Category Type</label>
        <div className="flex gap-4 mt-1">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              checked={categoryType === 'parent'}
              onChange={() => setCategoryType('parent')}
            />
            Parent (top-level)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              checked={categoryType === 'child'}
              onChange={() => setCategoryType('child')}
            />
            Child
          </label>
        </div>
      </div>
      {categoryType === 'child' && (
        <div>
          <label className="block text-sm text-ink-secondary">Parent Category</label>
          <Select
            value={parentId}
            onChange={(v) => {
              setParentId(v);
              clearError('parentId');
            }}
            options={parentOptions}
            placeholder="Select parent"
            className="mt-1 w-full"
            invalid={Boolean(errors.parentId)}
          />
          <FieldError message={errors.parentId} />
        </div>
      )}
      <div className="flex gap-2">
        <LoadingButton loading={submitting} loadingLabel={editingCategory ? 'Saving…' : 'Creating…'}>
          {editingCategory ? 'Save Changes' : 'Create Category'}
        </LoadingButton>
        {editingCategory && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="px-4 py-2 rounded border border-line text-ink-secondary hover:bg-canvas"
          >
            Cancel
          </button>
        )}
      </div>
      <FieldError message={error} />
    </form>
  );
};

export default CategoryForm;