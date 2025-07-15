'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageLightboxProps {
  isOpen: boolean;
  images: string[];
  initialIndex?: number;
  eventTitle: string;
  onClose: () => void;
}

export default function ImageLightbox({ isOpen, images, initialIndex = 0, eventTitle, onClose }: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  
  // Touch gesture state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragCurrentY, setDragCurrentY] = useState(0);
  const [dragDistance, setDragDistance] = useState(0);
  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  // Reset drag state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsDragging(false);
      setDragDistance(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && images.length > 1) {
        prevImage();
      } else if (e.key === 'ArrowRight' && images.length > 1) {
        nextImage();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyboard);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyboard);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Touch gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStartY(e.touches[0].clientY);
      setDragCurrentY(e.touches[0].clientY);
      setDragDistance(0);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - dragStartY;
    
    // Only allow downward drags
    if (distance > 0) {
      setDragCurrentY(currentY);
      setDragDistance(distance);
      
      // Prevent default scrolling
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging) return;

    const threshold = 100; // pixels
    const velocity = dragDistance / 200; // rough velocity calculation
    
    // Close if dragged down enough or with sufficient velocity
    if (dragDistance > threshold || (dragDistance > 50 && velocity > 0.3)) {
      onClose();
    }
    
    // Reset drag state
    setIsDragging(false);
    setDragDistance(0);
  };

  // Calculate visual feedback values
  const getBackdropOpacity = () => {
    if (!isDragging || dragDistance <= 0) return 0.9;
    const opacity = Math.max(0.3, 0.9 - (dragDistance / 300));
    return opacity;
  };

  const getImageTransform = () => {
    if (!isDragging || dragDistance <= 0) return 'translate(-50%, -50%) scale(1)';
    const scale = Math.max(0.7, 1 - (dragDistance / 800));
    const translateY = dragDistance * 0.3;
    return `translate(-50%, calc(-50% + ${translateY}px)) scale(${scale})`;
  };

  if (!isOpen || images.length === 0) return null;

  const hasMultipleImages = images.length > 1;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black flex items-center justify-center p-4 transition-opacity duration-200"
      style={{ backgroundColor: `rgba(0, 0, 0, ${getBackdropOpacity()})` }}
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-60 p-2 text-white hover:text-gray-300 transition-colors"
      >
        <X className="w-8 h-8" />
      </button>

      {/* Image Counter */}
      {hasMultipleImages && (
        <div className="absolute top-4 left-4 z-60 px-3 py-1 bg-black bg-opacity-50 rounded-full text-white text-sm">
          {currentIndex + 1} of {images.length}
        </div>
      )}

      {/* Previous Button */}
      {hasMultipleImages && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            prevImage();
          }}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 z-60 p-3 text-white hover:text-gray-300 hover:bg-black hover:bg-opacity-30 rounded-full transition-colors"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
      )}

      {/* Next Button */}
      {hasMultipleImages && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            nextImage();
          }}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 z-60 p-3 text-white hover:text-gray-300 hover:bg-black hover:bg-opacity-30 rounded-full transition-colors"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      )}

      {/* Image Container */}
      <div 
        className="fixed top-1/2 left-1/2 max-w-full max-h-full flex items-center justify-center transition-transform duration-200"
        style={{ transform: getImageTransform() }}
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={images[currentIndex]}
          alt={`${eventTitle} - Image ${currentIndex + 1}`}
          width={800}
          height={800}
          className="max-w-full max-h-full object-contain"
          priority
        />
      </div>
    </div>
  );
}