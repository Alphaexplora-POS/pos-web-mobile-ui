import { useState, useEffect, useCallback } from 'react';
import type {
  Category,
  CreateProductInput,
  CreatePromoInput,
  CreateVariantInput,
  Product,
  ProductAttribute,
  ProductVariant,
  Promotion,
} from '../models/productTypes';
import {
  fetchCategories,
  createCategory,
  fetchProducts,
  createProduct,
  updateProduct,
  setProductActive,
  fetchVariants,
  createVariant,
  setVariantActive,
  fetchAttributes,
  createAttribute,
  fetchPromotions,
  createPromotion,
} from '../models/productsApi';

export const useProductsViewModel = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [variants, setVariants] = useState<Record<string, ProductVariant[]>>({});
  const [attributes, setAttributes] = useState<Record<string, ProductAttribute[]>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [catData, prodData, promoData] = await Promise.all([
        fetchCategories(),
        fetchProducts(),
        fetchPromotions(),
      ]);
      setCategories(catData);
      setProducts(prodData);
      setPromotions(promoData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadProductDetails = useCallback(async (productId: string) => {
    const [v, a] = await Promise.all([
      fetchVariants(productId),
      fetchAttributes(productId),
    ]);
    setVariants((prev) => ({ ...prev, [productId]: v }));
    setAttributes((prev) => ({ ...prev, [productId]: a }));
  }, []);

  const handleCreateCategory = async (name: string, parentId: string | null) => {
    await createCategory(name, parentId);
    await load();
  };

  const handleCreateProduct = async (input: CreateProductInput) => {
    const product = await createProduct(input);
    await load();
    return product;
  };

  const handleUpdateProduct = async (id: string, input: Partial<CreateProductInput>) => {
    await updateProduct(id, input);
    await load();
  };

  const handleSetProductActive = async (id: string, isActive: boolean) => {
    await setProductActive(id, isActive);
    await load();
  };

  const handleCreateVariant = async (productId: string, input: CreateVariantInput) => {
    await createVariant(productId, input);
    await loadProductDetails(productId);
  };

  const handleSetVariantActive = async (variantId: string, isActive: boolean) => {
    await setVariantActive(variantId, isActive);
    await load();
  };

  const handleCreateAttribute = async (productId: string, name: string, value: string) => {
    await createAttribute(productId, name, value);
    await loadProductDetails(productId);
  };

  const handleCreatePromotion = async (input: CreatePromoInput) => {
    await createPromotion(input);
    await load();
  };

  return {
    categories,
    products,
    promotions,
    variants,
    attributes,
    isLoading,
    error,
    loadProductDetails,
    createCategory: handleCreateCategory,
    createProduct: handleCreateProduct,
    updateProduct: handleUpdateProduct,
    setProductActive: handleSetProductActive,
    createVariant: handleCreateVariant,
    setVariantActive: handleSetVariantActive,
    createAttribute: handleCreateAttribute,
    createPromotion: handleCreatePromotion,
  };
};
