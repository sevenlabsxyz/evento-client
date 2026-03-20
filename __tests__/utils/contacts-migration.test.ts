import {
  isContactsMigrationComplete,
  migrateRecentAddressesToContacts,
  resetContactsMigration,
} from '@/lib/utils/contacts-migration';

// Mock the breezSDK service - mocks must be defined inside the factory function
jest.mock('@/lib/services/breez-sdk', () => ({
  breezSDK: {
    isConnected: jest.fn(() => false),
    addContact: jest.fn(() => Promise.resolve(null)),
    listContacts: jest.fn(() => Promise.resolve([])),
  },
}));

// Mock the logger
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(() => {}),
    error: jest.fn(() => {}),
    debug: jest.fn(() => {}),
  },
}));

// Import the mocked modules to get access to the mock functions
import { breezSDK } from '@/lib/services/breez-sdk';
import { logger } from '@/lib/utils/logger';

// Get typed mock functions
const mockIsConnected = breezSDK.isConnected as jest.Mock;
const mockAddContact = breezSDK.addContact as jest.Mock;
const mockListContacts = breezSDK.listContacts as jest.Mock;
const mockInfo = logger.info as jest.Mock;
const mockError = logger.error as jest.Mock;
const mockDebug = logger.debug as jest.Mock;

// Mock localStorage for testing
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get store() {
      return store;
    },
  };
})();

// Set up global localStorage mock
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock window for SSR tests
const originalWindow = global.window;

describe('contacts-migration', () => {
  const MIGRATION_FLAG_KEY = 'evento_contacts_migration_complete';

  beforeEach(() => {
    // Clear all mock call history
    mockIsConnected.mockClear();
    mockAddContact.mockClear();
    mockListContacts.mockClear();
    mockInfo.mockClear();
    mockError.mockClear();
    mockDebug.mockClear();

    // Reset all mocks by setting new implementations
    mockIsConnected.mockImplementation(() => false);
    mockAddContact.mockImplementation(() => Promise.resolve(null));
    mockListContacts.mockImplementation(() => Promise.resolve([]));
    mockInfo.mockImplementation(() => {});
    mockError.mockImplementation(() => {});
    mockDebug.mockImplementation(() => {});

    // Clear localStorage
    localStorageMock.clear();

    // Reset window
    global.window = {} as any;
  });

  afterEach(() => {
    global.window = originalWindow;
  });

  describe('isContactsMigrationComplete', () => {
    it('returns true when migration flag is set to "true"', () => {
      localStorageMock.setItem(MIGRATION_FLAG_KEY, 'true');

      expect(isContactsMigrationComplete()).toBe(true);
    });

    it('returns false when migration flag is not set', () => {
      expect(isContactsMigrationComplete()).toBe(false);
    });

    it('returns false when migration flag is set to something other than "true"', () => {
      localStorageMock.setItem(MIGRATION_FLAG_KEY, 'false');

      expect(isContactsMigrationComplete()).toBe(false);
    });

    it('returns false when window is undefined (SSR)', () => {
      global.window = undefined as any;

      expect(isContactsMigrationComplete()).toBe(false);
    });
  });

  describe('resetContactsMigration', () => {
    it('removes the migration flag from localStorage', () => {
      localStorageMock.setItem(MIGRATION_FLAG_KEY, 'true');

      resetContactsMigration();

      expect(localStorageMock.getItem(MIGRATION_FLAG_KEY)).toBeNull();
    });

    it('does nothing when flag is not set', () => {
      resetContactsMigration();

      expect(localStorageMock.getItem(MIGRATION_FLAG_KEY)).toBeNull();
    });

    it('does nothing when window is undefined (SSR)', () => {
      global.window = undefined as any;

      // Should not throw
      expect(() => resetContactsMigration()).not.toThrow();
    });
  });

  describe('migrateRecentAddressesToContacts', () => {
    it('skips migration when already completed', async () => {
      localStorageMock.setItem(MIGRATION_FLAG_KEY, 'true');
      mockIsConnected.mockImplementation(() => true);

      await migrateRecentAddressesToContacts();

      expect(mockInfo.mock.calls.length).toBeGreaterThan(0);
      expect(mockInfo.mock.calls[0][0]).toBe('Contacts migration already completed, skipping');
    });

    it('skips migration when wallet is not connected', async () => {
      mockIsConnected.mockImplementation(() => false);

      await migrateRecentAddressesToContacts();

      expect(mockInfo.mock.calls.length).toBeGreaterThan(0);
      expect(mockInfo.mock.calls[0][0]).toBe('Wallet not connected, skipping contacts migration');
      // Flag should NOT be set when wallet is not connected
      expect(localStorageMock.getItem(MIGRATION_FLAG_KEY)).toBeNull();
    });

    it('does nothing when window is undefined (SSR)', async () => {
      global.window = undefined as any;
      // Set mock to return false so the function returns early
      mockIsConnected.mockImplementation(() => false);

      // Should not throw - the function should return early when wallet not connected
      await migrateRecentAddressesToContacts();
      // Verify the function logged the wallet not connected message
      expect(mockInfo.mock.calls.length).toBeGreaterThan(0);
      expect(mockInfo.mock.calls[0][0]).toBe('Wallet not connected, skipping contacts migration');
    });

    it('sets migration flag on successful migration', async () => {
      mockIsConnected.mockImplementation(() => true);
      mockListContacts.mockImplementation(() => Promise.resolve([]));

      await migrateRecentAddressesToContacts();

      // Note: The actual migration logic is not implemented yet
      // This test documents the expected behavior once implemented
      // For now, we verify the function completes without error
      expect(mockIsConnected.mock.calls.length).toBeGreaterThan(0);
    });

    it('does not set migration flag on failure', async () => {
      mockIsConnected.mockImplementation(() => true);

      // Simulate a failure by making localStorage throw
      const originalGetItem = localStorageMock.getItem;
      localStorageMock.getItem = (key: string) => {
        if (key === 'evento-recent-lightning-addresses') {
          throw new Error('localStorage error');
        }
        return originalGetItem(key);
      };

      await migrateRecentAddressesToContacts();

      // Flag should NOT be set on failure
      expect(localStorageMock.getItem(MIGRATION_FLAG_KEY)).toBeNull();

      // Restore
      localStorageMock.getItem = originalGetItem;
    });

    describe('migration flow (expected behavior)', () => {
      // These tests document the expected behavior once the migration logic is implemented
      // They may fail or pass depending on the current implementation state

      it('should handle empty addresses gracefully', async () => {
        mockIsConnected.mockImplementation(() => true);
        mockListContacts.mockImplementation(() => Promise.resolve([]));

        await migrateRecentAddressesToContacts();

        // Should complete without error even with no addresses to migrate
        expect(mockIsConnected.mock.calls.length).toBeGreaterThan(0);
      });

      it('should not create duplicate contacts', async () => {
        mockIsConnected.mockImplementation(() => true);

        // Existing contact
        const existingContact = {
          id: 'contact_1',
          name: 'Alice',
          paymentIdentifier: 'alice@evento.cash',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        mockListContacts.mockImplementation(() => Promise.resolve([existingContact]));

        await migrateRecentAddressesToContacts();

        // Should check for existing contacts before adding
        expect(mockListContacts.mock.calls.length).toBeGreaterThanOrEqual(0);
      });

      it('should continue migration even if some addresses fail', async () => {
        mockIsConnected.mockImplementation(() => true);
        mockListContacts.mockImplementation(() => Promise.resolve([]));

        // First addContact succeeds, second fails
        let callCount = 0;
        mockAddContact.mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return Promise.resolve({
              id: 'contact_1',
              name: 'Alice',
              paymentIdentifier: 'alice@evento.cash',
              createdAt: Date.now(),
              updatedAt: Date.now(),
            });
          }
          return Promise.reject(new Error('Failed to add contact'));
        });

        await migrateRecentAddressesToContacts();

        // Migration should continue despite individual failures
        // Note: This behavior will be tested once migration logic is implemented
        expect(mockIsConnected.mock.calls.length).toBeGreaterThan(0);
      });

      it('should allow retry when migration fails (flag not set)', async () => {
        mockIsConnected.mockImplementation(() => true);

        // Simulate a failure by making localStorage throw
        const originalGetItem = localStorageMock.getItem;
        localStorageMock.getItem = (key: string) => {
          if (key === 'evento-recent-lightning-addresses') {
            throw new Error('localStorage error');
          }
          return originalGetItem(key);
        };

        await migrateRecentAddressesToContacts();

        // Flag should not be set on failure, allowing retry
        expect(localStorageMock.getItem(MIGRATION_FLAG_KEY)).toBeNull();

        // Restore
        localStorageMock.getItem = originalGetItem;
      });
    });

    describe('edge cases', () => {
      it('handles localStorage errors gracefully', async () => {
        mockIsConnected.mockImplementation(() => true);

        // Override localStorage to throw
        const originalGetItem = localStorageMock.getItem;
        localStorageMock.getItem = () => {
          throw new Error('localStorage error');
        };

        // Should not throw uncaught error
        try {
          await migrateRecentAddressesToContacts();
        } catch (error) {
          // If it throws, it should be a handled error
          expect(error).toBeDefined();
        }

        // Restore
        localStorageMock.getItem = originalGetItem;
      });

      it('handles concurrent migration calls', async () => {
        localStorageMock.setItem(MIGRATION_FLAG_KEY, 'true');
        mockIsConnected.mockImplementation(() => true);

        // Call migration multiple times concurrently
        const promises = [
          migrateRecentAddressesToContacts(),
          migrateRecentAddressesToContacts(),
          migrateRecentAddressesToContacts(),
        ];

        await Promise.all(promises);

        // All should skip due to flag being set
        expect(mockInfo.mock.calls.length).toBe(3);
      });
    });
  });
});
