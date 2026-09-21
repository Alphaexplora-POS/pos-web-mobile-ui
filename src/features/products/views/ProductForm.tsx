import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Select from '../../../shared/components/Select';
import type { Category, CreateProductInput, Product } from '../models/productTypes';
import { productSchema, firstZodMessage } from '../../../shared/validation/schemas';

interface ProductFormProps {
  categories: Category[];
  onSubmit: (data: CreateProductInput) => void | Promise<void>;
  onUpdate?: (id: string, data: CreateProductInput) => void | Promise<void>;
  editingProduct?: Product | null;
  onCancelEdit?: () => void;
  isOwner: boolean;
}

const ProductForm: React.FC<ProductFormProps> = ({ categories, onSubmit, onUpdate, editingProduct, isOwner }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [categoryId, setCategoryId] = useState('');

  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name);
      setDescription(editingProduct.description);
      setBasePrice(String(editingProduct.basePrice));
      setImageUrl(editingProduct.imageUrl ?? '');
      setCategoryId(editingProduct.categoryId);
    } else {
      setName('');
      setDescription('');
      setBasePrice('');
      setImageUrl('');
      setCategoryId('');
    }
  }, [editingProduct]);

  if (!isOwner) return null;

  const submitting = async () => {
    const check = productSchema.safeParse({
      categoryId,
      name,
      description: description || undefined,
      basePrice: Number(basePrice),
      imageUrl: imageUrl || undefined,
    });
    if (!check.success) {
      toast.error(firstZodMessage(check.error));
      return false;
    }
    const data: CreateProductInput = {
      name,
      description,
      basePrice: Number(basePrice),
      imageUrl: imageUrl || undefined,
      categoryId,
    };
    if (editingProduct && onUpdate) {
      await onUpdate(editingProduct.id, data);
    } else {
      await onSubmit(data);
    }
    return true;
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        submitting();
      }}
    >
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
        <Select
          value={categoryId}
          onChange={(v) => setCategoryId(v)}
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
          placeholder="Select category"
          className="mt-1 w-full"
        />
      </div>
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
        {editingProduct ? 'Save Changes' : 'Create Product'}
      </button>
    </form>
  );
};

export default ProductForm;