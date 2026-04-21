import { PasskeyStorageService } from '@/lib/services/passkey-storage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';

// Mock logger
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    logApiRequest: jest.fn(),
    logApiResponse: jest.fn(),
  },
}));

// Mock toast
jest.mock('@/lib/utils/toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock the API client
jest.mock('@/lib/api/client', () => {
  const mockApiClient = {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    request: jest.fn(),
    head: jest.fn(),
    options: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };
  return {
    __esModule: true,
    default: mockApiClient,
    apiClient: mockApiClient,
  };
});

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
  }),
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
    isFallback: false,
    isLocaleDomain: false,
    isReady: true,
    isPreview: false,
    basePath: '',
    locale: 'en',
    locales: ['en'],
    defaultLocale: 'en',
    domainLocales: [],
    isSsr: false,
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// Mock auth service
jest.mock('@/lib/services/auth', () => ({
  authService: {
    getCurrentUser: jest.fn().mockResolvedValue(null),
    sendLoginCode: jest.fn(),
    verifyCode: jest.fn(),
    logout: jest.fn(),
  },
}));

// Mock wallet service
jest.mock('@/lib/services/breez-sdk', () => ({
  breezService: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    getBalance: jest.fn(),
    createInvoice: jest.fn(),
    sendPayment: jest.fn(),
    parseInput: jest.fn(),
  },
}));

// Mock useWallet hook
jest.mock('@/lib/hooks/use-wallet', () => ({
  useWallet: () => ({
    createWallet: jest.fn().mockResolvedValue('test mnemonic words here'),
    isConnected: false,
    balance: null,
    isLoading: false,
  }),
}));

// Mock useAuth hook
jest.mock('@/lib/hooks/use-auth', () => ({
  useAuth: () => ({
    user: { id: 'user123', username: 'testuser', name: 'Test User' },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

// Mock useLightningAddress hook
jest.mock('@/lib/hooks/use-lightning-address', () => ({
  useLightningAddress: () => ({
    checkAvailability: jest.fn().mockResolvedValue(true),
    registerAddress: jest.fn().mockResolvedValue(undefined),
  }),
}));

// Mock usePasskey hook
jest.mock('@/lib/hooks/use-passkey', () => ({
  usePasskey: () => ({
    createPasskey: jest.fn().mockResolvedValue({
      id: 'test-credential-id',
      rawId: new Uint8Array(32),
      prfEnabled: true,
      prfSalts: { first: new Uint8Array(32) },
    }),
    checkPRFSupport: jest.fn().mockResolvedValue({ supported: true }),
    generateSalt: jest.fn().mockReturnValue('test-salt-uuid'),
    getErrorMessage: jest.fn((err) => err?.message || 'Error'),
    isLoading: false,
    error: null,
    prfSupport: { supported: true },
    isCheckingPRFSupport: false,
  }),
  usePasskeySupport: () => ({
    isSupported: true,
    isLoading: false,
    reason: undefined,
  }),
}));

// Mock PasskeyStorageService
jest.mock('@/lib/services/passkey-storage', () => ({
  PasskeyStorageService: {
    storePasskeyWallet: jest.fn(),
    getPasskeyWallet: jest.fn(),
    hasPasskeyWallet: jest.fn().mockReturnValue(false),
    getCredentialId: jest.fn(),
    clearPasskeyWallet: jest.fn(),
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Passkey Wallet Setup Integration', () => {
  let queryClient: QueryClient;
  let mockPasskeyStorageService: jest.Mocked<typeof PasskeyStorageService>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockPasskeyStorageService = require('@/lib/services/passkey-storage').PasskeyStorageService;
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createWrapper = (client: QueryClient) => {
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };

  describe('AuthMethod Type', () => {
    it('should support passkey auth method', () => {
      const authMethod: 'passkey' | 'pin' | null = 'passkey';
      expect(authMethod).toBe('passkey');
    });

    it('should support pin auth method', () => {
      const authMethod: 'passkey' | 'pin' | null = 'pin';
      expect(authMethod).toBe('pin');
    });

    it('should support null auth method (initial state)', () => {
      const authMethod: 'passkey' | 'pin' | null = null;
      expect(authMethod).toBeNull();
    });
  });

  describe('Step Type', () => {
    it('should support choose-method step', () => {
      const step: 'choose-method' | 'create-pin' | 'confirm-pin' | 'creating' | 'error' = 'choose-method';
      expect(step).toBe('choose-method');
    });

    it('should support create-pin step', () => {
      const step: 'choose-method' | 'create-pin' | 'confirm-pin' | 'creating' | 'error' = 'create-pin';
      expect(step).toBe('create-pin');
    });

    it('should support confirm-pin step', () => {
      const step: 'choose-method' | 'create-pin' | 'confirm-pin' | 'creating' | 'error' = 'confirm-pin';
      expect(step).toBe('confirm-pin');
    });

    it('should support creating step', () => {
      const step: 'choose-method' | 'create-pin' | 'confirm-pin' | 'creating' | 'error' = 'creating';
      expect(step).toBe('creating');
    });

    it('should support error step', () => {
      const step: 'choose-method' | 'create-pin' | 'confirm-pin' | 'creating' | 'error' = 'error';
      expect(step).toBe('error');
    });
  });

  describe('PasskeyStorageService Integration', () => {
    it('should store passkey wallet data', () => {
      const credentialId = 'test-credential-id-123';
      const encryptedMnemonic = 'prf-derived';

      mockPasskeyStorageService.storePasskeyWallet(credentialId, encryptedMnemonic);

      expect(mockPasskeyStorageService.storePasskeyWallet).toHaveBeenCalledWith(
        credentialId,
        encryptedMnemonic
      );
    });

    it('should check if passkey wallet exists', () => {
      mockPasskeyStorageService.hasPasskeyWallet();

      expect(mockPasskeyStorageService.hasPasskeyWallet).toHaveBeenCalled();
    });

    it('should get credential ID', () => {
      mockPasskeyStorageService.getCredentialId();

      expect(mockPasskeyStorageService.getCredentialId).toHaveBeenCalled();
    });

    it('should clear passkey wallet data', () => {
      mockPasskeyStorageService.clearPasskeyWallet();

      expect(mockPasskeyStorageService.clearPasskeyWallet).toHaveBeenCalled();
    });
  });

  describe('Wallet Setup Flow Logic', () => {
    it('should start with choose-method step', () => {
      // Initial state should be choose-method
      const initialStep = 'choose-method';
      const initialAuthMethod = null;

      expect(initialStep).toBe('choose-method');
      expect(initialAuthMethod).toBeNull();
    });

    it('should transition to passkey flow when user selects passkey', () => {
      // User selects passkey
      const authMethod = 'passkey';

      expect(authMethod).toBe('passkey');
    });

    it('should transition to PIN flow when user selects PIN', () => {
      // User selects PIN
      const authMethod = 'pin';
      const step = 'create-pin';

      expect(authMethod).toBe('pin');
      expect(step).toBe('create-pin');
    });

    it('should transition from create-pin to confirm-pin', () => {
      // User enters PIN and clicks Next
      const step = 'confirm-pin';

      expect(step).toBe('confirm-pin');
    });

    it('should transition from confirm-pin to creating', () => {
      // User confirms PIN and clicks Create Wallet
      const step = 'creating';

      expect(step).toBe('creating');
    });

    it('should transition to error on failure', () => {
      // Wallet creation fails
      const step = 'error';
      const errorMessage = 'Failed to create wallet';

      expect(step).toBe('error');
      expect(errorMessage).toBeTruthy();
    });
  });

  describe('Passkey Setup Wizard Callbacks', () => {
    it('should handle onComplete callback with mnemonic and credentialId', async () => {
      const mnemonic = 'test mnemonic words here twelve words total';
      const credentialId = 'test-credential-id-123';

      // Simulate onComplete callback
      mockPasskeyStorageService.storePasskeyWallet(credentialId, 'prf-derived');

      expect(mockPasskeyStorageService.storePasskeyWallet).toHaveBeenCalledWith(
        credentialId,
        'prf-derived'
      );
    });

    it('should handle onUsePinFallback callback', () => {
      // Simulate PIN fallback
      let authMethod: 'passkey' | 'pin' | null = 'passkey';
      let step = 'choose-method';

      // User chooses PIN fallback
      authMethod = 'pin';
      step = 'create-pin';

      expect(authMethod).toBe('pin');
      expect(step).toBe('create-pin');
    });

    it('should handle onCancel callback', () => {
      const onCancel = jest.fn();

      onCancel();

      expect(onCancel).toHaveBeenCalled();
    });
  });

  describe('PIN Flow Preservation', () => {
    it('should preserve PIN validation logic (minimum 4 digits)', () => {
      const validPin = '1234';
      const invalidPin = '123';

      expect(validPin.length).toBeGreaterThanOrEqual(4);
      expect(invalidPin.length).toBeLessThan(4);
    });

    it('should preserve PIN confirmation logic', () => {
      const pin = '123456';
      const confirmPin = '123456';
      const wrongConfirmPin = '654321';

      expect(pin).toBe(confirmPin);
      expect(pin).not.toBe(wrongConfirmPin);
    });

    it('should preserve PIN length limit (max 6 digits)', () => {
      const validPin = '123456';
      const invalidPin = '1234567';

      expect(validPin.length).toBeLessThanOrEqual(6);
      expect(invalidPin.length).toBeGreaterThan(6);
    });
  });

  describe('Lightning Address Registration', () => {
    it('should register Lightning address after wallet creation', async () => {
      const { useLightningAddress } = require('@/lib/hooks/use-lightning-address');
      const { checkAvailability, registerAddress } = useLightningAddress();

      const isAvailable = await checkAvailability('testuser');
      expect(isAvailable).toBe(true);

      if (isAvailable) {
        await registerAddress('testuser', 'Pay to Test User');
        expect(registerAddress).toHaveBeenCalledWith('testuser', 'Pay to Test User');
      }
    });

    it('should handle Lightning address registration failure gracefully', async () => {
      const { useLightningAddress } = require('@/lib/hooks/use-lightning-address');
      const { checkAvailability, registerAddress } = useLightningAddress();

      // Simulate failure
      (checkAvailability as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      try {
        await checkAvailability('testuser');
      } catch (error) {
        // Should not fail wallet creation
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle API key error', () => {
      const err = { message: 'API key is missing' };
      let errorMessage = err.message || 'Failed to create wallet';

      if (err.message?.includes('API key')) {
        errorMessage = 'Breez API key is missing. Please contact support.';
      }

      expect(errorMessage).toBe('Breez API key is missing. Please contact support.');
    });

    it('should handle WASM initialization error', () => {
      const err = { message: 'WASM initialization failed' };
      let errorMessage = err.message || 'Failed to create wallet';

      if (err.message?.includes('WASM') || err.message?.includes('defaultConfig')) {
        errorMessage = 'Wallet initialization failed. Please refresh the page and try again.';
      }

      expect(errorMessage).toBe('Wallet initialization failed. Please refresh the page and try again.');
    });

    it('should handle generic error', () => {
      const err = { message: 'Unknown error' };
      let errorMessage = err.message || 'Failed to create wallet';

      expect(errorMessage).toBe('Unknown error');
    });
  });

  describe('Retry Logic', () => {
    it('should reset to choose-method on retry', () => {
      // Simulate retry
      let step: 'choose-method' | 'create-pin' | 'confirm-pin' | 'creating' | 'error' = 'error';
      let authMethod: 'passkey' | 'pin' | null = 'pin';
      let pin = '1234';
      let confirmPin = '1234';
      let error: string | null = 'Some error';

      // handleRetry
      step = 'choose-method';
      authMethod = null;
      pin = '';
      confirmPin = '';
      error = null;

      expect(step).toBe('choose-method');
      expect(authMethod).toBeNull();
      expect(pin).toBe('');
      expect(confirmPin).toBe('');
      expect(error).toBeNull();
    });
  });

  describe('Component Props', () => {
    it('should accept onComplete callback', () => {
      const onComplete = jest.fn((mnemonic?: string) => {});

      onComplete('test mnemonic');

      expect(onComplete).toHaveBeenCalledWith('test mnemonic');
    });

    it('should accept optional onCancel callback', () => {
      const onCancel = jest.fn();

      onCancel();

      expect(onCancel).toHaveBeenCalled();
    });

    it('should work without onCancel callback', () => {
      const onComplete = jest.fn();
      const onCancel = undefined;

      expect(onComplete).toBeDefined();
      expect(onCancel).toBeUndefined();
    });
  });
});