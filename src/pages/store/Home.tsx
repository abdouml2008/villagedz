import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '@/hooks/useSupabase';
import { StoreLayout } from '@/components/store/StoreLayout';
import { ProductCard } from '@/components/store/ProductCard';
import { PromoBanner } from '@/components/store/PromoBanner';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Product, Category } from '@/types/store';

export default function Home() {
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const client = await getSupabase();
      const { data, error } = await client.from('categories').select('*');
      if (error) throw error;
      return data as Category[];
    }
  });

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['featured-products'],
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

  const { data: totalProducts } = useQuery({
    queryKey: ['total-products'],
    queryFn: async () => {
      const client = await getSupabase();
      const { count, error } = await client
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
      if (error) throw error;
      return count || 0;
    }
  });

  const isLoading = categoriesLoading && productsLoading;

  return (
    <StoreLayout>
      {/* Promo Banner */}
      <PromoBanner />
      
      {/* Hero Section */}
      <section className="relative py-24 px-4 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        
        {/* Decorative Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        
        <div className="container mx-auto text-center relative">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-slide-up">
            مرحباً بكم في <span className="text-gradient">Village</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
            اكتشفوا أحدث الموديلات وأفضل الأسعار مع توصيل لجميع ولايات الجزائر
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Link 
              to="/category/men" 
              className="inline-flex items-center justify-center gap-2 gradient-primary text-primary-foreground px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition-all shadow-glow hover:shadow-lg hover:-translate-y-0.5"
            >
              تسوق الآن
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Link 
              to="/category/women" 
              className="inline-flex items-center justify-center gap-2 bg-card text-foreground px-8 py-4 rounded-xl font-semibold text-lg border border-border hover:border-primary transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              تصفح التشكيلة
            </Link>
          </div>
          
          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mt-16 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="text-center">
              <span className="text-3xl md:text-4xl font-bold text-gradient">69</span>
              <p className="text-sm text-muted-foreground mt-1">ولاية توصيل</p>
            </div>
            <div className="w-px h-12 bg-border hidden sm:block" />
            <div className="text-center">
              <span className="text-3xl md:text-4xl font-bold text-gradient">{totalProducts || 0}</span>
              <p className="text-sm text-muted-foreground mt-1">منتج متاح</p>
            </div>
            <div className="w-px h-12 bg-border hidden sm:block" />
            <div className="text-center">
              <span className="text-3xl md:text-4xl font-bold text-gradient">24/7</span>
              <p className="text-sm text-muted-foreground mt-1">دعم العملاء</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 px-4 relative">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">تسوق حسب القسم</h2>
            <p className="text-muted-foreground">اختر من بين تشكيلتنا المتنوعة</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {categoriesLoading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="bg-card rounded-2xl p-8 h-44 animate-pulse" />
              ))
            ) : categories && categories.length > 0 ? (
              categories.map((category, index) => (
                <Link
                  key={category.id}
                  to={`/category/${category.slug}`}
                  className="group relative bg-card rounded-2xl p-6 md:p-8 text-center shadow-village-sm hover:shadow-village-lg transition-all duration-300 border border-border overflow-hidden animate-scale-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Hover Background */}
                  <div className="absolute inset-0 gradient-primary opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                  
                  <span className="text-5xl md:text-6xl mb-4 block group-hover:scale-110 transition-transform duration-300">{category.icon}</span>
                  <h3 className="text-lg md:text-xl font-semibold group-hover:text-primary transition-colors">{category.name_ar}</h3>
                </Link>
              ))
            ) : (
              <div className="col-span-4 text-center py-8 text-muted-foreground">
                لا توجد أقسام
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 px-4 relative bg-secondary/30">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        
        <div className="container mx-auto relative">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">أحدث المنتجات</h2>
            <p className="text-muted-foreground">اكتشف آخر ما وصلنا</p>
          </div>
          {productsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-card rounded-xl h-80 animate-pulse" />
              ))}
            </div>
          ) : products && products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground bg-card rounded-2xl border border-border">
              <p className="text-xl mb-2">لا توجد منتجات حالياً</p>
              <p>قم بإضافة منتجات من لوحة التحكم</p>
              <Link to="/admin" className="mt-4 inline-block text-primary hover:underline">
                الذهاب للوحة التحكم →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 relative">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="text-center p-8 bg-card rounded-2xl border border-border shadow-village-sm hover:shadow-village-md transition-shadow group">
              <div className="w-20 h-20 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <span className="text-3xl">🚚</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">توصيل لكل الولايات</h3>
              <p className="text-muted-foreground text-sm">نوصل لـ 58 ولاية جزائرية بأسعار مناسبة</p>
            </div>
            <div className="text-center p-8 bg-card rounded-2xl border border-border shadow-village-sm hover:shadow-village-md transition-shadow group">
              <div className="w-20 h-20 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <span className="text-3xl">💳</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">الدفع عند الاستلام</h3>
              <p className="text-muted-foreground text-sm">ادفع عند استلام طلبك براحة وأمان</p>
            </div>
            <div className="text-center p-8 bg-card rounded-2xl border border-border shadow-village-sm hover:shadow-village-md transition-shadow group">
              <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <span className="text-3xl">⭐</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">جودة مضمونة</h3>
              <p className="text-muted-foreground text-sm">منتجات أصلية بجودة عالية مع ضمان</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="relative overflow-hidden rounded-3xl gradient-primary p-8 md:p-12 text-center">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative">
              <h2 className="text-2xl md:text-4xl font-bold text-primary-foreground mb-4">
                هل لديك كوبون خصم؟
              </h2>
              <p className="text-primary-foreground/80 mb-6 max-w-xl mx-auto">
                استخدم كود الخصم عند إتمام الطلب واحصل على تخفيضات حصرية
              </p>
              <Link 
                to="/cart"
                className="inline-flex items-center gap-2 bg-white text-primary px-8 py-3 rounded-xl font-semibold hover:bg-white/90 transition-colors"
              >
                تسوق الآن
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </StoreLayout>
  );
}
