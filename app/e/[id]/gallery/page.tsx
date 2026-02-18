'use client';

import { LightboxViewer } from '@/components/lightbox-viewer';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/hooks/use-auth';
import { useEventDetails } from '@/lib/hooks/use-event-details';
import { useEventGallery } from '@/lib/hooks/use-event-gallery';
import { getOptimizedImageUrl } from '@/lib/utils/image';
import { logger } from '@/lib/utils/logger';
import { ArrowLeft, Plus, Share } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function GalleryPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const eventId = params.id as string;
  const { data: eventData, isLoading: eventLoading } = useEventDetails(eventId);
  const { data: galleryData = [], isLoading: galleryLoading } = useEventGallery(eventId);

  if (eventLoading || galleryLoading) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <div className='mx-auto max-w-full bg-white md:max-w-sm'>
          <div className='space-y-4 p-6'>
            {/* Header skeleton */}
            <div className='flex items-center justify-between'>
              <Skeleton className='h-8 w-8 rounded-full' />
              <Skeleton className='h-6 w-32' />
              <Skeleton className='h-8 w-8 rounded-full' />
            </div>
            {/* Gallery grid skeleton */}
            <div className='grid grid-cols-2 gap-4'>
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className='aspect-square w-full rounded-lg' />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!eventData || galleryData.length === 0) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <h1 className='mb-2 text-2xl font-bold text-gray-900'>Event Not Found</h1>
          <p className='mb-4 text-gray-600'>
            The event you&apos;re trying to view doesn&apos;t exist.
          </p>
          <button
            onClick={() => router.back()}
            className='rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600'
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const galleryImages = galleryData || [];
  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
  };

  const isOwner = eventData?.user_details?.id === user?.id;

  const handleShareGallery = async () => {
    const galleryUrl = `${window.location.origin}/e/event/${eventId}/gallery`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${eventData.title} - Gallery`,
          text: `Check out photos from ${eventData.title}`,
          url: galleryUrl,
        });
      } catch (error) {
        logger.error('Error sharing', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(galleryUrl);
      // Could show a toast notification here
      alert('Gallery link copied to clipboard!');
    }
  };

  const handleAddPhoto = () => {
    // TODO: Implement photo upload functionality
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        logger.debug('Selected files', {
          files: Array.from(files).map((f) => f.name),
        });
        // TODO: Handle file upload
      }
    };
    input.click();
  };

  return (
    <div className='mx-auto min-h-screen max-w-full bg-white md:max-w-sm'>
      {/* Header */}
      <div className='sticky top-0 z-40 flex items-center justify-between border-b border-gray-100 bg-white p-4'>
        <div className='flex items-center gap-4'>
          <button onClick={() => router.back()} className='rounded-full p-2 hover:bg-gray-100'>
            <ArrowLeft className='h-5 w-5' />
          </button>
          <div>
            <h1 className='text-xl font-semibold'>Gallery</h1>
            <p className='text-sm text-gray-500'>{galleryImages.length} photos</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex items-center gap-2'>
          <button
            onClick={handleShareGallery}
            className='rounded-full p-2 hover:bg-gray-100'
            title='Share Gallery'
          >
            <Share className='h-5 w-5 text-gray-600' />
          </button>
          {isOwner && (
            <button
              onClick={handleAddPhoto}
              className='rounded-full p-2 hover:bg-gray-100'
              title='Add Photos'
            >
              <Plus className='h-5 w-5 text-gray-600' />
            </button>
          )}
        </div>
      </div>

      {/* Gallery Grid */}
      <div className='p-4'>
        {galleryImages.length > 0 ? (
          <div className='grid grid-cols-2 gap-2 sm:grid-cols-3'>
            {galleryImages.map((image, index) => (
              <button
                key={index}
                onClick={() => handleImageClick(index)}
                className='aspect-square overflow-hidden rounded-lg bg-gray-200 transition-opacity hover:opacity-90'
              >
                <img
                  src={getOptimizedImageUrl(image.url)}
                  alt={`Gallery image ${index + 1}`}
                  className='h-full w-full object-cover'
                />
              </button>
            ))}
          </div>
        ) : (
          <div className='py-16 text-center'>
            <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100'>
              <svg
                className='h-8 w-8 text-gray-400'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
                />
              </svg>
            </div>
            <h3 className='mb-2 text-lg font-medium text-gray-900'>No Photos Yet</h3>
            <p className='text-sm text-gray-500'>
              Photos from this event will appear here once they&apos;re added.
            </p>
          </div>
        )}
      </div>

      {/* Image Lightbox */}
      <LightboxViewer
        images={galleryImages.map((image) => ({
          id: image.id,
          image: image.url,
          user_details: image.user_details,
          created_at: image.created_at,
        }))}
        selectedImage={selectedImageIndex}
        onClose={() => setSelectedImageIndex(null)}
        onImageChange={(index: number) => setSelectedImageIndex(index)}
        handleDelete={async (photoId: string) => {
          try {
            // TODO: Implement actual delete functionality
            logger.info('Deleting photo', { photoId });
            // For now, just return success - this will be implemented later
            return { success: true };
          } catch (error) {
            logger.error('Error deleting photo', {
              error: error instanceof Error ? error.message : String(error),
            });
            return { success: false };
          }
        }}
        userId={user?.id || ''}
        eventId={eventId}
      />
    </div>
  );
}
