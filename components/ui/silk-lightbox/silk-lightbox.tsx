'use client';
import { isGif } from '@/lib/utils/image';
import { Scroll, VisuallyHidden } from '@silk-hq/components';
import Image from 'next/image';
import React, { useEffect, useImperativeHandle, useRef } from 'react';
import { Lightbox } from './lightbox-core';

interface SilkLightboxProps {
  images: string[];
  initialIndex?: number;
  eventTitle?: string;
  showComments?: boolean;
  comments?: Array<{
    id: number;
    username: string;
    content: string;
  }>;
  onClose?: () => void;
}

export interface SilkLightboxRef {
  open: (index?: number) => void;
  close: () => void;
}

const SilkLightbox = React.forwardRef<SilkLightboxRef, SilkLightboxProps>(
  (
    {
      images,
      initialIndex = 0,
      eventTitle = 'Image',
      showComments = false,
      comments = [],
      onClose,
    },
    ref
  ) => {
    const [currentIndex, setCurrentIndex] = React.useState(initialIndex);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const lightboxViewRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(
      ref,
      () => ({
        open: (index = initialIndex) => {
          setCurrentIndex(index);
          triggerRef.current?.click();
        },
        close: () => {
          // The lightbox will close naturally via DismissTrigger
        },
      }),
      [initialIndex]
    );

    useEffect(() => {
      setCurrentIndex(initialIndex);
    }, [initialIndex]);

    useEffect(() => {
      if (images[currentIndex]) {
        const img = new window.Image();
        img.src = images[currentIndex];
      }
    }, [currentIndex, images]);

    // Apply inert attribute to prevent focus issues during transitions
    useEffect(() => {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'aria-hidden') {
            const target = mutation.target as HTMLElement;
            if (target.getAttribute('aria-hidden') === 'true') {
              target.setAttribute('inert', '');
            } else {
              target.removeAttribute('inert');
            }
          }
        });
      });

      if (lightboxViewRef.current) {
        observer.observe(lightboxViewRef.current, {
          attributes: true,
          attributeFilter: ['aria-hidden'],
        });
      }

      return () => observer.disconnect();
    }, []);

    const handleImageClick = () => {
      if (images.length > 1) {
        const nextIndex = (currentIndex + 1) % images.length;
        setCurrentIndex(nextIndex);
      }
    };

    const sideContent = showComments && comments.length > 0 && (
      <ul className='m-0 space-y-5 px-4 py-4'>
        {comments.map((comment) => (
          <li key={comment.id} className='flex gap-2'>
            <div className='h-9 w-9 flex-shrink-0 rounded-full border border-black/5 bg-gradient-to-br from-teal-400 to-teal-300' />
            <div className='flex flex-col gap-1 rounded-2xl bg-gray-800 px-3 py-2'>
              <div className='text-sm font-bold text-gray-100'>{comment.username}</div>
              <div className='text-sm font-normal leading-5 text-gray-50'>{comment.content}</div>
            </div>
          </li>
        ))}
      </ul>
    );

    if (images.length === 0) return null;

    return (
      <Lightbox.Root>
        {/* Hidden trigger that we click programmatically - exactly like ExampleLightbox */}
        <Lightbox.Trigger ref={triggerRef} style={{ display: 'none' }} />

        <Lightbox.Portal>
          <Lightbox.View ref={lightboxViewRef}>
            <Lightbox.Backdrop />
            <Lightbox.Content>
              <Image
                src={images[currentIndex]}
                alt={`${eventTitle} - Image ${currentIndex + 1}`}
                width={1200}
                height={1200}
                className='max-h-full max-w-full cursor-pointer object-contain'
                priority
                draggable={false}
                onClick={handleImageClick}
                unoptimized={isGif(images[currentIndex])}
              />
            </Lightbox.Content>

            {/* Use exact ExampleLightbox DismissTrigger pattern */}
            <Lightbox.DismissTrigger className='ExampleLightbox-dismissTrigger' tabIndex={-1}>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeLinecap='round'
                strokeLinejoin='round'
                className='ExampleLightbox-dismissIcon'
              >
                <path d='M18 6 6 18' />
                <path d='m6 6 12 12' />
              </svg>
              <VisuallyHidden.Root>Dismiss Sheet</VisuallyHidden.Root>
            </Lightbox.DismissTrigger>

            {/* Image counter for multiple images */}
            {images.length > 1 && (
              <div className='fixed right-2 top-2 z-10 rounded-full bg-black/50 px-3 py-1 text-sm text-white'>
                {currentIndex + 1} of {images.length}
              </div>
            )}

            {/* Large viewport side content - exactly like ExampleLightbox */}
            {showComments && comments.length > 0 && (
              <Lightbox.SideContent>
                <div className='ExampleLightbox-sidebarContainer'>
                  <h2 className='ExampleLightbox-sidebarTitle'>Comments</h2>
                  <Scroll.Root asChild>
                    <Scroll.View className='ExampleLightbox-sidebarScrollView' safeArea='none'>
                      <Scroll.Content>{sideContent}</Scroll.Content>
                    </Scroll.View>
                  </Scroll.Root>
                </div>
              </Lightbox.SideContent>
            )}

            {/* Small viewport side sheet - exactly like ExampleLightbox */}
            {showComments && comments.length > 0 && (
              <Lightbox.SideSheetRoot>
                <Lightbox.SideSheetPresentTrigger className='ExampleLightbox-sideSheetPresentTrigger'>
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2.2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    className='ExampleLightbox-sideSheetPresentTriggerIcon'
                  >
                    <path d='M7.9 20A9 9 0 1 0 4 16.1L2 22Z' />
                  </svg>
                  <div className='ExampleLightbox-sideSheetPresentTriggerText'>Comments</div>
                </Lightbox.SideSheetPresentTrigger>

                <Lightbox.SideSheetPortal>
                  <Lightbox.SideSheetView>
                    <Lightbox.SideSheetBackdrop />
                    <Lightbox.SideSheetContent className='ExampleLightbox-sideSheetContent'>
                      <div className='ExampleLightbox-sideSheetHeader'>
                        <Lightbox.SideSheetTrigger
                          className='ExampleLightbox-sideSheetDismissTrigger'
                          action='dismiss'
                          tabIndex={-1}
                        >
                          <svg
                            xmlns='http://www.w3.org/2000/svg'
                            viewBox='0 0 20 20'
                            fill='currentColor'
                            className='ExampleLightbox-sideSheetDismissIcon'
                          >
                            <path
                              fillRule='evenodd'
                              d='M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z'
                              clipRule='evenodd'
                            />
                          </svg>
                        </Lightbox.SideSheetTrigger>
                        <Lightbox.SideSheetTitle className='ExampleLightbox-sideSheetTitle'>
                          Comments
                        </Lightbox.SideSheetTitle>
                      </div>
                      <Lightbox.SideSheetScrollRoot asChild>
                        <Lightbox.SideSheetScrollView className='ExampleLightbox-sideSheetScrollView'>
                          <Lightbox.SideSheetScrollContent>
                            {sideContent}
                          </Lightbox.SideSheetScrollContent>
                        </Lightbox.SideSheetScrollView>
                      </Lightbox.SideSheetScrollRoot>
                    </Lightbox.SideSheetContent>
                  </Lightbox.SideSheetView>
                </Lightbox.SideSheetPortal>
              </Lightbox.SideSheetRoot>
            )}
          </Lightbox.View>
        </Lightbox.Portal>
      </Lightbox.Root>
    );
  }
);

SilkLightbox.displayName = 'SilkLightbox';

export { SilkLightbox };
