# Claude Sonnet 4 Prompt Template for Evento API Integration

Use this template to prompt Claude for setting up a new frontend that integrates with the Evento API backend.

---

## Prompt Template

```
I need you to help me create a new frontend application that integrates with an existing Evento API backend. Here's the complete API documentation and patterns from the backend codebase:

## Project Overview
Evento is an event management platform with social features. The backend is a Next.js application with Supabase (PostgreSQL) that provides comprehensive APIs for event creation, user management, RSVPs, and real-time features.

**API Base URL**: https://evento.so/api

## Authentication System
- **Session-based auth**: Uses Supabase Auth with HTTP-only cookies
- **External API**: Uses API key authentication (x-evento-api-key header)
- **Protected routes**: Middleware handles session validation and redirects
- **Onboarding flow**: New users redirected to /onboarding if user_details missing

## API Structure
- **Internal APIs**: `/api/v1/*` - Full-featured APIs for authenticated users
- **External APIs**: `/api/ext/v1/*` - Simplified APIs for third-party integration  
- **Authentication**: `/api/auth/*` - Login/logout flows
- **Health Check**: `/api/health` - System status

## Standard Response Format
All APIs return:
```json
{
  "success": boolean,
  "message": string,
  "data": any
}
```

Common HTTP status codes: 200 (success), 400 (bad request), 401 (unauthorized), 403 (forbidden), 404 (not found), 422 (validation error), 500 (server error)

## Core Data Models

### UserDetails
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
  verification_status: 'verified' | 'pending' | null;
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
  status: 'draft' | 'published' | 'cancelled';
  visibility: 'public' | 'private';
  cost: number | null;
  creator_user_id: string;
  
  // Date stored as components for timezone handling
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
  
  // Relations
  user_details?: UserDetails;
}
```

### EventRSVP
```typescript
interface EventRSVP {
  id: string;
  event_id: string;
  user_id: string;
  status: 'yes' | 'no' | 'maybe';
  created_at: string;
  updated_at: string;
  user_details?: UserDetails;
}
```

## Key API Endpoints

### User Management
- `GET /api/v1/user` - Get current user
- `PATCH /api/v1/user` - Update profile
- `GET /api/v1/user/search?q=term` - Search users
- `POST /api/v1/user/follow` - Follow/unfollow user
- `GET /api/v1/user/followers/list?user_id=id` - Get followers
- `GET /api/v1/user/follows/list?user_id=id` - Get following

### Event Management  
- `POST /api/v1/events/create` - Create event
- `GET /api/v1/events/details?event_id=id` - Get event details
- `PATCH /api/v1/events/details` - Update event
- `POST /api/v1/events/cancel` - Cancel event
- `GET /api/v1/events/feed` - Get user's feed (following + own events)
- `GET /api/v1/events/profile/me` - Get current user's events
- `GET /api/v1/events/profile?user_id=id` - Get user's events

### RSVP Management
- `POST /api/v1/events/rsvps` - Create/update RSVP
- `GET /api/v1/events/rsvps?event_id=id` - Get event RSVPs  
- `GET /api/v1/events/rsvps/current-user?event_id=id` - Get current user's RSVP

### Comments & Gallery
- `GET /api/v1/events/comments?event_id=id` - Get comments
- `POST /api/v1/events/comments` - Create comment
- `GET /api/v1/events/gallery?event_id=id` - Get gallery
- `POST /api/v1/events/gallery/upload` - Upload photos

### External API (Public Access)
- `GET /api/ext/v1/events?username=user` - Get user's created events
- `GET /api/ext/v1/profile?username=user` - Get user's profile events  
- `GET /api/ext/v1/events/{id}` - Get specific event
- Requires `x-evento-api-key` header

## Authentication Patterns

### Session-based (Internal APIs)
```typescript
// Check if authenticated
if (!(await isAuthenticated())) return handle401();

// Get current user
const user = await getAuthenticatedUser();
if (!user?.id) return handle401();
```

### API Key (External APIs)  
```typescript
const apiKey = request.headers.get("x-evento-api-key");
if (!VALID_API_KEYS.includes(apiKey)) return handle401();
```

## Image Handling
- Images stored in Supabase Storage
- URLs: `https://api.evento.so/storage/v1/object/public/cdn{path}`
- Optimization: Add `?width=400&height=400` query params
- Fallback: Use default cover if no image provided

## Date Handling  
- Events store date components separately for timezone support
- `computed_start_date` and `computed_end_date` are ISO strings
- Always consider timezone when displaying dates
- Month values are 1-indexed in API (January = 1)

## Validation Rules
- Username: 3-20 characters, alphanumeric only
- Bio: Maximum 280 characters
- Lightning address & NIP-05: Valid email format
- Event title: Required
- Event dates: Start date required, end date optional

## Real-time Features
- Stream Chat integration for messaging
- Supabase Realtime for live updates
- WebSocket connections for notifications

## Error Handling Best Practices
- Always check `success` field in API responses
- Handle 401 errors by redirecting to login
- Display user-friendly error messages from `message` field
- Implement retry logic for transient failures
- Log errors for debugging

## Security Considerations
- Session cookies are HTTP-only and secure
- Input validation with Zod schemas
- No sensitive data in client-side code
- API keys for external access only
- CORS enabled for cross-origin requests

## Required Environment Variables
```bash
NEXT_PUBLIC_EVENTO_API_BASE_URL=https://evento.so/api
EVENTO_EXTERNAL_API_KEY=your_api_key_here # For external APIs only
```

---

## Your Task
Create a [SPECIFY YOUR FRONTEND TYPE: React/Next.js/Vue/etc.] application that integrates with this Evento API. I need:

1. **API Client Setup**: Configure HTTP client with proper authentication handling
2. **TypeScript Types**: Complete type definitions based on the data models above  
3. **Authentication Flow**: Session management and login/logout handling
4. **Core Features**: [SPECIFY WHICH FEATURES YOU NEED]
   - User profile management
   - Event browsing and creation
   - RSVP functionality
   - Event feed/timeline
   - Search functionality
   - [ADD ANY SPECIFIC FEATURES]

5. **Error Handling**: Centralized error management with user-friendly messages
6. **State Management**: [SPECIFY: Redux/Zustand/Context/etc.] for app state
7. **UI Components**: [SPECIFY UI LIBRARY: Material-UI/Tailwind/etc.] for styling

## Additional Requirements
[ADD ANY SPECIFIC REQUIREMENTS, e.g.:]
- Mobile-responsive design
- Real-time updates for events/messages
- Image upload functionality  
- Calendar integration
- Social sharing features
- Payment integration
- Offline support
- PWA capabilities

Please provide complete, production-ready code with proper error handling, TypeScript types, and following modern React/[YOUR FRAMEWORK] best practices.
```

---

## Usage Instructions

1. **Copy the template above**
2. **Fill in the bracketed sections** with your specific requirements:
   - `[SPECIFY YOUR FRONTEND TYPE]`: React, Next.js, Vue, Svelte, etc.
   - `[SPECIFY WHICH FEATURES YOU NEED]`: List the specific features you want
   - `[SPECIFY: Redux/Zustand/Context/etc.]`: Your preferred state management
   - `[SPECIFY UI LIBRARY]`: Your preferred UI framework
   - `[ADD ANY SPECIFIC REQUIREMENTS]`: Any additional requirements

3. **Add context about your project**:
   - Target audience
   - Performance requirements  
   - Browser support needs
   - Deployment environment

4. **Include any existing code** you want Claude to integrate with or build upon

## Example Filled Template

```
I need you to help me create a new React/Next.js frontend application that integrates with an existing Evento API backend. Here's the complete API documentation and patterns from the backend codebase:

[... include the full template above ...]

## Your Task
Create a Next.js 14 application with App Router that integrates with this Evento API. I need:

1. **API Client Setup**: Configure Axios with proper authentication handling
2. **TypeScript Types**: Complete type definitions based on the data models above  
3. **Authentication Flow**: Session management and login/logout handling
4. **Core Features**: 
   - User profile management and editing
   - Event browsing with infinite scroll
   - Event creation with rich form validation
   - RSVP functionality with real-time updates
   - Social feed showing followed users' events
   - User search and follow/unfollow
   - Event comments and gallery

5. **Error Handling**: Centralized error management with toast notifications
6. **State Management**: Zustand for client state + TanStack Query for server state
7. **UI Components**: Tailwind CSS with Headless UI components

## Additional Requirements
- Mobile-first responsive design
- Real-time updates using Supabase Realtime
- Image upload with drag-and-drop interface
- Calendar view for events
- Social sharing with Open Graph tags
- SEO optimization for event pages
- Progressive Web App capabilities
- Dark/light mode toggle

Please provide complete, production-ready code with proper error handling, TypeScript types, and following modern Next.js 14 best practices including Server Components where appropriate.
```

This template provides Claude with all the context needed to build a comprehensive frontend that properly integrates with the Evento API backend.