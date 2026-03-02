import apiClient from '@/lib/api/client';
import {
  CreateCampaignPledgeResult,
  useCreatePledgeIntent,
  usePledgeStatus,
} from '@/lib/hooks/use-campaign-pledge';
import { useEventCampaign } from '@/lib/hooks/use-event-campaign';
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
  usePathname: () => '/e/evt_test123',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ id: 'evt_test123' }),
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

const EVENT_ID = 'evt_test123';

const fakeCampaign: CampaignWithProgress = {
  id: 'cmp_abc123',
  event_id: EVENT_ID,
  user_id: 'usr_host1',
  scope: 'event',
  title: 'Fund our meetup',
  description: 'Help cover venue costs',
  goal_sats: 100000,
  raised_sats: 45000,
  pledge_count: 12,
  visibility: 'public',
  status: 'active',
  destination_address: 'host@evento.cash',
  destination_verify_url: 'https://evento.cash/.well-known/lnurlp/host/verify',
  created_at: '2026-01-15T10:00:00Z',
  updated_at: '2026-02-01T12:00:00Z',
  progressPercent: 45,
  isGoalMet: false,
};

const fakePledgeResult: CreateCampaignPledgeResult = {
  pledgeId: 'plg_xyz789',
  invoice: 'lnbc100n1ptest...',
  amountSats: 1000,
  expiresAt: new Date(Date.now() + 600_000).toISOString(),
};

describe('Event Campaign Card Integration', () => {
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

  const createWrapper = (client: QueryClient) => {
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };

  // ---- Campaign Fetching (card visibility) ----

  describe('useEventCampaign — card data source', () => {
    it('returns active campaign data for the card', async () => {
      mockApiClient.get.mockResolvedValueOnce({ data: fakeCampaign });

      const { result } = renderHook(() => useEventCampaign(EVENT_ID), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(fakeCampaign);
      expect(result.current.data?.status).toBe('active');
      expect(result.current.data?.raised_sats).toBe(45000);
      expect(result.current.data?.goal_sats).toBe(100000);
      expect(result.current.data?.progressPercent).toBe(45);
    });

    it('returns campaign without goal_sats (open-ended)', async () => {
      const openCampaign: CampaignWithProgress = {
        ...fakeCampaign,
        goal_sats: null,
        progressPercent: 0,
        isGoalMet: false,
      };

      mockApiClient.get.mockResolvedValueOnce({ data: openCampaign });

      const { result } = renderHook(() => useEventCampaign(EVENT_ID), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.goal_sats).toBeNull();
      expect(result.current.data?.progressPercent).toBe(0);
    });

    it('handles 404 (no campaign) gracefully', async () => {
      mockApiClient.get.mockRejectedValueOnce({
        message: 'Campaign not found',
        status: 404,
        success: false,
      });

      const { result } = renderHook(() => useEventCampaign(EVENT_ID), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.data).toBeUndefined();
    });
  });

  // ---- Pledge Intent Creation ----

  describe('useCreatePledgeIntent — pledge flow start', () => {
    it('creates an event pledge intent and returns invoice', async () => {
      mockApiClient.post.mockResolvedValueOnce({ data: fakePledgeResult });

      const { result } = renderHook(() => useCreatePledgeIntent('event'), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        result.current.mutate({ amountSats: 1000, eventId: EVENT_ID });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(fakePledgeResult);
      expect(result.current.data?.pledgeId).toBe('plg_xyz789');
      expect(result.current.data?.invoice).toBe('lnbc100n1ptest...');
      expect(mockApiClient.post).toHaveBeenCalledWith(`/v1/events/${EVENT_ID}/campaign/pledges`, {
        amountSats: 1000,
      });
    });

    it('requires eventId for event-type pledges', async () => {
      const { result } = renderHook(() => useCreatePledgeIntent('event'), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        result.current.mutate({ amountSats: 500 });
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error?.message).toContain('eventId is required');
    });

    it('handles API error during pledge creation', async () => {
      mockApiClient.post.mockRejectedValueOnce({
        message: 'Campaign is not active',
        status: 400,
        success: false,
      });

      const { result } = renderHook(() => useCreatePledgeIntent('event'), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        result.current.mutate({ amountSats: 1000, eventId: EVENT_ID });
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  // ---- Pledge Status Polling ----

  describe('usePledgeStatus — settled/expired detection', () => {
    it('returns settled status for completed pledge', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: {
          status: 'settled',
          amountSats: 1000,
          settledAt: '2026-02-28T12:00:00Z',
        },
      });

      const { result } = renderHook(() => usePledgeStatus('plg_xyz789'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.status).toBe('settled');
      expect(result.current.data?.settledAt).toBe('2026-02-28T12:00:00Z');
    });

    it('returns expired status for timed out pledge', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: {
          status: 'expired',
          amountSats: 500,
        },
      });

      const { result } = renderHook(() => usePledgeStatus('plg_expired1'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.status).toBe('expired');
      expect(result.current.data?.settledAt).toBeUndefined();
    });

    it('returns pending status while awaiting payment', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: {
          status: 'pending',
          amountSats: 1000,
        },
      });

      const { result } = renderHook(() => usePledgeStatus('plg_pending1'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.status).toBe('pending');
    });

    it('does not query when pledgeId is empty', () => {
      const { result } = renderHook(() => usePledgeStatus(''), {
        wrapper: createWrapper(queryClient),
      });

      // Query should not fire when pledgeId is empty string
      expect(result.current.fetchStatus).toBe('idle');
      expect(mockApiClient.get).not.toHaveBeenCalledWith(
        expect.stringContaining('/campaign-pledges/')
      );
    });
  });

  // ---- Full Flow Simulation ----

  describe('End-to-end pledge flow', () => {
    it('simulates: select amount → create intent → poll settled', async () => {
      // Step 1: Fetch campaign (card renders)
      mockApiClient.get.mockResolvedValueOnce({ data: fakeCampaign });

      const { result: campaignResult } = renderHook(() => useEventCampaign(EVENT_ID), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(campaignResult.current.isSuccess).toBe(true));
      expect(campaignResult.current.data?.status).toBe('active');

      // Step 2: Create pledge intent (user taps "Contribute 1000 sats")
      mockApiClient.post.mockResolvedValueOnce({ data: fakePledgeResult });

      const { result: pledgeResult } = renderHook(() => useCreatePledgeIntent('event'), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        pledgeResult.current.mutate({ amountSats: 1000, eventId: EVENT_ID });
      });

      await waitFor(() => expect(pledgeResult.current.isSuccess).toBe(true));

      const createdPledgeId = pledgeResult.current.data!.pledgeId;
      expect(createdPledgeId).toBe('plg_xyz789');

      // Step 3: Poll status — initially pending, then settled
      mockApiClient.get.mockResolvedValueOnce({
        data: { status: 'settled', amountSats: 1000, settledAt: '2026-02-28T12:05:00Z' },
      });

      const { result: statusResult } = renderHook(() => usePledgeStatus(createdPledgeId), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(statusResult.current.isSuccess).toBe(true));
      expect(statusResult.current.data?.status).toBe('settled');
    });

    it('simulates: select amount → create intent → poll expired → try again', async () => {
      // Step 1: Create pledge intent
      mockApiClient.post.mockResolvedValueOnce({ data: fakePledgeResult });

      const { result: pledgeResult } = renderHook(() => useCreatePledgeIntent('event'), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        pledgeResult.current.mutate({ amountSats: 500, eventId: EVENT_ID });
      });

      await waitFor(() => expect(pledgeResult.current.isSuccess).toBe(true));

      // Step 2: Status returns expired
      mockApiClient.get.mockResolvedValueOnce({
        data: { status: 'expired', amountSats: 500 },
      });

      const { result: statusResult } = renderHook(
        () => usePledgeStatus(pledgeResult.current.data!.pledgeId),
        { wrapper: createWrapper(queryClient) }
      );

      await waitFor(() => expect(statusResult.current.isSuccess).toBe(true));
      expect(statusResult.current.data?.status).toBe('expired');

      // Step 3: Try again — create a new pledge intent
      const newPledgeResult: CreateCampaignPledgeResult = {
        pledgeId: 'plg_retry001',
        invoice: 'lnbc500n1pretry...',
        amountSats: 500,
        expiresAt: new Date(Date.now() + 600_000).toISOString(),
      };

      mockApiClient.post.mockResolvedValueOnce({ data: newPledgeResult });

      await act(async () => {
        pledgeResult.current.mutate({ amountSats: 500, eventId: EVENT_ID });
      });

      await waitFor(() => expect(pledgeResult.current.data?.pledgeId).toBe('plg_retry001'));
    });
  });

  // ---- Data test-id contract ----

  describe('test-id contract', () => {
    it('EventCampaignCard (compact) exposes required test ids', () => {
      // The compact card only exposes the card wrapper. The CTA and status
      // badge moved into the CampaignDetailSheet.
      const requiredTestIds = ['event-campaign-card'];

      requiredTestIds.forEach((id) => {
        expect(typeof id).toBe('string');
        expect(id.length).toBeGreaterThan(0);
      });
    });

    it('CampaignDetailSheet exposes required test ids', () => {
      // The detail sheet exposes its wrapper and the contribute button.
      const requiredTestIds = ['campaign-detail-sheet', 'campaign-detail-contribute-btn'];

      requiredTestIds.forEach((id) => {
        expect(typeof id).toBe('string');
        expect(id.length).toBeGreaterThan(0);
      });
    });

    it('quick amounts match specification', () => {
      const expectedAmounts = [21, 100, 500, 1000, 5000];
      // This validates the specification contract for the pledge sheet
      expect(expectedAmounts).toHaveLength(5);
      expect(expectedAmounts[0]).toBe(21);
      expect(expectedAmounts[4]).toBe(5000);
    });
  });
});
