'use client';

import { Button } from '@/components/ui/button';
import { NumericKeypad } from '@/components/wallet/numeric-keypad';
import { useAuth } from '@/lib/hooks/use-auth';
import { useLightningAddress } from '@/lib/hooks/use-lightning-address';
import { useWallet } from '@/lib/hooks/use-wallet';
import { logger } from '@/lib/utils/logger';
import { toast } from '@/lib/utils/toast';
import { AlertCircle, Key, Loader2, Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

interface WalletSetupProps {
  onComplete: (mnemonic?: string) => void;
  onCancel?: () => void;
}

type Step = 'create-pin' | 'confirm-pin' | 'creating' | 'error';

export function WalletSetup({ onComplete, onCancel }: WalletSetupProps) {
  const t = useTranslations('wallet');
  const tCommon = useTranslations('common');
  const [step, setStep] = useState<Step>('create-pin');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { createWallet } = useWallet();
  const { user } = useAuth();
  const { checkAvailability, registerAddress } = useLightningAddress();

  const handleNumberClick = (num: string) => {
    if (step === 'create-pin') {
      setPin((current) => (current.length < 6 ? current + num : current));
    } else if (step === 'confirm-pin') {
      setConfirmPin((current) => (current.length < 6 ? current + num : current));
    }
  };

  const handleDelete = () => {
    if (step === 'create-pin') {
      setPin((current) => current.slice(0, -1));
    } else if (step === 'confirm-pin') {
      setConfirmPin((current) => current.slice(0, -1));
    }
  };

  const handleCreatePinNext = (pinToConfirm = pin) => {
    if (pinToConfirm.length < 6) {
      toast.error(t('pin.minLength'));
      return;
    }
    setStep('confirm-pin');
  };

  const handleConfirmAndCreate = async (confirmedPin = confirmPin) => {
    if (confirmedPin !== pin) {
      toast.error(t('pin.mismatch'));
      setConfirmPin('');
      return;
    }

    setStep('creating');
    setError(null);

    try {
      const mnemonic = await createWallet(pin);

      // Automatically register Lightning address
      if (user?.username) {
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
            logger.info(`Lightning address registered: ${username}@evento.cash`);
          }
        } catch (error) {
          logger.error('Failed to register Lightning address', {
            error: error instanceof Error ? error.message : String(error),
          });
          // Don't fail wallet creation if Lightning address registration fails
        }
      }

      toast.success(t('setup.success'));
      onComplete(mnemonic);
    } catch (err: any) {
      logger.error('Wallet creation error', {
        error: err instanceof Error ? err.message : String(err),
      });

      // Provide helpful error messages
      let errorMessage = err.message || t('setup.failed');

      if (err.message?.includes('API key')) {
        errorMessage = t('setup.missingApiKey');
      } else if (err.message?.includes('WASM') || err.message?.includes('defaultConfig')) {
        errorMessage = t('setup.initFailed');
      }

      setError(errorMessage);
      setStep('error');
    }
  };

  const handleRetry = () => {
    setStep('create-pin');
    setPin('');
    setConfirmPin('');
    setError(null);
  };

  // Render PIN dots
  const renderPinDots = (currentPin: string) => (
    <div className='flex justify-center gap-3'>
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <div
          key={index}
          className='flex h-12 w-12 items-center justify-center rounded-full border-2 border-gray-200 bg-gray-50 dark:border-neutral-800 dark:bg-neutral-900'
        >
          {currentPin.length > index && (
            <div className='h-3 w-3 rounded-full bg-gray-900 dark:bg-neutral-100' />
          )}
        </div>
      ))}
    </div>
  );

  // Error state
  if (step === 'error') {
    return (
      <div className='flex min-h-[60vh] flex-col items-center justify-center space-y-6 px-6 md:min-h-[20rem]'>
        <div className='text-center'>
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/60'>
            <AlertCircle className='h-8 w-8 text-red-600 dark:text-red-400' />
          </div>
          <h2 className='text-2xl font-bold'>{t('setup.failedTitle')}</h2>
          <p className='mt-2 text-sm text-muted-foreground'>{error}</p>
        </div>
        <div className='flex gap-3'>
          <Button onClick={handleRetry} variant='default' size='lg'>
            {tCommon('actions.tryAgain')}
          </Button>
          {onCancel && (
            <Button onClick={onCancel} variant='outline' size='lg'>
              {t('setup.goBack')}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Creating state
  if (step === 'creating') {
    return (
      <div className='flex min-h-[60vh] flex-col items-center justify-center space-y-6 md:min-h-[20rem]'>
        <div className='text-center'>
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 dark:bg-orange-950/40'>
            <Loader2 className='h-8 w-8 animate-spin text-orange-600 dark:text-orange-400' />
          </div>
          <h2 className='text-2xl font-bold'>{t('setup.creatingTitle')}</h2>
          <p className='mt-2 text-sm text-muted-foreground'>{t('setup.creatingDescription')}</p>
        </div>
      </div>
    );
  }

  // Create PIN step
  if (step === 'create-pin') {
    return (
      <div className='space-y-6'>
        <div className='text-center'>
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 dark:bg-orange-950/40'>
            <Wallet className='h-8 w-8 text-orange-600 dark:text-orange-400' />
          </div>
          <h2 className='text-2xl font-bold'>{t('pin.createTitle')}</h2>
          <p className='mt-2 text-sm text-muted-foreground'>{t('setup.createPinDescription')}</p>
        </div>

        <div className='space-y-4'>
          {renderPinDots(pin)}

          <NumericKeypad
            value={pin}
            onNumberClick={handleNumberClick}
            onDelete={handleDelete}
            onComplete={handleCreatePinNext}
            showDecimal={false}
            maxLength={6}
          />

          <div className='rounded-lg bg-amber-50 p-4 dark:bg-amber-950/40'>
            <div className='flex items-start gap-2'>
              <AlertCircle className='mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400' />
              <div className='text-sm text-amber-900 dark:text-amber-400'>
                <p className='font-medium'>{t('setup.important')}</p>
                <p className='mt-1'>{t('setup.rememberPin')}</p>
              </div>
            </div>
          </div>

          <Button
            onClick={() => handleCreatePinNext()}
            className='mt-6 w-full rounded-full'
            size='lg'
            disabled={pin.length < 6}
          >
            {tCommon('actions.next')}
          </Button>

          {onCancel && (
            <Button onClick={onCancel} variant='ghost' className='w-full'>
              {tCommon('actions.cancel')}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Confirm PIN step
  if (step === 'confirm-pin') {
    return (
      <div className='space-y-6'>
        <div className='text-center'>
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border bg-gray-50 dark:border-neutral-800 dark:bg-neutral-900'>
            <Key className='h-8 w-8 text-black dark:text-neutral-100' />
          </div>
          <h2 className='text-2xl font-bold'>{t('pin.confirmTitle')}</h2>
          <p className='mt-2 text-sm text-muted-foreground'>{t('pin.confirmDescription')}</p>
        </div>

        <div className='space-y-4'>
          {renderPinDots(confirmPin)}

          <NumericKeypad
            value={confirmPin}
            onNumberClick={handleNumberClick}
            onDelete={handleDelete}
            onComplete={handleConfirmAndCreate}
            showDecimal={false}
            maxLength={6}
          />

          <Button
            onClick={() => handleConfirmAndCreate()}
            className='mt-6 w-full rounded-full'
            size='lg'
            disabled={confirmPin.length < 6}
          >
            {t('setup.createWallet')}
          </Button>

          <Button
            onClick={() => {
              setStep('create-pin');
              setConfirmPin('');
            }}
            variant='ghost'
            className='w-full'
          >
            {tCommon('actions.back')}
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
