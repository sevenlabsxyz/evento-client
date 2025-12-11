/**
 * Utility functions for managing application storage
 * Centralizes all storage key definitions and clearing logic
 */

/**
 * All localStorage keys used by the application
 */
export const STORAGE_KEYS = {
  // Auth related
  AUTH: 'evento-auth-storage',
  BETA_ACCESS: 'evento-beta-access',
  SUPABASE_ACCESS_TOKEN: 'supabase_access_token',
  SUPABASE_REFRESH_TOKEN: 'supabase_refresh_token',

  // Wallet related
  WALLET_STATE: 'evento_wallet_state',
  ENCRYPTED_SEED: 'evento_encrypted_seed',
  BACKUP_INFO: 'evento_backup_info',
  LAST_BACKUP_REMINDER: 'evento_last_backup_reminder',
  HAS_TRANSACTION: 'evento_has_transaction',
  BACKUP_DISMISSED_DATE: 'evento_backup_dismissed_date',
  WALLET_PREFERENCES: 'wallet-preferences',

  // User preferences
  VIEW_MODE: 'evento-view-mode',
  RECENT_SEARCHES: 'evento-recent-searches',
  RECENT_LIGHTNING_ADDRESSES: 'evento-recent-lightning-addresses',

  // Supabase keys (these are managed by Supabase SDK)
  // They follow the pattern: sb-<project-ref>-auth-token
  // We'll clear them using a pattern match
} as const;

/**
 * Clear all application storage
 * This should be called on logout to ensure complete cleanup
 */
export function clearAllStorage(): void {
  try {
    // Clear all known application keys
    Object.values(STORAGE_KEYS).forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error(`Failed to remove ${key}:`, error);
      }
    });

    // Clear Supabase auth tokens
    // Supabase stores tokens with keys like: sb-<project-ref>-auth-token
    const supabaseKeyPattern = /^sb-.*-auth-token/;
    const keysToRemove: string[] = [];

    // Collect all Supabase keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && supabaseKeyPattern.test(key)) {
        keysToRemove.push(key);
      }
    }

    // Remove Supabase keys
    keysToRemove.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error(`Failed to remove Supabase key ${key}:`, error);
      }
    });

    console.log('All application storage cleared successfully');
  } catch (error) {
    console.error('Failed to clear all storage:', error);
    throw error;
  }
}

/**
 * Clear only auth-related storage
 * Useful for partial logout scenarios
 */
export function clearAuthStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.AUTH);
    localStorage.removeItem(STORAGE_KEYS.BETA_ACCESS);

    // Clear Supabase auth tokens
    const supabaseKeyPattern = /^sb-.*-auth-token/;
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && supabaseKeyPattern.test(key)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error(`Failed to remove Supabase key ${key}:`, error);
      }
    });

    console.log('Auth storage cleared successfully');
  } catch (error) {
    console.error('Failed to clear auth storage:', error);
    throw error;
  }
}

/**
 * Clear only wallet-related storage
 * Useful for wallet reset scenarios
 */
export function clearWalletStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.WALLET_STATE);
    localStorage.removeItem(STORAGE_KEYS.ENCRYPTED_SEED);
    localStorage.removeItem(STORAGE_KEYS.BACKUP_INFO);
    localStorage.removeItem(STORAGE_KEYS.LAST_BACKUP_REMINDER);
    localStorage.removeItem(STORAGE_KEYS.HAS_TRANSACTION);
    localStorage.removeItem(STORAGE_KEYS.BACKUP_DISMISSED_DATE);
    localStorage.removeItem(STORAGE_KEYS.WALLET_PREFERENCES);

    console.log('Wallet storage cleared successfully');
  } catch (error) {
    console.error('Failed to clear wallet storage:', error);
    throw error;
  }
}
