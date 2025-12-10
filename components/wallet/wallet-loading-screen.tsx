'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const LOADING_MESSAGES = [
  'Initializing wallet...',
  'Connecting to Lightning Network...',
  'Syncing with the network...',
  'Fetching wallet information...',
  'Almost there...',
  'Hang tight, loading a few last things...',
];

const MESSAGE_DURATION = 3000; // 3 seconds per message

interface WalletLoadingScreenProps {
  className?: string;
}

export function WalletLoadingScreen({ className }: WalletLoadingScreenProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    // Rotate through messages
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => {
        // Loop back to start if we've shown all messages
        if (prev >= LOADING_MESSAGES.length - 1) {
          return 0;
        }
        return prev + 1;
      });
    }, MESSAGE_DURATION);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`flex min-h-[400px] flex-col items-center justify-center space-y-6 ${className || ''}`}
    >
      {/* Animated Loader */}
      <motion.div
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <Loader2 className='h-12 w-12 text-red-500' />
      </motion.div>

      {/* Rotating Messages */}
      <div className='relative h-8 w-full max-w-xs'>
        <AnimatePresence mode='wait'>
          <motion.p
            key={currentMessageIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className='absolute inset-0 text-center text-base font-medium text-gray-700'
          >
            {LOADING_MESSAGES[currentMessageIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Progress Dots */}
      <div className='flex items-center gap-2'>
        {LOADING_MESSAGES.map((_, index) => (
          <motion.div
            key={index}
            className='h-2 w-2 rounded-full bg-gray-300'
            animate={{
              backgroundColor: index === currentMessageIndex ? '#ef4444' : '#d1d5db',
              scale: index === currentMessageIndex ? 1.2 : 1,
            }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>

      {/* Subtle hint for slow connections */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 10 }}
        className='mt-4 text-center text-sm text-gray-500'
      >
        This may take longer on slower connections
      </motion.p>
    </div>
  );
}
