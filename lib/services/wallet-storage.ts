import { STORAGE_KEYS } from '@/lib/constants/storage-keys';
import { BackupOptions, WalletState } from '@/lib/types/wallet';
import { logger } from '@/lib/utils/logger';
import * as bip39 from 'bip39';

/**
 * PBKDF2-SHA256 iterations used by the legacy (v1) envelope. Old blobs (no
 * `v2|` prefix) are still decrypted with these so existing wallets and
 * backups keep working; a v1 blob is only ever re-encrypted (as v2) after a
 * successful unlock.
 */
const LEGACY_PBKDF2_ITERATIONS = 200000;

/**
 * Upper bound for the iterations field of a parsed v2 envelope. The field is
 * untrusted input (e.g. a pasted "backup" in the restore flow), so a tampered
 * huge value must be rejected instead of freezing the tab in PBKDF2.
 */
const MAX_ENVELOPE_ITERATIONS = 10_000_000;

/**
 * PBKDF2-SHA256 iterations used for all new (v2) encryptions. Short PINs at
 * 200k iterations were cheap to brute-force offline from an exfiltrated
 * encrypted-seed backup; 1M iterations restores a comfortable margin
 * (AuditWallet F1).
 */
const PBKDF2_ITERATIONS = 1000000;

/** Version prefix of the current envelope: `v2|<iterations>|<base64 payload>`. */
const ENVELOPE_V2_PREFIX = 'v2';

interface ParsedEnvelope {
  version: 1 | 2;
  iterations: number;
  /** base64(salt(16) + iv(12) + AES-GCM ciphertext incl. 16-byte tag) */
  payload: string;
}

export class WalletStorageService {
  /**
   * Derive encryption key from password using PBKDF2
   */
  private static async deriveKey(
    password: string,
    salt: Uint8Array,
    iterations: number
  ): Promise<CryptoKey> {
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
        salt,
        iterations,
        hash: 'SHA-256',
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Parse an encrypted seed into its versioned envelope.
   *
   * - v2 (current): `v2|<iterations>|<base64(salt+iv+ct+tag)>`
   * - v1 (legacy):  bare `base64(salt+iv+ct+tag)` encrypted with 200000
   *   PBKDF2 iterations. Never written anymore, but still decrypted so all
   *   existing wallets and backups keep working.
   */
  private static parseEnvelope(encryptedSeed: string): ParsedEnvelope {
    const trimmed = encryptedSeed.trim();

    if (trimmed.startsWith(`${ENVELOPE_V2_PREFIX}|`)) {
      const match = /^v2\|(\d+)\|(.+)$/.exec(trimmed);
      if (!match) {
        throw new Error('Corrupted v2 encrypted seed');
      }
      const iterations = Number.parseInt(match[1], 10);
      if (iterations <= 0 || iterations > MAX_ENVELOPE_ITERATIONS) {
        throw new Error('Corrupted v2 encrypted seed');
      }
      return { version: 2, iterations, payload: match[2] };
    }

    return { version: 1, iterations: LEGACY_PBKDF2_ITERATIONS, payload: trimmed };
  }

  /**
   * Encrypt seed phrase with password (returns versioned v2 envelope string)
   */
  static async encryptSeed(mnemonic: string, password: string): Promise<string> {
    try {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const key = await this.deriveKey(password, salt, PBKDF2_ITERATIONS);

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

      const base64 = btoa(String.fromCharCode(...combined));

      // Return as versioned envelope (looks harmless)
      return `${ENVELOPE_V2_PREFIX}|${PBKDF2_ITERATIONS}|${base64}`;
    } catch (error) {
      logger.error('Failed to encrypt seed', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error('Failed to encrypt seed phrase');
    }
  }

  /**
   * Decrypt seed phrase with password (supports v2 and legacy v1 formats)
   */
  static async decryptSeed(encryptedSeed: string, password: string): Promise<string> {
    try {
      // Parse versioned envelope (v2) or fall back to legacy v1 base64
      const envelope = this.parseEnvelope(encryptedSeed);

      // Decode base64 payload
      const combined = Uint8Array.from(atob(envelope.payload), (c) => c.charCodeAt(0));

      // Extract salt (16 bytes), iv (12 bytes), and ciphertext
      const salt = combined.slice(0, 16);
      const iv = combined.slice(16, 28);
      const data = combined.slice(28);

      const key = await this.deriveKey(password, salt, envelope.iterations);

      // Decrypt
      const decryptedData = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);

      return new TextDecoder().decode(decryptedData);
    } catch (error) {
      logger.error('Failed to decrypt seed', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error('Invalid password or corrupted backup');
    }
  }

  /**
   * Whether an encrypted seed still uses the legacy v1 format (200k PBKDF2
   * iterations) and should be re-encrypted as v2. Always false for malformed
   * values; decryption surfaces the actual error.
   */
  static needsReencrypt(encryptedSeed: string): boolean {
    try {
      return this.parseEnvelope(encryptedSeed).version === 1;
    } catch {
      return false;
    }
  }

  /**
   * Re-encrypt an encrypted seed with the same password, upgrading it to the
   * current v2 envelope (1M PBKDF2 iterations). Throws if the password is
   * wrong; the original value is only replaced by the caller on success.
   */
  static async reencryptWithSamePin(encryptedSeed: string, password: string): Promise<string> {
    const mnemonic = await this.decryptSeed(encryptedSeed, password);
    return this.encryptSeed(mnemonic, password);
  }

  /**
   * Save encrypted seed to local storage
   */
  static saveEncryptedSeed(encryptedSeed: string): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ENCRYPTED_SEED, encryptedSeed);
    } catch (error) {
      logger.error('Failed to save encrypted seed', {
        error: error instanceof Error ? error.message : String(error),
      });
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
      logger.error('Failed to get encrypted seed', {
        error: error instanceof Error ? error.message : String(error),
      });
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
      logger.error('Failed to save wallet state', {
        error: error instanceof Error ? error.message : String(error),
      });
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
      logger.error('Failed to get wallet state', {
        error: error instanceof Error ? error.message : String(error),
      });
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
      logger.error('Failed to save backup info', {
        error: error instanceof Error ? error.message : String(error),
      });
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
      logger.error('Failed to get backup info', {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Check if backup was dismissed today
   */
  static isDismissedToday(): boolean {
    try {
      const dismissedDate = localStorage.getItem(STORAGE_KEYS.BACKUP_DISMISSED_DATE);
      if (!dismissedDate) return false;

      const today = new Date().toDateString();
      const dismissed = new Date(dismissedDate).toDateString();
      return today === dismissed;
    } catch (error) {
      logger.error('Failed to check dismissed date', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Dismiss backup reminder for today
   */
  static dismissBackupForToday(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.BACKUP_DISMISSED_DATE, new Date().toISOString());
    } catch (error) {
      logger.error('Failed to dismiss backup', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Check if should show backup reminder
   * Shows if: not backed up AND not dismissed today
   */
  static shouldShowBackupReminder(): boolean {
    try {
      // Check if dismissed today
      if (this.isDismissedToday()) {
        return false;
      }

      // Always show if not dismissed (we'll check hasBackup in the component)
      return true;
    } catch (error) {
      logger.error('Failed to check backup reminder', {
        error: error instanceof Error ? error.message : String(error),
      });
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
      logger.error('Failed to update backup reminder timestamp', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Mark that wallet has had a transaction
   */
  static markHasTransaction(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.HAS_TRANSACTION, 'true');
    } catch (error) {
      logger.error('Failed to mark transaction', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Clear transaction flag (called after backup is completed)
   */
  static clearTransactionFlag(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.HAS_TRANSACTION);
    } catch (error) {
      logger.error('Failed to clear transaction flag', {
        error: error instanceof Error ? error.message : String(error),
      });
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
      logger.error('Failed to clear wallet data', {
        error: error instanceof Error ? error.message : String(error),
      });
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
