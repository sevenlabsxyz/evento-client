'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { VerificationBadgeCheck } from '@/components/ui/verification-badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { MiniListItem } from '@/components/ui/mini-list-item';
import { DeleteConfirmation } from './delete-confirmation';
import { VERIFICATION_STATUS } from '@/lib/constants/user';
import { GalleryDropdownMenu } from './dropdown-menu';
import { Button } from '@/components/ui/button';
import { useSwipeable } from 'react-swipeable';
import { useState, useEffect } from 'react';
import { LikeButton } from './like-button';
import { Modal } from '@/components/ui/modal';
import { toast } from '@/lib/utils/toast';
import {
  XIcon,
  Trash2,
  Loader2,
  Download,
  MoreHorizontal,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react';

export interface LightboxViewerProps {
  images: any[];
  selectedImage: number | null;
  onClose: () => void;
  onImageChange: (index: number) => void;
  showDropdownMenu?: boolean;
  handleDelete: (photoId: string) => Promise<{ success: boolean }>;
  userId: string;
  eventId: string;
}

const MobileGalleryMenu = ({
  photoId,
  handleDelete,
}: {
  photoId: string;
  handleDelete: Function;
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
      console.error('Error deleting photo:', error);
      toast.error('Failed to delete photo. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button variant="secondary" size="icon" onClick={() => setIsOpen(true)}>
        <MoreHorizontal className="h-4 w-4" />
        <span className="sr-only">Open menu</span>
      </Button>
      <Modal open={isOpen} setOpen={setIsOpen}>
        <div className="px-2 pb-6 pt-4">
          <MiniListItem
            icon={<Trash2 className="h-5 w-5 text-red-400 mr-2.5" />}
            text="Delete photo"
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
};

export const LightboxViewer = ({
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

  const goToNext = () => {
    if (selectedImage !== null) {
      const nextIndex = (selectedImage + 1) % images.length;
      onImageChange(nextIndex);
    }
  };

  const goToPrevious = () => {
    if (selectedImage !== null) {
      const prevIndex = (selectedImage - 1 + images.length) % images.length;
      onImageChange(prevIndex);
    }
  };

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

  const downloadImage = async () => {
    if (selectedImage !== null) {
      setIsDownloading(true);
      try {
        const imageUrl = images[selectedImage].image;
        const extension = getFileExtension(imageUrl);
        const fileName = `gallery-image-${selectedImage + 1}.${extension}`;

        if (typeof window !== 'undefined') {
          const isIOS = /iPad|iPhone|iPod/.test(window.navigator.userAgent);

          if (isIOS) {
            // Check if Web Share API is supported
            if (navigator.share) {
              try {
                const response = await fetch(imageUrl);
                if (!response.ok)
                  throw new Error('Network response was not ok');
                const blob = await response.blob();
                const file = new File([blob], fileName, { type: blob.type });

                await navigator.share({
                  files: [file],
                  title: 'Save Image',
                });
                toast.success('Image shared successfully!');
              } catch (error) {
                if ((error as Error).name !== 'AbortError') {
                  console.error('Error sharing:', error);
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
            const response = await fetch(imageUrl);
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
        console.error('Error handling image:', error);
        toast.error('Failed to handle image. Please try again.');
      } finally {
        setIsDownloading(false);
      }
    }
  };

  const dialogHandlers = useSwipeable({
    onSwipedLeft: () => goToNext(),
    onSwipedRight: () => goToPrevious(),
    onSwipedDown: () => onClose(),
    trackTouch: true,
    preventScrollOnSwipe: true,
    trackMouse: true,
    touchEventOptions: { passive: false },
  });

  const shouldShowUploaderDetails =
    selectedImage !== null && images[selectedImage]?.user_details?.id;

  const handleDeleteImage = async (photoId: string) => {
    try {
      const result = await handleDelete(photoId);
      if (result.success) {
        toast.success('Photo deleted.');
        if (images.length <= 1) {
          onClose();
          return result;
        }

        if (selectedImage !== null) {
          const newIndex =
            selectedImage === images.length - 1
              ? images.length - 2 // Move to previous if deleting last image
              : selectedImage; // Stay at same index as array will shift

          onImageChange(newIndex);
        }
      }
      return result;
    } catch (error) {
      toast.error('Failed to delete photo. Please try again.');
      return { success: false };
    }
  };

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
  }, [selectedImage]);

  return (
    <Dialog open={selectedImage !== null} onOpenChange={onClose}>
      <DialogContent
        className="max-w-full max-h-[100dvh] h-[100dvh] p-0 flex flex-col border-none gap-0 border-none border-transparent"
        {...dialogHandlers}
      >
        <div
          className="relative flex-grow flex items-center justify-center bg-black"
          style={{ height: '85dvh' }}
        >
          <div className="absolute top-4 right-4 flex space-x-2 z-10">
            <button
              onClick={downloadImage}
              className="text-white hover:text-gray-300 mr-2"
              aria-label="Download image"
            >
              {isDownloading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Download className="w-6 h-6" />
              )}
            </button>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-300"
              aria-label="Close fullscreen view"
            >
              <XIcon className="w-6 h-6" />
            </button>
          </div>
          {selectedImage !== null && images[selectedImage] && (
            <img
              src={images[selectedImage].image}
              alt={`Fullscreen view of image ${selectedImage + 1}`}
              className="max-h-full max-w-full object-contain"
              onDragStart={preventDragHandler}
            />
          )}
          <button
            onClick={goToPrevious}
            className="absolute left-4 text-white hover:text-gray-300 z-10"
            aria-label="Previous image"
          >
            <ChevronLeftIcon className="w-10 h-10" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 text-white hover:text-gray-300 z-10"
            aria-label="Next image"
          >
            <ChevronRightIcon className="w-10 h-10" />
          </button>
        </div>
        {shouldShowUploaderDetails && images[selectedImage] && (
          <div
            className="bg-gray-50 p-4 border-t border-gray-200 flex items-center justify-between"
            style={{ height: '15dvh' }}
          >
            <div
              key={images[selectedImage]?.user_details?.id}
              className="flex items-center justify-between space-x-4 max-w-[700px] w-full mx-auto"
            >
              <div className="flex items-start space-x-4">
                <Avatar className="cursor-pointer border">
                  <AvatarImage
                    src={
                      images[selectedImage]?.user_details?.image || '/icon.png'
                    }
                    alt={
                      images[selectedImage]?.user_details?.username ||
                      'Username'
                    }
                  />
                  <AvatarFallback>
                    {images[selectedImage]?.user_details?.username.substr(
                      0,
                      1
                    ) || 'E'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex flex-row items-center">
                    <p className="cursor-pointer text-sm font-medium leading-none font-semibold text-gray-500">
                      @{images[selectedImage]?.user_details?.username}
                    </p>
                    {images[selectedImage]?.user_details
                      ?.verification_status !==
                    VERIFICATION_STATUS.VERIFIED ? null : (
                      <VerificationBadgeCheck size="sm" />
                    )}
                  </div>
                  {!images[selectedImage]?.user_details?.name ? null : (
                    <p className="text-gray-400 cursor-pointer text-sm">
                      {images[selectedImage]?.user_details?.name}
                    </p>
                  )}
                  {images[selectedImage]?.created_at && (
                    <p className="text-gray-400 cursor-pointer text-[10px] pt-2">
                      posted on{' '}
                      {new Date(
                        images[selectedImage].created_at
                      ).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <LikeButton
                  itemId={
                    selectedImage !== null ? images[selectedImage].id : ''
                  }
                  userId={userId}
                  eventId={eventId}
                />
                {!showDropdownMenu ? null : (
                  <div>
                    <div className="md:hidden">
                      <MobileGalleryMenu
                        photoId={images[selectedImage].id}
                        handleDelete={handleDeleteImage}
                      />
                    </div>
                    <div className="hidden md:block">
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
};