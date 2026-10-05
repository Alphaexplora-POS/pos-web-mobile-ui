import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import LoadingButton from '../../../shared/components/LoadingButton';
import { sanitizeDecimal, sanitizeInteger } from '../../../shared/utils/numeric';
import { useInfiniteLoadMore } from '../../../shared/hooks/useInfiniteLoadMore';
import { SERVER_PAGE_SIZE } from '../../../shared/hooks/useServerPagination';
import { fetchProductsPage } from '../models/productsApi';
import type { Category, CreatePromoInput, Product, Promotion, PromoType } from '../models/productTypes';

interface PromoFormProps {
  products: Product[];
  categories: Category[];
  onSubmit: (data: CreatePromoInput) => void | Promise<void>;
  isOwner: boolean;
  initial?: Promotion;
  branchId?: string | null;
  onStepChange?: (step: number) => void;
}

const PromoForm: React.FC<PromoFormProps> = ({
  products,
  categories,
  onSubmit,
  isOwner,
  initial,
  branchId,
  onStepChange,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; value?: string; bundleProducts?: string }>({});
  const [name, setName] = useState(initial?.name ?? '');
  const [promoType, setPromoType] = useState<PromoType>(initial?.promoType ?? 'percentage');
  const [percentOff, setPercentOff] = useState(
    initial?.promoType === 'percentage' ? String(initial.config.percentOff ?? '') : '',
  );
  const [fixedAmountOff, setFixedAmountOff] = useState(
    initial?.promoType === 'fixed' ? String(initial.config.fixedAmountOff ?? '') : '',
  );
  const [bundlePrice, setBundlePrice] = useState(
    initial?.promoType === 'bundle' ? String(initial.config.bundlePrice ?? '') : '',
  );
  const [bundleQuantities, setBundleQuantities] = useState<Record<string, number>>(() => {
    if (initial?.promoType !== 'bundle') return {};
    const items = Array.isArray(initial.config.bundleItems) ? (initial.config.bundleItems as { productId: string; quantity: number }[]) : [];
    const map: Record<string, number> = {};
    for (const item of items) {
      if (item && item.productId) map[item.productId] = Number(item.quantity) || 0;
    }
    return map;
  });
  const [bundleQuery, setBundleQuery] = useState('');
  const [categoryIds, setCategoryIds] = useState<string[]>(
    (initial?.applicableItems ?? [])
      .filter((i) => i.scope === 'category' && i.categoryId)
      .map((i) => i.categoryId!),
  );
  const [productIds, setProductIds] = useState<string[]>(
    (initial?.applicableItems ?? [])
      .filter((i) => i.scope === 'product' && i.productId)
      .map((i) => i.productId!),
  );
  const [categoryQuery, setCategoryQuery] = useState('');
  const [productQuery, setProductQuery] = useState('');
  const [isStackable, setIsStackable] = useState(initial?.isStackable ?? false);
  const [isActive, setIsActive] = useState(isOwner ? (initial?.isActive ?? isOwner) : false);
  const [startDate, setStartDate] = useState(initial?.startDate ? String(initial.startDate).slice(0, 10) : '');
  const [endDate, setEndDate] = useState(initial?.endDate ? String(initial.endDate).slice(0, 10) : '');

  const [catalog, setCatalog] = useState<Product[]>(products);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const catalogRef = useRef(catalog);
  const catalogPageRef = useRef(1);
  const fetchingRef = useRef(false);

  useEffect(() => {
    catalogRef.current = catalog;
  }, [catalog]);

  const loadMore = useCallback(async () => {
    if (fetchingRef.current || !hasMore) return;
    fetchingRef.current = true;
    setFetchingMore(true);
    try {
      const nextPage = catalogPageRef.current + 1;
      const page = await fetchProductsPage(nextPage, branchId);
      catalogPageRef.current = nextPage;
      const seen = new Set(catalogRef.current.map((p) => p.id));
      const fresh = page.items.filter((p) => !seen.has(p.id));
      const merged = [...catalogRef.current, ...fresh];
      catalogRef.current = merged;
      setCatalog(merged);
      if (fresh.length === 0 || nextPage * SERVER_PAGE_SIZE >= page.total) setHasMore(false);
    } catch {
      // noop — retried on next scroll
    } finally {
      fetchingRef.current = false;
      setFetchingMore(false);
    }
  }, [branchId, hasMore]);

  const applyCategoryIds = (next: string[]) => {
    setCategoryIds(next);
    setProductIds((pids) =>
      pids.filter((pid) => {
        const product = products.find((p) => p.id === pid);
        return product ? next.includes(product.categoryId) : false;
      }),
    );
  };

  const toggleCategory = (id: string) =>
    applyCategoryIds(categoryIds.includes(id) ? categoryIds.filter((x) => x !== id) : [...categoryIds, id]);

  const toggleAllCategories = (ids: string[]) => {
    const allSelected = ids.length > 0 && categoryIds.filter((id) => ids.includes(id)).length === ids.length;
    applyCategoryIds(allSelected ? categoryIds.filter((id) => !ids.includes(id)) : [...new Set([...categoryIds, ...ids])]);
  };

  const toggleProduct = (id: string) =>
    setProductIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const toggleAllProducts = (ids: string[]) => {
    const allSelected = ids.length > 0 && productIds.filter((id) => ids.includes(id)).length === ids.length;
    setProductIds(allSelected ? productIds.filter((id) => !ids.includes(id)) : [...new Set([...productIds, ...ids])]);
  };

  const [step, setStep] = useState(1);
  const goToStep = (next: number) => {
    setStep(next);
    onStepChange?.(next);
  };

  const applicableCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(categoryQuery.trim().toLowerCase()),
  );
  const orderedCatalog = useMemo(
    () => [...catalog].sort((a, b) => a.name.localeCompare(b.name)),
    [catalog],
  );

  const applicableProducts = orderedCatalog
    .filter((p) => categoryIds.includes(p.categoryId))
    .filter((p) => p.name.toLowerCase().includes(productQuery.trim().toLowerCase()));

  const bundleFilteredProducts = orderedCatalog.filter((p) =>
    p.name.toLowerCase().includes(bundleQuery.trim().toLowerCase()),
  );

  const { sentinelRef: productGridSentinel } = useInfiniteLoadMore(loadMore, [catalog.length, step]);
  const { sentinelRef: bundleSentinel } = useInfiniteLoadMore(loadMore, [catalog.length]);

  const valueMissing = promoType === 'percentage' ? !percentOff : promoType === 'fixed' ? !fixedAmountOff : !bundlePrice;

  const bundleItems = Object.entries(bundleQuantities)
    .filter(([, qty]) => qty > 0)
    .map(([productId, quantity]) => ({ productId, quantity }));

  const bundleRuleLabel = bundleItems.length > 0
    ? `${bundleItems.map(({ productId, quantity }) => `${quantity}× ${catalog.find((p) => p.id === productId)?.name ?? 'Product'}`).join(', ')}${bundlePrice ? ` for ₱${bundlePrice}` : ''}`
    : '';

  const handleNext = () => {
    const nextErrors: { name?: string; value?: string; bundleProducts?: string } = {};
    if (!name.trim()) nextErrors.name = 'Name is required';
    if (valueMissing) nextErrors.value = promoType === 'bundle' ? 'Bundle price is required' : 'Discount amount is required';
    if (promoType === 'bundle' && bundleItems.length === 0) {
      nextErrors.bundleProducts = 'Pick at least one product with a quantity > 0';
    }
    setErrors(nextErrors);
    if (nextErrors.name || nextErrors.value || nextErrors.bundleProducts) return;
    goToStep(2);
  };

  const promoTypeLabel = promoType === 'percentage' ? 'Percentage' : promoType === 'fixed' ? 'Fixed' : 'Bundle';
  const promoValueLabel =
    promoType === 'percentage'
      ? `${percentOff}% off`
      : promoType === 'fixed'
        ? `${fixedAmountOff} off`
        : bundleRuleLabel;
  const summaryItems = [
    ...(name ? [name.trim()] : []),
    promoTypeLabel,
    ...(promoValueLabel ? [promoValueLabel] : []),
    ...(isOwner ? [`${categoryIds.length} categories`] : ['All products']),
    `${productIds.length} products`,
  ];

  return (
    <form
      className={step === 1 ? 'space-y-4' : 'flex-1 min-h-0 flex flex-col gap-4'}
      onSubmit={async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
          await onSubmit({
            name,
            promoType,
            config:
              promoType === 'percentage'
                ? { percentOff: Number(percentOff) }
                : promoType === 'fixed'
                ? { fixedAmountOff: Number(fixedAmountOff) }
                : { bundleRule: bundleRuleLabel, bundlePrice: Number(bundlePrice), bundleItems },
            isStackable,
            isActive: isOwner ? isActive : false,
            startDate: isOwner && isActive && startDate ? startDate : undefined,
            endDate: isOwner && isActive && endDate ? endDate : undefined,
            applicableItems: [
              ...(isOwner ? categoryIds.map((id) => ({ scope: 'category' as const, categoryId: id })) : []),
              ...productIds.map((id) => ({ scope: 'product' as const, productId: id })),
            ],
          });
          setName('');
          setPercentOff('');
          setFixedAmountOff('');
          setBundlePrice('');
          setBundleQuantities({});
          setBundleQuery('');
          setCategoryIds([]);
          setProductIds([]);
          setCategoryQuery('');
          setProductQuery('');
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {step === 1 ? (
        <div className="flex flex-col gap-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Step 1 of 2 · Details</p>
          <div>
            <label className="block text-sm text-ink-secondary">Name</label>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
            }}
            required
            aria-invalid={!!errors.name}
            className={`mt-1 w-full rounded border px-3 py-2 ${errors.name ? 'border-error' : 'border-line'}`}
          />
          {errors.name && <p className="mt-1 text-sm text-error">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-sm text-ink-secondary">Promo Type</label>
          <div className="flex gap-4 mt-1">
            {(['percentage', 'fixed', 'bundle'] as PromoType[]).map((t) => (
              <label key={t} className="flex items-center gap-2 text-sm">
                <input type="radio" checked={promoType === t} onChange={() => setPromoType(t)} />
                {t === 'percentage' ? 'Percentage' : t === 'fixed' ? 'Fixed Amount' : 'Bundle'}
              </label>
            ))}
          </div>
        </div>

        {promoType === 'percentage' && (
          <div>
            <label className="block text-sm text-ink-secondary">Percent Off</label>
            <input
              type="number"
              min="0"
              max="100"
value={percentOff}
                onChange={(e) => {
                  setPercentOff(sanitizeDecimal(e.target.value));
                  if (errors.value) setErrors((prev) => ({ ...prev, value: undefined }));
                }}
              required
              aria-invalid={!!errors.value}
              className={`mt-1 w-full rounded border px-3 py-2 ${errors.value ? 'border-error' : 'border-line'}`}
            />
            {errors.value && <p className="mt-1 text-sm text-error">{errors.value}</p>}
          </div>
        )}
        {promoType === 'fixed' && (
          <div>
            <label className="block text-sm text-ink-secondary">Fixed Amount Off</label>
            <input
              type="number"
              min="0"
              step="0.01"
value={fixedAmountOff}
                onChange={(e) => {
                  setFixedAmountOff(sanitizeDecimal(e.target.value));
                  if (errors.value) setErrors((prev) => ({ ...prev, value: undefined }));
                }}
              required
              aria-invalid={!!errors.value}
              className={`mt-1 w-full rounded border px-3 py-2 ${errors.value ? 'border-error' : 'border-line'}`}
            />
            {errors.value && <p className="mt-1 text-sm text-error">{errors.value}</p>}
          </div>
        )}
        {promoType === 'bundle' && (
          <>
            <div>
              <label className="block text-sm text-ink-secondary">Bundle Price (₱)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                placeholder="e.g. 1000"
                value={bundlePrice}
                onChange={(e) => {
                  setBundlePrice(sanitizeDecimal(e.target.value));
                  if (errors.value) setErrors((prev) => ({ ...prev, value: undefined }));
                }}
                required
                aria-invalid={!!errors.value}
                className={`mt-1 w-full rounded border px-3 py-2 ${errors.value ? 'border-error' : 'border-line'}`}
              />
              {errors.value && <p className="mt-1 text-sm text-error">{errors.value}</p>}
            </div>
            <div>
              <label className="block text-sm text-ink-secondary">Products in this bundle</label>
              <input
                value={bundleQuery}
                onChange={(e) => setBundleQuery(e.target.value)}
                placeholder="Search products…"
                className="mt-1 w-full rounded border border-line px-3 py-2"
              />
              <div className="mt-1 max-h-52 overflow-y-auto rounded border border-line divide-y divide-line">
                {bundleFilteredProducts.length === 0 && (
                  <p className="px-3 py-4 text-sm text-ink-muted">No products match your search</p>
                )}
                {bundleFilteredProducts.length > 0 && (
                  <div className="divide-y divide-line">
                    {bundleFilteredProducts.map((p) => {
                      const qty = bundleQuantities[p.id] ?? 0;
                      return (
                        <div key={p.id} className="flex items-center justify-between gap-3 px-3 py-2">
                          <span className="text-sm text-ink-primary truncate">{p.name}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              className="h-7 w-7 rounded-md border border-line text-ink-secondary hover:bg-canvas"
                              onClick={() =>
                                setBundleQuantities((prev) => {
                                  const next = Math.max(0, (prev[p.id] ?? 0) - 1);
                                  const copy = { ...prev };
                                  if (next === 0) delete copy[p.id];
                                  else copy[p.id] = next;
                                  return copy;
                                })
                              }
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={qty}
                              onChange={(e) => {
                                const next = Math.max(0, Math.floor(Number(sanitizeInteger(e.target.value)) || 0));
                                setBundleQuantities((prev) => {
                                  const copy = { ...prev };
                                  if (next === 0) delete copy[p.id];
                                  else copy[p.id] = next;
                                  return copy;
                                });
                                if (errors.bundleProducts) setErrors((prev) => ({ ...prev, bundleProducts: undefined }));
                              }}
                              aria-label={`Quantity of ${p.name}`}
                              className="w-14 rounded border border-line px-2 py-1 text-center text-sm"
                            />
                            <button
                              type="button"
                              className="h-7 w-7 rounded-md border border-line text-ink-secondary hover:bg-canvas"
                              onClick={() => {
                                setBundleQuantities((prev) => ({ ...prev, [p.id]: (prev[p.id] ?? 0) + 1 }));
                                if (errors.bundleProducts) setErrors((prev) => ({ ...prev, bundleProducts: undefined }));
                              }}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div ref={bundleSentinel} className="h-px" />
                {hasMore && (
                  <p className="px-3 py-2 text-center text-xs text-ink-muted">
                    {fetchingMore ? 'Loading…' : 'Scroll for more…'}
                  </p>
                )}
              </div>
              {errors.bundleProducts && <p className="mt-1 text-sm text-error">{errors.bundleProducts}</p>}
              {bundleItems.length > 0 && (
                <p className="mt-1 text-sm text-ink-secondary">{bundleRuleLabel}</p>
              )}
            </div>
          </>
        )}

        <div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isStackable} onChange={(e) => setIsStackable(e.target.checked)} />
            Stackable with other promos
          </label>
        </div>

        {isOwner ? (
          <div>
            <label className="block text-sm text-ink-secondary">Status</label>
            <div className="flex gap-4 mt-1">
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" checked={isActive} onChange={() => setIsActive(true)} />
                Active
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" checked={!isActive} onChange={() => setIsActive(false)} />
                Inactive
              </label>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm text-ink-secondary">Status</label>
            <p className="text-sm font-medium text-ink-secondary mt-1">Inactive</p>
            <p className="text-xs text-warning mt-1">
              Promotions created by a Branch Manager require Owner approval before going active.
            </p>
          </div>
        )}

        {isActive && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-ink-secondary">Start Date (optional)</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 w-full rounded border border-line px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-ink-secondary">End Date (optional)</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 w-full rounded border border-line px-3 py-2"
              />
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleNext}
          className="mt-1 w-full rounded-md bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-dark"
        >
          Next
        </button>
      </div>
      ) : (
        <>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Step 2 of 2 · Applicability</p>
          {!isOwner ? (
            <p className="text-xs text-ink-muted leading-relaxed">
              This promotion applies to all products in the branch.
            </p>
          ) : (
            <div className="flex flex-1 min-h-0 gap-6">
              <div className="w-64 shrink-0 flex flex-col min-h-0 gap-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-ink-primary">Categories</span>
                  <span className="text-xs text-ink-muted">{categoryIds.length} selected</span>
                </div>
                <input
                  value={categoryQuery}
                  onChange={(e) => setCategoryQuery(e.target.value)}
                  placeholder="Search categories…"
                  className="w-full rounded border border-line px-3 py-1.5 text-sm"
                />
                {applicableCategories.length === 0 ? (
                  <p className="text-xs text-ink-muted py-1">No categories match your search</p>
                ) : (
                  <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                    <div className="flex flex-wrap gap-2">
                    {applicableCategories.map((c) => {
                      const selected = categoryIds.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => toggleCategory(c.id)}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm cursor-pointer transition-colors ${
                            selected
                              ? 'bg-brand text-white border-brand'
                              : 'border-line bg-white text-ink-secondary hover:border-brand hover:text-ink-primary'
                          }`}
                        >
                          {selected && (
                            <svg
                              className="h-3.5 w-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          {c.name}
                        </button>
                      );
                    })}
                  </div>
                  </div>
                )}
                {applicableCategories.length > 0 && (
                  <button
                    type="button"
                    className="text-xs font-medium text-brand hover:underline self-start"
                    onClick={() => toggleAllCategories(applicableCategories.map((c) => c.id))}
                  >
                    {applicableCategories.every((c) => categoryIds.includes(c.id)) ? 'Deselect all' : 'Select all'}
                  </button>
                )}
              </div>
              <div className="flex-1 min-w-0 flex flex-col min-h-0 border-l border-line pl-6">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-sm font-semibold text-ink-primary">Products</span>
                  {categoryIds.length > 0 && applicableProducts.length > 0 && (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-ink-muted">{productIds.length} selected</span>
                      <button
                        type="button"
                        className="text-xs font-medium text-brand hover:underline"
                        onClick={() => toggleAllProducts(applicableProducts.map((p) => p.id))}
                      >
                        {applicableProducts.every((p) => productIds.includes(p.id)) ? 'Deselect all' : 'Select all'}
                      </button>
                    </div>
                  )}
                </div>
                {categoryIds.length === 0 ? (
                  <div className="flex-1 min-h-0 rounded-lg border border-dashed border-line flex flex-col items-center justify-center px-4 text-center text-xs text-ink-muted">
                    <p className="font-medium text-ink-secondary">No categories picked yet</p>
                    <p className="mt-1">Pick categories on the left to show their products here.</p>
                  </div>
                ) : (
                  <>
                    <input
                      value={productQuery}
                      onChange={(e) => setProductQuery(e.target.value)}
                      placeholder="Search products…"
                      className="mb-3 w-full rounded border border-line px-3 py-1.5 text-sm"
                    />
                    <div className="flex-1 min-h-0 overflow-y-auto rounded-lg border border-line p-3">
                      {applicableProducts.length === 0 ? (
                        <p className="px-4 py-4 text-xs text-ink-muted text-center">
                          {catalog.filter((p) => categoryIds.includes(p.categoryId)).length === 0
                            ? 'No products in the selected categories'
                            : 'No products match your search'}
                        </p>
                      ) : (
                        <>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {applicableProducts.map((p) => {
                            const selected = productIds.includes(p.id);
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => toggleProduct(p.id)}
                                className={`group relative flex flex-col rounded-lg border overflow-hidden text-left transition-all ${
                                  selected
                                    ? 'border-brand ring-2 ring-inset ring-brand bg-brand-light'
                                    : 'border-line hover:border-brand/60'
                                }`}
                              >
                                <div className="relative w-full aspect-square overflow-hidden bg-canvas">
                                  {p.imageUrl ? (
                                    <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                                  ) : (
                                    <span className="h-full w-full flex items-center justify-center">
                                      <svg
                                        className="h-8 w-8 text-ink-muted"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={1.5}
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A1.5 1.5 0 0 0 21 19.5V4.5A1.5 1.5 0 0 0 19.5 3H4.5A1.5 1.5 0 0 0 3 4.5v15A1.5 1.5 0 0 0 4.5 21Z"
                                        />
                                      </svg>
                                    </span>
                                  )}
                                  {selected && (
                                    <span className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-brand text-white flex items-center justify-center">
                                      <svg
                                        className="h-3 w-3"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={3}
                                      >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                      </svg>
                                    </span>
                                  )}
                                </div>
                                <div className="p-2 w-full">
                                  <span className="block text-xs font-medium text-ink-primary truncate">{p.name}</span>
                                  <span className="block text-[11px] text-ink-muted truncate">
                                    {categories.find((c) => c.id === p.categoryId)?.name}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        <div ref={productGridSentinel} className="h-px" />
                        {hasMore && (
                          <p className="py-3 text-center text-xs text-ink-muted">
                            {fetchingMore ? 'Loading…' : 'Scroll for more…'}
                          </p>
                        )}
                      </>
                    )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          <div className="border-t border-line" />
          <div className="flex items-center justify-between gap-3 pt-3">
            <div className="flex flex-wrap items-center gap-1.5 min-w-0">
              {summaryItems.map((item) => (
                <span
                  key={item}
                  className="shrink-0 rounded-full border border-line bg-canvas px-2.5 py-1 text-xs text-ink-secondary"
                >
                  {item}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => goToStep(1)}
                className="rounded-md border border-line px-5 py-2.5 text-sm font-medium text-ink-secondary hover:bg-canvas"
              >
                Back
              </button>
              <LoadingButton loading={submitting} loadingLabel={initial ? 'Updating…' : 'Creating…'}>
                {initial ? 'Update Promotion' : 'Create Promotion'}
              </LoadingButton>
            </div>
          </div>
        </>
      )}
    </form>
  );
};

export default PromoForm;