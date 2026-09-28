import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import Select from '../../../shared/components/Select';
import LoadingButton from '../../../shared/components/LoadingButton';
import type { Category, CreateProductInput, Product } from '../models/productTypes';
import { productSchema, firstZodMessage } from '../../../shared/validation/schemas';
import { uploadProductImage } from '../models/productsApi';

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
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name);
      setDescription(editingProduct.description);
      setBasePrice(String(editingProduct.basePrice));
      setCategoryId(editingProduct.categoryId);
      setImageUrl(editingProduct.imageUrl);
    } else {
      setName('');
      setDescription('');
      setBasePrice('');
      setCategoryId('');
      setImageUrl(undefined);
    }
    if (fileRef.current) fileRef.current.value = '';
  }, [editingProduct]);

  if (!isOwner) return null;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadProductImage(file);
      setImageUrl(url);
      toast.success('Image uploaded');
    } catch {
      toast.error('Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    const check = productSchema.safeParse({
      categoryId,
      name,
      description: description || undefined,
      basePrice: Number(basePrice),
    });
    if (!check.success) {
      toast.error(firstZodMessage(check.error));
      return false;
    }
    const data: CreateProductInput = {
      name,
      description,
      basePrice: Number(basePrice),
      categoryId,
      ...(imageUrl ? { imageUrl } : {}),
    };
    setSubmitting(true);
    try {
      if (editingProduct && onUpdate) {
        await onUpdate(editingProduct.id, data);
      } else {
        await onSubmit(data);
      }
    } finally {
      setSubmitting(false);
    }
    return true;
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      <div>
        <label className="block text-sm text-ink-secondary">Product Image</label>
        <div className="mt-1 flex items-center gap-4">
          <button
            type="button"
            className="shrink-0 rounded-md border border-line bg-canvas overflow-hidden disabled:opacity-50"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            title="Click to upload image"
          >
            {imageUrl ? (
              <img src={imageUrl} alt="Preview" className="w-20 h-20 object-cover" />
            ) : (
              <div className="w-20 h-20 flex flex-col items-center justify-center text-ink-muted">
                <span className="text-2xl leading-none">{uploading ? '…' : '+'}</span>
                <span className="text-xs mt-1">{uploading ? 'Uploading' : 'Upload'}</span>
              </div>
            )}
          </button>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              className="text-sm px-4 py-1.5 rounded-md border border-line text-ink-secondary hover:bg-canvas transition-colors disabled:opacity-50"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? 'Uploading…' : imageUrl ? 'Change image' : 'Upload image'}
            </button>
            {imageUrl && (
              <button
                type="button"
                className="text-sm px-4 py-1.5 rounded-md border border-line text-error hover:bg-error/5 transition-colors"
                onClick={() => {
                  setImageUrl(undefined);
                  if (fileRef.current) fileRef.current.value = '';
                }}
              >
                Remove
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            className="hidden"
            onChange={handleFile}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-ink-secondary">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 w-full rounded border border-line px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm text-ink-secondary">Base Price</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
            required
            className="mt-1 w-full rounded border border-line px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm text-ink-secondary">Category</label>
          <Select
            value={categoryId}
            onChange={(v) => setCategoryId(v)}
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            placeholder="Select category"
            className="mt-1 w-full"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm text-ink-secondary">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          className="mt-1 w-full rounded border border-line px-3 py-2"
        />
      </div>
      <LoadingButton loading={submitting} loadingLabel={editingProduct ? 'Saving…' : 'Creating…'}>
        {editingProduct ? 'Save Changes' : 'Create Product'}
      </LoadingButton>
    </form>
  );
};

export default ProductForm;