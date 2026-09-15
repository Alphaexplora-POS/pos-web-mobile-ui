export interface Category {
  id: string;
  name: string;
  parentId: string | null;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  imageUrl?: string;
  categoryId: string;
  isActive: boolean;
}

export interface ProductVariant {
  id: string;
  productId: string;
  size?: string;
  color?: string;
  sku: string;
  costPrice?: number;
  priceOverride?: number;
  isActive: boolean;
}

export interface ProductAttribute {
  id: string;
  productId: string;
  attributeKey: string;
  attributeValue: string;
}

export type PromoType = 'percentage' | 'fixed' | 'bundle';

export interface PromotionApplicableItem {
  id: string;
  scope: 'product' | 'category';
  productId?: string;
  categoryId?: string;
}

export interface Promotion {
  id: string;
  name: string;
  promoType: PromoType;
  config: Record<string, string | number | boolean>;
  isStackable: boolean;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  applicableItems: PromotionApplicableItem[];
}

export interface CreateProductInput {
  name: string;
  description: string;
  basePrice: number;
  imageUrl?: string;
  categoryId: string;
}

export interface CreateVariantInput {
  branchId?: string;
  size?: string;
  color?: string;
  sku: string;
  costPrice?: number;
  priceOverride?: number;
}

export interface CreatePromoInput {
  name: string;
  promoType: PromoType;
  config: Record<string, string | number | boolean>;
  isStackable: boolean;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  applicableItems: { scope: 'product' | 'category'; productId?: string; categoryId?: string }[];
}
