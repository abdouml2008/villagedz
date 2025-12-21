import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '@/hooks/useSupabase';
import { Product } from '@/types/store';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export const ProductShowcaseCarousel = () => {
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
    }
  });

  if (!products || products.length === 0) return null;

  // Duplicate products for infinite scroll effect
  const duplicatedProducts = [...products, ...products];

  return (
    <div className="relative overflow-hidden py-6">
      <motion.div
        className="flex gap-6"
        animate={{ x: [0, -160 * products.length] }}
        transition={{
          x: {
            duration: products.length * 4,
            repeat: Infinity,
            ease: "linear",
          },
        }}
      >
        {duplicatedProducts.map((product, index) => (
          <Link
            key={`${product.id}-${index}`}
            to={`/product/${product.id}`}
            className="flex-shrink-0 group"
          >
            <motion.div
              className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden bg-card border-2 border-border/50 hover:border-primary/60 transition-all duration-300 shadow-md hover:shadow-xl relative"
              whileHover={{ scale: 1.08, y: -8 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <img
                src={product.image_url || '/placeholder.svg'}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
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
            </motion.div>
          </Link>
        ))}
      </motion.div>
    </div>
  );
};
