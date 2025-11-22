'use client';

import { ArrowLeft, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import type { CarouselApi } from '@/components/ui/carousel';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { Skeleton } from '@/components/ui/skeleton';
import { WalletEducationalSheet } from '@/components/wallet/wallet-educational-sheet';
import { Env } from '@/lib/constants/env';

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  feature_image: string;
  published_at: string;
  html: string;
  tags: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  authors: Array<{
    id: string;
    name: string;
    profile_image: string;
  }>;
}

export function HubBlogGallery() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<BlogPost | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  // Fetch blog posts from Ghost API
  useEffect(() => {
    const fetchPosts = async () => {
      // Check for required environment variables
      if (!Env.NEXT_PUBLIC_GHOST_URL || !Env.NEXT_PUBLIC_GHOST_CONTENT_API_KEY) {
        console.warn('Ghost API configuration missing - cannot fetch blog content');
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `${Env.NEXT_PUBLIC_GHOST_URL}/ghost/api/content/posts/?key=${Env.NEXT_PUBLIC_GHOST_CONTENT_API_KEY}&filter=tag:hub&include=tags,authors&limit=10`
        );

        if (!res.ok) {
          console.error('Failed to fetch hub blog posts:', res.status);
          setIsLoading(false);
          return;
        }

        const data = await res.json();
        setPosts(data.posts || []);
      } catch (error) {
        console.error('Error fetching hub blog posts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []);

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

  // Loading skeleton
  if (isLoading) {
    return (
      <div className='space-y-3'>
        <h3 className='font-semibold'>Latest from our Blog</h3>
        <div className='flex gap-3 overflow-x-hidden'>
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              className='h-96 flex-shrink-0 rounded-2xl'
              style={{ width: '452px' }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Don't show section if no posts
  if (posts.length === 0) {
    return null;
  }

  return (
    <>
      <div className='space-y-3 pb-2 pt-4'>
        <div className='flex items-center justify-between'>
          <h3 className='font-semibold'>Latest from our Blog</h3>
          <div className='flex items-center gap-2'>
            <Button
              size='icon'
              variant='outline'
              onClick={() => {
                carouselApi?.scrollPrev();
              }}
              disabled={!canScrollPrev}
              className='rounded-full disabled:pointer-events-auto'
            >
              <ArrowLeft className='size-5' />
            </Button>
            <Button
              size='icon'
              variant='outline'
              onClick={() => {
                carouselApi?.scrollNext();
              }}
              disabled={!canScrollNext}
              className='rounded-full disabled:pointer-events-auto'
            >
              <ArrowRight className='size-5' />
            </Button>
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
              <CarouselItem key={post.id} className='max-w-[280px] pl-3 md:max-w-[452px]'>
                <button
                  onClick={() => {
                    setSelectedArticle(post);
                    setIsSheetOpen(true);
                  }}
                  className='group flex w-full flex-col justify-between text-left'
                >
                  <div>
                    <div className='flex aspect-video overflow-clip rounded-2xl rounded-b-none border'>
                      <div className='flex-1'>
                        <div className='relative h-full w-full'>
                          <Image
                            src={post.feature_image || '/assets/img/placeholder.svg'}
                            alt={post.title}
                            fill
                            className='object-cover object-center'
                            sizes='(max-width: 768px) 280px, 452px'
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className='min-h-[130px] rounded-2xl rounded-t-none border border-t-0 bg-gray-50 px-4'>
                    <div className='mb-2 line-clamp-2 break-words pt-4 text-lg font-medium md:mb-3 md:pt-4 md:text-xl lg:pt-4 lg:text-2xl'>
                      {post.title}
                    </div>
                    <div className='mb-4 line-clamp-3 text-sm text-muted-foreground md:mb-12 md:text-base lg:mb-9'>
                      {post.excerpt}
                    </div>
                  </div>
                </button>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      {/* Blog Content Modal */}
      <WalletEducationalSheet
        article={selectedArticle}
        open={isSheetOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsSheetOpen(false);
            // Delay clearing to allow exit animation to complete
            setTimeout(() => setSelectedArticle(null), 400);
          }
        }}
      />
    </>
  );
}
