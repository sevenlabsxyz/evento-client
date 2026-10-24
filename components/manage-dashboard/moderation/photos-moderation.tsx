'use client';

import { LightboxViewer } from '@/components/lightbox-viewer';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useAuth } from '@/lib/hooks/use-auth';
import { useDeleteGalleryItem } from '@/lib/hooks/use-delete-gallery-item';
import { useEventGallery, type GalleryItem } from '@/lib/hooks/use-event-gallery';
import { queryKeys } from '@/lib/query-client';
import { getErrorMessage } from '@/lib/utils/error-message';
import { getOptimizedImageUrlPreservingGif } from '@/lib/utils/image';
import { logger } from '@/lib/utils/logger';
import { toast } from '@/lib/utils/toast';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ImageIcon, Loader2, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

interface PhotosModerationProps {
  eventId: string;
}

export function PhotosModeration({ eventId }: PhotosModerationProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: photos = [], isLoading, error, refetch } = useEventGallery(eventId);
  const { mutateAsync: deleteGalleryItem, isPending: isDeleting } = useDeleteGalleryItem();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<GalleryItem | null>(null);

  const lightboxImages = useMemo(
    () =>
      photos.map((item) => ({
        id: item.id,
        image: getOptimizedImageUrlPreservingGif(item.url, 1200, 90),
        user_details: item.user_details,
        created_at: item.created_at,
      })),
    [photos]
  );

  const deletePhoto = useCallback(
    async (galleryItemId: string) => {
      await deleteGalleryItem({ galleryItemId, eventId });
      await queryClient.invalidateQueries({ queryKey: queryKeys.eventDashboard(eventId) });
    },
    [deleteGalleryItem, eventId, queryClient]
  );

  // Lightbox owns its own confirm + toast-on-failure flow; it only needs a success flag.
  const handleLightboxDelete = useCallback(
    async (photoId: string) => {
      try {
        await deletePhoto(photoId);
        toast.success('Photo deleted');
        return { success: true };
      } catch (deleteError) {
        logger.error('Failed to delete photo', { error: getErrorMessage(deleteError), eventId });
        return { success: false };
      }
    },
    [deletePhoto, eventId]
  );

  const handleConfirmDelete = async () => {
    if (!pendingDelete) {
      return;
    }

    try {
      await deletePhoto(pendingDelete.id);
      toast.success('Photo deleted');
      setPendingDelete(null);
    } catch (deleteError) {
      const message = getErrorMessage(deleteError) || 'Failed to delete photo';
      toast.error(message);
      logger.error('Failed to delete photo', { error: message, eventId });
    }
  };

  if (isLoading) {
    return (
      <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4'>
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className='aspect-square w-full rounded-xl' />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className='rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-neutral-800 dark:bg-neutral-900'>
        <p className='mb-1 font-medium text-gray-900 dark:text-neutral-100'>
          Couldn&apos;t load photos
        </p>
        <p className='mb-4 text-sm text-gray-500 dark:text-neutral-400'>
          {getErrorMessage(error) || 'Something went wrong. Please try again.'}
        </p>
        <Button variant='outline' size='sm' onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className='rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center dark:border-neutral-800 dark:bg-neutral-900'>
        <div className='mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800'>
          <ImageIcon className='h-6 w-6 text-gray-400 dark:text-neutral-500' />
        </div>
        <h3 className='mb-1 text-base font-semibold text-gray-900 dark:text-neutral-100'>
          No photos yet
        </h3>
        <p className='text-sm text-gray-500 dark:text-neutral-400'>
          Photos you and your guests add to the event gallery will show up here.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4'>
        {photos.map((photo, index) => {
          const uploaderName =
            photo.user_details?.name || photo.user_details?.username || 'Unknown';

          return (
            <div
              key={photo.id}
              className='group relative aspect-square overflow-hidden rounded-xl border border-gray-200 bg-gray-100 dark:border-neutral-800 dark:bg-neutral-800'
            >
              <button
                type='button'
                aria-label={`Open photo by ${uploaderName}`}
                onClick={() => setSelectedIndex(index)}
                className='absolute inset-0 h-full w-full'
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getOptimizedImageUrlPreservingGif(photo.url, 400, 75)}
                  alt={`Photo by ${uploaderName}`}
                  loading='lazy'
                  className='h-full w-full object-cover transition-transform duration-300 group-hover:scale-105'
                />
              </button>

              <div className='pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-2 pt-8'>
                <UserAvatar user={photo.user_details} size='xs' />
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-xs font-medium text-white'>{uploaderName}</p>
                  <p className='truncate text-[11px] text-white/80'>
                    {format(new Date(photo.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>

              <Button
                type='button'
                variant='secondary'
                size='icon'
                aria-label='Delete photo'
                onClick={() => setPendingDelete(photo)}
                className='absolute right-2 top-2 h-8 w-8 rounded-full bg-white/90 text-red-600 shadow-sm hover:bg-white dark:bg-neutral-900/90 dark:text-red-400 dark:hover:bg-neutral-900'
              >
                <Trash2 className='h-4 w-4' />
              </Button>
            </div>
          );
        })}
      </div>

      <LightboxViewer
        images={lightboxImages}
        selectedImage={selectedIndex}
        onClose={() => setSelectedIndex(null)}
        onImageChange={setSelectedIndex}
        showDropdownMenu
        handleDelete={handleLightboxDelete}
        userId={user?.id || ''}
        eventId={eventId}
      />

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setPendingDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete photo</AlertDialogTitle>
            <AlertDialogDescription>
              This photo will be permanently removed from the event gallery. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {pendingDelete && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={getOptimizedImageUrlPreservingGif(pendingDelete.url, 400, 75)}
              alt='Photo to delete'
              className='mx-auto max-h-48 rounded-xl object-contain'
            />
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleConfirmDelete();
              }}
              disabled={isDeleting}
              className='bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:text-white dark:hover:bg-red-700'
            >
              {isDeleting ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
