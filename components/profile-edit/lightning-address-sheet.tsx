'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SheetWithDetentFull } from '@/components/ui/sheet-with-detent-full';
import { X, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

interface LightningAddressSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (address: string) => void;
  currentAddress?: string;
}

export default function LightningAddressSheet({
  isOpen,
  onClose,
  onSave,
  currentAddress = '',
}: LightningAddressSheetProps) {
  const [address, setAddress] = useState(currentAddress);
  const [error, setError] = useState('');

  // Reset state when sheet opens
  useEffect(() => {
    if (isOpen) {
      setAddress(currentAddress);
      setError('');
    }
  }, [isOpen, currentAddress]);

  const validateLightningAddress = (addr: string) => {
    if (!addr) return true;

    // Basic Lightning address validation (user@domain.com format)
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(addr);
  };

  const handleSave = () => {
    const trimmedAddress = address.trim();

    if (trimmedAddress && !validateLightningAddress(trimmedAddress)) {
      setError('Invalid Lightning address format (e.g., user@wallet.com)');
      return;
    }

    onSave(trimmedAddress);
    onClose();
  };

  const handleCancel = () => {
    setAddress(currentAddress);
    onClose();
  };

  const hasChanges = address !== currentAddress;

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
                <h2 className="text-xl font-semibold">Bitcoin</h2>
                <button
                  onClick={handleCancel}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Add your Lightning Network address to receive payments.
              </p>
            </div>

            {/* Content */}
            <SheetWithDetentFull.ScrollRoot asChild>
              <SheetWithDetentFull.ScrollView>
                <SheetWithDetentFull.ScrollContent className="p-6">
                  {/* Input with icon */}
                  <div className="relative mb-4">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <Zap className="w-5 h-5 text-orange-500" />
                    </div>
                    <Input
                      type="text"
                      value={address}
                      onChange={(e) => {
                        setAddress(e.target.value);
                        setError('');
                      }}
                      placeholder="andre@zbd.gg"
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
                      Lightning addresses allow you to receive instant Bitcoin
                      payments from anyone attending your events or visiting
                      your profile.
                    </p>

                    <div className="bg-orange-50 p-4 rounded-xl">
                      <p className="text-sm text-orange-800 font-medium mb-2">
                        Popular Lightning wallets:
                      </p>
                      <ul className="text-sm text-orange-700 space-y-1">
                        <li>• Strike</li>
                        <li>• Cash App</li>
                        <li>• Wallet of Satoshi</li>
                        <li>• ZBD</li>
                        <li>• Alby</li>
                      </ul>
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
