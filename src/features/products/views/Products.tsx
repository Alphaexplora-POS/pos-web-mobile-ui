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
  const [activeTab, setActiveTab] = useState<'products' | 'promotions'>('products');

  const selectedProduct = vm.products.find((p) => p.id === selectedProductId);

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

            {selectedProduct && (
              <ProductDetail
                product={selectedProduct}
                variants={vm.variants[selectedProduct.id] ?? []}
                attributes={vm.attributes[selectedProduct.id] ?? []}
                onAddVariant={(size, color, sku) =>
                  vm.createVariant(selectedProduct.id, { size, color, sku })
                }
                onAddAttribute={(name, value) =>
                  vm.createAttribute(selectedProduct.id, name, value)
                }
                onToggleProduct={(isActive) => vm.setProductActive(selectedProduct.id, isActive)}
                onToggleVariant={(variantId, isActive) => vm.setVariantActive(variantId, isActive)}
              />
            )}
          </div>

          <div className="space-y-6">
            <CategoryForm categories={vm.categories} onSubmit={vm.createCategory} />
            <ProductForm categories={vm.categories} isOwner={isOwner} onSubmit={vm.createProduct} />
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
                    {promo.type === 'percentage'
                      ? `${promo.percentOff}% off`
                      : promo.type === 'fixed'
                      ? `$${promo.fixedAmountOff} off`
                      : promo.bundleRule}
                    {promo.combinable ? ' · Combinable' : ''}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    promo.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : promo.status === 'scheduled'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {promo.status}
                </span>
              </div>
            ))}
          </div>
          <div>
            <PromoForm
              products={vm.products}
              categories={vm.categories}
              onSubmit={vm.createPromotion}
            />
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export default Products;
