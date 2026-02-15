'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { MiniListItem } from '@/components/ui/mini-list-item';
import { Modal } from '@/components/ui/modal';
import { UserDetails } from '@/lib/types/api';
import { getOptimizedImageUrl } from '@/lib/utils/image';
import { logger } from '@/lib/utils/logger';
import { toast } from '@/lib/utils/toast';

interface GalleryImageObject {
  id: string;
  image: string;
  user_details: Partial<UserDetails> & { id?: string };
  created_at?: string;
}

type GalleryImage = string | GalleryImageObject;

// Type guard functions
const isGalleryImageObject = (image: GalleryImage): image is GalleryImageObject => {
  return typeof image === 'object' && image !== null && 'image' in image;
};

const getImageUrl = (image: GalleryImage): string => {
  const rawUrl = isGalleryImageObject(image) ? image.image : image;

  if (rawUrl.startsWith('/users/') || rawUrl.startsWith('users/')) {
    return getOptimizedImageUrl(rawUrl, 1200, 90);
  }

  return rawUrl;
};

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Download,
  Loader2,
  MoreHorizontal,
  Trash2,
  XIcon,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import { DeleteConfirmation } from './delete-confirmation';
import { GalleryDropdownMenu } from './dropdown-menu';
import { LikeButton } from './like-button';

export interface LightboxViewerProps {
  images: GalleryImage[];
  selectedImage: number | null;
  onClose: () => void;
  onImageChange: (index: number) => void;
  showDropdownMenu?: boolean;
  handleDelete: (photoId: string) => Promise<{ success: boolean }>;
  userId: string;
  eventId: string;
}

const MobileGalleryMenu = React.memo(
  ({
    photoId,
    handleDelete,
  }: {
    photoId: string;
    handleDelete: (photoId: string) => Promise<{ success: boolean }>;
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleConfirmDelete = async () => {
      setIsDeleting(true);
      try {
        const result = await handleDelete(photoId);
        if (result.success) {
          setIsDialogOpen(false);
          setIsOpen(false);
        } else {
          toast.error('Failed to delete photo. Please try again.');
        }
      } catch (error) {
        logger.error('Error deleting photo', { error });
        toast.error('Failed to delete photo. Please try again.');
      } finally {
        setIsDeleting(false);
      }
    };

    return (
      <>
        <Button variant='secondary' size='icon' onClick={() => setIsOpen(true)}>
          <MoreHorizontal className='h-4 w-4' />
          <span className='sr-only'>Open menu</span>
        </Button>
        <Modal open={isOpen} setOpen={setIsOpen}>
          <div className='px-2 pb-6 pt-4'>
            <MiniListItem
              icon={<Trash2 className='mr-2.5 h-5 w-5 text-red-400' />}
              text='Delete photo'
              onClick={() => setIsDialogOpen(true)}
            />
          </div>
        </Modal>

        <DeleteConfirmation
          isOpen={isDialogOpen}
          setIsOpen={setIsDialogOpen}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeleting}
        />
      </>
    );
  }
);

export const LightboxViewer = React.memo(
  ({
    images,
    selectedImage,
    onClose,
    onImageChange,
    showDropdownMenu = false,
    handleDelete,
    userId,
    eventId,
  }: LightboxViewerProps) => {
    const [isDownloading, setIsDownloading] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);
    const [imageError, setImageError] = useState(false);
    const downloadControllerRef = useRef<AbortController | null>(null);

    const goToNext = useCallback(() => {
      if (selectedImage !== null && images.length > 1) {
        const nextIndex = (selectedImage + 1) % images.length;
        onImageChange(nextIndex);
        setImageLoading(true);
        setImageError(false);
      }
    }, [selectedImage, images.length, onImageChange]);

    const goToPrevious = useCallback(() => {
      if (selectedImage !== null && images.length > 1) {
        const prevIndex = (selectedImage - 1 + images.length) % images.length;
        onImageChange(prevIndex);
        setImageLoading(true);
        setImageError(false);
      }
    }, [selectedImage, images.length, onImageChange]);

    const preventDragHandler = (e: React.DragEvent<HTMLImageElement>) => {
      e.preventDefault();
    };

    const getFileExtension = (url: string) => {
      const urlWithoutParams = url.split('?')[0];
      const fileName = urlWithoutParams.split('/').pop();
      if (fileName) {
        const extension = fileName.split('.').pop()?.toLowerCase();
        return extension === 'jpg' || extension === 'jpeg'
          ? 'jpg'
          : extension === 'png'
            ? 'png'
            : extension === 'webp'
              ? 'webp'
              : 'png';
      }
      return 'png';
    };

    const downloadImage = useCallback(async () => {
      if (selectedImage !== null) {
        // Cancel any existing download
        if (downloadControllerRef.current) {
          downloadControllerRef.current.abort();
        }

        const controller = new AbortController();
        downloadControllerRef.current = controller;

        setIsDownloading(true);
        try {
          const currentImage = images[selectedImage];
          const imageUrl = getImageUrl(currentImage);
          const extension = getFileExtension(imageUrl);
          const fileName = `gallery-image-${selectedImage + 1}.${extension}`;

          if (typeof window !== 'undefined') {
            const isIOS = /iPad|iPhone|iPod/.test(window.navigator.userAgent);

            if (isIOS) {
              // Check if Web Share API is supported
              if (navigator.share) {
                try {
                  const response = await fetch(imageUrl, { signal: controller.signal });
                  if (!response.ok) throw new Error('Network response was not ok');
                  const blob = await response.blob();
                  const file = new File([blob], fileName, { type: blob.type });

                  await navigator.share({
                    files: [file],
                    title: 'Save Image',
                  });
                  toast.success('Image shared successfully!');
                } catch (error) {
                  if ((error as Error).name !== 'AbortError') {
                    logger.error('Error sharing image', { error });
                    // Fallback to opening in new tab if sharing fails
                    window.open(imageUrl, '_blank');
                    toast.info('Image opened in new tab');
                  }
                }
              } else {
                // Fallback for iOS devices without Share API support
                window.open(imageUrl, '_blank');
                toast.info('Image opened in new tab');
              }
            } else {
              // Non-iOS devices: Use traditional download
              const response = await fetch(imageUrl, { signal: controller.signal });
              if (!response.ok) throw new Error('Network response was not ok');
              const blob = await response.blob();
              const url = window.URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = fileName;
              link.target = '_blank';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              window.URL.revokeObjectURL(url);
              toast.success('Photo downloaded successfully!');
            }
          }
        } catch (error) {
          if ((error as Error).name !== 'AbortError') {
            logger.error('Error handling image', { error });
            toast.error('Failed to handle image. Please try again.');
          }
        } finally {
          if (!controller.signal.aborted) {
            setIsDownloading(false);
          }
          downloadControllerRef.current = null;
        }
      }
    }, [selectedImage, images]);

    const dialogHandlers = useSwipeable({
      onSwipedLeft: () => goToNext(),
      onSwipedRight: () => goToPrevious(),
      onSwipedDown: () => onClose(),
      trackTouch: true,
      preventScrollOnSwipe: true,
      trackMouse: true,
      touchEventOptions: { passive: false },
    });

    const shouldShowUploaderDetails = useMemo(() => {
      return (
        selectedImage !== null &&
        selectedImage < images.length &&
        isGalleryImageObject(images[selectedImage]) &&
        images[selectedImage].user_details?.id
      );
    }, [selectedImage, images]);

    const handleDeleteImage = useCallback(
      async (photoId: string) => {
        try {
          const result = await handleDelete(photoId);
          if (result.success) {
            toast.success('Photo deleted.');
            if (images.length <= 1) {
              onClose();
              return result;
            }

            if (selectedImage !== null) {
              // Ensure we don't go out of bounds
              const maxIndex = Math.max(0, images.length - 2);
              const newIndex =
                selectedImage >= images.length - 1
                  ? maxIndex // Move to previous if deleting last image
                  : Math.min(selectedImage, maxIndex); // Stay at same index but ensure it's valid

              onImageChange(newIndex);
            }
          }
          return result;
        } catch (error) {
          toast.error('Failed to delete photo. Please try again.');
          return { success: false };
        }
      },
      [handleDelete, images.length, selectedImage, onClose, onImageChange]
    );

    // Reset loading states when image changes
    useEffect(() => {
      if (selectedImage !== null) {
        setImageLoading(true);
        setImageError(false);
      }
    }, [selectedImage]);

    // Cleanup download on unmount
    useEffect(() => {
      return () => {
        if (downloadControllerRef.current) {
          downloadControllerRef.current.abort();
        }
      };
    }, []);

    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (selectedImage !== null) {
          if (event.key === 'ArrowRight') {
            goToNext();
          } else if (event.key === 'ArrowLeft') {
            goToPrevious();
          } else if (event.key === 'Escape') {
            onClose();
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedImage, goToNext, goToPrevious, onClose]);

    return (
      <Dialog open={selectedImage !== null} onOpenChange={onClose}>
        <DialogContent
          className='flex h-[100dvh] max-h-[100dvh] max-w-full flex-col gap-0 border-none border-transparent p-0'
          {...dialogHandlers}
        >
          <div
            className='relative flex flex-grow items-center justify-center bg-black'
            style={{ height: '85dvh' }}
          >
            <div className='absolute right-4 top-4 z-10 flex space-x-2'>
              <button
                onClick={downloadImage}
                className='mr-2 text-white hover:text-gray-300'
                aria-label='Download image'
              >
                {isDownloading ? (
                  <Loader2 className='h-6 w-6 animate-spin' />
                ) : (
                  <Download className='h-6 w-6' />
                )}
              </button>
              <button
                onClick={onClose}
                className='text-white hover:text-gray-300'
                aria-label='Close fullscreen view'
              >
                <XIcon className='h-6 w-6' />
              </button>
            </div>
            {selectedImage !== null && selectedImage < images.length && images[selectedImage] && (
              <div className='relative flex h-full w-full items-center justify-center'>
                {imageLoading && (
                  <div className='absolute inset-0 flex items-center justify-center bg-black bg-opacity-50'>
                    <Loader2 className='h-8 w-8 animate-spin text-white' />
                  </div>
                )}
                {imageError ? (
                  <div className='flex flex-col items-center text-white'>
                    <div className='mb-2 text-4xl'>📷</div>
                    <p>Failed to load image</p>
                    <button
                      onClick={() => {
                        setImageError(false);
                        setImageLoading(true);
                      }}
                      className='mt-2 rounded bg-white bg-opacity-20 px-4 py-2 text-sm hover:bg-opacity-30'
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <img
                    src={getImageUrl(images[selectedImage])}
                    alt={`Fullscreen view of image ${selectedImage + 1}`}
                    className={`max-h-full max-w-full object-contain transition-opacity duration-200 ${
                      imageLoading ? 'opacity-0' : 'opacity-100'
                    }`}
                    onLoad={() => setImageLoading(false)}
                    onError={() => {
                      setImageLoading(false);
                      setImageError(true);
                    }}
                    onDragStart={preventDragHandler}
                  />
                )}
              </div>
            )}
            <button
              onClick={goToPrevious}
              className='absolute left-4 z-10 text-white hover:text-gray-300'
              aria-label='Previous image'
            >
              <ChevronLeftIcon className='h-10 w-10' />
            </button>
            <button
              onClick={goToNext}
              className='absolute right-4 z-10 text-white hover:text-gray-300'
              aria-label='Next image'
            >
              <ChevronRightIcon className='h-10 w-10' />
            </button>
          </div>
          {shouldShowUploaderDetails &&
            selectedImage !== null &&
            isGalleryImageObject(images[selectedImage]) && (
              <div
                className='flex items-center justify-between border-t border-gray-200 bg-gray-50 p-4'
                style={{ height: '15dvh' }}
              >
                <div
                  key={images[selectedImage].user_details?.id}
                  className='mx-auto flex w-full max-w-[700px] items-center justify-between space-x-4'
                >
                  <div className='flex items-start space-x-4'>
                    <Avatar className='cursor-pointer border'>
                      <AvatarImage
                        src={images[selectedImage].user_details?.image || '/icon.png'}
                        alt={images[selectedImage].user_details?.username || 'Username'}
                      />
                      <AvatarFallback>
                        {images[selectedImage].user_details?.username?.slice(0, 1) || 'E'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className='flex flex-row items-center'>
                        <p className='cursor-pointer text-sm font-semibold leading-none text-gray-500'>
                          @{images[selectedImage].user_details?.username}
                        </p>
                        {images[selectedImage].user_details?.verification_status === 'verified' && (
                          <span className='ml-1 text-sm'>✓</span>
                        )}
                      </div>
                      {!images[selectedImage].user_details?.name ? null : (
                        <p className='cursor-pointer text-sm text-gray-400'>
                          {images[selectedImage].user_details?.name}
                        </p>
                      )}
                      {images[selectedImage].created_at && (
                        <p className='cursor-pointer pt-2 text-[10px] text-gray-400'>
                          posted on{' '}
                          {new Date(images[selectedImage].created_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className='flex items-center gap-1.5'>
                    <LikeButton
                      itemId={images[selectedImage].id}
                      userId={userId}
                      eventId={eventId}
                    />
                    {!showDropdownMenu ? null : (
                      <div>
                        <div className='md:hidden'>
                          <MobileGalleryMenu
                            photoId={images[selectedImage].id}
                            handleDelete={handleDeleteImage}
                          />
                        </div>
                        <div className='hidden md:block'>
                          <GalleryDropdownMenu
                            photoId={images[selectedImage].id}
                            handleDelete={handleDeleteImage}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
        </DialogContent>
      </Dialog>
    );
  }
);
