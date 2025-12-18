import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '@/hooks/useSupabase';
import { StoreLayout } from '@/components/store/StoreLayout';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Zap } from 'lucide-react';
import { Product } from '@/types/store';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedSize, setSelectedSize] = useState<string>();
  const [selectedColor, setSelectedColor] = useState<string>();

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const client = await getSupabase();
      const { data, error } = await client
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as Product | null;
    }
  });

  // Set initial quantity to min_quantity when product loads
  useEffect(() => {
    if (product?.min_quantity && product.min_quantity > 1) {
      setQuantity(product.min_quantity);
    }
  }, [product?.min_quantity]);

  if (isLoading) {
    return (
      <StoreLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-card rounded-xl aspect-square" />
            <div className="space-y-4">
              <div className="bg-card h-10 rounded w-3/4" />
              <div className="bg-card h-6 rounded w-1/4" />
              <div className="bg-card h-24 rounded" />
            </div>
          </div>
        </div>
      </StoreLayout>
    );
  }

  if (!product) {
    return (
      <StoreLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl">المنتج غير موجود</h1>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-card rounded-2xl overflow-hidden shadow-village-md">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-full aspect-square object-cover" />
            ) : (
              <div className="w-full aspect-square flex items-center justify-center bg-muted text-muted-foreground">
                لا توجد صورة
              </div>
            )}
          </div>

          <div className="space-y-6">
            <h1 className="text-4xl font-bold">{product.name}</h1>
            <div>
              <p className="text-3xl font-bold text-primary">{product.price} دج</p>
              {product.discount_quantity && product.discount_percentage && (
                <p className="text-green-600 text-sm mt-1 flex items-center gap-1">
                  <span className="bg-green-500/10 px-2 py-0.5 rounded-full">
                    اشترِ {product.discount_quantity} أو أكثر واحصل على خصم {product.discount_percentage}%
                  </span>
                </p>
              )}
            </div>
            
            {/* Stock availability */}
            <div className="flex items-center gap-2">
              {product.stock > 0 ? (
                <span className="bg-green-500/10 text-green-600 px-3 py-1 rounded-full text-sm font-medium">
                  متوفر ({product.stock} قطعة)
                </span>
              ) : (
                <span className="bg-red-500/10 text-red-600 px-3 py-1 rounded-full text-sm font-medium">
                  غير متوفر
                </span>
              )}
            </div>
            
            <p className="text-muted-foreground text-lg">{product.description}</p>

            {product.sizes && product.sizes.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">المقاس</h3>
                <div className="flex gap-2 flex-wrap">
                  {product.sizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        selectedSize === size ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.colors && product.colors.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">اللون</h3>
                <div className="flex gap-2 flex-wrap">
                  {product.colors.map(color => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        selectedColor === color ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-2">الكمية</h3>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setQuantity(Math.max(product.min_quantity || 1, quantity - 1))} 
                  className="p-2 rounded-lg border border-border hover:bg-secondary disabled:opacity-50"
                  disabled={quantity <= (product.min_quantity || 1) || product.stock === 0}
                >
                  <Minus className="w-5 h-5" />
                </button>
                <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
                <button 
                  onClick={() => {
                    const maxAllowed = Math.min(product.stock, product.max_quantity || Infinity);
                    setQuantity(Math.min(maxAllowed, quantity + 1));
                  }} 
                  className="p-2 rounded-lg border border-border hover:bg-secondary disabled:opacity-50"
                  disabled={quantity >= product.stock || (product.max_quantity ? quantity >= product.max_quantity : false)}
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {product.min_quantity && product.min_quantity > 1 && `الحد الأدنى: ${product.min_quantity}`}
                {product.min_quantity && product.min_quantity > 1 && (product.max_quantity || product.stock > 0) && ' | '}
                {product.max_quantity && `الحد الأقصى: ${Math.min(product.max_quantity, product.stock)}`}
                {!product.max_quantity && product.stock > 0 && `المتوفر: ${product.stock}`}
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                size="lg"
                variant="outline"
                className="flex-1 text-lg py-6"
                onClick={() => addItem(product, quantity, selectedSize, selectedColor)}
                disabled={product.stock === 0 || quantity > product.stock}
              >
                <ShoppingCart className="w-5 h-5 ml-2" />
                {product.stock === 0 ? 'غير متوفر' : 'أضف للسلة'}
              </Button>
              <Button
                size="lg"
                className="flex-1 gradient-primary text-primary-foreground text-lg py-6 hover:opacity-90 disabled:opacity-50"
                disabled={product.stock === 0 || quantity > product.stock}
                onClick={() => {
                  navigate('/checkout', {
                    state: {
                      directItem: {
                        product,
                        quantity,
                        size: selectedSize,
                        color: selectedColor
                      }
                    }
                  });
                }}
              >
                <Zap className="w-5 h-5 ml-2" />
                {product.stock === 0 ? 'غير متوفر' : 'اطلب الآن'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}