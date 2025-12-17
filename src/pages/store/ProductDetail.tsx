import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StoreLayout } from '@/components/store/StoreLayout';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { ShoppingCart, Plus, Minus } from 'lucide-react';
import { Product } from '@/types/store';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string>();
  const [selectedColor, setSelectedColor] = useState<string>();

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as Product | null;
    }
  });

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
            <p className="text-3xl font-bold text-primary">{product.price} دج</p>
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
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 rounded-lg border border-border hover:bg-secondary">
                  <Minus className="w-5 h-5" />
                </button>
                <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="p-2 rounded-lg border border-border hover:bg-secondary">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full gradient-primary text-primary-foreground text-lg py-6 hover:opacity-90"
              onClick={() => addItem(product, quantity, selectedSize, selectedColor)}
            >
              <ShoppingCart className="w-5 h-5 ml-2" />
              أضف إلى السلة
            </Button>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
