'use client';

import { Button } from '@/components/ui/button';
import { NumericKeypad } from '@/components/wallet/numeric-keypad';
import { useAuth } from '@/lib/hooks/use-auth';
import { useLightningAddress } from '@/lib/hooks/use-lightning-address';
import { useWallet } from '@/lib/hooks/use-wallet';
import { logger } from '@/lib/utils/logger';
import { toast } from '@/lib/utils/toast';
import { AlertCircle, Key, Loader2, Wallet } from 'lucide-react';
import { useState } from 'react';

interface WalletSetupProps {
  onComplete: (mnemonic?: string) => void;
  onCancel?: () => void;
}

type Step = 'create-pin' | 'confirm-pin' | 'creating' | 'error';

export function WalletSetup({ onComplete, onCancel }: WalletSetupProps) {
  const [step, setStep] = useState<Step>('create-pin');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { createWallet } = useWallet();
  const { user } = useAuth();
  const { checkAvailability, registerAddress } = useLightningAddress();

  const handleNumberClick = (num: string) => {
    if (step === 'create-pin' && pin.length < 6) {
      setPin(pin + num);
    } else if (step === 'confirm-pin' && confirmPin.length < 6) {
      setConfirmPin(confirmPin + num);
    }
  };

  const handleDelete = () => {
    if (step === 'create-pin') {
      setPin(pin.slice(0, -1));
    } else if (step === 'confirm-pin') {
      setConfirmPin(confirmPin.slice(0, -1));
    }
  };

  const handleCreatePinNext = () => {
    if (pin.length < 4) {
      toast.error('PIN must be at least 4 digits');
      return;
    }
    setStep('confirm-pin');
  };

  const handleConfirmAndCreate = async () => {
    if (confirmPin !== pin) {
      toast.error('PINs do not match');
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

      toast.success('Wallet created successfully!');
      onComplete(mnemonic);
    } catch (err: any) {
      logger.error('Wallet creation error', {
        error: err instanceof Error ? err.message : String(err),
      });

      // Provide helpful error messages
      let errorMessage = err.message || 'Failed to create wallet';

      if (err.message?.includes('API key')) {
        errorMessage = 'Breez API key is missing. Please contact support.';
      } else if (err.message?.includes('WASM') || err.message?.includes('defaultConfig')) {
        errorMessage = 'Wallet initialization failed. Please refresh the page and try again.';
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
          className='flex h-12 w-12 items-center justify-center rounded-full border-2 border-gray-200 bg-gray-50'
        >
          {currentPin.length > index && <div className='h-3 w-3 rounded-full bg-gray-900' />}
        </div>
      ))}
    </div>
  );

  // Error state
  if (step === 'error') {
    return (
      <div className='flex min-h-[60vh] flex-col items-center justify-center space-y-6 px-6'>
        <div className='text-center'>
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100'>
            <AlertCircle className='h-8 w-8 text-red-600' />
          </div>
          <h2 className='text-2xl font-bold'>Setup Failed</h2>
          <p className='mt-2 text-sm text-muted-foreground'>{error}</p>
        </div>
        <div className='flex gap-3'>
          <Button onClick={handleRetry} variant='default' size='lg'>
            Try Again
          </Button>
          {onCancel && (
            <Button onClick={onCancel} variant='outline' size='lg'>
              Go Back
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Creating state
  if (step === 'creating') {
    return (
      <div className='flex min-h-[60vh] flex-col items-center justify-center space-y-6'>
        <div className='text-center'>
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50'>
            <Loader2 className='h-8 w-8 animate-spin text-orange-600' />
          </div>
          <h2 className='text-2xl font-bold'>Creating Wallet</h2>
          <p className='mt-2 text-sm text-muted-foreground'>Setting up your wallet...</p>
        </div>
      </div>
    );
  }

  // Create PIN step
  if (step === 'create-pin') {
    return (
      <div className='space-y-6'>
        <div className='text-center'>
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50'>
            <Wallet className='h-8 w-8 text-orange-600' />
          </div>
          <h2 className='text-2xl font-bold'>Create a PIN</h2>
          <p className='mt-2 text-sm text-muted-foreground'>
            Set a 4-6 digit PIN to protect your wallet
          </p>
        </div>

        <div className='space-y-4'>
          {renderPinDots(pin)}

          <NumericKeypad
            onNumberClick={handleNumberClick}
            onDelete={handleDelete}
            showDecimal={false}
          />

          <div className='rounded-lg bg-amber-50 p-4'>
            <div className='flex items-start gap-2'>
              <AlertCircle className='mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600' />
              <div className='text-sm text-amber-900'>
                <p className='font-medium'>Important</p>
                <p className='mt-1'>Remember this PIN! You'll need it to access your wallet.</p>
              </div>
            </div>
          </div>

          <Button
            onClick={handleCreatePinNext}
            className='mt-6 w-full rounded-full'
            size='lg'
            disabled={pin.length < 4}
          >
            Next
          </Button>

          {onCancel && (
            <Button onClick={onCancel} variant='ghost' className='w-full'>
              Cancel
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
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border bg-gray-50'>
            <Key className='h-8 w-8 text-black' />
          </div>
          <h2 className='text-2xl font-bold'>Confirm Your PIN</h2>
          <p className='mt-2 text-sm text-muted-foreground'>Enter your PIN again to confirm</p>
        </div>

        <div className='space-y-4'>
          {renderPinDots(confirmPin)}

          <NumericKeypad
            onNumberClick={handleNumberClick}
            onDelete={handleDelete}
            showDecimal={false}
          />

          <Button
            onClick={handleConfirmAndCreate}
            className='mt-6 w-full rounded-full'
            size='lg'
            disabled={confirmPin.length < 4}
          >
            Create Wallet
          </Button>

          <Button
            onClick={() => {
              setStep('create-pin');
              setConfirmPin('');
            }}
            variant='ghost'
            className='w-full'
          >
            Back
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
