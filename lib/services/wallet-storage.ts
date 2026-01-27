import { BackupOptions, WalletState } from '@/lib/types/wallet';
import * as bip39 from 'bip39';

const STORAGE_KEYS = {
  WALLET_STATE: 'evento_wallet_state',
  ENCRYPTED_SEED: 'evento_encrypted_seed',
  BACKUP_INFO: 'evento_backup_info',
  LAST_BACKUP_REMINDER: 'evento_last_backup_reminder',
  HAS_TRANSACTION: 'evento_has_transaction',
} as const;

export class WalletStorageService {
  /**
   * Derive encryption key from password using PBKDF2
   */
  private static async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const baseKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: Buffer.from(salt),
        iterations: 200000,
        hash: 'SHA-256',
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt seed phrase with password (returns base64 string)
   */
  static async encryptSeed(mnemonic: string, password: string): Promise<string> {
    try {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const key = await this.deriveKey(password, salt);

      const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        new TextEncoder().encode(mnemonic)
      );

      // Combine salt + iv + ciphertext into single buffer
      const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
      combined.set(salt, 0);
      combined.set(iv, salt.length);
      combined.set(new Uint8Array(ciphertext), salt.length + iv.length);

      // Return as base64 string (looks harmless)
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Failed to encrypt seed:', error);
      throw new Error('Failed to encrypt seed phrase');
    }
  }

  /**
   * Decrypt seed phrase with password (supports base64 format)
   */
  static async decryptSeed(encryptedSeed: string, password: string): Promise<string> {
    try {
      // Decode base64 string
      const combined = Uint8Array.from(atob(encryptedSeed), (c) => c.charCodeAt(0));

      // Extract salt (16 bytes), iv (12 bytes), and ciphertext
      const salt = combined.slice(0, 16);
      const iv = combined.slice(16, 28);
      const data = combined.slice(28);

      const key = await this.deriveKey(password, salt);

      // Decrypt
      const decryptedData = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);

      return new TextDecoder().decode(decryptedData);
    } catch (error) {
      console.error('Failed to decrypt seed:', error);
      throw new Error('Invalid password or corrupted backup');
    }
  }

  /**
   * Save encrypted seed to local storage
   */
  static saveEncryptedSeed(encryptedSeed: string): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ENCRYPTED_SEED, encryptedSeed);
    } catch (error) {
      console.error('Failed to save encrypted seed:', error);
      throw new Error('Failed to save wallet data');
    }
  }

  /**
   * Get encrypted seed from local storage
   */
  static getEncryptedSeed(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.ENCRYPTED_SEED);
    } catch (error) {
      console.error('Failed to get encrypted seed:', error);
      return null;
    }
  }

  /**
   * Save wallet state
   */
  static saveWalletState(state: WalletState): void {
    try {
      localStorage.setItem(STORAGE_KEYS.WALLET_STATE, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save wallet state:', error);
    }
  }

  /**
   * Get wallet state
   */
  static getWalletState(): WalletState | null {
    try {
      const state = localStorage.getItem(STORAGE_KEYS.WALLET_STATE);
      if (!state) return null;

      const parsed = JSON.parse(state);

      // Convert lastBackupDate string back to Date object
      if (parsed.lastBackupDate) {
        parsed.lastBackupDate = new Date(parsed.lastBackupDate);
      }

      return parsed;
    } catch (error) {
      console.error('Failed to get wallet state:', error);
      return null;
    }
  }

  /**
   * Save backup information
   */
  static saveBackupInfo(backup: BackupOptions): void {
    try {
      localStorage.setItem(STORAGE_KEYS.BACKUP_INFO, JSON.stringify(backup));
    } catch (error) {
      console.error('Failed to save backup info:', error);
    }
  }

  /**
   * Get backup information
   */
  static getBackupInfo(): BackupOptions | null {
    try {
      const backup = localStorage.getItem(STORAGE_KEYS.BACKUP_INFO);
      return backup ? JSON.parse(backup) : null;
    } catch (error) {
      console.error('Failed to get backup info:', error);
      return null;
    }
  }

  /**
   * Check if should show backup reminder
   * Shows after 7 days OR after first transaction
   */
  static shouldShowBackupReminder(): boolean {
    try {
      const lastReminder = localStorage.getItem(STORAGE_KEYS.LAST_BACKUP_REMINDER);
      const hasTransaction = localStorage.getItem(STORAGE_KEYS.HAS_TRANSACTION) === 'true';

      // If wallet has had a transaction, show reminder immediately
      if (hasTransaction) {
        return true;
      }

      // Otherwise, check if 7 days have passed
      if (!lastReminder) return false; // Don't show immediately for new wallets

      const lastReminderDate = new Date(lastReminder);
      const daysSinceReminder = (Date.now() - lastReminderDate.getTime()) / (1000 * 60 * 60 * 24);

      // Show reminder after 7 days
      return daysSinceReminder >= 7;
    } catch (error) {
      console.error('Failed to check backup reminder:', error);
      return false;
    }
  }

  /**
   * Update last backup reminder timestamp
   */
  static updateBackupReminderTimestamp(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_BACKUP_REMINDER, new Date().toISOString());
    } catch (error) {
      console.error('Failed to update backup reminder timestamp:', error);
    }
  }

  /**
   * Mark that wallet has had a transaction
   */
  static markHasTransaction(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.HAS_TRANSACTION, 'true');
    } catch (error) {
      console.error('Failed to mark transaction:', error);
    }
  }

  /**
   * Clear transaction flag (called after backup is completed)
   */
  static clearTransactionFlag(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.HAS_TRANSACTION);
    } catch (error) {
      console.error('Failed to clear transaction flag:', error);
    }
  }

  /**
   * Clear all wallet data
   */
  static clearWalletData(): void {
    try {
      Object.values(STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Failed to clear wallet data:', error);
    }
  }

  /**
   * Generate new mnemonic (12 words) using BIP39
   */
  static generateMnemonic(): string {
    // Generate a 128-bit (12 word) mnemonic
    return bip39.generateMnemonic(128);
  }

  /**
   * Validate mnemonic phrase
   */
  static validateMnemonic(mnemonic: string): boolean {
    return bip39.validateMnemonic(mnemonic);
  }
}
