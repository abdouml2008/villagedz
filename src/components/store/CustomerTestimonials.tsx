import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '@/hooks/useSupabase';
import { useTranslation } from '@/hooks/useTranslation';
import { Star, Quote } from 'lucide-react';
import { motion } from 'framer-motion';

interface Review {
  id: string;
  customer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export function CustomerTestimonials() {
  const { t } = useTranslation();

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['top-reviews'],
    queryFn: async () => {
      const client = await getSupabase();
      const { data, error } = await client
        .from('reviews')
        .select('id, customer_name, rating, comment, created_at')
        .eq('is_approved', true)
        .gte('rating', 4)
        .order('created_at', { ascending: false })
        .limit(6);
      if (error) throw error;
      return data as Review[];
    }
  });

  if (isLoading || !reviews || reviews.length === 0) return null;

  return (
    <section className="py-20 px-4 relative bg-secondary/30">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.home.customerReviews}</h2>
          <p className="text-muted-foreground">{t.home.whatCustomersSay}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-card rounded-2xl p-6 border border-border shadow-village-sm hover:shadow-village-md transition-shadow relative"
            >
              {/* Quote Icon */}
              <Quote className="absolute top-4 end-4 w-8 h-8 text-primary/20" />
              
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted'}`}
                  />
                ))}
              </div>

              {/* Comment */}
              <p className="text-foreground mb-4 line-clamp-4 min-h-[4.5rem]">
                "{review.comment}"
              </p>

              {/* Customer Name */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-semibold">
                  {review.customer_name.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium">{review.customer_name}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
