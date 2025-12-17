import { useQuery } from '@tanstack/react-query';
import { useSupabase, getSupabase } from '@/hooks/useSupabase';
import { StoreLayout } from '@/components/store/StoreLayout';
import { ProductCard } from '@/components/store/ProductCard';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Product, Category } from '@/types/store';

export default function Home() {
  const { supabase, loading: supabaseLoading } = useSupabase();

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    enabled: !!supabase,
    queryFn: async () => {
      const client = await getSupabase();
      const { data, error } = await client.from('categories').select('*');
      if (error) throw error;
      return data as Category[];
    }
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ['featured-products'],
    enabled: !!supabase,
    queryFn: async () => {
      const client = await getSupabase();
      const { data, error } = await client
        .from('products')
        .select('*')
        .eq('is_active', true)
        .limit(8);
      if (error) throw error;
      return data as Product[];
    }
  });

  if (supabaseLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <StoreLayout>
      {/* Hero Section */}
      <section className="gradient-hero py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            مرحباً بكم في <span className="text-gradient">Village</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            اكتشفوا أحدث الموديلات وأفضل الأسعار مع توصيل لجميع ولايات الجزائر
          </p>
          <Link 
            to="/category/men" 
            className="inline-flex items-center gap-2 gradient-primary text-primary-foreground px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity shadow-glow"
          >
            تسوق الآن
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">الأقسام</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories?.map(category => (
              <Link
                key={category.id}
                to={`/category/${category.slug}`}
                className="bg-card rounded-2xl p-8 text-center shadow-village-sm hover:shadow-village-lg transition-all duration-300 border border-border group"
              >
                <span className="text-5xl mb-4 block group-hover:scale-110 transition-transform">{category.icon}</span>
                <h3 className="text-xl font-semibold">{category.name_ar}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 px-4 bg-secondary/30">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">أحدث المنتجات</h2>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
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
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-xl">لا توجد منتجات حالياً</p>
              <p className="mt-2">قم بإضافة منتجات من لوحة التحكم</p>
              <Link to="/admin" className="mt-4 inline-block text-primary hover:underline">
                الذهاب للوحة التحكم →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚚</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">توصيل لكل الولايات</h3>
              <p className="text-muted-foreground">نوصل لـ 58 ولاية جزائرية</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💳</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">الدفع عند الاستلام</h3>
              <p className="text-muted-foreground">ادفع عند استلام طلبك</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⭐</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">جودة مضمونة</h3>
              <p className="text-muted-foreground">منتجات أصلية بجودة عالية</p>
            </div>
          </div>
        </div>
      </section>
    </StoreLayout>
  );
}
