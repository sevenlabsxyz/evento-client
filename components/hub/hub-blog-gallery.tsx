'use client';

import { GhostPost } from '@/lib/types/ghost';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { CircledIconButton } from '@/components/circled-icon-button';
import type { CarouselApi } from '@/components/ui/carousel';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';

interface HubBlogGalleryProps {
  posts: GhostPost[];
}

export function HubBlogGallery({ posts }: HubBlogGalleryProps) {
  const t = useTranslations('hub');
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  // Carousel navigation handlers
  useEffect(() => {
    if (!carouselApi) {
      return;
    }
    const updateSelection = () => {
      setCanScrollPrev(carouselApi.canScrollPrev());
      setCanScrollNext(carouselApi.canScrollNext());
    };
    updateSelection();
    carouselApi.on('select', updateSelection);
    return () => {
      carouselApi.off('select', updateSelection);
    };
  }, [carouselApi]);

  // Don't show section if no posts
  if (posts.length === 0) {
    return null;
  }

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <h2 className='text-xl font-semibold'>{t('blog.galleryTitle')}</h2>
        <div className='flex items-center gap-2'>
          <CircledIconButton
            icon={ArrowLeft}
            onClick={() => carouselApi?.scrollPrev()}
            disabled={!canScrollPrev}
            ariaLabel={t('blog.previous')}
          />
          <CircledIconButton
            icon={ArrowRight}
            onClick={() => carouselApi?.scrollNext()}
            disabled={!canScrollNext}
            ariaLabel={t('blog.next')}
          />
        </div>
      </div>

      <Carousel
        setApi={setCarouselApi}
        opts={{
          breakpoints: {
            '(max-width: 768px)': {
              dragFree: true,
            },
          },
        }}
        className='relative -mx-4 w-[calc(100%+2rem)]'
      >
        <CarouselContent className='hide-scrollbar px-4'>
          {posts.map((post) => (
            <CarouselItem key={post.id} className='max-w-[280px] pl-3 md:max-w-[316px]'>
              <Link href={`/e/blog/${post.slug}`} className='group block w-full text-left'>
                <motion.div
                  className='flex w-full flex-col justify-between'
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  <div className='flex aspect-video overflow-clip rounded-2xl rounded-b-none border dark:border-neutral-800'>
                    <div className='relative h-full w-full flex-1'>
                      <Image
                        src={post.feature_image || '/assets/img/placeholder.svg'}
                        alt={post.feature_image_alt || post.title}
                        fill
                        className='object-cover object-center'
                        sizes='(max-width: 768px) 280px, 316px'
                      />
                    </div>
                  </div>
                  <div className='min-h-[130px] rounded-2xl rounded-t-none border border-t-0 bg-gray-50 px-4 dark:border-neutral-800 dark:bg-neutral-950'>
                    <div className='mb-2 line-clamp-2 break-words pt-4 text-lg font-medium md:mb-3 lg:text-xl'>
                      {post.title}
                    </div>
                    <div className='mb-4 line-clamp-3 text-sm text-muted-foreground md:mb-8 lg:mb-6'>
                      {post.custom_excerpt || post.excerpt}
                    </div>
                  </div>
                </motion.div>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
