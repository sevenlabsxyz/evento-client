'use client';

import { CircledIconButton } from '@/components/circled-icon-button';
import { Button } from '@/components/ui/button';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { BackupChoiceSheet } from '@/components/wallet/backup-choice-sheet';
import { BetaSheet } from '@/components/wallet/beta-sheet';
import { useWallet } from '@/lib/hooks/use-wallet';
import { WalletStorageService } from '@/lib/services/wallet-storage';
import { useTopBar } from '@/lib/stores/topbar-store';
import { toast } from '@/lib/utils/toast';
import { AlertCircle, ChevronRight, Lock, Shield, Trash2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function WalletSettingsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { walletState, lockWallet } = useWallet();
  const { applyRouteConfig, setTopBarForRoute, clearRoute } = useTopBar();
  const [showDeleteSheet, setShowDeleteSheet] = useState(false);
  const [showBetaSheet, setShowBetaSheet] = useState(false);
  const [showBackupChoiceSheet, setShowBackupChoiceSheet] = useState(false);

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
            className='flex w-full items-center gap-3 rounded-3xl border border-gray-200 bg-gray-50 p-4 text-left transition-colors hover:bg-gray-50'
          >
            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-100'>
              <Lock className='h-5 w-5 text-blue-600' />
            </div>
            <div className='flex-1'>
              <div className='font-medium'>Lock Wallet</div>
              <div className='text-sm text-muted-foreground'>Require password to access</div>
            </div>
            <CircledIconButton icon={ChevronRight} className='bg-white' />
          </button>

          {/* Backup Status */}
          <button
            onClick={() => setShowBackupChoiceSheet(true)}
            className='flex w-full items-center gap-3 rounded-3xl border border-gray-200 bg-gray-50 p-4 text-left transition-colors hover:bg-gray-50'
          >
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
            <CircledIconButton icon={ChevronRight} className='bg-white' />
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className='space-y-4'>
        <h2 className='text-lg font-semibold text-red-600'>Danger Zone</h2>

        <div className='rounded-3xl border border-red-200 bg-red-50 p-4'>
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

          <Button onClick={() => setShowDeleteSheet(true)} variant='destructive' className='w-full'>
            <Trash2 className='mr-2 h-4 w-4' />
            Delete Wallet
          </Button>
        </div>
      </div>

      {/* Beta Information Sheet */}
      <BetaSheet open={showBetaSheet} onOpenChange={setShowBetaSheet} />

      {/* Backup Choice Sheet */}
      <BackupChoiceSheet
        open={showBackupChoiceSheet}
        onOpenChange={setShowBackupChoiceSheet}
        onEncryptedBackupComplete={() => {
          setShowBackupChoiceSheet(false);
        }}
      />

      {/* Delete Wallet Confirmation Sheet */}
      <MasterScrollableSheet
        title='Delete Wallet'
        open={showDeleteSheet}
        onOpenChange={setShowDeleteSheet}
      >
        <div className='space-y-6 px-4 pb-8'>
          <div className='flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4'>
            <AlertCircle className='h-5 w-5 flex-shrink-0 text-red-600' />
            <div className='text-sm text-red-900'>
              <p className='font-medium'>This action cannot be undone</p>
              <p className='mt-1'>
                Your wallet will be permanently deleted from this device. Make sure you have backed
                up your recovery phrase before proceeding.
              </p>
            </div>
          </div>

          <div className='space-y-3'>
            <Button onClick={handleDeleteWallet} variant='destructive' className='w-full'>
              <Trash2 className='mr-2 h-4 w-4' />
              Yes, Delete Wallet
            </Button>
            <Button onClick={() => setShowDeleteSheet(false)} variant='outline' className='w-full'>
              Cancel
            </Button>
          </div>
        </div>
      </MasterScrollableSheet>
    </div>
  );
}
