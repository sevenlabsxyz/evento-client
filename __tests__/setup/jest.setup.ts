import '@testing-library/jest-dom';

// Mock the API client directly
jest.mock('@/lib/api/client', () => {
  const mockApiClient = {
    get: jest.fn(),
    post: jest.fn(),
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

// Setup default mock responses
beforeEach(() => {
  const { default: mockApiClient } = require('@/lib/api/client');

  // Reset all mocks
  Object.values(mockApiClient).forEach((mockFn: any) => {
    if (typeof mockFn === 'function' && mockFn.mockReset) {
      mockFn.mockReset();
    }
  });

  // Setup default responses
  mockApiClient.get.mockImplementation((url: string) => {
    if (url.includes('/v1/user/check-username')) {
      const urlObj = new URL(url, 'http://localhost');
      const username = urlObj.searchParams.get('username');

      if (username === 'takenusername') {
        return Promise.resolve({
          data: { available: false, message: 'Username already taken' },
        });
      }

      return Promise.resolve({
        data: { available: true },
      });
    }

    if (url.includes('/v1/events/feed')) {
      return Promise.resolve({
        success: true,
        message: 'ok',
        data: [
          {
            id: 'event1',
            title: 'Event 1',
            description: 'Description 1',
            user_details: { username: 'user1', name: 'User 1' },
          },
          {
            id: 'event2',
            title: 'Event 2',
            description: 'Description 2',
            user_details: { username: 'user2', name: 'User 2' },
          },
        ],
      });
    }

    if (url.includes('/v1/events/user-events')) {
      return Promise.resolve({
        success: true,
        message: 'ok',
        data: {
          events: [
            {
              id: 'event1',
              title: 'User Event 1',
              description: 'Description 1',
              user_details: { username: 'testuser', name: 'Test User' },
            },
          ],
          pagination: {
            totalCount: 1,
            totalPages: 1,
            currentPage: 1,
            limit: 10,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        },
      });
    }

    if (url.includes('/v1/events/rsvps') && !url.includes('/current-user')) {
      return Promise.resolve({
        success: true,
        message: 'ok',
        data: [
          {
            id: 'rsvp1',
            event_id: 'event123',
            user_id: 'user1',
            status: 'yes',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
      });
    }

    if (url.includes('/v1/events/rsvps/current-user')) {
      return Promise.resolve({
        success: true,
        message: 'ok',
        data: [
          {
            id: 'rsvp1',
            event_id: 'event123',
            user_id: 'current_user',
            status: 'yes',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
      });
    }

    if (url.includes('/v1/events/sub-events')) {
      return Promise.resolve([
        {
          id: 'subevent1',
          title: 'Sub Event 1',
          description: 'Sub Event Description',
          user_details: { username: 'user1', name: 'User 1' },
          computed_start_date: new Date().toISOString(),
          timezone: 'UTC',
        },
      ]);
    }

    if (url.includes('/v1/events/details')) {
      return Promise.resolve({
        success: true,
        message: 'ok',
        data: {
          id: 'event123',
          title: 'Test Event',
          description: 'Test Description',
          location: 'Test Location',
          start_date_day: 1,
          start_date_month: 1,
          start_date_year: 2025,
          start_date_hours: 10,
          start_date_minutes: 0,
          end_date_day: 1,
          end_date_month: 1,
          end_date_year: 2025,
          end_date_hours: 12,
          end_date_minutes: 0,
          timezone: 'UTC',
          visibility: 'public',
          status: 'published',
          cover: null,
          host_id: 'user1',
        },
      });
    }

    // Default response
    return Promise.resolve({ success: true, data: {} });
  });

  mockApiClient.post?.mockImplementation((url: string, data: any) => {
    if (url.includes('/v1/events/create')) {
      return Promise.resolve({
        success: true,
        message: 'ok',
        data: [
          {
            id: 'evt_test123',
            title: data?.title || 'Test Event',
          },
        ],
      });
    }

    if (url.includes('/v1/events/rsvps')) {
      return Promise.resolve({
        success: true,
        message: 'ok',
        data: [
          {
            id: 'rsvp_1',
            event_id: data?.event_id,
            user_id: 'user_1',
            status: data?.status,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
      });
    }

    return Promise.resolve({ success: true, data: {} });
  });

  mockApiClient.patch?.mockImplementation((url: string, data: any) => {
    if (url.includes('/v1/events/rsvps')) {
      return Promise.resolve({
        success: true,
        message: 'ok',
        data: [
          {
            id: 'rsvp_1',
            event_id: data?.event_id,
            user_id: 'user_1',
            status: data?.status,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
      });
    }

    if (url.includes('/v1/events/details')) {
      return Promise.resolve({
        success: true,
        message: 'ok',
        data: [
          {
            id: data?.id || 'event123',
            title: data?.title || 'Updated Event',
            description: data?.description || 'Updated Description',
          },
        ],
      });
    }

    return Promise.resolve({ success: true, data: {} });
  });

  mockApiClient.delete?.mockImplementation((url: string) => {
    if (url.includes('/v1/events/cancel')) {
      return Promise.resolve({
        success: true,
        message: 'Event cancelled successfully',
        data: { id: 'event123', status: 'cancelled' },
      });
    }

    return Promise.resolve({ success: true, data: {} });
  });
});

import React from 'react';

// Mock react-spotify-embed to avoid ESM issues
jest.mock('react-spotify-embed', () => ({
  Spotify: () =>
    React.createElement(
      'div',
      { 'data-testid': 'spotify-embed' },
      'Spotify Embed Mock'
    ),
}));
