import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '@/hooks/useSupabase';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PromoBanner {
  id: string;
  title: string;
  subtitle: string | null;
  icon: string;
  bg_gradient: string;
  link: string | null;
  link_text: string | null;
}

export function PromoBanner() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const { data: banners } = useQuery({
    queryKey: ['promo-banners'],
    queryFn: async () => {
      const client = await getSupabase();
      const { data, error } = await client
        .from('promo_banners')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as PromoBanner[];
    }
  });

  useEffect(() => {
    if (isPaused || !banners || banners.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isPaused, banners]);

  if (!banners || banners.length === 0) return null;

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const slide = banners[currentSlide];

  return (
    <div 
      className="relative overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className={`bg-gradient-to-r ${slide.bg_gradient} transition-all duration-500`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-3 md:py-4">
            {/* Nav Button - Previous */}
            {banners.length > 1 && (
              <button 
                onClick={prevSlide}
                className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-white"
                aria-label="السابق"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {/* Content */}
            <div className="flex-1 flex items-center justify-center gap-4 text-white">
              <div className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-white/20 animate-pulse text-xl">
                {slide.icon}
              </div>
              
              <div className="text-center md:text-right">
                <p className="font-bold text-sm md:text-lg animate-fade-in">
                  {slide.title}
                </p>
                {slide.subtitle && (
                  <p className="text-white/80 text-xs md:text-sm">
                    {slide.subtitle}
                  </p>
                )}
              </div>

              {slide.link && slide.link_text && (
                <Link
                  to={slide.link}
                  className="hidden md:inline-flex items-center gap-1 bg-white text-foreground px-4 py-1.5 rounded-full text-sm font-medium hover:bg-white/90 transition-colors"
                >
                  {slide.link_text}
                  <ChevronLeft className="w-4 h-4" />
                </Link>
              )}
            </div>

            {/* Nav Button - Next */}
            {banners.length > 1 && (
              <button 
                onClick={nextSlide}
                className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-white"
                aria-label="التالي"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Slide Indicators */}
      {banners.length > 1 && (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
          {banners.map((_, index) => (
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
      )}
    </div>
  );
}
