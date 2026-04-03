# Hub V1 API Handoff And Frontend Migration Plan

Date: 2026-03-24
Status: API ticket drafted, backend contract finalized for frontend handoff
Primary goal: reduce `/e/hub` client-side request fan-out without requiring an auth redesign

## Summary

The current hub page issues several authenticated client-side requests after hydration, plus a separate client-side Ghost fetch. The first phase should not attempt a true server-component migration for authenticated hub data, because the separate Next app does not reliably receive the API's auth cookies today. Instead, phase 1 should introduce a new authenticated aggregator endpoint, `GET /v1/hub`, that returns the data needed for the default-visible hub sections in one payload.

This document does two things:

1. It defines a detailed API ticket for `/v1/hub` so an API agent can implement it.
2. It captures the 4-step frontend migration plan we want to execute after the API exists.

## Why This Exists

The current `/e/hub` experience is slower than it needs to be because it combines:

- client-side auth/onboarding gating
- duplicate current-user lookups
- several independent section-level React Query requests
- a client-side Ghost fetch
- always-on shared layout work from chat/wallet/lightning

The API handoff in this doc only addresses the hub-specific request fan-out. It does not solve the global shell costs by itself.

## Current Hub Request Inventory

These are the current data sources involved in the hub experience.

| Area                     | Current frontend source                                                                    | Endpoint / source                                                                                     | Load timing               | Notes                                  |
| ------------------------ | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- | ------------------------- | -------------------------------------- |
| Auth gate                | `useRequireAuth()` in `app/e/hub/page.tsx`                                                 | `authService.getCurrentUser()` -> `GET /v1/user`                                                      | immediate on mount        | client-only redirect gate              |
| Onboarding gate          | `useRequireOnboarding()` in `app/e/hub/page.tsx`                                           | `useAuth()` -> `GET /v1/user` again                                                                   | immediate on mount        | duplicates auth lookup path            |
| Current user profile     | `useUserProfile()` in `app/e/hub/page.tsx`                                                 | `GET /v1/user` again                                                                                  | immediate on mount        | third user fetch path on this screen   |
| Pending cohost invites   | `useMyCohostInvites('pending')`                                                            | `GET /v1/user/cohost-invites?status=pending`                                                          | immediate on mount        | drives `CohostInvitesSection`          |
| My events, default tab   | `useUserEvents({ filter: 'upcoming', timeframe: 'future', sortBy: 'date-asc', limit: 6 })` | `GET /v1/events/user-events?timeframe=future&sortBy=date&sortOrder=asc&page=1&limit=6`                | immediate on mount        | drives default `My Events` tab         |
| My events, hosting tab   | `useUserEvents({ filter: 'hosting', timeframe: 'future', sortBy: 'date-asc', limit: 6 })`  | `GET /v1/events/user-events?filter=hosting&timeframe=future&sortBy=date&sortOrder=asc&page=1&limit=6` | lazy after tab open       | secondary tab                          |
| My events, drafts tab    | `useMyDraftEvents({ limit: 6 })`                                                           | `GET /v1/events/me/drafts?page=1&limit=6`                                                             | lazy after tab open       | secondary tab                          |
| For You, default tab     | `useForYouEvents()`                                                                        | `GET /v1/events/for-you`                                                                              | immediate on mount        | drives default `For You` tab           |
| For You, following tab   | `useFollowingEvents()`                                                                     | `GET /v1/events/following`                                                                            | lazy after tab open       | secondary tab                          |
| Event invites, pending   | `useEventInvites('pending')`                                                               | `GET /v1/events/invites?status=pending`                                                               | immediate on mount        | drives thumbnail strip and sheet count |
| Event invites, responded | `useEventInvites('responded')`                                                             | `GET /v1/events/invites?status=responded`                                                             | lazy after sheet/tab open | secondary tab                          |
| Hub blog                 | `fetch(...)` inside `HubBlogGallery`                                                       | Ghost Content API, `filter=tag:hub`                                                                   | immediate on mount        | currently client-side only             |

## Scope Recommendation

The new `/v1/hub` endpoint should cover only the authenticated, default-visible hub sections for v1:

- viewer
- pending cohost invites
- my upcoming events
- discover events
- pending event invites

The following should stay lazy in v1 and continue using their current endpoints until phase 2:

- hosting events tab
- drafts tab
- following tab
- responded invites tab
- blog content

This keeps v1 focused and avoids turning `/v1/hub` into a giant catch-all endpoint.

## API Ticket: `GET /v1/hub`

### Goal

Return the authenticated hub data needed for the initial, default-visible state of `/e/hub` in one request, using the same request-scoped auth model as the existing protected endpoints.

### Auth Requirements

- The endpoint must use the same request-scoped auth path as the current authenticated hub endpoints.
- It must authenticate the current user exactly the same way as `GET /v1/user`, `GET /v1/events/invites`, `GET /v1/user/cohost-invites`, and `GET /v1/events/user-events`.
- It must not assume a browser-only execution context beyond the existing API auth wrapper behavior.

### Route

`GET /api/v1/hub`

### Query Parameters

These are optional. Defaults should be applied if omitted.

| Parameter               | Type    | Default | Purpose                                                               |
| ----------------------- | ------- | ------- | --------------------------------------------------------------------- |
| `my_upcoming_limit`     | integer | `6`     | number of items to return for the default `My Events` tab             |
| `discover_limit`        | integer | `12`    | number of discover events to return for initial section + sheet usage |
| `pending_invites_limit` | integer | `10`    | number of pending event invites to return                             |
| `pending_cohost_limit`  | integer | `10`    | number of pending cohost invites to return                            |

V1 does not need an `include=` parameter. Keep the contract explicit.

### High-Level Implementation Guidance

This endpoint should be an orchestrator, not one giant query.

Recommended implementation approach:

- authenticate the viewer once
- kick off the section fetches in parallel
- normalize the response into a stable hub contract
- avoid cross-section duplication only where cheap and safe

Good pattern:

- `Promise.allSettled(...)` over section fetches
- section-level normalization into a single payload
- section-level `status` values so one failed section does not blank the entire hub

Avoid:

- a single monster SQL query with many joins
- tightly coupling all section failures together
- creating a contract that is so custom that the frontend cannot map it back to existing UI types

### Required Sections In V1

The response must contain these sections:

1. `viewer`
2. `sections.pending_cohost_invites`
3. `sections.my_upcoming_events`
4. `sections.discover_events`
5. `sections.pending_event_invites`

### Response Shape

Use the normal API wrapper:

```ts
type HubResponse = ApiResponse<HubPayload>;
```

Proposed payload:

```ts
type SectionStatus = 'ok' | 'error';

interface HubPayload {
    viewer: UserDetails | null;
    generated_at: string;
    sections: {
        pending_cohost_invites: HubListSection<CohostInvite>;
        my_upcoming_events: HubListSection<EventWithUser>;
        discover_events: HubListSection<ForYouEvent>;
        pending_event_invites: HubListSection<EventInvite>;
    };
}

interface HubListSection<T> {
    status: SectionStatus;
    items: T[];
    total_count: number | null;
    has_more: boolean;
    error?: {
        code: string;
        message: string;
    };
}
```

### Example Response

```json
{
    "success": true,
    "message": "Hub loaded",
    "data": {
        "viewer": {
            "id": "usr_123",
            "username": "andre",
            "name": "Andre",
            "email": "andre@example.com",
            "bio": "...",
            "image": "https://...",
            "bio_link": "",
            "x_handle": "",
            "instagram_handle": "",
            "ln_address": "",
            "nip05": "",
            "telegram_id": null,
            "verification_status": "verified",
            "verification_date": "2026-01-01T00:00:00.000Z"
        },
        "generated_at": "2026-03-24T21:00:00.000Z",
        "sections": {
            "pending_cohost_invites": {
                "status": "ok",
                "items": [],
                "total_count": 0,
                "has_more": false
            },
            "my_upcoming_events": {
                "status": "ok",
                "items": [],
                "total_count": 0,
                "has_more": false
            },
            "discover_events": {
                "status": "ok",
                "items": [],
                "total_count": null,
                "has_more": false
            },
            "pending_event_invites": {
                "status": "ok",
                "items": [],
                "total_count": 0,
                "has_more": false
            }
        }
    }
}
```

## Section Contracts

The safest frontend migration is to preserve the existing item shapes for each section so the UI can keep using existing components with minimal adapters.

### 1. `viewer`

Return the same `UserDetails` shape currently returned by the current-user profile flow.

Required fields:

- `id`
- `username`
- `name`
- `email`
- `bio`
- `image`
- `bio_link`
- `x_handle`
- `instagram_handle`
- `ln_address`
- `nip05`
- `telegram_id`
- `verification_status`
- `verification_date`

Why return the full profile shape:

- phase 2 frontend work will use this to seed both the auth and profile query caches
- it reduces the need for additional user fetches triggered by the hub screen and shell

### 2. `sections.pending_cohost_invites`

Use the current `CohostInvite` item shape.

Required fields used by the hub UI:

- invite fields:
    - `id`
    - `event_id`
    - `inviter_id`
    - `invitee_id`
    - `invitee_email`
    - `message`
    - `status`
    - `created_at`
    - `updated_at`
    - `responded_at`
- `inviter` object:
    - `id`
    - `username`
    - `name`
    - `image`
    - `verification_status`
- `events` object:
    - enough to satisfy `EventWithUser` usage in `CohostInviteCard`
    - at minimum: `id`, `title`, `cover`, `location`, `user_details`

Behavior:

- include only `status = pending` invites in v1
- sort newest first unless current API behavior differs and there is a product reason not to

### 3. `sections.my_upcoming_events`

Use the current `EventWithUser` item shape.

Required fields used by `MasterEventCard`:

- `id`
- `title`
- `cover`
- `location`
- `timezone`
- `cost`
- `max_capacity`
- `show_capacity_count`
- `computed_start_date`
- `start_date_year`
- `start_date_month`
- `start_date_day`
- `start_date_hours`
- `start_date_minutes`
- `user_details`:
    - `id`
    - `username`
    - `name`
    - `image`
    - `verification_status`

Behavior:

- mirror current "Upcoming" tab semantics
- equivalent to:
    - `filter = upcoming`
    - `timeframe = future`
    - `sortBy = date-asc`
    - `page = 1`
    - `limit = my_upcoming_limit`
- include:
    - `total_count`
    - `has_more`

### 4. `sections.discover_events`

Use the current `ForYouEvent` item shape.

Required fields:

- everything required by `EventWithUser`
- `featured_id`
- `featured_position`

Behavior:

- match current discover tab semantics from `GET /v1/events/for-you`
- preserve backend ordering
- return up to `discover_limit`
- if the underlying system cannot cheaply produce `total_count`, `total_count` may be `null`
- `has_more` should still be populated if it can be determined

### 5. `sections.pending_event_invites`

Use the current `EventInvite` item shape.

Required invite fields:

- `id`
- `event_id`
- `inviter_id`
- `invitee_id`
- `invitee_email`
- `message`
- `status`
- `response`
- `created_at`
- `updated_at`

Required nested `events` fields:

- enough to satisfy:
    - `EventInviteStoryThumbnail`
    - `EventInviteDetailSheet`
    - `MasterInviteCard`
- safest option: return the same `EventWithUser` shape currently returned by `GET /v1/events/invites`

Behavior:

- include only `status = pending` invites in v1
- newest first unless current product behavior differs
- return enough items for the hub strip and invite sheet
- include `total_count` and `has_more`

## Explicitly Out Of Scope For `/v1/hub` V1

These remain separate, lazy endpoints for now:

- hosting tab events
- draft events tab
- following tab events
- responded invites tab
- blog content from Ghost

Reason:

- these are not visible in the default initial state
- keeping them lazy limits payload size and keeps v1 simpler
- this is enough to remove the largest hub request fan-out without overdesigning the first endpoint

## Failure Semantics

The endpoint should not fail the entire hub if one non-critical section fails.

Recommended behavior:

- if auth fails, return the normal auth error
- if auth succeeds, return `200` with `success = true`
- for any failed section:
    - set `status = error`
    - set `items = []`
    - set `error.code`
    - set `error.message`

Example section error:

```json
{
    "status": "error",
    "items": [],
    "total_count": null,
    "has_more": false,
    "error": {
        "code": "DISCOVER_EVENTS_FAILED",
        "message": "Failed to load discover events"
    }
}
```

This lets the frontend degrade section-by-section instead of failing the entire page.

## API Acceptance Criteria

- `GET /v1/hub` authenticates the current user using the same request-scoped auth model as the existing protected endpoints.
- The endpoint returns the `viewer` object plus the four required v1 sections in one response.
- Section fetches are orchestrated in parallel, not serially.
- The response preserves existing item shapes closely enough that current hub UI components can reuse them with minimal adapters.
- The endpoint does not rely on one giant DB query.
- A failure in one section does not automatically fail the entire hub response.
- Limits are enforced via query params with safe defaults.
- Pending invites and pending cohost invites are filtered server-side.
- My upcoming events preserve current sort and filter semantics.
- Discover events preserve current backend ordering semantics.
- The endpoint is safe to call from the existing browser-authenticated client app.

## Frontend Integration Acceptance Criteria

- `/e/hub` performs one authenticated hub data request for its default-visible user-scoped sections.
- `/e/hub` no longer issues separate initial requests for:
    - pending cohost invites
    - my upcoming events
    - discover events
    - pending event invites
- The hub can still lazy-load:
    - hosting events
    - draft events
    - following events
    - responded invites
- The frontend can seed `viewer` into both:
    - `['auth', 'user']`
    - `['user', 'profile']`
      so hub does not immediately trigger duplicate current-user fetches.
- Existing hub UI components continue to render the same content and actions with no product regression.

## 4-Step Frontend Plan

This section is the plan we want to return to once the API exists.

### 1. Introduce `useHubData` backed by `GET /v1/hub`

Frontend tasks:

- add a new `useHubData` hook
- fetch `/v1/hub`
- normalize section state into a single source for the initial hub screen
- pass section `items` into:
    - `CohostInvitesSection`
    - `MyEventsSection`
    - `ForYouSection`
    - `EventInvitesSection`

Important implementation note:

- do not immediately delete the secondary lazy hooks
- keep hosting, drafts, following, and responded invites on their existing endpoints until phase 2

### 2. Remove duplicate current-user/profile fetches on hub

Frontend tasks:

- stop relying on separate immediate hub-level current-user fetches where possible
- hydrate or seed the existing auth/profile caches from `data.viewer`
- ensure the hub page itself does not trigger redundant `GET /v1/user` fetches on first load

Target outcome:

- hub should not independently kick off multiple current-user queries on mount

### 3. Move hub blog data off client-side `useEffect`

Current state:

- `HubBlogGallery` manually calls Ghost from a client `useEffect`

Desired state:

- use the existing server-friendly Ghost service in `lib/services/ghost.ts`
- render blog content via a server component or a server-fetched parent payload
- keep it separate from `/v1/hub` because it is not authenticated user data

Reason:

- blog content is public and cacheable
- it should not wait for client hydration

### 4. Reassess eager chat/wallet/lightning initialization after the hub work lands

This is intentionally later.

Reason:

- hub request fan-out is the more surgical first win
- chat/wallet/lightning requirements have product implications and should be measured after hub aggregation lands

What to evaluate afterward:

- whether chat must fully connect on every `/e/*` route, or can be warmed differently
- whether wallet/lightning can remain available without doing the heaviest work on every route mount
- what the actual before/after hub improvement looks like once `/v1/hub` is live

## Open Questions For Follow-Up

- Should `/v1/hub` eventually support secondary sections behind an `include=` parameter, or should those remain on their own endpoints permanently?
- For discover events, do we want a hard payload limit that also caps the sheet, or should the sheet continue to lazy-load more?
- Do we want the API to return per-section `last_updated_at` metadata for debugging and analytics?
- After phase 1, should the frontend shell consume `viewer` globally to reduce duplicate current-user reads outside hub too?

## Recommendation To The API Agent

Build `/v1/hub` v1 as a parallelized authenticated aggregator for the default-visible hub sections only. Preserve existing item shapes where possible. Do not try to solve every secondary tab in the first version, and do not implement this as one giant joined query unless there is a clearly superior existing internal service path.

## Backend Finalized Handoff

This section supersedes earlier implementation assumptions. Use this as the frontend source of truth unless the API contract changes again.

### Backend Status

- `GET /api/v1/hub` exists in the API at `app/api/v1/hub/route.ts`.
- The route is authenticated with the normal protected-route wrapper `withAuth`, so browser cookie auth should behave the same way as the rest of the web app.
- The hub service lives in `lib/services/hub.ts`.
- `my_upcoming_events` is now DB-driven via the RPC `public.get_user_upcoming_hub_event_ids(...)`.
- The SQL definition for that function is in `supabase/sql/hub.sql`.
- The endpoint contract did not change.

Normal success envelope:

```ts
{
  success: true,
  message: "Hub loaded",
  data: HubPayload
}
```

Normal auth failure:

```ts
{
  success: false,
  message: "Not authenticated."
}
```

### Exact Endpoint Contract

Request:

```http
GET /api/v1/hub
```

Optional query params and defaults:

- `my_upcoming_limit=6`
- `discover_limit=12`
- `pending_invites_limit=10`
- `pending_cohost_limit=10`

Payload inside `data`:

```ts
type SectionStatus = 'ok' | 'error';

interface HubPayload {
    viewer: UserDetails | null;
    generated_at: string;
    sections: {
        pending_cohost_invites: HubListSection<CohostInvite>;
        my_upcoming_events: HubListSection<EventWithUser>;
        discover_events: HubListSection<ForYouEvent>;
        pending_event_invites: HubListSection<EventInvite>;
    };
}

interface HubListSection<T> {
    status: SectionStatus;
    items: T[];
    total_count: number | null;
    has_more: boolean;
    error?: {
        code: string;
        message: string;
    };
}
```

Section-level failure semantics:

- overall response is still `200` if auth succeeded
- failed section shape is:

```ts
{
  status: "error",
  items: [],
  total_count: null,
  has_more: false,
  error: {
    code: string,
    message: string
  }
}
```

### Final Section Semantics

`viewer`

- same current-user shape from `user_details`
- returned fields:
    - `id`
    - `username`
    - `name`
    - `email`
    - `bio`
    - `image`
    - `bio_link`
    - `x_handle`
    - `instagram_handle`
    - `ln_address`
    - `nip05`
    - `telegram_id`
    - `verification_status`
    - `verification_date`

`sections.pending_cohost_invites`

- pending only
- newest first by `created_at desc`
- item fields:
    - `id`
    - `event_id`
    - `inviter_id`
    - `invitee_id`
    - `invitee_email`
    - `message`
    - `status`
    - `created_at`
    - `updated_at`
    - `responded_at`
- nested `inviter`:
    - `id`
    - `username`
    - `name`
    - `image`
    - `verification_status`
- nested `events`:
    - `id`
    - `title`
    - `cover`
    - `location`
    - `timezone`
    - `computed_start_date`
    - `computed_end_date`
    - `start_date_day`
    - `start_date_month`
    - `start_date_year`
    - `start_date_hours`
    - `start_date_minutes`
    - `creator_user_id`
    - `user_details`

`sections.my_upcoming_events`

- published only
- includes events where the viewer is creator, cohost, or RSVP yes
- includes future events and ongoing events only
- sorted by `computed_start_date asc`
- limit applied after DB-side filtering and sorting
- duplicate membership paths are deduped
- exact `total_count`
- correct `has_more`
- event shape preserved from `userEventsSelect`:
    - `id`
    - `title`
    - `cost`
    - `cover`
    - `date`
    - `end_date`
    - `created_at`
    - `is_time_set`
    - `location`
    - `location_id`
    - `visibility`
    - `description`
    - `status`
    - `timezone`
    - `start_date_day`
    - `start_date_month`
    - `start_date_year`
    - `start_date_hours`
    - `start_date_minutes`
    - `end_date_day`
    - `end_date_month`
    - `end_date_year`
    - `end_date_hours`
    - `end_date_minutes`
    - `computed_start_date`
    - `computed_end_date`
    - `creator_user_id`
    - `user_details`
    - `event_tags`
    - `event_locations`

`sections.discover_events`

- equivalent to current `/v1/events/for-you`
- published and public only
- backend ordering preserved
- includes `featured_id`
- includes `featured_position`
- item shape is otherwise the current discover event shape

`sections.pending_event_invites`

- pending only
- newest first by `created_at desc`
- same invite payload style as the current invite flow
- includes nested `events` object with nested `user_details`

### Final Example Response Shape

```json
{
    "success": true,
    "message": "Hub loaded",
    "data": {
        "viewer": {
            "id": "usr_123",
            "username": "alice",
            "name": "Alice",
            "email": "alice@example.com",
            "bio": null,
            "image": "https://...",
            "bio_link": null,
            "x_handle": null,
            "instagram_handle": null,
            "ln_address": null,
            "nip05": null,
            "telegram_id": null,
            "verification_status": "verified",
            "verification_date": "2026-02-01T00:00:00.000Z"
        },
        "generated_at": "2026-03-24T20:15:00.000Z",
        "sections": {
            "pending_cohost_invites": {
                "status": "ok",
                "items": [],
                "total_count": 0,
                "has_more": false
            },
            "my_upcoming_events": {
                "status": "ok",
                "items": [
                    {
                        "id": "evt_1",
                        "title": "Upcoming Event",
                        "computed_start_date": "2026-03-25T18:00:00.000Z",
                        "computed_end_date": "2026-03-25T21:00:00.000Z"
                    }
                ],
                "total_count": 4,
                "has_more": true
            },
            "discover_events": {
                "status": "ok",
                "items": [
                    {
                        "id": "evt_2",
                        "featured_id": "fye_1",
                        "featured_position": 1
                    }
                ],
                "total_count": 12,
                "has_more": false
            },
            "pending_event_invites": {
                "status": "error",
                "items": [],
                "total_count": null,
                "has_more": false,
                "error": {
                    "code": "section_load_failed",
                    "message": "Failed to load section"
                }
            }
        }
    }
}
```

### Frontend Integration Guidance

- Replace the current multi-request `/e/hub` load with a single authenticated call to `/api/v1/hub`.
- Treat each section independently using `status`.
- Do not fail the whole hub UI if one section errors.
- Use `viewer` for top-level current-user data.
- Use `sections.my_upcoming_events.items` as the source of truth for the hub upcoming rail.
- Use `has_more` and `total_count` directly from the API.
- Do not recompute `has_more` or counts client-side.
- Preserve current UI components where possible because payload shapes were intentionally kept close to existing endpoints.

### Operational Caveat

- The API repo still has local changes in `lib/services/hub.ts` and `supabase/sql/hub.sql`.
- Make sure those backend code changes are committed and deployed.
- Make sure the SQL function and supporting indexes exist in the target environment database.

### Ready-To-Send Frontend Prompt

```text
Integrate the new authenticated hub aggregator endpoint into `/e/hub`.

Backend contract:
- Endpoint: `GET /api/v1/hub`
- Auth: same browser-authenticated cookie flow as existing protected web API calls
- Query params:
  - `my_upcoming_limit=6`
  - `discover_limit=12`
  - `pending_invites_limit=10`
  - `pending_cohost_limit=10`
- Response envelope:
  - `{ success: true, message: "Hub loaded", data: HubPayload }`

Hub payload:
- `viewer: UserDetails | null`
- `generated_at: string`
- `sections.pending_cohost_invites: HubListSection<CohostInvite>`
- `sections.my_upcoming_events: HubListSection<EventWithUser>`
- `sections.discover_events: HubListSection<ForYouEvent>`
- `sections.pending_event_invites: HubListSection<EventInvite>`

Section contract:
- `status: "ok" | "error"`
- `items: T[]`
- `total_count: number | null`
- `has_more: boolean`
- optional `error: { code, message }`

Important behavior:
- overall request can succeed with `200` even if one section fails
- frontend must render per-section loading/error/empty states
- `my_upcoming_events` is already correctly filtered and sorted server-side:
  - creator OR cohost OR RSVP yes
  - published only
  - future or ongoing only
  - sorted by `computed_start_date asc`
  - deduped
  - limited server-side
- `discover_events` preserves current `/v1/events/for-you` ordering and includes `featured_id` / `featured_position`
- pending invite sections are server-filtered to pending only

Please:
1. Replace the current multi-request hub data loading with a single `/api/v1/hub` request.
2. Keep adapters minimal and reuse existing hub UI components where possible.
3. Handle section-level `status="error"` without failing the full hub page.
4. Use `has_more` / `total_count` directly from the response.
5. Preserve current UX for empty states and cards.
6. Report any payload mismatches that still require backend adjustment.
```
