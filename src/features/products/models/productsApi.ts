import type {
  Category,
  CreateProductInput,
  CreatePromoInput,
  CreateVariantInput,
  Product,
  ProductAttribute,
  ProductVariant,
  Promotion,
} from './productTypes';
import { apiRequest, invalidateCache, getCache } from '../../../shared/models/apiClient';
import { SERVER_PAGE_SIZE, toServerPage, type ServerPage } from '../../../shared/hooks/useServerPagination';

const CACHE_OPTIONS = { cache: true as const, cacheTtlMs: 5 * 60_000 };
const DETAIL_CACHE_OPTIONS = { cache: true as const, cacheTtlMs: 60_000 };

export const invalidateProductCaches = (): void => {
  invalidateCache('GET /catalog/products');
  invalidateCache('GET /catalog/categories');
  invalidateCache('GET /promotion/promotions');
};

export const invalidateVariantCache = (productId: string): void => {
  invalidateCache(`GET /catalog/products/${productId}/variants`);
};

export const invalidateAttributeCache = (productId: string): void => {
  invalidateCache(`GET /catalog/products/${productId}/attributes`);
};

interface RawProduct {
  id: string;
  tenantId: string;
  categoryId: string;
  name: string;
  description: string | null;
  basePrice: number | string;
  imageUrl: string | null;
  hasVariants: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  variants?: RawVariant[];
  attributes?: RawAttribute[];
}

interface RawVariant {
  id: string;
  productId: string;
  sku: string;
  label: string | null;
  size: string | null;
  color: string | null;
  priceOverride: number | string | null;
  costPrice: number | string | null;
  isActive: boolean;
  createdAt: string;
}

interface RawAttribute {
  id: string;
  productId: string;
  attributeKey: string;
  attributeValue: string;
}

const toCategory = (raw: { id: string; name: string; parentId: string | null; isActive: boolean }): Category => ({
  id: raw.id,
  name: raw.name,
  parentId: raw.parentId,
  isActive: raw.isActive,
});

const toProduct = (raw: RawProduct): Product => ({
  id: raw.id,
  name: raw.name,
  description: raw.description ?? '',
  basePrice: Number(raw.basePrice),
  imageUrl: raw.imageUrl ?? undefined,
  categoryId: raw.categoryId,
  isActive: raw.isActive,
});

const toVariant = (raw: RawVariant): ProductVariant => ({
  id: raw.id,
  productId: raw.productId,
  sku: raw.sku,
  size: raw.size ?? undefined,
  color: raw.color ?? undefined,
  costPrice: raw.costPrice != null ? Number(raw.costPrice) : undefined,
  priceOverride: raw.priceOverride != null ? Number(raw.priceOverride) : undefined,
  isActive: raw.isActive,
});

const toAttribute = (raw: RawAttribute): ProductAttribute => ({
  id: raw.id,
  productId: raw.productId,
  attributeKey: raw.attributeKey,
  attributeValue: raw.attributeValue,
});

const toPromotion = (raw: Promotion & { applicableItems?: Promotion['applicableItems'] }): Promotion => ({
  id: raw.id,
  name: raw.name,
  promoType: raw.promoType,
  config: raw.config,
  isStackable: raw.isStackable,
  isActive: raw.isActive,
  startDate: raw.startDate,
  endDate: raw.endDate,
  applicableItems: raw.applicableItems ?? [],
});

export const getCachedCategories = (): Category[] => {
  const data = getCache<{ categories: { id: string; name: string; parentId: string | null; isActive: boolean }[] }>(
    'GET /catalog/categories?limit=100',
  );
  return (data?.categories ?? []).map(toCategory);
};

export const fetchCategories = async (): Promise<Category[]> => {
  const data = await apiRequest<{
    categories: { id: string; name: string; parentId: string | null; isActive: boolean }[];
  }>('/catalog/categories?limit=100', CACHE_OPTIONS);
  return (data.categories ?? []).map(toCategory);
};

export const fetchCategoriesPage = async (page: number): Promise<ServerPage<Category>> => {
  const data = await apiRequest<{
    categories: { id: string; name: string; parentId: string | null; isActive: boolean }[];
  }>(`/catalog/categories?page=${page}&limit=${SERVER_PAGE_SIZE}&sortDirection=asc`);
  const categories = (data.categories ?? []).map(toCategory);
  return toServerPage<Category>({ ...data, categories }, 'categories');
};

export const createCategory = async (name: string, parentId: string | null): Promise<Category> => {
  const data = await apiRequest<{ id: string; name: string; parentId: string | null; isActive: boolean }>(
    '/catalog/categories',
    {
      method: 'POST',
      body: JSON.stringify({ name, parentId }),
    },
  );
  invalidateProductCaches();
  return toCategory(data);
};

export const updateCategory = async (id: string, name: string, parentId: string | null): Promise<Category> => {
  const data = await apiRequest<{ id: string; name: string; parentId: string | null; isActive: boolean }>(
    `/catalog/categories/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ name, parentId }),
    },
  );
  invalidateProductCaches();
  return toCategory(data);
};

export const setCategoryActive = async (id: string, isActive: boolean): Promise<void> => {
  await apiRequest<unknown>(`/catalog/categories/${id}/${isActive ? 'activate' : 'deactivate'}`, {
    method: 'POST',
  });
  invalidateProductCaches();
};

export const getCachedProducts = (): Product[] => {
  const data = getCache<{ products: RawProduct[] }>('GET /catalog/products?limit=100');
  return (data?.products ?? []).map(toProduct);
};

export const fetchProducts = async (branchId?: string | null): Promise<Product[]> => {
  const params = new URLSearchParams({ limit: '100' });
  if (branchId) params.set('branch_id', branchId);
  const data = await apiRequest<{ products: RawProduct[] }>(`/catalog/products?${params.toString()}`, CACHE_OPTIONS);
  return (data.products ?? []).map(toProduct);
};

export const fetchProductsPage = async (page: number, branchId?: string | null): Promise<ServerPage<Product>> => {
  const params = new URLSearchParams({ page: String(page), limit: String(SERVER_PAGE_SIZE), sortDirection: 'asc' });
  if (branchId) params.set('branch_id', branchId);
  const data = await apiRequest<{ products: RawProduct[] }>(`/catalog/products?${params.toString()}`);
  const products = (data.products ?? []).map(toProduct);
  return toServerPage<Product>({ ...data, products }, 'products');
};

export const createProduct = async (input: CreateProductInput): Promise<Product> => {
  const data = await apiRequest<RawProduct>('/catalog/products', {
    method: 'POST',
    body: JSON.stringify({
      categoryId: input.categoryId,
      name: input.name,
      description: input.description,
      basePrice: input.basePrice,
      imageUrl: input.imageUrl,
    }),
  });
  invalidateProductCaches();
  return toProduct(data);
};

export const updateProduct = async (id: string, input: Partial<CreateProductInput>): Promise<Product> => {
  const data = await apiRequest<RawProduct>(`/catalog/products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  invalidateProductCaches();
  return toProduct(data);
};

export const setProductActive = async (id: string, isActive: boolean): Promise<void> => {
  await apiRequest<unknown>(`/catalog/products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
  invalidateProductCaches();
};

export const uploadProductImage = async (file: File): Promise<string> => {
  const form = new FormData();
  form.append('image', file);
  const data = await apiRequest<{ imageUrl: string }>('/catalog/products/image', {
    method: 'POST',
    body: form,
  });
  return data.imageUrl;
};

export const fetchVariants = async (productId: string): Promise<ProductVariant[]> => {
  const data = await apiRequest<{ data: RawVariant[] }>(
    `/catalog/products/${productId}/variants`,
    DETAIL_CACHE_OPTIONS,
  );
  return (Array.isArray(data) ? data : data.data ?? []).map(toVariant);
};

export const createVariant = async (productId: string, input: CreateVariantInput & { branchId: string }): Promise<ProductVariant> => {
  const data = await apiRequest<RawVariant>(`/catalog/products/${productId}/variants`, {
    method: 'POST',
    body: JSON.stringify({
      branchId: input.branchId,
      sku: input.sku,
      size: input.size,
      color: input.color,
      priceOverride: input.priceOverride,
      costPrice: input.costPrice,
    }),
  });
  invalidateProductCaches();
  invalidateVariantCache(productId);
  return toVariant(data);
};

export const updateVariant = async (productId: string, variantId: string, input: Partial<CreateVariantInput>): Promise<ProductVariant> => {
  const data = await apiRequest<RawVariant>(`/catalog/products/${productId}/variants/${variantId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  invalidateProductCaches();
  invalidateVariantCache(productId);
  return toVariant(data);
};

export const setVariantActive = async (productId: string, variantId: string, isActive: boolean): Promise<void> => {
  await apiRequest<unknown>(`/catalog/products/${productId}/variants/${variantId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
  invalidateProductCaches();
  invalidateVariantCache(productId);
};

export const fetchAttributes = async (productId: string): Promise<ProductAttribute[]> => {
  const data = await apiRequest<{ data: RawAttribute[] }>(
    `/catalog/products/${productId}/attributes`,
    DETAIL_CACHE_OPTIONS,
  );
  return (Array.isArray(data) ? data : data.data ?? []).map(toAttribute);
};

export const createAttribute = async (productId: string, attributeKey: string, attributeValue: string): Promise<ProductAttribute> => {
  const data = await apiRequest<RawAttribute>(`/catalog/products/${productId}/attributes`, {
    method: 'POST',
    body: JSON.stringify({ attributeKey, attributeValue }),
  });
  invalidateAttributeCache(productId);
  return toAttribute(data);
};

export const updateAttribute = async (productId: string, id: string, attributeKey: string, attributeValue: string): Promise<ProductAttribute> => {
  const data = await apiRequest<RawAttribute>(`/catalog/products/${productId}/attributes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ attributeKey, attributeValue }),
  });
  invalidateAttributeCache(productId);
  return toAttribute(data);
};

export const getCachedPromotions = (): Promotion[] => {
  const cached = getCache<{ promotions: Promotion[] }>('GET /promotion/promotions?limit=100');
  return (cached?.promotions ?? []).map(toPromotion);
};

export const fetchPromotions = async (): Promise<Promotion[]> => {
  const data = await apiRequest<{ promotions: Promotion[] }>('/promotion/promotions?limit=100', CACHE_OPTIONS);
  return (data.promotions ?? []).map(toPromotion);
};

export const fetchPromotionsPage = async (page: number, isActive?: boolean): Promise<ServerPage<Promotion>> => {
  const query = isActive === undefined ? '' : `&is_active=${isActive}`;
  const data = await apiRequest<{ promotions: Promotion[] }>(
    `/promotion/promotions?page=${page}&limit=${SERVER_PAGE_SIZE}&sortDirection=asc${query}`,
  );
  const promotions = (data.promotions ?? []).map(toPromotion);
  return toServerPage<Promotion>({ ...data, promotions }, 'promotions');
};

export const createPromotion = async (input: CreatePromoInput): Promise<Promotion> => {
  const data = await apiRequest<{ id: string; isActive: boolean }>('/promotion/promotions', {
    method: 'POST',
    body: JSON.stringify({
      name: input.name,
      promoType: input.promoType,
      config: input.config,
      isStackable: input.isStackable,
      startDate: input.startDate,
      endDate: input.endDate,
      applicableItems: input.applicableItems,
    }),
  });
  invalidateProductCaches();
  return {
    id: data.id,
    name: input.name,
    promoType: input.promoType,
    config: input.config,
    isStackable: input.isStackable,
    isActive: data.isActive,
    startDate: input.startDate,
    endDate: input.endDate,
    applicableItems: input.applicableItems.map((item) => ({
      id: '',
      scope: item.scope,
      productId: item.productId,
      categoryId: item.categoryId,
    })),
  };
};

export const updatePromotion = async (id: string, input: CreatePromoInput): Promise<void> => {
  await apiRequest<unknown>(`/promotion/promotions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      name: input.name,
      promoType: input.promoType,
      config: input.config,
      isStackable: input.isStackable,
      isActive: input.isActive,
      startDate: input.startDate,
      endDate: input.endDate,
      applicableItems: input.applicableItems,
    }),
  });
  invalidateProductCaches();
};

export const setPromotionActive = async (id: string, isActive: boolean): Promise<void> => {
  await apiRequest<unknown>(`/promotion/promotions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
  invalidateProductCaches();
};