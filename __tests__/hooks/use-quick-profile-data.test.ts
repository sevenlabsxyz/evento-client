import { renderHook } from '@testing-library/react';
import { useQuickProfileData } from '@/lib/hooks/use-quick-profile-data';

const useAuthMock = jest.fn();
const useFollowStatusMock = jest.fn();
const useUserEventCountMock = jest.fn();
const useUserFollowersCountMock = jest.fn();
const useUserFollowingCountMock = jest.fn();
const useUserFollowersMock = jest.fn();
const useUserFollowingMock = jest.fn();

jest.mock('@/lib/hooks/use-auth', () => ({
  useAuth: () => useAuthMock(),
}));

jest.mock('@/lib/hooks/use-user-profile', () => ({
  useFollowStatus: (...args: unknown[]) => useFollowStatusMock(...args),
  useUserEventCount: (...args: unknown[]) => useUserEventCountMock(...args),
  useUserFollowersCount: (...args: unknown[]) => useUserFollowersCountMock(...args),
  useUserFollowingCount: (...args: unknown[]) => useUserFollowingCountMock(...args),
  useUserFollowers: (...args: unknown[]) => useUserFollowersMock(...args),
  useUserFollowing: (...args: unknown[]) => useUserFollowingMock(...args),
}));

describe('useQuickProfileData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useFollowStatusMock.mockReturnValue({ data: undefined, isLoading: false, error: null });
    useUserEventCountMock.mockReturnValue({ data: 0, error: null });
    useUserFollowersCountMock.mockReturnValue({ data: 0, error: null });
    useUserFollowingCountMock.mockReturnValue({ data: 0, error: null });
    useUserFollowersMock.mockReturnValue({ data: [], error: null });
    useUserFollowingMock.mockReturnValue({ data: [], error: null });
  });

  it('disables follow-status probes for guests on public surfaces', () => {
    useAuthMock.mockReturnValue({ user: null });

    renderHook(() => useQuickProfileData('user_1'));

    expect(useFollowStatusMock).toHaveBeenCalledWith('user_1', { enabled: false });
  });

  it('enables follow-status probes once a viewer is authenticated', () => {
    useAuthMock.mockReturnValue({ user: { id: 'viewer_1' } });

    renderHook(() => useQuickProfileData('user_2'));

    expect(useFollowStatusMock).toHaveBeenCalledWith('user_2', { enabled: true });
  });
});
