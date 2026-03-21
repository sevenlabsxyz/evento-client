'use client';

import { Button } from '@/components/ui/button';
import { BrowserSupportMessage } from '@/components/wallet/browser-support-message';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWalletMigration, isMigrationError } from '@/lib/hooks/use-wallet-migration';
import { toast } from '@/lib/utils/toast';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Fingerprint,
  Key,
  Loader2,
  Shield,
  Wallet,
} from 'lucide-react';
import { useCallback, useState } from 'react';

interface WalletMigrationProps {
  /** Called when migration completes successfully */
  onComplete?: (credentialId: string) => void;
  /** Called when user cancels migration */
  onCancel?: () => void;
  /** Relying Party ID for passkey creation (default: 'evento.cash') */
  rpId?: string;
  /** Called when user chooses to keep PIN wallet instead */
  onKeepPinWallet?: () => void;
}

type MigrationStep = 'warning' | 'enter-pin' | 'migrating' | 'success' | 'error';

interface MigrationUIState {
  step: MigrationStep;
  pin: string;
  confirmPin: string;
  pinError: string | null;
}

/**
 * Component for migrating PIN-based wallet to passkey authentication
 *
 * Flow:
 * 1. Warning - Explain migration risks and benefits
 * 2. Enter PIN - Verify user knows existing PIN
 * 3. Migrating - Show progress during migration
 * 4. Success/Error - Show result
 *
 * Features:
 * - Atomic migration (original wallet intact on failure)
 * - Progress indicator during migration
 * - Option to cancel before starting
 * - Clear error messages with retry option
 */
export function WalletMigration({
  onComplete,
  onCancel,
  rpId = 'evento.cash',
  onKeepPinWallet,
}: WalletMigrationProps) {
  const {
    migrateToPasskey,
    migrationState,
    progress,
    error,
    isMigrating,
    canMigrate,
    hasPinWallet,
    hasPasskeyWallet,
    prfSupported,
    getErrorMessage,
    reset,
    clearError,
  } = useWalletMigration();

  const [uiState, setUIState] = useState<MigrationUIState>({
    step: 'warning',
    pin: '',
    confirmPin: '',
    pinError: null,
  });

  /**
   * Handle PIN input change
   */
  const handlePinChange = useCallback((value: string) => {
    // Only allow digits
    const digitsOnly = value.replace(/\D/g, '');
    setUIState((prev) => ({
      ...prev,
      pin: digitsOnly.slice(0, 6), // Max 6 digits
      pinError: null,
    }));
  }, []);

  /**
   * Start migration process
   */
  const handleStartMigration = useCallback(() => {
    setUIState((prev) => ({ ...prev, step: 'enter-pin' }));
  }, []);

  /**
   * Handle PIN submission and start actual migration
   */
  const handlePinSubmit = useCallback(async () => {
    const { pin } = uiState;

    // Validate PIN
    if (pin.length < 4) {
      setUIState((prev) => ({ ...prev, pinError: 'PIN must be at least 4 digits' }));
      return;
    }

    setUIState((prev) => ({ ...prev, step: 'migrating', pinError: null }));
    clearError();

    try {
      const result = await migrateToPasskey(pin, rpId);

      if (result.success) {
        setUIState((prev) => ({ ...prev, step: 'success' }));
        toast.success('Wallet migrated to passkey successfully!');
        onComplete?.(result.credentialId);
      }
    } catch (err) {
      setUIState((prev) => ({ ...prev, step: 'error' }));

      if (isMigrationError(err)) {
        toast.error(getErrorMessage(err));
      } else {
        toast.error('Migration failed. Please try again.');
      }
    }
  }, [uiState.pin, clearError, migrateToPasskey, rpId, onComplete, getErrorMessage]);

  /**
   * Handle retry after error
   */
  const handleRetry = useCallback(() => {
    reset();
    setUIState({
      step: 'warning',
      pin: '',
      confirmPin: '',
      pinError: null,
    });
  }, [reset]);

  /**
   * Handle cancel
   */
  const handleCancel = useCallback(() => {
    reset();
    onCancel?.();
  }, [reset, onCancel]);

  /**
   * Handle keep PIN wallet
   */
  const handleKeepPinWallet = useCallback(() => {
    onKeepPinWallet?.();
  }, [onKeepPinWallet]);

  // Check if migration is not possible
  if (!hasPinWallet) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
            <AlertCircle className="h-8 w-8 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold">No Wallet to Migrate</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            You don&apos;t have a PIN-based wallet to migrate.
          </p>
        </div>

        {onCancel && (
          <Button onClick={onCancel} variant="outline" className="w-full rounded-full">
            Go Back
          </Button>
        )}
      </div>
    );
  }

  // Already has passkey wallet
  if (hasPasskeyWallet) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold">Already Using Passkey</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your wallet is already set up with passkey authentication.
          </p>
        </div>

        {onCancel && (
          <Button onClick={onCancel} variant="outline" className="w-full rounded-full">
            Go Back
          </Button>
        )}
      </div>
    );
  }

  // PRF not supported
  if (!prfSupported && uiState.step === 'warning') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
            <AlertCircle className="h-8 w-8 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold">Browser Not Supported</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your browser doesn&apos;t support passkey wallet migration
          </p>
        </div>

        <BrowserSupportMessage onUsePinFallback={handleKeepPinWallet} />

        {onCancel && (
          <Button onClick={onCancel} variant="ghost" className="w-full">
            Cancel
          </Button>
        )}
      </div>
    );
  }

  // Warning step
  if (uiState.step === 'warning') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Fingerprint className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Migrate to Passkey</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Upgrade your wallet to use passkey authentication
          </p>
        </div>

        <div className="rounded-2xl bg-blue-50 p-4">
          <div className="flex gap-3">
            <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
            <div className="text-sm text-blue-900">
              <p className="font-medium">Benefits of Passkey</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>No PIN to remember</li>
                <li>Uses Face ID, Touch ID, or device screen lock</li>
                <li>More secure than traditional PIN</li>
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
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Your existing wallet funds will be preserved</li>
                <li>You&apos;ll need your current PIN to migrate</li>
                <li>Your recovery phrase remains the same</li>
                <li>You can still use your recovery phrase as backup</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
          <div className="flex gap-3">
            <Wallet className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-600" />
            <div className="text-sm text-orange-900">
              <p className="font-medium">What Happens</p>
              <p className="mt-1">
                Your PIN wallet will be converted to a passkey wallet. The original PIN will no longer work.
                Make sure you have your recovery phrase backed up before proceeding.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleStartMigration}
            className="w-full rounded-full"
            size="lg"
            disabled={!canMigrate}
          >
            <Key className="mr-2 h-4 w-4" />
            Start Migration
          </Button>

          {onKeepPinWallet && (
            <Button onClick={handleKeepPinWallet} variant="outline" className="w-full rounded-full">
              Keep PIN Wallet
            </Button>
          )}

          {onCancel && (
            <Button onClick={onCancel} variant="ghost" className="w-full rounded-full">
              Cancel
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Enter PIN step
  if (uiState.step === 'enter-pin') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Key className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Enter Your PIN</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your current wallet PIN to verify ownership
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pin">Current PIN</Label>
            <Input
              id="pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Enter your PIN"
              value={uiState.pin}
              onChange={(e) => handlePinChange(e.target.value)}
              className="text-center text-2xl tracking-widest"
              maxLength={6}
              autoFocus
            />
            {uiState.pinError && (
              <p className="text-sm text-destructive">{uiState.pinError}</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-muted/50 p-4">
          <p className="text-center text-sm text-muted-foreground">
            Your PIN is used to decrypt your wallet and verify ownership before migration.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handlePinSubmit}
            className="w-full rounded-full"
            size="lg"
            disabled={uiState.pin.length < 4}
          >
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          <Button onClick={handleCancel} variant="ghost" className="w-full rounded-full">
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // Migrating step
  if (uiState.step === 'migrating' || isMigrating) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-6 px-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Migrating Wallet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Please wait while we migrate your wallet to passkey...
          </p>
        </div>

        {/* Progress indicator */}
        <div className="w-full max-w-xs space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              {migrationState === 'checking-prf' && 'Checking browser support...'}
              {migrationState === 'decrypting' && 'Decrypting wallet...'}
              {migrationState === 'creating-passkey' && 'Creating passkey...'}
              {migrationState === 'storing' && 'Storing wallet data...'}
              {migrationState === 'cleaning' && 'Cleaning up...'}
            </span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl bg-amber-50 p-4">
          <div className="flex gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
            <div className="text-sm text-amber-900">
              <p className="font-medium">Do not close this page</p>
              <p className="mt-1">
                Your wallet is being migrated. Closing this page may interrupt the process.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success step
  if (uiState.step === 'success') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold">Migration Complete!</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your wallet has been successfully migrated to passkey authentication
          </p>
        </div>

        <div className="rounded-2xl bg-green-50 p-4">
          <div className="flex gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
            <div className="text-sm text-green-900">
              <p className="font-medium">What Changed</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Your wallet now uses passkey authentication</li>
                <li>Your funds are preserved and accessible</li>
                <li>Your recovery phrase still works as backup</li>
                <li>The old PIN is no longer needed</li>
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
                Keep your recovery phrase safe. It&apos;s still the only way to recover your wallet
                if you lose access to your passkey.
              </p>
            </div>
          </div>
        </div>

        <Button onClick={handleCancel} className="w-full rounded-full" size="lg">
          Continue to Wallet
        </Button>
      </div>
    );
  }

  // Error step
  if (uiState.step === 'error') {
    const errorMessage = error ? getErrorMessage(error) : 'An unexpected error occurred';

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-6 px-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold">Migration Failed</h2>
          <p className="mt-2 text-sm text-muted-foreground">{errorMessage}</p>
        </div>

        <div className="rounded-2xl bg-green-50 p-4">
          <div className="flex gap-3">
            <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
            <div className="text-sm text-green-900">
              <p className="font-medium">Your Wallet is Safe</p>
              <p className="mt-1">
                Your original PIN wallet was not affected. You can try again or continue using your PIN wallet.
              </p>
            </div>
          </div>
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

  return null;
}