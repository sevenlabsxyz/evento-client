import apiClient from '@/lib/api/client';
import '@testing-library/jest-dom';
import MockAdapter from 'axios-mock-adapter';

// Ensure axios uses a local API base in tests
process.env.NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost';

let axiosMock: MockAdapter;

// Typed bodies for mocked endpoints
type CreateEventBody = { title?: string };
type UpsertRsvpBody = { event_id: string; status: string };
type CreateEmailBlastBody = {
  message?: string;
  recipientFilter?: 'all' | 'yes_only' | 'yes_and_maybe';
  scheduledFor?: string | null;
};

function registerAxiosHandlers(mock: MockAdapter) {
  // Create Event
  mock.onPost('/v1/events/create').reply((config) => {
    const body = JSON.parse(config.data || '{}') as CreateEventBody;
    return [
      200,
      {
        success: true,
        message: 'ok',
        data: [
          {
            id: 'evt_test123',
            title: body.title || 'Test Event',
          },
        ],
      },
    ];
  });

  // RSVP upsert
  mock.onPost('/v1/events/rsvps').reply((config) => {
    const body = JSON.parse(config.data || '{}') as UpsertRsvpBody;
    return [
      200,
      {
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
      },
    ];
  });

  mock.onPatch('/v1/events/rsvps').reply((config) => {
    const body = JSON.parse(config.data || '{}') as UpsertRsvpBody;
    return [
      200,
      {
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
      },
    ];
  });

  // Email Blasts history
  mock.onGet(/\/v1\/events\/email-blasts\/[^/]+$/).reply((_config) => {
    return [
      200,
      {
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
      },
    ];
  });

  // Create Email Blast
  mock.onPost(/\/v1\/events\/email-blasts\/[^/]+$/).reply((config) => {
    const body = JSON.parse(config.data || '{}') as CreateEmailBlastBody;
    const eventId = (config.url || '').split('/').pop() || 'evt_1';
    return [
      200,
      {
        success: true,
        message: 'ok',
        data: {
          id: 'blast_new',
          event_id: eventId,
          user_id: 'user_1',
          message: body.message || '<p>Hello!</p>',
          recipient_filter: body.recipientFilter || 'all',
          status: 'sent',
          scheduled_for: body.scheduledFor ?? null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      },
    ];
  });

  // Stream Chat token
  mock.onGet('/v1/stream-chat/token').reply(() => {
    return [
      200,
      {
        success: true,
        data: { token: 'test_token', user_id: 'user_1', expires_in: 3600 },
      },
    ];
  });

  // Cancel Event
  mock.onDelete(/\/v1\/events\/cancel/).reply(() => {
    return [
      200,
      {
        success: true,
        message: 'Event cancelled successfully',
        data: { id: 'event123', status: 'cancelled' },
      },
    ];
  });

  // User Events
  mock.onGet('/v1/events/user-events').reply((config) => {
    const url = new URL(config.url || '', 'http://localhost');
    const params = Object.fromEntries(url.searchParams.entries());

    return [
      200,
      {
        success: true,
        message: 'ok',
        data: {
          events: [
            {
              id: 'event1',
              title: 'User Event 1',
              description: 'Description 1',
              user_details: { username: params.username, name: 'Test User' },
            },
          ],
          pagination: {
            totalCount: 1,
            totalPages: 1,
            currentPage: parseInt(params.page) || 1,
            limit: parseInt(params.limit) || 10,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        },
      },
    ];
  });

  // Event RSVPs
  mock.onGet('/v1/events/rsvps').reply((config) => {
    const url = new URL(config.url || '', 'http://localhost');
    const eventId = url.searchParams.get('event_id');

    return [
      200,
      {
        success: true,
        message: 'ok',
        data: [
          {
            id: 'rsvp1',
            event_id: eventId,
            user_id: 'user1',
            status: 'yes',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
      },
    ];
  });

  // Current User RSVP
  mock.onGet('/v1/events/rsvps/current-user').reply((config) => {
    const url = new URL(config.url || '', 'http://localhost');
    const eventId = url.searchParams.get('event_id');

    return [
      200,
      {
        success: true,
        message: 'ok',
        data: [
          {
            id: 'rsvp1',
            event_id: eventId,
            user_id: 'current_user',
            status: 'yes',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
      },
    ];
  });

  // Sub Events
  mock.onGet('/v1/events/sub-events').reply((config) => {
    const url = new URL(config.url || '', 'http://localhost');
    const eventId = url.searchParams.get('event_id');

    return [
      200,
      {
        success: true,
        message: 'ok',
        data: [
          {
            id: 'subevent1',
            title: 'Sub Event 1',
            description: 'Sub Event Description',
            user_details: { username: 'user1', name: 'User 1' },
            computed_start_date: new Date().toISOString(),
            timezone: 'UTC',
          },
        ],
      },
    ];
  });
}

// Establish API mocking before all tests.
beforeAll(() => {
  axiosMock = new MockAdapter(apiClient as any, { onNoMatch: 'throwException' as const });
});

// Reset handlers and set up defaults before each test
beforeEach(() => {
  axiosMock.reset();
  registerAxiosHandlers(axiosMock);
});

// Clean up after the tests are finished.
afterAll(() => {
  axiosMock.restore();
});

import React from 'react';

// Mock react-spotify-embed to avoid ESM issues
jest.mock('react-spotify-embed', () => ({
  Spotify: () =>
    React.createElement('div', { 'data-testid': 'spotify-embed' }, 'Spotify Embed Mock'),
}));
