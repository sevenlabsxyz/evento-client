'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useState } from 'react';

const LOADING_MESSAGES = [
  'Getting things ready for you...',
  'Preparing your wallet...',
  'Almost there...',
  'Making magic happen...',
  'Setting up your financial superpowers...',
  'Connecting to the future of money...',
  'Your wallet is waking up...',
  'Brewing up something good...',
  'Just a moment...',
  'Loading your digital vault...',
];

const MESSAGE_DURATION = 3500; // 3.5 seconds per message

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
      {/* Animated Logo */}
      <motion.div
        className='rounded-full border border-gray-200 bg-gray-50 shadow-sm'
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
        <Image src='/assets/img/evento-sublogo.svg' alt='Evento Logo' width={96} height={96} />
      </motion.div>

      {/* Rotating Messages */}
      <div className='relative mt-4 h-8 w-full max-w-xs'>
        <AnimatePresence mode='wait'>
          <motion.p
            key={currentMessageIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className='absolute inset-0 text-center text-xl font-medium text-gray-900'
          >
            {LOADING_MESSAGES[currentMessageIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Subtle hint for slow connections */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 20 }}
        className='mt-4 text-center text-sm text-gray-500'
      >
        This may take longer on slower connections.
        <br />
        Do not refresh the page.
      </motion.p>
    </div>
  );
}
