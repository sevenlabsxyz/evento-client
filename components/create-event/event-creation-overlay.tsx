'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useState } from 'react';

const LOADING_MESSAGES = [
  'Creating your event...',
  'Setting up the details...',
  'Almost there...',
  'Making it perfect...',
  'Finalizing everything...',
  'Just a moment...',
];

const MESSAGE_DURATION = 2500; // 2.5 seconds per message

interface EventCreationOverlayProps {
  isVisible: boolean;
}

export function EventCreationOverlay({ isVisible }: EventCreationOverlayProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setCurrentMessageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => {
        if (prev >= LOADING_MESSAGES.length - 1) {
          return 0;
        }
        return prev + 1;
      });
    }, MESSAGE_DURATION);

    return () => clearInterval(interval);
  }, [isVisible]);

  // Prevent background scrolling when overlay is visible
  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className='fixed inset-0 z-[100] flex items-center justify-center bg-white/20 backdrop-blur-md'
          style={{ touchAction: 'none' }}
        >
          <div className='flex w-64 max-w-full flex-col items-center justify-center space-y-6 px-4'>
            {/* Animated Logo */}
            <motion.div
              className='rounded-full border border-gray-200 bg-gray-50 p-6 shadow-lg'
              animate={{
                rotate: 360,
              }}
              transition={{
                rotate: {
                  duration: 2,
                  ease: 'linear',
                  repeat: Infinity,
                },
              }}
            >
              <Image
                src='/assets/img/evento-sublogo.svg'
                alt='Evento Logo'
                width={80}
                height={80}
              />
            </motion.div>

            {/* Rotating Messages */}
            <div className='relative my-4 h-8 w-full'>
              <AnimatePresence mode='wait'>
                <motion.p
                  key={currentMessageIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className='absolute inset-0 text-center text-lg font-medium text-gray-900'
                >
                  {LOADING_MESSAGES[currentMessageIndex]}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Pulsing dots indicator */}
            <div className='flex space-x-2'>
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className='h-2 w-2 rounded-full bg-red-500'
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
