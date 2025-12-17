import { Link } from 'react-router-dom';
import { Product } from '@/types/store';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();

  return (
    <div className="group bg-card rounded-xl overflow-hidden shadow-village-sm hover:shadow-village-lg transition-all duration-300 border border-border">
      <Link to={`/product/${product.id}`} className="block">
        <div className="aspect-square overflow-hidden bg-muted">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              لا توجد صورة
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
          <span className="text-xl font-bold text-primary">{product.price} دج</span>
          <Button 
            size="sm" 
            onClick={() => addItem(product)}
            className="gradient-primary text-primary-foreground hover:opacity-90"
          >
            <ShoppingCart className="w-4 h-4 ml-2" />
            أضف
          </Button>
        </div>
      </div>
    </div>
  );
}
