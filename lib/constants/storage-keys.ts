/**
 * Central registry of all localStorage keys used in the application.
 * DO NOT change key values - only add new keys here.
 */
export const STORAGE_KEYS = {
  // Auth & Session
  AUTH_STORAGE: 'evento-auth-storage',
  SUPABASE_ACCESS_TOKEN: 'supabase_access_token',
  SUPABASE_REFRESH_TOKEN: 'supabase_refresh_token',

  // Wallet (self-custodial - SENSITIVE)
  WALLET_STATE: 'evento_wallet_state',
  ENCRYPTED_SEED: 'evento_encrypted_seed',
  BACKUP_INFO: 'evento_backup_info',
  LAST_BACKUP_REMINDER: 'evento_last_backup_reminder',
  HAS_TRANSACTION: 'evento_has_transaction',
  BACKUP_DISMISSED_DATE: 'evento_backup_dismissed_date',
  WALLET_PREFERENCES: 'wallet-preferences', // Zustand persist
  WALLET_UNLOCK_RETURN_PATH: 'evento_wallet_unlock_return_path',

  // User Preferences
  VIEW_MODE: 'evento-view-mode', // Zustand persist
  RECENT_SEARCHES: 'evento-recent-searches', // Zustand persist
  RECENT_LIGHTNING_ADDRESSES: 'evento-recent-lightning-addresses', // Zustand persist
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

// Keys that should be preserved across logout
export const PRESERVED_KEYS: readonly StorageKey[] = [];

// Keys that indicate wallet usage (for logout warning)
export const WALLET_INDICATOR_KEYS: readonly StorageKey[] = [
  STORAGE_KEYS.ENCRYPTED_SEED,
  STORAGE_KEYS.WALLET_STATE,
];
