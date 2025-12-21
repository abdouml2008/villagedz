import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '@/hooks/useSupabase';
import { Product } from '@/types/store';
import { motion } from 'framer-motion';

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
        .limit(10);
      if (error) throw error;
      return data as Product[];
    }
  });

  if (!products || products.length === 0) return null;

  // Duplicate products for infinite scroll effect
  const duplicatedProducts = [...products, ...products];

  return (
    <div className="relative overflow-hidden py-4">
      {/* Gradient masks for seamless scroll */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-10" />
      
      <motion.div
        className="flex gap-4"
        animate={{ x: [0, -50 * products.length] }}
        transition={{
          x: {
            duration: products.length * 3,
            repeat: Infinity,
            ease: "linear",
          },
        }}
      >
        {duplicatedProducts.map((product, index) => (
          <motion.div
            key={`${product.id}-${index}`}
            className="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden border-2 border-border/50 hover:border-primary/50 transition-all duration-300 group cursor-pointer"
            whileHover={{ scale: 1.1, y: -5 }}
          >
            <img
              src={product.image_url || '/placeholder.svg'}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};
