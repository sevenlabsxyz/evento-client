import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';

import {
  AuthRecoveryProvider,
  useRequireAuthForPage,
} from '@/lib/providers/auth-recovery-provider';

const mockGetCurrentUser = jest.fn();
const mockTryGetCurrentUser = jest.fn();
const mockSupabaseGetUser = jest.fn();
const mockSetUser = jest.fn();
const mockClearAuth = jest.fn();

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/e/hub',
}));

jest.mock('@/lib/services/auth', () => {
  class MockUnauthenticatedError extends Error {
    status: number;

    constructor(message = 'Unauthorized') {
      super(message);
      this.name = 'UnauthenticatedError';
      this.status = 401;
    }
  }

  return {
    authService: {
      getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
      tryGetCurrentUser: (...args: unknown[]) => mockTryGetCurrentUser(...args),
    },
    UnauthenticatedError: MockUnauthenticatedError,
  };
});

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: (...args: unknown[]) => mockSupabaseGetUser(...args),
    },
  }),
}));

jest.mock('@/lib/stores/auth-store', () => ({
  useAuthStore: () => ({
    setUser: mockSetUser,
    clearAuth: mockClearAuth,
  }),
}));

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

function createUser(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'usr_123',
    username: 'alice',
    name: 'Alice',
    bio: '',
    image: '',
    bio_link: '',
    x_handle: '',
    instagram_handle: '',
    ln_address: '',
    nip05: '',
    verification_status: null,
    verification_date: '',
    ...overrides,
  };
}

describe('useRequireAuthForPage', () => {
  const pushMock = mockRouter.push as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function Wrapper({ children }: PropsWithChildren) {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return (
      <QueryClientProvider client={queryClient}>
        <AuthRecoveryProvider>{children}</AuthRecoveryProvider>
      </QueryClientProvider>
    );
  }

  it('authenticates the page when the current user is available', async () => {
    mockGetCurrentUser.mockResolvedValue(createUser());

    const { result } = renderHook(
      () => useRequireAuthForPage({ redirectPath: '/e/hub', requireOnboarding: true }),
      {
        wrapper: Wrapper,
      }
    );

    await waitFor(() => {
      expect(result.current.status).toBe('authenticated');
    });

    expect(pushMock).not.toHaveBeenCalled();
    expect(mockSetUser).toHaveBeenCalledWith(expect.objectContaining({ id: 'usr_123' }));
  });

  it('redirects to login when the required session cannot be restored', async () => {
    mockGetCurrentUser.mockRejectedValue({
      name: 'UnauthenticatedError',
      message: 'No session found',
      status: 401,
    });
    mockSupabaseGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const { result } = renderHook(() => useRequireAuthForPage({ redirectPath: '/e/hub' }), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current.status).toBe('redirecting');
    });

    expect(pushMock).toHaveBeenCalledWith('/auth/login?redirect=%2Fe%2Fhub');
    expect(mockClearAuth).toHaveBeenCalled();
  });
});
