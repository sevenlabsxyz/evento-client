'use client';

import { Button } from '@/components/ui/button';
import { SheetWithDetentFull } from '@/components/ui/sheet-with-detent-full';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateUserProfile } from '@/lib/hooks/use-user-profile';
import { validateUpdateUserProfile } from '@/lib/schemas/user';
import { logger } from '@/lib/utils/logger';
import { toast } from '@/lib/utils/toast';
import { Loader2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

interface BiographySheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (bio: string) => void;
  currentBio?: string;
}

export default function BiographySheet({
  isOpen,
  onClose,
  onSave,
  currentBio = '',
}: BiographySheetProps) {
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');
  const [bio, setBio] = useState(currentBio || '');
  const maxLength = 500;
  const updateProfileMutation = useUpdateUserProfile();

  // Reset state when sheet opens
  useEffect(() => {
    if (isOpen) {
      setBio(currentBio);
    }
  }, [isOpen, currentBio]);

  const handleSave = async () => {
    const trimmedBio = bio.trim();

    if (onSave) {
      onSave(trimmedBio);
    }

    try {
      // Directly save to API
      const updateData = { bio: trimmedBio };

      // Validate data
      const validation = validateUpdateUserProfile(updateData);
      if (!validation.valid) {
        toast.error(validation.error || t('edit.bio.invalid'));
        return;
      }

      // Save to API
      await updateProfileMutation.mutateAsync(updateData);
      toast.success(t('edit.bio.updated'));

      // Close sheet
      onClose();
    } catch (error) {
      logger.error('Failed to update bio', { error });
      toast.error((error as string) || t('edit.bio.updateFailed'));
    }
  };

  const handleCancel = () => {
    setBio(currentBio);
    onClose();
  };

  const hasChanges = bio !== currentBio;
  const isSaving = updateProfileMutation.isPending;

  return (
    <SheetWithDetentFull.Root
      presented={isOpen}
      onPresentedChange={(presented) => !presented && handleCancel()}
    >
      <SheetWithDetentFull.Portal>
        <SheetWithDetentFull.View>
          <SheetWithDetentFull.Backdrop />
          <SheetWithDetentFull.Content className='dark:bg-neutral-900'>
            {/* Header */}
            <div className='sticky top-0 z-10 border-b border-gray-100 bg-white px-4 pb-4 pt-4 dark:border-neutral-800 dark:bg-neutral-900'>
              <div className='flex items-center justify-center'>
                <SheetWithDetentFull.Handle className='dark:bg-neutral-700' />
              </div>
              <div className='flex items-center justify-between'>
                <h2 className='text-xl font-semibold'>{t('edit.bio.title')}</h2>
                <button
                  onClick={handleCancel}
                  className='rounded-full p-2 hover:bg-gray-100 dark:hover:bg-neutral-800'
                >
                  <X className='h-5 w-5' />
                </button>
              </div>
            </div>

            {/* Content */}
            <SheetWithDetentFull.ScrollRoot asChild>
              <SheetWithDetentFull.ScrollView>
                <SheetWithDetentFull.ScrollContent className='p-6'>
                  {/* Textarea */}
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder={t('edit.bio.placeholder')}
                    className='mb-4 min-h-[200px] resize-none'
                    maxLength={maxLength}
                    autoFocus
                  />

                  {/* Character count */}
                  <p className='mb-4 text-right text-sm text-gray-500 dark:text-neutral-400'>
                    {bio.length}/{maxLength}
                  </p>

                  {/* Info text */}
                  <p className='mb-6 text-sm text-gray-500 dark:text-neutral-400'>
                    {t('edit.bio.info')}
                  </p>

                  {/* Save/Cancel Buttons */}
                  <div className='flex flex-col gap-3'>
                    <Button
                      onClick={handleSave}
                      disabled={!hasChanges || isSaving}
                      className='flex-1 bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                          {t('saving')}
                        </>
                      ) : (
                        tCommon('actions.save')
                      )}
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
