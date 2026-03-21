'use client';

import { Button } from '@/components/ui/button';
import { usePasskey } from '@/lib/hooks/use-passkey';
import { PasskeyStorageService } from '@/lib/services/passkey-storage';
import { prfOutputToMnemonic } from '@/lib/services/prf-to-mnemonic';
import { PasskeyError, isPasskeyError } from '@/lib/services/passkey-service';
import { toast } from '@/lib/utils/toast';
import { AlertCircle, Fingerprint, KeyRound, Loader2, RefreshCw } from 'lucide-react';
import { useState } from 'react';

interface PasskeyRestoreProps {
  onComplete: (mnemonic: string) => void;
  onCancel?: () => void;
  rpId?: string;
}

type RestoreStep = 'initial' | 'authenticating' | 'restoring' | 'error';

interface RestoreState {
  step: RestoreStep;
  errorMessage: string | null;
  isProcessing: boolean;
}

export function PasskeyRestore({ onComplete, onCancel, rpId = 'evento.cash' }: PasskeyRestoreProps) {
  const [state, setState] = useState<RestoreState>({
    step: 'initial',
    errorMessage: null,
    isProcessing: false,
  });

  const { authenticateWithPRF, isAuthenticating, getErrorMessage } = usePasskey();

  const handleRestore = async () => {
    setState({
      step: 'authenticating',
      errorMessage: null,
      isProcessing: true,
    });

    try {
      // Check if passkey wallet exists
      const credentialId = PasskeyStorageService.getCredentialId();
      const hasWallet = PasskeyStorageService.hasPasskeyWallet();

      if (!credentialId || !hasWallet) {
        throw new PasskeyError(
          'No passkey wallet found on this device. If you created your wallet on a different device, you will need to use your recovery phrase to restore it.',
          'no_credentials_found'
        );
      }

      // Authenticate with PRF using credential ID as salt
      const result = await authenticateWithPRF(rpId, credentialId, {
        credentialId,
        requireUserVerification: true,
      });

      // Move to restoring step
      setState({
        step: 'restoring',
        errorMessage: null,
        isProcessing: true,
      });

      // Derive mnemonic from PRF output
      const mnemonic = prfOutputToMnemonic(result.prfOutput);

      // Success - call onComplete with mnemonic
      toast.success('Wallet restored successfully!');
      onComplete(mnemonic);
    } catch (error) {
      let errorMessage: string;

      if (isPasskeyError(error)) {
        errorMessage = getErrorMessage(error);

        // Provide more specific message for cross-device scenario
        if (error.code === 'no_credentials_found') {
          errorMessage =
            'No passkey found on this device. If you created your wallet on a different device, please use your 12-word recovery phrase to restore your wallet instead.';
        } else if (error.code === 'cancelled') {
          errorMessage = 'Authentication was cancelled. Please try again when you are ready.';
        }
      } else {
        errorMessage =
          error instanceof Error ? error.message : 'An unexpected error occurred while restoring your wallet.';
      }

      setState({
        step: 'error',
        errorMessage,
        isProcessing: false,
      });
    }
  };

  const handleRetry = () => {
    setState({
      step: 'initial',
      errorMessage: null,
      isProcessing: false,
    });
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  // Initial step: Show restore button
  if (state.step === 'initial') {
    return (
      <div className='space-y-6'>
        <div className='text-center'>
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10'>
            <RefreshCw className='h-8 w-8 text-primary' />
          </div>
          <h2 className='text-2xl font-bold'>Restore with Passkey</h2>
          <p className='mt-2 text-sm text-muted-foreground'>
            Use your device&apos;s passkey to quickly restore your wallet.
            <br />
            <br />
            This only works if you created your wallet on this device. If you created your wallet on a different
            device, you&apos;ll need to use your recovery phrase instead.
          </p>
        </div>

        <div className='space-y-3'>
          <Button
            onClick={handleRestore}
            disabled={state.isProcessing}
            className='w-full'
            size='lg'
          >
            <Fingerprint className='mr-2 h-5 w-5' />
            Restore with Passkey
          </Button>

          {onCancel && (
            <Button onClick={handleCancel} variant='outline' className='w-full'>
              Cancel
            </Button>
          )}
        </div>

        <div className='rounded-lg bg-amber-50 p-4'>
          <div className='flex items-start gap-3'>
            <AlertCircle className='mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600' />
            <div className='text-sm text-amber-900'>
              <p className='font-medium'>Important</p>
              <p className='mt-1'>
                Passkey restore only works on the same device where you created your wallet. For cross-device
                recovery, use your 12-word recovery phrase.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Authenticating step: Waiting for passkey
  if (state.step === 'authenticating') {
    return (
      <div className='space-y-6'>
        <div className='text-center'>
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10'>
            {isAuthenticating ? (
              <Loader2 className='h-8 w-8 animate-spin text-primary' />
            ) : (
              <KeyRound className='h-8 w-8 text-primary' />
            )}
          </div>
          <h2 className='text-2xl font-bold'>Verify Your Identity</h2>
          <p className='mt-2 text-sm text-muted-foreground'>
            Please use your passkey to authenticate and restore your wallet.
          </p>
        </div>

        <div className='space-y-4'>
          <div className='rounded-lg bg-blue-50 p-4'>
            <div className='flex items-start gap-3'>
              <Fingerprint className='mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600' />
              <div className='text-sm text-blue-900'>
                <p className='font-medium'>Authenticating...</p>
                <p className='mt-1'>Follow the prompts on your device to verify your identity.</p>
              </div>
            </div>
          </div>

          {onCancel && (
            <Button onClick={handleCancel} variant='outline' className='w-full' disabled={isAuthenticating}>
              Cancel
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Restoring step: Processing
  if (state.step === 'restoring') {
    return (
      <div className='space-y-6'>
        <div className='text-center'>
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10'>
            <Loader2 className='h-8 w-8 animate-spin text-primary' />
          </div>
          <h2 className='text-2xl font-bold'>Restoring Wallet...</h2>
          <p className='mt-2 text-sm text-muted-foreground'>Please wait while we restore your wallet.</p>
        </div>

        <div className='space-y-4'>
          <div className='rounded-lg bg-blue-50 p-4'>
            <div className='flex items-start gap-3'>
              <RefreshCw className='mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600' />
              <div className='text-sm text-blue-900'>
                <p className='font-medium'>Processing</p>
                <p className='mt-1'>Deriving your wallet keys from your passkey...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error step: Show error and retry
  if (state.step === 'error') {
    return (
      <div className='space-y-6'>
        <div className='text-center'>
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100'>
            <AlertCircle className='h-8 w-8 text-red-600' />
          </div>
          <h2 className='text-2xl font-bold'>Restore Failed</h2>
          <p className='mt-2 text-sm text-muted-foreground'>We couldn&apos;t restore your wallet with your passkey.</p>
        </div>

        <div className='space-y-4'>
          <div className='rounded-lg bg-red-50 p-4'>
            <div className='flex items-start gap-3'>
              <AlertCircle className='mt-0.5 h-5 w-5 flex-shrink-0 text-red-600' />
              <div className='text-sm text-red-900'>
                <p className='font-medium'>Error</p>
                <p className='mt-1'>{state.errorMessage}</p>
              </div>
            </div>
          </div>

          <div className='space-y-3'>
            <Button onClick={handleRetry} className='w-full' size='lg'>
              Try Again
            </Button>

            {onCancel && (
              <Button onClick={handleCancel} variant='outline' className='w-full'>
                Use Recovery Phrase Instead
              </Button>
            )}
          </div>
        </div>

        <div className='rounded-lg bg-amber-50 p-4'>
          <div className='flex items-start gap-3'>
            <AlertCircle className='mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600' />
            <div className='text-sm text-amber-900'>
              <p className='font-medium'>Need to restore on a different device?</p>
              <p className='mt-1'>
                If you created your wallet on a different device, you&apos;ll need your 12-word recovery phrase to
                restore it here.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
