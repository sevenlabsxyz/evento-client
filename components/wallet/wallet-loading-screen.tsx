'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useEffect, useState } from 'react';

const LOADING_MESSAGES = [
  'gettingReady',
  'preparingWallet',
  'almostThere',
  'makingMagic',
  'superpowers',
  'futureOfMoney',
  'wakingUp',
  'brewing',
  'justAMoment',
  'digitalVault',
] as const;

const MESSAGE_DURATION = 3500; // 3.5 seconds per message

interface WalletLoadingScreenProps {
  className?: string;
}

export function WalletLoadingScreen({ className }: WalletLoadingScreenProps) {
  const t = useTranslations('wallet');
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
        className='rounded-full border border-gray-200 bg-gray-50 shadow-sm dark:border-neutral-800 dark:bg-neutral-900'
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
          alt={t('loading.logoAlt')}
          width={96}
          height={96}
          className='dark:invert'
        />
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
            className='absolute inset-0 text-center text-xl font-medium text-gray-900 dark:text-neutral-100'
          >
            {t(`loading.messages.${LOADING_MESSAGES[currentMessageIndex]}`)}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Subtle hint for slow connections */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 20 }}
        className='mt-4 text-center text-sm text-gray-500 dark:text-neutral-400'
      >
        {t('loading.slowConnection')}
        <br />
        {t('loading.doNotRefresh')}
      </motion.p>
    </div>
  );
}
