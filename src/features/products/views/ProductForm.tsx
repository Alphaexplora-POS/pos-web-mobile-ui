import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import Select from '../../../shared/components/Select';
import LoadingButton from '../../../shared/components/LoadingButton';
import Spinner from '../../../shared/components/Spinner';
import type { Category, CreateProductInput, Product } from '../models/productTypes';
import { productSchema } from '../../../shared/validation/schemas';
import { routeFieldError } from '../../../shared/validation/routeFieldError';
import FieldError from '../../../shared/components/FieldError';
import { uploadProductImage } from '../models/productsApi';
import { sanitizeDecimal } from '../../../shared/utils/numeric';

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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const clearError = (field: string) => {
    if (!errors[field]) return;
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name);
      setDescription(editingProduct.description);
      setBasePrice(String(editingProduct.basePrice));
      setCategoryId(editingProduct.categoryId);
      setImageUrl(editingProduct.imageUrl ?? undefined);
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
    const previousUrl = imageUrl;
    const previewUrl = URL.createObjectURL(file);
    setImageUrl(previewUrl);
    setUploading(true);
    try {
      const url = await uploadProductImage(file);
      setImageUrl(url);
      toast.success('Image uploaded');
    } catch {
      setImageUrl(previousUrl);
      setError('Image upload failed');
    } finally {
      setUploading(false);
      URL.revokeObjectURL(previewUrl);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl(undefined);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (basePrice.trim() === '') {
      setErrors({ basePrice: 'Please enter a valid price' });
      return false;
    }
    const check = productSchema.safeParse({
      categoryId,
      name,
      description: description || undefined,
      basePrice: Number(basePrice),
    });
    if (!check.success) {
      setErrors(
        Object.fromEntries(
          Object.entries(check.error.flatten().fieldErrors).map(([k, v]) => [k, v?.[0] ?? '']),
        ),
      );
      return false;
    }
    setErrors({});
    setError(null);
    const data: CreateProductInput = {
      name,
      description,
      basePrice: Number(basePrice),
      categoryId,
      imageUrl: imageUrl ?? null,
    };
    setSubmitting(true);
    try {
      if (editingProduct && onUpdate) {
        await onUpdate(editingProduct.id, data);
      } else {
        await onSubmit(data);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save product';
      const field = routeFieldError(message, ['name', 'categoryId', 'basePrice']);
      if (field) setErrors((prev) => ({ ...prev, [field]: message }));
      else setError(message);
    } finally {
      setSubmitting(false);
    }
    return true;
  };

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm text-ink-secondary mb-1.5">Product Image</label>
          <div className="group relative">
            <button
              type="button"
              className={`relative block w-full overflow-hidden rounded-lg border-2 bg-canvas transition-colors disabled:opacity-50 ${
                imageUrl ? 'border-line' : 'border-dashed border-line-strong hover:border-brand'
              }`}
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              title={imageUrl ? 'Click to change image' : 'Click to upload image'}
            >
              {imageUrl ? (
                <>
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className={`aspect-square w-full object-cover transition-all duration-200 ${
                      uploading ? 'opacity-50' : 'group-hover:scale-105 group-hover:blur-[3px]'
                    }`}
                  />
                  {uploading && (
                    <span className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-black/40">
                      <Spinner />
                      <span className="text-xs font-medium text-white">Uploading…</span>
                    </span>
                  )}
                </>
              ) : (
                <div className="aspect-square w-full flex flex-col items-center justify-center gap-2 text-ink-muted">
                  {uploading ? <Spinner /> : <span className="text-4xl leading-none">+</span>}
                  <span className="text-xs font-medium">{uploading ? 'Uploading…' : 'Click to upload'}</span>
                </div>
              )}
            </button>
            {imageUrl && !uploading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center gap-3 bg-black/30 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white shadow-md transition-colors hover:bg-brand-dark"
                  onClick={() => fileRef.current?.click()}
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a9 9 0 1 1-9-9" />
                    <path d="M21 3v6h-6" />
                  </svg>
                  New
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-semibold text-error shadow-md transition-colors hover:bg-error hover:text-white"
                  onClick={handleRemoveImage}
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18" />
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                  </svg>
                  Remove
                </button>
              </div>
            )}
          </div>
          <p className="mt-1.5 text-xs text-ink-muted">JPG, PNG, WEBP, GIF, AVIF · max 25MB</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            className="hidden"
            onChange={handleFile}
          />
        </div>
        <div className="md:col-span-3 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-ink-secondary">Name</label>
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
              <label className="block text-sm text-ink-secondary">Base Price</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={basePrice}
                onChange={(e) => {
                  setBasePrice(sanitizeDecimal(e.target.value));
                  clearError('basePrice');
                }}
                required
                className={`mt-1 w-full rounded border px-3 py-2 ${errors.basePrice ? 'border-error' : 'border-line'}`}
              />
              <FieldError message={errors.basePrice} />
            </div>
          </div>
          <div>
            <label className="block text-sm text-ink-secondary">Category</label>
            <Select
              value={categoryId}
              onChange={(v) => {
                setCategoryId(v);
                clearError('categoryId');
              }}
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
              placeholder="Select category"
              className="mt-1 w-full"
              invalid={Boolean(errors.categoryId)}
            />
            <FieldError message={errors.categoryId} />
          </div>
          <div>
            <label className="block text-sm text-ink-secondary">Description</label>
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                clearError('description');
              }}
              required
              rows={3}
              className={`mt-1 w-full rounded border px-3 py-2 ${errors.description ? 'border-error' : 'border-line'}`}
            />
            <FieldError message={errors.description} />
          </div>
        </div>
      </div>
      <div className="pt-2">
        <LoadingButton loading={submitting} loadingLabel={editingProduct ? 'Saving…' : 'Creating…'}>
          {editingProduct ? 'Save Changes' : 'Create Product'}
        </LoadingButton>
        <FieldError message={error} />
      </div>
    </form>
  );
};

export default ProductForm;