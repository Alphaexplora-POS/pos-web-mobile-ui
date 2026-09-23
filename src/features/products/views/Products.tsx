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
import { useRole } from '../../../shared/hooks/useRole';

type CategoryModalState = { mode: 'create' } | { mode: 'edit'; category: Category } | null;

const Products: React.FC = () => {
  const vm = useProductsViewModel();
  const { isOwner } = useRole();
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [categoryModal, setCategoryModal] = useState<CategoryModalState>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [addingProduct, setAddingProduct] = useState(false);
  const [promoModalOpen, setPromoModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'promotions'>('products');

  const selectedProduct = vm.products.find((p) => p.id === selectedProductId);
  const editingProduct = vm.products.find((p) => p.id === editingProductId) ?? null;

  const handleSelectProduct = (id: string) => {
    setSelectedProductId(id);
    vm.loadProductDetails(id);
  };

  if (vm.isLoading) return <ProductsSkeleton />;
  if (vm.error) return <ErrorState message={vm.error} />;

  return (
    <PageLayout title="Product Management">
      <div className="flex gap-4 mb-6">
        <button
          className={`px-4 py-2 rounded ${activeTab === 'products' ? 'bg-brand text-white' : 'bg-white text-ink-secondary border'}`}
          onClick={() => setActiveTab('products')}
        >
          Products & Categories
        </button>
        <button
          className={`px-4 py-2 rounded ${activeTab === 'promotions' ? 'bg-brand text-white' : 'bg-white text-ink-secondary border'}`}
          onClick={() => setActiveTab('promotions')}
        >
          Promotions
        </button>
      </div>

      {activeTab === 'products' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-ink-primary">Products</h2>
                {isOwner && (
                  <button
                    className="bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark"
                    onClick={() => setAddingProduct(true)}
                  >
                    Add Product
                  </button>
                )}
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-ink-muted border-b">
                    <th className="py-2">Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {vm.products.map((p) => (
                    <tr
                      key={p.id}
                      className={`border-b cursor-pointer ${
                        selectedProductId === p.id ? 'bg-brand-light' : ''
                      }`}
                      onClick={() => handleSelectProduct(p.id)}
                    >
                      <td className="py-2 font-medium text-ink-primary">{p.name}</td>
                      <td>{vm.categories.find((c) => c.id === p.categoryId)?.name ?? '-'}</td>
                      <td>${p.basePrice}</td>
                      <td>
                        <span className={`text-xs px-2 py-1 rounded ${p.isActive ? 'bg-success-light text-success' : 'bg-surface-hover text-ink-muted'}`}>
                          {p.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-ink-primary">Categories</h2>
                {isOwner && (
                  <button
                    className="bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark"
                    onClick={() => setCategoryModal({ mode: 'create' })}
                  >
                    Add Category
                  </button>
                )}
              </div>
              {vm.categories.length === 0 ? (
                <p className="text-sm text-ink-muted">No categories yet.</p>
              ) : (
                <div className="space-y-2">
                  {vm.categories.map((c) => {
                    const parent = vm.categories.find((p) => p.id === c.parentId);
                    return (
                      <div key={c.id} className="flex items-center justify-between border rounded p-3">
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
                                className="text-xs px-3 py-1 rounded border border-line text-ink-secondary hover:bg-canvas"
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
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-ink-primary">Promotions</h2>
              <button
                className="bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark"
                onClick={() => setPromoModalOpen(true)}
              >
                Add Promotion
              </button>
            </div>
            <div className="space-y-3">
              {vm.promotions.map((promo) => (
                <div key={promo.id} className="border rounded-lg p-4 flex items-center justify-between">
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
          </div>
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
            branches={vm.branches}
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