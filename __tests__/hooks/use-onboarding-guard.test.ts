import { useAuth } from '@/lib/hooks/use-auth';
import { useOnboardingGuard } from '@/lib/hooks/use-onboarding-guard';
import type { UserDetails } from '@/lib/types/api';
import { isUserOnboarded, validateRedirectUrl } from '@/lib/utils/auth';
import { renderHook, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';

// Mock the dependencies
jest.mock('@/lib/hooks/use-auth');
jest.mock('next/navigation');
jest.mock('@/lib/utils/auth');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockIsUserOnboarded = isUserOnboarded as jest.MockedFunction<typeof isUserOnboarded>;
const mockValidateRedirectUrl = validateRedirectUrl as jest.MockedFunction<
  typeof validateRedirectUrl
>;

// Mock console.log to avoid noise in tests
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

describe('useOnboardingGuard', () => {
  let mockPush: jest.Mock;
  let mockUser: UserDetails;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPush = jest.fn();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    } as ReturnType<typeof useRouter>);

    mockUser = {
      id: 'user_1',
      username: 'testuser',
      name: 'Test User',
      email: 'test@example.com',
      bio: 'Test bio',
      image: 'test-image.jpg',
      verification_status: 'verified',
    };

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        search: '',
        origin: 'https://example.com',
      },
      writable: true,
    });
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
  });

  describe('when user is loading', () => {
    it('returns loading state and does not redirect', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: true,
        isAuthenticated: false,
        email: null,
        checkAuth: jest.fn(),
        logout: jest.fn(),
        isLoggingOut: false,
      });

      const { result } = renderHook(() => useOnboardingGuard());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.needsOnboarding).toBeFalsy();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('when user is not authenticated', () => {
    it('returns not loading and does not redirect', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        email: null,
        checkAuth: jest.fn(),
        logout: jest.fn(),
        isLoggingOut: false,
      });

      const { result } = renderHook(() => useOnboardingGuard());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.needsOnboarding).toBeFalsy();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('when user is authenticated but not onboarded', () => {
    it('returns needs onboarding and does not redirect', () => {
      mockIsUserOnboarded.mockReturnValue(false);
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        email: 'test@example.com',
        checkAuth: jest.fn(),
        logout: jest.fn(),
        isLoggingOut: false,
      });

      const { result } = renderHook(() => useOnboardingGuard());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.needsOnboarding).toBe(true);
      expect(mockPush).not.toHaveBeenCalled();
      expect(mockIsUserOnboarded).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('when user is authenticated and onboarded', () => {
    it('redirects to default URL when no redirect parameter', () => {
      mockIsUserOnboarded.mockReturnValue(true);
      mockValidateRedirectUrl.mockReturnValue('/');
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        email: 'test@example.com',
        checkAuth: jest.fn(),
        logout: jest.fn(),
        isLoggingOut: false,
      });

      const { result } = renderHook(() => useOnboardingGuard());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.needsOnboarding).toBe(false);
      expect(mockValidateRedirectUrl).toHaveBeenCalledWith('/');
      expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('redirects to custom URL from redirect parameter', () => {
      // Mock window.location.search with redirect parameter
      Object.defineProperty(window, 'location', {
        value: {
          search: '?redirect=/dashboard',
          origin: 'https://example.com',
        },
        writable: true,
      });

      mockIsUserOnboarded.mockReturnValue(true);
      mockValidateRedirectUrl.mockReturnValue('/dashboard');
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        email: 'test@example.com',
        checkAuth: jest.fn(),
        logout: jest.fn(),
        isLoggingOut: false,
      });

      const { result } = renderHook(() => useOnboardingGuard());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.needsOnboarding).toBe(false);
      expect(mockValidateRedirectUrl).toHaveBeenCalledWith('/dashboard');
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    it('redirects to validated URL when redirect parameter is invalid', () => {
      // Mock window.location.search with invalid redirect parameter
      Object.defineProperty(window, 'location', {
        value: {
          search: '?redirect=https://malicious.com/steal-data',
          origin: 'https://example.com',
        },
        writable: true,
      });

      mockIsUserOnboarded.mockReturnValue(true);
      mockValidateRedirectUrl.mockReturnValue('/'); // Should return default for invalid URL
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        email: 'test@example.com',
        checkAuth: jest.fn(),
        logout: jest.fn(),
        isLoggingOut: false,
      });

      const { result } = renderHook(() => useOnboardingGuard());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.needsOnboarding).toBe(false);
      expect(mockValidateRedirectUrl).toHaveBeenCalledWith('https://malicious.com/steal-data');
      expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('redirects to validated URL when redirect parameter is empty', () => {
      // Mock window.location.search with empty redirect parameter
      Object.defineProperty(window, 'location', {
        value: {
          search: '?redirect=',
          origin: 'https://example.com',
        },
        writable: true,
      });

      mockIsUserOnboarded.mockReturnValue(true);
      mockValidateRedirectUrl.mockReturnValue('/');
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        email: 'test@example.com',
        checkAuth: jest.fn(),
        logout: jest.fn(),
        isLoggingOut: false,
      });

      const { result } = renderHook(() => useOnboardingGuard());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.needsOnboarding).toBe(false);
      expect(mockValidateRedirectUrl).toHaveBeenCalledWith('/');
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  describe('when user state changes', () => {
    it('handles transition from loading to authenticated and onboarded', async () => {
      // Start with loading state
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: true,
        isAuthenticated: false,
        email: null,
        checkAuth: jest.fn(),
        logout: jest.fn(),
        isLoggingOut: false,
      });

      const { result, rerender } = renderHook(() => useOnboardingGuard());

      expect(result.current.isLoading).toBe(true);
      expect(mockPush).not.toHaveBeenCalled();

      // Update to authenticated and onboarded
      mockIsUserOnboarded.mockReturnValue(true);
      mockValidateRedirectUrl.mockReturnValue('/dashboard');
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        email: 'test@example.com',
        checkAuth: jest.fn(),
        logout: jest.fn(),
        isLoggingOut: false,
      });

      rerender();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.needsOnboarding).toBe(false);
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('handles transition from loading to authenticated but not onboarded', async () => {
      // Start with loading state
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: true,
        isAuthenticated: false,
        email: null,
        checkAuth: jest.fn(),
        logout: jest.fn(),
        isLoggingOut: false,
      });

      const { result, rerender } = renderHook(() => useOnboardingGuard());

      expect(result.current.isLoading).toBe(true);
      expect(mockPush).not.toHaveBeenCalled();

      // Update to authenticated but not onboarded
      mockIsUserOnboarded.mockReturnValue(false);
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        email: 'test@example.com',
        checkAuth: jest.fn(),
        logout: jest.fn(),
        isLoggingOut: false,
      });

      rerender();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.needsOnboarding).toBe(true);
        expect(mockPush).not.toHaveBeenCalled();
      });
    });

    it('handles transition from authenticated to not authenticated', async () => {
      // Start with authenticated and onboarded
      mockIsUserOnboarded.mockReturnValue(true);
      mockValidateRedirectUrl.mockReturnValue('/dashboard');
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        email: 'test@example.com',
        checkAuth: jest.fn(),
        logout: jest.fn(),
        isLoggingOut: false,
      });

      const { result, rerender } = renderHook(() => useOnboardingGuard());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.needsOnboarding).toBe(false);
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });

      // Clear previous calls
      mockPush.mockClear();

      // Update to not authenticated
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        email: null,
        checkAuth: jest.fn(),
        logout: jest.fn(),
        isLoggingOut: false,
      });

      rerender();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.needsOnboarding).toBeFalsy();
        expect(mockPush).not.toHaveBeenCalled();
      });
    });
  });

  describe('edge cases', () => {
    it('handles user with empty username and name', () => {
      const userWithoutOnboarding = {
        ...mockUser,
        username: '',
        name: '',
      };

      mockIsUserOnboarded.mockReturnValue(false);
      mockUseAuth.mockReturnValue({
        user: userWithoutOnboarding,
        isLoading: false,
        isAuthenticated: false,
        email: null,
        checkAuth: jest.fn(),
        logout: jest.fn(),
        isLoggingOut: false,
      });

      const { result } = renderHook(() => useOnboardingGuard());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.needsOnboarding).toBe(true);
      expect(mockIsUserOnboarded).toHaveBeenCalledWith(userWithoutOnboarding);
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('handles user with whitespace-only username and name', () => {
      const userWithWhitespace = {
        ...mockUser,
        username: '   ',
        name: '   ',
      };

      mockIsUserOnboarded.mockReturnValue(false);
      mockUseAuth.mockReturnValue({
        user: userWithWhitespace,
        isLoading: false,
        isAuthenticated: false,
        email: null,
        checkAuth: jest.fn(),
        logout: jest.fn(),
        isLoggingOut: false,
      });

      const { result } = renderHook(() => useOnboardingGuard());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.needsOnboarding).toBe(true);
      expect(mockIsUserOnboarded).toHaveBeenCalledWith(userWithWhitespace);
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('handles user with partial onboarding (only username)', () => {
      const userWithPartialOnboarding = {
        ...mockUser,
        username: 'testuser',
        name: '',
      };

      mockIsUserOnboarded.mockReturnValue(false);
      mockUseAuth.mockReturnValue({
        user: userWithPartialOnboarding,
        isLoading: false,
        isAuthenticated: false,
        email: null,
        checkAuth: jest.fn(),
        logout: jest.fn(),
        isLoggingOut: false,
      });

      const { result } = renderHook(() => useOnboardingGuard());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.needsOnboarding).toBe(true);
      expect(mockIsUserOnboarded).toHaveBeenCalledWith(userWithPartialOnboarding);
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('handles user with partial onboarding (only name)', () => {
      const userWithPartialOnboarding = {
        ...mockUser,
        username: '',
        name: 'Test User',
      };

      mockIsUserOnboarded.mockReturnValue(false);
      mockUseAuth.mockReturnValue({
        user: userWithPartialOnboarding,
        isLoading: false,
        isAuthenticated: false,
        email: null,
        checkAuth: jest.fn(),
        logout: jest.fn(),
        isLoggingOut: false,
      });

      const { result } = renderHook(() => useOnboardingGuard());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.needsOnboarding).toBe(true);
      expect(mockIsUserOnboarded).toHaveBeenCalledWith(userWithPartialOnboarding);
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('handles complex redirect URL with query parameters and hash', () => {
      // Mock window.location.search with complex redirect
      Object.defineProperty(window, 'location', {
        value: {
          search: '?redirect=/events/123?tab=details#comments',
          origin: 'https://example.com',
        },
        writable: true,
      });

      mockIsUserOnboarded.mockReturnValue(true);
      mockValidateRedirectUrl.mockReturnValue('/events/123?tab=details#comments');
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        email: 'test@example.com',
        checkAuth: jest.fn(),
        logout: jest.fn(),
        isLoggingOut: false,
      });

      const { result } = renderHook(() => useOnboardingGuard());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.needsOnboarding).toBe(false);
      expect(mockValidateRedirectUrl).toHaveBeenCalledWith('/events/123?tab=details#comments');
      expect(mockPush).toHaveBeenCalledWith('/events/123?tab=details#comments');
    });

    it('handles multiple redirect attempts', async () => {
      mockIsUserOnboarded.mockReturnValue(true);
      mockValidateRedirectUrl.mockReturnValue('/dashboard');
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        email: 'test@example.com',
        checkAuth: jest.fn(),
        logout: jest.fn(),
        isLoggingOut: false,
      });

      const { result, rerender } = renderHook(() => useOnboardingGuard());

      // First render
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledTimes(1);
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });

      // Re-render with same state
      rerender();

      // Should not call push again
      expect(mockPush).toHaveBeenCalledTimes(1);
    });
  });

  describe('console logging', () => {
    it('does not interfere with console.log calls in auth utils', () => {
      mockIsUserOnboarded.mockImplementation((user) => {
        console.log('isUserOnboarded: Checking user:', user);
        return true;
      });

      mockUseAuth.mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        email: 'test@example.com',
        checkAuth: jest.fn(),
        logout: jest.fn(),
        isLoggingOut: false,
      });

      renderHook(() => useOnboardingGuard());

      expect(mockConsoleLog).toHaveBeenCalledWith('isUserOnboarded: Checking user:', mockUser);
    });
  });
});
