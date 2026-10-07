import type { Product, ProductAttribute } from '../models/productTypes';
import { useRole } from '../../../shared/hooks/useRole';

interface ProductDetailProps {
  product: Product;
  attributes: ProductAttribute[];
  onToggleProduct: (isActive: boolean) => void;
  onEdit: () => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ product, attributes, onToggleProduct, onEdit }) => {
  const { isOwner } = useRole();

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-line p-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2 py-1 rounded ${product.isActive ? 'bg-success-light text-success' : 'bg-surface-hover text-ink-muted'}`}>
              {product.isActive ? 'Active' : 'Inactive'}
            </span>
            <span className="text-sm font-medium text-ink-primary">Base Price: ₱{product.basePrice}</span>
          </div>
          <div className="flex items-center gap-2">
            {isOwner && (
              <button
                className="text-sm px-3 py-1 rounded-md border border-line text-ink-secondary hover:bg-canvas transition-colors"
                onClick={onEdit}
              >
                Edit
              </button>
            )}
            <button
              className={`text-sm px-3 py-1 rounded-md ${product.isActive ? 'bg-error text-white hover:opacity-90' : 'bg-success text-white hover:opacity-90'}`}
              onClick={() => onToggleProduct(!product.isActive)}
            >
              {product.isActive ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        </div>
        <p className="text-sm text-ink-secondary">{product.description}</p>
      </div>
      {attributes.length > 0 && (
        <div className="rounded-lg border border-line p-4">
          <h3 className="text-sm font-semibold text-ink-primary mb-2">Custom Attributes</h3>
          <div className="flex flex-wrap gap-2">
            {attributes.map((a) => (
              <span key={a.id} className="text-xs bg-surface-hover rounded px-2 py-1">
                {a.attributeKey}: {a.attributeValue}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;