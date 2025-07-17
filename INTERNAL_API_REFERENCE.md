# Internal API Reference

Complete reference for all internal API endpoints (`/api/v1/*`) used by the Evento frontend.

**Base URL**: `https://evento.so/api/v1`

## Authentication Required

All internal APIs require user authentication via session cookies. Unauthorized requests return `401`.

## User Management APIs

### Get Current User

```
GET /api/v1/user
```

Get the authenticated user's profile information.

**Response:**

```json
{
  "success": true,
  "message": "User fetched successfully",
  "data": [
    {
      "id": "user_123",
      "username": "johndoe",
      "bio": "Event organizer and tech enthusiast",
      "verification_status": "verified",
      "image": "https://...",
      "name": "John Doe",
      "bio_link": "https://johndoe.com",
      "x_handle": "johndoe",
      "instagram_handle": "johndoe",
      "ln_address": "john@getalby.com",
      "nip05": "john@nostr.com"
    }
  ]
}
```

### Update User Profile

```
PATCH /api/v1/user
```

Update the authenticated user's profile information.

**Request Body:**

```json
{
  "username": "newusername",
  "name": "New Name",
  "bio": "Updated bio",
  "bio_link": "https://newsite.com",
  "x_handle": "newhandle",
  "instagram_handle": "newinstagram",
  "image": "https://new-avatar-url.com",
  "ln_address": "new@getalby.com",
  "nip05": "new@nostr.com"
}
```

**Validation:**

- `username`: 3-20 characters, alphanumeric only
- `bio`: Maximum 280 characters
- `ln_address`, `nip05`: Valid email format

### User Search

```
GET /api/v1/user/search?q=search_term
```

Search for users by username or name.

### User Events Count

```
GET /api/v1/user/events/count
```

Get count of events created by the authenticated user.

### Follow User

```
POST /api/v1/user/follow
```

Follow or unfollow a user.

**Request Body:**

```json
{
  "user_id": "target_user_id",
  "action": "follow" // or "unfollow"
}
```

### Get Followers

```
GET /api/v1/user/followers/list?user_id=user_123
GET /api/v1/user/followers/count?user_id=user_123
```

### Get Following

```
GET /api/v1/user/follows/list?user_id=user_123
GET /api/v1/user/follows/count?user_id=user_123
```

### User Image Upload

```
POST /api/v1/user/details/image-upload
```

Upload a new profile image. Supports multipart/form-data.

## Event Management APIs

### Create Event

```
POST /api/v1/events/create
```

Create a new event.

**Request Body:**

```json
{
  "title": "Tech Conference 2024",
  "description": "Annual technology conference",
  "location": "San Francisco, CA",
  "cover": "https://cover-image-url.com",
  "timezone": "America/Los_Angeles",
  "status": "published", // "draft" | "published"
  "visibility": "public", // "public" | "private"
  "cost": 50.0,

  "start_date_day": 20,
  "start_date_month": 3,
  "start_date_year": 2024,
  "start_date_hours": 10,
  "start_date_minutes": 0,

  "end_date_day": 20,
  "end_date_month": 3,
  "end_date_year": 2024,
  "end_date_hours": 18,
  "end_date_minutes": 0,

  "spotify_url": "https://open.spotify.com/playlist/...",
  "wavlake_url": "https://wavlake.com/...",
  "contrib_cashapp": "$johndoe",
  "contrib_venmo": "@johndoe",
  "contrib_paypal": "johndoe@example.com",
  "contrib_btclightning": "lnbc1...",

  "settings": {
    "max_capacity": 100,
    "show_capacity_count": true
  }
}
```

### Get Event Details

```
GET /api/v1/events/details?event_id=event_123
```

### Update Event

```
PATCH /api/v1/events/details
```

Update event information (same structure as create).

### Cancel Event

```
POST /api/v1/events/cancel
```

**Request Body:**

```json
{
  "event_id": "event_123"
}
```

### Get User's Events Feed

```
GET /api/v1/events/feed
```

Get events from users the current user follows, plus their own events.

### Get Public Events by Username

```
GET /api/v1/events/{username}/public
```

Get public events created by a specific user.

### Get User's Profile Events

```
GET /api/v1/events/profile?user_id=user_123
```

Get events associated with a user's profile (created + RSVP'd).

### Get Current User's Events

```
GET /api/v1/events/profile/me
```

Get the authenticated user's events.

### Get Going Events

```
GET /api/v1/events/profile/going?user_id=user_123
```

Get events the user has RSVP'd "yes" to.

### Get Past Events

```
GET /api/v1/events/profile/gone?user_id=user_123
```

Get past events the user attended.

### Event Hosts

```
GET /api/v1/events/hosts?event_id=event_123
POST /api/v1/events/hosts
```

Manage event hosts.

## RSVP Management

### Create/Update RSVP

```
POST /api/v1/events/rsvps
PATCH /api/v1/events/rsvps
```

**Request Body:**

```json
{
  "event_id": "event_123",
  "status": "yes" // "yes" | "no" | "maybe"
}
```

### Get Event RSVPs

```
GET /api/v1/events/rsvps?event_id=event_123
```

Get all RSVPs for an event.

### Get Current User's RSVP

```
GET /api/v1/events/rsvps/current-user?event_id=event_123
```

## Event Comments

### Get Comments

```
GET /api/v1/events/comments?event_id=event_123
```

### Create Comment

```
POST /api/v1/events/comments
```

**Request Body:**

```json
{
  "event_id": "event_123",
  "content": "Great event!"
}
```

### Comment Reactions

```
POST /api/v1/events/comments/{commentId}/reactions
```

**Request Body:**

```json
{
  "type": "like" // reaction type
}
```

## Event Gallery

### Get Gallery

```
GET /api/v1/events/gallery?event_id=event_123
```

### Upload Photos

```
POST /api/v1/events/gallery/upload
```

Multipart upload for event photos.

### Gallery Likes

```
POST /api/v1/events/gallery/likes
```

Like/unlike gallery photos.

## Event Favorites

### Add to Favorites

```
POST /api/v1/events/favorites/add
```

**Request Body:**

```json
{
  "event_id": "event_123"
}
```

### Remove from Favorites

```
POST /api/v1/events/favorites/remove
```

### Get Favorites

```
GET /api/v1/events/favorites/fetch
GET /api/v1/events/favorites/fetch/{user_id}
```

## Email Blasts

### Send Email Blast

```
POST /api/v1/events/email-blasts/{eventId}
```

### Get Email Blast Details

```
GET /api/v1/events/email-blasts/{eventId}/{blastId}
```

### Get Email Deliveries

```
GET /api/v1/events/email-blasts/{eventId}/{blastId}/deliveries
```

### Get Recipients Count

```
GET /api/v1/events/email-blasts/{eventId}/recipients-count
```

## Invitations

### Send Event Invites

```
POST /api/v1/events/invites
```

**Request Body:**

```json
{
  "event_id": "event_123",
  "user_ids": ["user_1", "user_2"]
}
```

### Send Email Invites

```
POST /api/v1/invites/emails
```

### Send SMS Invites

```
POST /api/v1/invites/sms
```

## Payments

### Event Payments

```
GET /api/v1/events/payments?event_id=event_123
POST /api/v1/events/payments
```

Handle event-related payments.

## Direct Messages

### Get DM Channel

```
GET /api/v1/dm/channel?user_id=target_user_id
```

### Refresh DM Data

```
POST /api/v1/dm/refresh
```

## Utilities

### Cover Upload

```
POST /api/v1/cover-upload
```

Upload event cover images.

### Generate Event Description

```
POST /api/v1/events/generate-description
```

AI-generated event descriptions.

### Feedback

```
POST /api/v1/feedback
```

Submit user feedback.

### Welcome Message

```
POST /api/v1/welcome-message
```

Send welcome messages to new users.

## Blog

### Get Blog Posts

```
GET /api/v1/blog/posts
```

## Slack Integration

### Slack Webhook

```
POST /api/v1/slack
```

## Admin APIs

### Fix Computed Dates

```
POST /api/v1/admin/fix-computed-dates
```

Admin utility to fix date calculations.

## Cron Jobs

### Event Reminders

```
POST /api/v1/cron/events/reminders
```

### Welcome Cron

```
POST /api/v1/cron/welcome
```

## Webhooks

All webhook endpoints handle external integrations:

### Event Webhooks

- `/api/v1/webhooks/events/update`
- `/api/v1/webhooks/events/rsvp/new`
- `/api/v1/webhooks/events/comments/new`
- `/api/v1/webhooks/events/comments/reactions/new`
- `/api/v1/webhooks/events/gallery/reactions`
- `/api/v1/webhooks/events/invites/response`

### User Webhooks

- `/api/v1/webhooks/users/upsert`
- `/api/v1/webhooks/users/follows`

### Chat Webhooks

- `/api/v1/webhooks/chat`

## Error Handling

All endpoints return standardized error responses:

### Common Error Codes

- `400` - Invalid request data
- `401` - Not authenticated
- `403` - Insufficient permissions
- `404` - Resource not found
- `422` - Validation failed
- `500` - Server error

### Error Response Format

```json
{
  "success": false,
  "message": "Specific error description"
}
```

## Rate Limiting

No explicit rate limiting is implemented in the API layer. Rate limiting is handled by the hosting platform (Vercel).

## Real-time Features

The application uses Stream Chat for real-time messaging and Supabase Realtime for live updates on events, RSVPs, and comments.
