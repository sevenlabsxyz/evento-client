# Event Type + Draft + Publish Handoff (Backend + Frontend)

This document is the implementation contract for moving to a 3-type event model while keeping lifecycle state separate and explicit.

Note on paths: this client currently calls proxied API routes as `/v1/...` via `app/api/[...path]/route.ts`. Backend-facing equivalents are `/api/v1/...` externally.

## Product Model (Final)

- `visibility`: `public | private` (unchanged)
- `status` (lifecycle): `draft | published | archived` (unchanged)
- `event_type` (behavior):
    - `rsvp`
    - `registration`
    - `ticketed`

### Semantics

- `rsvp`: RSVP flow only (no registration form, no paid checkout)
- `registration`: registration form/approval flow (no paid checkout)
- `ticketed`: registration + ticket purchase flow

### Creation Rules

- `event_type = rsvp` => create as `status = published`
- `event_type = registration` => create as `status = draft`
- `event_type = ticketed` => create as `status = draft`

## Why This Model

- Matches current backend realities (checkout already gates on ticketed behavior)
- Avoids overloading `status` with behavior concerns
- Lets frontend keep a simpler create UX now (RSVP + Registration), and move to ticketed later from manage/tickets

---

## Backend Changes

## 1) Data Contract

Use `event_type` in API payload/response contracts.

### Backward compatibility

During transition, backend may accept legacy `type` and map it:

- `type = rsvp` -> `event_type = rsvp`
- `type = ticketed` -> `event_type = ticketed`

Return `event_type` in all event payloads. Keep `type` only if needed for temporary compatibility.

## 2) Create Event

### Endpoint

- `POST /api/v1/events` (client proxy path: `POST /v1/events`)

### Request (new canonical shape)

```json
{
    "title": "My Event",
    "visibility": "private",
    "event_type": "registration"
}
```

### Server behavior

- If `event_type` missing: default to `rsvp`
- Force status from creation rules above (ignore inbound `status` for create)
- Return both `event_type` and `status`

### Response minimum

```json
{
    "success": true,
    "data": [
        {
            "id": "evt_123",
            "title": "My Event",
            "event_type": "registration",
            "status": "draft"
        }
    ]
}
```

## 3) Draft Events Endpoint

Add explicit self-scope endpoint:

- `GET /api/v1/events/me/drafts` (client proxy path: `GET /v1/events/me/drafts`)
- Auth required
- Returns only events where `creator_user_id = current_user` and `status = draft`

Note: if backend already has `GET /api/v1/events/profile?status=draft` as self-only, keep it for compatibility during migration.

### Optional query params

- `page`, `limit`
- `search`
- `event_type` (`rsvp | registration | ticketed`)

## 4) Publish Endpoint

Add explicit action endpoint:

- `POST /api/v1/events/:id/publish` (client proxy path: `POST /v1/events/:id/publish`)
- Auth required (host/cohost rules follow existing permissions)

### Behavior

- Allowed transition: `draft -> published`
- Idempotent-safe responses for already `published`
- Validation-safe handling for `archived`
- Returns updated event with `status = published`

### Recommended pre-publish validation

- `event_type = registration`:
    - registration settings exist (`registration_required`, `approval_mode`)
    - if product requires, enforce at least one active registration question
- `event_type = ticketed`:
    - registration settings valid
    - at least one active ticket type exists

## 5) Read/Visibility Rules

- Feed/discovery/public APIs: include only `status = published`
- Event detail:
    - host/cohost can view own draft
    - non-host access to draft should return `404`

---

## Frontend Changes

## 1) Types and schema

- Add `event_type` to all event API types used by create/list/detail
- Enum values: `rsvp | registration | ticketed`
- Existing observed touchpoints:
    - `lib/schemas/event.ts`
    - `lib/types/api.ts`
    - `lib/stores/event-form-store.ts` (currently hardcodes `status: 'published'`)

## 2) Create Event UX (Phase 1)

- Keep create selector with:
    - `RSVP`
    - `Registration`
- Do not force `Ticketed` at create time yet
- Send `event_type` in payload
- Do not send hardcoded `status`; backend decides
- Existing touchpoints:
    - `app/e/create/page.tsx`
    - `components/create-event/event-visibility-sheet.tsx` (pattern to mirror for event type sheet)

## 3) Post-create routing

Use response values:

- If `event_type = rsvp` and `status = published` -> existing success modal/event page flow
- If `event_type = registration` and `status = draft` -> route to registration setup (`/e/:id/manage/registration`)
- If `event_type = ticketed` and `status = draft` -> route to ticket setup (`/e/:id/manage/tickets` or setup hub)

Existing current behavior to update:

- `components/create-event/event-created-modal.tsx` always routes to `/e/:id`

## 4) Drafts hook

- Add `useMyDraftEvents` backed by `GET /api/v1/events/me/drafts` (client proxy `/v1/events/me/drafts`)
- Support paging/filter params matching backend
- Add query key to `lib/query-client.ts` (for example: `eventsUserMeDrafts`)

## 5) Publish UX

- Call `POST /api/v1/events/:id/publish` (client proxy `/v1/events/:id/publish`)
- Handle idempotent safe state (`already published`)
- Keep copy variant for draft vs published success messaging
- Natural integration points:
    - manage surfaces under `app/e/[id]/manage/**`
    - update/create hooks under `lib/hooks`

---

## Capability Rules (Must Enforce)

- Checkout allowed only for `event_type = ticketed`
- Registration submit flow only when event registration is configured and required
- RSVP flow remains valid for all published events unless business rules explicitly restrict

---

## API Summary (Target)

### Create

- `POST /api/v1/events`

### Drafts (self)

- `GET /api/v1/events/me/drafts`

### Publish

- `POST /api/v1/events/:id/publish`

### Existing compatibility routes (keep temporarily)

- `GET /api/v1/events/profile?status=draft`
- `PATCH /api/v1/events/:id` with `status=published` (legacy publish path)

---

## Suggested rollout plan

1. Backend supports `event_type` contract + create mapping
2. Add `/me/drafts` and `/publish` endpoints
3. Frontend switches reads/writes to new contract
4. Keep legacy compatibility paths for at least one release window
5. Remove legacy `type` references after clients migrate

---

## Acceptance criteria

- Creating `rsvp` event returns `published`
- Creating `registration` event returns `draft`
- Creating `ticketed` event returns `draft`
- `/me/drafts` only returns current user drafts
- Publishing only allows `draft -> published`
- Non-host cannot view draft details (`404`)
- Checkout rejected for non-`ticketed` event types

---

## Notes for frontend agent

- Treat backend `status` as source of truth for lifecycle
- Treat `event_type` as source of truth for flow/routing decisions
- Do not infer draft/published from local form assumptions
- Keep create page simple (RSVP/Registration) unless product explicitly adds ticketed at creation time
