import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Sparkles, Percent, Truck, Gift } from 'lucide-react';

interface PromoSlide {
  id: number;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  bgClass: string;
  link?: string;
  linkText?: string;
}

const promoSlides: PromoSlide[] = [
  {
    id: 1,
    title: 'خصم 20% على جميع المنتجات',
    subtitle: 'استخدم الكود: VILLAGE20',
    icon: <Percent className="w-6 h-6" />,
    bgClass: 'from-primary via-primary/90 to-primary/80',
    link: '/cart',
    linkText: 'تسوق الآن'
  },
  {
    id: 2,
    title: 'توصيل مجاني للطلبات فوق 5000 دج',
    subtitle: 'لجميع ولايات الجزائر',
    icon: <Truck className="w-6 h-6" />,
    bgClass: 'from-green-600 via-green-500 to-emerald-500',
  },
  {
    id: 3,
    title: 'منتجات جديدة كل أسبوع',
    subtitle: 'اكتشف آخر صيحات الموضة',
    icon: <Sparkles className="w-6 h-6" />,
    bgClass: 'from-purple-600 via-violet-500 to-indigo-500',
  },
  {
    id: 4,
    title: 'هدية مجانية مع كل طلب',
    subtitle: 'لفترة محدودة فقط',
    icon: <Gift className="w-6 h-6" />,
    bgClass: 'from-orange-500 via-amber-500 to-yellow-500',
  }
];

export function PromoBanner() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % promoSlides.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % promoSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + promoSlides.length) % promoSlides.length);
  };

  const slide = promoSlides[currentSlide];

  return (
    <div 
      className="relative overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className={`bg-gradient-to-r ${slide.bgClass} transition-all duration-500`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-3 md:py-4">
            {/* Nav Button - Previous */}
            <button 
              onClick={prevSlide}
              className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-white"
              aria-label="السابق"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Content */}
            <div className="flex-1 flex items-center justify-center gap-4 text-white">
              <div className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-white/20 animate-pulse">
                {slide.icon}
              </div>
              
              <div className="text-center md:text-right">
                <p className="font-bold text-sm md:text-lg animate-fade-in">
                  {slide.title}
                </p>
                <p className="text-white/80 text-xs md:text-sm">
                  {slide.subtitle}
                </p>
              </div>

              {slide.link && (
                <Link
                  to={slide.link}
                  className="hidden md:inline-flex items-center gap-1 bg-white text-foreground px-4 py-1.5 rounded-full text-sm font-medium hover:bg-white/90 transition-colors"
                >
                  {slide.linkText}
                  <ChevronLeft className="w-4 h-4" />
                </Link>
              )}
            </div>

            {/* Nav Button - Next */}
            <button 
              onClick={nextSlide}
              className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-white"
              aria-label="التالي"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
        {promoSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              index === currentSlide ? 'bg-white w-4' : 'bg-white/50'
            }`}
            aria-label={`الانتقال للشريحة ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
