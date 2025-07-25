'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SheetWithDetentFull } from '@/components/ui/sheet-with-detent-full';
import { useUpdateUserProfile } from '@/lib/hooks/useUserProfile';
import { validateUpdateUserProfile } from '@/lib/schemas/user';
import { toast } from '@/lib/utils/toast';
import { Globe, Instagram, Loader2, X as XIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SocialLinksSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (links: { instagram_handle: string; x_handle: string; bio_link: string }) => void;
  currentLinks: {
    instagram_handle?: string;
    x_handle?: string;
    bio_link?: string;
  };
}

export default function SocialLinksSheet({
  isOpen,
  onClose,
  onSave,
  currentLinks,
}: SocialLinksSheetProps) {
  const [instagram, setInstagram] = useState('');
  const [xHandle, setXHandle] = useState('');
  const [website, setWebsite] = useState('');
  const [errors, setErrors] = useState({
    instagram: '',
    x: '',
    website: '',
  });

  const updateProfileMutation = useUpdateUserProfile();

  // Reset state when sheet opens
  useEffect(() => {
    if (isOpen) {
      setInstagram(currentLinks.instagram_handle || '');
      setXHandle(currentLinks.x_handle || '');
      setWebsite(currentLinks.bio_link || '');
      setErrors({ instagram: '', x: '', website: '' });
    }
  }, [isOpen, currentLinks]);

  const validateWebsite = (url: string) => {
    if (!url) return true;
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  };

  const cleanHandle = (handle: string) => {
    // Remove @ symbol if present
    return handle.replace(/^@/, '').trim();
  };

  const handleSave = async () => {
    const newErrors = { instagram: '', x: '', website: '' };
    let hasError = false;

    // Validate Instagram
    const cleanedInstagram = cleanHandle(instagram);
    if (cleanedInstagram && !/^[a-zA-Z0-9_.]+$/.test(cleanedInstagram)) {
      newErrors.instagram = 'Invalid Instagram username';
      hasError = true;
    }

    // Validate X handle
    const cleanedX = cleanHandle(xHandle);
    if (cleanedX && !/^[a-zA-Z0-9_]+$/.test(cleanedX)) {
      newErrors.x = 'Invalid X username';
      hasError = true;
    }

    // Validate website
    if (website && !validateWebsite(website)) {
      newErrors.website = 'Invalid website URL';
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    // Format website URL
    let formattedWebsite = website;
    if (website && !website.startsWith('http')) {
      formattedWebsite = `https://${website}`;
    }

    const updateData = {
      instagram_handle: cleanedInstagram,
      x_handle: cleanedX,
      bio_link: formattedWebsite,
    };

    if (onSave) {
      onSave(updateData);
    }

    try {
      // Validate data
      const validation = validateUpdateUserProfile(updateData);
      if (!validation.valid) {
        toast.error(validation.error || 'Invalid social links data');
        return;
      }

      // Save to API
      await updateProfileMutation.mutateAsync(updateData);
      toast.success('Social links updated successfully');

      // Close sheet
      onClose();
    } catch (error) {
      console.error('Failed to update social links:', error);
      toast.error('Failed to update social links');
    }
  };

  const handleCancel = () => {
    setInstagram(currentLinks.instagram_handle || '');
    setXHandle(currentLinks.x_handle || '');
    setWebsite(currentLinks.bio_link || '');
    onClose();
  };

  const hasChanges =
    instagram !== (currentLinks.instagram_handle || '') ||
    xHandle !== (currentLinks.x_handle || '') ||
    website !== (currentLinks.bio_link || '');

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
                <h2 className='text-xl font-semibold'>Social Links</h2>
                <button onClick={handleCancel} className='rounded-full p-2 hover:bg-gray-100'>
                  <XIcon className='h-5 w-5' />
                </button>
              </div>
            </div>

            {/* Content */}
            <SheetWithDetentFull.ScrollRoot asChild>
              <SheetWithDetentFull.ScrollView>
                <SheetWithDetentFull.ScrollContent className='space-y-6 p-6'>
                  {/* Instagram */}
                  <div>
                    <Label htmlFor='instagram' className='mb-2 flex items-center gap-2'>
                      <Instagram className='h-4 w-4' />
                      Instagram
                    </Label>
                    <div className='relative'>
                      <span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'>
                        @
                      </span>
                      <Input
                        id='instagram'
                        type='text'
                        value={instagram}
                        onChange={(e) => {
                          setInstagram(e.target.value);
                          setErrors({ ...errors, instagram: '' });
                        }}
                        placeholder='username'
                        className='pl-8'
                      />
                    </div>
                    {errors.instagram && (
                      <p className='mt-1 text-sm text-red-500'>{errors.instagram}</p>
                    )}
                  </div>

                  {/* X (Twitter) */}
                  <div>
                    <Label htmlFor='x' className='mb-2 flex items-center gap-2'>
                      <div className='flex h-4 w-4 items-center justify-center rounded-sm bg-black text-xs font-bold text-white'>
                        𝕏
                      </div>
                      X (formerly Twitter)
                    </Label>
                    <div className='relative'>
                      <span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'>
                        @
                      </span>
                      <Input
                        id='x'
                        type='text'
                        value={xHandle}
                        onChange={(e) => {
                          setXHandle(e.target.value);
                          setErrors({ ...errors, x: '' });
                        }}
                        placeholder='username'
                        className='pl-8'
                      />
                    </div>
                    {errors.x && <p className='mt-1 text-sm text-red-500'>{errors.x}</p>}
                  </div>

                  {/* Website */}
                  <div>
                    <Label htmlFor='website' className='mb-2 flex items-center gap-2'>
                      <Globe className='h-4 w-4' />
                      Website
                    </Label>
                    <Input
                      id='website'
                      type='text'
                      value={website}
                      onChange={(e) => {
                        setWebsite(e.target.value);
                        setErrors({ ...errors, website: '' });
                      }}
                      placeholder='yourwebsite.com'
                    />
                    {errors.website && (
                      <p className='mt-1 text-sm text-red-500'>{errors.website}</p>
                    )}
                  </div>

                  {/* Info text */}
                  <p className='text-sm text-gray-500'>
                    Add your social media profiles to help others connect with you outside of
                    Evento. Add your social media profiles to help others connect with you outside
                    of Evento.
                  </p>

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
