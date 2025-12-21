import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '@/hooks/useSupabase';
import { StoreLayout } from '@/components/store/StoreLayout';
import { ProductCard } from '@/components/store/ProductCard';
import { PromoBanner } from '@/components/store/PromoBanner';
import { CustomerTestimonials } from '@/components/store/CustomerTestimonials';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Flame, Sparkles, Package, Loader2 } from 'lucide-react';
import { Product, Category } from '@/types/store';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

const PRODUCTS_PER_PAGE = 8;

export default function Home() {
  const { language, isRTL } = useLanguage();
  const { t } = useTranslation();
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;
  const [visibleProducts, setVisibleProducts] = useState(PRODUCTS_PER_PAGE);

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const client = await getSupabase();
      const { data, error } = await client.from('categories').select('*');
      if (error) throw error;
      return data as Category[];
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // Featured/Latest Products (8 items)
  const { data: featuredProducts, isLoading: featuredLoading } = useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const client = await getSupabase();
      const { data, error } = await client
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(8);
      if (error) throw error;
      return data as Product[];
    }
  });

  // Discounted Products (Special Offers)
  const { data: discountedProducts } = useQuery({
    queryKey: ['discounted-products'],
    queryFn: async () => {
      const client = await getSupabase();
      const { data, error } = await client
        .from('products')
        .select('*')
        .eq('is_active', true)
        .gt('discount_percentage', 0)
        .order('discount_percentage', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as Product[];
    }
  });

  // All Products with pagination
  const { data: allProducts, isLoading: allProductsLoading } = useQuery({
    queryKey: ['all-products'],
    queryFn: async () => {
      const client = await getSupabase();
      const { data, error } = await client
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
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

  const handleLoadMore = () => {
    setVisibleProducts(prev => prev + PRODUCTS_PER_PAGE);
  };

  const displayedProducts = allProducts?.slice(0, visibleProducts) || [];
  const hasMoreProducts = allProducts && visibleProducts < allProducts.length;

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
            {t.home.welcome} <span className="text-gradient">Village</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
            {t.home.heroDescription}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Link 
              to="/category/men" 
              className="inline-flex items-center justify-center gap-2 gradient-primary text-primary-foreground px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition-all shadow-glow hover:shadow-lg hover:-translate-y-0.5"
            >
              {t.home.shopNow}
              <ArrowIcon className="w-5 h-5" />
            </Link>
            <Link 
              to="/category/women" 
              className="inline-flex items-center justify-center gap-2 bg-card text-foreground px-8 py-4 rounded-xl font-semibold text-lg border border-border hover:border-primary transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              {t.home.browseCollection}
            </Link>
          </div>
          
          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mt-16 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="text-center">
              <span className="text-3xl md:text-4xl font-bold text-gradient">69</span>
              <p className="text-sm text-muted-foreground mt-1">{t.home.deliveryStates}</p>
            </div>
            <div className="w-px h-12 bg-border hidden sm:block" />
            <div className="text-center">
              <span className="text-3xl md:text-4xl font-bold text-gradient">{totalProducts || 0}</span>
              <p className="text-sm text-muted-foreground mt-1">{t.home.productsAvailable}</p>
            </div>
            <div className="w-px h-12 bg-border hidden sm:block" />
            <div className="text-center">
              <span className="text-3xl md:text-4xl font-bold text-gradient">24/7</span>
              <p className="text-sm text-muted-foreground mt-1">{t.home.customerSupport}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 px-4 relative">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.home.shopByCategory}</h2>
            <p className="text-muted-foreground">{t.home.chooseFromCollection}</p>
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
                  <h3 className="text-lg md:text-xl font-semibold group-hover:text-primary transition-colors">
                    {language === 'ar' ? category.name_ar : category.name}
                  </h3>
                </Link>
              ))
            ) : (
              <div className="col-span-4 text-center py-8 text-muted-foreground">
                {t.home.noCategories}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Special Offers Section */}
      {discountedProducts && discountedProducts.length > 0 && (
        <section className="py-20 px-4 relative bg-destructive/5">
          <div className="container mx-auto">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Flame className="w-8 h-8 text-destructive animate-pulse" />
              <h2 className="text-3xl md:text-4xl font-bold">{t.home.specialOffers}</h2>
              <Flame className="w-8 h-8 text-destructive animate-pulse" />
            </div>
            <p className="text-center text-muted-foreground mb-12">{t.home.discountedProducts}</p>
            
            <Swiper
              modules={[Autoplay, Navigation]}
              spaceBetween={16}
              slidesPerView={1.2}
              centeredSlides={false}
              navigation
              autoplay={{ delay: 3000, disableOnInteraction: false }}
              breakpoints={{
                640: { slidesPerView: 2.2 },
                768: { slidesPerView: 3.2 },
                1024: { slidesPerView: 4.2 },
              }}
              className="pb-4"
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              {discountedProducts.map(product => (
                <SwiperSlide key={product.id}>
                  <ProductCard product={product} />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="py-20 px-4 relative bg-secondary/30">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        
        <div className="container mx-auto relative">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-7 h-7 text-accent" />
            <h2 className="text-3xl md:text-4xl font-bold">{t.home.latestProducts}</h2>
          </div>
          <p className="text-center text-muted-foreground mb-12">{t.home.discoverLatest}</p>
          
          {featuredLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-card rounded-xl h-80 animate-pulse" />
              ))}
            </div>
          ) : featuredProducts && featuredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {featuredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground bg-card rounded-2xl border border-border">
              <p className="text-xl mb-2">{t.home.noProducts}</p>
              <p>{t.home.addFromDashboard}</p>
              <Link to="/admin" className="mt-4 inline-block text-primary hover:underline">
                {t.home.goToDashboard}
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Customer Testimonials */}
      <CustomerTestimonials />

      {/* All Products Section */}
      <section className="py-20 px-4 relative">
        <div className="container mx-auto">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Package className="w-7 h-7 text-primary" />
            <h2 className="text-3xl md:text-4xl font-bold">{t.home.allProducts}</h2>
          </div>
          <p className="text-center text-muted-foreground mb-12">{t.home.exploreAll}</p>
          
          {allProductsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-card rounded-xl h-80 animate-pulse" />
              ))}
            </div>
          ) : displayedProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {displayedProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              
              {/* Load More Button */}
              {hasMoreProducts && (
                <div className="flex justify-center mt-12">
                  <Button
                    onClick={handleLoadMore}
                    variant="outline"
                    size="lg"
                    className="px-8 gap-2"
                  >
                    <Loader2 className="w-4 h-4 hidden" />
                    {t.common.loadMore}
                    <span className="text-muted-foreground text-sm">
                      ({visibleProducts}/{allProducts?.length})
                    </span>
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground bg-card rounded-2xl border border-border">
              <p className="text-xl">{t.home.noProducts}</p>
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 relative bg-secondary/20">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="text-center p-8 bg-card rounded-2xl border border-border shadow-village-sm hover:shadow-village-md transition-shadow group">
              <div className="w-20 h-20 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <span className="text-3xl">🚚</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">{t.home.deliveryTitle}</h3>
              <p className="text-muted-foreground text-sm">{t.home.deliveryDescription}</p>
            </div>
            <div className="text-center p-8 bg-card rounded-2xl border border-border shadow-village-sm hover:shadow-village-md transition-shadow group">
              <div className="w-20 h-20 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <span className="text-3xl">💳</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">{t.home.paymentTitle}</h3>
              <p className="text-muted-foreground text-sm">{t.home.paymentDescription}</p>
            </div>
            <div className="text-center p-8 bg-card rounded-2xl border border-border shadow-village-sm hover:shadow-village-md transition-shadow group">
              <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <span className="text-3xl">⭐</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">{t.home.qualityTitle}</h3>
              <p className="text-muted-foreground text-sm">{t.home.qualityDescription}</p>
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
                {t.home.haveCoupon}
              </h2>
              <p className="text-primary-foreground/80 mb-6 max-w-xl mx-auto">
                {t.home.couponDescription}
              </p>
              <Link 
                to="/cart"
                className="inline-flex items-center gap-2 bg-white text-primary px-8 py-3 rounded-xl font-semibold hover:bg-white/90 transition-colors"
              >
                {t.home.shopNow}
                <ArrowIcon className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </StoreLayout>
  );
}
