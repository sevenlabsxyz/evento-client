import { usePasskey, usePasskeyAvailability, usePasskeySupport } from '@/lib/hooks/use-passkey';
import {
  authenticateWithPRF,
  checkPasskeyAvailable,
  checkPasskeyPRFSupport,
  createPasskey,
  generatePRFSalt,
  PasskeyError,
  type PasskeyCredential,
  type PRFAuthenticationResult,
} from '@/lib/services/passkey-service';
import { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createTestWrapper } from '../setup/test-utils';

// Mock the passkey service
jest.mock('@/lib/services/passkey-service', () => ({
  createPasskey: jest.fn(),
  authenticateWithPRF: jest.fn(),
  checkPasskeyPRFSupport: jest.fn(),
  checkPasskeyAvailable: jest.fn(),
  generatePRFSalt: jest.fn(),
  getPasskeyErrorMessage: jest.fn((error: PasskeyError) => error.message),
  isPasskeyError: jest.fn((error: unknown): error is PasskeyError => {
    return error instanceof Error && 'code' in error;
  }),
}));

const mockCreatePasskey = createPasskey as jest.MockedFunction<typeof createPasskey>;
const mockAuthenticateWithPRF = authenticateWithPRF as jest.MockedFunction<
  typeof authenticateWithPRF
>;
const mockCheckPasskeyPRFSupport = checkPasskeyPRFSupport as jest.MockedFunction<
  typeof checkPasskeyPRFSupport
>;
const mockCheckPasskeyAvailable = checkPasskeyAvailable as jest.MockedFunction<
  typeof checkPasskeyAvailable
>;
const mockGeneratePRFSalt = generatePRFSalt as jest.MockedFunction<typeof generatePRFSalt>;

// Helper to create mock passkey credential
const createMockCredential = (overrides: Partial<PasskeyCredential> = {}): PasskeyCredential => ({
  id: 'cred-123',
  rawId: new Uint8Array([1, 2, 3]),
  attestationObject: new Uint8Array([4, 5, 6]),
  clientDataJSON: new Uint8Array([7, 8, 9]),
  prfEnabled: true,
  prfSalts: {
    first: new Uint8Array(32),
    second: new Uint8Array(32),
  },
  ...overrides,
});

// Helper to create mock PRF authentication result
const createMockPRFResult = (
  overrides: Partial<PRFAuthenticationResult> = {}
): PRFAuthenticationResult => ({
  prfOutput: new Uint8Array(32).fill(1),
  credentialId: 'cred-123',
  userVerified: true,
  ...overrides,
});

// Helper to create mock PasskeyError
const createMockPasskeyError = (code: string, message: string): PasskeyError => {
  return new PasskeyError(message, code as PasskeyError['code']);
};

describe('usePasskey', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  describe('PRF Support Check', () => {
    it('returns PRF support status', async () => {
      mockCheckPasskeyPRFSupport.mockResolvedValue({
        supported: true,
        reason: undefined,
      });

      const { result } = renderHook(() => usePasskey(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isCheckingPRFSupport).toBe(false);
      });

      expect(result.current.prfSupport?.supported).toBe(true);
    });

    it('returns unsupported when PRF is not available', async () => {
      mockCheckPasskeyPRFSupport.mockResolvedValue({
        supported: false,
        reason: 'PRF extension is not supported in this browser',
      });

      const { result } = renderHook(() => usePasskey(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isCheckingPRFSupport).toBe(false);
      });

      expect(result.current.prfSupport?.supported).toBe(false);
      expect(result.current.prfSupport?.reason).toBe(
        'PRF extension is not supported in this browser'
      );
    });

    it('allows manual PRF support check via checkPRFSupport', async () => {
      mockCheckPasskeyPRFSupport.mockResolvedValue({
        supported: true,
        reason: undefined,
      });

      const { result } = renderHook(() => usePasskey(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isCheckingPRFSupport).toBe(false);
      });

      const support = await result.current.checkPRFSupport();

      expect(support.supported).toBe(true);
      expect(mockCheckPasskeyPRFSupport).toHaveBeenCalledTimes(2); // Initial + manual check
    });
  });

  describe('Passkey Availability', () => {
    it('returns availability status', async () => {
      mockCheckPasskeyAvailable.mockResolvedValue({
        available: true,
        prfSupported: true,
      });

      const { result } = renderHook(() => usePasskey(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isCheckingAvailability).toBe(false);
      });

      expect(result.current.availability?.available).toBe(true);
      expect(result.current.availability?.prfSupported).toBe(true);
    });

    it('returns unavailable when passkeys are not supported', async () => {
      mockCheckPasskeyAvailable.mockResolvedValue({
        available: false,
        prfSupported: false,
        reason: 'WebAuthn is not available',
      });

      const { result } = renderHook(() => usePasskey(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isCheckingAvailability).toBe(false);
      });

      expect(result.current.availability?.available).toBe(false);
      expect(result.current.availability?.reason).toBe('WebAuthn is not available');
    });
  });

  describe('createPasskey', () => {
    it('creates a passkey successfully', async () => {
      const mockCredential = createMockCredential();
      mockCreatePasskey.mockResolvedValue(mockCredential);

      const { result } = renderHook(() => usePasskey(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      let credential: PasskeyCredential | undefined;

      await act(async () => {
        credential = await result.current.createPasskey('evento.app');
      });

      expect(mockCreatePasskey).toHaveBeenCalledWith('evento.app', undefined);
      expect(credential).toEqual(mockCredential);
      expect(result.current.isCreatingPasskey).toBe(false);
    });

    it('creates a passkey with options', async () => {
      const mockCredential = createMockCredential();
      mockCreatePasskey.mockResolvedValue(mockCredential);

      const { result } = renderHook(() => usePasskey(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const options = {
        userDisplayName: 'Test User',
        authenticatorType: 'platform' as const,
      };

      await act(async () => {
        await result.current.createPasskey('evento.app', options);
      });

      expect(mockCreatePasskey).toHaveBeenCalledWith('evento.app', options);
    });

    it('handles passkey creation errors', async () => {
      const mockError = createMockPasskeyError('cancelled', 'Passkey creation was cancelled');
      mockCreatePasskey.mockRejectedValue(mockError);

      const { result } = renderHook(() => usePasskey(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.createPasskey('evento.app');
        } catch {
          // Expected to throw
        }
      });

      await waitFor(() => {
        expect(result.current.isCreatingPasskey).toBe(false);
      });

      expect(result.current.error).not.toBeNull();
    });

    it('sets loading state during creation', async () => {
      let resolveCreation: (value: PasskeyCredential) => void;
      const creationPromise = new Promise<PasskeyCredential>((resolve) => {
        resolveCreation = resolve;
      });
      mockCreatePasskey.mockReturnValue(creationPromise);

      const { result } = renderHook(() => usePasskey(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      act(() => {
        result.current.createPasskey('evento.app');
      });

      expect(result.current.isCreatingPasskey).toBe(true);
      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveCreation!(createMockCredential());
      });

      await waitFor(() => {
        expect(result.current.isCreatingPasskey).toBe(false);
      });
    });
  });

  describe('authenticateWithPRF', () => {
    it('authenticates with PRF successfully', async () => {
      const mockResult = createMockPRFResult();
      mockAuthenticateWithPRF.mockResolvedValue(mockResult);

      const { result } = renderHook(() => usePasskey(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      let authResult: PRFAuthenticationResult | undefined;

      await act(async () => {
        authResult = await result.current.authenticateWithPRF('evento.app', 'test-salt');
      });

      expect(mockAuthenticateWithPRF).toHaveBeenCalledWith('evento.app', 'test-salt', undefined);
      expect(authResult).toEqual(mockResult);
      expect(result.current.isAuthenticating).toBe(false);
    });

    it('authenticates with Uint8Array salt', async () => {
      const mockResult = createMockPRFResult();
      mockAuthenticateWithPRF.mockResolvedValue(mockResult);

      const { result } = renderHook(() => usePasskey(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const salt = new Uint8Array(32).fill(1);

      await act(async () => {
        await result.current.authenticateWithPRF('evento.app', salt);
      });

      expect(mockAuthenticateWithPRF).toHaveBeenCalledWith('evento.app', salt, undefined);
    });

    it('authenticates with specific credential ID', async () => {
      const mockResult = createMockPRFResult();
      mockAuthenticateWithPRF.mockResolvedValue(mockResult);

      const { result } = renderHook(() => usePasskey(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const options = { credentialId: 'specific-cred-id' };

      await act(async () => {
        await result.current.authenticateWithPRF('evento.app', 'test-salt', options);
      });

      expect(mockAuthenticateWithPRF).toHaveBeenCalledWith('evento.app', 'test-salt', options);
    });

    it('handles authentication errors', async () => {
      const mockError = createMockPasskeyError(
        'no_credentials_found',
        'No passkey found for this account'
      );
      mockAuthenticateWithPRF.mockRejectedValue(mockError);

      const { result } = renderHook(() => usePasskey(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.authenticateWithPRF('evento.app', 'test-salt');
        } catch {
          // Expected to throw
        }
      });

      await waitFor(() => {
        expect(result.current.isAuthenticating).toBe(false);
      });

      expect(result.current.error).not.toBeNull();
    });

    it('sets loading state during authentication', async () => {
      let resolveAuth: (value: PRFAuthenticationResult) => void;
      const authPromise = new Promise<PRFAuthenticationResult>((resolve) => {
        resolveAuth = resolve;
      });
      mockAuthenticateWithPRF.mockReturnValue(authPromise);

      const { result } = renderHook(() => usePasskey(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      act(() => {
        result.current.authenticateWithPRF('evento.app', 'test-salt');
      });

      expect(result.current.isAuthenticating).toBe(true);
      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveAuth!(createMockPRFResult());
      });

      await waitFor(() => {
        expect(result.current.isAuthenticating).toBe(false);
      });
    });
  });

  describe('generateSalt', () => {
    it('generates a PRF salt', () => {
      const mockSalt = '550e8400-e29b-41d4-a716-446655440000';
      mockGeneratePRFSalt.mockReturnValue(mockSalt);

      const { result } = renderHook(() => usePasskey(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const salt = result.current.generateSalt();

      expect(salt).toBe(mockSalt);
      expect(mockGeneratePRFSalt).toHaveBeenCalled();
    });
  });

  describe('getErrorMessage', () => {
    it('returns error message for PasskeyError', async () => {
      const { result } = renderHook(() => usePasskey(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const mockError = createMockPasskeyError('cancelled', 'Passkey creation was cancelled');

      const message = result.current.getErrorMessage(mockError);

      expect(message).toBe('Passkey creation was cancelled');
    });

    it('returns empty string for null error', () => {
      const { result } = renderHook(() => usePasskey(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const message = result.current.getErrorMessage(null);

      expect(message).toBe('');
    });
  });

  describe('reset functions', () => {
    it('resets all mutations and errors', async () => {
      const mockError = createMockPasskeyError('cancelled', 'Passkey creation was cancelled');
      mockCreatePasskey.mockRejectedValue(mockError);

      const { result } = renderHook(() => usePasskey(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.createPasskey('evento.app');
        } catch {
          // Expected
        }
      });

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.error).toBeNull();
    });

    it('resets only error via resetError', async () => {
      const mockError = createMockPasskeyError('cancelled', 'Passkey creation was cancelled');
      mockCreatePasskey.mockRejectedValue(mockError);

      const { result } = renderHook(() => usePasskey(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.createPasskey('evento.app');
        } catch {
          // Expected
        }
      });

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      act(() => {
        result.current.resetError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('isLoading state', () => {
    it('returns true when any operation is loading', async () => {
      let resolveCreation: (value: PasskeyCredential) => void;
      const creationPromise = new Promise<PasskeyCredential>((resolve) => {
        resolveCreation = resolve;
      });
      mockCreatePasskey.mockReturnValue(creationPromise);

      const { result } = renderHook(() => usePasskey(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      act(() => {
        result.current.createPasskey('evento.app');
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveCreation!(createMockCredential());
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });
});

describe('usePasskeySupport', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  it('returns PRF support status', async () => {
    mockCheckPasskeyPRFSupport.mockResolvedValue({
      supported: true,
      reason: undefined,
    });

    const { result } = renderHook(() => usePasskeySupport(), {
      wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isSupported).toBe(true);
    expect(result.current.reason).toBeUndefined();
  });

  it('returns unsupported status', async () => {
    mockCheckPasskeyPRFSupport.mockResolvedValue({
      supported: false,
      reason: 'Browser not supported',
    });

    const { result } = renderHook(() => usePasskeySupport(), {
      wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isSupported).toBe(false);
    expect(result.current.reason).toBe('Browser not supported');
  });
});

describe('usePasskeyAvailability', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  it('returns availability status', async () => {
    mockCheckPasskeyAvailable.mockResolvedValue({
      available: true,
      prfSupported: true,
    });

    const { result } = renderHook(() => usePasskeyAvailability(), {
      wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAvailable).toBe(true);
    expect(result.current.prfSupported).toBe(true);
  });

  it('returns unavailable status with reason', async () => {
    mockCheckPasskeyAvailable.mockResolvedValue({
      available: false,
      prfSupported: false,
      reason: 'No platform authenticator',
    });

    const { result } = renderHook(() => usePasskeyAvailability(), {
      wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAvailable).toBe(false);
    expect(result.current.prfSupported).toBe(false);
    expect(result.current.reason).toBe('No platform authenticator');
  });
});
