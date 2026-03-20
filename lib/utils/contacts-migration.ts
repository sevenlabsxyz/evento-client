/**
 * Migration utility to convert recent Lightning addresses to SDK contacts.
 * Runs once on first wallet connection after the contacts feature is available.
 */

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

  // Migration logic
  try {
    // Read from old localStorage key (Zustand persist format)
    const stored = localStorage.getItem('evento-recent-lightning-addresses');
    if (!stored) {
      logger.info('No recent addresses to migrate');
      localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
      return;
    }

    const data = JSON.parse(stored);
    // The old Zustand store used 'recentAddresses' as the property name
    const addresses = data?.state?.recentAddresses as string[] | undefined;

    if (!addresses || addresses.length === 0) {
      logger.info('No recent addresses to migrate');
      localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
      return;
    }

    // Get existing contacts to avoid duplicates
    let existingContacts: { paymentIdentifier: string }[] = [];
    try {
      existingContacts = await breezSDK.listContacts();
    } catch (error) {
      logger.error('Failed to list existing contacts:', error);
      // Continue with migration anyway
    }

    const existingAddresses = new Set(
      existingContacts.map((c) => c.paymentIdentifier.toLowerCase())
    );

    // Track migration results
    const failedAddresses: string[] = [];

    // Migrate each address
    for (const address of addresses) {
      try {
        // Skip if contact already exists
        if (existingAddresses.has(address.toLowerCase())) {
          logger.info(`Contact already exists, skipping: ${address}`);
          continue;
        }

        // Extract username from Lightning address (user@domain -> "user")
        const username = address.split('@')[0] || address;
        await breezSDK.addContact({ name: username, paymentIdentifier: address });
        logger.info(`Migrated contact: ${address}`);
      } catch (error) {
        logger.error(`Failed to migrate ${address}:`, error);
        failedAddresses.push(address);
      }
    }

    // Only set migration flag if all succeeded
    if (failedAddresses.length === 0) {
      localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
      logger.info('Contacts migration completed successfully');
    } else {
      logger.warn(`Contacts migration completed with ${failedAddresses.length} failures`, {
        failedAddresses,
      });
      logger.info('Migration will retry on next wallet connection');
    }
  } catch (error) {
    logger.error('Contacts migration failed:', error);
    // Don't set flag - allow retry
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
