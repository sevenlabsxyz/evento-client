'use client';

import { Event } from '@/lib/types/event';
import Image from 'next/image';
import { useRef, useState } from 'react';

interface SwipeableHeaderProps {
  event: Event;
  onImageClick: (index: number) => void;
}

export default function SwipeableHeader({ event, onImageClick }: SwipeableHeaderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const images = event.coverImages || [];
  const hasMultipleImages = images.length > 1;

  // Minimum swipe distance to trigger change
  const minSwipeDistance = 50;

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && hasMultipleImages) {
      nextImage();
    }
    if (isRightSwipe && hasMultipleImages) {
      prevImage();
    }
  };

  const handleImageClick = () => {
    onImageClick(currentIndex);
  };

  if (images.length === 0) {
    return (
      <div className='relative flex aspect-square w-full items-center justify-center overflow-hidden bg-gray-200'>
        <span className='text-gray-500'>No image available</span>
      </div>
    );
  }

  return (
    <div className='relative mx-auto aspect-square w-[94%] overflow-hidden rounded-3xl shadow-md'>
      {/* Image Container */}
      <div
        ref={containerRef}
        className='relative h-full w-full cursor-pointer'
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={handleImageClick}
      >
        <Image
          src={images[currentIndex]}
          alt={`${event.title} - Image ${currentIndex + 1}`}
          fill
          className='object-cover transition-transform duration-300 ease-out'
          priority
          unoptimized={images[currentIndex]?.endsWith('.gif')} // Optimizing GIFs may impact performance
        />

        {/* Dot Indicators */}
        {hasMultipleImages && (
          <div className='absolute bottom-16 left-1/2 flex -translate-x-1/2 transform gap-2'>
            {images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(index);
                }}
                className={`h-2 w-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
