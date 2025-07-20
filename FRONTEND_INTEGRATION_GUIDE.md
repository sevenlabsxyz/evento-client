# Frontend Integration Guide

Complete guide for integrating a new frontend with the Evento API backend. This guide provides ready-to-use client code, TypeScript types, and implementation patterns.

**API Base URL**: `https://evento.so/api`

## Quick Start Setup

### 1. Install Dependencies

```bash
npm install axios
# or
npm install @tanstack/react-query axios  # For React with caching
```

### 2. Environment Variables

```bash
# .env.local
NEXT_PUBLIC_EVENTO_API_BASE_URL=https://evento.so/api
EVENTO_EXTERNAL_API_KEY=your_api_key_here  # For external APIs only
```

### 3. API Client Setup

```typescript
// lib/api-client.ts
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_EVENTO_API_BASE_URL || 'https://evento.so/api';

// Internal API client (uses session cookies)
export const internalApi = axios.create({
    baseURL: `${API_BASE_URL}/v1`,
    withCredentials: true, // Important: includes session cookies
    headers: {
        'Content-Type': 'application/json',
    },
});

// External API client (uses API key)
export const externalApi = axios.create({
    baseURL: `${API_BASE_URL}/ext/v1`,
    headers: {
        'Content-Type': 'application/json',
        'x-evento-api-key': process.env.EVENTO_EXTERNAL_API_KEY || '',
    },
});

// Response interceptor for error handling
internalApi.interceptors.response.use(
    (response) => response.data, // Return just the data
    (error) => {
        if (error.response?.status === 401) {
            // Redirect to login or refresh auth
            window.location.href = '/login';
        }
        return Promise.reject(error.response?.data || error);
    }
);

externalApi.interceptors.response.use(
    (response) => response.data,
    (error) => Promise.reject(error.response?.data || error)
);
```

## TypeScript Types

### Core Types

```typescript
// types/evento.ts

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export interface UserDetails {
    id: string;
    username: string;
    name: string;
    bio: string;
    image: string;
    bio_link: string;
    x_handle: string;
    instagram_handle: string;
    ln_address: string;
    nip05: string;
    verification_status: 'verified' | 'pending' | null;
    verification_date: string;
}

export interface Event {
    id: string;
    title: string;
    description: string;
    cover: string;
    location: string;
    timezone: string;
    status: 'draft' | 'published' | 'cancelled';
    visibility: 'public' | 'private';
    cost: number | null;
    creator_user_id: string;

    // Date components
    start_date_day: number;
    start_date_month: number;
    start_date_year: number;
    start_date_hours: number;
    start_date_minutes: number;

    end_date_day: number;
    end_date_month: number;
    end_date_year: number;
    end_date_hours: number;
    end_date_minutes: number;

    // Computed dates
    computed_start_date: string;
    computed_end_date: string;

    // Media & Links
    spotify_url: string;
    wavlake_url: string;

    // Contributions
    contrib_cashapp: string;
    contrib_venmo: string;
    contrib_paypal: string;
    contrib_btclightning: string;

    created_at: string;
    updated_at: string;

    // Relations
    user_details?: UserDetails;
}

export interface EventRSVP {
    id: string;
    event_id: string;
    user_id: string;
    status: 'yes' | 'no' | 'maybe';
    created_at: string;
    updated_at: string;
    user_details?: UserDetails;
}

export interface EventComment {
    id: string;
    event_id: string;
    user_id: string;
    content: string;
    created_at: string;
    user_details?: UserDetails;
}

// External API types (simplified)
export interface ExternalEvent {
    id: string;
    title: string;
    description: string;
    cover: string;
    location: string;
    start_date: string;
    end_date: string | null;
    timezone: string;
    status: string;
    visibility: string;
    cost: number | null;
    created_at: string;
    creator: {
        id: string;
        username: string;
        image: string;
        verification_status: string | null;
    };
    links: {
        spotify_url: string | null;
        wavlake_url: string | null;
    };
    contributions: {
        cashapp: string | null;
        venmo: string | null;
        paypal: string | null;
        btc_lightning: string | null;
    };
}
```

### Form Types

```typescript
// types/forms.ts

export interface CreateEventForm {
    title: string;
    description: string;
    location: string;
    cover?: string;
    timezone: string;
    status: 'draft' | 'published';
    visibility: 'public' | 'private';
    cost?: number;

    start_date_day: number;
    start_date_month: number;
    start_date_year: number;
    start_date_hours: number;
    start_date_minutes: number;

    end_date_day: number;
    end_date_month: number;
    end_date_year: number;
    end_date_hours: number;
    end_date_minutes: number;

    spotify_url?: string;
    wavlake_url?: string;
    contrib_cashapp?: string;
    contrib_venmo?: string;
    contrib_paypal?: string;
    contrib_btclightning?: string;

    settings?: {
        max_capacity?: number;
        show_capacity_count?: boolean;
    };
}

export interface UpdateUserForm {
    username?: string;
    name?: string;
    bio?: string;
    bio_link?: string;
    x_handle?: string;
    instagram_handle?: string;
    image?: string;
    ln_address?: string;
    nip05?: string;
}
```

## API Service Functions

### User Services

```typescript
// services/user.ts
import { internalApi } from '@/lib/api-client';
import type { ApiResponse, UserDetails, UpdateUserForm } from '@/types/evento';

export const userService = {
    // Get current user
    getCurrentUser: async (): Promise<UserDetails[]> => {
        const response = await internalApi.get<ApiResponse<UserDetails[]>>('/user');
        return response.data;
    },

    // Update user profile
    updateProfile: async (data: UpdateUserForm): Promise<UserDetails[]> => {
        const response = await internalApi.patch<ApiResponse<UserDetails[]>>('/user', data);
        return response.data;
    },

    // Search users
    searchUsers: async (query: string): Promise<UserDetails[]> => {
        const response = await internalApi.get<ApiResponse<UserDetails[]>>(
            `/user/search?q=${encodeURIComponent(query)}`
        );
        return response.data;
    },

    // Follow/unfollow user
    followUser: async (userId: string, action: 'follow' | 'unfollow'): Promise<any> => {
        const response = await internalApi.post<ApiResponse<any>>('/user/follow', {
            user_id: userId,
            action,
        });
        return response.data;
    },

    // Get followers
    getFollowers: async (userId: string): Promise<UserDetails[]> => {
        const response = await internalApi.get<ApiResponse<UserDetails[]>>(
            `/user/followers/list?user_id=${userId}`
        );
        return response.data;
    },

    // Get following
    getFollowing: async (userId: string): Promise<UserDetails[]> => {
        const response = await internalApi.get<ApiResponse<UserDetails[]>>(
            `/user/follows/list?user_id=${userId}`
        );
        return response.data;
    },
};
```

### Event Services

```typescript
// services/events.ts
import { internalApi } from '@/lib/api-client';
import type { ApiResponse, Event, CreateEventForm, EventRSVP } from '@/types/evento';

export const eventService = {
    // Create event
    createEvent: async (data: CreateEventForm): Promise<Event[]> => {
        const response = await internalApi.post<ApiResponse<Event[]>>('/events/create', data);
        return response.data;
    },

    // Get event details
    getEventDetails: async (eventId: string): Promise<Event[]> => {
        const response = await internalApi.get<ApiResponse<Event[]>>(
            `/events/details?event_id=${eventId}`
        );
        return response.data;
    },

    // Update event
    updateEvent: async (data: Partial<CreateEventForm>): Promise<Event[]> => {
        const response = await internalApi.patch<ApiResponse<Event[]>>('/events/details', data);
        return response.data;
    },

    // Cancel event
    cancelEvent: async (eventId: string): Promise<any> => {
        const response = await internalApi.post<ApiResponse<any>>('/events/cancel', {
            event_id: eventId,
        });
        return response.data;
    },

    // Get user's feed
    getFeed: async (): Promise<Event[]> => {
        const response = await internalApi.get<ApiResponse<Event[]>>('/events/feed');
        return response.data;
    },

    // Get user's events
    getUserEvents: async (userId?: string): Promise<Event[]> => {
        const endpoint = userId ? `/events/profile?user_id=${userId}` : '/events/profile/me';
        const response = await internalApi.get<ApiResponse<Event[]>>(endpoint);
        return response.data;
    },

    // RSVP to event
    rsvpToEvent: async (eventId: string, status: 'yes' | 'no' | 'maybe'): Promise<EventRSVP[]> => {
        const response = await internalApi.post<ApiResponse<EventRSVP[]>>('/events/rsvps', {
            event_id: eventId,
            status,
        });
        return response.data;
    },

    // Get event RSVPs
    getEventRSVPs: async (eventId: string): Promise<EventRSVP[]> => {
        const response = await internalApi.get<ApiResponse<EventRSVP[]>>(
            `/events/rsvps?event_id=${eventId}`
        );
        return response.data;
    },

    // Get current user's RSVP
    getCurrentUserRSVP: async (eventId: string): Promise<EventRSVP[]> => {
        const response = await internalApi.get<ApiResponse<EventRSVP[]>>(
            `/events/rsvps/current-user?event_id=${eventId}`
        );
        return response.data;
    },
};
```

### External Services (Public API)

```typescript
// services/external.ts
import { externalApi } from '@/lib/api-client';
import type { ApiResponse, ExternalEvent } from '@/types/evento';

export const externalService = {
    // Get user's created events
    getUserEvents: async (
        username: string,
        options?: { from?: string; to?: string; since?: string }
    ): Promise<ExternalEvent[]> => {
        const params = new URLSearchParams({ username });
        if (options?.from || options?.since) {
            params.append('from', options.from || options.since!);
        }
        if (options?.to) {
            params.append('to', options.to);
        }

        const response = await externalApi.get<ApiResponse<ExternalEvent[]>>(`/events?${params}`);
        return response.data;
    },

    // Get user's profile events
    getUserProfile: async (
        username: string,
        options?: { from?: string; to?: string; since?: string }
    ): Promise<ExternalEvent[]> => {
        const params = new URLSearchParams({ username });
        if (options?.from || options?.since) {
            params.append('from', options.from || options.since!);
        }
        if (options?.to) {
            params.append('to', options.to);
        }

        const response = await externalApi.get<ApiResponse<ExternalEvent[]>>(`/profile?${params}`);
        return response.data;
    },

    // Get specific event
    getEvent: async (eventId: string): Promise<ExternalEvent> => {
        const response = await externalApi.get<ApiResponse<ExternalEvent>>(`/events/${eventId}`);
        return response.data;
    },
};
```

## React Hooks (Optional)

### Using React Query

```typescript
// hooks/useEvents.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventService } from '@/services/events';
import type { CreateEventForm } from '@/types/evento';

export const useEvents = {
    // Get user's feed
    useFeed: () => {
        return useQuery({
            queryKey: ['events', 'feed'],
            queryFn: eventService.getFeed,
        });
    },

    // Get user's events
    useUserEvents: (userId?: string) => {
        return useQuery({
            queryKey: ['events', 'user', userId],
            queryFn: () => eventService.getUserEvents(userId),
        });
    },

    // Get event details
    useEventDetails: (eventId: string) => {
        return useQuery({
            queryKey: ['events', 'details', eventId],
            queryFn: () => eventService.getEventDetails(eventId),
            enabled: !!eventId,
        });
    },

    // Create event mutation
    useCreateEvent: () => {
        const queryClient = useQueryClient();

        return useMutation({
            mutationFn: (data: CreateEventForm) => eventService.createEvent(data),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['events'] });
            },
        });
    },

    // RSVP mutation
    useRSVP: () => {
        const queryClient = useQueryClient();

        return useMutation({
            mutationFn: ({
                eventId,
                status,
            }: {
                eventId: string;
                status: 'yes' | 'no' | 'maybe';
            }) => eventService.rsvpToEvent(eventId, status),
            onSuccess: (_, { eventId }) => {
                queryClient.invalidateQueries({
                    queryKey: ['events', 'rsvps', eventId],
                });
                queryClient.invalidateQueries({ queryKey: ['events', 'feed'] });
            },
        });
    },
};
```

### Custom Hooks

```typescript
// hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { userService } from '@/services/user';
import type { UserDetails } from '@/types/evento';

export const useAuth = () => {
    const [user, setUser] = useState<UserDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const userData = await userService.getCurrentUser();
                setUser(userData[0] || null);
            } catch (err: any) {
                if (err.status !== 401) {
                    setError(err.message || 'Failed to check authentication');
                }
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const logout = async () => {
        try {
            // Clear session cookie by calling logout endpoint
            await fetch('https://evento.so/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
            });
            setUser(null);
        } catch (err) {
            console.error('Logout failed:', err);
        }
    };

    return {
        user,
        loading,
        error,
        isAuthenticated: !!user,
        logout,
    };
};
```

## Authentication Flow

### Login Redirect

```typescript
// utils/auth.ts
export const redirectToLogin = () => {
    const currentUrl = encodeURIComponent(window.location.href);
    window.location.href = `https://evento.so/login?redirect=${currentUrl}`;
};

export const redirectToSignup = () => {
    window.location.href = 'https://evento.so/login';
};
```

### Protected Route Component

```typescript
// components/ProtectedRoute.tsx
import { useAuth } from '@/hooks/useAuth';
import { redirectToLogin } from '@/utils/auth';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback = <div>Please log in to access this page.</div>
}) => {
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      redirectToLogin();
    }
  }, [isAuthenticated, loading]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
```

## Error Handling

### Global Error Handler

```typescript
// utils/error-handler.ts
export interface EventoError {
    success: false;
    message: string;
    status?: number;
}

export const handleApiError = (error: any): string => {
    if (error?.success === false) {
        return error.message;
    }

    if (error?.response?.data?.message) {
        return error.response.data.message;
    }

    if (error?.message) {
        return error.message;
    }

    return 'An unexpected error occurred';
};

export const isEventoError = (error: any): error is EventoError => {
    return error && typeof error === 'object' && error.success === false;
};
```

## Date Utilities

### Date Handling

```typescript
// utils/dates.ts
import { Event } from '@/types/evento';

export const createDateFromComponents = (
    day: number,
    month: number,
    year: number,
    hours: number = 0,
    minutes: number = 0,
    timezone: string = 'UTC'
): Date => {
    // Note: month is 1-indexed in the API but 0-indexed in JavaScript Date
    return new Date(year, month - 1, day, hours, minutes);
};

export const getEventStartDate = (event: Event): Date => {
    return createDateFromComponents(
        event.start_date_day,
        event.start_date_month,
        event.start_date_year,
        event.start_date_hours,
        event.start_date_minutes,
        event.timezone
    );
};

export const getEventEndDate = (event: Event): Date | null => {
    if (!event.end_date_day) return null;

    return createDateFromComponents(
        event.end_date_day,
        event.end_date_month,
        event.end_date_year,
        event.end_date_hours || 0,
        event.end_date_minutes || 0,
        event.timezone
    );
};

export const formatEventDate = (event: Event): string => {
    const startDate = getEventStartDate(event);
    const endDate = getEventEndDate(event);

    if (!endDate) {
        return startDate.toLocaleDateString();
    }

    if (startDate.toDateString() === endDate.toDateString()) {
        return `${startDate.toLocaleDateString()} ${startDate.toLocaleTimeString()} - ${endDate.toLocaleTimeString()}`;
    }

    return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
};
```

## Image Utilities

### Image URL Handling

```typescript
// utils/images.ts
const NO_COVER_FALLBACK =
    'https://api.evento.so/storage/v1/object/public/cdn/covers/default-cover.jpg';

export const getProperImageURL = (url: string | null | undefined): string => {
    if (!url) return NO_COVER_FALLBACK;

    if (!url.includes('https')) {
        return `https://api.evento.so/storage/v1/object/public/cdn${url}?width=400&height=400`;
    }

    return url;
};

export const getOptimizedImageURL = (
    url: string | null | undefined,
    width: number = 400,
    height: number = 400
): string => {
    if (!url) return NO_COVER_FALLBACK;

    if (url.includes('api.evento.so')) {
        return `${url}?width=${width}&height=${height}`;
    }

    return url;
};
```

## Complete Example: Event List Component

```typescript
// components/EventList.tsx
import React from 'react';
import { useEvents } from '@/hooks/useEvents';
import { getProperImageURL, formatEventDate } from '@/utils';
import type { Event } from '@/types/evento';

export const EventList: React.FC = () => {
  const { data: events, loading, error } = useEvents.useFeed();

  if (loading) return <div>Loading events...</div>;
  if (error) return <div>Error loading events: {error.message}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events?.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
};

const EventCard: React.FC<{ event: Event }> = ({ event }) => {
  const { mutate: rsvp, isPending } = useEvents.useRSVP();

  const handleRSVP = (status: 'yes' | 'no' | 'maybe') => {
    rsvp({ eventId: event.id, status });
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <img
        src={getProperImageURL(event.cover)}
        alt={event.title}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">{event.title}</h3>
        <p className="text-gray-600 mb-2">{formatEventDate(event)}</p>
        <p className="text-gray-800 mb-4">{event.location}</p>

        <div className="flex gap-2">
          <button
            onClick={() => handleRSVP('yes')}
            disabled={isPending}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            Going
          </button>
          <button
            onClick={() => handleRSVP('maybe')}
            disabled={isPending}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
          >
            Maybe
          </button>
          <button
            onClick={() => handleRSVP('no')}
            disabled={isPending}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
          >
            Can't Go
          </button>
        </div>
      </div>
    </div>
  );
};
```

This guide provides everything needed to build a fully functional frontend that integrates with the Evento API. All code is production-ready and follows best practices for error handling, TypeScript usage, and React patterns.
