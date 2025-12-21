import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '@/hooks/useSupabase';
import { StoreLayout } from '@/components/store/StoreLayout';
import { ProductCard } from '@/components/store/ProductCard';
import { CategoryFilters, FilterState } from '@/components/store/CategoryFilters';
import { Product, Category } from '@/types/store';
import { useTranslation } from '@/hooks/useTranslation';
import { useLanguage } from '@/contexts/LanguageContext';

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [filters, setFilters] = useState<FilterState>({ minPrice: null, maxPrice: null, inStock: false, sortBy: 'newest' });

  const { data: category, isLoading: categoryLoading } = useQuery({
    queryKey: ['category', slug],
    queryFn: async () => {
      const client = await getSupabase();
      const { data, error } = await client.from('categories').select('*').eq('slug', slug).maybeSingle();
      if (error) throw error;
      return data as Category | null;
    }
  });

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['products', category?.id],
    enabled: !!category?.id,
    queryFn: async () => {
      const client = await getSupabase();
      const { data, error } = await client.from('products').select('*').eq('category_id', category!.id).eq('is_active', true);
      if (error) throw error;
      return data as Product[];
    }
  });

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    let result = [...products];
    if (filters.minPrice) result = result.filter(p => p.price >= filters.minPrice!);
    if (filters.maxPrice) result = result.filter(p => p.price <= filters.maxPrice!);
    if (filters.inStock) result = result.filter(p => p.stock > 0);
    switch (filters.sortBy) {
      case 'price_asc': result.sort((a, b) => a.price - b.price); break;
      case 'price_desc': result.sort((a, b) => b.price - a.price); break;
      case 'name': result.sort((a, b) => a.name.localeCompare(b.name, 'ar')); break;
      default: result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return result;
  }, [products, filters]);

  return (
    <StoreLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">{category ? (language === 'ar' ? category.name_ar : category.name) : t.common.loading}</h1>
        {!categoryLoading && !productsLoading && products && <CategoryFilters filters={filters} onFiltersChange={setFilters} productCount={filteredProducts.length} />}
        {categoryLoading || productsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">{[...Array(8)].map((_, i) => <div key={i} className="bg-card rounded-xl h-80 animate-pulse" />)}</div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">{filteredProducts.map(product => <ProductCard key={product.id} product={product} />)}</div>
        ) : (
          <div className="text-center py-16 text-muted-foreground"><p className="text-xl">{t.category.noProductsMatch}</p></div>
        )}
      </div>
    </StoreLayout>
  );
}
