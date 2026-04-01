import { authService, UnauthenticatedError } from '@/lib/services/auth';

// Mock dependencies
const mockGetSession = jest.fn();
const mockGetUser = jest.fn();

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getSession: () => mockGetSession(),
      getUser: () => mockGetUser(),
    },
  }),
}));

jest.mock('@/lib/api/client', () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

describe('authService.getCurrentUser – session fallback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws UnauthenticatedError when getSession is null and getUser returns no user and no error', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    await expect(authService.getCurrentUser({ requireSession: true })).rejects.toThrow(
      UnauthenticatedError
    );
  });

  it('proceeds to backend call when getSession is null but getUser finds a user', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'usr_123' } },
      error: null,
    });

    const mockApiClient = require('@/lib/api/client').apiClient;
    mockApiClient.get.mockResolvedValue({
      data: [{ id: 'usr_123', username: 'test', name: 'Test' }],
    });

    const result = await authService.getCurrentUser({ requireSession: true });

    expect(mockApiClient.get).toHaveBeenCalledWith('/v1/user');
    expect(result).toEqual({ id: 'usr_123', username: 'test', name: 'Test' });
  });

  it('does not throw UnauthenticatedError when getUser itself fails transiently', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Network request failed', status: 500 },
    });

    await expect(authService.getCurrentUser({ requireSession: true })).rejects.not.toThrow(
      UnauthenticatedError
    );

    await expect(authService.getCurrentUser({ requireSession: true })).rejects.toMatchObject({
      message: 'Network request failed',
    });
  });

  it('throws UnauthenticatedError for backend 401 on normal path', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { access_token: 'tok' } } });

    const mockApiClient = require('@/lib/api/client').apiClient;
    mockApiClient.get.mockRejectedValue({ status: 401, message: 'Unauthorized' });

    await expect(authService.getCurrentUser({ requireSession: true })).rejects.toThrow(
      UnauthenticatedError
    );
  });

  it('does not convert backend 401 to UnauthenticatedError when session is settling', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'usr_123' } },
      error: null,
    });

    const mockApiClient = require('@/lib/api/client').apiClient;
    mockApiClient.get.mockRejectedValue({ status: 401, message: 'Unauthorized' });

    await expect(authService.getCurrentUser({ requireSession: true })).rejects.not.toThrow(
      UnauthenticatedError
    );
    await expect(authService.getCurrentUser({ requireSession: true })).rejects.toMatchObject({
      status: 401,
      message: 'Unauthorized',
    });
  });

  it('returns null without calling getUser when requireSession is false', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    const result = await authService.getCurrentUser({ requireSession: false });

    expect(result).toBeNull();
    expect(mockGetUser).not.toHaveBeenCalled();
  });
});

describe('authService.tryGetCurrentUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns settled: true with user data on success', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { access_token: 'tok' } } });

    const mockApiClient = require('@/lib/api/client').apiClient;
    mockApiClient.get.mockResolvedValue({
      data: [{ id: 'usr_123', username: 'test', name: 'Test' }],
    });

    const result = await authService.tryGetCurrentUser();

    expect(result.settled).toBe(true);
    expect(result.user).toEqual({ id: 'usr_123', username: 'test', name: 'Test' });
  });

  it('returns settled: true with null when backend has no user row', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { access_token: 'tok' } } });

    const mockApiClient = require('@/lib/api/client').apiClient;
    mockApiClient.get.mockResolvedValue({ data: [] });

    const result = await authService.tryGetCurrentUser();

    expect(result.settled).toBe(true);
    expect(result.user).toBeNull();
  });

  it('returns settled: false when no session exists (confirmed logout caught)', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await authService.tryGetCurrentUser();

    expect(result.settled).toBe(false);
    expect(result.user).toBeNull();
  });

  it('returns settled: false on transient backend error', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { access_token: 'tok' } } });

    const mockApiClient = require('@/lib/api/client').apiClient;
    mockApiClient.get.mockRejectedValue(new Error('Network Error'));

    const result = await authService.tryGetCurrentUser();

    expect(result.settled).toBe(false);
    expect(result.user).toBeNull();
  });

  it('returns settled: false on backend 401', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { access_token: 'tok' } } });

    const mockApiClient = require('@/lib/api/client').apiClient;
    mockApiClient.get.mockRejectedValue({ status: 401, message: 'Unauthorized' });

    const result = await authService.tryGetCurrentUser();

    expect(result.settled).toBe(false);
    expect(result.user).toBeNull();
  });
});
