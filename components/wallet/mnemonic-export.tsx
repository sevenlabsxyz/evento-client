'use client';

import { Button } from '@/components/ui/button';
import { toast } from '@/lib/utils/toast';
import { AlertCircle, Copy, Check, Download, Eye, EyeOff, Shield, Key, Loader2 } from 'lucide-react';
import { useState, useCallback } from 'react';
import { usePasskey } from '@/lib/hooks/use-passkey';
import { PasskeyStorageService } from '@/lib/services/passkey-storage';
import { prfOutputToMnemonic } from '@/lib/services/prf-to-mnemonic';
import {
  isPasskeyError,
  decryptMnemonicWithPRF,
  isPRFDerivedWallet,
  isPRFEncryptedWallet,
} from '@/lib/services/passkey-service';

interface MnemonicExportProps {
  /**
   * Called when the export flow completes successfully.
   */
  onComplete?: () => void;
  /**
   * Called when the user cancels or closes the export flow.
   */
  onCancel?: () => void;
  /**
   * The RP ID (Relying Party ID) for passkey authentication.
   * @default 'evento.cash'
   */
  rpId?: string;
}

type ExportStep = 'initial' | 'authenticating' | 'display' | 'error';

/**
 * Mnemonic Export Component
 *
 * Allows users to export their wallet mnemonic by re-authenticating with their passkey.
 * The mnemonic is derived from the PRF output and displayed only after successful
 * passkey authentication. The mnemonic is never stored in component state after display.
 *
 * Security features:
 * - Requires passkey re-authentication before showing mnemonic
 * - Mnemonic displayed only temporarily (not stored in state)
 * - Blur effect with toggle to reveal
 * - Copy and save functionality with warnings
 * - Handles auth cancellation gracefully
 */
export function MnemonicExport({
  onComplete,
  onCancel,
  rpId = 'evento.cash',
}: MnemonicExportProps) {
  const [step, setStep] = useState<ExportStep>('initial');
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { authenticateWithPRF, isAuthenticating, getErrorMessage } = usePasskey();

  /**
   * Handle the export request - triggers passkey authentication
   */
  const handleExportRequest = useCallback(async () => {
    setErrorMessage(null);
    setStep('authenticating');

    try {
      // Check if passkey wallet exists
      const credentialId = PasskeyStorageService.getCredentialId();
      if (!credentialId) {
        throw new Error('No passkey wallet found. Please create a wallet first.');
      }

      // Check if encrypted mnemonic exists
      if (!PasskeyStorageService.hasPasskeyWallet()) {
        throw new Error('No passkey wallet data found. Please create a wallet first.');
      }

      // Get the stored wallet data to determine wallet type
      const storedData = PasskeyStorageService.getPasskeyWallet(credentialId);
      if (!storedData) {
        throw new Error('Passkey wallet data not found. Please create a wallet first.');
      }

      // Authenticate with passkey and get PRF output
      // Use the credentialId as the salt for deterministic derivation
      const result = await authenticateWithPRF(rpId, credentialId, {
        credentialId,
        requireUserVerification: true,
      });

      // Determine how to recover the mnemonic based on wallet type
      let mnemonic: string;

      if (isPRFDerivedWallet(storedData)) {
        // Fresh setup wallet: mnemonic is derived from PRF output
        mnemonic = prfOutputToMnemonic(result.prfOutput);
      } else if (isPRFEncryptedWallet(storedData)) {
        // Migrated wallet: mnemonic is encrypted with PRF output, decrypt it
        mnemonic = await decryptMnemonicWithPRF(storedData, result.prfOutput);
      } else {
        // Unknown wallet type - this shouldn't happen
        throw new Error('Invalid wallet data format. Please restore using your recovery phrase.');
      }
      // Show the mnemonic
      setMnemonic(mnemonic);
      setShowMnemonic(false); // Start blurred
      setStep('display');
    } catch (error) {
      // Handle cancellation gracefully
      if (isPasskeyError(error) && error.code === 'cancelled') {
        setErrorMessage('Authentication was cancelled. Your mnemonic remains secure.');
        setStep('error');
        return;
      }

      // Handle other passkey errors
      if (isPasskeyError(error)) {
        setErrorMessage(getErrorMessage(error));
        setStep('error');
        return;
      }

      // Handle generic errors
      const message = error instanceof Error ? error.message : 'Failed to export mnemonic';
      setErrorMessage(message);
      setStep('error');
    }
  }, [authenticateWithPRF, rpId, getErrorMessage]);

  /**
   * Copy mnemonic to clipboard
   */
  const handleCopy = useCallback(async () => {
    if (!mnemonic) return;

    try {
      await navigator.clipboard.writeText(mnemonic);
      setCopied(true);
      toast.success('Recovery phrase copied to clipboard');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error('Failed to copy recovery phrase');
    }
  }, [mnemonic]);

  /**
   * Save mnemonic to file
   */
  const handleSave = useCallback(async () => {
    if (!mnemonic) return;

    const blob = new Blob([mnemonic], { type: 'text/plain' });
    const file = new File([blob], 'evento-wallet-recovery-phrase.txt', {
      type: 'text/plain',
    });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'Recovery Phrase',
        });
        toast.success('Recovery phrase shared successfully');
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          toast.error('Failed to share recovery phrase');
        }
      }
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'evento-wallet-recovery-phrase.txt';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Recovery phrase downloaded');
    }
  }, [mnemonic]);

  /**
   * Handle completion - clear mnemonic and call onComplete
   */
  const handleComplete = useCallback(() => {
    setMnemonic(null);
    setShowMnemonic(false);
    setStep('initial');
    onComplete?.();
  }, [onComplete]);

  /**
   * Handle cancel - clear mnemonic and call onCancel
   */
  const handleCancel = useCallback(() => {
    setMnemonic(null);
    setShowMnemonic(false);
    setStep('initial');
    setErrorMessage(null);
    onCancel?.();
  }, [onCancel]);

  /**
   * Retry after error
   */
  const handleRetry = useCallback(() => {
    setErrorMessage(null);
    setStep('initial');
  }, []);

  // Parse mnemonic words for display
  const words = mnemonic ? mnemonic.split(' ') : [];
  const wordCount = words.length;

  // Step 1: Initial state - show export button
  if (step === 'initial') {
    return (
      <div className='space-y-6'>
        <div className='text-center'>
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50'>
            <Key className='h-8 w-8 text-amber-600' />
          </div>
          <h2 className='text-2xl font-bold'>Export Recovery Phrase</h2>
          <p className='mt-2 text-sm text-muted-foreground'>
            View your wallet recovery phrase for backup purposes
          </p>
        </div>

        <div className='rounded-2xl bg-amber-50 p-4'>
          <div className='flex gap-3'>
            <Shield className='mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600' />
            <div className='text-sm text-amber-900'>
              <p className='font-medium'>Security Notice</p>
              <ul className='mt-2 list-inside list-disc space-y-1'>
                <li>You will need to authenticate with your passkey</li>
                <li>Only view this in a private, secure location</li>
                <li>Never share your recovery phrase with anyone</li>
                <li>Anyone with these words can access your wallet</li>
              </ul>
            </div>
          </div>
        </div>

        <div className='space-y-3'>
          <Button
            onClick={handleExportRequest}
            className='w-full rounded-full'
            size='lg'
          >
            <Key className='mr-2 h-4 w-4' />
            Export Mnemonic
          </Button>
          {onCancel && (
            <Button onClick={handleCancel} variant='ghost' className='w-full rounded-full'>
              Cancel
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Step 2: Authenticating - show loading state
  if (step === 'authenticating') {
    return (
      <div className='space-y-6'>
        <div className='text-center'>
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50'>
            <Loader2 className='h-8 w-8 animate-spin text-blue-600' />
          </div>
          <h2 className='text-2xl font-bold'>Authenticating...</h2>
          <p className='mt-2 text-sm text-muted-foreground'>
            Please use your passkey to authenticate
          </p>
        </div>

        <div className='rounded-2xl bg-blue-50 p-4'>
          <div className='flex gap-3'>
            <Shield className='mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600' />
            <div className='text-sm text-blue-900'>
              <p className='font-medium'>Verify Your Identity</p>
              <p className='mt-1'>
                Follow the prompts from your browser or device to authenticate with your passkey.
                This ensures only you can access your recovery phrase.
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={handleCancel}
          variant='ghost'
          className='w-full rounded-full'
          disabled={isAuthenticating}
        >
          Cancel
        </Button>
      </div>
    );
  }

  // Step 3: Error state
  if (step === 'error') {
    return (
      <div className='space-y-6'>
        <div className='text-center'>
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50'>
            <AlertCircle className='h-8 w-8 text-red-600' />
          </div>
          <h2 className='text-2xl font-bold'>Export Failed</h2>
          <p className='mt-2 text-sm text-muted-foreground'>
            Could not export your recovery phrase
          </p>
        </div>

        <div className='rounded-2xl bg-red-50 p-4'>
          <div className='flex gap-3'>
            <AlertCircle className='mt-0.5 h-5 w-5 flex-shrink-0 text-red-600' />
            <div className='text-sm text-red-900'>
              <p className='font-medium'>Error</p>
              <p className='mt-1'>{errorMessage}</p>
            </div>
          </div>
        </div>

        <div className='space-y-3'>
          <Button onClick={handleRetry} className='w-full rounded-full' size='lg'>
            Try Again
          </Button>
          {onCancel && (
            <Button onClick={handleCancel} variant='ghost' className='w-full rounded-full'>
              Close
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Step 4: Display mnemonic
  if (step === 'display' && mnemonic) {
    return (
      <div className='space-y-6'>
        <div className='text-center'>
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50'>
            <Shield className='h-8 w-8 text-green-600' />
          </div>
          <h2 className='text-2xl font-bold'>Your Recovery Phrase</h2>
          <p className='mt-2 text-sm text-muted-foreground'>
            Write down these {wordCount} words in order and store them safely
          </p>
        </div>

        <div className='rounded-2xl bg-red-50 p-4'>
          <div className='flex gap-3'>
            <AlertCircle className='h-5 w-5 flex-shrink-0 text-red-600' />
            <div className='text-sm text-red-900'>
              <p className='font-medium'>Keep this private</p>
              <p className='mt-1'>
                Anyone with these words can access your wallet. Store them securely offline.
              </p>
            </div>
          </div>
        </div>

        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <span className='text-sm font-medium'>Your Recovery Phrase</span>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setShowMnemonic(!showMnemonic)}
              data-testid='toggle-visibility'
            >
              {showMnemonic ? (
                <>
                  <EyeOff className='mr-2 h-4 w-4' />
                  Hide
                </>
              ) : (
                <>
                  <Eye className='mr-2 h-4 w-4' />
                  Show
                </>
              )}
            </Button>
          </div>

          <div
            className={`rounded-2xl border-2 border-dashed p-4 ${
              showMnemonic ? '' : 'blur-sm select-none'
            }`}
            data-testid='mnemonic-display'
          >
            <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
              {words.map((word, index) => (
                <div
                  key={index}
                  className='flex items-center gap-2 rounded-xl bg-gray-50 p-2'
                  data-testid={`word-${index}`}
                >
                  <span className='w-6 flex-shrink-0 text-xs text-muted-foreground'>
                    {index + 1}.
                  </span>
                  <span className='font-mono text-sm'>{word}</span>
                </div>
              ))}
            </div>
          </div>

          {showMnemonic && (
            <div className='flex gap-3'>
              <Button
                variant='ghost'
                onClick={handleCopy}
                className='flex-1 rounded-full border border-gray-200 bg-gray-50 hover:bg-gray-100'
                data-testid='copy-button'
              >
                {copied ? (
                  <>
                    <Check className='mr-2 h-4 w-4' />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className='mr-2 h-4 w-4' />
                    Copy
                  </>
                )}
              </Button>
              <Button
                variant='ghost'
                onClick={handleSave}
                className='flex-1 rounded-full border border-gray-200 bg-gray-50 hover:bg-gray-100'
                data-testid='save-button'
              >
                <Download className='mr-2 h-4 w-4' />
                Save
              </Button>
            </div>
          )}
        </div>

        <div className='space-y-3'>
          <Button onClick={handleComplete} className='w-full rounded-full' size='lg'>
            I&apos;ve Saved My Recovery Phrase
          </Button>
          <Button onClick={handleCancel} variant='ghost' className='w-full rounded-full'>
            Close
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
