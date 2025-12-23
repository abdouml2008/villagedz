import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '@/hooks/useSupabase';
import { Product } from '@/types/store';
import { Link } from 'react-router-dom';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { queryConfig } from '@/lib/queryConfig';
import { useState } from 'react';

export const ProductShowcaseCarousel = () => {
  const [isPaused, setIsPaused] = useState(false);
  
  const { data: products } = useQuery({
    queryKey: ['showcase-products'],
    queryFn: async () => {
      const client = await getSupabase();
      const { data, error } = await client
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(12);
      if (error) throw error;
      return data as Product[];
    },
    ...queryConfig.dynamic,
  });

  if (!products || products.length === 0) return null;

  // Triple the products for seamless infinite loop
  const tripleProducts = [...products, ...products, ...products];

  return (
    <div className="relative overflow-hidden py-6">
      {/* Gradient fade on edges */}
      <div className="absolute left-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      
      <div 
        className="flex gap-4 md:gap-6"
        style={{
          animation: 'scroll-rtl 30s linear infinite',
          animationPlayState: isPaused ? 'paused' : 'running',
          width: 'max-content',
        }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {tripleProducts.map((product, index) => (
          <Link
            key={`${product.id}-${index}`}
            to={`/product/${product.id}`}
            className="flex-shrink-0 group"
          >
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden bg-card border-2 border-border/50 hover:border-primary/60 transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 hover:-translate-y-2 relative">
              <OptimizedImage
                src={product.image_url}
                alt={product.name}
                className="group-hover:scale-110 transition-transform duration-500"
                aspectRatio="auto"
              />
              
              {/* Hover overlay with product info */}
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                <p className="text-xs font-medium text-foreground truncate">{product.name}</p>
                <p className="text-xs text-primary font-bold">{product.price} د.ج</p>
              </div>
              
              {/* Discount badge */}
              {product.discount_percentage && product.discount_percentage > 0 && (
                <div className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                  -{product.discount_percentage}%
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
