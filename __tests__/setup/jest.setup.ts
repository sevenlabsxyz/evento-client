import '@testing-library/jest-dom';

global.URL.createObjectURL = jest.fn(() => 'mock-object-url');
global.URL.revokeObjectURL = jest.fn();

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

beforeEach(() => {
  const { default: mockApiClient } = require('@/lib/api/client');

  // Reset all mocks for hook/unit tests
  if (mockApiClient) {
    Object.values(mockApiClient).forEach((mockFn: any) => {
      if (typeof mockFn === 'function' && mockFn.mockReset) {
        mockFn.mockReset();
      }
    });
  }

  // Setup default responses for hook/unit tests
  if (mockApiClient?.get) {
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

      if (url.match(/\/v1\/events\/[^/]+\/rsvps\/me$/)) {
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

      if (url.match(/\/v1\/events\/[^/]+\/rsvps$/)) {
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

      // Event invites
      if (url.includes('/v1/events/invites')) {
        return Promise.resolve({
          success: true,
          message: 'ok',
          data: [
            {
              id: 'invite1',
              event_id: 'event123',
              user_id: 'user1',
              status: 'pending',
              created_at: new Date().toISOString(),
            },
          ],
        });
      }

      // Event gallery
      if (url.match(/\/v1\/events\/[^/]+\/gallery$/)) {
        return Promise.resolve({
          success: true,
          message: 'ok',
          data: [
            {
              id: 'gallery1',
              event_id: 'event123',
              url: 'https://example.com/image1.jpg',
              type: 'image',
              created_at: new Date().toISOString(),
            },
          ],
        });
      }

      // Gallery item likes
      if (url.includes('/gallery/') && url.includes('/likes')) {
        return Promise.resolve({
          success: true,
          message: 'ok',
          data: {
            likes: 5,
            hasLiked: false,
          },
        });
      }

      // Comment reactions
      if (url.includes('/comments/') && url.includes('/reactions')) {
        return Promise.resolve({
          success: true,
          message: 'ok',
          data: {
            reactions: [],
            userReactions: [],
          },
        });
      }

      // Email blasts
      if (url.includes('/email-blasts')) {
        return Promise.resolve({
          success: true,
          message: 'ok',
          data: [
            {
              id: 'blast1',
              event_id: 'event123',
              message: 'Test blast',
              recipient_filter: 'all',
              sent_at: new Date().toISOString(),
            },
          ],
        });
      }

      if (url.includes('/v1/user/followers/list')) {
        return Promise.resolve({
          success: true,
          message: 'ok',
          data: [
            {
              follower_id: 'user1',
              user_details: {
                id: 'user1',
                username: 'follower1',
                name: 'Follower One',
                image: '',
                verification_status: '',
              },
            },
          ],
        });
      }

      if (url.includes('/v1/user/follows/list')) {
        return Promise.resolve({
          success: true,
          message: 'ok',
          data: [
            {
              followed_id: 'user2',
              user_details: {
                id: 'user2',
                username: 'following1',
                name: 'Following One',
                image: '',
                verification_status: '',
              },
            },
          ],
        });
      }

      // User search
      if (url.includes('/v1/user/search')) {
        return Promise.resolve({
          success: true,
          message: 'ok',
          data: [
            {
              id: 'user1',
              username: 'searchuser',
              name: 'Search User',
            },
          ],
        });
      }

      // User profile
      if (url.match(/\/v1\/user\/[^/]+$/)) {
        return Promise.resolve({
          success: true,
          message: 'ok',
          data: {
            id: 'user1',
            username: 'testuser',
            name: 'Test User',
            bio: 'Test bio',
            followers_count: 10,
            following_count: 5,
          },
        });
      }

      // Default response
      return Promise.resolve({ success: true, data: {} });
    });
  }

  if (mockApiClient?.post) {
    mockApiClient.post.mockImplementation((url: string, data: any) => {
      if (url === '/v1/events' || url.includes('/v1/events/create')) {
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

      if (url.includes('/invites')) {
        return Promise.resolve({
          success: true,
          message: 'Invites sent successfully',
          data: { sent: data?.invites?.length || 0 },
        });
      }

      if (url.includes('/comments')) {
        return Promise.resolve({
          success: true,
          message: 'Comment added',
          data: [
            {
              id: 'comment_new',
              event_id: data?.event_id,
              message: data?.message,
              user_id: 'user1',
              created_at: new Date().toISOString(),
            },
          ],
        });
      }

      if (url.includes('/email-blasts')) {
        return Promise.resolve({
          success: true,
          message: 'Email blast created',
          data: {
            id: 'blast_new',
            event_id: 'event123',
            message: data?.message,
            recipient_filter: data?.recipientFilter,
            scheduled_for: data?.scheduledFor,
          },
        });
      }

      if (url.includes('/generate-description')) {
        return Promise.resolve({
          description: 'AI generated description for your event.',
        });
      }

      if (url === '/v1/user/follow' || url.includes('/follow')) {
        return Promise.resolve({
          success: true,
          message: 'Followed successfully',
          data: { following: true },
        });
      }

      if (url.includes('/reactions')) {
        return Promise.resolve({
          success: true,
          message: 'Reaction added',
          data: { reaction: data?.reaction },
        });
      }

      if (url.includes('/likes')) {
        return Promise.resolve({
          success: true,
          message: 'Like toggled',
          data: { liked: true },
        });
      }

      return Promise.resolve({ success: true, data: {} });
    });
  }

  if (mockApiClient?.patch) {
    mockApiClient.patch.mockImplementation((url: string, data: any) => {
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

      if (url.includes('/comments')) {
        return Promise.resolve({
          success: true,
          message: 'Comment updated',
          data: {
            id: data?.commentId || 'comment1',
            message: data?.message,
            updated_at: new Date().toISOString(),
          },
        });
      }

      return Promise.resolve({ success: true, data: {} });
    });
  }

  if (mockApiClient?.put) {
    mockApiClient.put.mockImplementation((url: string, data: any) => {
      if (url.includes('/comments')) {
        return Promise.resolve({
          success: true,
          message: 'Comment updated',
          data: {
            id: data?.commentId || 'comment1',
            message: data?.message,
            updated_at: new Date().toISOString(),
          },
        });
      }

      return Promise.resolve({ success: true, data: {} });
    });
  }

  if (mockApiClient?.delete) {
    mockApiClient.delete.mockImplementation((url: string) => {
      if (url.includes('/v1/events/cancel')) {
        return Promise.resolve({
          success: true,
          message: 'Event cancelled successfully',
          data: { id: 'event123', status: 'cancelled' },
        });
      }

      if (url.includes('/comments')) {
        return Promise.resolve({
          success: true,
          message: 'Comment deleted',
          data: {},
        });
      }

      if (url.includes('/gallery')) {
        return Promise.resolve({
          success: true,
          message: 'Gallery item deleted',
          data: {},
        });
      }

      if (url.includes('/unfollow')) {
        return Promise.resolve({
          success: true,
          message: 'Unfollowed successfully',
          data: { following: false },
        });
      }

      return Promise.resolve({ success: true, data: {} });
    });
  }
});

import React from 'react';

// Mock react-spotify-embed to avoid ESM issues
jest.mock('react-spotify-embed', () => ({
  Spotify: () =>
    React.createElement('div', { 'data-testid': 'spotify-embed' }, 'Spotify Embed Mock'),
}));
