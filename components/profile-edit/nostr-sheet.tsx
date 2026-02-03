'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SheetWithDetentFull } from '@/components/ui/sheet-with-detent-full';
import { useUpdateUserProfile } from '@/lib/hooks/use-user-profile';
import { validateUpdateUserProfile } from '@/lib/schemas/user';
import { toast } from '@/lib/utils/toast';
import { Hash, Loader2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface NostrSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (nip05: string) => void;
  currentNip05?: string;
}

export default function NostrSheet({
  isOpen,
  onClose,
  onSave,
  currentNip05 = '',
}: NostrSheetProps) {
  const [nip05, setNip05] = useState(currentNip05);
  const updateProfileMutation = useUpdateUserProfile();

  // Reset state when sheet opens
  useEffect(() => {
    if (isOpen) {
      setNip05(currentNip05);
    }
  }, [isOpen, currentNip05]);

  const validateNip05 = (identifier: string) => {
    if (!identifier) return true;

    // Basic NIP-05 validation (user@domain.com format)
    const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(identifier);
  };

  const handleSave = async () => {
    const trimmedNip05 = nip05.trim();

    if (trimmedNip05 && !validateNip05(trimmedNip05)) {
      toast.error('Invalid Nostr identifier format (e.g., user@domain.com)');
      return;
    }

    if (onSave) {
      onSave(trimmedNip05);
    }

    try {
      // Directly save to API
      const updateData = { nip05: trimmedNip05 };

      // Validate data
      const validation = validateUpdateUserProfile(updateData);
      if (!validation.valid) {
        toast.error(validation.error || 'Invalid Nostr identifier');
        return;
      }

      // Save to API
      await updateProfileMutation.mutateAsync(updateData);
      toast.success('Nostr identifier updated successfully');

      // Close sheet
      onClose();
    } catch (error) {
      console.error('Failed to update Nostr identifier:', error);
      toast.error('Failed to update Nostr identifier');
    }
  };

  const handleCancel = () => {
    setNip05(currentNip05);
    onClose();
  };

  const hasChanges = nip05 !== currentNip05;
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
                <h2 className='text-xl font-semibold'>Nostr</h2>
                <button onClick={handleCancel} className='rounded-full p-2 hover:bg-gray-100'>
                  <X className='h-5 w-5' />
                </button>
              </div>
              <p className='mt-1 text-sm text-gray-500'>Add your Nostr identifier (NIP-05)</p>
            </div>

            {/* Content */}
            <SheetWithDetentFull.ScrollRoot asChild>
              <SheetWithDetentFull.ScrollView>
                <SheetWithDetentFull.ScrollContent className='p-6'>
                  {/* Input with icon */}
                  <div className='relative mb-4'>
                    <div className='absolute left-3 top-1/2 -translate-y-1/2'>
                      <Hash className='h-5 w-5 text-pink-600' />
                    </div>
                    <Input
                      type='text'
                      value={nip05}
                      onChange={(e) => {
                        setNip05(e.target.value);
                      }}
                      placeholder='user@domain.com'
                      className='pl-10'
                      autoFocus
                    />
                  </div>

                  {/* Info text */}
                  <div className='mb-6 space-y-3'>
                    <p className='text-sm text-gray-500'>
                      A Nostr identifier (NIP-05) helps people find and verify your Nostr profile.
                      It looks like an email address but is used for the Nostr protocol. A Nostr
                      identifier (NIP-05) helps people find and verify your Nostr profile. It looks
                      like an email address but is used for the Nostr protocol.
                    </p>

                    <div className='rounded-xl bg-pink-50 p-4'>
                      <p className='mb-2 text-sm font-medium text-pink-800'>What is Nostr?</p>
                      <p className='text-sm text-pink-700'>
                        Nostr is a decentralized social network protocol that gives you control over
                        your identity and content. Your NIP-05 identifier makes it easy for others
                        to find you across different Nostr apps. Nostr is a decentralized social
                        network protocol that gives you control over your identity and content. Your
                        NIP-05 identifier makes it easy for others to find you across different
                        Nostr apps.
                      </p>
                    </div>
                  </div>

                  {/* Save/Cancel Buttons */}
                  <div className='flex flex-col gap-3'>
                    <Button
                      onClick={handleSave}
                      disabled={!hasChanges || isSaving}
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
