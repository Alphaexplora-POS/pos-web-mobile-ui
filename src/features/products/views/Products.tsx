import { useState } from 'react';
import { useProductsViewModel } from '../viewModels/useProductsViewModel';
import CategoryForm from './CategoryForm';
import ProductForm from './ProductForm';
import ProductDetail from './ProductDetail';
import PromoForm from './PromoForm';
import PageLayout from '../../../shared/components/PageLayout';
import LoadingState from '../../../shared/components/LoadingState';
import ErrorState from '../../../shared/components/ErrorState';
import { useRole } from '../../../shared/hooks/useRole';

const Products: React.FC = () => {
  const vm = useProductsViewModel();
  const { isOwner } = useRole();
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'products' | 'promotions'>('products');

  const selectedProduct = vm.products.find((p) => p.id === selectedProductId);
  const editingProduct = vm.products.find((p) => p.id === editingProductId) ?? null;

  const handleSelectProduct = (id: string) => {
    setSelectedProductId(id);
    vm.loadProductDetails(id);
  };

  if (vm.isLoading) return <LoadingState />;
  if (vm.error) return <ErrorState message={vm.error} />;

  return (
    <PageLayout title="Product Management">
      <div className="flex gap-4 mb-6">
        <button
          className={`px-4 py-2 rounded ${activeTab === 'products' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border'}`}
          onClick={() => setActiveTab('products')}
        >
          Products & Categories
        </button>
        <button
          className={`px-4 py-2 rounded ${activeTab === 'promotions' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border'}`}
          onClick={() => setActiveTab('promotions')}
        >
          Promotions
        </button>
      </div>

      {activeTab === 'products' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Products</h2>
              <div className="space-y-2">
                {vm.products.map((p) => (
                  <div
                    key={p.id}
                    className={`p-3 rounded-lg border cursor-pointer ${selectedProductId === p.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                    onClick={() => handleSelectProduct(p.id)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-800">{p.name}</span>
                      <span className={`text-xs px-2 py-1 rounded ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {vm.categories.find((c) => c.id === p.categoryId)?.name ?? '-'} · ${p.basePrice}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Categories</h2>
              {vm.categories.length === 0 ? (
                <p className="text-sm text-gray-400">No categories yet. Add one on the right.</p>
              ) : (
                <div className="space-y-2">
                  {vm.categories.map((c) => {
                    const parent = vm.categories.find((p) => p.id === c.parentId);
                    return (
                      <div key={c.id} className="flex items-center justify-between border rounded p-3">
                        <div>
                          <p className="font-medium text-gray-800">{c.name}</p>
                          {parent && (
                            <p className="text-xs text-gray-500">
                              Child of <span className="font-medium text-gray-700">{parent.name}</span>
                            </p>
                          )}
                        </div>
                        {!parent && <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-500">Top-level</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {selectedProduct && (
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
                onEdit={() => setEditingProductId(selectedProduct.id)}
              />
            )}
          </div>

          <div className="space-y-6">
            <CategoryForm categories={vm.categories} onSubmit={vm.createCategory} />
            <ProductForm
              categories={vm.categories}
              isOwner={isOwner}
              onSubmit={async (data) => {
                await vm.createProduct(data);
              }}
              editingProduct={editingProduct}
              onUpdate={vm.updateProduct}
              onCancelEdit={() => setEditingProductId(null)}
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {vm.promotions.map((promo) => (
              <div key={promo.id} className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{promo.name}</h3>
                  <p className="text-sm text-gray-500">
                    {promo.promoType === 'percentage'
                      ? `${promo.config.percentOff}% off`
                      : promo.promoType === 'fixed'
                      ? `$${promo.config.fixedAmountOff} off`
                      : promo.config.bundleRule}
                    {promo.isStackable ? ' · Stackable' : ''}
                  </p>
                  <p className="text-xs text-gray-400">
                    {promo.applicableItems.length > 0
                      ? `${promo.applicableItems.filter((i) => i.scope === 'product').length} product(s), ${promo.applicableItems.filter((i) => i.scope === 'category').length} category(s)`
                      : 'Applies to everything'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {isOwner && (
                    <button
                      className={`text-xs px-3 py-1 rounded ${promo.isActive ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
                      onClick={() => vm.setPromotionActive(promo.id, !promo.isActive)}
                    >
                      {promo.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  )}
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      promo.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {promo.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div>
            <PromoForm products={vm.products} categories={vm.categories} onSubmit={vm.createPromotion} />
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export default Products;