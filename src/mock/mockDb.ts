import type { Branch } from '../shared/models/branchTypes';
import type { Employee } from '../features/branches/models/branchTypes';
import type {
  Category,
  Product,
  ProductAttribute,
  ProductVariant,
  Promotion,
} from '../features/products/models/productTypes';
import type { InventoryAuditLog, InventoryItem } from '../features/inventory/models/inventoryTypes';
import type { Refund, Transaction, TransactionFilters } from '../features/transactions/models/transactionTypes';
import type { PaymentMethod, ReasonCode } from '../features/configuration/models/configTypes';

let uidCounter = 1000;
export const uid = (prefix: string): string => `${prefix}-${++uidCounter}`;

const hoursAgo = (h: number): string => new Date(Date.now() - h * 3_600_000).toISOString();
const daysAgo = (d: number, hour = 12, minute = 0): string => {
  const dt = new Date(Date.now() - d * 86_400_000);
  dt.setHours(hour, minute, 0, 0);
  return dt.toISOString();
};

const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const isSameMonth = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

interface TxSeed {
  branchId: string;
  paymentMethod: string;
  timestamp: string;
  discountTotal: number;
  items: { productId: string; variantSku: string; quantity: number; unitPrice: number; discount: number }[];
}

const seedBranches: Branch[] = [
  { id: 'b1', name: 'Makati Flagship', address: '123 Ayala Avenue, Makati City', contact: '+63 2 8123 4567', isActive: true },
  { id: 'b2', name: 'BGC Mall Branch', address: 'Level 2 Bonifacio High Street, Taguig', contact: '+63 2 8234 5678', isActive: true },
  { id: 'b3', name: 'Quezon City Branch', address: 'SM North EDSA Annex, Quezon City', contact: '+63 2 8345 6789', isActive: true },
];

const seedEmployees: Employee[] = [
  { id: 'e1', name: 'Maria Santos', email: 'maria@aurafashion.com', role: 'branch_manager', branchId: 'b1', pin: '1234', isActive: true },
  { id: 'e2', name: 'Jose Ramirez', email: 'jose@aurafashion.com', role: 'branch_manager', branchId: 'b2', pin: '2345', isActive: true },
  { id: 'e3', name: 'Ana Dela Cruz', email: 'ana@aurafashion.com', role: 'branch_manager', branchId: 'b3', pin: '3456', isActive: true },
  { id: 'e4', name: 'Juan Cruz', email: 'juan@aurafashion.com', role: 'cashier', branchId: 'b1', pin: '1111', isActive: true },
  { id: 'e5', name: 'Pedro Reyes', email: 'pedro@aurafashion.com', role: 'staff', branchId: 'b1', pin: '2222', isActive: true },
  { id: 'e6', name: 'Luz Garcia', email: 'luz@aurafashion.com', role: 'cashier', branchId: 'b2', pin: '3333', isActive: true },
  { id: 'e7', name: 'Ramon Torres', email: 'ramon@aurafashion.com', role: 'staff', branchId: 'b2', pin: '4444', isActive: true },
  { id: 'e8', name: 'Bella Mendoza', email: 'bella@aurafashion.com', role: 'cashier', branchId: 'b3', pin: '5555', isActive: true },
  { id: 'e9', name: 'Carlo Jimenez', email: 'carlo@aurafashion.com', role: 'staff', branchId: 'b3', pin: '6666', isActive: true },
  { id: 'e10', name: 'Nikki Aquino', email: 'nikki@aurafashion.com', role: 'cashier', branchId: 'b1', pin: '7777', isActive: true },
  { id: 'e11', name: 'Marco Villanueva', email: 'marco@aurafashion.com', role: 'cashier', branchId: 'b2', pin: '8888', isActive: false },
];

const seedCategories: Category[] = [
  { id: 'c1', name: 'Apparel', parentId: null },
  { id: 'c2', name: 'T-Shirts', parentId: 'c1' },
  { id: 'c3', name: 'Jeans', parentId: 'c1' },
  { id: 'c4', name: 'Footwear', parentId: null },
  { id: 'c5', name: 'Sneakers', parentId: 'c4' },
  { id: 'c6', name: 'Accessories', parentId: null },
  { id: 'c7', name: 'Bags', parentId: 'c6' },
];

const seedProducts: Product[] = [
  { id: 'p1', name: 'Classic Crew Tee', description: 'Everyday soft cotton crew-neck t-shirt.', basePrice: 15.99, imageUrl: 'https://picsum.photos/seed/tee/300', categoryId: 'c2', isActive: true },
  { id: 'p2', name: 'Graphic Tee', description: 'Cotton-blend tee with a printed graphic.', basePrice: 18.99, imageUrl: 'https://picsum.photos/seed/graphic/300', categoryId: 'c2', isActive: true },
  { id: 'p3', name: 'Slim Fit Jeans', description: 'Modern slim-fit denim with a hint of stretch.', basePrice: 39.99, imageUrl: 'https://picsum.photos/seed/jeans/300', categoryId: 'c3', isActive: true },
  { id: 'p4', name: 'Relaxed Jeans', description: 'Comfortable relaxed-cut denim in classic washes.', basePrice: 44.99, imageUrl: 'https://picsum.photos/seed/jeans2/300', categoryId: 'c3', isActive: true },
  { id: 'p5', name: 'Runner Sneakers', description: 'Lightweight running sneakers with cushioned sole.', basePrice: 59.99, imageUrl: 'https://picsum.photos/seed/runner/300', categoryId: 'c5', isActive: true },
  { id: 'p6', name: 'Court Sneakers', description: 'Retro court-style leather sneakers.', basePrice: 64.99, imageUrl: 'https://picsum.photos/seed/court/300', categoryId: 'c5', isActive: true },
  { id: 'p7', name: 'Canvas Tote Bag', description: 'Everyday canvas tote with interior pocket.', basePrice: 24.99, imageUrl: 'https://picsum.photos/seed/tote/300', categoryId: 'c7', isActive: true },
  { id: 'p8', name: 'Leather Backpack', description: 'Full-grain leather backpack, fits a 15-inch laptop.', basePrice: 89.99, imageUrl: 'https://picsum.photos/seed/pack/300', categoryId: 'c7', isActive: true },
  { id: 'p9', name: 'Denim Jacket', description: 'Classic button-up denim jacket. Discontinued.', basePrice: 54.99, imageUrl: 'https://picsum.photos/seed/jacket/300', categoryId: 'c1', isActive: false },
];

const seedVariants: ProductVariant[] = [
  { id: 'v1', productId: 'p1', size: 'S', color: 'White', sku: 'TEE-P1-WHT-S', costPrice: 8.5, isActive: true },
  { id: 'v2', productId: 'p1', size: 'M', color: 'White', sku: 'TEE-P1-WHT-M', costPrice: 8.5, isActive: true },
  { id: 'v3', productId: 'p1', size: 'L', color: 'Black', sku: 'TEE-P1-BLK-L', costPrice: 8.5, priceOverride: 16.99, isActive: true },
  { id: 'v4', productId: 'p1', size: 'XL', color: 'Black', sku: 'TEE-P1-BLK-XL', costPrice: 8.5, isActive: false },
  { id: 'v5', productId: 'p2', size: 'M', color: 'Navy', sku: 'TEE-P2-NVY-M', costPrice: 10.0, isActive: true },
  { id: 'v6', productId: 'p2', size: 'L', color: 'Navy', sku: 'TEE-P2-NVY-L', costPrice: 10.0, isActive: true },
  { id: 'v7', productId: 'p3', size: '30', color: 'Blue', sku: 'JN-P3-30-BLU', costPrice: 22.0, isActive: true },
  { id: 'v8', productId: 'p3', size: '32', color: 'Blue', sku: 'JN-P3-32-BLU', costPrice: 22.0, isActive: true },
  { id: 'v9', productId: 'p3', size: '34', color: 'Black', sku: 'JN-P3-34-BLK', costPrice: 22.0, priceOverride: 41.99, isActive: true },
  { id: 'v10', productId: 'p4', size: '30', color: 'Black', sku: 'JN-P4-30-BLK', costPrice: 25.0, isActive: true },
  { id: 'v11', productId: 'p4', size: '32', color: 'Gray', sku: 'JN-P4-32-GRY', costPrice: 25.0, isActive: true },
  { id: 'v12', productId: 'p5', size: '40', color: 'White', sku: 'SNK-P5-40-WHT', costPrice: 34.0, isActive: true },
  { id: 'v13', productId: 'p5', size: '42', color: 'White', sku: 'SNK-P5-42-WHT', costPrice: 34.0, isActive: true },
  { id: 'v14', productId: 'p5', size: '42', color: 'Red', sku: 'SNK-P5-42-RED', costPrice: 34.0, isActive: true },
  { id: 'v15', productId: 'p6', size: '40', color: 'White', sku: 'SNK-P6-40-WHT', costPrice: 38.0, isActive: true },
  { id: 'v16', productId: 'p6', size: '43', color: 'White', sku: 'SNK-P6-43-WHT', costPrice: 38.0, isActive: true },
  { id: 'v17', productId: 'p6', size: '43', color: 'Beige', sku: 'SNK-P6-43-BGE', costPrice: 38.0, isActive: true },
  { id: 'v18', productId: 'p7', size: 'OS', color: 'Natural', sku: 'BAG-P7-OS-NAT', costPrice: 12.0, isActive: true },
  { id: 'v19', productId: 'p8', size: 'OS', color: 'Black', sku: 'BAG-P8-OS-BLK', costPrice: 55.0, isActive: true },
  { id: 'v20', productId: 'p9', size: 'M', color: 'Denim', sku: 'JTK-P9-M-DNM', costPrice: 30.0, isActive: true },
];

const seedAttributes: ProductAttribute[] = [
  { id: 'a1', productId: 'p1', name: 'Material', value: '100% Cotton' },
  { id: 'a2', productId: 'p1', name: 'Fit', value: 'Regular' },
  { id: 'a3', productId: 'p3', name: 'Material', value: '98% Cotton / 2% Elastane' },
  { id: 'a4', productId: 'p3', name: 'Fit', value: 'Slim' },
  { id: 'a5', productId: 'p3', name: 'Wash', value: 'Dark Blue' },
  { id: 'a6', productId: 'p5', name: 'Material', value: 'Knit Mesh Upper' },
  { id: 'a7', productId: 'p8', name: 'Material', value: 'Full-Grain Leather' },
  { id: 'a8', productId: 'p8', name: 'Capacity', value: '20L' },
  { id: 'a9', productId: 'p8', name: 'Laptop Size', value: '15-inch' },
];

const seedPromotions: Promotion[] = [
  { id: 'pr1', name: 'Weekend Tee Blowout', type: 'percentage', productIds: ['p1', 'p2'], categoryIds: [], percentOff: 20, combinable: true, status: 'active' },
  { id: 'pr2', name: 'Sneaker Friday', type: 'fixed', productIds: ['p5', 'p6'], categoryIds: [], fixedAmountOff: 10, combinable: false, status: 'active' },
  { id: 'pr3', name: 'Jeans Bundle Deal', type: 'bundle', productIds: [], categoryIds: ['c3'], bundleRule: 'Buy 2 for $70', combinable: false, status: 'scheduled', startDate: daysAgo(-5).slice(0, 10), endDate: daysAgo(-45).slice(0, 10) },
  { id: 'pr4', name: 'Back to School Offer', type: 'percentage', productIds: [], categoryIds: ['c7'], percentOff: 10, combinable: false, status: 'inactive' },
  { id: 'pr5', name: 'Member Appreciation', type: 'fixed', productIds: ['p7', 'p8'], categoryIds: [], fixedAmountOff: 5, combinable: true, status: 'active' },
];

const seedInventory: InventoryItem[] = [
  { id: 'i1', productId: 'p1', productName: 'Classic Crew Tee', variantSku: 'TEE-P1-WHT-S', branchId: 'b1', branchName: 'Makati Flagship', quantity: 24, origin: 'manual' },
  { id: 'i2', productId: 'p1', productName: 'Classic Crew Tee', variantSku: 'TEE-P1-WHT-S', branchId: 'b2', branchName: 'BGC Mall Branch', quantity: 0, origin: 'automatic' },
  { id: 'i3', productId: 'p1', productName: 'Classic Crew Tee', variantSku: 'TEE-P1-WHT-S', branchId: 'b3', branchName: 'Quezon City Branch', quantity: 12, origin: 'manual' },
  { id: 'i4', productId: 'p1', productName: 'Classic Crew Tee', variantSku: 'TEE-P1-WHT-M', branchId: 'b1', branchName: 'Makati Flagship', quantity: 30, origin: 'manual' },
  { id: 'i5', productId: 'p1', productName: 'Classic Crew Tee', variantSku: 'TEE-P1-WHT-M', branchId: 'b2', branchName: 'BGC Mall Branch', quantity: 8, origin: 'manual' },
  { id: 'i6', productId: 'p1', productName: 'Classic Crew Tee', variantSku: 'TEE-P1-WHT-M', branchId: 'b3', branchName: 'Quezon City Branch', quantity: 15, origin: 'manual' },
  { id: 'i7', productId: 'p1', productName: 'Classic Crew Tee', variantSku: 'TEE-P1-BLK-L', branchId: 'b1', branchName: 'Makati Flagship', quantity: 0, origin: 'automatic' },
  { id: 'i8', productId: 'p1', productName: 'Classic Crew Tee', variantSku: 'TEE-P1-BLK-L', branchId: 'b2', branchName: 'BGC Mall Branch', quantity: 10, origin: 'manual' },
  { id: 'i9', productId: 'p1', productName: 'Classic Crew Tee', variantSku: 'TEE-P1-BLK-L', branchId: 'b3', branchName: 'Quezon City Branch', quantity: 0, origin: 'automatic' },
  { id: 'i10', productId: 'p2', productName: 'Graphic Tee', variantSku: 'TEE-P2-NVY-M', branchId: 'b1', branchName: 'Makati Flagship', quantity: 18, origin: 'manual' },
  { id: 'i11', productId: 'p2', productName: 'Graphic Tee', variantSku: 'TEE-P2-NVY-M', branchId: 'b2', branchName: 'BGC Mall Branch', quantity: 5, origin: 'manual' },
  { id: 'i12', productId: 'p2', productName: 'Graphic Tee', variantSku: 'TEE-P2-NVY-M', branchId: 'b3', branchName: 'Quezon City Branch', quantity: 9, origin: 'manual' },
  { id: 'i13', productId: 'p3', productName: 'Slim Fit Jeans', variantSku: 'JN-P3-30-BLU', branchId: 'b1', branchName: 'Makati Flagship', quantity: 6, origin: 'manual' },
  { id: 'i14', productId: 'p3', productName: 'Slim Fit Jeans', variantSku: 'JN-P3-30-BLU', branchId: 'b2', branchName: 'BGC Mall Branch', quantity: 0, origin: 'automatic' },
  { id: 'i15', productId: 'p3', productName: 'Slim Fit Jeans', variantSku: 'JN-P3-30-BLU', branchId: 'b3', branchName: 'Quezon City Branch', quantity: 14, origin: 'manual' },
  { id: 'i16', productId: 'p3', productName: 'Slim Fit Jeans', variantSku: 'JN-P3-32-BLU', branchId: 'b1', branchName: 'Makati Flagship', quantity: 3, origin: 'manual' },
  { id: 'i17', productId: 'p3', productName: 'Slim Fit Jeans', variantSku: 'JN-P3-32-BLU', branchId: 'b2', branchName: 'BGC Mall Branch', quantity: 22, origin: 'manual' },
  { id: 'i18', productId: 'p3', productName: 'Slim Fit Jeans', variantSku: 'JN-P3-32-BLU', branchId: 'b3', branchName: 'Quezon City Branch', quantity: 0, origin: 'automatic' },
  { id: 'i19', productId: 'p4', productName: 'Relaxed Jeans', variantSku: 'JN-P4-30-BLK', branchId: 'b1', branchName: 'Makati Flagship', quantity: 21, origin: 'manual' },
  { id: 'i20', productId: 'p4', productName: 'Relaxed Jeans', variantSku: 'JN-P4-32-GRY', branchId: 'b2', branchName: 'BGC Mall Branch', quantity: 16, origin: 'manual' },
  { id: 'i21', productId: 'p5', productName: 'Runner Sneakers', variantSku: 'SNK-P5-40-WHT', branchId: 'b1', branchName: 'Makati Flagship', quantity: 40, origin: 'manual' },
  { id: 'i22', productId: 'p5', productName: 'Runner Sneakers', variantSku: 'SNK-P5-40-WHT', branchId: 'b2', branchName: 'BGC Mall Branch', quantity: 25, origin: 'manual' },
  { id: 'i23', productId: 'p5', productName: 'Runner Sneakers', variantSku: 'SNK-P5-40-WHT', branchId: 'b3', branchName: 'Quezon City Branch', quantity: 18, origin: 'manual' },
  { id: 'i24', productId: 'p6', productName: 'Court Sneakers', variantSku: 'SNK-P6-40-WHT', branchId: 'b1', branchName: 'Makati Flagship', quantity: 12, origin: 'manual' },
  { id: 'i25', productId: 'p6', productName: 'Court Sneakers', variantSku: 'SNK-P6-40-WHT', branchId: 'b2', branchName: 'BGC Mall Branch', quantity: 0, origin: 'automatic' },
  { id: 'i26', productId: 'p6', productName: 'Court Sneakers', variantSku: 'SNK-P6-40-WHT', branchId: 'b3', branchName: 'Quezon City Branch', quantity: 20, origin: 'manual' },
  { id: 'i27', productId: 'p7', productName: 'Canvas Tote Bag', variantSku: 'BAG-P7-OS-NAT', branchId: 'b1', branchName: 'Makati Flagship', quantity: 0, origin: 'automatic' },
  { id: 'i28', productId: 'p7', productName: 'Canvas Tote Bag', variantSku: 'BAG-P7-OS-NAT', branchId: 'b2', branchName: 'BGC Mall Branch', quantity: 15, origin: 'manual' },
  { id: 'i29', productId: 'p7', productName: 'Canvas Tote Bag', variantSku: 'BAG-P7-OS-NAT', branchId: 'b3', branchName: 'Quezon City Branch', quantity: 0, origin: 'automatic' },
  { id: 'i30', productId: 'p8', productName: 'Leather Backpack', variantSku: 'BAG-P8-OS-BLK', branchId: 'b1', branchName: 'Makati Flagship', quantity: 4, origin: 'manual' },
  { id: 'i31', productId: 'p8', productName: 'Leather Backpack', variantSku: 'BAG-P8-OS-BLK', branchId: 'b2', branchName: 'BGC Mall Branch', quantity: 2, origin: 'manual' },
  { id: 'i32', productId: 'p8', productName: 'Leather Backpack', variantSku: 'BAG-P8-OS-BLK', branchId: 'b3', branchName: 'Quezon City Branch', quantity: 1, origin: 'manual' },
  { id: 'i33', productId: 'p9', productName: 'Denim Jacket', variantSku: 'JTK-P9-M-DNM', branchId: 'b1', branchName: 'Makati Flagship', quantity: 9, origin: 'manual' },
];

const seedAuditLogs: InventoryAuditLog[] = [
  { id: 'al1', productName: 'Classic Crew Tee', variantSku: 'TEE-P1-WHT-S', branchName: 'Makati Flagship', action: 'Stock In', quantityDelta: +20, timestamp: hoursAgo(26) },
  { id: 'al2', productName: 'Slim Fit Jeans', variantSku: 'JN-P3-32-BLU', branchName: 'Makati Flagship', action: 'Stock Out', quantityDelta: -5, timestamp: hoursAgo(22) },
  { id: 'al3', productName: 'Runner Sneakers', variantSku: 'SNK-P5-40-WHT', branchName: 'BGC Mall Branch', action: 'Stock In', quantityDelta: +25, timestamp: hoursAgo(18) },
  { id: 'al4', productName: 'Leather Backpack', variantSku: 'BAG-P8-OS-BLK', branchName: 'Quezon City Branch', action: 'Stock Adjustment', quantityDelta: -2, timestamp: hoursAgo(15) },
  { id: 'al5', productName: 'Graphic Tee', variantSku: 'TEE-P2-NVY-M', branchName: 'BGC Mall Branch', action: 'Transfer In', quantityDelta: +10, timestamp: hoursAgo(12) },
  { id: 'al6', productName: 'Court Sneakers', variantSku: 'SNK-P6-40-WHT', branchName: 'Makati Flagship', action: 'Stock In', quantityDelta: +12, timestamp: hoursAgo(10) },
  { id: 'al7', productName: 'Canvas Tote Bag', variantSku: 'BAG-P7-OS-NAT', branchName: 'BGC Mall Branch', action: 'Stock In', quantityDelta: +15, timestamp: hoursAgo(9) },
  { id: 'al8', productName: 'Classic Crew Tee', variantSku: 'TEE-P1-BLK-L', branchName: 'Quezon City Branch', action: 'Transfer In', quantityDelta: +5, timestamp: hoursAgo(7) },
  { id: 'al9', productName: 'Runner Sneakers', variantSku: 'SNK-P5-42-WHT', branchName: 'BGC Mall Branch', action: 'Stock Out', quantityDelta: -8, timestamp: hoursAgo(5) },
  { id: 'al10', productName: 'Denim Jacket', variantSku: 'JTK-P9-M-DNM', branchName: 'Makati Flagship', action: 'Stock In', quantityDelta: +9, timestamp: hoursAgo(3) },
];

const seedTxItems = (items: { productId: string; variantSku: string; quantity: number; unitPrice: number; discount: number }[]) => items;

const seedTransactions: TxSeed[] = [
  { branchId: 'b1', paymentMethod: 'Cash', timestamp: hoursAgo(2), discountTotal: 6.4, items: seedTxItems([
    { productId: 'p1', variantSku: 'TEE-P1-WHT-S', quantity: 2, unitPrice: 15.99, discount: 6.4 },
    { productId: 'p8', variantSku: 'BAG-P8-OS-BLK', quantity: 1, unitPrice: 89.99, discount: 0 },
  ]) },
  { branchId: 'b2', paymentMethod: 'Card', timestamp: hoursAgo(4), discountTotal: 10, items: seedTxItems([
    { productId: 'p5', variantSku: 'SNK-P5-40-WHT', quantity: 1, unitPrice: 59.99, discount: 10 },
    { productId: 'p2', variantSku: 'TEE-P2-NVY-M', quantity: 1, unitPrice: 18.99, discount: 0 },
  ]) },
  { branchId: 'b1', paymentMethod: 'GCash', timestamp: hoursAgo(6), discountTotal: 0, items: seedTxItems([
    { productId: 'p3', variantSku: 'JN-P3-32-BLU', quantity: 1, unitPrice: 41.99, discount: 0 },
    { productId: 'p7', variantSku: 'BAG-P7-OS-NAT', quantity: 1, unitPrice: 24.99, discount: 0 },
  ]) },
  { branchId: 'b3', paymentMethod: 'Cash', timestamp: hoursAgo(8), discountTotal: 0, items: seedTxItems([
    { productId: 'p6', variantSku: 'SNK-P6-40-WHT', quantity: 1, unitPrice: 64.99, discount: 0 },
    { productId: 'p4', variantSku: 'JN-P4-30-BLK', quantity: 1, unitPrice: 44.99, discount: 0 },
  ]) },
  { branchId: 'b2', paymentMethod: 'Maya', timestamp: hoursAgo(27), discountTotal: 11.4, items: seedTxItems([
    { productId: 'p2', variantSku: 'TEE-P2-NVY-M', quantity: 3, unitPrice: 18.99, discount: 11.4 },
  ]) },
  { branchId: 'b1', paymentMethod: 'Card', timestamp: hoursAgo(50), discountTotal: 12.79, items: seedTxItems([
    { productId: 'p1', variantSku: 'TEE-P1-WHT-M', quantity: 4, unitPrice: 15.99, discount: 12.79 },
  ]) },
  { branchId: 'b3', paymentMethod: 'Cash', timestamp: hoursAgo(74), discountTotal: 0, items: seedTxItems([
    { productId: 'p5', variantSku: 'SNK-P5-42-WHT', quantity: 1, unitPrice: 59.99, discount: 0 },
    { productId: 'p8', variantSku: 'BAG-P8-OS-BLK', quantity: 1, unitPrice: 89.99, discount: 0 },
  ]) },
  { branchId: 'b2', paymentMethod: 'GCash', timestamp: hoursAgo(98), discountTotal: 0, items: seedTxItems([
    { productId: 'p6', variantSku: 'SNK-P6-43-WHT', quantity: 1, unitPrice: 64.99, discount: 0 },
  ]) },
  { branchId: 'b1', paymentMethod: 'Cash', timestamp: hoursAgo(122), discountTotal: 8, items: seedTxItems([
    { productId: 'p3', variantSku: 'JN-P3-30-BLU', quantity: 2, unitPrice: 39.99, discount: 8 },
  ]) },
  { branchId: 'b2', paymentMethod: 'Card', timestamp: hoursAgo(146), discountTotal: 0, items: seedTxItems([
    { productId: 'p7', variantSku: 'BAG-P7-OS-NAT', quantity: 2, unitPrice: 24.99, discount: 0 },
  ]) },
  { branchId: 'b3', paymentMethod: 'Cash', timestamp: hoursAgo(170), discountTotal: 0, items: seedTxItems([
    { productId: 'p4', variantSku: 'JN-P4-32-GRY', quantity: 1, unitPrice: 44.99, discount: 0 },
    { productId: 'p2', variantSku: 'TEE-P2-NVY-L', quantity: 1, unitPrice: 18.99, discount: 0 },
  ]) },
  { branchId: 'b1', paymentMethod: 'Maya', timestamp: hoursAgo(198), discountTotal: 0, items: seedTxItems([
    { productId: 'p9', variantSku: 'JTK-P9-M-DNM', quantity: 1, unitPrice: 54.99, discount: 0 },
    { productId: 'p1', variantSku: 'TEE-P1-WHT-S', quantity: 1, unitPrice: 15.99, discount: 0 },
  ]) },
  { branchId: 'b2', paymentMethod: 'Cash', timestamp: hoursAgo(244), discountTotal: 0, items: seedTxItems([
    { productId: 'p5', variantSku: 'SNK-P5-42-RED', quantity: 2, unitPrice: 59.99, discount: 0 },
  ]) },
  { branchId: 'b3', paymentMethod: 'Card', timestamp: hoursAgo(294), discountTotal: 0, items: seedTxItems([
    { productId: 'p8', variantSku: 'BAG-P8-OS-BLK', quantity: 1, unitPrice: 89.99, discount: 0 },
    { productId: 'p7', variantSku: 'BAG-P7-OS-NAT', quantity: 1, unitPrice: 24.99, discount: 0 },
  ]) },
  { branchId: 'b1', paymentMethod: 'Cash', timestamp: hoursAgo(366), discountTotal: 0, items: seedTxItems([
    { productId: 'p3', variantSku: 'JN-P3-34-BLK', quantity: 1, unitPrice: 39.99, discount: 0 },
  ]) },
  { branchId: 'b2', paymentMethod: 'GCash', timestamp: hoursAgo(486), discountTotal: 0, items: seedTxItems([
    { productId: 'p6', variantSku: 'SNK-P6-40-WHT', quantity: 1, unitPrice: 64.99, discount: 0 },
    { productId: 'p1', variantSku: 'TEE-P1-BLK-L', quantity: 1, unitPrice: 16.99, discount: 0 },
  ]) },
  { branchId: 'b3', paymentMethod: 'Cash', timestamp: hoursAgo(630), discountTotal: 0, items: seedTxItems([
    { productId: 'p2', variantSku: 'TEE-P2-NVY-M', quantity: 2, unitPrice: 18.99, discount: 0 },
  ]) },
  { branchId: 'b1', paymentMethod: 'Card', timestamp: hoursAgo(750), discountTotal: 0, items: seedTxItems([
    { productId: 'p4', variantSku: 'JN-P4-30-BLK', quantity: 1, unitPrice: 44.99, discount: 0 },
  ]) },
  { branchId: 'b2', paymentMethod: 'Cash', timestamp: hoursAgo(912), discountTotal: 0, items: seedTxItems([
    { productId: 'p3', variantSku: 'JN-P3-32-BLU', quantity: 1, unitPrice: 41.99, discount: 0 },
    { productId: 'p5', variantSku: 'SNK-P5-40-WHT', quantity: 1, unitPrice: 59.99, discount: 0 },
  ]) },
];

const buildTransactions = (): Transaction[] =>
  seedTransactions.map((seed, index) => {
    const subtotal = seed.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const branch = seedBranches.find((b) => b.id === seed.branchId) ?? seedBranches[0];
    return {
      id: `tx-${index + 1}`,
      branchId: branch.id,
      branchName: branch.name,
      items: seed.items.map((item) => ({
        ...item,
        productName: seedProducts.find((p) => p.id === item.productId)?.name ?? 'Unknown Product',
      })),
      subtotal: round2(subtotal),
      discountTotal: seed.discountTotal,
      paymentMethod: seed.paymentMethod,
      total: round2(subtotal - seed.discountTotal),
      timestamp: seed.timestamp,
    };
  });

const seedRefunds: Refund[] = [
  { id: 'rf-1', transactionId: 'tx-3', amount: 24.99, reasonCode: 'Damaged Item', refundedAt: hoursAgo(5) },
  { id: 'rf-2', transactionId: 'tx-7', amount: 10, reasonCode: 'Change of Mind', refundedAt: hoursAgo(70) },
  { id: 'rf-3', transactionId: 'tx-9', amount: 8, reasonCode: 'Service Issue', refundedAt: hoursAgo(118) },
  { id: 'rf-4', transactionId: 'tx-15', amount: 39.99, reasonCode: 'Wrong Item', refundedAt: hoursAgo(360) },
  { id: 'rf-5', transactionId: 'tx-12', amount: 15.99, reasonCode: 'Damaged Item', refundedAt: hoursAgo(192) },
];

const seedPaymentMethods: PaymentMethod[] = [
  { id: 'pm-1', name: 'Cash', isActive: true },
  { id: 'pm-2', name: 'Card', isActive: true },
  { id: 'pm-3', name: 'GCash', isActive: true },
  { id: 'pm-4', name: 'Maya', isActive: true },
  { id: 'pm-5', name: 'Bank Transfer', isActive: true },
];

const seedReasonCodes: ReasonCode[] = [
  { id: 'rc-1', name: 'Damaged Item', type: 'refund', isActive: true },
  { id: 'rc-2', name: 'Wrong Item', type: 'refund', isActive: true },
  { id: 'rc-3', name: 'Change of Mind', type: 'refund', isActive: true },
  { id: 'rc-4', name: 'Service Issue', type: 'refund', isActive: true },
  { id: 'rc-5', name: 'Customer Refund', type: 'refund', isActive: true },
  { id: 'rc-6', name: 'Stock Received', type: 'inventory', isActive: true },
  { id: 'rc-7', name: 'Stock Adjustment', type: 'inventory', isActive: true },
  { id: 'rc-8', name: 'Spoilage / Damage', type: 'inventory', isActive: true },
  { id: 'rc-9', name: 'Transfer In', type: 'inventory', isActive: true },
  { id: 'rc-10', name: 'Transfer Out', type: 'inventory', isActive: true },
];

let db: {
  branches: Branch[];
  employees: Employee[];
  categories: Category[];
  products: Product[];
  variants: ProductVariant[];
  attributes: ProductAttribute[];
  promotions: Promotion[];
  inventory: InventoryItem[];
  auditLogs: InventoryAuditLog[];
  transactions: Transaction[];
  refunds: Refund[];
  paymentMethods: PaymentMethod[];
  reasonCodes: ReasonCode[];
} | null = null;

const getDb = () => {
  if (!db) {
    db = {
      branches: seedBranches.map((b) => ({ ...b })),
      employees: seedEmployees.map((e) => ({ ...e })),
      categories: seedCategories.map((c) => ({ ...c })),
      products: seedProducts.map((p) => ({ ...p })),
      variants: seedVariants.map((v) => ({ ...v })),
      attributes: seedAttributes.map((a) => ({ ...a })),
      promotions: seedPromotions.map((p) => ({ ...p })),
      inventory: seedInventory.map((i) => ({ ...i })),
      auditLogs: seedAuditLogs.map((a) => ({ ...a })),
      transactions: buildTransactions(),
      refunds: seedRefunds.map((r) => ({ ...r })),
      paymentMethods: seedPaymentMethods.map((m) => ({ ...m })),
      reasonCodes: seedReasonCodes.map((r) => ({ ...r })),
    };
  }
  return db;
};

export const resetMockDb = () => {
  db = null;
};

export const getBranches = () => getDb().branches.map((b) => ({ ...b }));
export const addBranch = (data: { name: string; address: string; contact: string }): Branch => {
  const branch: Branch = { id: uid('b'), name: data.name, address: data.address, contact: data.contact, isActive: true };
  getDb().branches.push(branch);
  return branch;
};
export const editBranch = (id: string, data: Partial<{ name: string; address: string; contact: string }>): Branch => {
  const branch = getDb().branches.find((b) => b.id === id);
  if (!branch) throw new Error('Branch not found');
  Object.assign(branch, data);
  return branch;
};
export const deactivateBranch = (id: string): void => {
  const branch = getDb().branches.find((b) => b.id === id);
  if (!branch) throw new Error('Branch not found');
  branch.isActive = false;
};

export const getEmployees = () => getDb().employees.map((e) => ({ ...e }));
export const addEmployee = (data: {
  name: string;
  role: Employee['role'];
  branchId: string;
  email?: string;
  password?: string;
  pin: string;
}): Employee => {
  const employee: Employee = {
    id: uid('e'),
    name: data.name,
    email: data.email ?? `${data.name.toLowerCase().replace(/\s+/g, '.')}@mock.local`,
    role: data.role,
    branchId: data.branchId,
    pin: data.pin,
    isActive: true,
  };
  getDb().employees.push(employee);
  return employee;
};
export const deactivateEmployee = (id: string): void => {
  const employee = getDb().employees.find((e) => e.id === id);
  if (!employee) throw new Error('Employee not found');
  employee.isActive = false;
};

export const getCategories = () => getDb().categories.map((c) => ({ ...c }));
export const addCategory = (name: string, parentId: string | null): Category => {
  const category: Category = { id: uid('c'), name, parentId };
  getDb().categories.push(category);
  return category;
};

export const getProducts = () => getDb().products.map((p) => ({ ...p }));
export const addProduct = (data: {
  name: string;
  description: string;
  basePrice: number;
  imageUrl?: string;
  categoryId: string;
}): Product => {
  const product: Product = {
    id: uid('p'),
    name: data.name,
    description: data.description,
    basePrice: data.basePrice,
    imageUrl: data.imageUrl,
    categoryId: data.categoryId,
    isActive: true,
  };
  getDb().products.push(product);
  return product;
};
export const editProduct = (id: string, data: Partial<{ name: string; description: string; basePrice: number; imageUrl?: string; categoryId: string }>): Product => {
  const product = getDb().products.find((p) => p.id === id);
  if (!product) throw new Error('Product not found');
  Object.assign(product, data);
  return product;
};
export const toggleProductActive = (id: string, isActive: boolean): void => {
  const product = getDb().products.find((p) => p.id === id);
  if (!product) throw new Error('Product not found');
  product.isActive = isActive;
};

export const getVariants = (productId: string) => getDb().variants.filter((v) => v.productId === productId).map((v) => ({ ...v }));
export const addVariant = (productId: string, data: {
  size?: string;
  color?: string;
  sku: string;
  costPrice?: number;
  priceOverride?: number;
}): ProductVariant => {
  const variant: ProductVariant = {
    id: uid('v'),
    productId,
    size: data.size,
    color: data.color,
    sku: data.sku,
    costPrice: data.costPrice,
    priceOverride: data.priceOverride,
    isActive: true,
  };
  getDb().variants.push(variant);
  const activeBranch = getDb().branches.find((b) => b.isActive) ?? getDb().branches[0];
  const product = getDb().products.find((p) => p.id === productId);
  getDb().inventory.push({
    id: uid('i'),
    productId,
    productName: product?.name ?? 'Unknown Product',
    variantSku: data.sku,
    branchId: activeBranch.id,
    branchName: activeBranch.name,
    quantity: 0,
    origin: 'automatic',
  });
  return variant;
};
export const toggleVariantActive = (variantId: string, isActive: boolean): void => {
  const variant = getDb().variants.find((v) => v.id === variantId);
  if (!variant) throw new Error('Variant not found');
  variant.isActive = isActive;
};

export const getAttributes = (productId: string) => getDb().attributes.filter((a) => a.productId === productId).map((a) => ({ ...a }));
export const addAttribute = (productId: string, name: string, value: string): ProductAttribute => {
  const attribute: ProductAttribute = { id: uid('a'), productId, name, value };
  getDb().attributes.push(attribute);
  return attribute;
};

export const getPromotions = () => getDb().promotions.map((p) => ({ ...p }));
export const addPromotion = (data: Omit<Promotion, 'id'>): Promotion => {
  const promotion: Promotion = { id: uid('pr'), ...data };
  getDb().promotions.push(promotion);
  return promotion;
};

export const getInventory = () => getDb().inventory.map((i) => ({ ...i }));
export const getInventoryByBranch = (branchId: string) =>
  getDb().inventory.filter((i) => i.branchId === branchId).map((i) => ({ ...i }));

export const getAuditLogs = (filters?: { branchId?: string; productId?: string }) =>
  getDb().auditLogs
    .filter((log) => (filters?.branchId ? log.branchName === getDb().branches.find((b) => b.id === filters.branchId)?.name : true))
    .filter((log) => (filters?.productId ? log.productName === getDb().products.find((p) => p.id === filters.productId)?.name : true))
    .map((log) => ({ ...log }));

export const getTransactions = (filters: TransactionFilters) => {
  const now = new Date();
  return getDb().transactions
    .filter((tx) => {
      const date = new Date(tx.timestamp);
      switch (filters.range) {
        case 'today':
          return isSameDay(date, now);
        case 'week':
          return date.getTime() >= now.getTime() - 7 * 86_400_000;
        case 'month':
          return isSameMonth(date, now);
        case 'custom':
          if (filters.startDate && date < new Date(`${filters.startDate}T00:00:00`)) return false;
          if (filters.endDate && date > new Date(`${filters.endDate}T23:59:59`)) return false;
          return true;
      }
    })
    .map((tx) => ({
      ...tx,
      items: tx.items.map((item) => ({ ...item })),
    }))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const getTransactionById = (id: string) => {
  const tx = getDb().transactions.find((t) => t.id === id);
  return tx ? { ...tx, items: tx.items.map((item) => ({ ...item })) } : null;
};

export const getRefunds = (startDate?: string, endDate?: string) =>
  getDb().refunds
    .filter((r) => {
      const date = new Date(r.refundedAt);
      if (startDate && date < new Date(`${startDate}T00:00:00`)) return false;
      if (endDate && date > new Date(`${endDate}T23:59:59`)) return false;
      return true;
    })
    .map((r) => ({ ...r }));

export const getPaymentMethods = () => getDb().paymentMethods.map((m) => ({ ...m }));
export const addPaymentMethod = (name: string): PaymentMethod => {
  const method: PaymentMethod = { id: uid('pm'), name, isActive: true };
  getDb().paymentMethods.push(method);
  return method;
};
export const editPaymentMethod = (id: string, name: string): PaymentMethod => {
  const method = getDb().paymentMethods.find((m) => m.id === id);
  if (!method) throw new Error('Payment method not found');
  method.name = name;
  return method;
};
export const togglePaymentMethod = (id: string, isActive: boolean): void => {
  const method = getDb().paymentMethods.find((m) => m.id === id);
  if (method) method.isActive = isActive;
};

export const getReasonCodes = () => getDb().reasonCodes.map((r) => ({ ...r }));
export const addReasonCode = (name: string, type: ReasonCode['type']): ReasonCode => {
  const reason: ReasonCode = { id: uid('rc'), name, type, isActive: true };
  getDb().reasonCodes.push(reason);
  return reason;
};
export const editReasonCode = (id: string, name: string, type: ReasonCode['type']): ReasonCode => {
  const reason = getDb().reasonCodes.find((r) => r.id === id);
  if (!reason) throw new Error('Reason code not found');
  reason.name = name;
  reason.type = type;
  return reason;
};
export const toggleReasonCode = (id: string, isActive: boolean): void => {
  const reason = getDb().reasonCodes.find((r) => r.id === id);
  if (reason) reason.isActive = isActive;
};

export const buildCompanyAnalytics = () => {
  const tx = getDb().transactions;
  const now = new Date();
  const today = tx.filter((t) => isSameDay(new Date(t.timestamp), now));
  const month = tx.filter((t) => isSameMonth(new Date(t.timestamp), now));

  const topProducts = tx
    .flatMap((t) => t.items)
    .reduce<Record<string, number>>((acc, item) => {
      acc[item.productName] = (acc[item.productName] ?? 0) + item.unitPrice * item.quantity;
      return acc;
    }, {});
  const sortedTop = Object.entries(topProducts)
    .map(([productName, sales]) => ({ productName, sales }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);

  const branchComparison = getDb().branches.map((branch) => ({
    branchId: branch.id,
    branchName: branch.name,
    salesToday: today.filter((t) => t.branchId === branch.id).reduce((sum, t) => sum + t.total, 0),
    salesMonthly: month.filter((t) => t.branchId === branch.id).reduce((sum, t) => sum + t.total, 0),
  }));

  return {
    metrics: {
      salesToday: today.reduce((sum, t) => sum + t.total, 0),
      salesMonthly: month.reduce((sum, t) => sum + t.total, 0),
      transactionCountToday: today.length,
      transactionCountMonthly: month.length,
    },
    topProducts: sortedTop,
    branchComparison,
  };
};

export const buildBranchAnalytics = () => {
  const branch = getDb().branches.find((b) => b.isActive) ?? getDb().branches[0];
  const tx = getDb().transactions.filter((t) => t.branchId === branch.id);
  const now = new Date();
  const today = tx.filter((t) => isSameDay(new Date(t.timestamp), now));
  const month = tx.filter((t) => isSameMonth(new Date(t.timestamp), now));

  const topProducts = tx
    .flatMap((t) => t.items)
    .reduce<Record<string, number>>((acc, item) => {
      acc[item.productName] = (acc[item.productName] ?? 0) + item.unitPrice * item.quantity;
      return acc;
    }, {});
  const sortedTop = Object.entries(topProducts)
    .map(([productName, sales]) => ({ productName, sales }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);

  return {
    branchName: branch.name,
    metrics: {
      salesToday: today.reduce((sum, t) => sum + t.total, 0),
      salesMonthly: month.reduce((sum, t) => sum + t.total, 0),
      transactionCountToday: today.length,
      transactionCountMonthly: month.length,
    },
    topProducts: sortedTop,
  };
};