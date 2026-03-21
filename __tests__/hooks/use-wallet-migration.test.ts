import {
  useWalletMigration,
  isMigrationError,
  MigrationError,
  type MigrationErrorCode,
  type MigrationResult,
  type MigrationState,
} from '@/lib/hooks/use-wallet-migration';
import { usePasskey } from '@/lib/hooks/use-passkey';
import { PasskeyStorageService } from '@/lib/services/passkey-storage';
import { WalletStorageService } from '@/lib/services/wallet-storage';
import { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createTestWrapper } from '../setup/test-utils';

// Mock the passkey hook
jest.mock('@/lib/hooks/use-passkey', () => ({
  usePasskey: jest.fn(),
}));

// Mock the storage services
jest.mock('@/lib/services/passkey-storage', () => ({
  PasskeyStorageService: {
    storePasskeyWallet: jest.fn(),
    getPasskeyWallet: jest.fn(),
    hasPasskeyWallet: jest.fn(),
    getCredentialId: jest.fn(),
    clearPasskeyWallet: jest.fn(),
  },
}));

jest.mock('@/lib/services/wallet-storage', () => ({
  WalletStorageService: {
    getEncryptedSeed: jest.fn(),
    decryptSeed: jest.fn(),
    encryptSeed: jest.fn(),
    saveEncryptedSeed: jest.fn(),
    clearWalletData: jest.fn(),
    getWalletState: jest.fn(),
    saveWalletState: jest.fn(),
    generateMnemonic: jest.fn(),
    validateMnemonic: jest.fn(),
  },
}));

const mockUsePasskey = usePasskey as jest.MockedFunction<typeof usePasskey>;
const mockPasskeyStorage = PasskeyStorageService as jest.Mocked<typeof PasskeyStorageService>;
const mockWalletStorage = WalletStorageService as jest.Mocked<typeof WalletStorageService>;

// Helper to create mock passkey hook return value
const createMockPasskeyHook = (overrides: Partial<ReturnType<typeof usePasskey>> = {}) => ({
  createPasskey: jest.fn(),
  authenticateWithPRF: jest.fn(),
  checkPRFSupport: jest.fn().mockResolvedValue({ supported: true }),
  generateSalt: jest.fn().mockReturnValue('test-salt'),
  getErrorMessage: jest.fn((error?: unknown) => {
    if (error instanceof Error) return error.message;
    return 'An error occurred';
  }),
  isLoading: false,
  error: null,
  isCreatingPasskey: false,
  isAuthenticating: false,
  isCheckingPRFSupport: false,
  prfSupport: { supported: true },
  availability: { available: true, prfSupported: true },
  createPasskeyMutation: { isPending: false, reset: jest.fn() },
  authenticateMutation: { isPending: false, reset: jest.fn() },
  reset: jest.fn(),
  resetError: jest.fn(),
  ...overrides,
}) as ReturnType<typeof usePasskey>;

// Helper to create mock credential
const createMockCredential = () => ({
  id: 'cred-123',
  rawId: new Uint8Array([1, 2, 3]),
  attestationObject: new Uint8Array([4, 5, 6]),
  clientDataJSON: new Uint8Array([7, 8, 9]),
  prfEnabled: true,
  prfSalts: {
    first: new Uint8Array(32).fill(1),
    second: new Uint8Array(32).fill(2),
  },
});

describe('useWalletMigration', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();

    // Default mock setup
    mockUsePasskey.mockReturnValue(createMockPasskeyHook());
    mockWalletStorage.getEncryptedSeed.mockReturnValue('encrypted-seed-123');
    mockWalletStorage.decryptSeed.mockResolvedValue('test mnemonic phrase twelve words here');
    mockPasskeyStorage.hasPasskeyWallet.mockReturnValue(false);
  });

  describe('canMigrate', () => {
    it('returns true when PIN wallet exists and PRF is supported', async () => {
      const { result } = renderHook(() => useWalletMigration(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.canMigrate).toBe(true);
      });
    });

    it('returns false when no PIN wallet exists', async () => {
      mockWalletStorage.getEncryptedSeed.mockReturnValue(null);

      const { result } = renderHook(() => useWalletMigration(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.canMigrate).toBe(false);
      });
    });

    it('returns false when PRF is not supported', async () => {
      mockUsePasskey.mockReturnValue(
        createMockPasskeyHook({
          prfSupport: { supported: false, reason: 'Browser not supported' },
        })
      );

      const { result } = renderHook(() => useWalletMigration(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.canMigrate).toBe(false);
      });
    });
  });

  describe('hasPinWallet', () => {
    it('returns true when encrypted seed exists', async () => {
      const { result } = renderHook(() => useWalletMigration(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.hasPinWallet).toBe(true);
      });
    });

    it('returns false when no encrypted seed', async () => {
      mockWalletStorage.getEncryptedSeed.mockReturnValue(null);

      const { result } = renderHook(() => useWalletMigration(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.hasPinWallet).toBe(false);
      });
    });
  });

  describe('hasPasskeyWallet', () => {
    it('returns true when passkey wallet exists', async () => {
      mockPasskeyStorage.hasPasskeyWallet.mockReturnValue(true);

      const { result } = renderHook(() => useWalletMigration(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.hasPasskeyWallet).toBe(true);
      });
    });

    it('returns false when no passkey wallet', async () => {
      mockPasskeyStorage.hasPasskeyWallet.mockReturnValue(false);

      const { result } = renderHook(() => useWalletMigration(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.hasPasskeyWallet).toBe(false);
      });
    });
  });

  describe('migrateToPasskey', () => {
    it('migrates wallet successfully', async () => {
      const mockCredential = createMockCredential();
      const mockCreatePasskey = jest.fn().mockResolvedValue(mockCredential);
      mockUsePasskey.mockReturnValue(
        createMockPasskeyHook({
          createPasskey: mockCreatePasskey,
        })
      );

      const { result } = renderHook(() => useWalletMigration(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      let migrationResult: MigrationResult | undefined;

      await act(async () => {
        migrationResult = await result.current.migrateToPasskey('1234');
      });

      expect(migrationResult).toEqual({
        success: true,
        credentialId: 'cred-123',
        mnemonic: 'test mnemonic phrase twelve words here',
      });

      // Verify storage was called
      expect(mockPasskeyStorage.storePasskeyWallet).toHaveBeenCalledWith(
        'cred-123',
        'encrypted-seed-123'
      );
      expect(mockWalletStorage.clearWalletData).toHaveBeenCalled();
    });

    it('throws error when PRF is not supported', async () => {
      mockUsePasskey.mockReturnValue(
        createMockPasskeyHook({
          prfSupport: { supported: false, reason: 'Not supported' },
          checkPRFSupport: jest.fn().mockResolvedValue({ supported: false, reason: 'Not supported' }),
        })
      );

      const { result } = renderHook(() => useWalletMigration(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        await expect(result.current.migrateToPasskey('1234')).rejects.toThrow(MigrationError);
      });

      try {
        await result.current.migrateToPasskey('1234');
      } catch (error) {
        expect(isMigrationError(error)).toBe(true);
        if (isMigrationError(error)) {
          expect(error.code).toBe('prf_not_supported');
        }
      }
    });

    it('throws error when no PIN wallet exists', async () => {
      mockWalletStorage.getEncryptedSeed.mockReturnValue(null);

      const { result } = renderHook(() => useWalletMigration(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        await expect(result.current.migrateToPasskey('1234')).rejects.toThrow(MigrationError);
      });

      try {
        await result.current.migrateToPasskey('1234');
      } catch (error) {
        expect(isMigrationError(error)).toBe(true);
        if (isMigrationError(error)) {
          expect(error.code).toBe('no_pin_wallet');
        }
      }
    });

    it('throws error when PIN is invalid', async () => {
      mockWalletStorage.decryptSeed.mockRejectedValue(new Error('Invalid password'));

      const { result } = renderHook(() => useWalletMigration(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        await expect(result.current.migrateToPasskey('wrong-pin')).rejects.toThrow(MigrationError);
      });

      try {
        await result.current.migrateToPasskey('wrong-pin');
      } catch (error) {
        expect(isMigrationError(error)).toBe(true);
        if (isMigrationError(error)) {
          expect(error.code).toBe('invalid_pin');
        }
      }
    });

    it('throws error when passkey creation fails', async () => {
      const mockCreatePasskey = jest.fn().mockRejectedValue(new Error('Creation failed'));
      mockUsePasskey.mockReturnValue(
        createMockPasskeyHook({
          createPasskey: mockCreatePasskey,
        })
      );

      const { result } = renderHook(() => useWalletMigration(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        await expect(result.current.migrateToPasskey('1234')).rejects.toThrow(MigrationError);
      });

      try {
        await result.current.migrateToPasskey('1234');
      } catch (error) {
        expect(isMigrationError(error)).toBe(true);
        if (isMigrationError(error)) {
          expect(error.code).toBe('passkey_creation_failed');
        }
      }
    });

    it('throws error when passkey creation is cancelled', async () => {
      const cancelledError = new Error('User cancelled');
      cancelledError.name = 'NotAllowedError';
      const mockCreatePasskey = jest.fn().mockRejectedValue(cancelledError);
      mockUsePasskey.mockReturnValue(
        createMockPasskeyHook({
          createPasskey: mockCreatePasskey,
        })
      );

      const { result } = renderHook(() => useWalletMigration(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        await expect(result.current.migrateToPasskey('1234')).rejects.toThrow(MigrationError);
      });

      try {
        await result.current.migrateToPasskey('1234');
      } catch (error) {
        expect(isMigrationError(error)).toBe(true);
        if (isMigrationError(error)) {
          expect(error.code).toBe('passkey_cancelled');
        }
      }
    });

    it('throws error when PRF is not enabled in credential', async () => {
      const mockCredential = {
        ...createMockCredential(),
        prfEnabled: false,
        prfSalts: undefined,
      };
      const mockCreatePasskey = jest.fn().mockResolvedValue(mockCredential);
      mockUsePasskey.mockReturnValue(
        createMockPasskeyHook({
          createPasskey: mockCreatePasskey,
        })
      );

      const { result } = renderHook(() => useWalletMigration(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        await expect(result.current.migrateToPasskey('1234')).rejects.toThrow(MigrationError);
      });

      try {
        await result.current.migrateToPasskey('1234');
      } catch (error) {
        expect(isMigrationError(error)).toBe(true);
        if (isMigrationError(error)) {
          expect(error.code).toBe('passkey_creation_failed');
        }
      }
    });

    it('throws error when storage fails', async () => {
      const mockCredential = createMockCredential();
      const mockCreatePasskey = jest.fn().mockResolvedValue(mockCredential);
      mockUsePasskey.mockReturnValue(
        createMockPasskeyHook({
          createPasskey: mockCreatePasskey,
        })
      );
      mockPasskeyStorage.storePasskeyWallet.mockImplementation(() => {
        throw new Error('Storage failed');
      });

      const { result } = renderHook(() => useWalletMigration(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        await expect(result.current.migrateToPasskey('1234')).rejects.toThrow(MigrationError);
      });

      try {
        await result.current.migrateToPasskey('1234');
      } catch (error) {
        expect(isMigrationError(error)).toBe(true);
        if (isMigrationError(error)) {
          expect(error.code).toBe('storage_failed');
        }
      }
    });

    it('does not clear PIN wallet on failure', async () => {
      const mockCreatePasskey = jest.fn().mockRejectedValue(new Error('Creation failed'));
      mockUsePasskey.mockReturnValue(
        createMockPasskeyHook({
          createPasskey: mockCreatePasskey,
        })
      );

      const { result } = renderHook(() => useWalletMigration(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.migrateToPasskey('1234');
        } catch {
          // Expected to throw
        }
      });

      // PIN wallet should NOT be cleared on failure
      expect(mockWalletStorage.clearWalletData).not.toHaveBeenCalled();
    });

    it('updates migration state during process', async () => {
      const mockCredential = createMockCredential();
      const mockCreatePasskey = jest.fn().mockResolvedValue(mockCredential);
      mockUsePasskey.mockReturnValue(
        createMockPasskeyHook({
          createPasskey: mockCreatePasskey,
        })
      );

      const { result } = renderHook(() => useWalletMigration(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      // Initial state
      expect(result.current.migrationState).toBe('idle');

      await act(async () => {
        await result.current.migrateToPasskey('1234');
      });

      // Final state
      expect(result.current.migrationState).toBe('success');
    });

    it('updates progress during migration', async () => {
      const mockCredential = createMockCredential();
      const mockCreatePasskey = jest.fn().mockResolvedValue(mockCredential);
      mockUsePasskey.mockReturnValue(
        createMockPasskeyHook({
          createPasskey: mockCreatePasskey,
        })
      );

      const { result } = renderHook(() => useWalletMigration(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        await result.current.migrateToPasskey('1234');
      });

      expect(result.current.progress).toBe(100);
    });

    it('uses custom rpId when provided', async () => {
      const mockCredential = createMockCredential();
      const mockCreatePasskey = jest.fn().mockResolvedValue(mockCredential);
      mockUsePasskey.mockReturnValue(
        createMockPasskeyHook({
          createPasskey: mockCreatePasskey,
        })
      );

      const { result } = renderHook(() => useWalletMigration(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        await result.current.migrateToPasskey('1234', 'custom.example.com');
      });

      expect(mockCreatePasskey).toHaveBeenCalledWith('custom.example.com');
    });
  });

  describe('reset', () => {
    it('resets migration state to idle', async () => {
      const mockCreatePasskey = jest.fn().mockRejectedValue(new Error('Failed'));
      mockUsePasskey.mockReturnValue(
        createMockPasskeyHook({
          createPasskey: mockCreatePasskey,
        })
      );

      const { result } = renderHook(() => useWalletMigration(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.migrateToPasskey('1234');
        } catch {
          // Expected
        }
      });

      expect(result.current.migrationState).toBe('error');

      act(() => {
        result.current.reset();
      });

      expect(result.current.migrationState).toBe('idle');
      expect(result.current.error).toBeNull();
      expect(result.current.progress).toBe(0);
    });
  });

  describe('clearError', () => {
    it('clears error state', async () => {
      const mockCreatePasskey = jest.fn().mockRejectedValue(new Error('Failed'));
      mockUsePasskey.mockReturnValue(
        createMockPasskeyHook({
          createPasskey: mockCreatePasskey,
        })
      );

      const { result } = renderHook(() => useWalletMigration(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.migrateToPasskey('1234');
        } catch {
          // Expected
        }
      });

      expect(result.current.error).not.toBeNull();

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('getErrorMessage', () => {
    it('returns correct message for no_pin_wallet error', async () => {
      const { result } = renderHook(() => useWalletMigration(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const error = new MigrationError('Test', 'no_pin_wallet');
      expect(result.current.getErrorMessage(error)).toBe('No PIN wallet found to migrate.');
    });

    it('returns correct message for invalid_pin error', async () => {
      const { result } = renderHook(() => useWalletMigration(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const error = new MigrationError('Test', 'invalid_pin');
      expect(result.current.getErrorMessage(error)).toBe(
        'Invalid PIN. Please enter the correct PIN for your existing wallet.'
      );
    });

    it('returns correct message for prf_not_supported error', async () => {
      const { result } = renderHook(() => useWalletMigration(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const error = new MigrationError('Test', 'prf_not_supported');
      expect(result.current.getErrorMessage(error)).toBe(
        'Your browser does not support passkey-based wallet. Please use a supported browser.'
      );
    });

    it('returns correct message for passkey_creation_failed error', async () => {
      const { result } = renderHook(() => useWalletMigration(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const error = new MigrationError('Test', 'passkey_creation_failed');
      expect(result.current.getErrorMessage(error)).toBe('Failed to create passkey. Please try again.');
    });

    it('returns correct message for passkey_cancelled error', async () => {
      const { result } = renderHook(() => useWalletMigration(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const error = new MigrationError('Test', 'passkey_cancelled');
      expect(result.current.getErrorMessage(error)).toBe('Passkey creation was cancelled.');
    });

    it('returns correct message for mnemonic_mismatch error', async () => {
      const { result } = renderHook(() => useWalletMigration(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const error = new MigrationError('Test', 'mnemonic_mismatch');
      expect(result.current.getErrorMessage(error)).toBe(
        'Wallet verification failed. The derived wallet does not match your existing wallet.'
      );
    });

    it('returns correct message for storage_failed error', async () => {
      const { result } = renderHook(() => useWalletMigration(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const error = new MigrationError('Test', 'storage_failed');
      expect(result.current.getErrorMessage(error)).toBe(
        'Failed to store passkey wallet data. Please try again.'
      );
    });

    it('returns generic message for unknown_error', async () => {
      const { result } = renderHook(() => useWalletMigration(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const error = new MigrationError('Custom error message', 'unknown_error');
      expect(result.current.getErrorMessage(error)).toBe('Custom error message');
    });
  });

  describe('isMigrating', () => {
    it('returns false when idle', async () => {
      const { result } = renderHook(() => useWalletMigration(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      expect(result.current.isMigrating).toBe(false);
    });

    it('returns true during migration', async () => {
      let resolveCreate: (value: any) => void;
      const createPromise = new Promise((resolve) => {
        resolveCreate = resolve;
      });
      const mockCreatePasskey = jest.fn().mockReturnValue(createPromise);
      mockUsePasskey.mockReturnValue(
        createMockPasskeyHook({
          createPasskey: mockCreatePasskey,
        })
      );

      const { result } = renderHook(() => useWalletMigration(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      // Start migration
      act(() => {
        result.current.migrateToPasskey('1234');
      });

      // Check during migration
      await waitFor(() => {
        expect(result.current.isMigrating).toBe(true);
      });

      // Resolve the promise
      await act(async () => {
        resolveCreate!(createMockCredential());
      });

      // Check after completion
      await waitFor(() => {
        expect(result.current.isMigrating).toBe(false);
      });
    });
  });
});

describe('isMigrationError', () => {
  it('returns true for MigrationError', () => {
    const error = new MigrationError('Test', 'unknown_error');
    expect(isMigrationError(error)).toBe(true);
  });

  it('returns false for regular Error', () => {
    const error = new Error('Test');
    expect(isMigrationError(error)).toBe(false);
  });

  it('returns false for non-error values', () => {
    expect(isMigrationError(null)).toBe(false);
    expect(isMigrationError(undefined)).toBe(false);
    expect(isMigrationError('error')).toBe(false);
    expect(isMigrationError({})).toBe(false);
  });
});

describe('MigrationError', () => {
  it('creates error with code', () => {
    const error = new MigrationError('Test message', 'invalid_pin');
    expect(error.message).toBe('Test message');
    expect(error.code).toBe('invalid_pin');
    expect(error.name).toBe('MigrationError');
  });

  it('creates error with cause', () => {
    const cause = new Error('Original error');
    const error = new MigrationError('Test message', 'unknown_error', cause);
    expect(error.cause).toBe(cause);
  });
});

describe('Type exports', () => {
  it('exports MigrationErrorCode type', () => {
    const code: MigrationErrorCode = 'invalid_pin';
    expect(code).toBe('invalid_pin');
  });

  it('exports MigrationState type', () => {
    const state: MigrationState = 'idle';
    expect(state).toBe('idle');
  });

  it('exports MigrationResult type', () => {
    const result: MigrationResult = {
      success: true,
      credentialId: 'test-id',
      mnemonic: 'test mnemonic',
    };
    expect(result.success).toBe(true);
  });
});