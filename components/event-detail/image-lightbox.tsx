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
  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

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

  if (!isOpen || images.length === 0) return null;

  const hasMultipleImages = images.length > 1;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
      onClick={onClose}
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
        className="relative max-w-full max-h-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={images[currentIndex]}
          alt={`${eventTitle} - Image ${currentIndex + 1}`}
          width={800}
          height={800}
          className="max-w-full max-h-full object-contain transition-opacity duration-300"
          priority
        />
      </div>
    </div>
  );
}