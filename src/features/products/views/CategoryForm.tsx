import { useState } from 'react';
import type { Category } from '../models/productTypes';

interface CategoryFormProps {
  categories: Category[];
  onSubmit: (name: string, parentId: string | null) => void;
}

const CategoryForm: React.FC<CategoryFormProps> = ({ categories, onSubmit }) => {
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [categoryType, setCategoryType] = useState<'parent' | 'child'>('parent');

  return (
    <form
      className="bg-white rounded-lg shadow p-6 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(name, categoryType === 'parent' ? null : parentId);
        setName('');
      }}
    >
      <h3 className="text-lg font-semibold text-gray-900">Add Category</h3>
      <div>
        <label className="block text-sm text-gray-600">Category Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-600">Category Type</label>
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
          <label className="block text-sm text-gray-600">Parent Category</label>
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            required
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
          >
            <option value="" disabled>Select parent</option>
            {categories.filter((c) => c.parentId === null).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
        Create Category
      </button>
    </form>
  );
};

export default CategoryForm;
