import * as React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Thumbs, FreeMode } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import { ZoomIn } from 'lucide-react';
import { ProductLightbox } from './ProductLightbox';
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
  const [thumbsSwiper, setThumbsSwiper] = React.useState<SwiperType | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = React.useState(false);
  const [lightboxIndex, setLightboxIndex] = React.useState(0);
  
  // Combine main image with additional images
  const allImages = mainImage ? [mainImage, ...images.filter(img => img !== mainImage)] : images;

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };
  
  if (allImages.length === 0) {
    return (
      <div className="w-full aspect-square flex items-center justify-center bg-muted rounded-2xl text-muted-foreground">
        لا توجد صورة
      </div>
    );
  }

  if (allImages.length === 1) {
    return (
      <>
        <div 
          className="bg-card rounded-2xl overflow-hidden shadow-village-md cursor-zoom-in group relative"
          onClick={() => openLightbox(0)}
        >
          <img src={allImages[0]} alt={productName} className="w-full aspect-square object-cover transition-transform duration-300 group-hover:scale-105" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <ZoomIn className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
        <ProductLightbox
          images={allImages}
          currentIndex={lightboxIndex}
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
          onNavigate={setLightboxIndex}
          productName={productName}
        />
      </>
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
            <div 
              className="cursor-zoom-in group relative"
              onClick={() => openLightbox(index)}
            >
              <img src={image} alt={`${productName} - ${index + 1}`} className="w-full aspect-square object-cover transition-transform duration-300 group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <ZoomIn className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
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

      <ProductLightbox
        images={allImages}
        currentIndex={lightboxIndex}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        onNavigate={setLightboxIndex}
        productName={productName}
      />
    </div>
  );
}
