import apiClient from '@/lib/api/client';
import {
  CreateCampaignPledgeResult,
  useCreatePledgeIntent,
  usePledgeStatus,
} from '@/lib/hooks/use-campaign-pledge';
import { useCreateEventCampaign, useUpdateEventCampaign } from '@/lib/hooks/use-event-campaign';
import { useCreateProfileCampaign } from '@/lib/hooks/use-profile-campaign';
import { CampaignWithProgress } from '@/lib/types/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';

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

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/e/evt_task11/manage/crowdfunding',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ id: 'evt_task11', username: 'alice' }),
}));

jest.mock('@/lib/api/client', () => {
  const mock = {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };
  return { __esModule: true, default: mock, apiClient: mock };
});

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

const EVENT_ID = 'evt_task11';
const USERNAME = 'alice';
const FEED_ALLOWED_KEYS = ['amount_sats', 'payer_avatar', 'payer_username', 'settled_at'];
const FEED_FORBIDDEN_KEYS = ['payment_hash', 'preimage', 'verify_url', 'bolt11_invoice'];

const baseEventCampaign: CampaignWithProgress = {
  id: 'cmp_event_task11',
  event_id: EVENT_ID,
  user_id: 'usr_host_1',
  scope: 'event',
  title: 'Event campaign',
  description: 'Fund the event',
  goal_sats: 100000,
  raised_sats: 21000,
  pledge_count: 2,
  visibility: 'public',
  status: 'active',
  destination_address: 'host@evento.cash',
  destination_verify_url: 'https://evento.cash/.well-known/lnurlp/host/verify',
  created_at: '2026-02-28T10:00:00.000Z',
  updated_at: '2026-02-28T10:00:00.000Z',
  progressPercent: 21,
  isGoalMet: false,
};

const baseProfileCampaign: CampaignWithProgress = {
  id: 'cmp_profile_task11',
  event_id: null,
  user_id: 'usr_alice_1',
  scope: 'profile',
  title: 'Profile campaign',
  description: 'Support my work',
  goal_sats: 250000,
  raised_sats: 50000,
  pledge_count: 4,
  visibility: 'public',
  status: 'active',
  destination_address: 'alice@evento.cash',
  destination_verify_url: 'https://evento.cash/.well-known/lnurlp/alice/verify',
  created_at: '2026-02-28T10:00:00.000Z',
  updated_at: '2026-02-28T10:00:00.000Z',
  progressPercent: 20,
  isGoalMet: false,
};

describe('Campaign end-to-end integration flow', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    jest.clearAllMocks();

    mockApiClient.post.mockImplementation((url, payload) => {
      const body = (payload ?? {}) as Record<string, unknown>;

      if (url === `/v1/events/${EVENT_ID}/campaign`) {
        return Promise.resolve({
          data: {
            ...baseEventCampaign,
            title: (body.title as string) || baseEventCampaign.title,
            description: (body.description as string) || baseEventCampaign.description,
            goal_sats:
              typeof body.goalSats === 'number' ? body.goalSats : baseEventCampaign.goal_sats,
            visibility: (body.visibility as 'public' | 'private') || baseEventCampaign.visibility,
            status: (body.status as 'active' | 'paused' | 'closed') || baseEventCampaign.status,
          },
        });
      }

      if (url === `/v1/events/${EVENT_ID}/campaign/pledges`) {
        const result: CreateCampaignPledgeResult = {
          pledgeId: 'plg_event_settled',
          invoice: 'lnbc2100n1peventflow',
          amountSats: Number(body.amountSats || 2100),
          expiresAt: '2026-02-28T12:10:00.000Z',
        };
        return Promise.resolve({ data: result });
      }

      if (url === '/v1/user/campaign') {
        return Promise.resolve({
          data: {
            ...baseProfileCampaign,
            title: (body.title as string) || baseProfileCampaign.title,
            description: (body.description as string) || baseProfileCampaign.description,
            goal_sats:
              typeof body.goalSats === 'number' ? body.goalSats : baseProfileCampaign.goal_sats,
            visibility: (body.visibility as 'public' | 'private') || baseProfileCampaign.visibility,
            status: (body.status as 'active' | 'paused' | 'closed') || baseProfileCampaign.status,
          },
        });
      }

      if (url === `/v1/users/${USERNAME}/campaign/pledges`) {
        const result: CreateCampaignPledgeResult = {
          pledgeId: 'plg_profile_settled',
          invoice: 'lnbc500n1pprofileflow',
          amountSats: Number(body.amountSats || 500),
          expiresAt: '2026-02-28T12:10:00.000Z',
        };
        return Promise.resolve({ data: result });
      }

      return Promise.reject(new Error(`Unhandled POST url: ${url}`));
    });

    mockApiClient.patch.mockImplementation((url, payload) => {
      const body = (payload ?? {}) as Record<string, unknown>;

      if (url === `/v1/events/${EVENT_ID}/campaign`) {
        return Promise.resolve({
          data: {
            ...baseEventCampaign,
            title: (body.title as string) || baseEventCampaign.title,
            description: (body.description as string) || baseEventCampaign.description,
            goal_sats:
              typeof body.goal_sats === 'number' ? body.goal_sats : baseEventCampaign.goal_sats,
            visibility: (body.visibility as 'public' | 'private') || baseEventCampaign.visibility,
            status: (body.status as 'active' | 'paused' | 'closed') || baseEventCampaign.status,
          },
        });
      }

      return Promise.reject(new Error(`Unhandled PATCH url: ${url}`));
    });

    mockApiClient.get.mockImplementation((url) => {
      if (url === '/v1/campaign-pledges/plg_event_settled/status') {
        return Promise.resolve({
          data: {
            status: 'settled',
            amountSats: 2100,
            settledAt: '2026-02-28T12:00:00.000Z',
          },
        });
      }

      if (url === '/v1/campaign-pledges/plg_profile_settled/status') {
        return Promise.resolve({
          data: {
            status: 'settled',
            amountSats: 500,
            settledAt: '2026-02-28T12:01:00.000Z',
          },
        });
      }

      if (url === `/v1/events/${EVENT_ID}/campaign/feed`) {
        return Promise.resolve({
          data: {
            success: true,
            message: 'Campaign feed fetched successfully.',
            data: [
              {
                payer_username: 'satsfan',
                payer_avatar: 'https://example.com/avatar/satsfan.png',
                amount_sats: 2100,
                settled_at: '2026-02-28T12:00:00.000Z',
              },
            ],
          },
        });
      }

      if (url === `/v1/users/${USERNAME}/campaign/feed`) {
        return Promise.resolve({
          data: {
            success: true,
            message: 'Campaign feed fetched successfully.',
            data: [
              {
                payer_username: 'anon',
                payer_avatar: null,
                amount_sats: 500,
                settled_at: '2026-02-28T12:01:00.000Z',
              },
            ],
          },
        });
      }

      return Promise.reject(new Error(`Unhandled GET url: ${url}`));
    });
  });

  const createWrapper = (client: QueryClient) => {
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };

  it('event campaign flow: create, configure, pledge, settle, and feed safety', async () => {
    const { result: createCampaign } = renderHook(() => useCreateEventCampaign(EVENT_ID), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await createCampaign.current.mutateAsync({
        title: 'Ship event campaign',
        description: 'Create + configure + pledge + settle',
        goalSats: 100000,
        visibility: 'public',
        status: 'active',
      });
    });
    await waitFor(() => expect(createCampaign.current.isSuccess).toBe(true));

    expect(createCampaign.current.data?.id).toBe('cmp_event_task11');
    expect(mockApiClient.post).toHaveBeenCalledWith(`/v1/events/${EVENT_ID}/campaign`, {
      title: 'Ship event campaign',
      description: 'Create + configure + pledge + settle',
      goalSats: 100000,
      visibility: 'public',
      status: 'active',
    });

    const { result: configureCampaign } = renderHook(() => useUpdateEventCampaign(EVENT_ID), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await configureCampaign.current.mutateAsync({
        title: 'Ship event campaign v2',
        goalSats: 125000,
        status: 'paused',
      });
    });
    await waitFor(() => expect(configureCampaign.current.isSuccess).toBe(true));

    expect(configureCampaign.current.data?.status).toBe('paused');
    expect(mockApiClient.patch).toHaveBeenCalledWith(`/v1/events/${EVENT_ID}/campaign`, {
      title: 'Ship event campaign v2',
      goal_sats: 125000,
      status: 'paused',
    });

    const { result: createPledge } = renderHook(() => useCreatePledgeIntent('event'), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await createPledge.current.mutateAsync({ eventId: EVENT_ID, amountSats: 2100 });
    });
    await waitFor(() => expect(createPledge.current.isSuccess).toBe(true));

    expect(createPledge.current.data?.pledgeId).toBe('plg_event_settled');
    expect(mockApiClient.post).toHaveBeenCalledWith(`/v1/events/${EVENT_ID}/campaign/pledges`, {
      amountSats: 2100,
    });

    const { result: pledgeStatus } = renderHook(
      () => usePledgeStatus(createPledge.current.data?.pledgeId || ''),
      {
        wrapper: createWrapper(queryClient),
      }
    );

    await waitFor(() => expect(pledgeStatus.current.isSuccess).toBe(true));
    expect(pledgeStatus.current.data?.status).toBe('settled');
    expect(pledgeStatus.current.data?.settledAt).toBe('2026-02-28T12:00:00.000Z');

    const eventFeedResponse = await mockApiClient.get(`/v1/events/${EVENT_ID}/campaign/feed`);
    const eventFeed = eventFeedResponse.data.data as Array<Record<string, unknown>>;

    expect(Array.isArray(eventFeed)).toBe(true);
    expect(eventFeed.length).toBeGreaterThan(0);

    for (const item of eventFeed) {
      expect(Object.keys(item).sort()).toEqual(FEED_ALLOWED_KEYS);
      for (const forbidden of FEED_FORBIDDEN_KEYS) {
        expect(item[forbidden]).toBeUndefined();
      }
    }
  });

  it('profile campaign flow: create, pledge, settle, and feed safety', async () => {
    const { result: createCampaign } = renderHook(() => useCreateProfileCampaign(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await createCampaign.current.mutateAsync({
        title: 'Profile support',
        description: 'Support profile campaign',
        goalSats: 250000,
        visibility: 'public',
        status: 'active',
      });
    });
    await waitFor(() => expect(createCampaign.current.isSuccess).toBe(true));

    expect(createCampaign.current.data?.id).toBe('cmp_profile_task11');
    expect(mockApiClient.post).toHaveBeenCalledWith('/v1/user/campaign', {
      title: 'Profile support',
      description: 'Support profile campaign',
      goalSats: 250000,
      visibility: 'public',
      status: 'active',
    });

    const { result: createPledge } = renderHook(() => useCreatePledgeIntent('profile'), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await createPledge.current.mutateAsync({ amountSats: 500, username: USERNAME });
    });
    await waitFor(() => expect(createPledge.current.isSuccess).toBe(true));

    expect(createPledge.current.data?.pledgeId).toBe('plg_profile_settled');
    expect(mockApiClient.post).toHaveBeenCalledWith(`/v1/users/${USERNAME}/campaign/pledges`, {
      amountSats: 500,
    });

    const { result: pledgeStatus } = renderHook(
      () => usePledgeStatus(createPledge.current.data?.pledgeId || ''),
      {
        wrapper: createWrapper(queryClient),
      }
    );

    await waitFor(() => expect(pledgeStatus.current.isSuccess).toBe(true));
    expect(pledgeStatus.current.data?.status).toBe('settled');
    expect(pledgeStatus.current.data?.settledAt).toBe('2026-02-28T12:01:00.000Z');

    const profileFeedResponse = await mockApiClient.get(`/v1/users/${USERNAME}/campaign/feed`);
    const profileFeed = profileFeedResponse.data.data as Array<Record<string, unknown>>;

    expect(Array.isArray(profileFeed)).toBe(true);
    expect(profileFeed.length).toBeGreaterThan(0);

    for (const item of profileFeed) {
      expect(Object.keys(item).sort()).toEqual(FEED_ALLOWED_KEYS);
      for (const forbidden of FEED_FORBIDDEN_KEYS) {
        expect(item[forbidden]).toBeUndefined();
      }
    }
  });
});
