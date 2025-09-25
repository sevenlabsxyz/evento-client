import { http, HttpResponse, type HttpHandler } from 'msw';

type CreateEventBody = { title?: string };
type UpsertRsvpBody = { event_id: string; status: string };

export const handlers: HttpHandler[] = [
  // Create Event
  http.post('*/v1/events/create', async ({ request }) => {
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

  // RSVP upsert
  http.post('*/v1/events/rsvps', async ({ request }) => {
    const body = (await request.json()) as UpsertRsvpBody;
    return HttpResponse.json({
      success: true,
      message: 'ok',
      data: [
        {
          id: 'rsvp_1',
          event_id: body.event_id,
          user_id: 'user_1',
          status: body.status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
    });
  }),
  http.patch('*/v1/events/rsvps', async ({ request }) => {
    const body = (await request.json()) as UpsertRsvpBody;
    return HttpResponse.json({
      success: true,
      message: 'ok',
      data: [
        {
          id: 'rsvp_1',
          event_id: body.event_id,
          user_id: 'user_1',
          status: body.status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
    });
  }),

  // Email Blasts
  http.get('*/v1/events/email-blasts/:eventId', () => {
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

  // Stream Chat token
  http.get('*/v1/stream-chat/token', () => {
    return HttpResponse.json({
      success: true,
      message: 'ok',
      data: { token: 'test_token', user_id: 'user_1', expires_in: 3600 },
    });
  }),

  // Stream Chat user sync
  http.post('*/v1/stream-chat/users/sync', () => {
    return HttpResponse.json({
      success: true,
      message: 'ok',
      data: { id: 'user_1', name: 'Test User' },
    });
  }),
];
