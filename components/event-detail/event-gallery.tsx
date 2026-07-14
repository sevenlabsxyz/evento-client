'use client';

import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
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
    <div className='py-6'>
      {/* Action Buttons */}
      {galleryItems.length > 0 && (
        <div className='mb-6 flex items-center justify-between gap-3'>
          <Button
            onClick={handleAddPhoto}
            variant='outline'
            className='flex-1 gap-2 rounded-full border-gray-200 bg-white py-5 text-gray-700 hover:bg-gray-50 hover:text-black'
          >
            <Camera className='h-4 w-4' />
            Add Photos
          </Button>

          <Button
            onClick={handleShareAlbum}
            variant='outline'
            className='flex-1 gap-2 rounded-full border-gray-200 bg-white py-5 text-gray-700 hover:bg-gray-50 hover:text-black'
          >
            <Share2 className='h-4 w-4' />
            Share Album
          </Button>
        </div>
      )}

      {/* Gallery Grid */}
      {galleryItems.length > 0 ? (
        <div className='grid grid-cols-3 gap-1 md:gap-2'>
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
        <Empty className='py-12'>
          <EmptyHeader>
            <EmptyMedia variant='soft-squircle'>
              <Camera className='h-8 w-8' />
            </EmptyMedia>
            <EmptyTitle>No Photos Yet</EmptyTitle>
            <EmptyDescription>
              Be the first to add photos to this event. Photos added here will be visible to all
              event guests.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              onClick={handleAddPhoto}
              variant='default'
              className='gap-2 rounded-full px-5 py-2.5'
            >
              <Camera className='h-4 w-4' />
              Add Photos
            </Button>
          </EmptyContent>
        </Empty>
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
