'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { useLightningAddress } from '@/lib/hooks/use-lightning-address';
import { useWallet } from '@/lib/hooks/use-wallet';
import { WalletStorageService } from '@/lib/services/wallet-storage';
import { useTopBar } from '@/lib/stores/topbar-store';
import { toast } from '@/lib/utils/toast';
import { AlertCircle, Bolt, Check, Loader2, Lock, Pencil, Shield, Trash2, X } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function WalletSettingsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { walletState, lockWallet } = useWallet();
  const { applyRouteConfig, setTopBarForRoute, clearRoute } = useTopBar();
  const { address, checkAvailability, registerAddress } = useLightningAddress();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  // Debounce username for availability checking
  const debouncedUsername = useDebounce(newUsername, 500);

  useEffect(() => {
    applyRouteConfig(pathname);
    setTopBarForRoute(pathname, {
      title: 'Wallet Settings',
      leftMode: 'back',
      showAvatar: false,
    });
    return () => {
      clearRoute(pathname);
    };
  }, [pathname, setTopBarForRoute, applyRouteConfig, clearRoute, router]);

  // Check availability when debounced username changes
  useEffect(() => {
    const checkUsernameAvailability = async () => {
      // Reset states if username is too short or same as current
      if (!debouncedUsername || debouncedUsername.length < 3) {
        setIsCheckingAvailability(false);
        setIsAvailable(null);
        setAvailabilityError(null);
        return;
      }

      // If it's the same as current username, mark as available
      if (debouncedUsername === address?.username) {
        setIsAvailable(true);
        setIsCheckingAvailability(false);
        setAvailabilityError(null);
        return;
      }

      // Check availability
      try {
        setIsCheckingAvailability(true);
        setAvailabilityError(null);
        const available = await checkAvailability(debouncedUsername);
        setIsAvailable(available);
      } catch (error: any) {
        console.error('Failed to check availability:', error);
        setIsAvailable(null);
        setAvailabilityError(error.message || 'Failed to check availability');
      } finally {
        setIsCheckingAvailability(false);
      }
    };

    checkUsernameAvailability();
  }, [debouncedUsername, address?.username, checkAvailability]);

  const handleLockWallet = () => {
    lockWallet();
    toast.success('Wallet locked');
    router.push('/e/wallet');
  };

  const handleSaveLightningAddress = async () => {
    if (!newUsername || isAvailable !== true) return;

    try {
      setIsSavingAddress(true);
      await registerAddress(newUsername, `Pay to ${newUsername}`);
      toast.success('Lightning address updated!');
      setIsEditingAddress(false);
      setNewUsername('');
      setIsAvailable(null);
      setAvailabilityError(null);
    } catch (error: any) {
      console.error('Failed to save Lightning address:', error);
      toast.error(error.message || 'Failed to update address');
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleDeleteWallet = () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    // Clear all wallet data
    WalletStorageService.clearWalletData();
    toast.success('Wallet deleted');
    router.push('/e/wallet');

    // Reload to reset state
    window.location.reload();
  };

  if (!walletState.isConnected) {
    router.push('/e/wallet');
  }

  return (
    <div className='mx-auto max-w-sm space-y-6 pb-28 pt-4'>
      {/* Security Section */}
      <div className='space-y-4'>
        <h2 className='text-lg font-semibold'>Security</h2>

        <div className='space-y-3'>
          {/* Lock Wallet */}
          <button
            onClick={handleLockWallet}
            className='flex w-full items-center gap-3 rounded-lg border bg-white p-4 text-left transition-colors hover:bg-gray-50'
          >
            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-100'>
              <Lock className='h-5 w-5 text-blue-600' />
            </div>
            <div className='flex-1'>
              <div className='font-medium'>Lock Wallet</div>
              <div className='text-sm text-muted-foreground'>Require password to access</div>
            </div>
          </button>

          {/* Backup Status */}
          <div className='flex items-center gap-3 rounded-lg border bg-white p-4'>
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                walletState.hasBackup ? 'bg-green-100' : 'bg-amber-100'
              }`}
            >
              <Shield
                className={`h-5 w-5 ${walletState.hasBackup ? 'text-green-600' : 'text-amber-600'}`}
              />
            </div>
            <div className='flex-1'>
              <div className='font-medium'>Backup Status</div>
              <div className='text-sm text-muted-foreground'>
                {walletState.hasBackup ? (
                  <span className='text-green-600'>Backed up</span>
                ) : (
                  <span className='text-amber-600'>Not backed up</span>
                )}
              </div>
            </div>
            {!walletState.hasBackup && (
              <Button onClick={() => router.push('/e/wallet')} variant='outline' size='sm'>
                Backup Now
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Lightning Address Section */}
      <div className='space-y-4'>
        <h2 className='text-lg font-semibold'>Lightning Address</h2>

        {!isEditingAddress ? (
          <div className='flex items-center gap-3 rounded-lg border bg-white p-4'>
            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-purple-100'>
              <Bolt className='h-5 w-5 text-purple-600' />
            </div>
            <div className='min-w-0 flex-1'>
              <div className='font-medium'>Your Address</div>
              <div className='truncate text-sm text-muted-foreground'>
                {address?.lightningAddress || 'Not set'}
              </div>
            </div>
            <Button
              onClick={() => {
                setIsEditingAddress(true);
                setNewUsername(address?.username || '');
              }}
              variant='outline'
              size='sm'
            >
              <Pencil className='h-4 w-4' />
            </Button>
          </div>
        ) : (
          <div className='space-y-3 rounded-lg border bg-white p-4'>
            <div className='flex items-center justify-between'>
              <div className='font-medium'>Edit Lightning Address</div>
              <button
                onClick={() => {
                  setIsEditingAddress(false);
                  setNewUsername('');
                  setIsAvailable(null);
                }}
                className='rounded-full p-1 transition-colors hover:bg-gray-100'
              >
                <X className='h-4 w-4' />
              </button>
            </div>

            <div className='space-y-2'>
              <div className='relative'>
                <Input
                  value={newUsername}
                  onChange={(e) => {
                    // Clean input: lowercase and alphanumeric only
                    const value = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '');
                    setNewUsername(value);
                  }}
                  placeholder='username'
                  className='pr-10'
                />
                {isCheckingAvailability && (
                  <div className='absolute right-3 top-1/2 -translate-y-1/2'>
                    <Loader2 className='h-4 w-4 animate-spin text-gray-400' />
                  </div>
                )}
              </div>
              <div className='flex items-center gap-2 text-sm'>
                <span>@evt.cash</span>
                {isAvailable === true && (
                  <span className='flex items-center gap-1 text-green-600'>
                    <Check className='h-3 w-3' />
                    Available
                  </span>
                )}
                {isAvailable === false && <span className='text-red-600'>Not available</span>}
              </div>

              {/* Error message */}
              {availabilityError && (
                <div className='rounded-md bg-red-50 p-2 text-sm text-red-600'>
                  An error occured. Please try again later.
                </div>
              )}
            </div>

            <Button
              onClick={handleSaveLightningAddress}
              className='w-full'
              disabled={!newUsername || isAvailable !== true || isSavingAddress}
            >
              {isSavingAddress ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Saving...
                </>
              ) : (
                'Save Address'
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className='space-y-4'>
        <h2 className='text-lg font-semibold text-red-600'>Danger Zone</h2>

        <div className='rounded-lg border border-red-200 bg-red-50 p-4'>
          <div className='mb-4 flex items-start gap-3'>
            <AlertCircle className='h-5 w-5 flex-shrink-0 text-red-600' />
            <div className='text-sm text-red-900'>
              <p className='font-medium'>Delete Wallet</p>
              <p className='mt-1'>
                This will permanently delete your wallet from this device. Make sure you have backed
                up your wallet before proceeding.
              </p>
            </div>
          </div>

          {!showDeleteConfirm ? (
            <Button onClick={handleDeleteWallet} variant='destructive' className='w-full'>
              <Trash2 className='mr-2 h-4 w-4' />
              Delete Wallet
            </Button>
          ) : (
            <div className='space-y-3'>
              <p className='text-sm font-medium text-red-900'>
                Are you absolutely sure? This action cannot be undone.
              </p>
              <div className='flex gap-2'>
                <Button onClick={handleDeleteWallet} variant='destructive' className='flex-1'>
                  Yes, Delete Wallet
                </Button>
                <Button
                  onClick={() => setShowDeleteConfirm(false)}
                  variant='outline'
                  className='flex-1'
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
