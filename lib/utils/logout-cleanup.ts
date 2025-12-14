import { PRESERVED_KEYS, STORAGE_KEYS, WALLET_INDICATOR_KEYS } from '@/lib/constants/storage-keys';

/**
 * Check if user has wallet data (for logout warning display)
 * Simply checks if wallet indicator keys exist in localStorage
 */
export function hasWalletData(): boolean {
  if (typeof window === 'undefined') return false;
  return WALLET_INDICATOR_KEYS.some((key) => localStorage.getItem(key) !== null);
}

/**
 * Clear all app storage except preserved keys (like beta access)
 */
export function clearAllAppStorage(): void {
  if (typeof window === 'undefined') return;

  // Clear specific keys (except preserved)
  Object.values(STORAGE_KEYS).forEach((key) => {
    if (!PRESERVED_KEYS.includes(key)) {
      localStorage.removeItem(key);
    }
  });
}
