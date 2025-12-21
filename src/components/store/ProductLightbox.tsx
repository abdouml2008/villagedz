import * as React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface ProductLightboxProps {
  images: string[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
  productName?: string;
}

export function ProductLightbox({
  images,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
  productName = 'المنتج'
}: ProductLightboxProps) {
  const [touchStart, setTouchStart] = React.useState<number | null>(null);
  const [touchEnd, setTouchEnd] = React.useState<number | null>(null);
  const [scale, setScale] = React.useState(1);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const [lastTap, setLastTap] = React.useState(0);
  const [initialPinchDistance, setInitialPinchDistance] = React.useState<number | null>(null);
  const [initialScale, setInitialScale] = React.useState(1);

  const minSwipeDistance = 50;
  const minScale = 1;
  const maxScale = 4;

  // Reset zoom when image changes or lightbox closes
  React.useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [currentIndex, isOpen]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'ArrowLeft') {
        handleNext();
      } else if (e.key === 'ArrowRight') {
        handlePrevious();
      } else if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      } else if (e.key === '0') {
        handleResetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, scale]);

  const handlePrevious = () => {
    if (scale > 1) return; // Don't navigate when zoomed
    const newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
    onNavigate(newIndex);
  };

  const handleNext = () => {
    if (scale > 1) return; // Don't navigate when zoomed
    const newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
    onNavigate(newIndex);
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.5, maxScale));
  };

  const handleZoomOut = () => {
    const newScale = Math.max(scale - 0.5, minScale);
    setScale(newScale);
    if (newScale === 1) {
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const getDistance = (touches: React.TouchList) => {
    return Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY
    );
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch start
      setInitialPinchDistance(getDistance(e.touches));
      setInitialScale(scale);
    } else if (e.touches.length === 1) {
      // Single touch - check for double tap
      const now = Date.now();
      if (now - lastTap < 300) {
        // Double tap
        if (scale > 1) {
          handleResetZoom();
        } else {
          setScale(2.5);
        }
      }
      setLastTap(now);

      // Start drag if zoomed
      if (scale > 1) {
        setIsDragging(true);
        setDragStart({
          x: e.touches[0].clientX - position.x,
          y: e.touches[0].clientY - position.y
        });
      } else {
        setTouchEnd(null);
        setTouchStart(e.touches[0].clientX);
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchDistance) {
      // Pinch zoom
      const currentDistance = getDistance(e.touches);
      const scaleChange = currentDistance / initialPinchDistance;
      const newScale = Math.min(Math.max(initialScale * scaleChange, minScale), maxScale);
      setScale(newScale);
      
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
    } else if (e.touches.length === 1) {
      if (isDragging && scale > 1) {
        // Pan when zoomed
        const newX = e.touches[0].clientX - dragStart.x;
        const newY = e.touches[0].clientY - dragStart.y;
        
        // Limit panning based on scale
        const maxPan = (scale - 1) * 150;
        setPosition({
          x: Math.min(Math.max(newX, -maxPan), maxPan),
          y: Math.min(Math.max(newY, -maxPan), maxPan)
        });
      } else if (scale === 1) {
        setTouchEnd(e.touches[0].clientX);
      }
    }
  };

  const handleTouchEnd = () => {
    setInitialPinchDistance(null);
    setIsDragging(false);
    
    if (scale === 1 && touchStart && touchEnd) {
      const distance = touchStart - touchEnd;
      const isLeftSwipe = distance > minSwipeDistance;
      const isRightSwipe = distance < -minSwipeDistance;

      if (isLeftSwipe) {
        handleNext();
      } else if (isRightSwipe) {
        handlePrevious();
      }
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.3 : 0.3;
    const newScale = Math.min(Math.max(scale + delta, minScale), maxScale);
    setScale(newScale);
    
    if (newScale === 1) {
      setPosition({ x: 0, y: 0 });
    }
  };

  if (images.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-black/95 border-none [&>button]:hidden">
        <div 
          className="relative w-full h-full flex items-center justify-center min-h-[50vh] overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Image counter */}
          {images.length > 1 && (
            <div className="absolute top-4 left-4 z-50 px-3 py-1.5 rounded-full bg-white/10 text-white text-sm font-medium">
              {currentIndex + 1} / {images.length}
            </div>
          )}

          {/* Zoom controls */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 backdrop-blur-sm">
            <button
              onClick={handleZoomOut}
              disabled={scale <= minScale}
              className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="تصغير"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <span className="text-white text-sm font-medium min-w-[3rem] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={scale >= maxScale}
              className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="تكبير"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            {scale > 1 && (
              <button
                onClick={handleResetZoom}
                className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors mr-1"
                aria-label="إعادة ضبط"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Zoom hint */}
          {scale === 1 && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-40 px-3 py-1.5 rounded-full bg-white/5 text-white/60 text-xs">
              انقر مرتين للتكبير • استخدم إصبعين للتكبير
            </div>
          )}

          {/* Navigation buttons */}
          {images.length > 1 && scale === 1 && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="الصورة السابقة"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
              <button
                onClick={handleNext}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="الصورة التالية"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Main image */}
          <img
            key={currentIndex}
            src={images[currentIndex]}
            alt={`${productName} - ${currentIndex + 1}`}
            className="max-w-full max-h-[85vh] object-contain select-none transition-transform duration-150 ease-out"
            style={{
              transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
              cursor: scale > 1 ? 'grab' : 'default'
            }}
            draggable={false}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
