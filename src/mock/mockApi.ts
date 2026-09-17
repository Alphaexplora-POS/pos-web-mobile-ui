import { mockDelay } from './config';
import * as db from './mockDb';
import type { Branch } from '../shared/models/branchTypes';
import type { Employee } from '../features/branches/models/branchTypes';
import type { Category, CreateProductInput, CreatePromoInput, CreateVariantInput, Product, ProductAttribute, ProductVariant, Promotion } from '../features/products/models/productTypes';
import type { InventoryAuditLog, InventoryAdjustInput, InventoryFilters, InventoryItem } from '../features/inventory/models/inventoryTypes';
import type { Refund, Transaction, TransactionFilters, CreateRefundInput, CreateSaleInput, PosSession, SessionSummary } from '../features/transactions/models/transactionTypes';
import type { PaymentMethod, ReasonCode, ReasonCodeType } from '../features/configuration/models/configTypes';

export const fetchBranches = async (): Promise<Branch[]> => {
  await mockDelay();
  return db.getBranches();
};

export const createBranch = async (input: { name: string; address: string; contact: string }): Promise<Branch> => {
  await mockDelay();
  return db.addBranch(input);
};

export const updateBranch = async (id: string, input: Partial<{ name: string; address: string; contact: string }>): Promise<Branch> => {
  await mockDelay();
  return db.editBranch(id, input);
};

export const deactivateBranch = async (id: string): Promise<void> => {
  await mockDelay();
  db.deactivateBranch(id);
};

export const fetchEmployees = async (): Promise<Employee[]> => {
  await mockDelay();
  return db.getEmployees();
};

export const createEmployee = async (input: {
  name: string;
  role: Employee['role'];
  branchId: string;
  email?: string;
  password?: string;
  pin: string;
}): Promise<Employee> => {
  await mockDelay();
  return db.addEmployee(input);
};

export const deactivateEmployee = async (id: string): Promise<void> => {
  await mockDelay();
  db.deactivateEmployee(id);
};

export const fetchCategories = async (): Promise<Category[]> => {
  await mockDelay();
  return db.getCategories();
};

export const createCategory = async (name: string, parentId: string | null): Promise<Category> => {
  await mockDelay();
  return db.addCategory(name, parentId);
};

export const fetchProducts = async (): Promise<Product[]> => {
  await mockDelay();
  return db.getProducts();
};

export const createProduct = async (input: CreateProductInput): Promise<Product> => {
  await mockDelay();
  return db.addProduct(input);
};

export const updateProduct = async (id: string, input: Partial<CreateProductInput>): Promise<Product> => {
  await mockDelay();
  return db.editProduct(id, input);
};

export const setProductActive = async (id: string, isActive: boolean): Promise<void> => {
  await mockDelay();
  db.toggleProductActive(id, isActive);
};

export const fetchVariants = async (productId: string): Promise<ProductVariant[]> => {
  await mockDelay();
  return db.getVariants(productId);
};

export const createVariant = async (productId: string, input: CreateVariantInput): Promise<ProductVariant> => {
  await mockDelay();
  return db.addVariant(productId, input);
};

export const updateVariant = async (variantId: string, input: Partial<CreateVariantInput>): Promise<ProductVariant> => {
  await mockDelay();
  return db.updateVariant(variantId, input);
};

export const setVariantActive = async (variantId: string, isActive: boolean): Promise<void> => {
  await mockDelay();
  db.toggleVariantActive(variantId, isActive);
};

export const fetchAttributes = async (productId: string): Promise<ProductAttribute[]> => {
  await mockDelay();
  return db.getAttributes(productId);
};

export const createAttribute = async (productId: string, attributeKey: string, attributeValue: string): Promise<ProductAttribute> => {
  await mockDelay();
  return db.addAttribute(productId, attributeKey, attributeValue);
};

export const updateAttribute = async (id: string, attributeKey: string, attributeValue: string): Promise<ProductAttribute> => {
  await mockDelay();
  return db.updateAttribute(id, attributeKey, attributeValue);
};

export const fetchPromotions = async (): Promise<Promotion[]> => {
  await mockDelay();
  return db.getPromotions();
};

export const createPromotion = async (input: CreatePromoInput): Promise<Promotion> => {
  await mockDelay();
  return db.addPromotion(input);
};

export const setPromotionActive = async (id: string, isActive: boolean): Promise<void> => {
  await mockDelay();
  db.togglePromotionActive(id, isActive);
};

export const fetchCombinedInventory = async (): Promise<InventoryItem[]> => {
  await mockDelay();
  return db.getInventory();
};

export const fetchBranchInventory = async (branchId: string): Promise<InventoryItem[]> => {
  await mockDelay();
  return branchId ? db.getInventoryByBranch(branchId) : db.getInventory();
};

export const fetchInventoryAuditLogs = async (filters?: InventoryFilters): Promise<InventoryAuditLog[]> => {
  await mockDelay();
  return db.getAuditLogs(filters);
};

export const fetchTransactions = async (filters: TransactionFilters): Promise<Transaction[]> => {
  await mockDelay();
  return db.getTransactions(filters);
};

export const fetchTransactionById = async (id: string): Promise<Transaction> => {
  await mockDelay();
  const tx = db.getTransactionById(id);
  if (!tx) throw new Error('Transaction not found');
  return tx;
};

export const fetchRefunds = async (startDate?: string, endDate?: string): Promise<Refund[]> => {
  await mockDelay();
  return db.getRefunds(startDate, endDate);
};

export const fetchPaymentMethods = async (): Promise<PaymentMethod[]> => {
  await mockDelay();
  return db.getPaymentMethods();
};

export const createPaymentMethod = async (name: string): Promise<PaymentMethod> => {
  await mockDelay();
  return db.addPaymentMethod(name);
};

export const setPaymentMethodActive = async (id: string, isActive: boolean): Promise<void> => {
  await mockDelay();
  db.togglePaymentMethod(id, isActive);
};

export const updatePaymentMethod = async (id: string, name: string): Promise<PaymentMethod> => {
  await mockDelay();
  return db.editPaymentMethod(id, name);
};

export const fetchReasonCodes = async (): Promise<ReasonCode[]> => {
  await mockDelay();
  return db.getReasonCodes();
};

export const createReasonCode = async (name: string, type: ReasonCodeType): Promise<ReasonCode> => {
  await mockDelay();
  return db.addReasonCode(name, type);
};

export const updateReasonCode = async (id: string, name: string, type: ReasonCodeType): Promise<ReasonCode> => {
  await mockDelay();
  return db.editReasonCode(id, name, type);
};

export const setReasonCodeActive = async (id: string, isActive: boolean): Promise<void> => {
  await mockDelay();
  db.toggleReasonCode(id, isActive);
};

export const adjustInventory = async (input: InventoryAdjustInput): Promise<InventoryItem> => {
  await mockDelay();
  return db.adjustInventory(input);
};

export const createRefund = async (input: CreateRefundInput): Promise<Refund> => {
  await mockDelay();
  return db.createRefund(input);
};

export const approveRefund = async (id: string): Promise<Refund> => {
  await mockDelay();
  return db.setRefundStatus(id, 'approved');
};

export const denyRefund = async (id: string): Promise<Refund> => {
  await mockDelay();
  return db.setRefundStatus(id, 'denied');
};

export const completeRefund = async (id: string): Promise<Refund> => {
  await mockDelay();
  return db.setRefundStatus(id, 'completed');
};

export const createSale = async (input: CreateSaleInput): Promise<Transaction> => {
  await mockDelay();
  return db.createSale(input);
};

export const openSession = async (branchId: string, employeeId: string): Promise<PosSession> => {
  await mockDelay();
  return db.openSession(branchId, employeeId);
};

export const closeSession = async (id: string): Promise<PosSession> => {
  await mockDelay();
  return db.closeSession(id);
};

export const fetchSessions = async (): Promise<PosSession[]> => {
  await mockDelay();
  return db.getSessions();
};

export const fetchSessionSummary = async (id: string): Promise<SessionSummary> => {
  await mockDelay();
  return db.getSessionSummary(id);
};
