import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import Select from '../../../shared/components/Select';
import type { Category } from '../models/productTypes';
import { categorySchema, firstZodMessage } from '../../../shared/validation/schemas';

interface CategoryFormProps {
  categories: Category[];
  onSubmit: (name: string, parentId: string | null) => void;
  onUpdate: (id: string, name: string, parentId: string | null) => void;
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

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const check = categorySchema.safeParse({ name });
    if (!check.success) {
      toast.error(firstZodMessage(check.error));
      return;
    }
    if (categoryType === 'child' && !parentId) {
      toast.error('Please select a parent category');
      return;
    }
    const resolvedParentId = categoryType === 'parent' ? null : parentId;
    if (editingCategory) {
      onUpdate(editingCategory.id, name, resolvedParentId);
    } else {
      onSubmit(name, resolvedParentId);
    }
    setName('');
    setParentId('');
    setCategoryType('parent');
  };

  const parentOptions = categories
    .filter((c) => c.parentId === null && c.id !== editingCategory?.id)
    .map((c) => ({ value: c.id, label: c.name }));

  return (
    <form
      className="space-y-4"
      onSubmit={submit}
    >
      <div>
        <label className="block text-sm text-ink-secondary">Category Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 w-full rounded border border-line px-3 py-2"
        />
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
            onChange={(v) => setParentId(v)}
            options={parentOptions}
            placeholder="Select parent"
            className="mt-1 w-full"
          />
        </div>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          className="bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark"
        >
          {editingCategory ? 'Save Changes' : 'Create Category'}
        </button>
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
    </form>
  );
};

export default CategoryForm;