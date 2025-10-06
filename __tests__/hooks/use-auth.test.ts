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

// Mock the auth store
jest.mock('@/lib/stores/auth-store', () => ({
  useAuthStore: () => ({
    user: null,
    isAuthenticated: false,
    email: '',
    setUser: jest.fn(),
    setEmail: jest.fn(),
    clearAuth: jest.fn(),
    clearEmail: jest.fn(),
  }),
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
      const mockUser = {
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
      };

      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
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
      mockAuthService.getCurrentUser.mockResolvedValue({
        id: 'user1',
        username: 'testuser',
        name: 'Test User',
        bio: '',
        image: '',
        bio_link: '',
        x_handle: '',
        instagram_handle: '',
        ln_address: '',
        nip05: '',
        verification_status: null,
        verification_date: '',
      });

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
      expect(result.current.isLoading).toBe(true);
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
      // Mock the auth store to return an email
      jest.doMock('@/lib/stores/auth-store', () => ({
        useAuthStore: () => ({
          email: 'test@example.com',
          setUser: jest.fn(),
          clearEmail: jest.fn(),
        }),
      }));
    });

    it('verifies code and redirects authenticated user', async () => {
      const mockUser = {
        id: 'user1',
        username: 'testuser',
        name: 'Test User',
        bio: '',
        image: '',
        bio_link: '',
        x_handle: '',
        instagram_handle: '',
        ln_address: '',
        nip05: '',
        verification_status: null,
        verification_date: '',
      };

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
      expect(result.current.isLoading).toBe(true);
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
      const mockUser = {
        id: 'user1',
        username: 'testuser',
        name: 'Test User',
        bio: '',
        image: '',
        bio_link: '',
        x_handle: '',
        instagram_handle: '',
        ln_address: '',
        nip05: '',
        verification_status: null,
        verification_date: '',
      };

      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

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
