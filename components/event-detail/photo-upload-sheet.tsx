'use client';

import { Button } from '@/components/ui/button';
import { SheetWithDetentFull } from '@/components/ui/sheet-with-detent-full';
import { toast } from '@/lib/utils/toast';
import { useQueryClient } from '@tanstack/react-query';
import { Camera, Trash2, X } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useState } from 'react';

interface PhotoUploadSheetProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
}

interface PhotoPreview {
  id: string;
  file: File;
  previewUrl: string;
}

const MAX_PHOTOS = 20;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export default function PhotoUploadSheet({ isOpen, onClose, eventId }: PhotoUploadSheetProps) {
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const queryClient = useQueryClient();

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0) return;

      const newFiles = Array.from(e.target.files);

      // Check if adding these would exceed limit
      if (photos.length + newFiles.length > MAX_PHOTOS) {
        toast.error(`You can only upload up to ${MAX_PHOTOS} photos at once.`);
        return;
      }

      // Process each file
      const validFiles = newFiles.filter((file) => {
        // Check file type
        if (!ALLOWED_TYPES.includes(file.type)) {
          toast.error(`File type not supported: ${file.name}`);
          return false;
        }

        // Check file size
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`File too large: ${file.name} (max 10MB)`);
          return false;
        }

        return true;
      });

      // Create previews
      const newPhotoPreviews = validFiles.map((file) => ({
        id: Math.random().toString(36).substring(2, 11),
        file,
        previewUrl: URL.createObjectURL(file),
      }));

      setPhotos((prev) => [...prev, ...newPhotoPreviews]);

      // Reset input value to allow selecting same files again
      e.target.value = '';
    },
    [photos]
  );

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => {
      const filtered = prev.filter((p) => p.id !== id);
      // Free memory for removed preview URL
      const removedPhoto = prev.find((p) => p.id === id);
      if (removedPhoto) {
        URL.revokeObjectURL(removedPhoto.previewUrl);
      }
      return filtered;
    });
  };

  const handleUpload = async () => {
    if (photos.length === 0) return;

    setUploading(true);
    let successCount = 0;
    let failCount = 0;

    // Initialize progress for all photos
    const initialProgress: Record<string, number> = {};
    photos.forEach((photo) => {
      initialProgress[photo.id] = 0;
    });
    setUploadProgress(initialProgress);

    // Upload each photo
    const uploadPromises = photos.map(async (photo) => {
      try {
        // Create URL parameters
        const params = new URLSearchParams({
          id: eventId,
          filename: photo.file.name,
        });

        // Upload with progress monitoring
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `/api/v1/events/gallery/upload?${params.toString()}`);

        // Monitor upload progress
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress((prev) => ({ ...prev, [photo.id]: progress }));
          }
        });

        // Upload file
        const formData = new FormData();
        formData.append('file', photo.file);

        // Wrap XHR in a Promise
        return new Promise<void>((resolve, reject) => {
          xhr.onload = function () {
            if (xhr.status >= 200 && xhr.status < 300) {
              successCount++;
              resolve();
            } else {
              failCount++;
              reject(new Error(`HTTP error ${xhr.status}`));
            }
          };

          xhr.onerror = function () {
            failCount++;
            reject(new Error('Network error'));
          };

          xhr.send(photo.file);
        });
      } catch (error) {
        console.error('Upload error:', error);
        failCount++;
      }
    });

    // Wait for all uploads to complete
    await Promise.allSettled(uploadPromises);

    // Clean up and report result
    setUploading(false);

    if (successCount > 0) {
      // Success message based on results
      if (failCount > 0) {
        toast.info(`${successCount} photos uploaded, ${failCount} failed.`);
      } else {
        toast.success(
          `${successCount} photo${successCount === 1 ? '' : 's'} uploaded successfully!`
        );
      }

      // Invalidate gallery data cache to refresh the UI
      queryClient.invalidateQueries({
        queryKey: ['event', 'gallery', eventId],
      });

      // Clear previews and free memory
      photos.forEach((photo) => {
        URL.revokeObjectURL(photo.previewUrl);
      });
      setPhotos([]);

      // Close sheet after successful upload
      onClose();
    } else if (failCount > 0) {
      // All uploads failed
      toast.error('Failed to upload photos. Please try again.');
    }
  };

  const handleClose = () => {
    if (uploading) {
      return; // Prevent closing during upload
    }

    // Clean up preview URLs before closing
    photos.forEach((photo) => {
      URL.revokeObjectURL(photo.previewUrl);
    });

    setPhotos([]);
    onClose();
  };

  return (
    <SheetWithDetentFull.Root
      presented={isOpen}
      onPresentedChange={(presented: boolean) => !presented && handleClose()}
    >
      <SheetWithDetentFull.Portal>
        <SheetWithDetentFull.View>
          <SheetWithDetentFull.Backdrop />
          <SheetWithDetentFull.Content>
            <div className='flex h-full flex-col'>
              {/* Header section - fixed at top */}
              <div className='p-6 pb-2'>
                <div className='mb-4 flex justify-center'></div>

                {/* Header with close button */}
                <div className='mb-4 flex items-center justify-between'>
                  <h2 className='text-xl font-bold text-gray-900'>Upload Photos</h2>
                  <button
                    onClick={handleClose}
                    disabled={uploading}
                    className='rounded-full p-2 hover:bg-gray-100 disabled:opacity-50'
                  >
                    <X className='h-5 w-5 text-gray-600' />
                  </button>
                </div>
              </div>

              {/* Scrollable content area */}
              <div className='relative flex-1 overflow-y-auto px-6'>
                {/* Photo selection area */}
                {photos.length === 0 ? (
                  <div className='mb-6'>
                    <div className='flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center'>
                      <Camera className='mb-3 h-12 w-12 text-gray-400' />
                      <p className='mb-4 text-sm text-gray-500'>
                        Select up to {MAX_PHOTOS} photos to upload to this event's gallery
                      </p>
                      <label htmlFor='photo-upload' className='cursor-pointer'>
                        <div className='rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600'>
                          Select Photos
                        </div>
                        <input
                          id='photo-upload'
                          type='file'
                          accept='image/jpeg, image/png, image/gif, image/webp'
                          multiple
                          onChange={handleFileSelect}
                          className='hidden'
                          disabled={uploading}
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Selected photos preview */}
                    <div className='mb-4 flex items-center justify-between'>
                      <h3 className='text-sm font-medium text-gray-700'>
                        {photos.length} photo{photos.length !== 1 && 's'} selected
                      </h3>
                      <label
                        htmlFor='photo-upload-more'
                        className='cursor-pointer text-sm text-red-600'
                      >
                        Add More
                        <input
                          id='photo-upload-more'
                          type='file'
                          accept='image/jpeg, image/png, image/gif, image/webp'
                          multiple
                          onChange={handleFileSelect}
                          className='hidden'
                          disabled={uploading || photos.length >= MAX_PHOTOS}
                        />
                      </label>
                    </div>

                    {/* Photos grid */}
                    <div className='mb-52 grid h-fit max-h-fit auto-rows-max grid-cols-3 gap-3 p-1'>
                      {photos.map((photo) => (
                        <div key={photo.id} className='relative aspect-square'>
                          <div className='absolute inset-0 overflow-hidden rounded-lg'>
                            <Image
                              src={photo.previewUrl}
                              alt='Photo preview'
                              fill
                              className='object-cover'
                            />
                          </div>

                          {uploading ? (
                            <div className='absolute inset-0 flex items-center justify-center bg-black bg-opacity-50'>
                              <div className='h-12 w-12 animate-spin rounded-full border-4 border-white border-t-white border-opacity-25'></div>
                              <div className='absolute font-bold text-white'>
                                {uploadProgress[photo.id] || 0}%
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleRemovePhoto(photo.id)}
                              className='absolute right-1 top-1 rounded-full bg-black bg-opacity-70 p-1.5 text-white hover:bg-opacity-90'
                            >
                              <Trash2 className='h-4 w-4' />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Action buttons - fixed at bottom */}
              <div className='fixed bottom-0 left-0 right-0 flex flex-col gap-2 border-t border-gray-100 bg-white p-6'>
                {photos.length > 0 && (
                  <Button
                    onClick={handleUpload}
                    disabled={uploading || photos.length === 0}
                    className='w-full'
                  >
                    {uploading ? (
                      <span className='flex items-center'>
                        <span className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-white'></span>
                        Uploading...
                      </span>
                    ) : (
                      'Upload Photos'
                    )}
                  </Button>
                )}

                <Button
                  variant='outline'
                  onClick={handleClose}
                  disabled={uploading}
                  className='w-full'
                >
                  {photos.length > 0 ? 'Cancel' : 'Close'}
                </Button>
              </div>
            </div>
          </SheetWithDetentFull.Content>
        </SheetWithDetentFull.View>
      </SheetWithDetentFull.Portal>
    </SheetWithDetentFull.Root>
  );
}
