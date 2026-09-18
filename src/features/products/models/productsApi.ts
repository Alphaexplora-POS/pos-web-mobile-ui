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
import { apiRequest } from '../../../shared/models/apiClient';

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

export const fetchCategories = async (): Promise<Category[]> => {
  const data = await apiRequest<{
    categories: { id: string; name: string; parentId: string | null; isActive: boolean }[];
  }>('/catalog/categories');
  return (data.categories ?? []).map(toCategory);
};

export const createCategory = async (name: string, parentId: string | null): Promise<Category> => {
  const data = await apiRequest<{ id: string; name: string; parentId: string | null; isActive: boolean }>(
    '/catalog/categories',
    {
      method: 'POST',
      body: JSON.stringify({ name, parentId }),
    },
  );
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
  return toCategory(data);
};

export const setCategoryActive = async (id: string, isActive: boolean): Promise<void> => {
  await apiRequest<unknown>(`/catalog/categories/${id}/${isActive ? 'activate' : 'deactivate'}`, {
    method: 'POST',
  });
};

export const fetchProducts = async (): Promise<Product[]> => {
  const data = await apiRequest<{ products: RawProduct[] }>('/catalog/products');
  return (data.products ?? []).map(toProduct);
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
  return toProduct(data);
};

export const updateProduct = async (id: string, input: Partial<CreateProductInput>): Promise<Product> => {
  const data = await apiRequest<RawProduct>(`/catalog/products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return toProduct(data);
};

export const setProductActive = async (id: string, isActive: boolean): Promise<void> => {
  await apiRequest<unknown>(`/catalog/products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
};

export const fetchVariants = async (productId: string): Promise<ProductVariant[]> => {
  const data = await apiRequest<{ data: RawVariant[] }>(`/catalog/products/${productId}/variants`);
  return (Array.isArray(data) ? data : data.data ?? []).map(toVariant);
};

export const createVariant = async (productId: string, input: CreateVariantInput): Promise<ProductVariant> => {
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
  return toVariant(data);
};

export const updateVariant = async (productId: string, variantId: string, input: Partial<CreateVariantInput>): Promise<ProductVariant> => {
  const data = await apiRequest<RawVariant>(`/catalog/products/${productId}/variants/${variantId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return toVariant(data);
};

export const setVariantActive = async (productId: string, variantId: string, isActive: boolean): Promise<void> => {
  await apiRequest<unknown>(`/catalog/products/${productId}/variants/${variantId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
};

export const fetchAttributes = async (productId: string): Promise<ProductAttribute[]> => {
  const data = await apiRequest<{ data: RawAttribute[] }>(`/catalog/products/${productId}/attributes`);
  return (Array.isArray(data) ? data : data.data ?? []).map(toAttribute);
};

export const createAttribute = async (productId: string, attributeKey: string, attributeValue: string): Promise<ProductAttribute> => {
  const data = await apiRequest<RawAttribute>(`/catalog/products/${productId}/attributes`, {
    method: 'POST',
    body: JSON.stringify({ attributeKey, attributeValue }),
  });
  return toAttribute(data);
};

export const updateAttribute = async (productId: string, id: string, attributeKey: string, attributeValue: string): Promise<ProductAttribute> => {
  const data = await apiRequest<RawAttribute>(`/catalog/products/${productId}/attributes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ attributeKey, attributeValue }),
  });
  return toAttribute(data);
};

export const fetchPromotions = async (): Promise<Promotion[]> => {
  const data = await apiRequest<{ promotions: Promotion[] }>('/promotion/promotions');
  return (data.promotions ?? []).map(toPromotion);
};

export const createPromotion = async (input: CreatePromoInput): Promise<Promotion> => {
  const data = await apiRequest<{ id: string; isActive: boolean }>('/promotion/promotions', {
    method: 'POST',
    body: JSON.stringify({
      name: input.name,
      promoType: input.promoType,
      config: input.config,
      isStackable: input.isStackable,
      applicableItems: input.applicableItems,
    }),
  });
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

export const setPromotionActive = async (id: string, isActive: boolean): Promise<void> => {
  await apiRequest<unknown>(`/promotion/promotions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
};