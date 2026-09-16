import { useState, useEffect, useCallback } from 'react';
import type { Branch } from '../../../shared/models/branchTypes';
import { fetchBranches } from '../../../shared/models/branchesApi';
import type { Employee } from '../../branches/models/branchTypes';
import { fetchEmployees } from '../../branches/models/branchesApi';
import type { PaymentMethod } from '../../configuration/models/configTypes';
import { fetchPaymentMethods } from '../../configuration/models/configApi';
import type { Product, ProductVariant } from '../../products/models/productTypes';
import { fetchProducts, fetchVariants } from '../../products/models/productsApi';
import type { InventoryItem } from '../../inventory/models/inventoryTypes';
import { fetchCombinedInventory } from '../../inventory/models/inventoryApi';
import type { PosSession, SessionSummary } from '../models/transactionTypes';
import {
  createSale,
  openSession as apiOpenSession,
  closeSession as apiCloseSession,
  fetchSessions,
  fetchSessionSummary,
} from '../models/transactionsApi';
import { useAuth } from '../../auth/hooks/useAuth';
import { notifySuccess, notifyError } from '../../../shared/utils/notify';

export interface PosCartLine {
  key: string;
  productId: string;
  productName: string;
  variantId: string;
  variantSku: string;
  variantLabel: string;
  unitPrice: number;
  quantity: number;
}

export interface PosCatalogVariant extends ProductVariant {
  productId: string;
  productName: string;
  variantLabel: string;
  variantSku: string;
  unitPrice: number;
}

export const usePosViewModel = () => {
  const { session } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<Record<string, ProductVariant[]>>({});
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [cart, setCart] = useState<PosCartLine[]>([]);
  const [totalDiscount, setTotalDiscount] = useState(0);
  const [openSession, setOpenSession] = useState<PosSession | null>(null);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSaleId, setLastSaleId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [allBranches, e, p, prods, inv] = await Promise.all([
        fetchBranches(),
        fetchEmployees(),
        fetchPaymentMethods(),
        fetchProducts(),
        fetchCombinedInventory(),
      ]);
      const b = session?.tenantId
        ? allBranches.filter((x) => !x.tenantId || x.tenantId === session.tenantId)
        : allBranches;
      setBranches(b);
      setEmployees(e);
      setPaymentMethods(p);
      setProducts(prods);
      setInventory(inv);
      setSelectedBranchId((cur) => cur || b[0]?.id || '');
      setSelectedEmployeeId((cur) => cur || e[0]?.id || '');
      setSelectedPaymentMethodId((cur) => cur || p.find((pm) => pm.isActive)?.id || '');
      const active = e.find((emp) => emp.isActive);
      if (active) {
        const s = await fetchSessions().catch(() => []);
        const mine = s.find((sess) => sess.status === 'open' && sess.employeeId === active.id);
        setOpenSession(mine ?? null);
        if (mine) {
          const sum = await fetchSessionSummary(mine.id);
          setSummary(sum);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [session?.tenantId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!selectedBranchId) return;
    fetchCombinedInventory().then((inv) => setInventory(inv.filter((i) => i.branchId === selectedBranchId)));
  }, [selectedBranchId]);

  const loadVariants = useCallback(async (productId: string) => {
    try {
      const data = await fetchVariants(productId);
      setVariants((prev) => ({ ...prev, [productId]: data }));
    } catch {
      setVariants((prev) => ({ ...prev, [productId]: [] }));
    }
  }, []);

  const catalog: PosCatalogVariant[] = products.flatMap((prod) => {
    const productVariants = variants[prod.id] ?? [];
    return productVariants.filter((v) => v.isActive).map((v) => ({
      ...v,
      productId: prod.id,
      productName: prod.name,
      variantLabel: [v.size, v.color].filter(Boolean).join(' / ') || 'One Size',
      variantSku: v.sku,
      unitPrice: v.priceOverride ?? prod.basePrice,
    }));
  });

  const stockFor = (branchId: string, sku: string): number =>
    inventory.find((i) => i.branchId === branchId && i.variantSku === sku)?.quantity ?? 0;

  const addLine = (sku: string) => {
    const variant = catalog.find((v) => v.id === sku || v.variantSku === sku);
    if (!variant) return;
    const existing = cart.find((l) => l.variantId === variant.id);
    if (existing) {
      setCart((prev) => prev.map((l) => (l.variantId === variant.id ? { ...l, quantity: l.quantity + 1 } : l)));
    } else {
      setCart((prev) => [...prev, {
        key: `${variant.id}-${Date.now()}`,
        productId: variant.productId,
        productName: variant.productName,
        variantId: variant.id,
        variantSku: variant.variantSku,
        variantLabel: variant.variantLabel,
        unitPrice: variant.unitPrice,
        quantity: 1,
      }]);
    }
  };

  const updateLineQty = (key: string, quantity: number) => {
    setCart((prev) => prev.map((l) => (l.key === key ? { ...l, quantity: Math.max(0, quantity) } : l)));
  };

  const removeLine = (key: string) => {
    setCart((prev) => prev.filter((l) => l.key !== key));
  };

  const subtotal = Math.round(cart.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0) * 100) / 100;
  const total = Math.round((subtotal - totalDiscount) * 100) / 100;

  const checkout = async () => {
    if (cart.length === 0) {
      const error = new Error('Add at least one item to the sale');
      notifyError(error);
      throw error;
    }
    if (!selectedEmployeeId) {
      const error = new Error('Select who is completing the sale');
      notifyError(error);
      throw error;
    }
    if (!selectedPaymentMethodId) {
      const error = new Error('Select a payment method');
      notifyError(error);
      throw error;
    }
    const employee = employees.find((e) => e.id === selectedEmployeeId);
    const method = paymentMethods.find((m) => m.id === selectedPaymentMethodId);
    const sale = await createSale({
      branchId: selectedBranchId,
      sessionId: openSession?.id ?? null,
      employeeId: selectedEmployeeId,
      employeeName: employee?.name ?? '',
      items: cart.map((l) => ({
        productId: l.productId,
        productName: l.productName,
        variantId: l.variantId,
        variantSku: l.variantSku,
        variantLabel: l.variantLabel,
        unitPrice: l.unitPrice,
        quantity: l.quantity,
      })),
      paymentMethodId: selectedPaymentMethodId,
      paymentMethodName: method?.name ?? '',
      totalDiscount,
    });
    setLastSaleId(sale.id);
    setCart([]);
    setTotalDiscount(0);
    notifySuccess('Sale recorded');
    const s = await fetchSessions().catch(() => []);
    const mine = s.find((sess) => sess.status === 'open' && sess.employeeId === selectedEmployeeId) ?? openSession;
    if (mine) {
      setOpenSession(mine);
      setSummary(await fetchSessionSummary(mine.id));
    }
  };

  const withNames = (session: PosSession): PosSession => ({
    ...session,
    branchName: session.branchName || branches.find((b) => b.id === session.branchId)?.name || '',
    employeeName: session.employeeName || employees.find((e) => e.id === session.employeeId)?.name || '',
  });

  const openShift = async () => {
    if (!selectedBranchId || !selectedEmployeeId) {
      const error = new Error('Select branch and employee first');
      notifyError(error);
      throw error;
    }
    const s = await apiOpenSession(selectedBranchId, selectedEmployeeId);
    const named = withNames(s);
    setOpenSession(named);
    setSummary(await fetchSessionSummary(named.id));
    notifySuccess('Shift opened');
  };

  const closeShift = async (id: string) => {
    await apiCloseSession(id);
    setOpenSession(null);
    setSummary(null);
    notifySuccess('Shift closed');
  };

  return {
    branches,
    employees,
    paymentMethods,
    products,
    catalog,
    cart,
    subtotal,
    total,
    totalDiscount,
    setTotalDiscount,
    selectedBranchId,
    setSelectedBranchId,
    selectedEmployeeId,
    setSelectedEmployeeId,
    selectedPaymentMethodId,
    setSelectedPaymentMethodId,
    openSession,
    summary,
    stockFor,
    loadVariants,
    addLine,
    updateLineQty,
    removeLine,
    checkout,
    openShift,
    closeShift,
    lastSaleId,
    isLoading,
    error,
    refresh: load,
  };
};