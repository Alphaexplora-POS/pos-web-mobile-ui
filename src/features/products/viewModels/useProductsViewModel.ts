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
  getCachedCategories,
  createCategory,
  updateCategory,
  setCategoryActive,
  fetchProducts,
  getCachedProducts,
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
  getCachedPromotions,
  createPromotion,
  setPromotionActive,
  invalidateProductCaches,
} from '../models/productsApi';
import { notifySuccess } from '../../../shared/utils/notify';

export const useProductsViewModel = (managerBranchId?: string | null) => {
  const [categories, setCategories] = useState<Category[]>(getCachedCategories);
  const [products, setProducts] = useState<Product[]>(getCachedProducts);
  const [promotions, setPromotions] = useState<Promotion[]>(getCachedPromotions);
  const [variants, setVariants] = useState<Record<string, ProductVariant[]>>({});
  const [attributes, setAttributes] = useState<Record<string, ProductAttribute[]>>({});
  const [branches, setBranches] = useState<Branch[]>([]);
  const [detailsLoading, setDetailsLoading] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState<boolean>(
    () => getCachedCategories().length === 0 || getCachedProducts().length === 0 || getCachedPromotions().length === 0,
  );
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [catData, prodData, promoData] = await Promise.all([
        fetchCategories(),
        fetchProducts(managerBranchId),
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
  }, [managerBranchId]);

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
    setDetailsLoading((prev) => ({ ...prev, [productId]: true }));
    const [v, a] = await Promise.allSettled([
      fetchVariants(productId),
      fetchAttributes(productId),
    ]);
    if (v.status === 'fulfilled') {
      setVariants((prev) => ({ ...prev, [productId]: v.value }));
    }
    if (a.status === 'fulfilled') {
      setAttributes((prev) => ({ ...prev, [productId]: a.value }));
    }
    setDetailsLoading((prev) => ({ ...prev, [productId]: false }));
  }, []);

  const handleCreateCategory = async (name: string, parentId: string | null) => {
    await createCategory(name, parentId);
    notifySuccess('Category created');
    invalidateProductCaches();
    void load();
  };

  const handleUpdateCategory = async (id: string, name: string, parentId: string | null) => {
    await updateCategory(id, name, parentId);
    notifySuccess('Category updated');
    invalidateProductCaches();
    void load();
  };

  const handleSetCategoryActive = async (id: string, isActive: boolean) => {
    await setCategoryActive(id, isActive);
    notifySuccess(isActive ? 'Category activated' : 'Category deactivated');
    invalidateProductCaches();
    void load();
  };

  const handleCreateProduct = async (input: CreateProductInput) => {
    const product = await createProduct(input);
    notifySuccess('Product created');
    invalidateProductCaches();
    void load();
    return product;
  };

  const handleUpdateProduct = async (id: string, input: Partial<CreateProductInput>) => {
    await updateProduct(id, input);
    notifySuccess('Product updated');
    invalidateProductCaches();
    void load();
  };

  const handleSetProductActive = async (id: string, isActive: boolean) => {
    await setProductActive(id, isActive);
    notifySuccess(isActive ? 'Product activated' : 'Product deactivated');
    invalidateProductCaches();
    void load();
  };

  const handleCreateVariant = async (productId: string, input: CreateVariantInput) => {
    const branchId = managerBranchId ?? branches[0]?.id;
    if (!branchId) {
      throw new Error('No branch available — select a branch first');
    }
    await createVariant(productId, { ...input, branchId });
    notifySuccess('Variant added');
    void loadProductDetails(productId);
  };

  const handleUpdateVariant = async (productId: string, variantId: string, input: Partial<CreateVariantInput>) => {
    await updateVariant(productId, variantId, input);
    notifySuccess('Variant updated');
    void loadProductDetails(productId);
  };

  const handleSetVariantActive = async (productId: string, variantId: string, isActive: boolean) => {
    await setVariantActive(productId, variantId, isActive);
    notifySuccess(isActive ? 'Variant activated' : 'Variant deactivated');
    void loadProductDetails(productId);
  };

  const handleCreateAttribute = async (productId: string, attributeKey: string, attributeValue: string) => {
    await createAttribute(productId, attributeKey, attributeValue);
    notifySuccess('Attribute added');
    void loadProductDetails(productId);
  };

  const handleUpdateAttribute = async (productId: string, id: string, attributeKey: string, attributeValue: string) => {
    await updateAttribute(productId, id, attributeKey, attributeValue);
    notifySuccess('Attribute updated');
    void loadProductDetails(productId);
  };

  const handleCreatePromotion = async (input: CreatePromoInput) => {
    await createPromotion(input);
    notifySuccess('Promotion created');
    invalidateProductCaches();
    void load();
  };

  const handleSetPromotionActive = async (id: string, isActive: boolean) => {
    await setPromotionActive(id, isActive);
    notifySuccess(isActive ? 'Promotion activated' : 'Promotion deactivated');
    invalidateProductCaches();
    void load();
  };

  return {
    categories,
    products,
    promotions,
    variants,
    attributes,
    branches,
    isLoading,
    detailsLoading,
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
