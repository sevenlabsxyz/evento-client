# Evento Client (Web) - AI Agent Instructions

This document provides comprehensive context for AI agents working on the Evento web client.

---

## Tech Stack

| Technology          | Version | Purpose                                |
| ------------------- | ------- | -------------------------------------- |
| **Next.js**         | 14.2.16 | React framework (App Router)           |
| **React**           | 18.x    | UI library                             |
| **TypeScript**      | 5.x     | Type safety                            |
| **TanStack Query**  | 5.83.0  | Server state management                |
| **Zustand**         | 5.0.6   | Client state management                |
| **Tailwind CSS**    | 3.3.0   | Styling                                |
| **shadcn/ui**       | -       | UI component system (Radix + Tailwind) |
| **React Hook Form** | 7.60.0  | Form handling                          |
| **Zod**             | 4.0.5   | Schema validation                      |
| **Axios**           | 1.10.0  | HTTP client                            |
| **Breez SDK Spark** | 0.4.2   | Bitcoin Lightning wallet               |

---

## Project Structure

```
evento-client/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout with providers
│   ├── providers.tsx            # React Query, global providers
│   ├── page.tsx                 # Landing page
│   │
│   ├── auth/                    # Authentication routes
│   │   ├── login/page.tsx       # Email input
│   │   ├── verify/page.tsx      # OTP verification
│   │   └── callback/page.tsx    # OAuth callback
│   │
│   ├── e/                       # Main app routes (authenticated)
│   │   ├── layout.tsx           # App shell with sidebar
│   │   ├── feed/page.tsx        # Events feed
│   │   ├── create/page.tsx      # Create event
│   │   ├── [id]/                # Event detail
│   │   │   ├── page.tsx         # Event view
│   │   │   └── manage/          # Event management (host only)
│   │   ├── profile/page.tsx     # Current user profile
│   │   ├── messages/            # Chat/messaging
│   │   ├── wallet/              # Bitcoin wallet
│   │   ├── settings/page.tsx    # User settings
│   │   ├── saved/page.tsx       # Saved events
│   │   └── hub/page.tsx         # Home hub
│   │
│   ├── [username]/page.tsx      # Public user profiles
│   ├── blog/                    # Blog pages (Ghost CMS)
│   ├── onboarding/page.tsx      # New user onboarding
│   │
│   └── api/                     # API routes
│       ├── [...path]/route.ts   # Proxy to backend API
│       └── v1/lightning/        # Lightning payment endpoints
│
├── components/                   # React components
│   ├── ui/                      # Base UI components (Radix-based)
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── sheet-with-detent.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── avatar.tsx
│   │   └── ...
│   │
│   ├── create-event/            # Event creation
│   │   ├── toolbar-sections/    # Form sections
│   │   └── ...
│   ├── event-detail/            # Event detail page
│   ├── manage-event/            # Event management
│   ├── profile/                 # User profile
│   ├── profile-edit/            # Profile editing sheets
│   ├── wallet/                  # Bitcoin wallet UI
│   ├── chat/                    # Messaging components
│   ├── hub/                     # Hub/home components
│   ├── zap/                     # Lightning zap/tip flow
│   ├── onboarding/              # Onboarding flow
│   │
│   ├── navbar.tsx               # Top navigation
│   ├── sidebar.tsx              # Side navigation
│   ├── event-card.tsx           # Event card display
│   └── ...
│
├── lib/                         # Core utilities and logic
│   ├── api/
│   │   └── client.ts            # Axios API client
│   │
│   ├── hooks/                   # React Query hooks (60+ files)
│   │   ├── use-auth.ts          # Authentication
│   │   ├── use-event-details.ts # Single event
│   │   ├── use-list-events.ts   # Event lists
│   │   ├── use-create-event.ts  # Create mutation
│   │   └── ...
│   │
│   ├── stores/                  # Zustand stores
│   │   ├── auth-store.ts        # Auth state
│   │   ├── event-form-store.ts  # Event form state
│   │   ├── wallet-store.ts      # Wallet state
│   │   ├── sidebar-store.ts     # UI state
│   │   └── ...
│   │
│   ├── services/                # Business logic
│   │   ├── auth.ts              # Auth service
│   │   ├── breez-sdk.ts         # Bitcoin wallet
│   │   ├── stream-chat.ts       # Chat service
│   │   └── ...
│   │
│   ├── schemas/                 # Zod validation schemas
│   │   ├── event.ts
│   │   ├── user.ts
│   │   └── auth.ts
│   │
│   ├── types/                   # TypeScript types
│   │   ├── api.ts               # API response types
│   │   ├── event.ts             # Event types
│   │   └── wallet.ts            # Wallet types
│   │
│   ├── constants/               # Constants
│   │   ├── env.ts               # Environment variables
│   │   └── storage-keys.ts      # LocalStorage keys
│   │
│   ├── utils/                   # Utility functions
│   │   ├── date.ts              # Date formatting
│   │   ├── image.ts             # Image optimization
│   │   └── ...
│   │
│   ├── supabase/                # Supabase clients
│   │   ├── client.ts            # Browser client
│   │   └── server.ts            # Server client
│   │
│   ├── query-client.ts          # React Query config + query keys
│   └── utils.ts                 # Main utilities (cn function)
│
├── __tests__/                   # Test files
│   ├── hooks/                   # Hook tests
│   ├── integration/             # Integration tests
│   └── setup/                   # Jest/MSW setup
│
├── public/                      # Static assets
├── .env.example                 # Environment template
├── tailwind.config.ts           # Tailwind configuration
├── jest.config.ts               # Jest configuration
└── package.json
```

---

## Data Fetching Patterns

### API Client

Located in `lib/api/client.ts`:

```typescript
import apiClient from '@/lib/api/client';

// GET request
const response = await apiClient.get('/v1/events');

// POST request
const response = await apiClient.post('/v1/events', { title, description });

// The interceptor returns response.data directly
// No need to access response.data.data
```

**Key features:**

- Base URL from `NEXT_PUBLIC_API_URL`
- `withCredentials: true` for cookie-based auth
- 10-second timeout
- Automatic error handling

### Query Keys Factory

Located in `lib/query-client.ts`:

```typescript
import { queryKeys } from '@/lib/query-client';

// Always use the factory for consistency
queryKeys.event(eventId); // ['events', eventId]
queryKeys.eventsFeed(); // ['events', 'feed']
queryKeys.eventsUserMe(); // ['events', 'user', 'me']
queryKeys.currentUser(); // ['auth', 'currentUser']
queryKeys.eventComments(eventId); // ['comments', 'event', eventId]
queryKeys.userFollowers(userId); // ['users', userId, 'followers']
```

### Query Hook Pattern

```typescript
// lib/hooks/use-event-details.ts
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api/client';
import { queryKeys } from '@/lib/query-client';

interface EventResponse {
    success: boolean;
    message: string;
    data: Event;
}

export function useEventDetails(eventId: string) {
    return useQuery({
        queryKey: queryKeys.event(eventId),
        queryFn: async (): Promise<Event> => {
            const response = await apiClient.get<EventResponse>(`/v1/events/${eventId}`);
            return response.data;
        },
        enabled: !!eventId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}
```

### Mutation Pattern

```typescript
// lib/hooks/use-create-event.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api/client';
import { queryKeys } from '@/lib/query-client';
import { toast } from 'sonner';

export function useCreateEvent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateEventForm) => {
            const response = await apiClient.post('/v1/events', data);
            return response.data;
        },
        onSuccess: () => {
            // Invalidate related queries
            queryClient.invalidateQueries({ queryKey: queryKeys.eventsUserMe() });
            toast.success('Event created successfully');
        },
        onError: (error: ApiError) => {
            toast.error(error.message || 'Failed to create event');
        },
    });
}
```

### Using Queries in Components

```typescript
'use client';

import { useEventDetails } from '@/lib/hooks/use-event-details';
import { Skeleton } from '@/components/ui/skeleton';

export function EventPage({ eventId }: { eventId: string }) {
  const { data: event, isLoading, error } = useEventDetails(eventId);

  if (isLoading) return <Skeleton />;
  if (error) return <div>Error loading event</div>;
  if (!event) return <div>Event not found</div>;

  return <div>{event.title}</div>;
}
```

---

## State Management

### Zustand Stores

#### Auth Store (`lib/stores/auth-store.ts`)

```typescript
import { useAuthStore } from '@/lib/stores/auth-store';

// In components
const { user, isAuthenticated, isLoading } = useAuthStore();
const { setUser, clearAuth } = useAuthStore();

// Check auth status
if (!isAuthenticated) {
    redirect('/auth/login');
}
```

#### Event Form Store (`lib/stores/event-form-store.ts`)

```typescript
import { useEventFormStore } from '@/lib/stores/event-form-store';

// Persist form data across navigation
const { formData, setFormData, reset } = useEventFormStore();
```

#### Wallet Store (`lib/stores/wallet-store.ts`)

```typescript
import { useWalletStore } from '@/lib/stores/wallet-store';

const { isConnected, balance, connect, disconnect } = useWalletStore();
```

### When to Use What

| Need                        | Use                  |
| --------------------------- | -------------------- |
| Server data (events, users) | TanStack Query hooks |
| Auth state                  | `useAuthStore`       |
| Form state (complex forms)  | Zustand store        |
| UI state (sidebar open)     | Zustand store        |
| Simple local state          | React `useState`     |

---

## Component Patterns

### File Naming

All files use **kebab-case**:

```
✅ event-card.tsx
✅ use-event-details.ts
✅ auth-store.ts

❌ EventCard.tsx
❌ useEventDetails.ts
❌ authStore.ts
```

### Component Structure

```typescript
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EventCardProps {
  eventId: string;
  className?: string;
}

export function EventCard({ eventId, className }: EventCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: event, isLoading } = useEventDetails(eventId);

  if (isLoading) {
    return <EventCardSkeleton />;
  }

  return (
    <div className={cn('rounded-lg border p-4', className)}>
      <h3>{event?.title}</h3>
      <Button onClick={() => setIsExpanded(!isExpanded)}>
        {isExpanded ? 'Less' : 'More'}
      </Button>
    </div>
  );
}
```

### UI Components (shadcn/ui + Radix-based)

Located in `components/ui/`. These are **shadcn/ui** components customized for Evento:

```typescript
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
```

### Master Components

Use these **master components** as the canonical patterns. Don't reinvent - extend or compose from these:

#### MasterScrollableSheet (Primary Sheet Pattern)

Located in `components/ui/master-scrollable-sheet.tsx`. **Use this for all new sheets.**

```typescript
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';

// Controlled mode (parent manages state)
<MasterScrollableSheet
  title="Edit Profile"
  open={isOpen}
  onOpenChange={setIsOpen}
  headerRight={<Button>Save</Button>}
  footer={<Button className="w-full">Submit</Button>}
>
  {/* Scrollable content */}
</MasterScrollableSheet>

// Uncontrolled mode (with trigger)
<MasterScrollableSheet
  title="Select Option"
  trigger={<Button>Open Sheet</Button>}
>
  {/* Content */}
</MasterScrollableSheet>
```

Features:

- Sticky header with customizable left/center/right slots
- Optional secondary header (for filters, tabs)
- Scrollable content area
- Optional sticky footer
- Controlled or uncontrolled modes
- Mobile-friendly with handle and safe areas

#### MasterEventCard

Located in `components/master-event-card.tsx`. **Standard event card display.**

```typescript
import { MasterEventCard } from '@/components/master-event-card';

<MasterEventCard
  event={eventWithUser}
  onClick={() => router.push(`/e/${event.id}`)}
  onLongPress={() => openContextMenu()}
/>
```

#### MasterInviteCard

Located in `components/hub/master-invite-card.tsx`. **Event invitation card.**

```typescript
import { MasterInviteCard } from '@/components/hub/master-invite-card';

<MasterInviteCard
  invite={invite}
  onRSVP={() => handleRSVP()}
/>
```

---

## Styling

### Tailwind + cn() Utility

```typescript
import { cn } from '@/lib/utils';

// Conditional classes
<div className={cn(
  'base-styles rounded-lg p-4',
  isActive && 'bg-primary text-primary-foreground',
  isDisabled && 'opacity-50 cursor-not-allowed',
  className
)}>
```

### Design Tokens

Defined in `tailwind.config.ts` and CSS variables:

```css
/* globals.css */
:root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    --primary: 0 0% 9%;
    --primary-foreground: 0 0% 98%;
    --muted: 0 0% 96.1%;
    --muted-foreground: 0 0% 45.1%;
    /* ... */
}
```

Usage:

```typescript
<div className="bg-background text-foreground" />
<div className="bg-primary text-primary-foreground" />
<div className="text-muted-foreground" />
```

---

## Form Handling

### React Hook Form + Zod

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const eventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  startDate: z.string(),
});

type EventFormData = z.infer<typeof eventSchema>;

export function CreateEventForm() {
  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  const createEvent = useCreateEvent();

  const onSubmit = (data: EventFormData) => {
    createEvent.mutate(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Input
        {...form.register('title')}
        placeholder="Event title"
      />
      {form.formState.errors.title && (
        <span className="text-destructive">
          {form.formState.errors.title.message}
        </span>
      )}
      <Button type="submit" disabled={createEvent.isPending}>
        Create Event
      </Button>
    </form>
  );
}
```

---

## Authentication Flow

### Auth Hooks

```typescript
import { useAuth, useLogin, useVerifyCode, useLogout } from '@/lib/hooks/use-auth';

// Check auth status
const { isAuthenticated, user, isLoading } = useAuth();

// Login flow
const login = useLogin();
login.mutate({ email: 'user@example.com' });

// Verify OTP
const verify = useVerifyCode();
verify.mutate({ email, code: '123456' });

// Logout
const logout = useLogout();
logout.mutate();
```

### Protected Routes

```typescript
'use client';

import { useAuth } from '@/lib/hooks/use-auth';
import { redirect } from 'next/navigation';

export function ProtectedPage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <Loading />;
  if (!isAuthenticated) redirect('/auth/login');

  return <div>Protected content</div>;
}
```

---

## Bitcoin Wallet (Breez SDK)

### Wallet Service

Located in `lib/services/breez-sdk.ts`:

```typescript
import { breezService } from '@/lib/services/breez-sdk';

// Connect wallet
await breezService.connect(mnemonic);

// Get balance
const balance = await breezService.getBalance();

// Create invoice
const invoice = await breezService.createInvoice(amountSats, description);

// Send payment
await breezService.sendPayment(bolt11Invoice);

// Parse input (invoice, address, LNURL)
const parsed = await breezService.parseInput(input);
```

### Wallet Hooks

```typescript
import { useWallet } from '@/lib/hooks/use-wallet';
import { useWalletPayments } from '@/lib/hooks/use-wallet-payments';

// Wallet state
const { isConnected, balance, isLoading } = useWallet();

// Payment operations
const { sendPayment, createInvoice } = useWalletPayments();
```

### Wallet Components

Located in `components/wallet/`:

- `wallet-welcome.tsx` - Initial setup screen
- `wallet-setup.tsx` - PIN creation
- `wallet-unlock.tsx` - PIN entry
- `wallet-restore.tsx` - Restore from backup
- `wallet-balance.tsx` - Balance display
- `send-lightning-sheet.tsx` - Send payment flow
- `receive-invoice-sheet.tsx` - Receive payment
- `transaction-history.tsx` - Transaction list

---

## Testing

### Jest + React Testing Library

```typescript
// __tests__/hooks/use-auth.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from '@/lib/hooks/use-auth';
import { wrapper } from '../setup/test-utils';

describe('useAuth', () => {
    it('returns unauthenticated state initially', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
            expect(result.current.isAuthenticated).toBe(false);
        });
    });
});
```

### MSW for API Mocking

```typescript
// __tests__/setup/msw/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
    http.get('/api/v1/user', () => {
        return HttpResponse.json({
            success: true,
            data: { id: 'usr_123', username: 'testuser' },
        });
    }),
];
```

### Running Tests

```bash
pnpm test           # Run all tests
pnpm test:watch     # Watch mode
pnpm test:coverage  # With coverage
```

---

## Common Tasks

### Adding a New Hook

1. Create file in `lib/hooks/use-[feature].ts`:

```typescript
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api/client';
import { queryKeys } from '@/lib/query-client';

export function useFeature(id: string) {
    return useQuery({
        queryKey: ['feature', id],
        queryFn: async () => {
            const response = await apiClient.get(`/v1/feature/${id}`);
            return response.data;
        },
        enabled: !!id,
    });
}
```

2. Add query key to `lib/query-client.ts` if needed

### Adding a New Page

1. Create page file in `app/e/[feature]/page.tsx`:

```typescript
import { FeatureContent } from '@/components/feature/feature-content';

export default function FeaturePage() {
  return <FeatureContent />;
}
```

2. Create component in `components/[feature]/`

### Adding a New Store

1. Create store in `lib/stores/[feature]-store.ts`:

```typescript
import { create } from 'zustand';

interface FeatureState {
    value: string;
    setValue: (value: string) => void;
}

export const useFeatureStore = create<FeatureState>((set) => ({
    value: '',
    setValue: (value) => set({ value }),
}));
```

### Adding UI Components

1. Check if Radix UI has a primitive in `components/ui/`
2. Compose with Tailwind classes
3. Export from the component file

---

## Environment Variables

Required in `.env.local`:

```bash
# API
NEXT_PUBLIC_API_URL=http://localhost:3002

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# External Services
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_GIPHY_API_KEY=
NEXT_PUBLIC_STREAM_CHAT_API_KEY=
NEXT_PUBLIC_BREEZ_API_KEY=

# Ghost CMS (Blog)
NEXT_PUBLIC_GHOST_URL=
NEXT_PUBLIC_GHOST_CONTENT_API_KEY=
```

---

## Development

```bash
# Install dependencies
pnpm install

# Start dev server (runs on port 3003)
pnpm dev

# Type check
pnpm tsc

# Lint
pnpm lint

# Format
pnpm format

# Run tests
pnpm test

# Build
pnpm build
```

---

## Key Conventions Summary

1. **File naming**: Always kebab-case
2. **Data fetching**: Use TanStack Query hooks, never fetch in components directly
3. **Query keys**: Always use `queryKeys` factory
4. **State**: Zustand for client state, React Query for server state
5. **Forms**: React Hook Form + Zod validation
6. **Styling**: Tailwind + `cn()` utility
7. **Components**: Radix UI primitives in `components/ui/`
8. **Mutations**: Always invalidate related queries on success
9. **Errors**: Use `toast.error()` from sonner for user feedback
10. **Types**: Define in `lib/types/`, use Zod schemas for validation

---

_Last updated: January 2025_
