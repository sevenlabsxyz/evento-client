import { PasskeyStorageService } from '@/lib/services/passkey-storage';
import { STORAGE_KEYS } from '@/lib/constants/storage-keys';

describe('PasskeyStorageService', () => {
  // Mock localStorage
  let localStorageMock: { [key: string]: string } = {};
  let mockSetItem: jest.Mock;
  let mockGetItem: jest.Mock;
  let mockRemoveItem: jest.Mock;

  beforeEach(() => {
    // Reset localStorage mock before each test
    localStorageMock = {};
    
    // Create mock functions
    mockSetItem = jest.fn((key: string, value: string) => {
      localStorageMock[key] = value;
    });
    mockGetItem = jest.fn((key: string) => {
      return localStorageMock[key] || null;
    });
    mockRemoveItem = jest.fn((key: string) => {
      delete localStorageMock[key];
    });
    
    // Mock localStorage by replacing the global object
    Object.defineProperty(global, 'localStorage', {
      value: {
        setItem: mockSetItem,
        getItem: mockGetItem,
        removeItem: mockRemoveItem,
        clear: jest.fn(() => {
          localStorageMock = {};
        }),
        get length() {
          return Object.keys(localStorageMock).length;
        },
        key: jest.fn((index: number) => {
          return Object.keys(localStorageMock)[index] || null;
        }),
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('storePasskeyWallet', () => {
    it('should store credential ID and encrypted mnemonic', () => {
      const credentialId = 'test-credential-id-123';
      const encryptedMnemonic = 'encrypted-data-here';

      PasskeyStorageService.storePasskeyWallet(credentialId, encryptedMnemonic);

      expect(localStorageMock[STORAGE_KEYS.PASSKEY_CREDENTIAL_ID]).toBe(credentialId);
      expect(localStorageMock[STORAGE_KEYS.PASSKEY_ENCRYPTED_MNEMONIC]).toBe(encryptedMnemonic);
    });

    it('should throw error when localStorage fails', () => {
      // Override the mock to throw
      mockSetItem.mockImplementationOnce(() => {
        throw new Error('Storage quota exceeded');
      });

      expect(() => {
        PasskeyStorageService.storePasskeyWallet('cred-id', 'encrypted-data');
      }).toThrow('Failed to store passkey wallet data');
    });
  });

  describe('getPasskeyWallet', () => {
    it('should return encrypted mnemonic when credential ID matches', () => {
      const credentialId = 'test-credential-id-123';
      const encryptedMnemonic = 'encrypted-data-here';
      
      localStorageMock[STORAGE_KEYS.PASSKEY_CREDENTIAL_ID] = credentialId;
      localStorageMock[STORAGE_KEYS.PASSKEY_ENCRYPTED_MNEMONIC] = encryptedMnemonic;

      const result = PasskeyStorageService.getPasskeyWallet(credentialId);

      expect(result).toBe(encryptedMnemonic);
    });

    it('should return null when credential ID does not match', () => {
      localStorageMock[STORAGE_KEYS.PASSKEY_CREDENTIAL_ID] = 'different-credential-id';
      localStorageMock[STORAGE_KEYS.PASSKEY_ENCRYPTED_MNEMONIC] = 'encrypted-data';

      const result = PasskeyStorageService.getPasskeyWallet('test-credential-id-123');

      expect(result).toBeNull();
    });

    it('should return null when no passkey wallet exists', () => {
      const result = PasskeyStorageService.getPasskeyWallet('any-credential-id');

      expect(result).toBeNull();
    });

    it('should return null when only credential ID exists (no encrypted mnemonic)', () => {
      localStorageMock[STORAGE_KEYS.PASSKEY_CREDENTIAL_ID] = 'test-credential-id';

      const result = PasskeyStorageService.getPasskeyWallet('test-credential-id');

      expect(result).toBeNull();
    });

    it('should return null when localStorage throws error', () => {
      mockGetItem.mockImplementationOnce(() => {
        throw new Error('Storage access denied');
      });

      const result = PasskeyStorageService.getPasskeyWallet('test-credential-id');

      expect(result).toBeNull();
    });
  });

  describe('hasPasskeyWallet', () => {
    it('should return true when both credential ID and encrypted mnemonic exist', () => {
      localStorageMock[STORAGE_KEYS.PASSKEY_CREDENTIAL_ID] = 'test-credential-id';
      localStorageMock[STORAGE_KEYS.PASSKEY_ENCRYPTED_MNEMONIC] = 'encrypted-data';

      const result = PasskeyStorageService.hasPasskeyWallet();

      expect(result).toBe(true);
    });

    it('should return false when credential ID is missing', () => {
      localStorageMock[STORAGE_KEYS.PASSKEY_ENCRYPTED_MNEMONIC] = 'encrypted-data';

      const result = PasskeyStorageService.hasPasskeyWallet();

      expect(result).toBe(false);
    });

    it('should return false when encrypted mnemonic is missing', () => {
      localStorageMock[STORAGE_KEYS.PASSKEY_CREDENTIAL_ID] = 'test-credential-id';

      const result = PasskeyStorageService.hasPasskeyWallet();

      expect(result).toBe(false);
    });

    it('should return false when no passkey wallet data exists', () => {
      const result = PasskeyStorageService.hasPasskeyWallet();

      expect(result).toBe(false);
    });

    it('should return false when localStorage throws error', () => {
      mockGetItem.mockImplementationOnce(() => {
        throw new Error('Storage access denied');
      });

      const result = PasskeyStorageService.hasPasskeyWallet();

      expect(result).toBe(false);
    });
  });

  describe('getCredentialId', () => {
    it('should return stored credential ID', () => {
      const credentialId = 'test-credential-id-123';
      localStorageMock[STORAGE_KEYS.PASSKEY_CREDENTIAL_ID] = credentialId;

      const result = PasskeyStorageService.getCredentialId();

      expect(result).toBe(credentialId);
    });

    it('should return null when no credential ID exists', () => {
      const result = PasskeyStorageService.getCredentialId();

      expect(result).toBeNull();
    });

    it('should return null when localStorage throws error', () => {
      mockGetItem.mockImplementationOnce(() => {
        throw new Error('Storage access denied');
      });

      const result = PasskeyStorageService.getCredentialId();

      expect(result).toBeNull();
    });
  });

  describe('clearPasskeyWallet', () => {
    it('should remove all passkey wallet data from localStorage', () => {
      localStorageMock[STORAGE_KEYS.PASSKEY_CREDENTIAL_ID] = 'test-credential-id';
      localStorageMock[STORAGE_KEYS.PASSKEY_ENCRYPTED_MNEMONIC] = 'encrypted-data';
      localStorageMock[STORAGE_KEYS.PASSKEY_WALLET_STATE] = '{}';

      PasskeyStorageService.clearPasskeyWallet();

      expect(localStorageMock[STORAGE_KEYS.PASSKEY_CREDENTIAL_ID]).toBeUndefined();
      expect(localStorageMock[STORAGE_KEYS.PASSKEY_ENCRYPTED_MNEMONIC]).toBeUndefined();
      expect(localStorageMock[STORAGE_KEYS.PASSKEY_WALLET_STATE]).toBeUndefined();
    });

    it('should handle localStorage errors gracefully', () => {
      mockRemoveItem.mockImplementationOnce(() => {
        throw new Error('Storage access denied');
      });

      // Should not throw
      expect(() => {
        PasskeyStorageService.clearPasskeyWallet();
      }).not.toThrow();
    });
  });
});
