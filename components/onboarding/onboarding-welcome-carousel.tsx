'use client';

import { CircledIconButton } from '@/components/circled-icon-button';
import type { CarouselApi } from '@/components/ui/carousel';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Calendar, Sparkles, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

interface CarouselSlide {
  icon: React.ReactNode;
  titleKey: 'discoverTitle' | 'walletTitle' | 'connectTitle';
  descriptionKey: 'discoverDescription' | 'walletDescription' | 'connectDescription';
  color: string;
}

const slides: CarouselSlide[] = [
  {
    icon: <Calendar className='h-16 w-16' />,
    titleKey: 'discoverTitle',
    descriptionKey: 'discoverDescription',
    color: 'text-blue-600 dark:text-blue-400',
  },
  {
    icon: <Zap className='h-16 w-16' />,
    titleKey: 'walletTitle',
    descriptionKey: 'walletDescription',
    color: 'text-orange-600 dark:text-orange-400',
  },
  {
    icon: <Sparkles className='h-16 w-16' />,
    titleKey: 'connectTitle',
    descriptionKey: 'connectDescription',
    color: 'text-purple-600 dark:text-purple-400',
  },
];

export const OnboardingWelcomeCarousel = () => {
  const t = useTranslations('onboarding.welcome');
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Carousel navigation handlers
  useEffect(() => {
    if (!carouselApi) {
      return;
    }
    const updateSelection = () => {
      setCanScrollPrev(carouselApi.canScrollPrev());
      setCanScrollNext(carouselApi.canScrollNext());
      setCurrentSlide(carouselApi.selectedScrollSnap());
    };
    updateSelection();
    carouselApi.on('select', updateSelection);
    return () => {
      carouselApi.off('select', updateSelection);
    };
  }, [carouselApi]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className='flex flex-col items-center'
    >
      <div className='mb-6 text-center'>
        <h2 className='mb-2 text-3xl font-bold text-gray-900 dark:text-neutral-100'>
          {t('title')}
        </h2>
        <p className='text-gray-600 dark:text-neutral-400'>{t('subtitle')}</p>
      </div>

      {/* Navigation Arrows */}
      <div className='mb-4 flex items-center gap-2'>
        <CircledIconButton
          icon={ArrowLeft}
          onClick={() => carouselApi?.scrollPrev()}
          disabled={!canScrollPrev}
        />
        <CircledIconButton
          icon={ArrowRight}
          onClick={() => carouselApi?.scrollNext()}
          disabled={!canScrollNext}
        />
      </div>

      {/* Carousel */}
      <Carousel setApi={setCarouselApi} className='w-full max-w-md'>
        <CarouselContent>
          {slides.map((slide, index) => (
            <CarouselItem key={index}>
              <div className='flex flex-col items-center rounded-2xl bg-gradient-to-br from-gray-50 to-white p-8 shadow-sm dark:from-neutral-950 dark:to-neutral-900 dark:ring-1 dark:ring-neutral-800'>
                <div className={`mb-6 ${slide.color}`}>{slide.icon}</div>
                <h3 className='mb-4 text-center text-2xl font-bold text-gray-900 dark:text-neutral-100'>
                  {t(slide.titleKey)}
                </h3>
                <p className='text-center leading-relaxed text-gray-600 dark:text-neutral-400'>
                  {t(slide.descriptionKey)}
                </p>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Dots Indicator */}
      <div className='mt-6 flex justify-center gap-2'>
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => carouselApi?.scrollTo(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentSlide
                ? 'w-8 bg-red-600'
                : 'w-2 bg-gray-300 hover:bg-gray-400 dark:bg-neutral-600 dark:hover:bg-neutral-500'
            }`}
            aria-label={t('goToSlide', { number: index + 1 })}
          />
        ))}
      </div>

      {/* Progress Text */}
      <div className='mt-4 text-sm text-gray-500 dark:text-neutral-400'>
        {t('progress', { current: currentSlide + 1, total: slides.length })}
      </div>
    </motion.div>
  );
};
