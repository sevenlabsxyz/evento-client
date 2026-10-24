'use client';

import { Button } from '@/components/ui/button';
import { GalleryItem as GalleryItemType } from '@/lib/hooks/use-event-gallery';
import { EventDetail } from '@/lib/types/event';
import { logger } from '@/lib/utils/logger';
import { Camera, Share2 } from 'lucide-react';
import { useState } from 'react';
import GalleryItem from './gallery-item';
import PhotoUploadSheet from './photo-upload-sheet';

interface EventGalleryProps {
  event: EventDetail;
  galleryItems: GalleryItemType[];
  currentUserId?: string;
  isEventHost?: boolean;
  onImageClick?: (index: number) => void;
}

export default function EventGallery({
  event,
  galleryItems,
  currentUserId = '',
  isEventHost = false,
  onImageClick,
}: EventGalleryProps) {
  const [uploadSheetOpen, setUploadSheetOpen] = useState(false);

  const handleAddPhoto = () => {
    setUploadSheetOpen(true);
  };

  const handleShareAlbum = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${event.title} - Photo Gallery`,
          text: `Check out photos from ${event.title}`,
          url: window.location.href,
        });
      } catch (error) {
        logger.error('Error sharing', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href);
      // You would typically show a toast notification here
      logger.info('URL copied to clipboard');
    }
  };

  return (
    <div>
      {/* Header actions */}
      <div className='mb-3 flex items-center justify-between gap-3'>
        <p className='text-sm text-gray-500 dark:text-neutral-500'>
          {galleryItems.length > 0
            ? `${galleryItems.length} ${galleryItems.length === 1 ? 'photo' : 'photos'}`
            : 'Shared by guests'}
        </p>
        <div className='flex items-center gap-2'>
          {galleryItems.length > 0 && (
            <Button
              onClick={handleShareAlbum}
              variant='outline'
              size='sm'
              className='h-8 gap-1.5 rounded-full border-gray-200 bg-white px-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100'
            >
              <Share2 className='h-3.5 w-3.5' />
              Share Album
            </Button>
          )}
          <Button
            onClick={handleAddPhoto}
            size='sm'
            className='h-8 gap-1.5 rounded-full bg-red-600 px-3 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600'
          >
            <Camera className='h-3.5 w-3.5' />
            Add Photos
          </Button>
        </div>
      </div>

      {/* Gallery Grid */}
      {galleryItems.length > 0 ? (
        <div className='grid grid-cols-2 gap-2 sm:grid-cols-3'>
          {galleryItems.map((item, index) => (
            <GalleryItem
              key={item.id}
              item={item}
              currentUserId={currentUserId}
              eventId={event.id}
              isEventHost={isEventHost}
              onImageClick={() => onImageClick?.(index)}
            />
          ))}
        </div>
      ) : (
        <button
          type='button'
          onClick={handleAddPhoto}
          className='flex w-full items-center gap-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-4 text-left transition-colors hover:border-gray-400 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:border-neutral-700 dark:bg-neutral-800/60 dark:hover:border-neutral-600 dark:hover:bg-neutral-800'
        >
          <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-gray-500 ring-1 ring-gray-200 dark:bg-neutral-900 dark:text-neutral-400 dark:ring-neutral-700'>
            <Camera className='h-5 w-5' />
          </span>
          <span className='min-w-0'>
            <span className='block text-sm font-medium text-gray-900 dark:text-neutral-100'>
              No photos yet
            </span>
            <span className='block text-sm text-gray-500 dark:text-neutral-500'>
              Be the first to add photos — they&apos;re visible to all guests.
            </span>
          </span>
        </button>
      )}

      {/* Photo Upload Sheet */}
      <PhotoUploadSheet
        isOpen={uploadSheetOpen}
        onClose={() => setUploadSheetOpen(false)}
        eventId={event.id}
      />
    </div>
  );
}
