'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { NumericKeypad } from '@/components/wallet/numeric-keypad';
import { resetWalletInitialization, useWallet } from '@/lib/hooks/use-wallet';
import { WalletStorageService } from '@/lib/services/wallet-storage';
import { useWalletSeedStore } from '@/lib/stores/wallet-seed-store';
import { toast } from '@/lib/utils/toast';
import { AlertCircle, AlertTriangle, KeyRound, Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

interface WalletUnlockProps {
  onUnlock?: () => void;
}

export function WalletUnlock({ onUnlock }: WalletUnlockProps) {
  const t = useTranslations('wallet');
  const tCommon = useTranslations('common');
  const [pin, setPin] = useState('');
  const [isPasswordMode, setIsPasswordMode] = useState(false);
  const [password, setPassword] = useState('');
  const [showRemoveSheet, setShowRemoveSheet] = useState(false);
  const [confirmStep, setConfirmStep] = useState<'info' | 'confirm'>('info');
  const { unlockWallet, isLoading, error } = useWallet();
  const clearSeed = useWalletSeedStore((state) => state.clearSeed);

  const handleNumberClick = (number: string) => {
    setPin((current) => (current.length < 6 ? current + number : current));
  };

  const handleDelete = () => {
    setPin((current) => current.slice(0, -1));
  };

  // Separate unlock function that accepts a PIN parameter for auto-submit
  const handleUnlockWithPin = async (pinToUse: string) => {
    if (!pinToUse || pinToUse.length < 4) {
      toast.error(t('pin.enterPin'));
      return;
    }

    try {
      await unlockWallet(pinToUse);
      onUnlock?.();
    } catch (error: any) {
      toast.error(error.message || t('unlock.failed'));
      // Clear PIN on error to allow retry
      setPin('');
    }
  };

  const handleLongPressDelete = () => {
    setIsPasswordMode(true);
    setPin(''); // Clear PIN when switching modes
  };

  const handleRemoveWallet = async () => {
    // Clear all wallet data from localStorage
    WalletStorageService.clearWalletData();
    // Clear in-memory seed
    clearSeed();
    await resetWalletInitialization({ disconnect: true, resetStore: true });
    // Close sheet
    setShowRemoveSheet(false);
    // Force page reload to reset all state
    window.location.reload();
  };

  const handleOpenRemoveSheet = () => {
    setConfirmStep('info');
    setShowRemoveSheet(true);
  };

  const handleUnlock = async () => {
    const credential = isPasswordMode ? password : pin;

    if (!credential || credential.length < 4) {
      toast.error(isPasswordMode ? t('pin.enterPassword') : t('pin.enterPin'));
      return;
    }

    try {
      await unlockWallet(credential);
      onUnlock?.();
    } catch (error: any) {
      toast.error(error.message || t('unlock.failed'));
      // Clear PIN on error to allow retry
      if (!isPasswordMode) {
        setPin('');
      }
    }
  };

  return (
    <div className='space-y-6'>
      <div className='text-center'>
        <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border bg-gray-50 dark:border-neutral-800 dark:bg-neutral-900'>
          {isPasswordMode ? (
            <KeyRound className='h-8 w-8 text-black dark:text-neutral-100' />
          ) : (
            <Lock className='h-8 w-8 text-black dark:text-neutral-100' />
          )}
        </div>
        <h2 className='text-2xl font-bold'>
          {isPasswordMode ? t('unlock.adminTitle') : t('unlock.pinTitle')}
        </h2>
        {isPasswordMode && (
          <p className='mt-2 text-sm text-gray-500 dark:text-neutral-400'>
            {t('unlock.adminMode')}
          </p>
        )}
      </div>

      <div className='space-y-4'>
        {isPasswordMode ? (
          /* Password Input Mode */
          <div className='px-4'>
            <Input
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('pin.adminPasswordPlaceholder')}
              className='h-14 rounded-xl border-2 border-gray-200 bg-gray-50 text-center text-lg dark:border-neutral-800 dark:bg-neutral-900'
              autoFocus
              disabled={isLoading}
            />
          </div>
        ) : (
          /* PIN Display Mode - show dots for entered digits */
          <>
            <div className='flex justify-center gap-3'>
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <div
                  key={index}
                  className='flex h-12 w-12 items-center justify-center rounded-full border-2 border-gray-200 bg-gray-50 dark:border-neutral-800 dark:bg-neutral-900'
                >
                  {pin.length > index && (
                    <div className='h-3 w-3 rounded-full bg-gray-900 dark:bg-neutral-100' />
                  )}
                </div>
              ))}
            </div>

            {/* Number Keypad - only shown in PIN mode */}
            <NumericKeypad
              value={pin}
              onNumberClick={handleNumberClick}
              onDelete={handleDelete}
              onLongPressDelete={handleLongPressDelete}
              onComplete={handleUnlockWithPin}
              showDecimal={false}
              disabled={isLoading}
              maxLength={6}
            />
          </>
        )}

        {error && (
          <div className='rounded-lg bg-red-50 p-3 dark:bg-red-950/40'>
            <div className='flex items-start gap-2'>
              <AlertCircle className='mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400' />
              <p className='text-sm text-red-900 dark:text-red-400'>{error}</p>
            </div>
          </div>
        )}

        <Button
          onClick={handleUnlock}
          className='font-lg mt-6 w-full rounded-full'
          size='lg'
          disabled={(isPasswordMode ? password.length < 4 : pin.length < 4) || isLoading}
        >
          {isLoading ? t('unlock.unlocking') : t('unlock.unlock')}
        </Button>

        <Button
          variant='ghost'
          onClick={handleOpenRemoveSheet}
          className='w-full text-gray-500 dark:text-neutral-400'
        >
          {t('unlock.useDifferentWallet')}
        </Button>
      </div>

      {/* Remove Wallet Confirmation Sheet */}
      <MasterScrollableSheet
        title={t('unlock.startFreshTitle')}
        open={showRemoveSheet}
        onOpenChange={setShowRemoveSheet}
      >
        <div className='px-4 pb-8'>
          {confirmStep === 'info' ? (
            <div className='space-y-6'>
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold'>{t('unlock.beforeContinue')}</h3>
                <p className='text-gray-600 dark:text-neutral-400'>{t('unlock.removeInfo')}</p>
                <p className='text-gray-600 dark:text-neutral-400'>{t('unlock.noRecovery')}</p>
              </div>

              <div className='space-y-3'>
                <Button onClick={() => setConfirmStep('confirm')} className='w-full rounded-full'>
                  {t('unlock.understandContinue')}
                </Button>
                <Button
                  variant='outline'
                  onClick={() => setShowRemoveSheet(false)}
                  className='w-full rounded-full'
                >
                  {tCommon('actions.cancel')}
                </Button>
              </div>
            </div>
          ) : (
            <div className='space-y-6'>
              <div className='flex flex-col items-center space-y-4 text-center'>
                <div className='flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/60'>
                  <AlertTriangle className='h-8 w-8 text-red-600 dark:text-red-400' />
                </div>
                <h3 className='text-lg font-semibold'>{t('unlock.areYouSure')}</h3>
                <p className='text-gray-600 dark:text-neutral-400'>{t('unlock.cannotUndo')}</p>
              </div>

              <div className='space-y-3'>
                <Button
                  variant='destructive'
                  onClick={handleRemoveWallet}
                  className='w-full rounded-full'
                >
                  {t('unlock.removeWallet')}
                </Button>
                <Button
                  variant='outline'
                  onClick={() => setConfirmStep('info')}
                  className='w-full rounded-full'
                >
                  {tCommon('actions.goBack')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </MasterScrollableSheet>
    </div>
  );
}
