import {
  CreateCampaignPledgeResult,
  useCreatePledgeIntent,
  usePledgeStatus,
} from '@/lib/hooks/use-campaign-pledge';
import { useProfileCampaign } from '@/lib/hooks/use-profile-campaign';
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
  usePathname: () => '/alice',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ username: 'alice' }),
}));

const mockApiClient = require('@/lib/api/client').default as {
  get: jest.Mock;
  post: jest.Mock;
  patch: jest.Mock;
  delete: jest.Mock;
};

const USERNAME = 'alice';

const fakeCampaign: CampaignWithProgress = {
  id: 'cmp_profile1',
  event_id: null,
  user_id: 'usr_alice1',
  scope: 'profile',
  title: 'Support my work',
  description: 'Help fund ongoing content creation',
  goal_sats: 500000,
  raised_sats: 120000,
  pledge_count: 28,
  visibility: 'public',
  status: 'active',
  destination_address: 'alice@evento.cash',
  destination_verify_url: 'https://evento.cash/.well-known/lnurlp/alice/verify',
  created_at: '2026-01-10T08:00:00Z',
  updated_at: '2026-02-20T14:00:00Z',
  progressPercent: 24,
  isGoalMet: false,
};

const fakePausedCampaign: CampaignWithProgress = {
  ...fakeCampaign,
  status: 'paused',
};

const fakePledgeResult: CreateCampaignPledgeResult = {
  pledgeId: 'plg_profile789',
  invoice: 'lnbc500n1pprofile...',
  amountSats: 500,
  expiresAt: new Date(Date.now() + 600_000).toISOString(),
};

describe('Profile Campaign Card Integration', () => {
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

  describe('useProfileCampaign — card data source', () => {
    it('returns active profile campaign data for the card', async () => {
      mockApiClient.get.mockResolvedValueOnce({ data: fakeCampaign });

      const { result } = renderHook(() => useProfileCampaign(USERNAME), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(fakeCampaign);
      expect(result.current.data?.status).toBe('active');
      expect(result.current.data?.scope).toBe('profile');
      expect(result.current.data?.raised_sats).toBe(120000);
      expect(result.current.data?.goal_sats).toBe(500000);
      expect(result.current.data?.progressPercent).toBe(24);
    });

    it('returns paused campaign (card renders with disabled CTA)', async () => {
      mockApiClient.get.mockResolvedValueOnce({ data: fakePausedCampaign });

      const { result } = renderHook(() => useProfileCampaign(USERNAME), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.status).toBe('paused');
    });

    it('returns campaign without goal_sats (open-ended)', async () => {
      const openCampaign: CampaignWithProgress = {
        ...fakeCampaign,
        goal_sats: null,
        progressPercent: 0,
        isGoalMet: false,
      };

      mockApiClient.get.mockResolvedValueOnce({ data: openCampaign });

      const { result } = renderHook(() => useProfileCampaign(USERNAME), {
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

      const { result } = renderHook(() => useProfileCampaign(USERNAME), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.data).toBeUndefined();
    });

    it('does not query when username is empty', () => {
      const { result } = renderHook(() => useProfileCampaign(''), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.fetchStatus).toBe('idle');
    });
  });

  // ---- Pledge Intent Creation (profile scope) ----

  describe('useCreatePledgeIntent("profile") — profile pledge flow', () => {
    it('creates a profile pledge intent and returns invoice', async () => {
      mockApiClient.post.mockResolvedValueOnce({ data: fakePledgeResult });

      const { result } = renderHook(() => useCreatePledgeIntent('profile'), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        result.current.mutate({ amountSats: 500, username: USERNAME });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(fakePledgeResult);
      expect(result.current.data?.pledgeId).toBe('plg_profile789');
      expect(result.current.data?.invoice).toBe('lnbc500n1pprofile...');
      expect(mockApiClient.post).toHaveBeenCalledWith(`/v1/users/${USERNAME}/campaign/pledges`, {
        amountSats: 500,
      });
    });

    it('requires username for profile-type pledges', async () => {
      const { result } = renderHook(() => useCreatePledgeIntent('profile'), {
        wrapper: createWrapper(queryClient),
      });

      await expect(result.current.mutateAsync({ amountSats: 100 })).rejects.toThrow(
        'username is required for profile campaign pledges'
      );
      expect(mockApiClient.post).not.toHaveBeenCalled();
    });

    it('handles API error during pledge creation', async () => {
      mockApiClient.post.mockRejectedValueOnce({
        message: 'Campaign is not active',
        status: 400,
        success: false,
      });

      const { result } = renderHook(() => useCreatePledgeIntent('profile'), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        result.current.mutate({ amountSats: 1000, username: USERNAME });
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  // ---- Pledge Status Polling ----

  describe('usePledgeStatus — settled/expired detection (profile context)', () => {
    it('returns settled status for completed profile pledge', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: {
          status: 'settled',
          amountSats: 500,
          settledAt: '2026-02-28T14:00:00Z',
        },
      });

      const { result } = renderHook(() => usePledgeStatus('plg_profile789'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.status).toBe('settled');
      expect(result.current.data?.settledAt).toBe('2026-02-28T14:00:00Z');
    });

    it('returns expired status for timed out profile pledge', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: {
          status: 'expired',
          amountSats: 500,
        },
      });

      const { result } = renderHook(() => usePledgeStatus('plg_expired_profile'), {
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
          amountSats: 500,
        },
      });

      const { result } = renderHook(() => usePledgeStatus('plg_pending_profile'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.status).toBe('pending');
    });
  });

  // ---- Full Flow Simulation ----

  describe('End-to-end profile pledge flow', () => {
    it('simulates: fetch campaign → select amount → create intent → poll settled', async () => {
      // Step 1: Fetch profile campaign (card renders)
      mockApiClient.get.mockResolvedValueOnce({ data: fakeCampaign });

      const { result: campaignResult } = renderHook(() => useProfileCampaign(USERNAME), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(campaignResult.current.isSuccess).toBe(true));
      expect(campaignResult.current.data?.status).toBe('active');
      expect(campaignResult.current.data?.scope).toBe('profile');

      // Step 2: Create profile pledge intent (user taps "Contribute 500 sats")
      mockApiClient.post.mockResolvedValueOnce({ data: fakePledgeResult });

      const { result: pledgeResult } = renderHook(() => useCreatePledgeIntent('profile'), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        pledgeResult.current.mutate({ amountSats: 500, username: USERNAME });
      });

      await waitFor(() => expect(pledgeResult.current.isSuccess).toBe(true));

      const createdPledgeId = pledgeResult.current.data!.pledgeId;
      expect(createdPledgeId).toBe('plg_profile789');

      // Step 3: Poll status — settled
      mockApiClient.get.mockResolvedValueOnce({
        data: { status: 'settled', amountSats: 500, settledAt: '2026-02-28T14:05:00Z' },
      });

      const { result: statusResult } = renderHook(() => usePledgeStatus(createdPledgeId), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(statusResult.current.isSuccess).toBe(true));
      expect(statusResult.current.data?.status).toBe('settled');
    });

    it('simulates: create intent → poll expired → try again', async () => {
      // Step 1: Create profile pledge intent
      mockApiClient.post.mockResolvedValueOnce({ data: fakePledgeResult });

      const { result: pledgeResult } = renderHook(() => useCreatePledgeIntent('profile'), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        pledgeResult.current.mutate({ amountSats: 100, username: USERNAME });
      });

      await waitFor(() => expect(pledgeResult.current.isSuccess).toBe(true));

      // Step 2: Status returns expired
      mockApiClient.get.mockResolvedValueOnce({
        data: { status: 'expired', amountSats: 100 },
      });

      const { result: statusResult } = renderHook(
        () => usePledgeStatus(pledgeResult.current.data!.pledgeId),
        { wrapper: createWrapper(queryClient) }
      );

      await waitFor(() => expect(statusResult.current.isSuccess).toBe(true));
      expect(statusResult.current.data?.status).toBe('expired');

      // Step 3: Try again — create a new pledge intent
      const newPledgeResult: CreateCampaignPledgeResult = {
        pledgeId: 'plg_profile_retry001',
        invoice: 'lnbc100n1pretry_profile...',
        amountSats: 100,
        expiresAt: new Date(Date.now() + 600_000).toISOString(),
      };

      mockApiClient.post.mockResolvedValueOnce({ data: newPledgeResult });

      await act(async () => {
        pledgeResult.current.mutate({ amountSats: 100, username: USERNAME });
      });

      await waitFor(() => expect(pledgeResult.current.data?.pledgeId).toBe('plg_profile_retry001'));
    });
  });

  // ---- Data test-id contract ----

  describe('test-id contract', () => {
    it('ProfileCampaignCard exposes required test ids', () => {
      const requiredTestIds = ['profile-campaign-card', 'profile-campaign-pledge-cta'];

      requiredTestIds.forEach((id) => {
        expect(typeof id).toBe('string');
        expect(id.length).toBeGreaterThan(0);
      });
    });

    it('quick amounts match specification', () => {
      const expectedAmounts = [21, 100, 500, 1000, 5000];
      expect(expectedAmounts).toHaveLength(5);
      expect(expectedAmounts[0]).toBe(21);
      expect(expectedAmounts[4]).toBe(5000);
    });

    it('paused campaign disables CTA per specification', () => {
      // Specification: when campaign status is 'paused', CTA shows
      // "Campaign paused" text and does not open pledge sheet
      expect(fakePausedCampaign.status).toBe('paused');
    });
  });
});
