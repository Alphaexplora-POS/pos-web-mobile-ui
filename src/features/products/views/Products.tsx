import { useState } from 'react';
import { useProductsViewModel } from '../viewModels/useProductsViewModel';
import CategoryForm from './CategoryForm';
import ProductForm from './ProductForm';
import ProductDetail from './ProductDetail';
import PromoForm from './PromoForm';
import type { Category } from '../models/productTypes';
import PageLayout from '../../../shared/components/PageLayout';
import { ProductsSkeleton } from '../../../shared/components/Skeletons';
import ErrorState from '../../../shared/components/ErrorState';
import Modal from '../../../shared/components/Modal';
import TableEmptyState from '../../../shared/components/TableEmptyState';
import { useRole } from '../../../shared/hooks/useRole';
import { useMinimumLoading } from '../../../shared/hooks/useMinimumLoading';

type CategoryModalState = { mode: 'create' } | { mode: 'edit'; category: Category } | null;

const Products: React.FC = () => {
  const vm = useProductsViewModel();
  const { isOwner } = useRole();
  const loading = useMinimumLoading(vm.isLoading);
  const [activeSection, setActiveSection] = useState<'products' | 'categories' | 'promotions'>('products');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [categoryModal, setCategoryModal] = useState<CategoryModalState>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [addingProduct, setAddingProduct] = useState(false);
  const [promoModalOpen, setPromoModalOpen] = useState(false);

  const selectedProduct = vm.products.find((p) => p.id === selectedProductId);
  const editingProduct = vm.products.find((p) => p.id === editingProductId) ?? null;

  const handleSelectProduct = (id: string) => {
    setSelectedProductId((prev) => (prev === id ? null : id));
    if (selectedProductId !== id) vm.loadProductDetails(id);
  };

  if (loading) return <ProductsSkeleton />;
  if (vm.error) return <ErrorState message={vm.error} />;

  return (
    <PageLayout title="Product Management">
      <div className="mb-6 inline-flex items-center gap-1 rounded-lg border border-line bg-white p-1">
        <button
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeSection === 'products'
              ? 'bg-brand text-white'
              : 'text-ink-secondary hover:text-ink-primary hover:bg-surface-hover'
          }`}
          onClick={() => setActiveSection('products')}
        >
          Products
        </button>
        <button
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeSection === 'categories'
              ? 'bg-brand text-white'
              : 'text-ink-secondary hover:text-ink-primary hover:bg-surface-hover'
          }`}
          onClick={() => setActiveSection('categories')}
        >
          Categories
        </button>
        <button
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeSection === 'promotions'
              ? 'bg-brand text-white'
              : 'text-ink-secondary hover:text-ink-primary hover:bg-surface-hover'
          }`}
          onClick={() => setActiveSection('promotions')}
        >
          Promotions
        </button>
      </div>

      {activeSection === 'products' && (
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
          <div className="overflow-x-auto">
            {vm.products.length === 0 ? (
              <TableEmptyState message="No products yet. Add one to get started" />
            ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-canvas border-b border-line">
                  <th className="py-2.5 pl-3 text-left font-medium text-ink-muted">Name</th>
                  <th className="py-2.5 text-left font-medium text-ink-muted">Category</th>
                  <th className="py-2.5 text-left font-medium text-ink-muted">Price</th>
                  <th className="py-2.5 pr-3 text-left font-medium text-ink-muted">Status</th>
                </tr>
              </thead>
              <tbody>
                {vm.products.map((p) => (
                  <tr
                    key={p.id}
                    className={`border-b border-line last:border-0 cursor-pointer transition-colors ${
                      selectedProductId === p.id ? 'bg-brand-light' : 'hover:bg-canvas'
                    }`}
                    onClick={() => handleSelectProduct(p.id)}
                  >
                    <td className="py-2.5 pl-3 font-medium text-ink-primary">{p.name}</td>
                    <td className="py-2.5">{vm.categories.find((c) => c.id === p.categoryId)?.name ?? '-'}</td>
                    <td className="py-2.5">${p.basePrice}</td>
                    <td className="py-2.5 pr-3">
                      <span className={`text-xs px-2 py-1 rounded ${p.isActive ? 'bg-success-light text-success' : 'bg-surface-hover text-ink-muted'}`}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
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
                      <p className="font-medium text-ink-primary">{c.name}</p>
                      {parent ? (
                        <p className="text-xs text-ink-muted">
                          Child of <span className="font-medium text-ink-secondary">{parent.name}</span>
                        </p>
                      ) : (
                        <p className="text-xs text-ink-muted">Top-level</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          c.isActive ? 'bg-success-light text-success' : 'bg-surface-hover text-ink-muted'
                        }`}
                      >
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {isOwner && (
                        <>
                          <button
                            className="text-xs px-3 py-1 rounded-md border border-line text-ink-secondary hover:bg-canvas transition-colors"
                            onClick={() => setCategoryModal({ mode: 'edit', category: c })}
                          >
                            Edit
                          </button>
                          <button
                            className={`text-xs px-3 py-1 rounded ${
                              c.isActive ? 'bg-error/10 text-error' : 'bg-success-light text-success'
                            }`}
                            onClick={() => vm.setCategoryActive(c.id, !c.isActive)}
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
                  <h3 className="font-semibold text-ink-primary">{promo.name}</h3>
                  <p className="text-sm text-ink-muted">
                    {promo.promoType === 'percentage'
                      ? `${promo.config.percentOff}% off`
                      : promo.promoType === 'fixed'
                      ? `$${promo.config.fixedAmountOff} off`
                      : promo.config.bundleRule}
                    {promo.isStackable ? ' · Stackable' : ''}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {promo.applicableItems.length > 0
                      ? `${promo.applicableItems.filter((i) => i.scope === 'product').length} product(s), ${promo.applicableItems.filter((i) => i.scope === 'category').length} category(s)`
                      : 'Applies to everything'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {isOwner && (
                    <button
                      className={`text-xs px-3 py-1 rounded ${promo.isActive ? 'bg-error/10 text-error' : 'bg-success-light text-success'}`}
                      onClick={() => vm.setPromotionActive(promo.id, !promo.isActive)}
                    >
                      {promo.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  )}
                  <span
                    className={`text-xs px-2 py-1 rounded ${
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

      {selectedProduct && (
        <Modal
          title={selectedProduct.name}
          onClose={() => setSelectedProductId(null)}
        >
          <ProductDetail
            product={selectedProduct}
            variants={vm.variants[selectedProduct.id] ?? []}
            attributes={vm.attributes[selectedProduct.id] ?? []}
            onAddVariant={(input) => vm.createVariant(selectedProduct.id, input)}
            onUpdateVariant={(variantId, input) => vm.updateVariant(selectedProduct.id, variantId, input)}
            onAddAttribute={(key, value) => vm.createAttribute(selectedProduct.id, key, value)}
            onUpdateAttribute={(id, key, value) => vm.updateAttribute(selectedProduct.id, id, key, value)}
            onToggleProduct={(isActive) => vm.setProductActive(selectedProduct.id, isActive)}
            onToggleVariant={(variantId, isActive) => vm.setVariantActive(selectedProduct.id, variantId, isActive)}
            onEdit={() => {
              setEditingProductId(selectedProduct.id);
              setSelectedProductId(null);
            }}
          />
        </Modal>
      )}

      {isOwner && categoryModal && (
        <Modal
          title={categoryModal.mode === 'edit' ? `Edit Category — ${categoryModal.category.name}` : 'Add Category'}
          onClose={() => setCategoryModal(null)}
        >
          <CategoryForm
            categories={vm.categories}
            onSubmit={vm.createCategory}
            onUpdate={vm.updateCategory}
            editingCategory={categoryModal.mode === 'edit' ? categoryModal.category : null}
            onCancelEdit={() => setCategoryModal(null)}
          />
        </Modal>
      )}

      {isOwner && (addingProduct || editingProduct) && (
        <Modal
          title={editingProduct ? 'Edit Product' : 'Add Product'}
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
            onUpdate={vm.updateProduct}
            onCancelEdit={() => setEditingProductId(null)}
          />
        </Modal>
      )}

      {promoModalOpen && (
        <Modal title="Add Promotion" onClose={() => setPromoModalOpen(false)}>
          <PromoForm
            products={vm.products}
            categories={vm.categories}
            isOwner={isOwner}
            onSubmit={vm.createPromotion}
          />
        </Modal>
      )}
    </PageLayout>
  );
};

export default Products;