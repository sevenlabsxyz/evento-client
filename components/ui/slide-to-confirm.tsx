'use client';

import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { ChevronRight, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface SlideToConfirmProps {
  onConfirm: () => void;
  isLoading?: boolean;
  text?: string;
  loadingText?: string;
  disabled?: boolean;
}

export function SlideToConfirm({
  onConfirm,
  isLoading = false,
  text = 'Slide to Confirm',
  loadingText = 'Processing...',
  disabled = false,
}: SlideToConfirmProps) {
  const [isComplete, setIsComplete] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const [maxDrag, setMaxDrag] = useState(0);

  // Calculate max drag distance when component mounts
  useEffect(() => {
    if (constraintsRef.current) {
      const containerWidth = constraintsRef.current.offsetWidth;
      const sliderWidth = 56; // h-14 = 56px
      setMaxDrag(containerWidth - sliderWidth - 8); // 8px for padding
    }
  }, []);

  // Transform x position to progress width
  const progressWidth = useTransform(x, [0, maxDrag], ['0%', '100%']);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = maxDrag * 0.9; // 90% of the way

    if (info.point.x >= threshold && !isComplete && !isLoading && !disabled) {
      setIsComplete(true);
      // Trigger confirmation after a brief animation
      setTimeout(() => {
        onConfirm();
      }, 200);
    } else {
      // Reset to start if not completed
      x.set(0);
    }
  };

  // Reset when loading completes
  useEffect(() => {
    if (!isLoading && isComplete) {
      setIsComplete(false);
      x.set(0);
    }
  }, [isLoading, isComplete, x]);

  return (
    <div
      ref={constraintsRef}
      className='relative h-14 w-full overflow-hidden rounded-full bg-gray-100'
    >
      {/* Progress bar background */}
      <motion.div
        className='absolute inset-0 rounded-full bg-blue-100'
        style={{ width: progressWidth }}
      />

      {/* Text */}
      <div className='absolute inset-0 flex items-center justify-center'>
        <span className='select-none text-sm font-medium text-gray-700'>
          {isLoading ? loadingText : text}
        </span>
      </div>

      {/* Slider button */}
      {!isLoading && (
        <motion.div
          drag='x'
          dragConstraints={{ left: 0, right: maxDrag }}
          dragElastic={0}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
          style={{ x }}
          className='absolute left-1 top-1 flex h-12 w-12 cursor-grab items-center justify-center rounded-full bg-green-500 shadow-lg active:cursor-grabbing'
          whileTap={{ scale: 1.05 }}
        >
          <ChevronRight className='h-6 w-6 text-white' strokeWidth={3} />
        </motion.div>
      )}

      {/* Loading spinner */}
      {isLoading && (
        <div className='absolute inset-0 flex items-center justify-center'>
          <Loader2 className='h-6 w-6 animate-spin text-gray-600' />
        </div>
      )}
    </div>
  );
}
