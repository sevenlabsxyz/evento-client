import {
  getCampaignPledgePollingInterval,
  useCreatePledgeIntent,
  usePledgeStatus,
} from '@/lib/hooks/use-campaign-pledge';
import {
  updateEventCampaign,
  useEventCampaign,
  useUpdateEventCampaign,
} from '@/lib/hooks/use-event-campaign';
import { useMyCampaign, useProfileCampaign } from '@/lib/hooks/use-profile-campaign';
import { queryKeys } from '@/lib/query-client';
import { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createTestWrapper } from '../setup/test-utils';

jest.mock('@/lib/api/client', () => {
  const mockApiClient = {
    get: jest.fn(),
    post: jest.fn(),
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

import apiClient from '@/lib/api/client';

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('campaign hooks', () => {
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

  it('fetches event campaign with query key factory key', async () => {
    const campaign = {
      id: 'cmp_1',
      event_id: 'evt_1',
      user_id: 'usr_1',
      scope: 'event',
      title: 'Event campaign',
      description: null,
      goal_sats: 100000,
      raised_sats: 5000,
      pledge_count: 1,
      visibility: 'public',
      status: 'active',
      destination_address: 'host@evento.cash',
      destination_verify_url: 'https://verify',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      progressPercent: 5,
      isGoalMet: false,
    };

    mockApiClient.get.mockResolvedValue({ success: true, message: 'ok', data: campaign });

    const { result } = renderHook(() => useEventCampaign('evt_1'), {
      wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApiClient.get).toHaveBeenCalledWith('/v1/events/evt_1/campaign');
    expect(result.current.data).toEqual(campaign);
    expect(queryKeys.eventCampaign('evt_1')).toEqual(['campaigns', 'event', 'evt_1']);
    expect(queryKeys.profileCampaign('satoshi')).toEqual(['campaigns', 'profile', 'satoshi']);
    expect(queryKeys.myCampaign()).toEqual(['campaigns', 'me']);
    expect(queryKeys.campaignFeed('cmp_1')).toEqual(['campaigns', 'cmp_1', 'feed']);
    expect(queryKeys.pledgeStatus('plg_1')).toEqual(['pledges', 'plg_1', 'status']);
  });

  it('fetches profile campaign', async () => {
    const campaign = {
      id: 'cmp_profile',
      event_id: null,
      user_id: 'usr_1',
      scope: 'profile',
      title: 'Profile campaign',
      description: null,
      goal_sats: 200000,
      raised_sats: 1000,
      pledge_count: 2,
      visibility: 'public',
      status: 'active',
      destination_address: 'me@evento.cash',
      destination_verify_url: 'https://verify',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      progressPercent: 1,
      isGoalMet: false,
    };

    mockApiClient.get.mockResolvedValue({ success: true, message: 'ok', data: campaign });

    const { result } = renderHook(() => useProfileCampaign('alice'), {
      wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApiClient.get).toHaveBeenCalledWith('/v1/users/alice/campaign');
    expect(result.current.data).toEqual(campaign);
  });

  it('fetches my campaign', async () => {
    const campaign = {
      id: 'cmp_my',
      event_id: null,
      user_id: 'usr_1',
      scope: 'profile',
      title: 'My campaign',
      description: null,
      goal_sats: 1000,
      raised_sats: 0,
      pledge_count: 0,
      visibility: 'public',
      status: 'active',
      destination_address: 'me@evento.cash',
      destination_verify_url: 'https://verify',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      progressPercent: 0,
      isGoalMet: false,
    };

    mockApiClient.get.mockResolvedValue({ success: true, message: 'ok', data: campaign });

    const { result } = renderHook(() => useMyCampaign(), {
      wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApiClient.get).toHaveBeenCalledWith('/v1/user/campaign');
    expect(result.current.data).toEqual(campaign);
  });

  it('maps goalSats to goal_sats for event campaign updates', async () => {
    const updated = {
      id: 'cmp_1',
      event_id: 'evt_1',
      user_id: 'usr_1',
      scope: 'event',
      title: 'Updated',
      description: null,
      goal_sats: 300000,
      raised_sats: 0,
      pledge_count: 0,
      visibility: 'public',
      status: 'active',
      destination_address: 'host@evento.cash',
      destination_verify_url: 'https://verify',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      progressPercent: 0,
      isGoalMet: false,
    };

    mockApiClient.patch.mockResolvedValue({ success: true, message: 'ok', data: updated });

    await updateEventCampaign('evt_1', { goalSats: 300000, title: 'Updated' });

    expect(mockApiClient.patch).toHaveBeenCalledWith('/v1/events/evt_1/campaign', {
      goal_sats: 300000,
      title: 'Updated',
    });
  });

  it('invalidates event campaign keys after update mutation', async () => {
    mockApiClient.patch.mockResolvedValue({
      success: true,
      message: 'ok',
      data: { id: 'cmp_1' },
    });
    const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateEventCampaign('evt_1'), {
      wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
    });

    await act(async () => {
      await result.current.mutateAsync({ title: 'Updated' });
    });

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.eventCampaign('evt_1'),
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.campaignFeed('cmp_1'),
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.event('evt_1'),
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.campaigns,
    });
  });

  it('creates event pledge intent and invalidates campaign keys', async () => {
    mockApiClient.post.mockResolvedValue({
      success: true,
      message: 'ok',
      data: {
        pledgeId: 'plg_1',
        invoice: 'lnbc1...',
        amountSats: 2000,
        expiresAt: '2026-01-01T00:05:00Z',
      },
    });
    const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreatePledgeIntent('event'), {
      wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
    });

    await act(async () => {
      await result.current.mutateAsync({ amountSats: 2000, eventId: 'evt_1' });
    });

    expect(mockApiClient.post).toHaveBeenCalledWith('/v1/events/evt_1/campaign/pledges', {
      amountSats: 2000,
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.eventCampaign('evt_1'),
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.event('evt_1'),
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.pledgeStatus('plg_1'),
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.campaigns,
    });
  });

  it('creates profile pledge intent and invalidates profile campaign keys', async () => {
    mockApiClient.post.mockResolvedValue({
      success: true,
      message: 'ok',
      data: {
        pledgeId: 'plg_profile_1',
        invoice: 'lnbc1...',
        amountSats: 3000,
        expiresAt: '2026-01-01T00:05:00Z',
      },
    });
    const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreatePledgeIntent('profile'), {
      wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
    });

    await act(async () => {
      await result.current.mutateAsync({ amountSats: 3000, username: 'alice' });
    });

    expect(mockApiClient.post).toHaveBeenCalledWith('/v1/users/alice/campaign/pledges', {
      amountSats: 3000,
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.myCampaign(),
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.pledgeStatus('plg_profile_1'),
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.campaigns,
    });
  });

  it('fetches pledge status and disables query when pledgeId is empty', async () => {
    mockApiClient.get.mockResolvedValue({
      success: true,
      message: 'ok',
      data: { status: 'pending', amountSats: 1000 },
    });

    const { result: enabledResult } = renderHook(() => usePledgeStatus('plg_1'), {
      wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
    });

    await waitFor(() => expect(enabledResult.current.isSuccess).toBe(true));
    expect(mockApiClient.get).toHaveBeenCalledWith('/v1/campaign-pledges/plg_1/status');

    mockApiClient.get.mockClear();

    renderHook(() => usePledgeStatus(''), {
      wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
    });

    expect(mockApiClient.get).not.toHaveBeenCalled();
  });

  it('uses adaptive polling schedule for pledge status', () => {
    expect(getCampaignPledgePollingInterval(0, 'pending')).toBe(3000);
    expect(getCampaignPledgePollingInterval(119999, 'pending')).toBe(3000);
    expect(getCampaignPledgePollingInterval(120000, 'pending')).toBe(10000);
    expect(getCampaignPledgePollingInterval(719999, 'pending')).toBe(10000);
    expect(getCampaignPledgePollingInterval(720000, 'pending')).toBe(false);
    expect(getCampaignPledgePollingInterval(1, 'settled')).toBe(false);
  });
});
