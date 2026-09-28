import { useState } from 'react';
import { useProductsViewModel } from '../viewModels/useProductsViewModel';
import CategoryForm from './CategoryForm';
import ProductForm from './ProductForm';
import PromoForm from './PromoForm';
import VariantForm from './VariantForm';
import AttributeForm from './AttributeForm';
import type { Category, ProductAttribute, ProductVariant } from '../models/productTypes';
import PageLayout from '../../../shared/components/PageLayout';
import { ProductsSkeleton, SkeletonList, SkeletonTable } from '../../../shared/components/Skeletons';
import ErrorState from '../../../shared/components/ErrorState';
import Modal from '../../../shared/components/Modal';
import Drawer from '../../../shared/components/Drawer';
import ConfirmModal from '../../../shared/components/ConfirmModal';
import TableEmptyState from '../../../shared/components/TableEmptyState';
import { useRole } from '../../../shared/hooks/useRole';
import { useAuth } from '../../auth/hooks/useAuth';
import { useMinimumLoading } from '../../../shared/hooks/useMinimumLoading';

type CategoryModalState = { mode: 'create' } | { mode: 'edit'; category: Category } | null;
type Section = 'products' | 'categories' | 'promotions';

const Products: React.FC = () => {
  const { session } = useAuth();
  const { isOwner } = useRole();
  const vm = useProductsViewModel(session?.branchId ?? null);
  const loading = useMinimumLoading(vm.isLoading);
  const [activeSection, setActiveSection] = useState<Section>('products');
  const [summarizeProductId, setSummarizeProductId] = useState<string | null>(null);
  const [categoryModal, setCategoryModal] = useState<CategoryModalState>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [addingProduct, setAddingProduct] = useState(false);
  const [promoModalOpen, setPromoModalOpen] = useState(false);
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [attributeModalOpen, setAttributeModalOpen] = useState(false);
  const [variantViewProductId, setVariantViewProductId] = useState<string | null>(null);
  const [attributeViewProductId, setAttributeViewProductId] = useState<string | null>(null);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [editingAttribute, setEditingAttribute] = useState<ProductAttribute | null>(null);
  const [confirmState, setConfirmState] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void | Promise<void>;
  } | null>(null);

  const summarizeProduct = vm.products.find((p) => p.id === summarizeProductId);
  const editingProduct = vm.products.find((p) => p.id === editingProductId) ?? null;

  const variantViewProduct = variantViewProductId
    ? vm.products.find((p) => p.id === variantViewProductId) ?? null
    : null;
  const attributeViewProduct = attributeViewProductId
    ? vm.products.find((p) => p.id === attributeViewProductId) ?? null
    : null;

  const viewingProductDetail = variantViewProductId !== null || attributeViewProductId !== null;

  if (loading) return <ProductsSkeleton />;
  if (vm.error) return <ErrorState message={vm.error} />;

  const tabBtn = (section: Section, label: string) => (
    <button
      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
        activeSection === section
          ? 'bg-brand text-white'
          : 'text-ink-secondary hover:text-ink-primary hover:bg-surface-hover'
      }`}
      onClick={() => setActiveSection(section)}
    >
      {label}
    </button>
  );

  return (
    <PageLayout title="Product Management">
      <div className="mb-6 inline-flex flex-wrap items-center gap-1 rounded-lg border border-line bg-white p-1">
        {tabBtn('products', 'Products')}
        {tabBtn('categories', 'Categories')}
        {tabBtn('promotions', 'Promotions')}
      </div>

      {activeSection === 'products' && variantViewProduct && (
        <div className="bg-white rounded-lg border border-line p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <button
                className="mb-3 inline-flex items-center gap-1.5 rounded-md border-2 border-brand bg-brand-light px-4 py-2 text-sm font-semibold text-brand transition-colors hover:bg-brand hover:text-white"
                onClick={() => setVariantViewProductId(null)}
              >
                ← Back to Products
              </button>
              <h2 className="text-lg font-semibold text-ink-primary">{variantViewProduct.name}</h2>
              <p className="text-xs text-ink-muted">
                {vm.categories.find((c) => c.id === variantViewProduct.categoryId)?.name ?? 'No category'}
              </p>
            </div>
            {isOwner && (
              <button
                className="bg-brand text-white px-4 py-2 rounded-md hover:bg-brand-dark transition-colors"
                onClick={() => {
                  setEditingVariant(null);
                  setVariantModalOpen(true);
                }}
              >
                Add Variant
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            {vm.detailsLoading[variantViewProductId!] ? (
              <SkeletonTable
                headers={isOwner ? ['Variant', 'SKU', 'Cost', 'Price', 'Status', 'Actions'] : ['Variant', 'SKU', 'Status', 'Actions']}
                rows={4}
              />
            ) : (vm.variants[variantViewProductId ?? ''] ?? []).length === 0 ? (
              <TableEmptyState message="No variants for this product yet. Add one" />
            ) : (
            <table className="w-full text-base">
              <thead>
                <tr className="bg-canvas border-b border-line">
                  <th className="py-3 pl-4 text-left font-semibold text-ink-muted">Variant</th>
                  <th className="py-3 text-left font-semibold text-ink-muted">SKU</th>
                  {isOwner && <th className="py-3 text-left font-semibold text-ink-muted">Cost</th>}
                  {isOwner && <th className="py-3 text-left font-semibold text-ink-muted">Price</th>}
                  <th className="py-3 text-left font-semibold text-ink-muted">Status</th>
                  <th className="py-3 pr-4 text-left font-semibold text-ink-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(vm.variants[variantViewProductId ?? ''] ?? []).map((v) => (
                  <tr key={v.id} className="border-b border-line last:border-0 hover:bg-canvas transition-colors">
                    <td className="py-3.5 pl-4 font-medium text-ink-primary">
                      {v.size ?? v.color ?? 'Default'}
                    </td>
                    <td className="py-3.5">{v.sku}</td>
                    {isOwner && (
                      <td className="py-3.5">{v.costPrice != null ? `$${v.costPrice}` : '-'}</td>
                    )}
                    {isOwner && (
                      <td className="py-3.5">{v.priceOverride != null ? `$${v.priceOverride}` : '-'}</td>
                    )}
                    <td className="py-3.5">
                      <span className={`text-sm px-3 py-1 rounded ${v.isActive ? 'bg-success-light text-success' : 'bg-surface-hover text-ink-muted'}`}>
                        {v.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-2">
                        <button
                          className="text-sm px-4 py-1.5 rounded-md border border-line text-ink-secondary hover:bg-canvas transition-colors"
                          onClick={() => {
                            setEditingVariant(v);
                            setVariantModalOpen(true);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className={`text-sm px-3 py-1 rounded ${v.isActive ? 'bg-error/10 text-error' : 'bg-success-light text-success'}`}
                          onClick={() =>
                            setConfirmState({
                              title: v.isActive ? 'Deactivate Variant' : 'Activate Variant',
                              message: `${v.isActive ? 'Deactivate' : 'Activate'} variant "${v.size ?? v.color ?? v.sku}"?`,
                              confirmLabel: v.isActive ? 'Deactivate' : 'Activate',
                              onConfirm: async () => {
                                await vm.setVariantActive(variantViewProductId!, v.id, !v.isActive);
                                setConfirmState(null);
                              },
                            })
                          }
                        >
                          {v.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
          </div>
        </div>
      )}

      {activeSection === 'products' && attributeViewProduct && (
        <div className="bg-white rounded-lg border border-line p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <button
                className="mb-3 inline-flex items-center gap-1.5 rounded-md border-2 border-brand bg-brand-light px-4 py-2 text-sm font-semibold text-brand transition-colors hover:bg-brand hover:text-white"
                onClick={() => setAttributeViewProductId(null)}
              >
                ← Back to Products
              </button>
              <h2 className="text-lg font-semibold text-ink-primary">{attributeViewProduct.name} Attributes</h2>
            </div>
            {isOwner && (
              <button
                className="bg-brand text-white px-4 py-2 rounded-md hover:bg-brand-dark transition-colors"
                onClick={() => {
                  setEditingAttribute(null);
                  setAttributeModalOpen(true);
                }}
              >
                Add Attribute
              </button>
            )}
          </div>
          <p className="text-xs text-ink-muted mb-3">Extra product details like material or origin</p>
          <div className="overflow-x-auto">
            {vm.detailsLoading[attributeViewProductId!] ? (
              <SkeletonTable
                headers={isOwner ? ['Attribute', 'Value', 'Actions'] : ['Attribute', 'Value']}
                rows={4}
              />
            ) : (vm.attributes[attributeViewProductId ?? ''] ?? []).length === 0 ? (
              <TableEmptyState message="No attributes yet" />
            ) : (
              <table className="w-full text-base">
                <thead>
                  <tr className="bg-canvas border-b border-line">
                    <th className="py-3 pl-4 text-left font-semibold text-ink-muted">Attribute</th>
                    <th className="py-3 text-left font-semibold text-ink-muted">Value</th>
                    {isOwner && <th className="py-3 pr-4 text-left font-semibold text-ink-muted">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {(vm.attributes[attributeViewProductId ?? ''] ?? []).map((a) => (
                    <tr key={a.id} className="border-b border-line last:border-0 hover:bg-canvas transition-colors">
                      <td className="py-3.5 pl-4 font-medium text-ink-primary">{a.attributeKey}</td>
                      <td className="py-3.5 text-ink-secondary">{a.attributeValue}</td>
                      {isOwner && (
<td className="py-3.5 pr-4 border-b border-line/60">
                          <button
                            className="text-sm px-4 py-1.5 rounded-md border border-line text-ink-secondary hover:bg-canvas transition-colors"
                            onClick={() => {
                              setEditingAttribute(a);
                              setAttributeModalOpen(true);
                            }}
                          >
                            Edit
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {activeSection === 'products' && !viewingProductDetail && (
        <div className="bg-white rounded-lg border border-line p-6 min-h-[36rem]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-ink-primary">Products</h2>
            {isOwner && (
              <button
                className="bg-brand text-white px-4 py-2 rounded-md hover:bg-brand-dark transition-colors"
                onClick={() => setAddingProduct(true)}
              >
                Add Product
              </button>
            )}
          </div>
          <div className="overflow-x-auto max-h-[calc(100vh-16rem)] overflow-y-auto">
            {vm.products.length === 0 ? (
              <TableEmptyState message="No products yet. Add one to get started" />
            ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-canvas border-b border-line">
                  <th className="py-3 pl-4 text-left font-semibold text-ink-muted">Image</th>
                  <th className="py-2 text-left font-semibold text-ink-muted">Name</th>
                  <th className="py-2 text-left font-semibold text-ink-muted">Category</th>
                  <th className="py-2 text-left font-semibold text-ink-muted">Price</th>
                  <th className="py-2 text-left font-semibold text-ink-muted">Variant</th>
                  <th className="py-2 text-left font-semibold text-ink-muted">Attributes</th>
                  <th className="py-2 text-left font-semibold text-ink-muted">Status</th>
                  {isOwner && <th className="py-2 text-left font-semibold text-ink-muted">Modify Product</th>}
                  <th className="py-2 pr-4 text-left font-semibold text-ink-muted">Summarize</th>
                </tr>
              </thead>
              <tbody>
                {vm.products.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-line last:border-0 hover:bg-canvas transition-colors"
                  >
                    <td className="py-3 pl-4">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="w-9 h-9 rounded-md object-cover border border-line bg-canvas"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-md border border-line bg-canvas flex items-center justify-center text-ink-muted">
                        —
                      </div>
                    )}
                    </td>
                    <td className="py-3 pl-4 font-medium text-ink-primary">{p.name}</td>
                    <td className="py-3">{vm.categories.find((c) => c.id === p.categoryId)?.name ?? '-'}</td>
                    <td className="py-3">${p.basePrice}</td>
                    <td className="py-3">
                      <button
                        className="text-xs px-3 py-1.5 rounded-md bg-brand text-white hover:bg-brand-dark transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setVariantViewProductId(p.id);
                          vm.loadProductDetails(p.id);
                        }}
                      >
                        View
                      </button>
                    </td>
                    <td className="py-3">
                      <button
                        className="text-xs px-3 py-1.5 rounded-md border border-line text-ink-secondary hover:bg-canvas transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAttributeViewProductId(p.id);
                          vm.loadProductDetails(p.id);
                        }}
                      >
                        View
                      </button>
                    </td>
                    <td className="py-3">
                      <span className={`text-xs px-3 py-1.5 rounded ${p.isActive ? 'bg-success-light text-success' : 'bg-surface-hover text-ink-muted'}`}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {isOwner && (
                      <td className="py-3">
                        <button
                          className="text-xs px-3 py-1.5 rounded-md border border-line text-ink-secondary hover:bg-canvas transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingProductId(p.id);
                          }}
                        >
                          Edit
                        </button>
                      </td>
                    )}
                    <td className="py-3 pr-4">
                      <button
                        className="text-xs px-3 py-1.5 rounded-md border border-line text-ink-secondary hover:bg-canvas transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSummarizeProductId(p.id);
                          vm.loadProductDetails(p.id);
                        }}
                      >
                        Summarize
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
          </div>
        </div>
      )}

      {activeSection === 'categories' && (
        <div className="bg-white rounded-lg border border-line p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-ink-primary">Categories</h2>
            {isOwner && (
              <button
                className="bg-brand text-white px-4 py-2 rounded-md hover:bg-brand-dark transition-colors"
                onClick={() => setCategoryModal({ mode: 'create' })}
              >
                Add Category
              </button>
            )}
          </div>
          {vm.categories.length === 0 ? (
            <TableEmptyState message="No categories yet" />
          ) : (
            <div className="space-y-3">
              {vm.categories.map((c) => {
                const parent = vm.categories.find((p) => p.id === c.parentId);
                return (
                  <div key={c.id} className="flex items-center justify-between rounded-lg border border-line p-4 transition-colors hover:border-line-strong hover:bg-canvas">
                    <div>
                      <p className="text-base font-medium text-ink-primary">{c.name}</p>
                      {parent ? (
                        <p className="text-sm text-ink-muted">
                          Child of <span className="font-medium text-ink-secondary">{parent.name}</span>
                        </p>
                      ) : (
                        <p className="text-sm text-ink-muted">Top-level</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm px-3 py-1 rounded ${
                          c.isActive ? 'bg-success-light text-success' : 'bg-surface-hover text-ink-muted'
                        }`}
                      >
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {isOwner && (
                        <>
                          <button
                            className="text-sm px-4 py-1.5 rounded-md border border-line text-ink-secondary hover:bg-canvas transition-colors"
                            onClick={() => setCategoryModal({ mode: 'edit', category: c })}
                          >
                            Edit
                          </button>
                          <button
                            className={`text-sm px-3 py-1.5 rounded ${
                              c.isActive ? 'bg-error/10 text-error' : 'bg-success-light text-success'
                            }`}
                            onClick={() =>
                              setConfirmState({
                                title: c.isActive ? 'Deactivate Category' : 'Activate Category',
                                message: `${c.isActive ? 'Deactivate' : 'Activate'} category "${c.name}"?`,
                                confirmLabel: c.isActive ? 'Deactivate' : 'Activate',
                                onConfirm: async () => {
                                  await vm.setCategoryActive(c.id, !c.isActive);
                                  setConfirmState(null);
                                },
                              })
                            }
                          >
                            {c.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeSection === 'promotions' && (
        <div className="bg-white rounded-lg border border-line p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-ink-primary">Promotions</h2>
            <button
              className="bg-brand text-white px-4 py-2 rounded-md hover:bg-brand-dark transition-colors"
              onClick={() => setPromoModalOpen(true)}
            >
              Add Promotion
            </button>
          </div>
          {vm.promotions.length === 0 ? (
            <TableEmptyState message="No promotions yet" />
          ) : (
          <div className="space-y-3">
            {vm.promotions.map((promo) => (
              <div key={promo.id} className="rounded-lg border border-line p-4 flex items-center justify-between transition-colors hover:border-line-strong hover:bg-canvas">
                <div>
                  <h3 className="text-base font-semibold text-ink-primary">{promo.name}</h3>
                  <p className="text-sm text-ink-muted">
                    {promo.promoType === 'percentage'
                      ? `${promo.config.percentOff}% off`
                      : promo.promoType === 'fixed'
                      ? `$${promo.config.fixedAmountOff} off`
                      : promo.config.bundleRule}
                    {promo.isStackable ? ' · Stackable' : ''}
                  </p>
                  <p className="text-sm text-ink-muted">
                    {promo.applicableItems.length > 0
                      ? `${promo.applicableItems.filter((i) => i.scope === 'product').length} product(s), ${promo.applicableItems.filter((i) => i.scope === 'category').length} category(s)`
                      : 'Applies to everything'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {isOwner && (
                    <button
                      className={`text-sm px-3 py-1.5 rounded ${promo.isActive ? 'bg-error/10 text-error' : 'bg-success-light text-success'}`}
                      onClick={() =>
                        setConfirmState({
                          title: promo.isActive ? 'Deactivate Promotion' : 'Activate Promotion',
                          message: `${promo.isActive ? 'Deactivate' : 'Activate'} promotion "${promo.name}"?`,
                          confirmLabel: promo.isActive ? 'Deactivate' : 'Activate',
                          onConfirm: async () => {
                            await vm.setPromotionActive(promo.id, !promo.isActive);
                            setConfirmState(null);
                          },
                        })
                      }
                    >
                      {promo.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  )}
                  <span
                    className={`text-sm px-3 py-1 rounded ${
                      promo.isActive ? 'bg-success-light text-success' : 'bg-surface-hover text-ink-muted'
                    }`}
                  >
                    {promo.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      )}

      {summarizeProduct && (
        <Drawer title="Product Summary" onClose={() => setSummarizeProductId(null)}>
          {(() => {
            const variants = vm.variants[summarizeProduct.id] ?? [];
            const attributes = vm.attributes[summarizeProduct.id] ?? [];
            const detailsLoading = vm.detailsLoading[summarizeProduct.id] ?? false;
            const variantLimit = 4;
            const attributeLimit = 4;
            const visibleVariants = variants.slice(0, variantLimit);
            const visibleAttributes = attributes.slice(0, attributeLimit);

            const openVariantView = () => {
              setSummarizeProductId(null);
              setVariantViewProductId(summarizeProduct.id);
              vm.loadProductDetails(summarizeProduct.id);
            };
            const openAttributeView = () => {
              setSummarizeProductId(null);
              setAttributeViewProductId(summarizeProduct.id);
              vm.loadProductDetails(summarizeProduct.id);
            };

            return (
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-ink-primary">{summarizeProduct.name}</h3>
                <p className="text-sm text-ink-muted">
                  {vm.categories.find((c) => c.id === summarizeProduct.categoryId)?.name ?? 'No category'}
                </p>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded ${
                  summarizeProduct.isActive ? 'bg-success-light text-success' : 'bg-surface-hover text-ink-muted'
                }`}
              >
                {summarizeProduct.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-line p-3">
                <p className="text-xs text-ink-muted">Base Price</p>
                <p className="text-sm font-semibold text-ink-primary mt-1">${summarizeProduct.basePrice}</p>
              </div>
              <div className="rounded-lg border border-line p-3">
                <p className="text-xs text-ink-muted">Variants</p>
                {detailsLoading ? (
                  <div className="skeleton h-4 w-10 rounded mt-1" />
                ) : (
                  <p className="text-sm font-semibold text-ink-primary mt-1">{variants.length}</p>
                )}
              </div>
              <div className="rounded-lg border border-line p-3">
                <p className="text-xs text-ink-muted">Attributes</p>
                {detailsLoading ? (
                  <div className="skeleton h-4 w-10 rounded mt-1" />
                ) : (
                  <p className="text-sm font-semibold text-ink-primary mt-1">{attributes.length}</p>
                )}
              </div>
              <div className="rounded-lg border border-line p-3">
                <p className="text-xs text-ink-muted">Ref</p>
                <p className="text-sm font-semibold text-ink-primary mt-1 truncate">
                  {summarizeProduct.id.slice(0, 6).toUpperCase()}
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-ink-primary">Variants</h4>
                {!detailsLoading && variants.length > 0 && (
                  <button
                    className="text-xs text-brand font-medium hover:underline"
                    onClick={openVariantView}
                  >
                    View all →
                  </button>
                )}
              </div>
              {detailsLoading ? (
                <SkeletonList rows={3} />
              ) : visibleVariants.length === 0 ? (
                <p className="text-sm text-ink-muted py-2">No variants yet</p>
              ) : (
                <ul className="divide-y divide-line rounded-lg border border-line">
                  {visibleVariants.map((v) => (
                    <li key={v.id} className="flex items-center justify-between px-3 py-2">
                      <span className="text-sm font-medium text-ink-primary">
                        {v.size ?? v.color ?? 'Default'}
                      </span>
                      <span className="text-xs text-ink-muted">{v.sku}</span>
                    </li>
                  ))}
                </ul>
              )}
              {!detailsLoading && variants.length > variantLimit && (
                <button
                  className="w-full text-sm text-brand font-medium py-2 hover:underline"
                  onClick={openVariantView}
                >
                  View all {variants.length} variants
                </button>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-ink-primary">Attributes</h4>
                {!detailsLoading && attributes.length > 0 && (
                  <button
                    className="text-xs text-brand font-medium hover:underline"
                    onClick={openAttributeView}
                  >
                    View all →
                  </button>
                )}
              </div>
              {detailsLoading ? (
                <SkeletonList rows={3} />
              ) : visibleAttributes.length === 0 ? (
                <p className="text-sm text-ink-muted py-2">No attributes yet</p>
              ) : (
                <ul className="divide-y divide-line rounded-lg border border-line">
                  {visibleAttributes.map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-3 px-3 py-2">
                      <span className="text-sm font-medium text-ink-primary">{a.attributeKey}</span>
                      <span className="text-sm text-ink-secondary">{a.attributeValue}</span>
                    </li>
                  ))}
                </ul>
              )}
              {!detailsLoading && attributes.length > attributeLimit && (
                <button
                  className="w-full text-sm text-brand font-medium py-2 hover:underline"
                  onClick={openAttributeView}
                >
                  View all {attributes.length} attributes
                </button>
              )}
            </div>
          </div>
            );
          })()}
        </Drawer>
      )}

      {isOwner && categoryModal && (
        <Modal
          title={categoryModal.mode === 'edit' ? `Edit Category — ${categoryModal.category.name}` : 'Add Category'}
          onClose={() => setCategoryModal(null)}
        >
          <CategoryForm
            categories={vm.categories}
            onSubmit={async (name, parentId) => {
              await vm.createCategory(name, parentId);
              setCategoryModal(null);
            }}
            onUpdate={async (id, name, parentId) => {
              await vm.updateCategory(id, name, parentId);
              setCategoryModal(null);
            }}
            editingCategory={categoryModal.mode === 'edit' ? categoryModal.category : null}
            onCancelEdit={() => setCategoryModal(null)}
          />
        </Modal>
      )}

      {isOwner && (addingProduct || editingProduct) && (
        <Modal
          title={editingProduct ? 'Edit Product' : 'Add Product'}
          size="lg"
          onClose={() => {
            setAddingProduct(false);
            setEditingProductId(null);
          }}
        >
          <ProductForm
            categories={vm.categories}
            isOwner={isOwner}
            onSubmit={async (data) => {
              await vm.createProduct(data);
              setAddingProduct(false);
            }}
            editingProduct={editingProduct}
            onUpdate={async (id, data) => {
              await vm.updateProduct(id, data);
              setEditingProductId(null);
            }}
            onCancelEdit={() => setEditingProductId(null)}
          />
        </Modal>
      )}

      {isOwner && variantModalOpen && variantViewProductId && (
        <Modal
          title={editingVariant ? 'Edit Variant' : 'Add Variant'}
          onClose={() => {
            setEditingVariant(null);
            setVariantModalOpen(false);
          }}
        >
          <VariantForm
            products={vm.products}
            productId={variantViewProductId}
            isOwner={isOwner}
            editingVariant={editingVariant}
            onSubmit={async (productId, input) => {
              await vm.createVariant(productId, input);
              setVariantModalOpen(false);
            }}
            onUpdate={async (productId, variantId, input) => {
              await vm.updateVariant(productId, variantId, input);
              setEditingVariant(null);
              setVariantModalOpen(false);
            }}
            onCancelEdit={() => {
              setEditingVariant(null);
              setVariantModalOpen(false);
            }}
          />
        </Modal>
      )}

      {isOwner && attributeModalOpen && attributeViewProductId && (
        <Modal
          title={editingAttribute ? 'Edit Custom Attribute' : 'Add Custom Attribute'}
          onClose={() => {
            setEditingAttribute(null);
            setAttributeModalOpen(false);
          }}
        >
          <AttributeForm
            products={vm.products}
            productId={attributeViewProductId}
            editingAttribute={editingAttribute}
            onSubmit={async (productId, key, value) => {
              await vm.createAttribute(productId, key, value);
              setAttributeModalOpen(false);
            }}
            onUpdate={async (productId, id, key, value) => {
              await vm.updateAttribute(productId, id, key, value);
              setEditingAttribute(null);
              setAttributeModalOpen(false);
            }}
            onCancelEdit={() => {
              setEditingAttribute(null);
              setAttributeModalOpen(false);
            }}
          />
        </Modal>
      )}

      {promoModalOpen && (
        <Modal title="Add Promotion" onClose={() => setPromoModalOpen(false)}>
          <PromoForm
            products={vm.products}
            categories={vm.categories}
            isOwner={isOwner}
            onSubmit={async (data) => {
              await vm.createPromotion(data);
              setPromoModalOpen(false);
            }}
          />
        </Modal>
      )}

      {confirmState && (
        <ConfirmModal
          title={confirmState.title}
          message={confirmState.message}
          confirmLabel={confirmState.confirmLabel}
          onConfirm={confirmState.onConfirm}
          onClose={() => setConfirmState(null)}
        />
      )}
    </PageLayout>
  );
};

export default Products;
