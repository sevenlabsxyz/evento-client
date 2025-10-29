'use client';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BackupReminder } from '@/components/wallet/backup-reminder';
import { EncryptedBackup } from '@/components/wallet/encrypted-backup';
import { ReceiveLightningSheet } from '@/components/wallet/receive-invoice-sheet';
import { SeedBackup } from '@/components/wallet/seed-backup';
import { SendLightningSheet } from '@/components/wallet/send-lightning-sheet';
import { TransactionDetailsSheet } from '@/components/wallet/transaction-details-sheet';
import { TransactionHistory } from '@/components/wallet/transaction-history';
import { TransactionHistorySheet } from '@/components/wallet/transaction-history-sheet';
import { WalletBalance } from '@/components/wallet/wallet-balance';
import { WalletRestore } from '@/components/wallet/wallet-restore';
import { WalletSetup } from '@/components/wallet/wallet-setup';
import { WalletUnlock } from '@/components/wallet/wallet-unlock';
import { useAuth, useRequireAuth } from '@/lib/hooks/use-auth';
import { useLightningAddress } from '@/lib/hooks/use-lightning-address';
import { useWallet } from '@/lib/hooks/use-wallet';
import { usePaymentHistory } from '@/lib/hooks/use-wallet-payments';
import { WalletStorageService } from '@/lib/services/wallet-storage';
import { useTopBar } from '@/lib/stores/topbar-store';
import { toast } from '@/lib/utils/toast';
import { Payment } from '@breeztech/breez-sdk-spark/web';
import { Copy, History, Settings } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type WalletStep = 'welcome' | 'setup' | 'restore' | 'backup' | 'encrypted-backup' | 'main';
type DrawerContent = 'receive' | 'send' | 'history' | 'transaction-details' | null;

export default function WalletPage() {
  const { isLoading: isCheckingAuth } = useRequireAuth();
  const { user } = useAuth();
  const { setTopBarForRoute, applyRouteConfig, clearRoute } = useTopBar();
  const pathname = usePathname();
  const router = useRouter();
  const { walletState, isLoading: isWalletLoading, markAsBackedUp } = useWallet();
  const { payments, isLoading: isLoadingPayments } = usePaymentHistory();
  const { address, checkAvailability, registerAddress } = useLightningAddress();

  const [step, setStep] = useState<WalletStep>('welcome');
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [drawerContent, setDrawerContent] = useState<DrawerContent>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Payment | null>(null);
  const [showBackupReminder, setShowBackupReminder] = useState(false);

  const openDrawer = (content: DrawerContent) => {
    setDrawerContent(content);
  };

  const closeDrawer = () => {
    setDrawerContent(null);
    setSelectedTransaction(null);
  };

  const handleTransactionClick = (payment: Payment) => {
    setSelectedTransaction(payment);
    setDrawerContent('transaction-details');
  };

  useEffect(() => {
    applyRouteConfig(pathname);
    setTopBarForRoute(pathname, {
      title: 'Wallet',
      centerMode: 'title',
      showAvatar: false,
      buttons: [
        {
          id: 'history',
          icon: History,
          onClick: () => openDrawer('history'),
          label: 'History',
          disabled: !walletState.isConnected,
        },
        {
          id: 'settings',
          icon: Settings,
          onClick: () => router.push('/e/wallet/settings'),
          label: 'Settings',
          disabled: !walletState.isConnected,
        },
      ],
    });
    return () => {
      clearRoute(pathname);
    };
  }, [pathname, setTopBarForRoute, applyRouteConfig, clearRoute, router, walletState.isConnected]);

  // Determine initial step based on wallet state
  useEffect(() => {
    if (!isWalletLoading) {
      if (walletState.isInitialized && walletState.isConnected) {
        setStep('main');

        // Check if should show backup reminder (only if wallet wasn't restored)
        if (!walletState.hasBackup && WalletStorageService.shouldShowBackupReminder()) {
          setShowBackupReminder(true);
        }
      } else if (walletState.isInitialized) {
        // Wallet exists but not connected - will show unlock screen
        setStep('main');
      } else {
        setStep('welcome');
      }
    }
  }, [isWalletLoading, walletState.isInitialized, walletState.isConnected, walletState.hasBackup]);

  // Automatically register Lightning address if wallet is connected but no address exists
  useEffect(() => {
    const registerLightningAddressIfNeeded = async () => {
      if (walletState.isConnected && !address && user?.username) {
        try {
          const baseUsername = user.username.toLowerCase().replace(/[^a-z0-9]/g, '');
          let username = baseUsername;
          let isAvailable = false;
          let attempts = 0;

          // Try base username, then add numbers if taken
          while (!isAvailable && attempts < 10) {
            isAvailable = await checkAvailability(username);
            if (!isAvailable) {
              attempts++;
              username = `${baseUsername}${attempts}`;
            }
          }

          if (isAvailable) {
            await registerAddress(username, `Pay to ${user.name || user.username}`);
            console.log(`Lightning address registered: ${username}@evt.cash`);
          }
        } catch (error) {
          console.error('Failed to auto-register Lightning address:', error);
        }
      }
    };

    registerLightningAddressIfNeeded();
  }, [walletState.isConnected, address, user, checkAvailability, registerAddress]);

  const handleSetupComplete = (generatedMnemonic?: string) => {
    // Store mnemonic temporarily in case backup is needed later
    if (generatedMnemonic) {
      setMnemonic(generatedMnemonic);
      // Set initial backup reminder timestamp to prevent immediate reminder
      WalletStorageService.updateBackupReminderTimestamp();
    }
    // Skip backup step and go directly to main wallet
    setStep('main');
  };

  const handleBackupComplete = () => {
    markAsBackedUp();
    setMnemonic(null);
    setStep('main');
  };

  const handleBackupSkip = () => {
    setMnemonic(null);
    setStep('main');
  };

  const handleRestoreComplete = () => {
    setStep('main');
  };

  const handleBackupRequired = () => {
    // Close drawer and show backup flow
    closeDrawer();
    if (mnemonic) {
      setStep('backup');
    } else {
      toast.error('Unable to retrieve seed phrase. Please contact support.');
    }
  };

  if (isCheckingAuth || isWalletLoading) {
    return (
      <div className='mx-auto max-w-sm space-y-6 pb-28 pt-4'>
        {/* Balance Card Skeleton */}
        <Skeleton className='h-32 w-full rounded-2xl' />

        {/* Action Buttons Skeleton */}
        <div className='grid grid-cols-2 gap-3'>
          <Skeleton className='h-20 rounded-xl' />
          <Skeleton className='h-20 rounded-xl' />
        </div>

        {/* Recent Transactions Skeleton */}
        <div className='space-y-3'>
          <Skeleton className='h-6 w-40' />
          <div className='space-y-3'>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className='h-20 w-full rounded-lg' />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Welcome Screen
  if (step === 'welcome') {
    return (
      <div className='relative flex min-h-[calc(100vh-8rem)] flex-col'>
        <div className='mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center px-6'>
          <div className='flex w-full flex-col items-center gap-8'>
            <div className='text-center'>
              <h1 className='text-3xl font-bold tracking-tight'>Lightning Wallet</h1>
              <p className='mt-2 text-sm text-muted-foreground'>
                Send and receive Bitcoin instantly
              </p>
            </div>

            <div className='mt-4 w-full space-y-3'>
              <Button onClick={() => setStep('setup')} className='w-full text-base' size='lg'>
                Setup Wallet
              </Button>
              <Button
                onClick={() => setStep('restore')}
                className='w-full text-base'
                size='lg'
                variant='outline'
              >
                Restore Wallet
              </Button>
            </div>

            <div className='mt-8 w-full text-center'>
              <div className='rounded-lg bg-blue-50 p-4 text-sm text-blue-900'>
                <p className='font-medium'>Non-custodial & Secure</p>
                <p className='mt-1'>Your keys, your Bitcoin. We never have access to your funds.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer at bottom */}
        <div className='pb-8 pt-4 text-center'>
          <p className='text-xs text-muted-foreground'>Powered by Breez SDK</p>
        </div>
      </div>
    );
  }

  // Setup Screen
  if (step === 'setup') {
    return (
      <div className='mx-auto max-w-sm pb-28 pt-4'>
        <WalletSetup onComplete={handleSetupComplete} onCancel={() => setStep('welcome')} />
      </div>
    );
  }

  // Restore Screen
  if (step === 'restore') {
    return (
      <div className='mx-auto max-w-sm pb-28 pt-4'>
        <WalletRestore onComplete={handleRestoreComplete} onCancel={() => setStep('welcome')} />
      </div>
    );
  }

  // Backup Screen
  if (step === 'backup' && mnemonic) {
    return (
      <div className='mx-auto max-w-sm pb-28 pt-4'>
        <SeedBackup
          mnemonic={mnemonic}
          onComplete={handleBackupComplete}
          onSkip={handleBackupSkip}
        />
      </div>
    );
  }

  // Encrypted Backup Screen
  if (step === 'encrypted-backup') {
    return (
      <div className='mx-auto max-w-sm pb-28 pt-4'>
        <EncryptedBackup onComplete={() => setStep('main')} onCancel={() => setStep('main')} />
      </div>
    );
  }

  // Unlock Screen - Show when wallet is initialized but not connected
  if (
    walletState.isInitialized &&
    !walletState.isConnected &&
    !isWalletLoading &&
    step === 'main'
  ) {
    return (
      <div className='mx-auto max-w-sm pb-28 pt-4'>
        <WalletUnlock />
      </div>
    );
  }

  // Main Wallet Screen
  return (
    <div className='mx-auto max-w-sm pb-28 pt-4'>
      <div className='space-y-6'>
        {/* Backup Reminder */}
        {showBackupReminder && (
          <BackupReminder
            onBackup={() => {
              setShowBackupReminder(false);
              setStep('encrypted-backup');
            }}
            onDismiss={() => setShowBackupReminder(false)}
          />
        )}

        {/* Lightning Address - Only show if wallet is initialized */}
        {walletState.isInitialized && user?.lightning_address && (
          <div className='rounded-xl bg-gray-50 p-4'>
            <div className='flex items-center justify-between'>
              <div className='min-w-0 flex-1'>
                <p className='mb-1 text-xs text-muted-foreground'>Lightning Address</p>
                <p className='truncate font-mono text-sm'>{user.lightning_address}</p>
              </div>
              <Button
                variant='ghost'
                size='sm'
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(user.lightning_address!);
                    toast.success('Address copied');
                  } catch (error) {
                    toast.error('Failed to copy');
                  }
                }}
              >
                <Copy className='h-4 w-4' />
              </Button>
            </div>
          </div>
        )}

        {/* Balance and Actions */}
        <WalletBalance onSend={() => openDrawer('send')} onReceive={() => openDrawer('receive')} />

        {/* Recent Transactions Preview */}
        <div className='space-y-3'>
          <h3 className='font-semibold'>Recent Transactions</h3>
          <TransactionHistory
            payments={payments.slice(0, 5)}
            isLoading={isLoadingPayments}
            onRefresh={() => {}}
            onTransactionClick={handleTransactionClick}
          />
          {!isLoadingPayments && payments.length > 5 && (
            <Button onClick={() => openDrawer('history')} variant='outline' className='w-full'>
              View All Transactions
            </Button>
          )}
        </div>

        {/* Sheets */}
        <ReceiveLightningSheet
          open={drawerContent === 'receive'}
          onOpenChange={(open) => !open && closeDrawer()}
        />
        <SendLightningSheet
          open={drawerContent === 'send'}
          onOpenChange={(open) => !open && closeDrawer()}
          onBackupRequired={handleBackupRequired}
        />
        <TransactionHistorySheet
          open={drawerContent === 'history'}
          onOpenChange={(open) => !open && closeDrawer()}
          payments={payments}
          isLoading={isLoadingPayments}
          onTransactionClick={handleTransactionClick}
        />
        {selectedTransaction && (
          <TransactionDetailsSheet
            open={drawerContent === 'transaction-details'}
            onOpenChange={(open) => !open && closeDrawer()}
            payment={selectedTransaction}
          />
        )}
      </div>
    </div>
  );
}
