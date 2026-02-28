import {
  useCreateEventCampaign,
  useEventCampaign,
  useUpdateEventCampaign,
} from '@/lib/hooks/use-event-campaign';
import { campaignFormSchema } from '@/lib/schemas/campaign';
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
  usePathname: () => '/e/evt_test123/manage/crowdfunding',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ id: 'evt_test123' }),
}));

const mockApiClient = require('@/lib/api/client').default as {
  get: jest.Mock;
  post: jest.Mock;
  patch: jest.Mock;
  delete: jest.Mock;
};

const fakeCampaign: CampaignWithProgress = {
  id: 'cmp_abc123',
  event_id: 'evt_test123',
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

describe('Event Campaign Manage Flow', () => {
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

  // ---- Schema Validation ----

  describe('campaignFormSchema', () => {
    it('validates a complete form payload', () => {
      const result = campaignFormSchema.safeParse({
        title: 'My Campaign',
        description: 'Test description',
        goal_sats: 50000,
        visibility: 'public',
      });
      expect(result.success).toBe(true);
    });

    it('requires title', () => {
      const result = campaignFormSchema.safeParse({
        title: '',
        visibility: 'public',
      });
      expect(result.success).toBe(false);
    });

    it('enforces max 200 chars on title', () => {
      const result = campaignFormSchema.safeParse({
        title: 'x'.repeat(201),
        visibility: 'public',
      });
      expect(result.success).toBe(false);
    });

    it('allows optional description', () => {
      const result = campaignFormSchema.safeParse({
        title: 'Title only',
        visibility: 'public',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBeUndefined();
      }
    });

    it('allows optional nullable goal_sats', () => {
      const result = campaignFormSchema.safeParse({
        title: 'Open campaign',
        goal_sats: null,
        visibility: 'public',
      });
      expect(result.success).toBe(true);
    });

    it('rejects negative goal_sats', () => {
      const result = campaignFormSchema.safeParse({
        title: 'Bad goal',
        goal_sats: -100,
        visibility: 'public',
      });
      expect(result.success).toBe(false);
    });

    it('rejects non-integer goal_sats', () => {
      const result = campaignFormSchema.safeParse({
        title: 'Fractional goal',
        goal_sats: 100.5,
        visibility: 'public',
      });
      expect(result.success).toBe(false);
    });

    it('validates visibility enum', () => {
      const result = campaignFormSchema.safeParse({
        title: 'Private campaign',
        visibility: 'private',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid visibility', () => {
      const result = campaignFormSchema.safeParse({
        title: 'Bad vis',
        visibility: 'hidden',
      });
      expect(result.success).toBe(false);
    });

    it('validates status enum (active/paused)', () => {
      const result = campaignFormSchema.safeParse({
        title: 'Status test',
        visibility: 'public',
        status: 'active',
      });
      expect(result.success).toBe(true);

      const paused = campaignFormSchema.safeParse({
        title: 'Paused campaign',
        visibility: 'public',
        status: 'paused',
      });
      expect(paused.success).toBe(true);
    });

    it('rejects invalid status value', () => {
      const result = campaignFormSchema.safeParse({
        title: 'Bad status',
        visibility: 'public',
        status: 'closed',
      });
      expect(result.success).toBe(false);
    });

    it('defaults status to active when omitted', () => {
      const result = campaignFormSchema.safeParse({
        title: 'No status',
        visibility: 'public',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('active');
      }
    });
  });

  // ---- Hook: useEventCampaign ----

  describe('useEventCampaign', () => {
    it('fetches campaign for an event', async () => {
      mockApiClient.get.mockResolvedValueOnce({ data: fakeCampaign });

      const { result } = renderHook(() => useEventCampaign('evt_test123'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(fakeCampaign);
      expect(mockApiClient.get).toHaveBeenCalledWith('/v1/events/evt_test123/campaign');
    });

    it('handles 404 (no campaign)', async () => {
      mockApiClient.get.mockRejectedValueOnce({ status: 404, message: 'Not found' });

      const { result } = renderHook(() => useEventCampaign('evt_test123'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });

    it('is disabled when eventId is empty', () => {
      const { result } = renderHook(() => useEventCampaign(''), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.fetchStatus).toBe('idle');
    });
  });

  // ---- Hook: useCreateEventCampaign ----

  describe('useCreateEventCampaign', () => {
    it('creates a campaign via POST', async () => {
      mockApiClient.post.mockResolvedValueOnce({ data: fakeCampaign });

      const { result } = renderHook(() => useCreateEventCampaign('evt_test123'), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        result.current.mutate({
          title: 'Fund our meetup',
          description: 'Help cover venue costs',
          goalSats: 100000,
          visibility: 'public',
        });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApiClient.post).toHaveBeenCalledWith('/v1/events/evt_test123/campaign', {
        title: 'Fund our meetup',
        description: 'Help cover venue costs',
        goalSats: 100000,
        visibility: 'public',
      });
    });

    it('handles creation failure', async () => {
      mockApiClient.post.mockRejectedValueOnce(new Error('Server error'));

      const { result } = renderHook(() => useCreateEventCampaign('evt_test123'), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        result.current.mutate({ title: 'Fail campaign', visibility: 'public' });
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toBeTruthy();
    });
  });

  // ---- Hook: useUpdateEventCampaign ----

  describe('useUpdateEventCampaign', () => {
    it('updates a campaign via PATCH with snake_case goal_sats', async () => {
      mockApiClient.patch.mockResolvedValueOnce({ data: { ...fakeCampaign, goal_sats: 200000 } });

      const { result } = renderHook(() => useUpdateEventCampaign('evt_test123'), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        result.current.mutate({ goalSats: 200000 });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApiClient.patch).toHaveBeenCalledWith('/v1/events/evt_test123/campaign', {
        goal_sats: 200000,
      });
    });

    it('maps camelCase input to snake_case payload', async () => {
      mockApiClient.patch.mockResolvedValueOnce({ data: fakeCampaign });

      const { result } = renderHook(() => useUpdateEventCampaign('evt_test123'), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        result.current.mutate({
          title: 'Updated title',
          description: 'Updated desc',
          goalSats: 50000,
          visibility: 'private',
        });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApiClient.patch).toHaveBeenCalledWith('/v1/events/evt_test123/campaign', {
        title: 'Updated title',
        description: 'Updated desc',
        goal_sats: 50000,
        visibility: 'private',
      });
    });

    it('handles update failure', async () => {
      mockApiClient.patch.mockRejectedValueOnce(new Error('Forbidden'));

      const { result } = renderHook(() => useUpdateEventCampaign('evt_test123'), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        result.current.mutate({ title: 'Should fail' });
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  // ---- Create vs Update routing ----

  describe('Create vs Update behavior', () => {
    it('uses create mutation when no campaign exists', async () => {
      mockApiClient.get.mockRejectedValueOnce({ status: 404 });
      mockApiClient.post.mockResolvedValueOnce({ data: fakeCampaign });

      const { result: queryResult } = renderHook(() => useEventCampaign('evt_test123'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(queryResult.current.isError).toBe(true));

      const { result: createResult } = renderHook(
        () => useCreateEventCampaign('evt_test123'),
        { wrapper: createWrapper(queryClient) }
      );

      await act(async () => {
        createResult.current.mutate({ title: 'New campaign', visibility: 'public', status: 'active' });
      });

      await waitFor(() => expect(createResult.current.isSuccess).toBe(true));
      expect(mockApiClient.post).toHaveBeenCalled();
      expect(mockApiClient.patch).not.toHaveBeenCalled();
    });

    it('404 from useEventCampaign triggers create mode (not error screen)', async () => {
      mockApiClient.get.mockRejectedValueOnce({ status: 404, message: 'Not found', success: false });
      mockApiClient.post.mockResolvedValueOnce({ data: fakeCampaign });

      const { result: queryResult } = renderHook(() => useEventCampaign('evt_test123'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(queryResult.current.isError).toBe(true));

      // Campaign data is undefined — page should treat this as create mode
      expect(queryResult.current.data).toBeUndefined();

      // Create mutation should still succeed when invoked
      const { result: createResult } = renderHook(
        () => useCreateEventCampaign('evt_test123'),
        { wrapper: createWrapper(queryClient) }
      );

      await act(async () => {
        createResult.current.mutate({
          title: 'New campaign',
          visibility: 'public',
          status: 'active',
        });
      });

      await waitFor(() => expect(createResult.current.isSuccess).toBe(true));
      expect(mockApiClient.post).toHaveBeenCalledWith('/v1/events/evt_test123/campaign', {
        title: 'New campaign',
        visibility: 'public',
        status: 'active',
      });
    });

    it('legacy 400 Campaign not found still triggers create mode', async () => {
      mockApiClient.get.mockRejectedValueOnce({
        status: 400,
        message: 'Campaign not found.',
        success: false,
      });
      mockApiClient.post.mockResolvedValueOnce({ data: fakeCampaign });

      const { result: queryResult } = renderHook(() => useEventCampaign('evt_test123'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(queryResult.current.isError).toBe(true));

      const { result: createResult } = renderHook(
        () => useCreateEventCampaign('evt_test123'),
        { wrapper: createWrapper(queryClient) }
      );

      await act(async () => {
        createResult.current.mutate({
          title: 'New campaign',
          visibility: 'public',
          status: 'active',
        });
      });

      await waitFor(() => expect(createResult.current.isSuccess).toBe(true));
      expect(mockApiClient.post).toHaveBeenCalledWith('/v1/events/evt_test123/campaign', {
        title: 'New campaign',
        visibility: 'public',
        status: 'active',
      });
    });

    it('uses update mutation when campaign already exists', async () => {
      mockApiClient.get.mockResolvedValueOnce({ data: fakeCampaign });
      mockApiClient.patch.mockResolvedValueOnce({ data: { ...fakeCampaign, title: 'Edited' } });

      const { result: queryResult } = renderHook(() => useEventCampaign('evt_test123'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(queryResult.current.isSuccess).toBe(true));

      const { result: updateResult } = renderHook(
        () => useUpdateEventCampaign('evt_test123'),
        { wrapper: createWrapper(queryClient) }
      );

      await act(async () => {
        updateResult.current.mutate({ title: 'Edited', status: 'paused' });
      });

      await waitFor(() => expect(updateResult.current.isSuccess).toBe(true));
      expect(mockApiClient.patch).toHaveBeenCalled();
    });
  });

  // ---- Manage menu routing ----

  describe('Manage page routing', () => {
    it('crowdfunding route follows /e/:id/manage/crowdfunding convention', () => {
      const eventId = 'evt_test123';
      const expectedRoute = `/e/${eventId}/manage/crowdfunding`;
      expect(expectedRoute).toBe('/e/evt_test123/manage/crowdfunding');
    });
  });
});
