'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SheetWithDetentFull } from '@/components/ui/sheet-with-detent-full';
import { useUpdateUserProfile } from '@/lib/hooks/use-user-profile';
import { validateUpdateUserProfile } from '@/lib/schemas/user';
import { logger } from '@/lib/utils/logger';
import { toast } from '@/lib/utils/toast';
import { Loader2, User, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

interface NameSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (name: string) => void;
  currentName?: string;
}

export default function NameSheet({ isOpen, onClose, onSave, currentName = '' }: NameSheetProps) {
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');
  const [name, setName] = useState(currentName);
  const updateProfileMutation = useUpdateUserProfile();

  // Reset state when sheet opens
  useEffect(() => {
    if (isOpen) {
      setName(currentName);
    }
  }, [isOpen, currentName]);

  const handleSave = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      toast.error(t('edit.name.required'));
      return;
    }

    if (trimmedName.length > 50) {
      toast.error(t('edit.name.tooLong'));
      return;
    }

    if (onSave) {
      onSave(trimmedName);
    }

    try {
      // Directly save to API
      const updateData = { name: trimmedName };

      // Validate data
      const validation = validateUpdateUserProfile(updateData);
      if (!validation.valid) {
        toast.error(validation.error || t('edit.name.invalid'));
        return;
      }

      // Save to API
      await updateProfileMutation.mutateAsync(updateData);
      toast.success(t('edit.name.updated'));

      // Close sheet
      onClose();
    } catch (error) {
      logger.error('Failed to update name', { error });
      toast.error(t('edit.name.updateFailed'));
    }
  };

  const handleCancel = () => {
    setName(currentName);
    onClose();
  };

  const canSave = name.trim() && name.trim() !== currentName;
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
                <h2 className='text-xl font-semibold'>{t('edit.name.title')}</h2>
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
                  {/* Input with icon */}
                  <div className='relative mb-4'>
                    <div className='absolute left-3 top-1/2 -translate-y-1/2'>
                      <User className='h-5 w-5 text-gray-400 dark:text-neutral-500' />
                    </div>
                    <Input
                      type='text'
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                      }}
                      placeholder={t('edit.name.placeholder')}
                      className='pl-10'
                      autoFocus
                      maxLength={50}
                    />
                  </div>

                  {/* Character count */}
                  <p className='mb-4 text-right text-sm text-gray-500 dark:text-neutral-400'>
                    {name.length}/50
                  </p>

                  {/* Info text */}
                  <p className='mb-6 text-sm text-gray-500 dark:text-neutral-400'>
                    {t('edit.name.info')}
                  </p>

                  {/* Save/Cancel Buttons */}
                  <div className='flex flex-col gap-3'>
                    <Button
                      onClick={handleSave}
                      disabled={!canSave || isSaving}
                      className='flex-1'
                      variant='default'
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
