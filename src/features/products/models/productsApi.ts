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
import { USE_MOCK } from '../../../mock/config';
import * as mock from '../../../mock/mockApi';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

export const fetchCategories = async (): Promise<Category[]> => {
  if (USE_MOCK) return mock.fetchCategories();
  const res = await fetch(`${API_BASE}/categories`);
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
};

export const createCategory = async (name: string, parentId: string | null): Promise<Category> => {
  if (USE_MOCK) return mock.createCategory(name, parentId);
  const res = await fetch(`${API_BASE}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, parentId }),
  });
  if (!res.ok) throw new Error('Failed to create category');
  return res.json();
};

export const fetchProducts = async (): Promise<Product[]> => {
  if (USE_MOCK) return mock.fetchProducts();
  const res = await fetch(`${API_BASE}/products`);
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
};

export const createProduct = async (input: CreateProductInput): Promise<Product> => {
  if (USE_MOCK) return mock.createProduct(input);
  const res = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error('Failed to create product');
  return res.json();
};

export const updateProduct = async (id: string, input: Partial<CreateProductInput>): Promise<Product> => {
  if (USE_MOCK) return mock.updateProduct(id, input);
  const res = await fetch(`${API_BASE}/products/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error('Failed to update product');
  return res.json();
};

export const setProductActive = async (id: string, isActive: boolean): Promise<void> => {
  if (USE_MOCK) return mock.setProductActive(id, isActive);
  await fetch(`${API_BASE}/products/${id}/active`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isActive }),
  });
};

export const fetchVariants = async (productId: string): Promise<ProductVariant[]> => {
  if (USE_MOCK) return mock.fetchVariants(productId);
  const res = await fetch(`${API_BASE}/products/${productId}/variants`);
  if (!res.ok) throw new Error('Failed to fetch variants');
  return res.json();
};

export const createVariant = async (productId: string, input: CreateVariantInput): Promise<ProductVariant> => {
  if (USE_MOCK) return mock.createVariant(productId, input);
  const res = await fetch(`${API_BASE}/products/${productId}/variants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error('Failed to create variant');
  return res.json();
};

export const setVariantActive = async (variantId: string, isActive: boolean): Promise<void> => {
  if (USE_MOCK) return mock.setVariantActive(variantId, isActive);
  await fetch(`${API_BASE}/variants/${variantId}/active`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isActive }),
  });
};

export const fetchAttributes = async (productId: string): Promise<ProductAttribute[]> => {
  if (USE_MOCK) return mock.fetchAttributes(productId);
  const res = await fetch(`${API_BASE}/products/${productId}/attributes`);
  if (!res.ok) throw new Error('Failed to fetch attributes');
  return res.json();
};

export const createAttribute = async (productId: string, name: string, value: string): Promise<ProductAttribute> => {
  if (USE_MOCK) return mock.createAttribute(productId, name, value);
  const res = await fetch(`${API_BASE}/products/${productId}/attributes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, value }),
  });
  if (!res.ok) throw new Error('Failed to create attribute');
  return res.json();
};

export const fetchPromotions = async (): Promise<Promotion[]> => {
  if (USE_MOCK) return mock.fetchPromotions();
  const res = await fetch(`${API_BASE}/promotions`);
  if (!res.ok) throw new Error('Failed to fetch promotions');
  return res.json();
};

export const createPromotion = async (input: CreatePromoInput): Promise<Promotion> => {
  if (USE_MOCK) return mock.createPromotion(input);
  const res = await fetch(`${API_BASE}/promotions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error('Failed to create promotion');
  return res.json();
};
