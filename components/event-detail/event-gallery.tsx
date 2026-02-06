'use client';

import { Button } from '@/components/ui/button';
import { EventDetail } from '@/lib/types/event';
import { isGif } from '@/lib/utils/image';
import { Camera, Share2 } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import PhotoUploadSheet from './photo-upload-sheet';

interface EventGalleryProps {
  event: EventDetail;
  currentUserId?: string;
  onImageClick?: (index: number) => void;
}

interface GalleryImageProps {
  src: string;
  index: number;
  onImageClick?: (index: number) => void;
}

function GalleryImage({ src, index, onImageClick }: GalleryImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const handleImageClick = () => {
    if (onImageClick) {
      onImageClick(index);
    }
  };

  return (
    <div
      onClick={handleImageClick}
      className='relative aspect-square cursor-pointer overflow-hidden rounded-md'
    >
      {isGif(src) ? (
        <img
          src={src}
          alt={`Gallery image ${index + 1}`}
          className={`h-full w-full object-cover transition-opacity ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setIsLoaded(true)}
        />
      ) : (
        <Image
          src={src}
          alt={`Gallery image ${index + 1}`}
          fill
          sizes='(max-width: 768px) 33vw, 20vw'
          className={`object-cover transition-opacity ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setIsLoaded(true)}
        />
      )}
      {!isLoaded && (
        <div className='absolute inset-0 flex items-center justify-center bg-gray-100'>
          <div className='h-8 w-8 animate-spin rounded-full border-t-2 border-solid border-red-500'></div>
        </div>
      )}
    </div>
  );
}

export default function EventGallery({ event, onImageClick }: EventGalleryProps) {
  const galleryImages = event.galleryImages || [];
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
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href);
      // You would typically show a toast notification here
      console.log('URL copied to clipboard');
    }
  };

  return (
    <div className='py-6'>
      {/* Action Buttons */}
      {galleryImages.length > 0 && (
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
      {galleryImages.length > 0 ? (
        <div className='grid grid-cols-3 gap-1 md:gap-2'>
          {galleryImages.map((image, index) => (
            <GalleryImage key={index} src={image} index={index} onImageClick={onImageClick} />
          ))}
        </div>
      ) : (
        <div className='flex flex-col items-center justify-center py-12 text-center'>
          <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100'>
            <Camera className='h-8 w-8 text-gray-400' />
          </div>
          <h3 className='mb-2 text-lg font-medium text-gray-900'>No Photos Yet</h3>
          <p className='mb-6 max-w-xs text-sm text-gray-500'>
            Be the first to add photos to this event. Photos added here will be visible to all event
            guests.
          </p>

          <Button
            onClick={handleAddPhoto}
            variant='default'
            className='gap-2 rounded-full px-5 py-2.5'
          >
            <Camera className='h-4 w-4' />
            Add Photos
          </Button>
        </div>
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
