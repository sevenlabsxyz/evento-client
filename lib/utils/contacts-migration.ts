/**
 * Migration utility to convert recent Lightning addresses to SDK contacts.
 * Runs once on first wallet connection after the contacts feature is available.
 */

import { STORAGE_KEYS } from '@/lib/constants/storage-keys';
import { breezSDK } from '@/lib/services/breez-sdk';
import { logger } from '@/lib/utils/logger';

/** localStorage key to track if migration has completed */
const MIGRATION_FLAG_KEY = 'evento_contacts_migration_complete';

/**
 * Migrates existing recent Lightning addresses from localStorage to SDK contacts.
 *
 * This function:
 * 1. Checks if migration has already been done (via localStorage flag)
 * 2. Verifies wallet is connected before proceeding
 * 3. Reads recent addresses from the persisted Zustand store
 * 4. Creates contacts for each address that doesn't already exist
 * 5. Sets migration flag on success to prevent re-running
 *
 * The migration runs in the background and does not block the UI.
 * Individual address failures are logged but don't stop the migration.
 */
export async function migrateRecentAddressesToContacts(): Promise<void> {
  // Check if already migrated
  if (typeof window !== 'undefined' && localStorage.getItem(MIGRATION_FLAG_KEY)) {
    logger.info('Contacts migration already completed, skipping');
    return;
  }

  // Check if wallet is connected
  if (!breezSDK.isConnected()) {
    logger.info('Wallet not connected, skipping contacts migration');
    return;
  }

  // Get recent addresses from localStorage
  const stored = localStorage.getItem(STORAGE_KEYS.RECENT_LIGHTNING_ADDRESSES);
  if (!stored) {
    // No addresses to migrate, mark as complete
    logger.info('No recent addresses found to migrate');
    localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
    return;
  }

  try {
    // Parse the Zustand persist format: { state: { recentAddresses: string[] }, version: 0 }
    const parsed = JSON.parse(stored);
    const addresses: string[] = parsed?.state?.recentAddresses || [];

    if (addresses.length === 0) {
      logger.info('Recent addresses array is empty, marking migration complete');
      localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
      return;
    }

    logger.info('Starting contacts migration', { addressCount: addresses.length });

    // Get existing contacts to avoid duplicates
    const existingContacts = await breezSDK.listContacts();
    const existingAddresses = new Set(existingContacts.map((c) => c.paymentIdentifier));

    let migratedCount = 0;
    let failedCount = 0;

    // Migrate each address
    for (const address of addresses) {
      if (!address) continue;

      if (existingAddresses.has(address)) {
        logger.debug('Contact already exists, skipping', { address });
        continue;
      }

      try {
        // Extract name from Lightning address (user@domain -> 'user')
        const name = address.split('@')[0] || address;
        await breezSDK.addContact({ name, paymentIdentifier: address });
        migratedCount++;
        logger.debug('Migrated address to contact', { address, name });
      } catch (error) {
        failedCount++;
        logger.error('Failed to migrate address to contact', {
          address,
          error: error instanceof Error ? error.message : String(error),
        });
        // Continue with other addresses - don't fail the whole migration
      }
    }

    // Mark migration as complete
    localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
    logger.info('Contacts migration completed', {
      total: addresses.length,
      migrated: migratedCount,
      failed: failedCount,
      skipped: addresses.length - migratedCount - failedCount,
    });
  } catch (error) {
    logger.error('Contacts migration failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    // Don't set flag - will retry next time wallet connects
  }
}

/**
 * Check if the contacts migration has been completed.
 * Useful for debugging or conditional UI display.
 */
export function isContactsMigrationComplete(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(MIGRATION_FLAG_KEY) === 'true';
}

/**
 * Reset the migration flag (for testing purposes).
 * This will allow the migration to run again on next wallet connect.
 */
export function resetContactsMigration(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(MIGRATION_FLAG_KEY);
}
