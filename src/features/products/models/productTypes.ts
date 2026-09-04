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
  name: string;
  value: string;
}

export type PromoType = 'percentage' | 'fixed' | 'bundle';
export type PromoStatus = 'active' | 'scheduled' | 'inactive';

export interface Promotion {
  id: string;
  name: string;
  type: PromoType;
  productIds: string[];
  categoryIds: string[];
  percentOff?: number;
  fixedAmountOff?: number;
  bundleRule?: string;
  combinable: boolean;
  status: PromoStatus;
  startDate?: string;
  endDate?: string;
}

export interface CreateProductInput {
  name: string;
  description: string;
  basePrice: number;
  imageUrl?: string;
  categoryId: string;
}

export interface CreateVariantInput {
  size?: string;
  color?: string;
  sku: string;
  costPrice?: number;
  priceOverride?: number;
}

export interface CreatePromoInput {
  name: string;
  type: PromoType;
  productIds: string[];
  categoryIds: string[];
  percentOff?: number;
  fixedAmountOff?: number;
  bundleRule?: string;
  combinable: boolean;
  status: PromoStatus;
  startDate?: string;
  endDate?: string;
}
