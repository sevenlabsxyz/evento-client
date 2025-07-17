# Evento API Documentation

## Overview

Evento is a Next.js application with a comprehensive API for event management, user profiles, and social features. The API is built on Supabase with PostgreSQL and follows RESTful conventions.

**Base URL**: `https://evento.so/api`

## Architecture

### Technology Stack

- **Framework**: Next.js 14+ with App Router
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with JWT
- **Session Management**: HTTP-only cookies
- **Real-time**: Supabase Realtime + Stream Chat

### API Structure

- **Internal APIs**: `/api/v1/*` - Full featured APIs for authenticated users
- **External APIs**: `/api/ext/v1/*` - Simplified APIs for third-party integration
- **Authentication**: `/api/auth/*` - Login/logout flows
- **Health Check**: `/api/health` - System status

## Authentication System

### Session-Based Authentication

Evento uses Supabase Auth with HTTP-only cookies for session management. The authentication flow:

1. **Login**: User provides credentials → Supabase validates → Session cookie set
2. **Request**: Client sends request with session cookie → Middleware validates → API processes
3. **Logout**: Session cookie cleared

### Middleware Protection

The middleware (`middleware.ts`) handles:

- Session validation for protected routes
- Automatic redirects for unauthenticated users
- Onboarding flow enforcement
- Cookie management

### Protected Routes

These route patterns require authentication:

- `/activity`, `/feed`, `/me`, `/my-events`
- `/feedback`, `/lists`, `/search`, `/dm`, `/hub`

### API Authentication Patterns

#### Internal APIs (`/api/v1/*`)

```typescript
// Check authentication
if (!(await isAuthenticated())) return handle401();

// Get authenticated user
const user = await getAuthenticatedUser();
if (!user?.id) return handle401();
```

#### External APIs (`/api/ext/v1/*`)

```typescript
// API key validation
const apiKey = request.headers.get("x-evento-api-key");
if (!VALID_API_KEYS.includes(apiKey)) return handle401();
```

## Standard Response Format

All APIs follow a consistent response structure:

### Success Response (200)

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    /* response data */
  }
}
```

### Error Response (4xx/5xx)

```json
{
  "success": false,
  "message": "Error description"
}
```

### Common HTTP Status Codes

- `200` - Success
- `400` - Bad Request (validation errors, missing params)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `422` - Unprocessable Entity (invalid data format)
- `500` - Internal Server Error

## Core Data Models

### User Profile

```typescript
interface UserDetails {
  id: string;
  username: string;
  name: string;
  bio: string;
  image: string;
  bio_link: string;
  x_handle: string;
  instagram_handle: string;
  ln_address: string; // Lightning address
  nip05: string; // Nostr identifier
  verification_status: "verified" | "pending" | null;
  verification_date: string;
}
```

### Event

```typescript
interface Event {
  id: string;
  title: string;
  description: string;
  cover: string;
  location: string;
  timezone: string;
  status: "draft" | "published" | "cancelled";
  visibility: "public" | "private";
  cost: number | null;
  creator_user_id: string;

  // Date components (stored separately for timezone handling)
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

  // Computed ISO dates
  computed_start_date: string;
  computed_end_date: string;

  // Media & Links
  spotify_url: string;
  wavlake_url: string;

  // Contribution methods
  contrib_cashapp: string;
  contrib_venmo: string;
  contrib_paypal: string;
  contrib_btclightning: string;

  created_at: string;
  updated_at: string;
}
```

### RSVP

```typescript
interface EventRSVP {
  id: string;
  event_id: string;
  user_id: string;
  status: "yes" | "no" | "maybe";
  created_at: string;
  updated_at: string;
}
```

### Event Settings

```typescript
interface EventSettings {
  id: string;
  event_id: string;
  max_capacity: number | null;
  show_capacity_count: boolean;
}
```

## Database Schema Overview

### Core Tables

- `user_details` - User profiles and metadata
- `events` - Event information and details
- `event_rsvps` - Event attendance responses
- `event_hosts` - Event host relationships
- `event_settings` - Event configuration options
- `event_comments` - Comments on events
- `event_gallery` - Event photo galleries
- `follows` - User follow relationships
- `notifications` - System notifications

### Relationships

- Users can create many events (`creator_user_id`)
- Users can host many events (many-to-many via `event_hosts`)
- Users can RSVP to many events (many-to-many via `event_rsvps`)
- Users can follow other users (many-to-many via `follows`)
- Events can have many comments, gallery items, RSVPs

## Environment Variables

### Required Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# External integrations (optional)
OPENAI_API_KEY=your_openai_key
RESEND_API_KEY=your_resend_key
KNOCK_API_KEY=your_knock_key
```

## Security Considerations

### Data Protection

- User passwords handled by Supabase Auth
- Session tokens in HTTP-only cookies
- API keys for external access (hardcoded list)
- Input validation with Zod schemas
- SQL injection protection via Supabase client

### Rate Limiting

No explicit rate limiting implemented - handled by Vercel/hosting platform.

### CORS

API endpoints accessible from any origin for external integration.

## Utility Functions

### Response Handlers

```typescript
// Success responses
handle200(data, message); // 200 with data
handle200But404(message); // 200 but no data found

// Error responses
handle400(error); // Bad request
handle401(); // Unauthorized
handle403(); // Forbidden
handle404(); // Not found
handle422(params); // Validation error
handle500(error); // Server error
```

### Data Utilities

```typescript
cleanNullInObj(obj); // Remove null/undefined values
stripHTMLTags(html); // Sanitize HTML content
getProperImageURL(url); // Handle image URL formatting
```

## Testing & Health Check

### Health Endpoint

```
GET /api/health
```

Returns basic system status for monitoring.

### Error Logging

All errors logged to console with structured format:

```typescript
logError(message); // Error-level logging
logWarn(message); // Warning-level logging
logInfo(message); // Info-level logging
```

## Next Steps

For detailed API endpoint documentation, see:

- `INTERNAL_API_REFERENCE.md` - Complete internal API documentation
- `EXTERNAL_API_GUIDE.md` - External API integration guide
- `FRONTEND_INTEGRATION_GUIDE.md` - Client implementation examples
