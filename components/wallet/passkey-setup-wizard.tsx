'use client';

import { Button } from '@/components/ui/button';
import { BrowserSupportMessage } from '@/components/wallet/browser-support-message';
import { MnemonicBackupFlow } from '@/components/wallet/mnemonic-backup-flow';
import { usePasskey } from '@/lib/hooks/use-passkey';
import { prfOutputToMnemonic } from '@/lib/services/prf-to-mnemonic';
import { toast } from '@/lib/utils/toast';
import { AlertCircle, CheckCircle2, Fingerprint, Key, Loader2, Shield } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface PasskeySetupWizardProps {
  /** Called when setup completes successfully */
  onComplete: (mnemonic: string, credentialId: string) => void;
  /** Called when user cancels setup */
  onCancel?: () => void;
  /** Relying Party ID for passkey creation (default: 'evento.cash') */
  rpId?: string;
  /** Called when user chooses PIN fallback instead */
  onUsePinFallback?: () => void;
}

type WizardStep = 'prf-check' | 'create-passkey' | 'show-mnemonic' | 'confirm-backup';

interface WizardState {
  step: WizardStep;
  credentialId: string | null;
  mnemonic: string | null;
  prfOutput: Uint8Array | null;
  error: string | null;
  isProcessing: boolean;
}

/**
 * Multi-step wizard for passkey wallet setup
 *
 * Flow:
 * 1. PRF Check - Verify browser supports PRF extension
 * 2. Create Passkey - Create WebAuthn credential with PRF
 * 3. Show Mnemonic - Display derived mnemonic for backup
 * 4. Confirm Backup - Require user confirmation before completing
 */
export function PasskeySetupWizard({
  onComplete,
  onCancel,
  rpId = 'evento.cash',
  onUsePinFallback,
}: PasskeySetupWizardProps) {
  const {
    createPasskey,
    checkPRFSupport,
    generateSalt,
    getErrorMessage,
    isLoading: isHookLoading,
    error: hookError,
    prfSupport,
    isCheckingPRFSupport,
  } = usePasskey();

  const [state, setState] = useState<WizardState>({
    step: 'prf-check',
    credentialId: null,
    mnemonic: null,
    prfOutput: null,
    error: null,
    isProcessing: false,
  });

  // Check PRF support on mount
  useEffect(() => {
    if (state.step === 'prf-check' && !isCheckingPRFSupport && prfSupport !== undefined) {
      if (prfSupport.supported) {
        // PRF is supported, proceed to create passkey
        setState((prev) => ({ ...prev, step: 'create-passkey' }));
      }
    }
  }, [state.step, prfSupport, isCheckingPRFSupport]);

  // Handle hook errors
  useEffect(() => {
    if (hookError && state.step !== 'prf-check') {
      setState((prev) => ({
        ...prev,
        error: getErrorMessage(hookError),
        isProcessing: false,
      }));
    }
  }, [hookError, getErrorMessage, state.step]);

  /**
   * Create passkey and derive mnemonic from PRF
   */
  const handleCreatePasskey = useCallback(async () => {
    setState((prev) => ({ ...prev, isProcessing: true, error: null }));

    try {
      // Create passkey with PRF extension
      const credential = await createPasskey(rpId);

      if (!credential.prfEnabled || !credential.prfSalts?.first) {
        throw new Error('PRF extension was not enabled for this passkey');
      }

      // Generate a unique salt for this wallet
      const salt = generateSalt();

      // For initial setup, we use the first PRF salt from creation
      // The mnemonic is derived from the PRF output using the salt
      // Note: In production, the salt would be stored and used for future authentication
      const prfOutput = credential.prfSalts.first;
      const mnemonic = prfOutputToMnemonic(prfOutput);

      setState((prev) => ({
        ...prev,
        step: 'show-mnemonic',
        credentialId: credential.id,
        mnemonic,
        prfOutput,
        isProcessing: false,
      }));

      toast.success('Passkey created successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create passkey';
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isProcessing: false,
      }));
      toast.error(errorMessage);
    }
  }, [createPasskey, generateSalt, rpId]);

  /**
   * Handle mnemonic backup completion
   */
  const handleBackupComplete = useCallback(() => {
    setState((prev) => ({ ...prev, step: 'confirm-backup' }));
  }, []);

  /**
   * Handle final confirmation
   */
  const handleConfirmBackup = useCallback(() => {
    if (state.mnemonic && state.credentialId) {
      onComplete(state.mnemonic, state.credentialId);
    }
  }, [state.mnemonic, state.credentialId, onComplete]);

  /**
   * Handle retry after error
   */
  const handleRetry = useCallback(() => {
    setState((prev) => ({
      ...prev,
      step: 'create-passkey',
      error: null,
      isProcessing: false,
    }));
  }, []);

  /**
   * Handle PIN fallback
   */
  const handleUsePinFallback = useCallback(() => {
    onUsePinFallback?.();
  }, [onUsePinFallback]);

  // Loading state during PRF check
  if (state.step === 'prf-check' || isCheckingPRFSupport) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold">Checking Browser Support</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Verifying your browser supports passkey wallet creation...
          </p>
        </div>
      </div>
    );
  }

  // PRF not supported - show browser support message with PIN fallback
  if (prfSupport && !prfSupport.supported) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
            <AlertCircle className="h-8 w-8 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold">Browser Not Supported</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your browser doesn&apos;t support passkey wallet creation
          </p>
        </div>

        <BrowserSupportMessage onUsePinFallback={handleUsePinFallback} />

        {onCancel && (
          <Button onClick={onCancel} variant="ghost" className="w-full">
            Cancel
          </Button>
        )}
      </div>
    );
  }

  // Error state
  if (state.error && state.step === 'create-passkey') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-6 px-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold">Setup Failed</h2>
          <p className="mt-2 text-sm text-muted-foreground">{state.error}</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleRetry} variant="default" size="lg">
            Try Again
          </Button>
          {onCancel && (
            <Button onClick={onCancel} variant="outline" size="lg">
              Go Back
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Create passkey step
  if (state.step === 'create-passkey') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Fingerprint className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Create Your Passkey</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            A passkey will be used to securely access your wallet
          </p>
        </div>

        <div className="rounded-2xl bg-blue-50 p-4">
          <div className="flex gap-3">
            <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
            <div className="text-sm text-blue-900">
              <p className="font-medium">How Passkeys Work</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Uses Face ID, Touch ID, or your device screen lock</li>
                <li>No passwords to remember</li>
                <li>More secure than traditional passwords</li>
                <li>Works across your devices</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-amber-50 p-4">
          <div className="flex gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
            <div className="text-sm text-amber-900">
              <p className="font-medium">Important</p>
              <p className="mt-1">
                You&apos;ll need to backup your recovery phrase after creating the passkey.
                This phrase is the only way to recover your wallet if you lose your passkey.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleCreatePasskey}
            className="w-full rounded-full"
            size="lg"
            disabled={state.isProcessing || isHookLoading}
          >
            {state.isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Passkey...
              </>
            ) : (
              <>
                <Key className="mr-2 h-4 w-4" />
                Create Passkey
              </>
            )}
          </Button>

          {onCancel && (
            <Button onClick={onCancel} variant="ghost" className="w-full rounded-full">
              Cancel
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Show mnemonic step - use MnemonicBackupFlow component
  if (state.step === 'show-mnemonic' && state.mnemonic) {
    return (
      <MnemonicBackupFlow
        mnemonic={state.mnemonic}
        onComplete={handleBackupComplete}
        onCancel={onCancel}
        isPasskeyWallet={true}
      />
    );
  }

  // Confirm backup step
  if (state.step === 'confirm-backup') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold">Wallet Ready!</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your passkey wallet has been set up successfully
          </p>
        </div>

        <div className="rounded-2xl bg-green-50 p-4">
          <div className="flex gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
            <div className="text-sm text-green-900">
              <p className="font-medium">Setup Complete</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Passkey created and stored securely</li>
                <li>Recovery phrase backed up</li>
                <li>Wallet ready to use</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
          <div className="flex gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-600" />
            <div className="text-sm text-orange-900">
              <p className="font-medium">Remember</p>
              <p className="mt-1">
                Keep your recovery phrase safe. It&apos;s the only way to recover your wallet
                if you lose access to your passkey.
              </p>
            </div>
          </div>
        </div>

        <Button onClick={handleConfirmBackup} className="w-full rounded-full" size="lg">
          Start Using Wallet
        </Button>
      </div>
    );
  }

  return null;
}