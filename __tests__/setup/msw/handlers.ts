import { http, HttpResponse, type HttpHandler } from 'msw';

type CreateEventBody = { title?: string };
type UpsertRsvpBody = { event_id: string; status: string };
type CommentBody = { event_id?: string; message?: string; commentId?: string };
type ReactionBody = { reactionType: string };
type LikeBody = { itemId: string };
type FollowBody = { followId: string };
type InviteBody = { id: string; message: string; invites: any[] };
type EmailBlastBody = { message: string; recipientFilter: string; scheduledFor: string | null };
type GenerateDescriptionBody = {
  title: string;
  location: string;
  startDate: string;
  currentDescription: string;
  length: string;
  tone: string;
};

export const handlers: HttpHandler[] = [
  http.post('*/v1/events', async ({ request }) => {
    const body = (await request.json()) as CreateEventBody;
    return HttpResponse.json({
      success: true,
      message: 'ok',
      data: [
        {
          id: 'evt_test123',
          title: body.title || 'Test Event',
        },
      ],
    });
  }),

  http.post('*/v1/events/generate-description', async () => {
    return HttpResponse.json({
      description: 'An amazing event with great music and food!',
    });
  }),

  http.get('*/v1/events/:eventId/rsvps', ({ params }) => {
    const eventId = params.eventId as string;

    return HttpResponse.json({
      success: true,
      message: 'ok',
      data: [
        {
          id: 'rsvp1',
          user_id: 'user1',
          event_id: eventId,
          status: 'yes',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
        {
          id: 'rsvp2',
          user_id: 'user2',
          event_id: eventId,
          status: 'maybe',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ],
    });
  }),

  http.get('*/v1/events/:eventId/rsvps/me', ({ params }) => {
    const eventId = params.eventId as string;

    return HttpResponse.json({
      success: true,
      message: 'ok',
      data: [
        {
          id: 'rsvp1',
          user_id: 'current_user',
          event_id: eventId,
          status: 'yes',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ],
    });
  }),

  http.post('*/v1/events/:eventId/rsvps', async ({ request, params }) => {
    const body = (await request.json()) as UpsertRsvpBody;
    const eventId = params.eventId as string;

    return HttpResponse.json({
      success: true,
      message: 'RSVP created successfully',
      data: [
        {
          id: 'rsvp_new',
          user_id: 'current_user',
          event_id: eventId,
          status: body.status,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ],
    });
  }),

  http.patch('*/v1/events/:eventId/rsvps', async ({ request, params }) => {
    const body = (await request.json()) as UpsertRsvpBody;
    const eventId = params.eventId as string;

    return HttpResponse.json({
      success: true,
      message: 'RSVP updated successfully',
      data: [
        {
          id: 'rsvp1',
          user_id: 'current_user',
          event_id: eventId,
          status: body.status,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ],
    });
  }),

  http.get('*/v1/events/:eventId/email-blasts', () => {
    return HttpResponse.json({
      success: true,
      message: 'ok',
      data: [
        {
          id: 'blast_1',
          event_id: 'evt_1',
          user_id: 'user_1',
          message: '<p>Hello!</p>',
          recipient_filter: 'all',
          status: 'sent',
          scheduled_for: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
    });
  }),

  http.post('*/v1/events/:eventId/email-blasts', async ({ request, params }) => {
    const body = (await request.json()) as EmailBlastBody;
    const eventId = params.eventId as string;

    return HttpResponse.json({
      success: true,
      message: 'Email blast created successfully',
      data: {
        id: 'blast_new',
        event_id: eventId,
        user_id: 'user1',
        message: body.message,
        recipient_filter: body.recipientFilter,
        status: body.scheduledFor ? 'scheduled' : 'sent',
        scheduled_for: body.scheduledFor,
        created_at: '2025-01-01T12:00:00Z',
        updated_at: '2025-01-01T12:00:00Z',
      },
    });
  }),

  http.get('*/v1/stream-chat/token', () => {
    return HttpResponse.json({
      success: true,
      message: 'ok',
      data: { token: 'test_token', user_id: 'user_1', expires_in: 3600 },
    });
  }),

  http.post('*/v1/stream-chat/users/sync', () => {
    return HttpResponse.json({
      success: true,
      message: 'ok',
      data: { id: 'user_1', name: 'Test User' },
    });
  }),

  http.get('*/v1/user/follow', ({ request }) => {
    const url = new URL(request.url);
    const userId = url.searchParams.get('id');

    return HttpResponse.json({
      success: true,
      data: { isFollowing: false },
    });
  }),

  http.post('*/v1/user/follow', async ({ request }) => {
    const body = (await request.json()) as FollowBody;

    return HttpResponse.json({
      success: true,
      data: {
        success: true,
        message: 'Followed successfully',
        data: { isFollowing: true },
      },
    });
  }),

  http.delete('*/v1/user/follow', async ({ request }) => {
    return HttpResponse.json({
      success: true,
      data: {
        success: true,
        message: 'Unfollowed successfully',
        data: { isFollowing: false },
      },
    });
  }),

  http.get('*/v1/user/followers/list', ({ request }) => {
    const url = new URL(request.url);
    const userId = url.searchParams.get('id');

    return HttpResponse.json({
      success: true,
      data: [
        {
          user_details: {
            id: 'follower1',
            username: 'follower1',
            name: 'Follower One',
            image: 'follower1.jpg',
            verification_status: 'verified',
          },
        },
        {
          user_details: {
            id: 'follower2',
            username: 'follower2',
            name: 'Follower Two',
            image: 'follower2.jpg',
          verification_status: 'pending',
          },
        },
      ],
    });
  }),

  http.get('*/v1/user/follows/list', ({ request }) => {
    const url = new URL(request.url);
    const userId = url.searchParams.get('id');

    return HttpResponse.json({
      success: true,
      data: [
        {
          user_details: {
            id: 'following1',
            username: 'following1',
            name: 'Following One',
            image: 'following1.jpg',
            verification_status: 'verified',
          },
        },
        {
          user_details: {
            id: 'following2',
            username: 'following2',
            name: 'Following Two',
            image: 'following2.jpg',
          verification_status: 'pending',
          },
        },
      ],
    });
  }),

  http.get('*/v1/user/search', ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('s');

    return HttpResponse.json({
      success: true,
      data: [
        {
          id: 'user1',
          username: 'user1',
          name: 'User One',
          image: 'user1.jpg',
        },
        {
          id: 'user2',
          username: 'user2',
          name: 'User Two',
          image: 'user2.jpg',
        },
      ],
    });
  }),

  http.get('*/v1/user/details', ({ request }) => {
    const url = new URL(request.url);
    const username = url.searchParams.get('username');

    return HttpResponse.json({
      success: true,
      data: {
        id: 'user123',
        username: username || 'testuser',
        name: 'Test User',
        image: 'test.jpg',
        bio: 'Test bio',
        followers_count: 100,
        following_count: 50,
        events_count: 25,
      },
    });
  }),

  http.get('*/v1/events/invites', () => {
    return HttpResponse.json({
      success: true,
      data: [
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
      ],
    });
  }),

  http.post('*/v1/events/:eventId/invites', async ({ request }) => {
    const body = (await request.json()) as InviteBody;

    return HttpResponse.json({
      success: true,
      data: {
        success: true,
        message: 'Invites sent successfully',
        data: body.invites.map((invite: any, i: number) => ({
          id: `invite_${i}`,
          event_id: body.id,
          user_id: invite.id,
          status: 'pending',
          created_at: '2025-01-01T00:00:00Z',
        })),
      },
    });
  }),

  http.post('*/v1/events/:eventId/comments', async ({ request, params }) => {
    const body = (await request.json()) as CommentBody;
    const eventId = params.eventId as string;

    return HttpResponse.json({
      success: true,
      message: 'Comment added successfully',
      data: [
        {
          id: 'comment1',
          event_id: eventId,
          user_id: 'user1',
          message: body.message,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ],
    });
  }),

  http.patch('*/v1/events/:eventId/comments', async ({ request, params }) => {
    const body = (await request.json()) as CommentBody;
    const eventId = params.eventId as string;

    return HttpResponse.json({
      success: true,
      data: {
        success: true,
        message: 'Comment updated successfully',
        data: {
          id: body.commentId || 'comment1',
          event_id: eventId,
          user_id: 'user1',
          message: body.message,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      },
    });
  }),

  http.delete('*/v1/events/:eventId/comments/:commentId', ({ params }) => {
    const commentId = params.commentId as string;

    return HttpResponse.json({
      success: true,
      data: { id: commentId },
    });
  }),

  http.get('*/v1/events/:eventId/comments/:commentId/reactions', () => {
    return HttpResponse.json({
      success: true,
      data: {
        reactions: { like: 5 },
        user_reaction: null,
      },
    });
  }),

  http.post('*/v1/events/:eventId/comments/:commentId/reactions', async ({ request }) => {
    const body = (await request.json()) as ReactionBody;

    return HttpResponse.json({
      success: true,
      data: {
        action: 'added',
        has_reacted: true,
        reaction_type: body.reactionType,
      },
    });
  }),

  http.get('*/v1/events/:eventId/gallery', ({ params }) => {
    const eventId = params.eventId as string;

    return HttpResponse.json({
      success: true,
      data: [
        {
          id: 'gallery1',
          event_id: eventId,
          user_id: 'user1',
          url: 'https://example.com/image1.jpg',
          created_at: '2025-01-01T00:00:00Z',
        },
        {
          id: 'gallery2',
          event_id: eventId,
          user_id: 'user2',
          url: 'https://example.com/image2.jpg',
          created_at: '2025-01-01T00:00:00Z',
        },
      ],
    });
  }),

  http.get('*/v1/events/:eventId/gallery/likes', ({ request }) => {
    const url = new URL(request.url);
    const itemId = url.searchParams.get('itemId');

    return HttpResponse.json({
      success: true,
      data: {
        likes: 10,
        has_liked: false,
      },
    });
  }),

  http.post('*/v1/events/:eventId/gallery/likes', async ({ request }) => {
    const body = (await request.json()) as LikeBody;

    return HttpResponse.json({
      success: true,
      data: {
        action: 'liked',
        has_liked: true,
        likes: 11,
      },
    });
  }),

  http.delete('*/v1/events/:eventId/gallery', ({ request }) => {
    const url = new URL(request.url);
    const galleryItemId = url.searchParams.get('galleryItemId');

    return HttpResponse.json({
      success: true,
      data: {
        success: true,
        message: 'Gallery item deleted successfully',
      },
    });
  }),
];
