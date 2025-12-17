import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useSupabase, getSupabase } from '@/hooks/useSupabase';
import { StoreLayout } from '@/components/store/StoreLayout';
import { ProductCard } from '@/components/store/ProductCard';
import { Product, Category } from '@/types/store';

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { supabase, loading: supabaseLoading } = useSupabase();

  const { data: category } = useQuery({
    queryKey: ['category', slug],
    enabled: !!supabase,
    queryFn: async () => {
      const client = await getSupabase();
      const { data, error } = await client
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (error) throw error;
      return data as Category | null;
    }
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', category?.id],
    enabled: !!category?.id && !!supabase,
    queryFn: async () => {
      const client = await getSupabase();
      const { data, error } = await client
        .from('products')
        .select('*')
        .eq('category_id', category!.id)
        .eq('is_active', true);
      if (error) throw error;
      return data as Product[];
    }
  });

  if (supabaseLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <StoreLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">{category?.name_ar || 'جاري التحميل...'}</h1>
        
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-card rounded-xl h-80 animate-pulse" />
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-xl">لا توجد منتجات في هذا القسم</p>
          </div>
        )}
      </div>
    </StoreLayout>
  );
}
