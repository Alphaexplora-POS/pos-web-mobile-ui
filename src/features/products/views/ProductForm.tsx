import { useState } from 'react';
import type { Category } from '../models/productTypes';

interface ProductFormProps {
  categories: Category[];
  onSubmit: (data: {
    name: string;
    description: string;
    basePrice: number;
    imageUrl?: string;
    categoryId: string;
  }) => void;
  isOwner: boolean;
}

const ProductForm: React.FC<ProductFormProps> = ({ categories, onSubmit, isOwner }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [categoryId, setCategoryId] = useState('');

  if (!isOwner) return null;

  return (
    <form
      className="bg-white rounded-lg shadow p-6 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          name,
          description,
          basePrice: Number(basePrice),
          imageUrl: imageUrl || undefined,
          categoryId,
        });
        setName('');
        setDescription('');
        setBasePrice('');
        setImageUrl('');
      }}
    >
      <h3 className="text-lg font-semibold text-gray-900">Add Product</h3>
      <div>
        <label className="block text-sm text-gray-600">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-600">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-600">Base Price</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={basePrice}
          onChange={(e) => setBasePrice(e.target.value)}
          required
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-600">Image URL</label>
        <input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-600">Category</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          required
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
        >
          <option value="" disabled>Select category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
        Create Product
      </button>
    </form>
  );
};

export default ProductForm;
