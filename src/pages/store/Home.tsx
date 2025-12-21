import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '@/hooks/useSupabase';
import { StoreLayout } from '@/components/store/StoreLayout';
import { ProductCard } from '@/components/store/ProductCard';
import { PromoBanner } from '@/components/store/PromoBanner';
import { CustomerTestimonials } from '@/components/store/CustomerTestimonials';
import { FloatingParticles } from '@/components/store/FloatingParticles';
import { ScrollProgressIndicator } from '@/components/store/ScrollProgressIndicator';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Flame, Sparkles, Package, Loader2 } from 'lucide-react';
import { Product, Category } from '@/types/store';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation } from 'swiper/modules';
import { motion, useScroll, useTransform } from 'framer-motion';
import 'swiper/css';
import 'swiper/css/navigation';

const PRODUCTS_PER_PAGE = 8;

export default function Home() {
  const { language, isRTL } = useLanguage();
  const { t } = useTranslation();
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;
  const [visibleProducts, setVisibleProducts] = useState(PRODUCTS_PER_PAGE);
  
  // Parallax effect for hero background
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 150]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.3]);

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

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  return (
    <StoreLayout>
      {/* Scroll Progress Indicator */}
      <ScrollProgressIndicator />
      
      {/* Promo Banner */}
      <PromoBanner />
      
      {/* Hero Section with Background Image */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Parallax Background Image */}
        <motion.div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: 'url("/images/village-bg.png")',
            y: heroY,
          }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/60 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/50 via-transparent to-background/50" />
        
        {/* Floating Particles */}
        <FloatingParticles />
        
        {/* Decorative Blur Elements */}
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-primary/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] bg-accent/20 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* Content */}
        <motion.div 
          className="container mx-auto text-center relative z-10 px-4 py-24"
          style={{ opacity: heroOpacity }}
        >
          <motion.h1 
            className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {t.home.welcome} <span className="text-gradient drop-shadow-lg">Village</span>
          </motion.h1>
          
          <motion.p 
            className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          >
            {t.home.heroDescription}
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          >
            <Link 
              to="/category/men" 
              className="group inline-flex items-center justify-center gap-2 gradient-primary text-primary-foreground px-10 py-5 rounded-2xl font-semibold text-lg hover:opacity-90 transition-all shadow-glow hover:shadow-lg hover:-translate-y-1"
            >
              {t.home.shopNow}
              <ArrowIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              to="/category/women" 
              className="inline-flex items-center justify-center gap-2 bg-card/80 backdrop-blur-sm text-foreground px-10 py-5 rounded-2xl font-semibold text-lg border border-border hover:border-primary transition-all hover:shadow-md hover:-translate-y-1"
            >
              {t.home.browseCollection}
            </Link>
          </motion.div>
          
          {/* Stats */}
          <motion.div 
            className="flex flex-wrap justify-center gap-8 md:gap-12 mt-20"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
          >
            <div className="text-center bg-card/50 backdrop-blur-sm rounded-2xl px-8 py-4 border border-border/50">
              <span className="text-4xl md:text-5xl font-bold text-gradient">69</span>
              <p className="text-sm text-muted-foreground mt-2">{t.home.deliveryStates}</p>
            </div>
            <div className="text-center bg-card/50 backdrop-blur-sm rounded-2xl px-8 py-4 border border-border/50">
              <span className="text-4xl md:text-5xl font-bold text-gradient">{totalProducts || 0}</span>
              <p className="text-sm text-muted-foreground mt-2">{t.home.productsAvailable}</p>
            </div>
            <div className="text-center bg-card/50 backdrop-blur-sm rounded-2xl px-8 py-4 border border-border/50">
              <span className="text-4xl md:text-5xl font-bold text-gradient">24/7</span>
              <p className="text-sm text-muted-foreground mt-2">{t.home.customerSupport}</p>
            </div>
          </motion.div>
        </motion.div>
        
        {/* Scroll Indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-primary/50 flex items-start justify-center p-2">
            <motion.div 
              className="w-1.5 h-3 bg-primary rounded-full"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      </section>

      {/* Categories */}
      <section className="py-20 px-4 relative">
        <div className="container mx-auto">
          <motion.div 
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.home.shopByCategory}</h2>
            <p className="text-muted-foreground">{t.home.chooseFromCollection}</p>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            {categoriesLoading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="bg-card rounded-2xl p-8 h-44 animate-pulse" />
              ))
            ) : categories && categories.length > 0 ? (
              categories.map((category, index) => (
                <motion.div key={category.id} variants={fadeInUp}>
                  <Link
                    to={`/category/${category.slug}`}
                    className="group relative bg-card rounded-2xl p-6 md:p-8 text-center shadow-village-sm hover:shadow-village-lg transition-all duration-300 border border-border overflow-hidden block"
                  >
                    {/* Hover Background */}
                    <div className="absolute inset-0 gradient-primary opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                    
                    <span className="text-5xl md:text-6xl mb-4 block group-hover:scale-110 transition-transform duration-300">{category.icon}</span>
                    <h3 className="text-lg md:text-xl font-semibold group-hover:text-primary transition-colors">
                      {language === 'ar' ? category.name_ar : category.name}
                    </h3>
                  </Link>
                </motion.div>
              ))
            ) : (
              <div className="col-span-4 text-center py-8 text-muted-foreground">
                {t.home.noCategories}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Special Offers Section */}
      {discountedProducts && discountedProducts.length > 0 && (
        <section className="py-20 px-4 relative bg-destructive/5 overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-destructive/10 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-primary/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '0.5s' }} />
          </div>
          
          <div className="container mx-auto relative">
            <motion.div
              className="flex items-center justify-center gap-3 mb-4"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <Flame className="w-8 h-8 text-destructive animate-bounce" />
              <h2 className="text-3xl md:text-4xl font-bold">{t.home.specialOffers}</h2>
              <Flame className="w-8 h-8 text-destructive animate-bounce" style={{ animationDelay: '0.2s' }} />
            </motion.div>
            <motion.p 
              className="text-center text-muted-foreground mb-12"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              transition={{ delay: 0.1 }}
            >
              {t.home.discountedProducts}
            </motion.p>
            
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
      <section className="py-20 px-4 relative bg-secondary/30 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        
        <div className="container mx-auto relative">
          <motion.div
            className="flex items-center justify-center gap-3 mb-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <Sparkles className="w-7 h-7 text-accent" />
            <h2 className="text-3xl md:text-4xl font-bold">{t.home.latestProducts}</h2>
          </motion.div>
          <motion.p 
            className="text-center text-muted-foreground mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            transition={{ delay: 0.1 }}
          >
            {t.home.discoverLatest}
          </motion.p>
          
          {featuredLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-card rounded-xl h-80 animate-pulse" />
              ))}
            </div>
          ) : featuredProducts && featuredProducts.length > 0 ? (
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
            >
              {featuredProducts.map(product => (
                <motion.div key={product.id} variants={fadeInUp}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
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
          <motion.div
            className="flex items-center justify-center gap-3 mb-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <Package className="w-7 h-7 text-primary" />
            <h2 className="text-3xl md:text-4xl font-bold">{t.home.allProducts}</h2>
          </motion.div>
          <motion.p 
            className="text-center text-muted-foreground mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            transition={{ delay: 0.1 }}
          >
            {t.home.exploreAll}
          </motion.p>
          
          {allProductsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-card rounded-xl h-80 animate-pulse" />
              ))}
            </div>
          ) : displayedProducts.length > 0 ? (
            <>
              <motion.div 
                className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={staggerContainer}
              >
                {displayedProducts.map(product => (
                  <motion.div key={product.id} variants={fadeInUp}>
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </motion.div>
              
              {/* Load More Button */}
              {hasMoreProducts && (
                <motion.div 
                  className="flex justify-center mt-12"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <Button
                    onClick={handleLoadMore}
                    variant="outline"
                    size="lg"
                    className="px-8 gap-2 hover:scale-105 transition-transform"
                  >
                    <Loader2 className="w-4 h-4 hidden" />
                    {t.common.loadMore}
                    <span className="text-muted-foreground text-sm">
                      ({visibleProducts}/{allProducts?.length})
                    </span>
                  </Button>
                </motion.div>
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
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            <motion.div 
              className="text-center p-8 bg-card rounded-2xl border border-border shadow-village-sm hover:shadow-village-lg transition-all group"
              variants={fadeInUp}
              whileHover={{ y: -5 }}
            >
              <div className="w-20 h-20 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <span className="text-3xl">🚚</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">{t.home.deliveryTitle}</h3>
              <p className="text-muted-foreground text-sm">{t.home.deliveryDescription}</p>
            </motion.div>
            
            <motion.div 
              className="text-center p-8 bg-card rounded-2xl border border-border shadow-village-sm hover:shadow-village-lg transition-all group"
              variants={fadeInUp}
              whileHover={{ y: -5 }}
            >
              <div className="w-20 h-20 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <span className="text-3xl">💳</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">{t.home.paymentTitle}</h3>
              <p className="text-muted-foreground text-sm">{t.home.paymentDescription}</p>
            </motion.div>
            
            <motion.div 
              className="text-center p-8 bg-card rounded-2xl border border-border shadow-village-sm hover:shadow-village-lg transition-all group"
              variants={fadeInUp}
              whileHover={{ y: -5 }}
            >
              <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <span className="text-3xl">⭐</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">{t.home.qualityTitle}</h3>
              <p className="text-muted-foreground text-sm">{t.home.qualityDescription}</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <motion.div 
            className="relative overflow-hidden rounded-3xl gradient-primary p-8 md:p-12 text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 animate-pulse" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 animate-pulse" style={{ animationDelay: '0.5s' }} />
            
            <div className="relative">
              <h2 className="text-2xl md:text-4xl font-bold text-primary-foreground mb-4">
                {t.home.haveCoupon}
              </h2>
              <p className="text-primary-foreground/80 mb-6 max-w-xl mx-auto">
                {t.home.couponDescription}
              </p>
              <Link 
                to="/cart"
                className="group inline-flex items-center gap-2 bg-white text-primary px-8 py-3 rounded-xl font-semibold hover:bg-white/90 transition-all hover:scale-105"
              >
                {t.home.shopNow}
                <ArrowIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </StoreLayout>
  );
}
