'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SheetWithDetentFull } from '@/components/ui/sheet-with-detent-full';
import { useLightningAddress } from '@/lib/hooks/use-lightning-address';
import { useUpdateUserProfile } from '@/lib/hooks/use-user-profile';
import { useWallet } from '@/lib/hooks/use-wallet';
import { validateUpdateUserProfile } from '@/lib/schemas/user';
import { logger } from '@/lib/utils/logger';
import { toast } from '@/lib/utils/toast';
import { redirectToWalletUnlock } from '@/lib/utils/wallet-unlock-toast';
import { Loader2, X, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface LightningAddressSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (address: string) => void;
  currentAddress?: string;
}

export default function LightningAddressSheet({
  isOpen,
  onClose,
  onSave,
  currentAddress = '',
}: LightningAddressSheetProps) {
  const router = useRouter();
  const [address, setAddress] = useState(currentAddress);
  const updateProfileMutation = useUpdateUserProfile();
  const { walletState } = useWallet();
  const { address: walletAddress } = useLightningAddress({
    autoLoad: true,
    autoSyncToBackend: true,
  });
  const isWalletManaged = walletState.isInitialized;
  const walletManagedAddress = walletAddress?.lightningAddress || currentAddress;

  // Reset state when sheet opens
  useEffect(() => {
    if (isOpen) {
      setAddress(isWalletManaged ? walletManagedAddress : currentAddress);
    }
  }, [currentAddress, isOpen, isWalletManaged, walletManagedAddress]);

  const validateLightningAddress = (addr: string) => {
    if (!addr) return true;

    // Basic Lightning address validation (user@domain.com format)
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(addr);
  };

  const handleSave = async () => {
    if (isWalletManaged) {
      redirectToWalletUnlock(router);
      return;
    }

    const trimmedAddress = address.trim();

    if (trimmedAddress && !validateLightningAddress(trimmedAddress)) {
      toast.error('Invalid Lightning address format (e.g., user@wallet.com)');
      return;
    }

    if (onSave) {
      onSave(trimmedAddress);
    }

    try {
      // Directly save to API
      const updateData = { ln_address: trimmedAddress };

      // Validate data
      const validation = validateUpdateUserProfile(updateData);
      if (!validation.valid) {
        toast.error(validation.error || 'Invalid Lightning address');
        return;
      }

      // Save to API
      await updateProfileMutation.mutateAsync(updateData);
      toast.success('Lightning address updated successfully');

      // Close sheet
      onClose();
    } catch (error) {
      logger.error('Failed to update Lightning address', { error });
      toast.error('Failed to update Lightning address');
    }
  };

  const handleCancel = () => {
    setAddress(isWalletManaged ? walletManagedAddress : currentAddress);
    onClose();
  };

  const hasChanges = !isWalletManaged && address !== currentAddress;
  const isSaving = updateProfileMutation.isPending;
  const displayedAddress = isWalletManaged ? walletManagedAddress : address;

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
                <h2 className='text-xl font-semibold'>Bitcoin</h2>
                <button onClick={handleCancel} className='rounded-full p-2 hover:bg-gray-100'>
                  <X className='h-5 w-5' />
                </button>
              </div>
              <p className='mt-1 text-sm text-gray-500'>
                {isWalletManaged
                  ? 'Your Lightning address is managed by your Evento wallet.'
                  : 'Add your Lightning Network address to receive payments.'}
              </p>
            </div>

            {/* Content */}
            <SheetWithDetentFull.ScrollRoot asChild>
              <SheetWithDetentFull.ScrollView>
                <SheetWithDetentFull.ScrollContent className='p-6'>
                  {/* Input with icon */}
                  <div className='relative mb-4'>
                    <div className='absolute left-3 top-1/2 -translate-y-1/2'>
                      <Zap className='h-5 w-5 text-orange-500' />
                    </div>
                    <Input
                      type='text'
                      value={displayedAddress}
                      onChange={(e) => {
                        if (!isWalletManaged) {
                          setAddress(e.target.value);
                        }
                      }}
                      placeholder='andre@zbd.gg'
                      className='pl-10'
                      autoFocus
                      disabled={isWalletManaged}
                    />
                  </div>

                  {/* Info text */}
                  <div className='mb-6 space-y-3'>
                    <p className='text-sm text-gray-500'>
                      {isWalletManaged
                        ? 'Evento syncs this address from your built-in wallet so crowdfunding and wallet payments always use the same destination.'
                        : 'Lightning addresses allow you to receive instant Bitcoin payments from anyone attending your events or visiting your profile.'}
                    </p>

                    {isWalletManaged ? (
                      <div className='rounded-xl bg-blue-50 p-4'>
                        <p className='text-sm font-medium text-blue-800'>
                          Open Wallet to unlock, create, or resync your Lightning address.
                        </p>
                      </div>
                    ) : (
                      <div className='rounded-xl bg-orange-50 p-4'>
                        <p className='mb-2 text-sm font-medium text-orange-800'>
                          Popular Lightning wallets:
                        </p>
                        <ul className='space-y-1 text-sm text-orange-700'>
                          <li>• Strike</li>
                          <li>• Cash App</li>
                          <li>• Wallet of Satoshi</li>
                          <li>• ZBD</li>
                          <li>• Alby</li>
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Save/Cancel Buttons */}
                  <div className='flex flex-col gap-3'>
                    <Button
                      onClick={handleSave}
                      disabled={isWalletManaged ? false : !hasChanges || isSaving}
                      className='flex-1 bg-red-500 text-white hover:bg-red-600'
                    >
                      {isWalletManaged ? (
                        'Open Wallet'
                      ) : isSaving ? (
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
