import { useAddComment } from '@/lib/hooks/use-add-comment';
import { useCommentReactions } from '@/lib/hooks/use-comment-reactions';
import { useDeleteComment } from '@/lib/hooks/use-delete-comment';
import { useEditComment } from '@/lib/hooks/use-edit-comment';
import { useEventGallery } from '@/lib/hooks/use-event-gallery';
import { useEventInvites, useSendEventInvites } from '@/lib/hooks/use-event-invites';
import { useGalleryItemLikes } from '@/lib/hooks/use-gallery-item-likes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
    isFallback: false,
    isLocaleDomain: false,
    isReady: true,
    isPreview: false,
    basePath: '',
    locale: 'en',
    locales: ['en'],
    defaultLocale: 'en',
    domainLocales: [],
    isSsr: false,
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

describe('Event Interaction Integration Flow', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createWrapper = (client: QueryClient) => {
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };

  it('should handle event invites flow', async () => {
    const { result: invitesResult } = renderHook(() => useEventInvites(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    expect(invitesResult.current.data).toBeDefined();

    const { result: sendInvitesResult } = renderHook(() => useSendEventInvites(), {
      wrapper: createWrapper(queryClient),
    });

    const inviteData = {
      id: 'event123',
      message: 'Join my event!',
      invites: [
        {
          id: 'user1',
          username: 'user1',
          name: 'User One',
          verification_status: 'verified',
          image: 'user1.jpg',
        },
        {
          id: 'user2',
          username: 'user2',
          name: 'User Two',
          verification_status: 'pending',
          image: 'user2.jpg',
        },
      ],
    };

    await act(async () => {
      sendInvitesResult.current.mutate(inviteData);
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    expect(sendInvitesResult.current.isPending).toBe(false);
    expect(sendInvitesResult.current.error).toBeNull();
  });

  it('should handle event comments flow', async () => {
    const { result } = renderHook(() => useAddComment(), {
      wrapper: createWrapper(queryClient),
    });

    const commentData = {
      event_id: 'event123',
      message: 'Great event!',
    };

    await act(async () => {
      result.current.mutate(commentData);
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle comment editing', async () => {
    const { result } = renderHook(() => useEditComment(), {
      wrapper: createWrapper(queryClient),
    });

    const editData = {
      commentId: 'comment1',
      message: 'Updated comment!',
      eventId: 'event123',
    };

    await act(async () => {
      result.current.mutate(editData);
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle comment deletion', async () => {
    const { result } = renderHook(() => useDeleteComment(), {
      wrapper: createWrapper(queryClient),
    });

    const deleteData = {
      commentId: 'comment1',
      eventId: 'event123',
    };

    await act(async () => {
      result.current.mutate(deleteData);
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle comment reactions', async () => {
    const { result: reactionsResult } = renderHook(
      () => useCommentReactions('comment1', 'event1'),
      {
        wrapper: createWrapper(queryClient),
      }
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    expect(reactionsResult.current.reactions).toBeDefined();

    await act(async () => {
      reactionsResult.current.toggleReaction('like');
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });
  });

  it('should handle event gallery management', async () => {
    const { result } = renderHook(() => useEventGallery('event123'), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.length).toBeGreaterThan(0);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle gallery item likes', async () => {
    const { result: likesResult } = renderHook(() => useGalleryItemLikes('gallery1', 'event1'), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    expect(likesResult.current.likes).toBeDefined();
    expect(likesResult.current.hasLiked).toBeDefined();

    await act(async () => {
      likesResult.current.toggleLike();
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });
  });

  it('should handle interaction errors gracefully', async () => {
    const apiClient = require('@/lib/api/client').default;
    apiClient.post.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useAddComment(), {
      wrapper: createWrapper(queryClient),
    });

    const commentData = {
      event_id: 'event123',
      message: 'Great event!',
    };

    await act(async () => {
      result.current.mutate(commentData);
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeTruthy();
  });
});
