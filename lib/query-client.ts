import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './types/api';

// Create a query client with default options
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: 5 minutes - data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,

      // Garbage collection time: 10 minutes - unused data is garbage collected after 10 minutes
      gcTime: 10 * 60 * 1000,

      // Retry configuration
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error && typeof error === 'object' && 'status' in error) {
          const apiError = error as ApiError;
          if (apiError.status && apiError.status >= 400 && apiError.status < 500) {
            return false;
          }
        }

        // Retry up to 3 times for other errors
        return failureCount < 3;
      },

      // Retry delay: exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch on window focus only if data is stale
      refetchOnWindowFocus: false,

      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry mutations once on network errors
      retry: (failureCount, error) => {
        if (error && typeof error === 'object' && 'status' in error) {
          const apiError = error as ApiError;
          // Don't retry 4xx errors
          if (apiError.status && apiError.status >= 400 && apiError.status < 500) {
            return false;
          }
        }
        return failureCount < 1;
      },
    },
  },
});

// Query keys factory for consistent query key management
export const queryKeys = {
  // Authentication
  auth: ['auth'] as const,
  currentUser: () => [...queryKeys.auth, 'currentUser'] as const,

  // Users
  users: ['users'] as const,
  user: (id: string) => [...queryKeys.users, id] as const,
  userSearch: (query: string) => [...queryKeys.users, 'search', query] as const,
  userFollowers: (id: string) => [...queryKeys.users, id, 'followers'] as const,
  userFollowing: (id: string) => [...queryKeys.users, id, 'following'] as const,

  // Events
  events: ['events'] as const,
  event: (id: string) => [...queryKeys.events, id] as const,
  eventsFeed: () => [...queryKeys.events, 'feed'] as const,
  eventsUser: (userId: string) => [...queryKeys.events, 'user', userId] as const,
  eventsUserMe: () => [...queryKeys.events, 'user', 'me'] as const,
  eventsUserGoing: (userId: string) => [...queryKeys.events, 'user', userId, 'going'] as const,
  eventsUserPast: (userId: string) => [...queryKeys.events, 'user', userId, 'past'] as const,

  // RSVPs
  rsvps: ['rsvps'] as const,
  eventRsvps: (eventId: string) => [...queryKeys.rsvps, 'event', eventId] as const,
  userRsvp: (eventId: string) => [...queryKeys.rsvps, 'user', eventId] as const,

  // Comments
  comments: ['comments'] as const,
  eventComments: (eventId: string) => [...queryKeys.comments, 'event', eventId] as const,

  // Gallery
  gallery: ['gallery'] as const,
  eventGallery: (eventId: string) => [...queryKeys.gallery, 'event', eventId] as const,

  // Notifications
  notifications: ['notifications'] as const,
  userNotifications: () => [...queryKeys.notifications, 'user'] as const,

  // Lists (saved events)
  lists: ['lists'] as const,
  userLists: () => [...queryKeys.lists, 'user'] as const,
  list: (listId: string) => [...queryKeys.lists, listId] as const,
  listEvents: (listId: string) => [...queryKeys.lists, listId, 'events'] as const,
  eventSavedStatus: (eventId: string) => [...queryKeys.events, eventId, 'saved'] as const,

  // Event hosts
  eventHosts: (eventId: string) => [...queryKeys.events, eventId, 'hosts'] as const,

  // Cohost invites
  cohostInvites: ['cohost-invites'] as const,
  eventCohostInvites: (eventId: string) => [...queryKeys.cohostInvites, 'event', eventId] as const,
  myCohostInvites: () => [...queryKeys.cohostInvites, 'user', 'me'] as const,
} as const;
