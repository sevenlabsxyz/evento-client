'use client';

import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BackupCallout } from '@/components/wallet/backup-callout';
import { BackupChoiceSheet } from '@/components/wallet/backup-choice-sheet';
import { BetaSheet } from '@/components/wallet/beta-sheet';
import { EncryptedBackup } from '@/components/wallet/encrypted-backup';
import { IncomingFundsSheet } from '@/components/wallet/incoming-funds-sheet';
import { QuickToolsSection } from '@/components/wallet/quick-tools-section';
import { ReceiveLightningSheet } from '@/components/wallet/receive-invoice-sheet';
import { ScanQrSheet } from '@/components/wallet/scan-qr-sheet';
import { SeedBackup } from '@/components/wallet/seed-backup';
import { SendLightningSheet } from '@/components/wallet/send-lightning-sheet';
import { BTCConverterSheet } from '@/components/wallet/sheets/btc-converter-sheet';
import { BuySellBitcoinSheet } from '@/components/wallet/sheets/buy-sell-bitcoin-sheet';
import { EarnBitcoinSheet } from '@/components/wallet/sheets/earn-bitcoin-sheet';
import { SpendBitcoinSheet } from '@/components/wallet/sheets/spend-bitcoin-sheet';
import { TransactionDetailsSheet } from '@/components/wallet/transaction-details-sheet';
import { TransactionHistory } from '@/components/wallet/transaction-history';
import { TransactionHistorySheet } from '@/components/wallet/transaction-history-sheet';
import { WalletBalance } from '@/components/wallet/wallet-balance';
import { WalletEducationGallery } from '@/components/wallet/wallet-education-section-gallery';
import { WalletEducationalSheet } from '@/components/wallet/wallet-educational-sheet';
import { WalletRestore } from '@/components/wallet/wallet-restore';
import { WalletSetup } from '@/components/wallet/wallet-setup';
import { WalletUnlock } from '@/components/wallet/wallet-unlock';
import { WalletWelcome } from '@/components/wallet/wallet-welcome';
import { Env } from '@/lib/constants/env';
import { useAuth, useRequireAuth } from '@/lib/hooks/use-auth';
import { useLightningAddress } from '@/lib/hooks/use-lightning-address';
import { useWallet } from '@/lib/hooks/use-wallet';
import { usePaymentHistory } from '@/lib/hooks/use-wallet-payments';
import { breezSDK } from '@/lib/services/breez-sdk';
import { WalletStorageService } from '@/lib/services/wallet-storage';
import { useTopBar } from '@/lib/stores/topbar-store';
import { useWalletPreferences } from '@/lib/stores/wallet-preferences-store';
import { toast } from '@/lib/utils/toast';
import { Payment } from '@breeztech/breez-sdk-spark/web';
import { motion } from 'framer-motion';
import { ChevronsRight, Eye, EyeOff, HelpCircle, Settings } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type WalletStep = 'welcome' | 'setup' | 'restore' | 'backup' | 'encrypted-backup' | 'main';
type DrawerContent =
  | 'receive'
  | 'send'
  | 'scan'
  | 'history'
  | 'transaction-details'
  | 'converter'
  | 'buy-sell'
  | 'spend'
  | 'earn'
  | null;

export default function WalletPage() {
  const { isLoading: isCheckingAuth } = useRequireAuth();
  const { user } = useAuth();
  const { setTopBarForRoute, applyRouteConfig, clearRoute } = useTopBar();
  const pathname = usePathname();
  const router = useRouter();
  const { walletState, isLoading: isWalletLoading, markAsBackedUp } = useWallet();
  const { payments, isLoading: isLoadingPayments } = usePaymentHistory();
  const { address, checkAvailability, registerAddress } = useLightningAddress();
  const { balanceHidden, toggleBalanceVisibility } = useWalletPreferences();

  const [step, setStep] = useState<WalletStep>('welcome');
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [openDrawers, setOpenDrawers] = useState<DrawerContent[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Payment | null>(null);
  const [showBackupReminder, setShowBackupReminder] = useState(false);
  const [showBackupChoiceSheet, setShowBackupChoiceSheet] = useState(false);
  const [showBetaSheet, setShowBetaSheet] = useState(false);
  const [scannedData, setScannedData] = useState<string>('');
  const [unclaimedDepositsCount, setUnclaimedDepositsCount] = useState(0);
  const [showIncomingFundsModal, setShowIncomingFundsModal] = useState(false);
  const [showOnchainEducationalSheet, setShowOnchainEducationalSheet] = useState(false);
  const [onchainEducationalArticle, setOnchainEducationalArticle] = useState<any>(null);

  const openDrawer = (content: DrawerContent) => {
    if (content && !openDrawers.includes(content)) {
      setOpenDrawers([...openDrawers, content]);
    }
  };

  const closeDrawer = (drawer?: DrawerContent) => {
    if (drawer) {
      setOpenDrawers(openDrawers.filter((d) => d !== drawer));
      if (drawer === 'transaction-details') {
        // Delay clearing to allow exit animation to complete
        setTimeout(() => setSelectedTransaction(null), 400);
      }
    } else {
      setOpenDrawers([]);
      setSelectedTransaction(null);
    }
  };

  const handleTransactionClick = (payment: Payment) => {
    setSelectedTransaction(payment);
    if (!openDrawers.includes('transaction-details')) {
      setOpenDrawers([...openDrawers, 'transaction-details']);
    }
  };

  useEffect(() => {
    applyRouteConfig(pathname);
    setTopBarForRoute(pathname, {
      title: 'Wallet',
      badge: 'Beta',
      onBadgeClick: () => setShowBetaSheet(true),
      centerMode: 'title',
      showAvatar: false,
      buttons: [
        {
          id: 'toggle-balance',
          icon: balanceHidden ? EyeOff : Eye,
          onClick: toggleBalanceVisibility,
          label: balanceHidden ? 'Show balance' : 'Hide balance',
        },
        {
          id: 'settings',
          icon: Settings,
          onClick: () => router.push('/e/wallet/settings'),
          label: 'Settings',
        },
      ],
    });
    return () => {
      clearRoute(pathname);
    };
  }, [
    pathname,
    setTopBarForRoute,
    applyRouteConfig,
    clearRoute,
    router,
    walletState.isConnected,
    balanceHidden,
    toggleBalanceVisibility,
  ]);

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
          let isAvailable = false;
          let attempts = 0;

          // Retry the SAME username (not numbered variations) up to 10 times
          while (!isAvailable && attempts < 10) {
            isAvailable = await checkAvailability(baseUsername);
            if (!isAvailable) {
              attempts++;
              // Add exponential backoff delay before retrying (1s, 2s, 3s...)
              await new Promise((resolve) => setTimeout(resolve, 1000 * attempts));
            }
          }

          if (isAvailable) {
            await registerAddress(baseUsername, `Pay to ${user.name || user.username}`);
            console.log(`Lightning address registered: ${baseUsername}@evento.cash`);
          }
        } catch (error) {
          console.error('Failed to auto-register Lightning address:', error);
        }
      }
    };

    registerLightningAddressIfNeeded();
  }, [walletState.isConnected, address, user, checkAvailability, registerAddress]);

  // Listen for deposit events and manage unclaimed deposits
  useEffect(() => {
    if (!walletState.isConnected) return;

    // Load initial unclaimed deposits count
    const loadUnclaimedDeposits = async () => {
      try {
        const deposits = await breezSDK.listUnclaimedDeposits();
        setUnclaimedDepositsCount(deposits.length);
      } catch (error) {
        console.error('Failed to load unclaimed deposits:', error);
      }
    };

    loadUnclaimedDeposits();

    // Listen for deposit events
    const unsubscribe = breezSDK.onEvent((event) => {
      if (event.type === 'claimedDeposits') {
        const deposits = (event as any).claimedDeposits || [];
        const totalAmount = deposits.reduce((sum: number, d: any) => sum + (d.amountSats || 0), 0);
        toast.success(
          `Deposit claimed! ${totalAmount.toLocaleString()} sats added to your balance`
        );
        // Refresh unclaimed deposits count
        void loadUnclaimedDeposits();
      } else if (event.type === 'unclaimedDeposits') {
        const deposits = (event as any).unclaimedDeposits || [];
        setUnclaimedDepositsCount(deposits.length);
        if (deposits.length > 0) {
          toast.error(
            `${deposits.length} deposit${deposits.length > 1 ? 's' : ''} need manual claiming`
          );
        }
      }
    });

    return () => unsubscribe();
  }, [walletState.isConnected, router]);

  // Fetch educational blog post for onchain deposits
  useEffect(() => {
    const fetchOnchainEducationalPost = async () => {
      if (!Env.NEXT_PUBLIC_GHOST_URL || !Env.NEXT_PUBLIC_GHOST_CONTENT_API_KEY) {
        return;
      }
      try {
        const res = await fetch(
          `${Env.NEXT_PUBLIC_GHOST_URL}/ghost/api/content/posts/slug/your-evento-wallet/?key=${Env.NEXT_PUBLIC_GHOST_CONTENT_API_KEY}&include=tags,authors`
        );
        if (!res.ok) return;
        const data = await res.json();
        setOnchainEducationalArticle(data.posts?.[0] || null);
      } catch (error) {
        console.error('Error fetching onchain educational post:', error);
      }
    };
    fetchOnchainEducationalPost();
  }, []);

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

  const handleScanSuccess = (decodedText: string) => {
    console.log('QR Code scanned:', decodedText);
    setScannedData(decodedText);
    // Close scan drawer and open send drawer
    closeDrawer('scan');
    openDrawer('send');
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
      <>
        <WalletWelcome onSetup={() => setStep('setup')} onRestore={() => setStep('restore')} />
        <Navbar />
      </>
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
      <>
        <div className='mx-auto max-w-sm pb-28 pt-4'>
          <WalletUnlock />
        </div>
        <BetaSheet open={showBetaSheet} onOpenChange={setShowBetaSheet} />
      </>
    );
  }

  // Main Wallet Screen
  return (
    <div className='min-h-screen bg-white'>
      <div className='mx-auto max-w-full bg-white md:max-w-4xl'>
        <div className='px-4 pt-4 md:flex md:gap-8'>
          {/* Left Column - sticky on desktop */}
          <div className='md:sticky md:top-0 md:w-1/2 md:self-start'>
            <div className='space-y-4'>
              {/* Wallet Balance Card */}
              {walletState.isInitialized && user?.username && (
                <WalletBalance
                  onSend={() => openDrawer('send')}
                  onReceive={() => openDrawer('receive')}
                  onScan={() => openDrawer('scan')}
                  lightningAddress={user.lightning_address || `${user.username}@evento.cash`}
                />
              )}

              {/* Backup Callout - subtle reminder below action buttons */}
              {showBackupReminder && (
                <BackupCallout
                  onBackup={() => setShowBackupChoiceSheet(true)}
                  onDismiss={() => setShowBackupReminder(false)}
                />
              )}

              {/* Quick Tools Section */}
              <QuickToolsSection
                onToolClick={(toolId) => {
                  openDrawer(toolId);
                }}
              />
            </div>
          </div>

          {/* Right Column - scrollable */}
          <div className='pb-28 md:w-1/2'>
            <div className='space-y-6'>
              {/* Recent Transactions Preview */}
              <div className='space-y-3'>
                <h3 className='font-semibold'>Recent Transactions</h3>
                <TransactionHistory
                  payments={payments.slice(0, 5)}
                  isLoading={isLoadingPayments}
                  onRefresh={() => {}}
                  onTransactionClick={handleTransactionClick}
                  showViewAllButton={!isLoadingPayments && payments.length > 0}
                  onViewAll={() => openDrawer('history')}
                  maxTransactions={3}
                />
              </div>

              {/* Incoming Onchain Bitcoin Alert */}
              {unclaimedDepositsCount > 0 && (
                <div className='rounded-2xl border border-red-200 bg-red-50 px-6 py-4'>
                  {/* Header Row */}
                  <div className='mb-1 flex items-center justify-between gap-3'>
                    <div className='flex flex-row items-center gap-1'>
                      <ChevronsRight className='h-7 w-7' />
                      <div className='text-lg font-semibold'>Money Incoming</div>
                    </div>
                    <motion.button
                      onClick={() => setShowOnchainEducationalSheet(true)}
                      className='flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-red-200 bg-white transition-colors'
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    >
                      <HelpCircle className='h-5 w-5 text-gray-600' />
                    </motion.button>
                  </div>

                  {/* Description */}
                  <p className='mb-6 pr-16 text-sm text-muted-foreground'>
                    {
                      "The network's a bit busy. Tap here to pay a small fee and get your funds instantly."
                    }
                  </p>

                  {/* Action Button */}
                  <Button
                    onClick={() => setShowIncomingFundsModal(true)}
                    variant='outline'
                    size='lg'
                    className='h-12 w-full rounded-full border-red-200 bg-white hover:bg-orange-100'
                  >
                    Speed It Up!
                  </Button>
                </div>
              )}

              {/* Educational Content */}
              <WalletEducationGallery />
            </div>
          </div>
        </div>
      </div>

      {/* Sheets */}
      <ReceiveLightningSheet
        open={openDrawers.includes('receive')}
        onOpenChange={(open) => !open && closeDrawer('receive')}
      />
      <SendLightningSheet
        open={openDrawers.includes('send')}
        onOpenChange={(open) => {
          if (!open) {
            closeDrawer('send');
            setScannedData(''); // Clear scanned data when closing
          }
        }}
        onBackupRequired={handleBackupRequired}
        onOpenScan={() => {
          closeDrawer('send');
          openDrawer('scan');
        }}
        scannedData={scannedData}
      />
      <ScanQrSheet
        open={openDrawers.includes('scan')}
        onOpenChange={(open) => !open && closeDrawer('scan')}
        onScanSuccess={handleScanSuccess}
      />
      <TransactionHistorySheet
        open={openDrawers.includes('history')}
        onOpenChange={(open) => !open && closeDrawer('history')}
        payments={payments}
        isLoading={isLoadingPayments}
        onTransactionClick={handleTransactionClick}
        selectedTransaction={selectedTransaction}
        onTransactionDetailsClose={() => closeDrawer('transaction-details')}
        isDetailsSheetOpen={openDrawers.includes('transaction-details')}
      />
      {selectedTransaction && !openDrawers.includes('history') && (
        <TransactionDetailsSheet
          open={openDrawers.includes('transaction-details')}
          onOpenChange={(open) => !open && closeDrawer('transaction-details')}
          payment={selectedTransaction}
        />
      )}

      {/* Quick Tools Sheets */}
      <BTCConverterSheet
        open={openDrawers.includes('converter')}
        onOpenChange={(open) => !open && closeDrawer('converter')}
      />
      <BuySellBitcoinSheet
        open={openDrawers.includes('buy-sell')}
        onOpenChange={(open) => !open && closeDrawer('buy-sell')}
      />
      <SpendBitcoinSheet
        open={openDrawers.includes('spend')}
        onOpenChange={(open) => !open && closeDrawer('spend')}
      />
      <EarnBitcoinSheet
        open={openDrawers.includes('earn')}
        onOpenChange={(open) => !open && closeDrawer('earn')}
        lightningAddress={user?.lightning_address || `${user?.username}@evento.cash`}
      />

      {/* Incoming Onchain Funds Sheet */}
      <IncomingFundsSheet
        open={showIncomingFundsModal}
        onOpenChange={setShowIncomingFundsModal}
        onRefresh={async () => {
          try {
            const deposits = await breezSDK.listUnclaimedDeposits();
            setUnclaimedDepositsCount(deposits.length);
          } catch (error) {
            console.error('Failed to refresh unclaimed deposits:', error);
          }
        }}
      />

      {/* Beta Information Sheet */}
      <BetaSheet open={showBetaSheet} onOpenChange={setShowBetaSheet} />

      {/* Backup Choice Sheet */}
      <BackupChoiceSheet
        open={showBackupChoiceSheet}
        onOpenChange={setShowBackupChoiceSheet}
        onSelectSeedPhrase={() => {
          if (mnemonic) {
            setShowBackupReminder(false);
            setStep('backup');
          } else {
            toast.error('Seed phrase not available. Please use encrypted backup.');
            setShowBackupReminder(false);
            setStep('encrypted-backup');
          }
        }}
        onSelectEncryptedBackup={() => {
          setShowBackupReminder(false);
          setStep('encrypted-backup');
        }}
      />

      {/* Onchain Educational Sheet */}
      <WalletEducationalSheet
        article={onchainEducationalArticle}
        open={showOnchainEducationalSheet}
        onOpenChange={setShowOnchainEducationalSheet}
      />

      {/* Bottom Navigation */}
      <Navbar />
    </div>
  );
}
