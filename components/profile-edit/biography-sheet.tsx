'use client';

import { Button } from '@/components/ui/button';
import { SheetWithDetentFull } from '@/components/ui/sheet-with-detent-full';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface BiographySheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bio: string) => void;
  currentBio?: string;
}

export default function BiographySheet({
  isOpen,
  onClose,
  onSave,
  currentBio = '',
}: BiographySheetProps) {
  const [bio, setBio] = useState(currentBio);
  const maxLength = 500;

  // Reset state when sheet opens
  useEffect(() => {
    if (isOpen) {
      setBio(currentBio);
    }
  }, [isOpen, currentBio]);

  const handleSave = () => {
    onSave(bio.trim());
    onClose();
  };

  const handleCancel = () => {
    setBio(currentBio);
    onClose();
  };

  const hasChanges = bio !== currentBio;

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
            <div className="sticky top-0 bg-white z-10 px-4 pt-4 pb-4 border-b border-gray-100">
              <div className="flex justify-center mb-4">
                <SheetWithDetentFull.Handle />
              </div>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Biography</h2>
                <button
                  onClick={handleCancel}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <SheetWithDetentFull.ScrollRoot asChild>
              <SheetWithDetentFull.ScrollView>
                <SheetWithDetentFull.ScrollContent className="p-6">
                  {/* Textarea */}
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    className="min-h-[200px] resize-none mb-4"
                    maxLength={maxLength}
                    autoFocus
                  />

                  {/* Character count */}
                  <p className="text-sm text-gray-500 text-right mb-4">
                    {bio.length}/{maxLength}
                  </p>

                  {/* Info text */}
                  <p className="text-sm text-gray-500 mb-6">
                    Write a short bio to help others get to know you. Share your
                    interests, what brings you to events, or anything else you'd
                    like people to know.
                  </p>

                  {/* Save/Cancel Buttons */}
                  <div className="flex gap-3">
                    <Button
                      onClick={handleSave}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                      disabled={!hasChanges}
                    >
                      Save
                    </Button>
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      className="flex-1"
                    >
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
