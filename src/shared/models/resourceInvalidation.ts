import { invalidateCache } from './apiClient';

/**
 * Resources that can change, and every cache prefix whose response embeds that
 * resource. When a resource changes we clear exactly the caches that could be
 * showing its old name / quantity / status, then let the next read refetch.
 *
 * Prefixes are matched with `startsWith` against keys stored as `GET <path>`,
 * so a broader prefix naturally covers narrower ones:
 *   - `GET /catalog/products` also clears `/catalog/products/:id/variants` &
 *     `/catalog/products/:id/attributes`
 *   - `GET /inventory` also clears the inventory audit-log pages
 *   - `GET /identity/sessions` also clears `/active` and `/:id/summary`
 */
export type Resource =
  | 'paymentMethods'
  | 'reasonCodes'
  | 'branches'
  | 'employees'
  | 'products'
  | 'variants'
  | 'categories'
  | 'attributes'
  | 'promotions'
  | 'inventory'
  | 'transactions'
  | 'sessions'
  | 'analytics';

const DEPENDENTS: Record<Resource, string[]> = {
  // payment method name shows up on recorded sales
  paymentMethods: ['GET /reference/payment-methods', 'GET /transaction/sales'],
  // reason label shows up on refunds and on inventory audit entries
  reasonCodes: ['GET /reference/reason-codes', 'GET /refund/refunds', 'GET /inventory'],
  // branch name is embedded in inventory rows, sales, sessions and analytics
  branches: [
    'GET /identity/branches',
    'GET /inventory',
    'GET /transaction/sales',
    'GET /identity/sessions',
    'GET /analytics',
  ],
  // employee name is embedded in sales, sessions and inventory audit entries
  employees: [
    'GET /identity/employees',
    'GET /inventory',
    'GET /identity/sessions',
    'GET /transaction/sales',
  ],
  // product name/sku is embedded in inventory, promotions and analytics rankings
  products: [
    'GET /catalog/products',
    'GET /inventory',
    'GET /promotion/promotions',
    'GET /analytics',
  ],
  // variant label/sku is shown in product detail and inventory rows
  variants: ['GET /catalog/products', 'GET /inventory'],
  // category drives the products listing and its category label
  categories: ['GET /catalog/categories', 'GET /catalog/products'],
  attributes: ['GET /catalog/products'],
  promotions: ['GET /promotion/promotions', 'GET /catalog/products'],
  inventory: ['GET /inventory'],
  // a sale/refund moves stock and feeds analytics, so clear all three families
  transactions: [
    'GET /transaction/sales',
    'GET /refund/refunds',
    'GET /identity/sessions',
    'GET /inventory',
    'GET /analytics',
  ],
  sessions: ['GET /identity/sessions'],
  analytics: ['GET /analytics'],
};

/** Clear every cache that could contain stale data for the changed resources. */
export const invalidateResource = (...resources: Resource[]): void => {
  const prefixes = new Set<string>();
  for (const resource of resources) {
    for (const prefix of DEPENDENTS[resource]) prefixes.add(prefix);
  }
  for (const prefix of prefixes) invalidateCache(prefix);
};
