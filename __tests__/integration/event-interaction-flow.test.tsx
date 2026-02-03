import { useAddComment } from '@/lib/hooks/use-add-comment';
import { useCommentReactions } from '@/lib/hooks/use-comment-reactions';
import { useDeleteComment } from '@/lib/hooks/use-delete-comment';
import { useEditComment } from '@/lib/hooks/use-edit-comment';
import { useEventGallery } from '@/lib/hooks/use-event-gallery';
import { useEventInvites, useSendEventInvites } from '@/lib/hooks/use-event-invites';
import { useGalleryItemLikes } from '@/lib/hooks/use-gallery-item-likes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';

// Mock the API client
jest.mock('@/lib/api/client', () => {
  const mockApiClient = {
    post: jest.fn(),
    get: jest.fn(),
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

// Mock Next.js router
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
  let mockApiClient: {
    get: jest.MockedFunction<any>;
    post: jest.MockedFunction<any>;
    put: jest.MockedFunction<any>;
    patch: jest.MockedFunction<any>;
    delete: jest.MockedFunction<any>;
    request: jest.MockedFunction<any>;
    head: jest.MockedFunction<any>;
    options: jest.MockedFunction<any>;
    interceptors: {
      request: { use: jest.MockedFunction<any> };
      response: { use: jest.MockedFunction<any> };
    };
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockApiClient = require('@/lib/api/client').default;
    mockApiClient.get.mockClear();
    mockApiClient.post.mockClear();
    mockApiClient.patch.mockClear();
    mockApiClient.delete.mockClear();
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
    const mockInvites = [
      {
        id: 'invite1',
        event_id: 'event123',
        user_id: 'user1',
        status: 'pending',
        created_at: '2025-01-01T00:00:00Z',
      },
      {
        id: 'invite2',
        event_id: 'event123',
        user_id: 'user2',
        status: 'accepted',
        created_at: '2025-01-01T00:00:00Z',
      },
    ];

    const mockSendInviteResponse = {
      success: true,
      message: 'Invites sent successfully',
      data: mockInvites,
    };

    mockApiClient.get.mockResolvedValueOnce({
      success: true,
      data: mockInvites,
    });

    mockApiClient.post.mockResolvedValueOnce({
      success: true,
      data: mockSendInviteResponse,
    });

    // Test fetching invites
    const { result: invitesResult } = renderHook(() => useEventInvites(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(mockApiClient.get).toHaveBeenCalledWith('/v1/events/invites');
    expect(invitesResult.current.data).toEqual(mockInvites);

    // Test sending invites
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
          verification_status: 'unverified',
          image: 'user2.jpg',
        },
      ],
    };

    await act(async () => {
      sendInvitesResult.current.mutate(inviteData);
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(mockApiClient.post).toHaveBeenCalledWith('/v1/events/event123/invites', inviteData);
    expect(sendInvitesResult.current.isPending).toBe(false);
    expect(sendInvitesResult.current.error).toBeNull();
  });

  it('should handle event comments flow', async () => {
    const mockComment = {
      id: 'comment1',
      event_id: 'event123',
      user_id: 'user1',
      message: 'Great event!',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    const mockAddCommentResponse = {
      success: true,
      message: 'Comment added successfully',
      data: [mockComment],
    };

    mockApiClient.post.mockResolvedValueOnce(mockAddCommentResponse);

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
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(mockApiClient.post).toHaveBeenCalledWith('/v1/events/event123/comments', commentData);
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle comment editing', async () => {
    const mockUpdatedComment = {
      id: 'comment1',
      event_id: 'event123',
      user_id: 'user1',
      message: 'Updated comment!',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    const mockEditCommentResponse = {
      success: true,
      message: 'Comment updated successfully',
      data: mockUpdatedComment,
    };

    mockApiClient.patch.mockResolvedValueOnce({
      success: true,
      data: mockEditCommentResponse,
    });

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
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(mockApiClient.patch).toHaveBeenCalledWith('/v1/events/event123/comments', {
      commentId: 'comment1',
      message: 'Updated comment!',
    });
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle comment deletion', async () => {
    const mockDeleteResponse = {
      id: 'comment1',
    };

    mockApiClient.delete.mockResolvedValueOnce({
      success: true,
      data: mockDeleteResponse,
    });

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
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(mockApiClient.delete).toHaveBeenCalledWith('/v1/events/event123/comments/comment1');
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle comment reactions', async () => {
    const mockReactions = {
      reactions: { like: 5 },
      user_reaction: null,
    };

    const mockReactionResponse = {
      success: true,
      message: 'Reaction added successfully',
      data: { action: 'added', has_reacted: true, reaction_type: 'like' },
    };

    mockApiClient.get.mockResolvedValueOnce({
      success: true,
      data: mockReactions,
    });

    mockApiClient.post.mockResolvedValueOnce({
      success: true,
      data: mockReactionResponse,
    });

    // Test fetching reactions
    const { result: reactionsResult } = renderHook(
      () => useCommentReactions('comment1', 'event1'),
      {
        wrapper: createWrapper(queryClient),
      }
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(mockApiClient.get).toHaveBeenCalledWith('/v1/events/event1/comments/comment1/reactions');
    expect(reactionsResult.current.reactions).toEqual(mockReactions.reactions);

    // Test adding reaction
    await act(async () => {
      reactionsResult.current.toggleReaction('like');
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(mockApiClient.post).toHaveBeenCalledWith(
      '/v1/events/event1/comments/comment1/reactions',
      {
        reactionType: 'like',
      }
    );
  });

  it('should handle event gallery management', async () => {
    const mockGalleryItems = [
      {
        id: 'gallery1',
        event_id: 'event123',
        user_id: 'user1',
        url: 'https://example.com/image1.jpg',
        created_at: '2025-01-01T00:00:00Z',
      },
      {
        id: 'gallery2',
        event_id: 'event123',
        user_id: 'user2',
        url: 'https://example.com/image2.jpg',
        created_at: '2025-01-01T00:00:00Z',
      },
    ];

    mockApiClient.get.mockResolvedValueOnce({
      success: true,
      data: mockGalleryItems,
    });

    const { result } = renderHook(() => useEventGallery('event123'), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(mockApiClient.get).toHaveBeenCalledWith('/v1/events/event123/gallery');
    expect(result.current.data).toEqual(mockGalleryItems);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle gallery item likes', async () => {
    const mockLikes = {
      likes: 10,
      has_liked: false,
    };

    const mockLikeResponse = {
      success: true,
      message: 'Like added successfully',
      data: { action: 'liked', has_liked: true, likes: 11 },
    };

    mockApiClient.get.mockResolvedValueOnce({
      success: true,
      data: mockLikes,
    });

    mockApiClient.post.mockResolvedValueOnce({
      success: true,
      data: mockLikeResponse,
    });

    // Test fetching likes
    const { result: likesResult } = renderHook(() => useGalleryItemLikes('gallery1', 'event1'), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(mockApiClient.get).toHaveBeenCalledWith(
      '/v1/events/event1/gallery/likes?itemId=gallery1'
    );
    expect(likesResult.current.likes).toEqual(mockLikes.likes);
    expect(likesResult.current.hasLiked).toEqual(mockLikes.has_liked);

    // Test toggling like
    await act(async () => {
      likesResult.current.toggleLike();
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(mockApiClient.post).toHaveBeenCalledWith('/v1/events/event1/gallery/likes', {
      itemId: 'gallery1',
    });
  });

  it('should handle interaction errors gracefully', async () => {
    mockApiClient.post.mockRejectedValueOnce(new Error('Network error'));

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
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(mockApiClient.post).toHaveBeenCalledWith('/v1/events/event123/comments', commentData);
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeTruthy();
  });
});
