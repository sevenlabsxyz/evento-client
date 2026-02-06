'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SheetWithDetentFull } from '@/components/ui/sheet-with-detent-full';
import { useCheckUsername } from '@/lib/hooks/use-check-username';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { useUpdateUserProfile } from '@/lib/hooks/use-user-profile';
import { validateUpdateUserProfile } from '@/lib/schemas/user';
import { logger } from '@/lib/utils/logger';
import { toast } from '@/lib/utils/toast';
import { AtSign, CheckCircle, Loader2, X, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface UsernameSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (username: string) => void;
  currentUsername?: string;
}

export default function UsernameSheet({
  isOpen,
  onClose,
  onSave,
  currentUsername = '',
}: UsernameSheetProps) {
  const [username, setUsername] = useState(currentUsername);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  const debouncedUsername = useDebounce(username, 500);
  const checkUsernameMutation = useCheckUsername();
  const updateProfileMutation = useUpdateUserProfile();

  // Reset state when sheet opens
  useEffect(() => {
    if (isOpen) {
      setUsername(currentUsername);
      setIsAvailable(null);
    }
  }, [isOpen, currentUsername]);

  // Check username availability
  useEffect(() => {
    if (!debouncedUsername || debouncedUsername === currentUsername) {
      setIsAvailable(null);
      return;
    }

    // Check availability using the API
    const checkAvailability = async () => {
      const result = await checkUsernameMutation.mutateAsync(debouncedUsername);
      setIsAvailable(result.available);
    };

    checkAvailability();
  }, [debouncedUsername, currentUsername]);

  const handleSave = async () => {
    if (!username || username === currentUsername) {
      onClose();
      return;
    }

    if (!isAvailable) {
      toast.error('Please choose an available username');
      return;
    }

    // Update local state if onSave is provided (for backward compatibility)
    if (onSave) {
      onSave(username);
    }

    try {
      // Directly save to API
      const updateData = { username };

      // Validate data
      const validation = validateUpdateUserProfile(updateData);
      if (!validation.valid) {
        toast.error(validation.error || 'Invalid username');
        return;
      }

      // Save to API
      await updateProfileMutation.mutateAsync(updateData);
      toast.success('Username updated successfully');

      // Close sheet
      onClose();
    } catch (error) {
      logger.error('Failed to update username', { error: error instanceof Error ? error.message : String(error) });
      toast.error('Failed to update username');
    }
  };

  const handleCancel = () => {
    setUsername(currentUsername);
    onClose();
  };

  const canSave = username && username !== currentUsername && isAvailable;
  const isSaving = updateProfileMutation.isPending;

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
            <div className='sticky top-0 z-10 border-b border-gray-100 bg-white px-4 pb-4 pt-4'>
              <div className='flex items-center justify-center'>
                <SheetWithDetentFull.Handle />
              </div>
              <div className='flex items-center justify-between'>
                <h2 className='text-xl font-semibold'>Username</h2>
                <button onClick={handleCancel} className='rounded-full p-2 hover:bg-gray-100'>
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
                      <AtSign className='h-5 w-5 text-gray-400' />
                    </div>
                    <Input
                      type='text'
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase())}
                      placeholder='username'
                      className='pl-10 pr-10'
                      autoFocus
                    />
                    {/* Status icon */}
                    {checkUsernameMutation.isPending && (
                      <div className='absolute right-3 top-1/2 -translate-y-1/2'>
                        <div className='h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600' />
                      </div>
                    )}
                    {!checkUsernameMutation.isPending &&
                      isAvailable === true &&
                      username !== currentUsername && (
                        <div className='absolute right-3 top-1/2 -translate-y-1/2'>
                          <CheckCircle className='h-5 w-5 text-green-500' />
                        </div>
                      )}
                    {!checkUsernameMutation.isPending && isAvailable === false && (
                      <div className='absolute right-3 top-1/2 -translate-y-1/2'>
                        <XCircle className='h-5 w-5 text-red-500' />
                      </div>
                    )}
                  </div>

                  {/* Success message */}
                  {isAvailable && username !== currentUsername && (
                    <p className='mb-4 text-sm text-green-500'>Username is available!</p>
                  )}

                  {/* Error message */}
                  {!isAvailable && username !== currentUsername && (
                    <p className='mb-4 text-sm text-red-500'>Username is not available.</p>
                  )}

                  {/* Info text */}
                  <p className='mb-6 text-sm text-gray-500'>
                    Your username is unique and helps others find you on Evento. It can only contain
                    letters, numbers, and underscores.
                  </p>

                  {/* Save/Cancel Buttons */}
                  <div className='flex flex-col gap-3'>
                    <Button
                      onClick={handleSave}
                      disabled={!canSave || isSaving}
                      className='flex-1 bg-red-500 text-white hover:bg-red-600'
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                          Saving...
                        </>
                      ) : (
                        'Save'
                      )}
                    </Button>
                    <Button onClick={handleCancel} variant='outline' className='flex-1'>
                      Cancel
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
