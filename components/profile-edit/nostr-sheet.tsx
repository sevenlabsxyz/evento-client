'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SheetWithDetentFull } from '@/components/ui/sheet-with-detent-full';
import { Hash, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface NostrSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (nip05: string) => void;
  currentNip05?: string;
}

export default function NostrSheet({
  isOpen,
  onClose,
  onSave,
  currentNip05 = '',
}: NostrSheetProps) {
  const [nip05, setNip05] = useState(currentNip05);
  const [error, setError] = useState('');

  // Reset state when sheet opens
  useEffect(() => {
    if (isOpen) {
      setNip05(currentNip05);
      setError('');
    }
  }, [isOpen, currentNip05]);

  const validateNip05 = (identifier: string) => {
    if (!identifier) return true;

    // Basic NIP-05 validation (user@domain.com format)
    const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(identifier);
  };

  const handleSave = () => {
    const trimmedNip05 = nip05.trim();

    if (trimmedNip05 && !validateNip05(trimmedNip05)) {
      setError('Invalid Nostr identifier format (e.g., user@domain.com)');
      return;
    }

    onSave(trimmedNip05);
    onClose();
  };

  const handleCancel = () => {
    setNip05(currentNip05);
    onClose();
  };

  const hasChanges = nip05 !== currentNip05;

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
                <h2 className="text-xl font-semibold">Nostr</h2>
                <button
                  onClick={handleCancel}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Add your Nostr identifier (NIP-05)
              </p>
            </div>

            {/* Content */}
            <SheetWithDetentFull.ScrollRoot asChild>
              <SheetWithDetentFull.ScrollView>
                <SheetWithDetentFull.ScrollContent className="p-6">
                  {/* Input with icon */}
                  <div className="relative mb-4">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <Hash className="w-5 h-5 text-pink-600" />
                    </div>
                    <Input
                      type="text"
                      value={nip05}
                      onChange={(e) => {
                        setNip05(e.target.value);
                        setError('');
                      }}
                      placeholder="user@domain.com"
                      className="pl-10"
                      autoFocus
                    />
                  </div>

                  {/* Error message */}
                  {error && (
                    <p className="text-sm text-red-500 mb-4">{error}</p>
                  )}

                  {/* Info text */}
                  <div className="space-y-3 mb-6">
                    <p className="text-sm text-gray-500">
                      A Nostr identifier (NIP-05) helps people find and verify
                      your Nostr profile. It looks like an email address but is
                      used for the Nostr protocol.
                    </p>

                    <div className="bg-pink-50 p-4 rounded-xl">
                      <p className="text-sm text-pink-800 font-medium mb-2">
                        What is Nostr?
                      </p>
                      <p className="text-sm text-pink-700">
                        Nostr is a decentralized social network protocol that
                        gives you control over your identity and content. Your
                        NIP-05 identifier makes it easy for others to find you
                        across different Nostr apps.
                      </p>
                    </div>
                  </div>

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
