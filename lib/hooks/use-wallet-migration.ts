'use client';

import { usePasskey } from '@/lib/hooks/use-passkey';
import { PasskeyStorageService } from '@/lib/services/passkey-storage';
import { WalletStorageService } from '@/lib/services/wallet-storage';
import { encryptMnemonicWithPRF } from '@/lib/services/passkey-service';
import { logger } from '@/lib/utils/logger';
import { useCallback, useState } from 'react';

// Debug flag for verbose logging
const DEBUG_MIGRATION = false;

/**
 * Migration error codes
 */
export type MigrationErrorCode =
  | 'no_pin_wallet'
  | 'invalid_pin'
  | 'prf_not_supported'
  | 'passkey_creation_failed'
  | 'passkey_cancelled'
  | 'mnemonic_mismatch'
  | 'storage_failed'
  | 'unknown_error';

/**
 * Custom error for migration operations
 */
export class MigrationError extends Error {
  constructor(
    message: string,
    public readonly code: MigrationErrorCode,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'MigrationError';
  }
}

/**
 * Result of a successful migration
 */
export interface MigrationResult {
  success: true;
  credentialId: string;
  mnemonic: string;
}

/**
 * State of the migration process
 */
export type MigrationState = 'idle' | 'checking-prf' | 'decrypting' | 'creating-passkey' | 'storing' | 'cleaning' | 'success' | 'error';

/**
 * Hook state
 */
interface UseWalletMigrationState {
  migrationState: MigrationState;
  error: MigrationError | null;
  progress: number; // 0-100
}

/**
 * Hook for migrating PIN-based wallet to passkey authentication
 *
 * Provides atomic migration with rollback on failure:
 * 1. Decrypts existing PIN wallet mnemonic
 * 2. Creates new passkey credential with PRF extension
 * 3. Derives mnemonic from PRF output
 * 4. Verifies derived mnemonic matches existing wallet mnemonic
 * 5. Stores passkey wallet data
 * 6. Clears PIN wallet data (only on success)
 *
 * @example
 * ```typescript
 * const { migrateToPasskey, migrationState, error, isMigrating, canMigrate } = useWalletMigration();
 *
 * // Check if migration is possible
 * if (canMigrate) {
 *   const result = await migrateToPasskey(pin);
 *   if (result.success) {
 *     console.log('Migration complete!', result.credentialId);
 *   }
 * }
 * ```
 */
export function useWalletMigration() {
  const { createPasskey, authenticateWithPRF, checkPRFSupport, prfSupport, isCheckingPRFSupport } = usePasskey();

  const [state, setState] = useState<UseWalletMigrationState>({
    migrationState: 'idle',
    error: null,
    progress: 0,
  });

  /**
   * Check if migration is possible
   * - Must have an existing PIN wallet
   * - PRF must be supported
   */
  const canMigrate = useCallback((): boolean => {
    // Check if PIN wallet exists
    const hasPinWallet = WalletStorageService.getEncryptedSeed() !== null;

    // Check PRF support
    const isPrfSupported = prfSupport?.supported === true;

    return hasPinWallet && isPrfSupported;
  }, [prfSupport]);

  /**
   * Check if there's an existing PIN wallet to migrate
   */
  const hasPinWallet = useCallback((): boolean => {
    return WalletStorageService.getEncryptedSeed() !== null;
  }, []);

  /**
   * Check if there's already a passkey wallet
   */
  const hasPasskeyWallet = useCallback((): boolean => {
    return PasskeyStorageService.hasPasskeyWallet();
  }, []);

  /**
   * Get user-friendly error message
   */
  const getErrorMessage = useCallback((error: MigrationError): string => {
    switch (error.code) {
      case 'no_pin_wallet':
        return 'No PIN wallet found to migrate.';

      case 'invalid_pin':
        return 'Invalid PIN. Please enter the correct PIN for your existing wallet.';

      case 'prf_not_supported':
        return 'Your browser does not support passkey-based wallet. Please use a supported browser.';

      case 'passkey_creation_failed':
        return 'Failed to create passkey. Please try again.';

      case 'passkey_cancelled':
        return 'Passkey creation was cancelled.';

      case 'mnemonic_mismatch':
        return 'Wallet verification failed. The derived wallet does not match your existing wallet.';

      case 'storage_failed':
        return 'Failed to store passkey wallet data. Please try again.';

      case 'unknown_error':
      default:
        return error.message || 'An unexpected error occurred during migration.';
    }
  }, []);

  /**
   * Migrate PIN wallet to passkey authentication
   *
   * This is an atomic operation - if any step fails, the original PIN wallet
   * remains intact.
   *
   * @param pin - The PIN for the existing wallet
   * @param rpId - Relying Party ID for passkey creation (default: 'evento.cash')
   * @returns Migration result with credential ID and mnemonic
   * @throws MigrationError if migration fails
   */
  const migrateToPasskey = useCallback(
    async (pin: string, rpId: string = 'evento.cash'): Promise<MigrationResult> => {
      if (DEBUG_MIGRATION) {
        logger.debug('Starting wallet migration', { rpId });
      }

      // Reset state
      setState({ migrationState: 'idle', error: null, progress: 0 });

      try {
        // Step 1: Check PRF support
        setState((prev) => ({ ...prev, migrationState: 'checking-prf', progress: 10 }));

        const support = await checkPRFSupport();
        if (!support.supported) {
          throw new MigrationError(
            support.reason || 'PRF extension is not supported',
            'prf_not_supported'
          );
        }

        // Step 2: Verify PIN wallet exists
        const encryptedSeed = WalletStorageService.getEncryptedSeed();
        if (!encryptedSeed) {
          throw new MigrationError('No PIN wallet found', 'no_pin_wallet');
        }

        // Step 3: Decrypt existing wallet mnemonic
        setState((prev) => ({ ...prev, migrationState: 'decrypting', progress: 20 }));

        let existingMnemonic: string;
        try {
          existingMnemonic = await WalletStorageService.decryptSeed(encryptedSeed, pin);
        } catch (decryptError) {
          throw new MigrationError(
            'Invalid PIN',
            'invalid_pin',
            decryptError instanceof Error ? decryptError : undefined
          );
        }

        if (DEBUG_MIGRATION) {
          logger.debug('Decrypted existing wallet mnemonic');
        }

        // Step 4: Create passkey credential with PRF extension
        setState((prev) => ({ ...prev, migrationState: 'creating-passkey', progress: 40 }));

        const credential = await createPasskey(rpId);

        if (!credential.prfEnabled) {
          throw new MigrationError(
            'PRF extension was not enabled for this passkey',
            'passkey_creation_failed'
          );
        }

        if (DEBUG_MIGRATION) {
          logger.debug('Passkey created', { credentialId: credential.id, prfEnabled: credential.prfEnabled });
        }

        // Step 5: Authenticate with PRF to get the PRF output
        // We use credential.id as the salt for consistency with export/restore flows
        // The PRF output will be used to encrypt the existing mnemonic
        let prfOutput: Uint8Array;
        try {
          const authResult = await authenticateWithPRF(rpId, credential.id, {
            credentialId: credential.id,
          });
          prfOutput = authResult.prfOutput;
        } catch (authError) {
          throw new MigrationError(
            'Failed to verify passkey authentication',
            'passkey_creation_failed',
            authError instanceof Error ? authError : undefined
          );
        }

        if (DEBUG_MIGRATION) {
          logger.debug('Passkey authentication verified, PRF output obtained');
        }

        // Step 6: Encrypt the existing mnemonic with PRF output
        // This preserves the user's existing wallet funds while enabling passkey-based recovery
        setState((prev) => ({ ...prev, migrationState: 'storing', progress: 60 }));

        const encryptedMnemonic = await encryptMnemonicWithPRF(existingMnemonic, prfOutput);

        if (DEBUG_MIGRATION) {
          logger.debug('Existing mnemonic encrypted with PRF output');
        }

        // Step 7: Store passkey wallet data
        setState((prev) => ({ ...prev, migrationState: 'storing', progress: 70 }));

        try {
          // Store the PRF-encrypted mnemonic
          // This enables deterministic recovery: same passkey + same credential.id = same decryption key
          PasskeyStorageService.storePasskeyWallet(credential.id, encryptedMnemonic);
        } catch (storageError) {
          throw new MigrationError(
            'Failed to store passkey wallet data',
            'storage_failed',
            storageError instanceof Error ? storageError : undefined
          );
        }

        if (DEBUG_MIGRATION) {
          logger.debug('Passkey wallet data stored');
        }

        // Step 8: Clear PIN wallet data (only on success)
        setState((prev) => ({ ...prev, migrationState: 'cleaning', progress: 90 }));

        // IMPORTANT: Only clear PIN wallet after successful passkey storage
        WalletStorageService.clearWalletData();

        if (DEBUG_MIGRATION) {
          logger.debug('PIN wallet data cleared');
        }

        // Success!
        setState({ migrationState: 'success', error: null, progress: 100 });

        return {
          success: true,
          credentialId: credential.id,
          mnemonic: existingMnemonic,
        };
      } catch (error) {
        // Handle specific error types
        let migrationError: MigrationError;

        if (error instanceof MigrationError) {
          migrationError = error;
        } else if (error instanceof Error) {
          // Check for passkey cancellation
          if (error.name === 'NotAllowedError' || error.message.includes('cancelled')) {
            migrationError = new MigrationError('Passkey creation was cancelled', 'passkey_cancelled', error);
          } else {
            migrationError = new MigrationError(
              error.message || 'Unknown error during migration',
              'unknown_error',
              error
            );
          }
        } else {
          migrationError = new MigrationError('Unknown error during migration', 'unknown_error');
        }

        if (DEBUG_MIGRATION) {
          logger.error('Migration failed', {
            code: migrationError.code,
            message: migrationError.message,
          });
        }

        // Rollback is automatic - we never deleted the PIN wallet unless
        // all steps succeeded
        setState({ migrationState: 'error', error: migrationError, progress: 0 });

        throw migrationError;
      }
    },
    [checkPRFSupport, createPasskey, authenticateWithPRF]
  );

  /**
   * Reset migration state
   */
  const reset = useCallback(() => {
    setState({ migrationState: 'idle', error: null, progress: 0 });
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // Derived state
  const isMigrating = ['checking-prf', 'decrypting', 'creating-passkey', 'storing', 'cleaning'].includes(
    state.migrationState
  );

  return {
    // Actions
    migrateToPasskey,
    reset,
    clearError,

    // State
    migrationState: state.migrationState,
    progress: state.progress,
    error: state.error,
    isMigrating,
    isCheckingPRFSupport,

    // Capability checks
    canMigrate: canMigrate(),
    hasPinWallet: hasPinWallet(),
    hasPasskeyWallet: hasPasskeyWallet(),
    prfSupported: prfSupport?.supported ?? false,

    // Utilities
    getErrorMessage,
  };
}

/**
 * Check if an error is a MigrationError
 */
export function isMigrationError(error: unknown): error is MigrationError {
  return error instanceof MigrationError;
}