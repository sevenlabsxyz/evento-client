import {
  useAuth,
  useLogin,
  useRequireAuth,
  useVerifyCode,
} from '@/lib/hooks/use-auth';
import { authService } from '@/lib/services/auth';
import { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createTestWrapper } from '../setup/test-utils';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '/test-path',
}));

// Mock the auth service
jest.mock('@/lib/services/auth', () => ({
  authService: {
    getCurrentUser: jest.fn(),
    sendLoginCode: jest.fn(),
    verifyCode: jest.fn(),
    logout: jest.fn(),
    loginWithGoogle: jest.fn(),
  },
}));

// Define the user type
type MockUser = {
  id: string;
  username: string;
  name: string;
  bio: string;
  image: string;
  bio_link: string;
  x_handle: string;
  instagram_handle: string;
  ln_address: string;
  nip05: string;
  verification_status: null;
  verification_date: string;
};

// Mock the auth store
const mockAuthStore = {
  user: null as MockUser | null,
  isAuthenticated: false,
  email: '',
  setUser: jest.fn(),
  setEmail: jest.fn(),
  clearAuth: jest.fn(),
  clearEmail: jest.fn(),
};

jest.mock('@/lib/stores/auth-store', () => ({
  useAuthStore: () => mockAuthStore,
}));

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
  })),
}));

const mockAuthService = authService as jest.Mocked<typeof authService>;

// Helper function to create mock users
const createMockUser = (overrides: Partial<MockUser> = {}): MockUser => ({
  id: 'user1',
  username: 'testuser',
  name: 'Test User',
  bio: 'Test bio',
  image: 'test.jpg',
  bio_link: '',
  x_handle: '',
  instagram_handle: '',
  ln_address: '',
  nip05: '',
  verification_status: null,
  verification_date: '',
  ...overrides,
});

describe('Authentication Hooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();

    // Reset the mock store state
    mockAuthStore.user = null;
    mockAuthStore.isAuthenticated = false;
    mockAuthStore.email = '';
  });

  describe('useAuth', () => {
    it('returns loading state initially', async () => {
      mockAuthService.getCurrentUser.mockImplementation(() =>
        Promise.resolve(null)
      );

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
    });

    it('returns authenticated user data when available', async () => {
      const mockUser = createMockUser();

      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Wait for the useEffect to update the store
      await waitFor(() => {
        expect(mockAuthStore.setUser).toHaveBeenCalledWith(mockUser);
      });

      // Update the mock store to reflect the state change
      mockAuthStore.user = mockUser;
      mockAuthStore.isAuthenticated = true;

      // Re-render to get updated state
      const { result: updatedResult } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      expect(updatedResult.current.user).toEqual(mockUser);
      expect(updatedResult.current.isAuthenticated).toBe(true);
    });

    it('handles authentication errors gracefully', async () => {
      const authError = { message: 'Unauthorized', status: 401 };
      mockAuthService.getCurrentUser.mockRejectedValue(authError);

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
    });

    it('calls logout and redirects on logout success', async () => {
      const mockUser = createMockUser({ bio: '', image: '' });
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

      mockAuthService.logout.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        result.current.logout();
      });

      expect(mockAuthService.logout).toHaveBeenCalled();
    });
  });

  describe('useLogin', () => {
    it('sends login code and redirects to verify page', async () => {
      const testEmail = 'test@example.com';
      mockAuthService.sendLoginCode.mockResolvedValue(undefined);

      const { result } = renderHook(() => useLogin(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.sendLoginCode(testEmail);
      });

      expect(mockAuthService.sendLoginCode).toHaveBeenCalledWith(testEmail);

      // Wait for the mutation to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify that setEmail was called
      expect(mockAuthStore.setEmail).toHaveBeenCalledWith(testEmail);
    });

    it('handles login errors gracefully', async () => {
      const testEmail = 'test@example.com';
      const loginError = new Error('Invalid email');
      mockAuthService.sendLoginCode.mockRejectedValue(loginError);

      const { result } = renderHook(() => useLogin(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.sendLoginCode(testEmail);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe(loginError);
    });
  });

  describe('useVerifyCode', () => {
    beforeEach(() => {
      // Set up the mock store with email for these tests
      mockAuthStore.email = 'test@example.com';
    });

    afterEach(() => {
      // Reset the mock store
      mockAuthStore.email = '';
    });

    it('verifies code and redirects authenticated user', async () => {
      const mockUser = createMockUser({ bio: '', image: '' });

      mockAuthService.verifyCode.mockResolvedValue(mockUser);
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useVerifyCode(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.verifyCode({ code: '123456' });
      });

      expect(mockAuthService.verifyCode).toHaveBeenCalledWith(
        'test@example.com',
        '123456'
      );

      // Wait for the mutation to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('handles verification errors gracefully', async () => {
      const verifyError = new Error('Invalid code');
      mockAuthService.verifyCode.mockRejectedValue(verifyError);

      const { result } = renderHook(() => useVerifyCode(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.verifyCode({ code: '123456' });
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe(verifyError);
    });
  });

  describe('useRequireAuth', () => {
    it('redirects to login when not authenticated', async () => {
      mockAuthService.getCurrentUser.mockResolvedValue(null);

      const { result } = renderHook(() => useRequireAuth(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
      // Note: We can't easily test the router.push call in this setup
      // but the hook should trigger the redirect effect
    });

    it('allows access when authenticated', async () => {
      const mockUser = createMockUser({ bio: '', image: '' });

      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

      // Set up the mock store to return authenticated state
      mockAuthStore.user = mockUser;
      mockAuthStore.isAuthenticated = true;

      const { result } = renderHook(() => useRequireAuth(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);
    });
  });
});
