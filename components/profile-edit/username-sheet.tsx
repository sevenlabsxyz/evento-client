'use client';

import { useState, useEffect } from 'react';
import { AtSign, X, CheckCircle, XCircle } from 'lucide-react';
import { SheetWithDetentFull } from '@/components/ui/sheet-with-detent-full';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/lib/utils/toast';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useCheckUsername } from '@/lib/hooks/useCheckUsername';

interface UsernameSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (username: string) => void;
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
  const [error, setError] = useState('');
  
  const debouncedUsername = useDebounce(username, 500);
  const checkUsernameMutation = useCheckUsername();

  // Reset state when sheet opens
  useEffect(() => {
    if (isOpen) {
      setUsername(currentUsername);
      setIsAvailable(null);
      setError('');
    }
  }, [isOpen, currentUsername]);

  // Check username availability
  useEffect(() => {
    if (!debouncedUsername || debouncedUsername === currentUsername) {
      setIsAvailable(null);
      setError('');
      return;
    }

    // Check availability using the API
    const checkAvailability = async () => {
      const result = await checkUsernameMutation.mutateAsync(debouncedUsername);
      setIsAvailable(result.available);
      if (!result.available && result.message) {
        setError(result.message);
      } else {
        setError('');
      }
    };

    checkAvailability();
  }, [debouncedUsername, currentUsername, checkUsernameMutation]);

  const handleSave = () => {
    if (!username || username === currentUsername) {
      onClose();
      return;
    }

    if (!isAvailable) {
      toast.error('Please choose an available username');
      return;
    }

    onSave(username);
    onClose();
  };

  const handleCancel = () => {
    setUsername(currentUsername);
    onClose();
  };

  const canSave = username && username !== currentUsername && isAvailable;

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
              <SheetWithDetentFull.Handle />
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Username</h2>
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
                  {/* Input with icon */}
                  <div className="relative mb-4">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <AtSign className="w-5 h-5 text-gray-400" />
                    </div>
                    <Input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase())}
                      placeholder="username"
                      className="pl-10 pr-10"
                      autoFocus
                    />
                    {/* Status icon */}
                    {checkUsernameMutation.isPending && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                      </div>
                    )}
                    {!checkUsernameMutation.isPending && isAvailable === true && username !== currentUsername && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                    )}
                    {!checkUsernameMutation.isPending && isAvailable === false && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <XCircle className="w-5 h-5 text-red-500" />
                      </div>
                    )}
                  </div>

                  {/* Error message */}
                  {error && (
                    <p className="text-sm text-red-500 mb-4">{error}</p>
                  )}

                  {/* Success message */}
                  {isAvailable && username !== currentUsername && (
                    <p className="text-sm text-green-500 mb-4">
                      Username is available!
                    </p>
                  )}

                  {/* Info text */}
                  <p className="text-sm text-gray-500 mb-6">
                    Your username is unique and helps others find you on Evento. 
                    It can only contain letters, numbers, and underscores.
                  </p>

                  {/* Save/Cancel Buttons */}
                  <div className="flex gap-3">
                    <Button
                      onClick={handleSave}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                      disabled={!canSave}
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