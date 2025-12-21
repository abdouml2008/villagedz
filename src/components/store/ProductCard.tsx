import { Link } from 'react-router-dom';
import { Product } from '@/types/store';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Sparkles, Percent, AlertTriangle } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface ProductCardProps {
  product: Product;
  showBadges?: boolean;
}

export function ProductCard({ product, showBadges = true }: ProductCardProps) {
  const { addItem } = useCart();
  const { t } = useTranslation();

  // Check if product is new (added within last 7 days)
  const isNew = new Date(product.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  // Check if product has discount
  const hasDiscount = product.discount_percentage && product.discount_percentage > 0;
  
  // Check if out of stock
  const isOutOfStock = product.stock <= 0;

  // Calculate discounted price
  const discountedPrice = hasDiscount 
    ? product.price * (1 - (product.discount_percentage! / 100))
    : product.price;

  return (
    <div className="group bg-card rounded-xl overflow-hidden shadow-village-sm hover:shadow-village-lg transition-all duration-300 border border-border relative">
      {/* Badges */}
      {showBadges && (
        <div className="absolute top-3 start-3 z-10 flex flex-col gap-2">
          {isNew && !hasDiscount && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-accent text-accent-foreground shadow-sm">
              <Sparkles className="w-3 h-3" />
              {t.home.newBadge}
            </span>
          )}
          {hasDiscount && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-destructive text-destructive-foreground shadow-sm">
              <Percent className="w-3 h-3" />
              {product.discount_percentage}%-
            </span>
          )}
          {isOutOfStock && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground shadow-sm">
              <AlertTriangle className="w-3 h-3" />
              {t.common.outOfStock}
            </span>
          )}
        </div>
      )}

      <Link to={`/product/${product.id}`} className="block">
        <div className="aspect-square overflow-hidden bg-muted relative">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${isOutOfStock ? 'opacity-60' : ''}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              {t.product.noImageAvailable}
            </div>
          )}
        </div>
      </Link>
      <div className="p-4">
        <Link to={`/product/${product.id}`}>
          <h3 className="font-semibold text-lg mb-2 hover:text-primary transition-colors line-clamp-1">
            {product.name}
          </h3>
        </Link>
        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{product.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            {hasDiscount ? (
              <>
                <span className="text-sm text-muted-foreground line-through">
                  {product.price} {t.common.currency}
                </span>
                <span className="text-xl font-bold text-destructive">
                  {Math.round(discountedPrice)} {t.common.currency}
                </span>
              </>
            ) : (
              <span className="text-xl font-bold text-primary">
                {product.price} {t.common.currency}
              </span>
            )}
          </div>
          <Button 
            size="sm" 
            onClick={() => addItem(product)}
            disabled={isOutOfStock}
            className="gradient-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            <ShoppingCart className="w-4 h-4 ml-2" />
            {t.common.add}
          </Button>
        </div>
      </div>
    </div>
  );
}
