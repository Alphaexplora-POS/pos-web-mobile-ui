import { fetchBranches } from './branchesApi';
import { fetchCategories, fetchProducts, fetchPromotions } from '../../features/products/models/productsApi';

let prefetched = false;

export const resetAppPrefetch = (): void => {
  prefetched = false;
};

export const prefetchAppData = (): void => {
  if (prefetched) return;
  prefetched = true;
  void Promise.allSettled([
    fetchCategories(),
    fetchProducts(),
    fetchPromotions(),
    fetchBranches(),
  ]);
};
