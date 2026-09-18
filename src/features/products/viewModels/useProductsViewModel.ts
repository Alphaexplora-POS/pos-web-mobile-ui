import { useState, useEffect, useCallback } from 'react';
import type { Branch } from '../../../shared/models/branchTypes';
import { fetchBranches } from '../../../shared/models/branchesApi';
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
  updateCategory,
  setCategoryActive,
  fetchProducts,
  createProduct,
  updateProduct,
  setProductActive,
  fetchVariants,
  createVariant,
  updateVariant,
  setVariantActive,
  fetchAttributes,
  createAttribute,
  updateAttribute,
  fetchPromotions,
  createPromotion,
  setPromotionActive,
} from '../models/productsApi';
import { notifySuccess } from '../../../shared/utils/notify';

export const useProductsViewModel = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [variants, setVariants] = useState<Record<string, ProductVariant[]>>({});
  const [attributes, setAttributes] = useState<Record<string, ProductAttribute[]>>({});
  const [branches, setBranches] = useState<Branch[]>([]);
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

  const loadBranches = useCallback(async () => {
    try {
      const data = await fetchBranches();
      setBranches(data);
    } catch {
      setBranches([]);
    }
  }, []);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

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
    notifySuccess('Category created');
    await load();
  };

  const handleUpdateCategory = async (id: string, name: string, parentId: string | null) => {
    await updateCategory(id, name, parentId);
    notifySuccess('Category updated');
    await load();
  };

  const handleSetCategoryActive = async (id: string, isActive: boolean) => {
    await setCategoryActive(id, isActive);
    notifySuccess(isActive ? 'Category activated' : 'Category deactivated');
    await load();
  };

  const handleCreateProduct = async (input: CreateProductInput) => {
    const product = await createProduct(input);
    notifySuccess('Product created');
    await load();
    return product;
  };

  const handleUpdateProduct = async (id: string, input: Partial<CreateProductInput>) => {
    await updateProduct(id, input);
    notifySuccess('Product updated');
    await load();
  };

  const handleSetProductActive = async (id: string, isActive: boolean) => {
    await setProductActive(id, isActive);
    notifySuccess(isActive ? 'Product activated' : 'Product deactivated');
    await load();
  };

  const handleCreateVariant = async (productId: string, input: CreateVariantInput) => {
    await createVariant(productId, input);
    notifySuccess('Variant added');
    await loadProductDetails(productId);
  };

  const handleUpdateVariant = async (productId: string, variantId: string, input: Partial<CreateVariantInput>) => {
    await updateVariant(productId, variantId, input);
    notifySuccess('Variant updated');
    await loadProductDetails(productId);
  };

  const handleSetVariantActive = async (productId: string, variantId: string, isActive: boolean) => {
    await setVariantActive(productId, variantId, isActive);
    notifySuccess(isActive ? 'Variant activated' : 'Variant deactivated');
    await loadProductDetails(productId);
  };

  const handleCreateAttribute = async (productId: string, attributeKey: string, attributeValue: string) => {
    await createAttribute(productId, attributeKey, attributeValue);
    notifySuccess('Attribute added');
    await loadProductDetails(productId);
  };

  const handleUpdateAttribute = async (productId: string, id: string, attributeKey: string, attributeValue: string) => {
    await updateAttribute(productId, id, attributeKey, attributeValue);
    notifySuccess('Attribute updated');
    await loadProductDetails(productId);
  };

  const handleCreatePromotion = async (input: CreatePromoInput) => {
    await createPromotion(input);
    notifySuccess('Promotion created');
    await load();
  };

  const handleSetPromotionActive = async (id: string, isActive: boolean) => {
    await setPromotionActive(id, isActive);
    notifySuccess(isActive ? 'Promotion activated' : 'Promotion deactivated');
    await load();
  };

  return {
    categories,
    products,
    promotions,
    variants,
    attributes,
    branches,
    isLoading,
    error,
    loadProductDetails,
    createCategory: handleCreateCategory,
    updateCategory: handleUpdateCategory,
    setCategoryActive: handleSetCategoryActive,
    createProduct: handleCreateProduct,
    updateProduct: handleUpdateProduct,
    setProductActive: handleSetProductActive,
    createVariant: handleCreateVariant,
    updateVariant: handleUpdateVariant,
    setVariantActive: handleSetVariantActive,
    createAttribute: handleCreateAttribute,
    updateAttribute: handleUpdateAttribute,
    createPromotion: handleCreatePromotion,
    setPromotionActive: handleSetPromotionActive,
  };
};
