'use client';

import { CircledIconButton } from '@/components/circled-icon-button';
import type { CarouselApi } from '@/components/ui/carousel';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Calendar, Sparkles, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

interface CarouselSlide {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

const slides: CarouselSlide[] = [
  {
    icon: <Calendar className='h-16 w-16' />,
    title: 'Discover Amazing Events',
    description:
      "Find and attend events that match your interests. From concerts to conferences, discover what's happening around you.",
    color: 'text-blue-600',
  },
  {
    icon: <Zap className='h-16 w-16' />,
    title: 'Built-in Lightning Wallet',
    description:
      'Send and receive Bitcoin instantly with your built-in Lightning wallet. Pay for tickets, tip creators, and manage your funds seamlessly.',
    color: 'text-orange-600',
  },
  {
    icon: <Sparkles className='h-16 w-16' />,
    title: 'Connect & Share',
    description:
      'Connect with friends, share your experiences, and build your community. Evento brings people together through shared experiences.',
    color: 'text-purple-600',
  },
];

export const OnboardingWelcomeCarousel = () => {
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
        <h2 className='mb-2 text-3xl font-bold text-gray-900'>Welcome to Evento!</h2>
        <p className='text-gray-600'>Here&apos;s what you can do</p>
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
              <div className='flex flex-col items-center rounded-2xl bg-gradient-to-br from-gray-50 to-white p-8 shadow-sm'>
                <div className={`mb-6 ${slide.color}`}>{slide.icon}</div>
                <h3 className='mb-4 text-center text-2xl font-bold text-gray-900'>{slide.title}</h3>
                <p className='text-center leading-relaxed text-gray-600'>{slide.description}</p>
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
              index === currentSlide ? 'w-8 bg-red-600' : 'w-2 bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Progress Text */}
      <div className='mt-4 text-sm text-gray-500'>
        {currentSlide + 1} of {slides.length}
      </div>
    </motion.div>
  );
};
