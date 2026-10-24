'use client';

import GalleryItem from '@/components/event-detail/gallery-item';
import PhotoUploadSheet from '@/components/event-detail/photo-upload-sheet';
import { LightboxViewer } from '@/components/lightbox-viewer';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/hooks/use-auth';
import { useDeleteGalleryItem } from '@/lib/hooks/use-delete-gallery-item';
import { useEventDetails } from '@/lib/hooks/use-event-details';
import { useEventGallery } from '@/lib/hooks/use-event-gallery';
import { useEventHosts } from '@/lib/hooks/use-event-hosts';
import { getOptimizedImageUrlPreservingGif } from '@/lib/utils/image';
import { logger } from '@/lib/utils/logger';
import { ArrowLeft, Plus, Share } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';

export default function GalleryPage() {
  const t = useTranslations('eventSocial');
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [uploadSheetOpen, setUploadSheetOpen] = useState(false);
  const eventId = params.id as string;
  const { data: eventData, isLoading: eventLoading } = useEventDetails(eventId);
  const { data: galleryData = [], isLoading: galleryLoading } = useEventGallery(eventId);
  const { data: hostsData = [] } = useEventHosts(eventId);
  const { mutateAsync: deleteGalleryItem } = useDeleteGalleryItem();

  const isEventHost = useMemo(() => {
    if (!user?.id) return false;
    if (eventData?.creator_user_id === user.id) return true;
    return hostsData.some((host) => host.user_details?.id === user.id);
  }, [eventData?.creator_user_id, hostsData, user?.id]);

  const lightboxImages = useMemo(
    () =>
      galleryData.map((item) => ({
        id: item.id,
        image: getOptimizedImageUrlPreservingGif(item.url, 1200, 90),
        user_details: item.user_details,
        created_at: item.created_at,
      })),
    [galleryData]
  );
  const selectedGalleryItem =
    selectedImageIndex === null ? null : galleryData[selectedImageIndex] || null;
  const canDeleteSelectedGalleryItem = Boolean(
    selectedGalleryItem && (isEventHost || selectedGalleryItem.user_details?.id === user?.id)
  );

  const handleDeleteGalleryItem = useCallback(
    async (photoId: string) => {
      try {
        await deleteGalleryItem({ galleryItemId: photoId, eventId });
        return { success: true };
      } catch {
        return { success: false };
      }
    },
    [deleteGalleryItem, eventId]
  );

  if (eventLoading || galleryLoading) {
    return (
      <div className='min-h-screen bg-gray-50 dark:bg-neutral-950'>
        <div className='mx-auto max-w-full bg-white dark:bg-neutral-900 md:max-w-sm'>
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

  if (!eventData) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50 dark:bg-neutral-950'>
        <div className='text-center'>
          <h1 className='mb-2 text-2xl font-bold text-gray-900 dark:text-neutral-100'>
            {t('galleryPage.notFoundTitle')}
          </h1>
          <p className='mb-4 text-gray-600 dark:text-neutral-400'>
            {t('galleryPage.notFoundDescription')}
          </p>
          <button
            onClick={() => router.back()}
            className='rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
          >
            {t('galleryPage.goBack')}
          </button>
        </div>
      </div>
    );
  }

  const galleryImages = galleryData || [];
  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
  };

  const handleShareGallery = async () => {
    const galleryUrl = `${window.location.origin}/e/${eventId}/gallery`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: t('galleryPage.shareTitle', { title: eventData.title }),
          text: t('galleryPage.shareText', { title: eventData.title }),
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
      alert(t('galleryPage.linkCopied'));
    }
  };

  const handleAddPhoto = () => {
    setUploadSheetOpen(true);
  };

  return (
    <div className='mx-auto min-h-screen max-w-full bg-white dark:bg-neutral-900 md:max-w-sm'>
      {/* Header */}
      <div className='sticky top-0 z-40 flex items-center justify-between border-b border-gray-100 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900'>
        <div className='flex items-center gap-4'>
          <button
            type='button'
            onClick={() => router.back()}
            aria-label={t('galleryPage.goBackAria')}
            className='rounded-full p-2 hover:bg-gray-100 dark:hover:bg-neutral-800'
          >
            <ArrowLeft className='h-5 w-5' />
          </button>
          <div>
            <h1 className='text-xl font-semibold'>{t('galleryPage.title')}</h1>
            <p className='text-sm text-gray-500 dark:text-neutral-400'>
              {t('galleryPage.photoCount', { count: galleryImages.length })}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={handleShareGallery}
            aria-label={t('galleryPage.shareAria')}
            className='rounded-full p-2 hover:bg-gray-100 dark:hover:bg-neutral-800'
            title={t('galleryPage.shareButtonTitle')}
          >
            <Share className='h-5 w-5 text-gray-600 dark:text-neutral-400' />
          </button>
          {isEventHost && (
            <button
              type='button'
              onClick={handleAddPhoto}
              aria-label={t('galleryPage.addPhotosAria')}
              className='rounded-full p-2 hover:bg-gray-100 dark:hover:bg-neutral-800'
              title={t('galleryPage.addPhotosTitle')}
            >
              <Plus className='h-5 w-5 text-gray-600 dark:text-neutral-400' />
            </button>
          )}
        </div>
      </div>

      {/* Gallery Grid */}
      <div className='p-4'>
        {galleryImages.length > 0 ? (
          <div className='grid grid-cols-2 gap-2 sm:grid-cols-3'>
            {galleryImages.map((image, index) => (
              <GalleryItem
                key={image.id}
                item={image}
                currentUserId={user?.id || ''}
                eventId={eventId}
                isEventHost={isEventHost}
                onImageClick={() => handleImageClick(index)}
              />
            ))}
          </div>
        ) : (
          <div className='py-16 text-center'>
            <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800'>
              <svg
                className='h-8 w-8 text-gray-400 dark:text-neutral-500'
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
            <h3 className='mb-2 text-lg font-medium text-gray-900 dark:text-neutral-100'>
              {t('galleryPage.emptyTitle')}
            </h3>
            <p className='text-sm text-gray-500 dark:text-neutral-400'>
              {t('galleryPage.emptyDescription')}
            </p>
          </div>
        )}
      </div>

      {/* Image Lightbox */}
      <LightboxViewer
        images={lightboxImages}
        selectedImage={selectedImageIndex}
        onClose={() => setSelectedImageIndex(null)}
        onImageChange={(index: number) => setSelectedImageIndex(index)}
        showDropdownMenu={canDeleteSelectedGalleryItem}
        handleDelete={handleDeleteGalleryItem}
        userId={user?.id || ''}
        eventId={eventId}
      />

      <PhotoUploadSheet
        isOpen={uploadSheetOpen}
        onClose={() => setUploadSheetOpen(false)}
        eventId={eventId}
      />
    </div>
  );
}
