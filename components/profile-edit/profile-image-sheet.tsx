'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { SheetWithDetentFull } from '@/components/ui/sheet-with-detent-full';
import { useUpdateUserProfile, useUploadProfileImage } from '@/lib/hooks/use-user-profile';
import { toast } from '@/lib/utils/toast';
import { Camera, Upload, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useRef, useState } from 'react';

interface ProfileImageSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentImage?: string;
  userName?: string;
  onImageUpdate?: (imageUrl: string) => void;
}

export default function ProfileImageSheet({
  isOpen,
  onClose,
  currentImage,
  userName = 'User',
  onImageUpdate,
}: ProfileImageSheetProps) {
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadProfileImage();
  const updateProfileMutation = useUpdateUserProfile();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(t('edit.image.selectImageFile'));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('edit.image.tooLarge'));
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!selectedFile) {
      toast.error(t('edit.image.selectImage'));
      return;
    }

    setIsUploading(true);
    try {
      // Step 1: Upload image to Supabase storage
      const result = await uploadMutation.mutateAsync(selectedFile);
      const imageUrl = result?.data?.image ?? result?.image;

      if (!imageUrl) {
        throw new Error('No image URL returned from upload');
      }

      // Step 2: Persist image URL to user profile in database
      await updateProfileMutation.mutateAsync({ image: imageUrl });

      // Step 3: Update local form state
      if (onImageUpdate) {
        onImageUpdate(imageUrl);
      }

      // Step 4: Success UX — only after BOTH upload and persistence succeed
      toast.success(t('edit.image.updated'));
      onClose();
    } catch (error) {
      toast.error(t('edit.image.updateFailed'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedImage(null);
    setSelectedFile(null);
    onClose();
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <SheetWithDetentFull.Root
      presented={isOpen}
      onPresentedChange={(presented) => !presented && handleCancel()}
    >
      <SheetWithDetentFull.Portal>
        <SheetWithDetentFull.View>
          <SheetWithDetentFull.Backdrop />
          <SheetWithDetentFull.Content>
            {/* Header */}
            <div className='sticky top-0 z-10 border-b border-gray-100 bg-white px-4 pb-4 pt-4 dark:border-neutral-800 dark:bg-neutral-900'>
              <div className='flex items-center justify-center'>
                <SheetWithDetentFull.Handle />
              </div>
              <div className='flex items-center justify-between'>
                <h2 className='text-xl font-semibold'>{t('edit.image.title')}</h2>
                <button
                  onClick={handleCancel}
                  className='rounded-full p-2 hover:bg-gray-100 dark:hover:bg-neutral-800'
                >
                  <X className='h-5 w-5' />
                </button>
              </div>
              <p className='mt-1 text-sm text-gray-500 dark:text-neutral-400'>
                {t('edit.image.subtitle')}
              </p>
            </div>

            {/* Content */}
            <SheetWithDetentFull.ScrollRoot asChild>
              <SheetWithDetentFull.ScrollView>
                <SheetWithDetentFull.ScrollContent className='p-6'>
                  {/* Avatar Preview */}
                  <div className='mb-8 flex flex-col items-center'>
                    <Avatar className='mb-4 h-32 w-32'>
                      <AvatarImage
                        src={selectedImage || currentImage || ''}
                        alt={t('edit.image.alt')}
                      />
                      <AvatarFallback>
                        <Image
                          src='/assets/img/evento-sublogo.svg'
                          alt='Evento'
                          className='h-full w-full p-1 dark:invert'
                          fill
                        />
                      </AvatarFallback>
                    </Avatar>

                    {/* Camera Icon Overlay */}
                    <button
                      onClick={triggerFileInput}
                      className='absolute bottom-0 right-0 rounded-full bg-white p-3 shadow-md transition-shadow hover:shadow-lg dark:bg-neutral-800 dark:ring-1 dark:ring-neutral-700'
                    >
                      <Camera className='h-6 w-6 text-gray-600 dark:text-neutral-400' />
                    </button>
                  </div>

                  {/* Upload Button */}
                  <Button onClick={triggerFileInput} variant='outline' className='mb-6 w-full'>
                    <Upload className='mr-2 h-5 w-5' />
                    {t('edit.image.chooseFromLibrary')}
                  </Button>

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type='file'
                    accept='image/*'
                    onChange={handleFileSelect}
                    className='hidden'
                  />

                  {/* Save/Cancel Buttons */}
                  <div className='flex flex-col gap-3'>
                    <Button
                      onClick={handleSave}
                      className='flex-1 bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
                      disabled={!selectedFile || isUploading || updateProfileMutation.isPending}
                    >
                      {isUploading
                        ? t('edit.image.uploading')
                        : updateProfileMutation.isPending
                          ? t('saving')
                          : tCommon('actions.save')}
                    </Button>
                    <Button onClick={handleCancel} variant='outline' className='flex-1'>
                      {tCommon('actions.cancel')}
                    </Button>
                  </div>
                </SheetWithDetentFull.ScrollContent>
              </SheetWithDetentFull.ScrollView>
            </SheetWithDetentFull.ScrollRoot>
          </SheetWithDetentFull.Content>
        </SheetWithDetentFull.View>
      </SheetWithDetentFull.Portal>
    </SheetWithDetentFull.Root>
  );
}
