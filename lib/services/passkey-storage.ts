import { STORAGE_KEYS } from '@/lib/constants/storage-keys';
import { logger } from '@/lib/utils/logger';

/**
 * Service for storing and retrieving passkey wallet data.
 * 
 * IMPORTANT SECURITY NOTES:
 * - Stores ONLY encrypted mnemonics (encrypted by PRF output, never the raw PRF)
 * - Does NOT store PRF outputs or unencrypted mnemonics
 * - Uses localStorage for persistence (same pattern as existing wallet)
 * - Credential ID is stored to identify which passkey owns the wallet
 */
export class PasskeyStorageService {
  /**
   * Store passkey wallet data
   * @param credentialId - The WebAuthn credential ID that owns this wallet
   * @param encryptedMnemonic - The mnemonic encrypted with PRF output
   */
  static storePasskeyWallet(credentialId: string, encryptedMnemonic: string): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PASSKEY_CREDENTIAL_ID, credentialId);
      localStorage.setItem(STORAGE_KEYS.PASSKEY_ENCRYPTED_MNEMONIC, encryptedMnemonic);
      logger.info('Passkey wallet stored successfully', { credentialId: credentialId.slice(0, 8) + '...' });
    } catch (error) {
      logger.error('Failed to store passkey wallet', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error('Failed to store passkey wallet data');
    }
  }

  /**
   * Get the encrypted mnemonic for a specific credential ID
   * @param credentialId - The WebAuthn credential ID to look up
   * @returns The encrypted mnemonic, or null if not found or credential ID mismatch
   */
  static getPasskeyWallet(credentialId: string): string | null {
    try {
      const storedCredentialId = localStorage.getItem(STORAGE_KEYS.PASSKEY_CREDENTIAL_ID);
      const encryptedMnemonic = localStorage.getItem(STORAGE_KEYS.PASSKEY_ENCRYPTED_MNEMONIC);

      if (!storedCredentialId || !encryptedMnemonic) {
        return null;
      }

      // Verify the credential ID matches (security check)
      if (storedCredentialId !== credentialId) {
        logger.warn('Credential ID mismatch when retrieving passkey wallet', {
          expected: credentialId.slice(0, 8) + '...',
          stored: storedCredentialId.slice(0, 8) + '...',
        });
        return null;
      }

      return encryptedMnemonic;
    } catch (error) {
      logger.error('Failed to get passkey wallet', {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Check if a passkey wallet exists
   * @returns true if both credential ID and encrypted mnemonic are stored
   */
  static hasPasskeyWallet(): boolean {
    try {
      const credentialId = localStorage.getItem(STORAGE_KEYS.PASSKEY_CREDENTIAL_ID);
      const encryptedMnemonic = localStorage.getItem(STORAGE_KEYS.PASSKEY_ENCRYPTED_MNEMONIC);
      return !!credentialId && !!encryptedMnemonic;
    } catch (error) {
      logger.error('Failed to check passkey wallet existence', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Get the stored credential ID (for wallet identification)
   * @returns The credential ID, or null if no passkey wallet exists
   */
  static getCredentialId(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.PASSKEY_CREDENTIAL_ID);
    } catch (error) {
      logger.error('Failed to get credential ID', {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Clear all passkey wallet data
   * Use with caution - this will permanently remove access to the wallet
   * unless the user has a backup
   */
  static clearPasskeyWallet(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.PASSKEY_CREDENTIAL_ID);
      localStorage.removeItem(STORAGE_KEYS.PASSKEY_ENCRYPTED_MNEMONIC);
      localStorage.removeItem(STORAGE_KEYS.PASSKEY_WALLET_STATE);
      logger.info('Passkey wallet data cleared');
    } catch (error) {
      logger.error('Failed to clear passkey wallet', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
