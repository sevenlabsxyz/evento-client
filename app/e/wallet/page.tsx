'use client';

import { CircledIconButton } from '@/components/circled-icon-button';
import { Button } from '@/components/ui/button';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { AddContactSheet } from '@/components/wallet/add-contact-sheet';
import { BackupCallout } from '@/components/wallet/backup-callout';
import { BackupChoiceSheet } from '@/components/wallet/backup-choice-sheet';
import { BetaSheet } from '@/components/wallet/beta-sheet';
import { ContactActionsSheet } from '@/components/wallet/contact-actions-sheet';
import { ContactsList } from '@/components/wallet/contacts-list';
import { EditContactSheet } from '@/components/wallet/edit-contact-sheet';
import { IncomingFundsSheet } from '@/components/wallet/incoming-funds-sheet';
import { QuickToolsSection } from '@/components/wallet/quick-tools-section';
import { ReceiveLightningSheet } from '@/components/wallet/receive-invoice-sheet';
import { ReceiveLnurlWithdrawSheet } from '@/components/wallet/receive-lnurl-withdraw-sheet';
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
import {
  WalletDesktopCard,
  WalletDesktopPageHeader,
  WalletPreWalletShell,
  type WalletPreWalletStep,
  useWalletDesktopLayout,
} from '@/components/wallet/wallet-desktop-layout';
import { WalletEasterEggConfetti } from '@/components/wallet/wallet-easter-egg-confetti';
import { WalletEducationList } from '@/components/wallet/wallet-education-list';
import { WalletEducationalSheet } from '@/components/wallet/wallet-educational-sheet';
import { WalletLoadingScreen } from '@/components/wallet/wallet-loading-screen';
import { WalletRestore } from '@/components/wallet/wallet-restore';
import { WalletSetup } from '@/components/wallet/wallet-setup';
import { WalletUnlock } from '@/components/wallet/wallet-unlock';
import { WalletWelcome } from '@/components/wallet/wallet-welcome';
import { Env } from '@/lib/constants/env';
import { STORAGE_KEYS } from '@/lib/constants/storage-keys';
import { useAuth, useRequireAuth } from '@/lib/hooks/use-auth';
import { useFundingRegion } from '@/lib/hooks/use-funding-region';
import { useLightningAddress } from '@/lib/hooks/use-lightning-address';
import { useScreenWakeLock } from '@/lib/hooks/use-screen-wake-lock';
import { useWallet } from '@/lib/hooks/use-wallet';
import { usePaymentHistory } from '@/lib/hooks/use-wallet-payments';
import { getIntlLocale } from '@/lib/i18n/active-locale';
import { breezSDK } from '@/lib/services/breez-sdk';
import { WalletStorageService } from '@/lib/services/wallet-storage';
import { useTopBar } from '@/lib/stores/topbar-store';
import type { Contact } from '@/lib/types/wallet';
import { cn } from '@/lib/utils';
import { migrateRecentAddressesToContacts } from '@/lib/utils/contacts-migration';
import { logger } from '@/lib/utils/logger';
import { toast } from '@/lib/utils/toast';
import { matchWalletEasterEgg } from '@/lib/utils/wallet-easter-eggs';
import type { InputType, Payment } from '@breeztech/breez-sdk-spark/ssr';
import { motion } from 'framer-motion';
import {
  Check,
  ChevronRight,
  ChevronsRight,
  Contact as ContactIcon,
  Gamepad2,
  HelpCircle,
  MoreHorizontal,
  Plus,
  Settings,
  Shield,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';

type WalletStep = 'welcome' | 'setup' | 'restore' | 'backup' | 'main';
type DrawerContent =
  | 'receive'
  | 'send'
  | 'scan'
  | 'lnurl-withdraw'
  | 'history'
  | 'transaction-details'
  | 'converter'
  | 'buy-sell'
  | 'spend'
  | 'earn'
  | null;

type LnurlWithdrawInput = Extract<InputType, { type: 'lnurlWithdraw' }>;

type DevLnurlWithdrawState = 'details' | 'confirm' | 'success' | 'error';

interface DevLnurlWithdrawConfig {
  amountSats: number | null;
  initialStep: DevLnurlWithdrawState;
  mockResult: 'success' | 'error' | null;
}

interface DevLnurlWithdrawRouteConfig extends DevLnurlWithdrawConfig {
  withdrawRequest: LnurlWithdrawInput;
}

function parsePositiveInt(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export default function WalletPage() {
  const { isLoading: isCheckingAuth } = useRequireAuth();
  const { user } = useAuth();
  const { setTopBarForRoute, applyRouteConfig, clearRoute } = useTopBar();
  const isDesktop = useWalletDesktopLayout();
  const pathname = usePathname();
  const router = useRouter();
  const { walletState, isLoading: isWalletLoading, markAsBackedUp, refreshBalance } = useWallet();
  const { payments, isLoading: isLoadingPayments, fetchPayments } = usePaymentHistory();
  const { address, checkAvailability, registerAddress } = useLightningAddress();
  const { isCashAppEligible } = useFundingRegion();
  const t = useTranslations('wallet');
  const tCommon = useTranslations('common');
  const locale = getIntlLocale(useLocale());

  const [step, setStep] = useState<WalletStep>('welcome');
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [openDrawers, setOpenDrawers] = useState<DrawerContent[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Payment | null>(null);
  const [showBackupReminder, setShowBackupReminder] = useState(false);
  const [showBackupChoiceSheet, setShowBackupChoiceSheet] = useState(false);
  const [showBetaSheet, setShowBetaSheet] = useState(false);
  const [scannedData, setScannedData] = useState<string>('');
  const [scannedLnurlWithdraw, setScannedLnurlWithdraw] = useState<LnurlWithdrawInput | null>(null);
  const [unclaimedDepositsCount, setUnclaimedDepositsCount] = useState(0);
  const [showIncomingFundsModal, setShowIncomingFundsModal] = useState(false);
  const [showOnchainEducationalSheet, setShowOnchainEducationalSheet] = useState(false);
  const [onchainEducationalArticle, setOnchainEducationalArticle] = useState<any>(null);
  const [hasShownUnlockRedirectHint, setHasShownUnlockRedirectHint] = useState(false);
  const [showContactsSheet, setShowContactsSheet] = useState(false);
  const [showAddContactSheet, setShowAddContactSheet] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [actionMenuContact, setActionMenuContact] = useState<Contact | null>(null);
  const [devLnurlWithdrawSearch, setDevLnurlWithdrawSearch] = useState('');
  const [walletEasterEggCelebrationKey, setWalletEasterEggCelebrationKey] = useState(0);
  const [showWakeLockEnabledIndicator, setShowWakeLockEnabledIndicator] = useState(false);

  const shouldKeepWalletAwake =
    !isCheckingAuth &&
    !isWalletLoading &&
    step === 'main' &&
    walletState.isInitialized &&
    walletState.isConnected;

  const screenWakeLock = useScreenWakeLock({ enabled: shouldKeepWalletAwake });
  const wakeLockRequestRef = useRef(screenWakeLock.request);

  useEffect(() => {
    wakeLockRequestRef.current = screenWakeLock.request;
  }, [screenWakeLock.request]);

  useEffect(() => {
    if (!showWakeLockEnabledIndicator || typeof window === 'undefined') {
      return;
    }

    const timeout = window.setTimeout(() => {
      setShowWakeLockEnabledIndicator(false);
    }, 1600);

    return () => window.clearTimeout(timeout);
  }, [showWakeLockEnabledIndicator]);

  const handleWakeLockEnable = useCallback(async () => {
    const wakeLockActive = await wakeLockRequestRef.current();

    if (wakeLockActive) {
      setShowWakeLockEnabledIndicator(true);
    }
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development' || typeof window === 'undefined') {
      return;
    }

    setDevLnurlWithdrawSearch(window.location.search);
  }, []);

  const devLnurlWithdrawConfig = useMemo<DevLnurlWithdrawRouteConfig | null>(() => {
    if (process.env.NODE_ENV !== 'development') {
      return null;
    }

    const params = new URLSearchParams(devLnurlWithdrawSearch);

    if (params.get('dev-lnurl-withdraw') !== '1') {
      return null;
    }

    const minSats = parsePositiveInt(params.get('min')) ?? 1_000;
    const maxSats = Math.max(minSats, parsePositiveInt(params.get('max')) ?? 25_000);
    const amountSats = parsePositiveInt(params.get('amount'));
    const initialStepParam = params.get('state');
    const mockResultParam = params.get('result');

    const initialStep: DevLnurlWithdrawState =
      initialStepParam === 'confirm' ||
      initialStepParam === 'success' ||
      initialStepParam === 'error'
        ? initialStepParam
        : 'details';

    const mockResult: DevLnurlWithdrawConfig['mockResult'] =
      mockResultParam === 'success' || mockResultParam === 'error' ? mockResultParam : null;

    const normalizedAmountSats = amountSats
      ? Math.min(Math.max(amountSats, minSats), maxSats)
      : initialStep === 'confirm' || initialStep === 'success' || initialStep === 'error'
        ? minSats
        : null;

    const provider = params.get('provider') || 'demo.evento.cash';
    const description = params.get('description') || 'Dev LNURL withdraw';

    const withdrawRequest: LnurlWithdrawInput = {
      type: 'lnurlWithdraw',
      callback: `https://${provider}/.well-known/lnurlw/dev`,
      k1: 'dev-lnurl-withdraw-k1',
      defaultDescription: description,
      minWithdrawable: minSats * 1000,
      maxWithdrawable: maxSats * 1000,
    };

    return {
      amountSats: normalizedAmountSats,
      initialStep,
      mockResult,
      withdrawRequest,
    };
  }, [devLnurlWithdrawSearch]);

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

  const handleContactSelect = (contact: Contact) => {
    setScannedData(contact.paymentIdentifier);
    setShowContactsSheet(false);
    openDrawer('send');
  };

  const handleEditContact = (contact: Contact) => {
    setSelectedContact(contact);
    setShowContactsSheet(false);
  };

  useEffect(() => {
    applyRouteConfig(pathname);
    setTopBarForRoute(pathname, {
      title: t('page.title'),
      hideMobileBreadcrumb: true,
      desktopHidden: true,
      centerMode: 'title',
      showAvatar: false,
      buttons: walletState.isConnected
        ? [
            {
              id: 'wake-lock',
              icon: showWakeLockEnabledIndicator ? Check : Gamepad2,
              onClick: handleWakeLockEnable,
              label: showWakeLockEnabledIndicator
                ? t('page.wakeLockEnabled')
                : t('page.keepScreenAwake'),
            },
            {
              id: 'settings',
              icon: Settings,
              onClick: () => router.push('/e/wallet/settings'),
              label: tCommon('labels.settings'),
            },
          ]
        : [],
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
    handleWakeLockEnable,
    walletState.isConnected,
    showWakeLockEnabledIndicator,
    t,
    tCommon,
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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (isWalletLoading) {
      return;
    }

    const pendingReturnPath = localStorage.getItem(STORAGE_KEYS.WALLET_UNLOCK_RETURN_PATH);

    if (!pendingReturnPath) {
      return;
    }

    if (!pendingReturnPath.startsWith('/')) {
      localStorage.removeItem(STORAGE_KEYS.WALLET_UNLOCK_RETURN_PATH);
      return;
    }

    if (!walletState.isConnected) {
      if (!hasShownUnlockRedirectHint) {
        toast.info(
          walletState.isInitialized ? t('page.unlockRedirectHint') : t('page.createRedirectHint')
        );
        setHasShownUnlockRedirectHint(true);
      }
      return;
    }

    localStorage.removeItem(STORAGE_KEYS.WALLET_UNLOCK_RETURN_PATH);
    setHasShownUnlockRedirectHint(false);

    const isWalletRoute =
      pendingReturnPath === '/e/wallet' ||
      pendingReturnPath.startsWith('/e/wallet?') ||
      pendingReturnPath.startsWith('/e/wallet#');

    if (!isWalletRoute) {
      toast.info(t('page.unlockedRedirecting'));
      router.push(pendingReturnPath);
    }
  }, [
    hasShownUnlockRedirectHint,
    isWalletLoading,
    router,
    walletState.isConnected,
    walletState.isInitialized,
    t,
  ]);

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
            logger.info(`Lightning address registered: ${baseUsername}@evento.cash`);
          }
        } catch (error) {
          logger.error('Failed to auto-register Lightning address', {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    };

    registerLightningAddressIfNeeded();
  }, [walletState.isConnected, address, user, checkAvailability, registerAddress]);

  // Migrate recent Lightning addresses to contacts on first wallet connect
  useEffect(() => {
    if (walletState.isConnected) {
      migrateRecentAddressesToContacts().catch((error) => {
        logger.error('Failed to migrate recent addresses to contacts', {
          error: error instanceof Error ? error.message : String(error),
        });
      });
    }
  }, [walletState.isConnected]);

  // Listen for deposit events and manage unclaimed deposits
  useEffect(() => {
    if (!walletState.isConnected) return;

    // Load initial unclaimed deposits count
    const loadUnclaimedDeposits = async () => {
      try {
        const deposits = await breezSDK.listUnclaimedDeposits();
        setUnclaimedDepositsCount(deposits.length);
      } catch (error) {
        logger.error('Failed to load unclaimed deposits', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    };

    loadUnclaimedDeposits();

    // Listen for deposit events
    const unsubscribe = breezSDK.onEvent((event) => {
      if (event.type === 'claimedDeposits') {
        const deposits = (event as any).claimedDeposits || [];
        const totalAmount = deposits.reduce((sum: number, d: any) => sum + (d.amountSats || 0), 0);
        toast.success(t('page.depositClaimed', { amount: totalAmount.toLocaleString(locale) }));
        // Refresh unclaimed deposits count
        void loadUnclaimedDeposits();
      } else if (event.type === 'unclaimedDeposits') {
        const deposits = (event as any).unclaimedDeposits || [];
        setUnclaimedDepositsCount(deposits.length);
        if (deposits.length > 0) {
          toast.info(t('page.onchainReceivedBody'), t('page.onchainReceivedTitle'));
        }
      }
    });

    return () => unsubscribe();
  }, [walletState.isConnected, router, t, locale]);

  useEffect(() => {
    if (!walletState.isConnected || step !== 'main') {
      return;
    }

    const unsubscribe = breezSDK.onEvent((event) => {
      if (event.type !== 'paymentSucceeded') {
        return;
      }

      const payment = (event as { payment?: Payment }).payment;

      if (!payment || payment.paymentType !== 'receive') {
        return;
      }

      if (!matchWalletEasterEgg(payment)) {
        return;
      }

      setWalletEasterEggCelebrationKey((currentKey) => currentKey + 1);
    });

    return () => unsubscribe();
  }, [step, walletState.isConnected]);

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
        logger.error('Error fetching onchain educational post', {
          error: error instanceof Error ? error.message : String(error),
        });
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
      toast.error(t('page.seedUnavailable'));
    }
  };

  const handleScanSuccess = async (decodedText: string) => {
    logger.info('QR Code scanned', { decodedText });

    // Strip common URI prefixes (case-insensitive)
    let cleanedData = decodedText.trim();
    const prefixPatterns = [/^lightning:/i, /^bitcoin:/i];

    for (const pattern of prefixPatterns) {
      cleanedData = cleanedData.replace(pattern, '');
    }

    // Check if it's potentially an LNURL
    const isLnurl = cleanedData.match(/^lnurl1/i);

    try {
      closeDrawer('scan');

      let parsed;

      if (isLnurl) {
        // ATTEMPT 1: Try Breez SDK first for LNURL (fast path)
        try {
          parsed = await breezSDK.parseInput(cleanedData);
        } catch (breezError) {
          // Check if error is CORS/network related
          const errorMessage =
            breezError instanceof Error ? breezError.message : String(breezError);
          const isCorsError =
            errorMessage.includes('CORS') ||
            errorMessage.includes('Access-Control-Allow-Origin') ||
            errorMessage.includes('Failed to fetch') ||
            errorMessage.includes('error calling lnurl endpoint') ||
            errorMessage.includes('error sending request') ||
            errorMessage.includes('Request error');

          if (!isCorsError) {
            // Not a CORS error - rethrow for normal handling
            throw breezError;
          }

          // ATTEMPT 2: CORS error - fall back to API
          logger.info('Breez parse failed with CORS, trying API fallback...');
          const response = await fetch('/api/v1/lightning/lnurl/parse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lnurl: cleanedData }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || 'API fallback failed');
          }

          parsed = await response.json();
        }
      } else {
        // For non-LNURL, continue using Breez parseInput normally
        parsed = await breezSDK.parseInput(cleanedData);
      }

      if (parsed.type === 'lnurlWithdraw') {
        setScannedLnurlWithdraw(parsed);
        openDrawer('lnurl-withdraw');
        return;
      }

      setScannedData(cleanedData);
      openDrawer('send');
    } catch (error) {
      // Invalid QR code
      toast.error(t('page.unsupportedQr'));
      closeDrawer('scan');
    }
  };

  useEffect(() => {
    if (!devLnurlWithdrawConfig) {
      return;
    }

    setScannedLnurlWithdraw(devLnurlWithdrawConfig.withdrawRequest);
    setOpenDrawers((current) =>
      current.includes('lnurl-withdraw') ? current : [...current, 'lnurl-withdraw']
    );
  }, [devLnurlWithdrawConfig]);

  if (isCheckingAuth || isWalletLoading) {
    if (isDesktop) {
      return (
        <div className='flex min-h-[calc(100dvh-4rem)] items-center justify-center bg-white px-8 dark:bg-neutral-900'>
          <WalletLoadingScreen className='w-full max-w-sm' />
        </div>
      );
    }

    return (
      <div className='mx-auto max-w-sm pb-28 pt-4'>
        <WalletLoadingScreen />
      </div>
    );
  }

  const renderPreWalletStep = (preWalletStep: WalletPreWalletStep, content: ReactNode) =>
    isDesktop ? (
      <WalletPreWalletShell step={preWalletStep}>{content}</WalletPreWalletShell>
    ) : (
      <div className='mx-auto max-w-sm pb-28 pt-4'>{content}</div>
    );

  // Welcome Screen
  if (step === 'welcome') {
    const welcome = (
      <WalletWelcome onSetup={() => setStep('setup')} onRestore={() => setStep('restore')} />
    );

    return isDesktop ? (
      <WalletPreWalletShell step='welcome'>{welcome}</WalletPreWalletShell>
    ) : (
      <>{welcome}</>
    );
  }

  // Setup Screen
  if (step === 'setup') {
    return renderPreWalletStep(
      'setup',
      <WalletSetup onComplete={handleSetupComplete} onCancel={() => setStep('welcome')} />
    );
  }

  // Restore Screen
  if (step === 'restore') {
    return renderPreWalletStep(
      'restore',
      <WalletRestore onComplete={handleRestoreComplete} onCancel={() => setStep('welcome')} />
    );
  }

  // Backup Screen
  if (step === 'backup' && mnemonic) {
    return renderPreWalletStep(
      'backup',
      <SeedBackup
        mnemonic={mnemonic}
        onComplete={handleBackupComplete}
        onCancel={handleBackupSkip}
      />
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
        {renderPreWalletStep('unlock', <WalletUnlock />)}
        <BetaSheet open={showBetaSheet} onOpenChange={setShowBetaSheet} />
      </>
    );
  }

  // Sections shared by the mobile and desktop layouts
  const walletBalance = walletState.isInitialized && user?.username && (
    <WalletBalance
      onSend={() => openDrawer('send')}
      onReceive={() => openDrawer('receive')}
      onScan={() => openDrawer('scan')}
    />
  );

  const backupCallout = showBackupReminder && (
    <BackupCallout onBackup={() => setShowBackupChoiceSheet(true)} />
  );

  const quickTools = (
    <QuickToolsSection
      buySellLabel={isCashAppEligible ? t('page.buyBitcoin') : t('page.buySell')}
      onToolClick={(toolId) => {
        openDrawer(toolId);
      }}
    />
  );

  const incomingFundsAlert = unclaimedDepositsCount > 0 && (
    <div className='rounded-2xl border border-amber-200 bg-amber-50 px-6 py-4 dark:border-amber-900 dark:bg-amber-950/40'>
      {/* Header Row */}
      <div className='mb-1 flex items-center justify-between gap-3'>
        <div className='flex flex-row items-center gap-1'>
          <ChevronsRight className='h-7 w-7 text-amber-600 dark:text-amber-400' />
          <div className='text-lg font-semibold'>{t('page.moneyIncoming')}</div>
        </div>
        <motion.button
          onClick={() => setShowOnchainEducationalSheet(true)}
          className='flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-amber-200 bg-white transition-colors dark:border-amber-900 dark:bg-neutral-900'
          whileTap={{ scale: 0.95 }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 17,
          }}
        >
          <HelpCircle className='h-5 w-5 text-gray-600 dark:text-neutral-400' />
        </motion.button>
      </div>

      {/* Description */}
      <p className='mb-6 pr-16 text-sm text-muted-foreground'>{t('page.incomingDescription')}</p>

      {/* Action Button */}
      <Button
        onClick={() => setShowIncomingFundsModal(true)}
        variant='outline'
        size='lg'
        className='h-12 w-full rounded-full border-amber-200 bg-white hover:bg-amber-100 dark:border-amber-900 dark:bg-neutral-900 dark:hover:bg-amber-950/60'
      >
        {t('page.speedItUp')}
      </Button>
    </div>
  );

  const desktopRowClassName =
    'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:bg-neutral-800';

  // Main Wallet Screen
  return (
    <div className='min-h-screen bg-white dark:bg-neutral-900'>
      <WalletEasterEggConfetti celebrationKey={walletEasterEggCelebrationKey} />
      {isDesktop ? (
        <div className='mx-auto w-full max-w-2xl px-8 pb-16 pt-8 lg:max-w-6xl'>
          <WalletDesktopPageHeader
            title={t('page.title')}
            description={t('page.description')}
            actions={
              walletState.isConnected && (
                <>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={handleWakeLockEnable}
                    className='h-10 rounded-full bg-white px-4 dark:bg-neutral-900'
                  >
                    {showWakeLockEnabledIndicator ? <Check /> : <Gamepad2 />}
                    {showWakeLockEnabledIndicator
                      ? t('page.wakeLockEnabled')
                      : t('page.keepScreenAwake')}
                  </Button>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => router.push('/e/wallet/settings')}
                    className='h-10 rounded-full bg-white px-4 dark:bg-neutral-900'
                  >
                    <Settings />
                    {tCommon('labels.settings')}
                  </Button>
                </>
              )
            }
          />

          <div className='mt-8 grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start'>
            {/* Left column: balance, actions, tools, contacts, security */}
            <div className='space-y-6'>
              {walletBalance}
              {backupCallout}
              {incomingFundsAlert}

              <WalletDesktopCard title={t('page.bitcoinTools')} bodyClassName='pt-3'>
                {quickTools}
              </WalletDesktopCard>

              <WalletDesktopCard
                title={t('page.contacts')}
                actions={
                  <>
                    <CircledIconButton
                      icon={Plus}
                      ariaLabel={t('page.addContact')}
                      onClick={() => setShowAddContactSheet(true)}
                    />
                    <CircledIconButton
                      icon={ContactIcon}
                      ariaLabel={t('page.allContacts')}
                      onClick={() => setShowContactsSheet(true)}
                    />
                  </>
                }
                bodyClassName='space-y-3 pt-3'
              >
                <ContactsList
                  maxContacts={3}
                  showAddButton={false}
                  onContactClick={handleContactSelect}
                />
                <Button
                  onClick={() => setShowContactsSheet(true)}
                  variant='outline'
                  className='h-11 w-full rounded-full bg-gray-50 dark:bg-neutral-950'
                >
                  {t('page.viewAllContacts')}
                </Button>
              </WalletDesktopCard>

              <WalletDesktopCard
                title={t('page.security')}
                bodyClassName='space-y-1 px-2 pb-2 pt-2'
              >
                <button
                  type='button'
                  onClick={() => setShowBackupChoiceSheet(true)}
                  className={desktopRowClassName}
                >
                  <span
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                      walletState.hasBackup
                        ? 'bg-green-100 dark:bg-green-950/60'
                        : 'bg-amber-100 dark:bg-amber-950/60'
                    )}
                  >
                    <Shield
                      className={cn(
                        'h-5 w-5',
                        walletState.hasBackup
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-amber-600 dark:text-amber-400'
                      )}
                    />
                  </span>
                  <span className='min-w-0 flex-1'>
                    <span className='block font-medium text-gray-900 dark:text-neutral-100'>
                      {t('page.backup')}
                    </span>
                    <span
                      className={cn(
                        'block text-sm',
                        walletState.hasBackup
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-amber-600 dark:text-amber-400'
                      )}
                    >
                      {walletState.hasBackup ? t('page.backedUp') : t('page.notBackedUp')}
                    </span>
                  </span>
                  <ChevronRight className='h-4 w-4 shrink-0 text-gray-400 dark:text-neutral-500' />
                </button>
                <button
                  type='button'
                  onClick={() => router.push('/e/wallet/settings')}
                  className={desktopRowClassName}
                >
                  <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800'>
                    <Settings className='h-5 w-5 text-gray-700 dark:text-neutral-300' />
                  </span>
                  <span className='min-w-0 flex-1'>
                    <span className='block font-medium text-gray-900 dark:text-neutral-100'>
                      {t('page.walletSettings')}
                    </span>
                    <span className='block text-sm text-gray-500 dark:text-neutral-500'>
                      {t('page.walletSettingsDescription')}
                    </span>
                  </span>
                  <ChevronRight className='h-4 w-4 shrink-0 text-gray-400 dark:text-neutral-500' />
                </button>
              </WalletDesktopCard>
            </div>

            {/* Right column: transaction history, education */}
            <div className='space-y-6'>
              <WalletDesktopCard title={t('page.transactions')} bodyClassName='px-3 pb-3 pt-3'>
                <div className='max-h-[36rem] overflow-y-auto overscroll-contain px-2 pb-2'>
                  <TransactionHistory
                    payments={payments}
                    isLoading={isLoadingPayments}
                    onRefresh={() => {}}
                    onTransactionClick={handleTransactionClick}
                  />
                </div>
              </WalletDesktopCard>

              <WalletEducationList />
            </div>
          </div>
        </div>
      ) : (
        <div className='mx-auto bg-white dark:bg-neutral-900 md:max-w-md'>
          <div className='px-4 pt-4'>
            <div>
              <div className='space-y-4'>
                {/* Wallet Balance Card */}
                {walletBalance}

                {/* Backup Callout - subtle reminder below action buttons */}
                {backupCallout}

                {/* Quick Tools Section */}
                {quickTools}
              </div>
            </div>

            <div className='pb-28'>
              <div className='space-y-6'>
                {/* Recent Transactions Preview */}
                <div className='mt-6 space-y-3 md:mt-4'>
                  <h3 className='text-sm font-semibold'>{t('page.recentTransactions')}</h3>
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

                {/* Contacts Preview */}
                <div className='mt-6 space-y-3 md:mt-4'>
                  <div className='flex items-center justify-between'>
                    <h3 className='text-sm font-semibold'>{t('page.walletContacts')}</h3>
                    <div className='flex items-center gap-2'>
                      <CircledIconButton icon={Plus} onClick={() => setShowAddContactSheet(true)} />
                      <CircledIconButton
                        icon={ContactIcon}
                        onClick={() => setShowContactsSheet(true)}
                      />
                    </div>
                  </div>
                  <ContactsList
                    maxContacts={3}
                    showAddButton={false}
                    onContactClick={handleContactSelect}
                  />
                  <Button
                    onClick={() => setShowContactsSheet(true)}
                    variant='outline'
                    className='font-lg h-12 w-full rounded-full bg-gray-50 dark:bg-neutral-950'
                  >
                    {t('page.viewAllContacts')}
                  </Button>
                </div>

                {/* Incoming Onchain Bitcoin Alert */}
                {incomingFundsAlert}

                {/* Educational Content */}
                <WalletEducationList />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sheets */}
      <ReceiveLightningSheet
        open={openDrawers.includes('receive')}
        onOpenChange={(open) => !open && closeDrawer('receive')}
      />
      <ReceiveLnurlWithdrawSheet
        open={openDrawers.includes('lnurl-withdraw')}
        onOpenChange={(open) => {
          if (!open) {
            closeDrawer('lnurl-withdraw');
            setScannedLnurlWithdraw(null);
          }
        }}
        withdrawRequest={scannedLnurlWithdraw}
        devConfig={devLnurlWithdrawConfig}
        onReceived={async () => {
          await Promise.all([refreshBalance(), fetchPayments()]);
        }}
      />
      <SendLightningSheet
        open={openDrawers.includes('send')}
        onOpenChange={(open) => {
          if (!open) {
            closeDrawer('send');
            setScannedData(''); // Clear scanned data when closing
          }
        }}
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
        cashAppEnabled={isCashAppEligible}
        onFundingStarted={async () => {
          await Promise.all([refreshBalance(), fetchPayments()]);
        }}
      />
      <SpendBitcoinSheet
        open={openDrawers.includes('spend')}
        onOpenChange={(open) => !open && closeDrawer('spend')}
      />
      <EarnBitcoinSheet
        open={openDrawers.includes('earn')}
        onOpenChange={(open) => !open && closeDrawer('earn')}
        lightningAddress={address?.lightningAddress || user?.ln_address || ''}
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
            logger.error('Failed to refresh unclaimed deposits', {
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }}
      />

      {/* Beta Information Sheet */}
      <BetaSheet open={showBetaSheet} onOpenChange={setShowBetaSheet} />

      {/* Backup Choice Sheet */}
      <BackupChoiceSheet
        open={showBackupChoiceSheet}
        onOpenChange={setShowBackupChoiceSheet}
        onEncryptedBackupComplete={() => {
          setShowBackupReminder(false);
        }}
      />

      {/* Onchain Educational Sheet */}
      <WalletEducationalSheet
        article={onchainEducationalArticle}
        open={showOnchainEducationalSheet}
        onOpenChange={setShowOnchainEducationalSheet}
      />

      {/* Contacts Sheet (Full View) */}
      <MasterScrollableSheet
        open={showContactsSheet}
        onOpenChange={(open) => {
          setShowContactsSheet(open);
          if (!open) {
            setSelectedContact(null);
          }
        }}
        title={t('page.contacts')}
      >
        <div className='space-y-4 p-4'>
          <Button
            type='button'
            className='h-12 w-full rounded-full text-base font-semibold'
            onClick={() => {
              setShowContactsSheet(false);
              setShowAddContactSheet(true);
            }}
          >
            {t('page.newContact')}
          </Button>

          <ContactsList
            showAddButton={false}
            onContactClick={handleEditContact}
            renderContactRightContent={(contact) => (
              <>
                <CircledIconButton
                  icon={MoreHorizontal}
                  onClick={(event) => {
                    event.stopPropagation();
                    setActionMenuContact(contact);
                  }}
                  className='bg-white dark:bg-neutral-900'
                />
                <CircledIconButton
                  icon={ChevronRight}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleContactSelect(contact);
                  }}
                  className='bg-white dark:bg-neutral-900'
                />
              </>
            )}
          />
        </div>
      </MasterScrollableSheet>

      <ContactActionsSheet
        contact={actionMenuContact}
        open={!!actionMenuContact}
        onOpenChange={(open) => {
          if (!open) {
            setActionMenuContact(null);
          }
        }}
        onEdit={(contact) => {
          setActionMenuContact(null);
          handleEditContact(contact);
        }}
      />

      {/* Add Contact Sheet */}
      <AddContactSheet open={showAddContactSheet} onOpenChange={setShowAddContactSheet} />

      {/* Edit Contact Sheet */}
      {selectedContact && (
        <EditContactSheet
          contact={selectedContact}
          open={!!selectedContact && !showContactsSheet}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedContact(null);
            }
          }}
        />
      )}
    </div>
  );
}
