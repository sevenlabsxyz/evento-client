'use client';

import { Button } from '@/components/ui/button';
import { BetaSheet } from '@/components/wallet/beta-sheet';
import { useLightningAddress } from '@/lib/hooks/use-lightning-address';
import { useWallet } from '@/lib/hooks/use-wallet';
import { WalletStorageService } from '@/lib/services/wallet-storage';
import { useTopBar } from '@/lib/stores/topbar-store';
import { toast } from '@/lib/utils/toast';
import { AlertCircle, Lock, Shield, Trash2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function WalletSettingsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { walletState, lockWallet } = useWallet();
  const { applyRouteConfig, setTopBarForRoute, clearRoute } = useTopBar();
  const { address } = useLightningAddress();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBetaSheet, setShowBetaSheet] = useState(false);

  useEffect(() => {
    applyRouteConfig(pathname);
    setTopBarForRoute(pathname, {
      title: 'Wallet Settings',
      badge: 'Beta',
      onBadgeClick: () => setShowBetaSheet(true),
      leftMode: 'back',
      showAvatar: false,
    });
    return () => {
      clearRoute(pathname);
    };
  }, [pathname, setTopBarForRoute, applyRouteConfig, clearRoute, router]);

  const handleLockWallet = () => {
    lockWallet();
    toast.success('Wallet locked');
    router.push('/e/wallet');
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
            className='flex w-full items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-left transition-colors hover:bg-gray-50'
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
          <div className='flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4'>
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
            {/*{!walletState.hasBackup && (*/}
            <Button onClick={() => router.push('/e/wallet')} variant='outline' size='sm'>
              Backup Now
            </Button>
            {/*)}*/}
          </div>
        </div>
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

      {/* Beta Information Sheet */}
      <BetaSheet open={showBetaSheet} onOpenChange={setShowBetaSheet} />
    </div>
  );
}
