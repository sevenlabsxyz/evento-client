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

type CreateCampaignBody = {
  title?: string | null;
  description?: string | null;
  goalSats?: number | null;
  visibility?: 'public' | 'private';
  status?: 'active' | 'paused' | 'closed';
};

type UpdateCampaignBody = {
  title?: string | null;
  description?: string | null;
  goal_sats?: number | null;
  visibility?: 'public' | 'private';
  status?: 'active' | 'paused' | 'closed';
};

type CampaignPledgeBody = { amountSats?: number };

const nowIso = () => new Date().toISOString();

const baseEventCampaign = {
  id: 'cmp_event_1',
  event_id: 'evt_test123',
  user_id: 'usr_host_1',
  scope: 'event',
  title: 'Fund this event',
  description: 'Help us cover production costs.',
  goal_sats: 100000,
  raised_sats: 21000,
  pledge_count: 5,
  visibility: 'public' as const,
  status: 'active' as const,
  destination_address: 'host@evento.cash',
  destination_verify_url: 'https://evento.cash/.well-known/lnurlp/host/verify',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  progressPercent: 21,
  isGoalMet: false,
};

const baseProfileCampaign = {
  id: 'cmp_profile_1',
  event_id: null,
  user_id: 'usr_profile_1',
  scope: 'profile',
  title: 'Support my profile campaign',
  description: 'Back my creator work.',
  goal_sats: 250000,
  raised_sats: 50000,
  pledge_count: 8,
  visibility: 'public' as const,
  status: 'active' as const,
  destination_address: 'alice@evento.cash',
  destination_verify_url: 'https://evento.cash/.well-known/lnurlp/alice/verify',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  progressPercent: 20,
  isGoalMet: false,
};

const publicCampaignFeed = [
  {
    payer_username: 'satsfan',
    payer_avatar: 'https://example.com/avatar/satsfan.png',
    amount_sats: 1000,
    settled_at: '2026-02-28T12:00:00.000Z',
  },
  {
    payer_username: 'anon',
    payer_avatar: null,
    amount_sats: 500,
    settled_at: '2026-02-28T11:00:00.000Z',
  },
];

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

  http.get('*/v1/events/:eventId/campaign', ({ params }) => {
    const eventId = params.eventId as string;

    return HttpResponse.json({
      success: true,
      message: 'Campaign fetched successfully.',
      data: {
        ...baseEventCampaign,
        event_id: eventId,
      },
    });
  }),

  http.post('*/v1/events/:eventId/campaign', async ({ request, params }) => {
    const eventId = params.eventId as string;
    const body = (await request.json()) as CreateCampaignBody;
    const createdAt = nowIso();

    return HttpResponse.json({
      success: true,
      message: 'Campaign created successfully.',
      data: {
        ...baseEventCampaign,
        event_id: eventId,
        title: body.title ?? baseEventCampaign.title,
        description: body.description ?? baseEventCampaign.description,
        goal_sats: body.goalSats ?? baseEventCampaign.goal_sats,
        visibility: body.visibility ?? baseEventCampaign.visibility,
        status: body.status ?? baseEventCampaign.status,
        created_at: createdAt,
        updated_at: createdAt,
      },
    });
  }),

  http.patch('*/v1/events/:eventId/campaign', async ({ request, params }) => {
    const eventId = params.eventId as string;
    const body = (await request.json()) as UpdateCampaignBody;

    return HttpResponse.json({
      success: true,
      message: 'Campaign updated successfully.',
      data: {
        ...baseEventCampaign,
        event_id: eventId,
        title: body.title ?? baseEventCampaign.title,
        description: body.description ?? baseEventCampaign.description,
        goal_sats: body.goal_sats ?? baseEventCampaign.goal_sats,
        visibility: body.visibility ?? baseEventCampaign.visibility,
        status: body.status ?? baseEventCampaign.status,
        updated_at: nowIso(),
      },
    });
  }),

  http.post('*/v1/events/:eventId/campaign/pledges', async ({ request }) => {
    const body = (await request.json()) as CampaignPledgeBody;

    return HttpResponse.json({
      success: true,
      message: 'Pledge intent created successfully.',
      data: {
        pledgeId: 'plg_event_1',
        invoice: 'lnbc1000n1peventmock',
        amountSats: body.amountSats ?? 1000,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      },
    });
  }),

  http.get('*/v1/events/:eventId/campaign/feed', () => {
    return HttpResponse.json({
      success: true,
      message: 'Campaign feed fetched successfully.',
      data: publicCampaignFeed,
    });
  }),

  http.get('*/v1/users/:username/campaign', ({ params }) => {
    const username = String(params.username || 'alice').toLowerCase();

    return HttpResponse.json({
      success: true,
      message: 'Campaign fetched successfully.',
      data: {
        ...baseProfileCampaign,
        user_id: `usr_${username}`,
      },
    });
  }),

  http.get('*/v1/users/:username/campaign/feed', () => {
    return HttpResponse.json({
      success: true,
      message: 'Campaign feed fetched successfully.',
      data: publicCampaignFeed,
    });
  }),

  http.get('*/v1/user/campaign', () => {
    return HttpResponse.json({
      success: true,
      message: 'Campaign fetched successfully.',
      data: baseProfileCampaign,
    });
  }),

  http.post('*/v1/user/campaign', async ({ request }) => {
    const body = (await request.json()) as CreateCampaignBody;
    const createdAt = nowIso();

    return HttpResponse.json({
      success: true,
      message: 'Campaign created successfully.',
      data: {
        ...baseProfileCampaign,
        title: body.title ?? baseProfileCampaign.title,
        description: body.description ?? baseProfileCampaign.description,
        goal_sats: body.goalSats ?? baseProfileCampaign.goal_sats,
        visibility: body.visibility ?? baseProfileCampaign.visibility,
        status: body.status ?? baseProfileCampaign.status,
        created_at: createdAt,
        updated_at: createdAt,
      },
    });
  }),

  http.patch('*/v1/user/campaign', async ({ request }) => {
    const body = (await request.json()) as UpdateCampaignBody;

    return HttpResponse.json({
      success: true,
      message: 'Campaign updated successfully.',
      data: {
        ...baseProfileCampaign,
        title: body.title ?? baseProfileCampaign.title,
        description: body.description ?? baseProfileCampaign.description,
        goal_sats: body.goal_sats ?? baseProfileCampaign.goal_sats,
        visibility: body.visibility ?? baseProfileCampaign.visibility,
        status: body.status ?? baseProfileCampaign.status,
        updated_at: nowIso(),
      },
    });
  }),

  http.post('*/v1/user/campaign/pledges', async ({ request }) => {
    const body = (await request.json()) as CampaignPledgeBody;

    return HttpResponse.json({
      success: true,
      message: 'Pledge intent created successfully.',
      data: {
        pledgeId: 'plg_profile_1',
        invoice: 'lnbc500n1pprofilemock',
        amountSats: body.amountSats ?? 500,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      },
    });
  }),

  http.get('*/v1/campaign-pledges/:pledgeId/status', ({ params }) => {
    const pledgeId = String(params.pledgeId || 'plg_1');

    return HttpResponse.json({
      success: true,
      message: 'Pledge status fetched successfully.',
      data: {
        status: pledgeId.includes('expired') ? 'expired' : 'settled',
        amountSats: 1000,
        settledAt: pledgeId.includes('expired') ? undefined : '2026-02-28T12:00:00.000Z',
      },
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
