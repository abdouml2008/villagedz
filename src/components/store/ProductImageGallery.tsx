import { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Thumbs, FreeMode } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';
import 'swiper/css/free-mode';

interface ProductImageGalleryProps {
  images: string[];
  mainImage?: string | null;
  productName: string;
}

export function ProductImageGallery({ images, mainImage, productName }: ProductImageGalleryProps) {
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);
  
  // Combine main image with additional images
  const allImages = mainImage ? [mainImage, ...images.filter(img => img !== mainImage)] : images;
  
  if (allImages.length === 0) {
    return (
      <div className="w-full aspect-square flex items-center justify-center bg-muted rounded-2xl text-muted-foreground">
        لا توجد صورة
      </div>
    );
  }

  if (allImages.length === 1) {
    return (
      <div className="bg-card rounded-2xl overflow-hidden shadow-village-md">
        <img src={allImages[0]} alt={productName} className="w-full aspect-square object-cover" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Swiper
        modules={[Navigation, Thumbs]}
        navigation
        thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
        className="bg-card rounded-2xl overflow-hidden shadow-village-md product-gallery-main"
      >
        {allImages.map((image, index) => (
          <SwiperSlide key={index}>
            <img src={image} alt={`${productName} - ${index + 1}`} className="w-full aspect-square object-cover" />
          </SwiperSlide>
        ))}
      </Swiper>

      <Swiper
        onSwiper={setThumbsSwiper}
        modules={[FreeMode, Thumbs]}
        spaceBetween={10}
        slidesPerView={4}
        freeMode
        watchSlidesProgress
        className="product-gallery-thumbs"
      >
        {allImages.map((image, index) => (
          <SwiperSlide key={index} className="cursor-pointer">
            <div className="aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-colors">
              <img src={image} alt={`${productName} thumbnail ${index + 1}`} className="w-full h-full object-cover" />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
