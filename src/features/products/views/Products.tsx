import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useProductsViewModel } from '../viewModels/useProductsViewModel';
import CategoryForm from './CategoryForm';
import ProductForm from './ProductForm';
import PromoForm from './PromoForm';
import VariantForm from './VariantForm';
import AttributeForm from './AttributeForm';
import type { Category, ProductAttribute, ProductVariant, Promotion } from '../models/productTypes';
import {
  fetchAttributes,
  fetchCategoriesPage,
  fetchProductsPage,
  fetchPromotionsPage,
  fetchVariants,
} from '../models/productsApi';
import { queryClient } from '../../../shared/models/queryClient';
import PageLayout from '../../../shared/components/PageLayout';
import { ProductsSkeleton, SkeletonList, SkeletonTable } from '../../../shared/components/Skeletons';
import ErrorState from '../../../shared/components/ErrorState';
import Modal from '../../../shared/components/Modal';
import Drawer from '../../../shared/components/Drawer';
import ConfirmModal from '../../../shared/components/ConfirmModal';
import TableEmptyState from '../../../shared/components/TableEmptyState';
import { useRole } from '../../../shared/hooks/useRole';
import { useAuth } from '../../auth/hooks/useAuth';
import { usePagination } from '../../../shared/hooks/usePagination';
import { useServerPagination } from '../../../shared/hooks/useServerPagination';
import Pagination from '../../../shared/components/Pagination';
import { useUrlSection } from '../../../shared/hooks/useUrlSection';
import { useResponsivePageSize } from '../../../shared/hooks/useResponsivePageSize';
import ViewportTable from '../../../shared/components/ViewportTable';

type CategoryModalState = { mode: 'create' } | { mode: 'edit'; category: Category } | null;
type Section = 'products' | 'categories' | 'promotions';

const Products: React.FC = () => {
  const { session } = useAuth();
  const { isOwner } = useRole();
  const vm = useProductsViewModel(session?.branchId ?? null);
  const [activeSection, setActiveSection] = useUrlSection<Section>(
    'section',
    'products',
    (v) => (v === 'categories' || v === 'promotions' ? v : 'products'),
  );
  const [summarizeProductId, setSummarizeProductId] = useState<string | null>(null);
  const [categoryModal, setCategoryModal] = useState<CategoryModalState>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [addingProduct, setAddingProduct] = useState(false);
  const [promoModalOpen, setPromoModalOpen] = useState(false);
  const [promoStep, setPromoStep] = useState(1);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [promoStatusTab, setPromoStatusTab] = useUrlSection<'active' | 'inactive'>(
    'status',
    'active',
    (v) => (v === 'active' || v === 'inactive' ? v : null),
  );
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

  const [tableHeight, setTableHeight] = useState<number>(0);
  const [rowHeight, setRowHeight] = useState<number>(0);
  const pageSize = useResponsivePageSize(tableHeight, rowHeight);
  const productPage = useServerPagination(
    (page) => fetchProductsPage(page, session?.branchId ?? null),
    pageSize,
    {
      deps: [session?.branchId ?? ''],
      queryKey: ['products', session?.branchId ?? ''],
      refetchInterval: 90_000,
    },
  );
  const categoriesPage = useServerPagination((page) => fetchCategoriesPage(page), pageSize, {
    queryKey: ['categories'],
    refetchInterval: 90_000,
  });
  const promotionsPage = useServerPagination(
    (page) => fetchPromotionsPage(page, promoStatusTab === 'active'),
    pageSize,
    { deps: [promoStatusTab], queryKey: ['promotions', promoStatusTab], refetchInterval: 90_000 },
  );

  const variantQuery = useQuery<ProductVariant[]>({
    queryKey: ['product-variants', variantViewProductId ?? ''],
    queryFn: () => fetchVariants(variantViewProductId as string),
    enabled: variantViewProductId !== null,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
  const attributeQuery = useQuery<ProductAttribute[]>({
    queryKey: ['product-attributes', attributeViewProductId ?? ''],
    queryFn: () => fetchAttributes(attributeViewProductId as string),
    enabled: attributeViewProductId !== null,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });

  const loading = productPage.loading && productPage.totalCount === 0;
  const variantItems = variantQuery.data ?? [];
  const attributeItems = attributeQuery.data ?? [];
  const variantPagination = usePagination(variantItems, pageSize);
  const attributePagination = usePagination(attributeItems, pageSize);

  const summarizeProduct = productPage.items.find((p) => p.id === summarizeProductId);
  const editingProduct = productPage.items.find((p) => p.id === editingProductId) ?? null;

  const variantViewProduct = variantViewProductId
    ? productPage.items.find((p) => p.id === variantViewProductId) ?? null
    : null;
  const attributeViewProduct = attributeViewProductId
    ? productPage.items.find((p) => p.id === attributeViewProductId) ?? null
    : null;

  const viewingProductDetail = variantViewProductId !== null || attributeViewProductId !== null;

  if (loading) return <ProductsSkeleton isOwner={isOwner} />;
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
          <ViewportTable onFitHeightChange={setTableHeight} onRowHeightChange={setRowHeight}>
            <div className="flex-1 overflow-x-auto overflow-y-hidden">
            {variantQuery.isLoading ? (
              <SkeletonTable
                headers={isOwner ? ['Variant', 'SKU', 'Cost', 'Price', 'Status', 'Actions'] : ['Variant', 'SKU', 'Status', 'Actions']}
                rows={4}
              />
            ) : variantItems.length === 0 ? (
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
                {variantPagination.pageItems.map((v) => (
                  <tr key={v.id} className="border-b border-line last:border-0 hover:bg-canvas transition-colors">
                    <td className="py-3.5 pl-4 font-medium text-ink-primary">
                      {v.size ?? v.color ?? 'Default'}
                    </td>
                    <td className="py-3.5">{v.sku}</td>
                    {isOwner && (
                      <td className="py-3.5">{v.costPrice != null ? `₱${v.costPrice}` : '-'}</td>
                    )}
                    {isOwner && (
                      <td className="py-3.5">{v.priceOverride != null ? `₱${v.priceOverride}` : '-'}</td>
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
                          className={`text-sm px-3 py-1 rounded ${v.isActive ? 'bg-error text-white hover:opacity-90' : 'bg-success text-white hover:opacity-90'}`}
                          onClick={() =>
                            setConfirmState({
                              title: v.isActive ? 'Deactivate Variant' : 'Activate Variant',
                              message: `${v.isActive ? 'Deactivate' : 'Activate'} variant "${v.size ?? v.color ?? v.sku}"?`,
                              confirmLabel: v.isActive ? 'Deactivate' : 'Activate',
                              onConfirm: async () => {
                                await vm.setVariantActive(variantViewProductId!, v.id, !v.isActive);
                                queryClient.invalidateQueries({ queryKey: ['product-variants', variantViewProductId] });
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
            {variantItems.length > 0 && (
              <Pagination
                page={variantPagination.page}
                totalPages={variantPagination.totalPages}
                onPageChange={variantPagination.goToPage}
                totalCount={variantPagination.totalCount}
                pageStart={variantPagination.pageStart}
                pageEnd={variantPagination.pageEnd}
              />
            )}
          </ViewportTable>
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
{productPage.error && (
            <div className="mb-3 rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
              {productPage.error}, try refreshing.
            </div>
          )}
          <ViewportTable onFitHeightChange={setTableHeight} onRowHeightChange={setRowHeight}>
            <div className="flex-1 overflow-x-auto overflow-y-hidden">
            {attributeQuery.isLoading ? (
              <SkeletonTable
                headers={isOwner ? ['Attribute', 'Value', 'Actions'] : ['Attribute', 'Value']}
                rows={4}
              />
            ) : attributeItems.length === 0 ? (
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
                  {attributePagination.pageItems.map((a) => (
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
          {attributeItems.length > 0 && (
            <Pagination
              page={attributePagination.page}
              totalPages={attributePagination.totalPages}
              onPageChange={attributePagination.goToPage}
              totalCount={attributePagination.totalCount}
              pageStart={attributePagination.pageStart}
              pageEnd={attributePagination.pageEnd}
            />
          )}
          </ViewportTable>
        </div>
      )}

      {activeSection === 'products' && !viewingProductDetail && (
        <div className="bg-white rounded-lg border border-line p-6">
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
          <ViewportTable onFitHeightChange={setTableHeight} onRowHeightChange={setRowHeight}>
            <div className="flex-1 overflow-x-auto overflow-y-hidden">
            {productPage.items.length === 0 ? (
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
                {productPage.items.map((p) => (
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
                    <td className="py-3">₱{p.basePrice}</td>
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
            {productPage.totalCount > 0 && (
              <Pagination
                page={productPage.page}
                totalPages={productPage.totalPages}
                onPageChange={productPage.goToPage}
                totalCount={productPage.totalCount}
                pageStart={productPage.pageStart}
                pageEnd={productPage.pageEnd}
              />
            )}
          </ViewportTable>
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
          {categoriesPage.error && (
            <div className="mb-3 rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
              {categoriesPage.error}, try refreshing.
            </div>
          )}
          {categoriesPage.loading && categoriesPage.totalCount === 0 ? (
            <ViewportTable onFitHeightChange={setTableHeight} onRowHeightChange={setRowHeight}>
              <SkeletonTable headers={['Name', 'Parent', 'Status', 'Actions']} rows={4} />
            </ViewportTable>
          ) : categoriesPage.totalCount === 0 ? (
            <TableEmptyState message="No categories yet" />
          ) : (
            <ViewportTable onFitHeightChange={setTableHeight} onRowHeightChange={setRowHeight}>
            <div className="flex-1 overflow-x-auto overflow-y-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-canvas border-b border-line">
                  <th className="py-3 pl-4 text-left font-semibold text-ink-muted">Name</th>
                  <th className="py-2 text-left font-semibold text-ink-muted">Parent</th>
                  <th className="py-2 text-left font-semibold text-ink-muted">Status</th>
                  {isOwner && <th className="py-2 pr-4 text-left font-semibold text-ink-muted">Actions</th>}
                </tr>
              </thead>
              <tbody>
              {categoriesPage.items.map((c) => {
                const parent = vm.categories.find((p) => p.id === c.parentId);
                return (
                  <tr key={c.id} className="border-b border-line last:border-0 hover:bg-canvas transition-colors">
                    <td className="py-3 pl-4 font-medium text-ink-primary">{c.name}</td>
                    <td className="py-3 text-sm text-ink-muted">
                      {parent ? (
                        <>Child of <span className="font-medium text-ink-secondary">{parent.name}</span></>
                      ) : (
                        'Top-level'
                      )}
                    </td>
                    <td className="py-3">
                      <span
                        className={`text-xs px-3 py-1.5 rounded ${
                          c.isActive ? 'bg-success-light text-success' : 'bg-surface-hover text-ink-muted'
                        }`}
                      >
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {isOwner && (
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <button
                            className="text-sm px-3 py-1.5 rounded bg-brand-light text-brand hover:bg-brand hover:text-white transition-colors"
                            onClick={() => setCategoryModal({ mode: 'edit', category: c })}
                          >
                            Edit
                          </button>
                          <button
                            className={`text-sm px-3 py-1.5 rounded ${
                              c.isActive ? 'bg-error text-white hover:opacity-90' : 'bg-success text-white hover:opacity-90'
                            }`}
                            onClick={() =>
                              setConfirmState({
                                title: c.isActive ? 'Deactivate Category' : 'Activate Category',
                                message: `${c.isActive ? 'Deactivate' : 'Activate'} category "${c.name}"?`,
                                confirmLabel: c.isActive ? 'Deactivate' : 'Activate',
                                onConfirm: async () => {
                                  await vm.setCategoryActive(c.id, !c.isActive);
                                  categoriesPage.reset();
                                  setConfirmState(null);
                                },
                              })
                            }
                          >
                            {c.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
              </tbody>
            </table>
            </div>
            {categoriesPage.totalCount > 0 && (
              <Pagination
                page={categoriesPage.page}
                totalPages={categoriesPage.totalPages}
                onPageChange={categoriesPage.goToPage}
                totalCount={categoriesPage.totalCount}
                pageStart={categoriesPage.pageStart}
                pageEnd={categoriesPage.pageEnd}
              />
            )}
            </ViewportTable>
          )}
        </div>
      )}

      {activeSection === 'promotions' && (
        <div className="bg-white rounded-lg border border-line p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-ink-primary">Promotions</h2>
            <button
              className="bg-brand text-white px-4 py-2 rounded-md hover:bg-brand-dark transition-colors"
              onClick={() => { setEditingPromo(null); setPromoStep(1); setPromoModalOpen(true); }}
            >
              Add Promotion
            </button>
          </div>
          <div className="mb-4 inline-flex items-center gap-1 rounded-lg border border-line bg-canvas p-1">
            {(['active', 'inactive'] as const).map((tab) => (
              <button
                key={tab}
                className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                  promoStatusTab === tab
                    ? 'bg-brand text-white'
                    : 'text-ink-secondary hover:text-ink-primary hover:bg-surface-hover'
                }`}
                onClick={() => setPromoStatusTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          {promotionsPage.error && (
            <div className="mb-3 rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
              {promotionsPage.error}, try switching tabs to refetch.
            </div>
          )}
          {promotionsPage.loading ? (
            <ViewportTable onFitHeightChange={setTableHeight} onRowHeightChange={setRowHeight}>
              <SkeletonTable headers={['Name', 'Details', 'Applicability', 'Status', 'Actions']} rows={4} />
            </ViewportTable>
          ) : promotionsPage.totalCount === 0 ? (
            <TableEmptyState
              message={
                promoStatusTab === 'active'
                  ? 'No active promotions yet'
                  : 'No inactive promotions, check the Active tab'
              }
            />
          ) : (
          <ViewportTable onFitHeightChange={setTableHeight} onRowHeightChange={setRowHeight}>
          <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-canvas border-b border-line">
                <th className="py-3 pl-4 text-left font-semibold text-ink-muted">Name</th>
                <th className="py-2 text-left font-semibold text-ink-muted">Details</th>
                <th className="py-2 text-left font-semibold text-ink-muted">Applicability</th>
                <th className="py-2 text-left font-semibold text-ink-muted">Status</th>
                <th className="py-2 pr-4 text-left font-semibold text-ink-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
            {promotionsPage.items.map((promo) => (
              <tr key={promo.id} className="border-b border-line last:border-0 hover:bg-canvas transition-colors">
                <td className="py-3 pl-4 font-medium text-ink-primary">{promo.name}</td>
                <td className="py-3 text-sm text-ink-muted">
                  {promo.promoType === 'percentage'
                    ? `${promo.config.percentOff}% off`
                    : promo.promoType === 'fixed'
                    ? `₱${promo.config.fixedAmountOff} off`
                    : String(promo.config.bundleRule ?? '')}
                  {promo.isStackable ? ' · Stackable' : ''}
                </td>
                <td className="py-3 text-sm text-ink-muted">
                  {promo.applicableItems.length > 0
                    ? `${promo.applicableItems.filter((i) => i.scope === 'product').length} product(s), ${promo.applicableItems.filter((i) => i.scope === 'category').length} category(s)`
                    : 'Applies to everything'}
                </td>
                <td className="py-3">
                  <button
                    type="button"
                    disabled={!isOwner}
                    title={isOwner ? (promo.isActive ? 'Deactivate' : 'Activate') : undefined}
                    onClick={() =>
                      setConfirmState({
                        title: promo.isActive ? 'Deactivate Promotion' : 'Activate Promotion',
                        message: `${promo.isActive ? 'Deactivate' : 'Activate'} promotion "${promo.name}"?`,
                        confirmLabel: promo.isActive ? 'Deactivate' : 'Activate',
                        onConfirm: async () => {
                          await vm.setPromotionActive(promo.id, !promo.isActive);
                          promotionsPage.reset();
                          setConfirmState(null);
                        },
                      })
                    }
                    className={`text-sm px-3 py-1.5 rounded ${
                      promo.endDate && new Date(promo.endDate).getTime() < Date.now()
                        ? 'bg-warning/10 text-warning'
                        : promo.isActive
                          ? 'bg-success-light text-success'
                          : 'bg-surface-hover text-ink-muted'
                    } ${isOwner ? 'cursor-pointer hover:ring-1 ring-inset ring-current' : 'cursor-default'}`}
                  >
                    {promo.endDate && new Date(promo.endDate).getTime() < Date.now()
                      ? 'Expired'
                      : promo.isActive
                        ? 'Active'
                        : 'Inactive'}
                  </button>
                </td>
                <td className="py-3 pr-4">
                  <button
                    type="button"
                    className="text-sm px-3 py-1.5 rounded bg-brand-light text-brand hover:bg-brand hover:text-white transition-colors"
                    onClick={() => {
                      setEditingPromo(promo);
                      setPromoStep(1);
                      setPromoModalOpen(true);
                    }}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
            </tbody>
          </table>
          </div>
          {promotionsPage.totalCount > 0 && (
            <Pagination
              page={promotionsPage.page}
              totalPages={promotionsPage.totalPages}
              onPageChange={promotionsPage.goToPage}
              totalCount={promotionsPage.totalCount}
              pageStart={promotionsPage.pageStart}
              pageEnd={promotionsPage.pageEnd}
            />
          )}
          </ViewportTable>
          )}
        </div>
      )}

      {summarizeProduct && (
        <Drawer title="Product Summary" onClose={() => setSummarizeProductId(null)}>
          {(() => {
            const variants = vm.variants[summarizeProduct.id] ?? [];
            const attributes = vm.attributes[summarizeProduct.id] ?? [];
            const detailsLoading = vm.detailsLoading[summarizeProduct.id] ?? false;

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
                <p className="text-sm font-semibold text-ink-primary mt-1">₱{summarizeProduct.basePrice}</p>
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
                <h4 className="text-sm font-semibold text-ink-primary">
                  Variants{' '}
                  <span className="ml-1 text-xs font-normal text-ink-muted">({variants.length})</span>
                </h4>
              </div>
              {detailsLoading ? (
                <SkeletonList rows={3} />
              ) : variants.length === 0 ? (
                <p className="text-sm text-ink-muted py-2">No variants yet</p>
              ) : (
                <ul
                  className={`divide-y divide-line rounded-lg border border-line ${
                    variants.length > 5 ? 'max-h-52 overflow-y-auto' : ''
                  }`}
                >
                  {variants.map((v) => (
                    <li key={v.id} className="flex items-center justify-between px-3 py-2">
                      <span className="text-sm font-medium text-ink-primary">
                        {v.size ?? v.color ?? 'Default'}
                      </span>
                      <span className="text-xs text-ink-muted">{v.sku}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-ink-primary">
                  Attributes{' '}
                  <span className="ml-1 text-xs font-normal text-ink-muted">({attributes.length})</span>
                </h4>
              </div>
              {detailsLoading ? (
                <SkeletonList rows={3} />
              ) : attributes.length === 0 ? (
                <p className="text-sm text-ink-muted py-2">No attributes yet</p>
              ) : (
                <ul
                  className={`divide-y divide-line rounded-lg border border-line ${
                    attributes.length > 5 ? 'max-h-52 overflow-y-auto' : ''
                  }`}
                >
                  {attributes.map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-3 px-3 py-2">
                      <span className="text-sm font-medium text-ink-primary">{a.attributeKey}</span>
                      <span className="text-sm text-ink-secondary">{a.attributeValue}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
            );
          })()}
        </Drawer>
      )}

      {isOwner && categoryModal && (
        <Modal
          title={categoryModal.mode === 'edit' ? `Edit Category, ${categoryModal.category.name}` : 'Add Category'}
          onClose={() => setCategoryModal(null)}
        >
          <CategoryForm
            categories={vm.categories}
            onSubmit={async (name, parentId) => {
              await vm.createCategory(name, parentId);
              categoriesPage.reset();
              setCategoryModal(null);
            }}
            onUpdate={async (id, name, parentId) => {
              await vm.updateCategory(id, name, parentId);
              categoriesPage.reset();
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
              productPage.reset();
              setAddingProduct(false);
            }}
            editingProduct={editingProduct}
            onUpdate={async (id, data) => {
              await vm.updateProduct(id, data);
              productPage.reset();
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
              queryClient.invalidateQueries({ queryKey: ['product-variants', productId] });
              setVariantModalOpen(false);
            }}
            onUpdate={async (productId, variantId, input) => {
              await vm.updateVariant(productId, variantId, input);
              queryClient.invalidateQueries({ queryKey: ['product-variants', productId] });
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
              queryClient.invalidateQueries({ queryKey: ['product-attributes', productId] });
              setAttributeModalOpen(false);
            }}
            onUpdate={async (productId, id, key, value) => {
              await vm.updateAttribute(productId, id, key, value);
              queryClient.invalidateQueries({ queryKey: ['product-attributes', productId] });
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
        <Modal
          title={editingPromo ? 'Edit Promotion' : 'Add Promotion'}
          size={promoStep === 1 ? 'md' : '2xl'}
          fit={promoStep === 2}
          animate={promoStep === 1}
          onClose={() => setPromoModalOpen(false)}
        >
          <PromoForm
            products={vm.products}
            categories={vm.categories}
            isOwner={isOwner}
            initial={editingPromo ?? undefined}
            branchId={session?.branchId ?? null}
            onStepChange={setPromoStep}
            onSubmit={async (data) => {
              if (editingPromo) {
                await vm.updatePromotion(editingPromo.id, data);
              } else {
                await vm.createPromotion(data);
              }
              promotionsPage.reset();
              setEditingPromo(null);
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
