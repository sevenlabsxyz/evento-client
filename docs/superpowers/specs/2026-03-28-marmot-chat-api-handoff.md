# Evento API Handoff: Marmot Chat Support

Date: 2026-03-28
Audience: `evento-api` owner / implementing agent
Status: Ready for handoff
Depends on:

- [`docs/superpowers/specs/2026-03-26-marmot-chat-design.md`](/Users/andreneves/.codex/worktrees/fb12/evento-client/docs/superpowers/specs/2026-03-26-marmot-chat-design.md)
- [`docs/superpowers/specs/2026-03-26-marmot-chat-implementation-plan.md`](/Users/andreneves/.codex/worktrees/fb12/evento-client/docs/superpowers/specs/2026-03-26-marmot-chat-implementation-plan.md)
- [`API-NEEDS.md`](/Users/andreneves/.codex/worktrees/fb12/evento-client/API-NEEDS.md)

## Purpose

This document is the implementation handoff for `evento-api` to support the new Marmot-based
client chat flow.

The client work is already underway in `evento-client`. This backend handoff is meant to be
specific enough that an API agent can execute without guessing:

- what schema must change
- which routes must change
- which response shapes the client expects
- what can wait until later
- what old Stream backend surfaces can be deleted
- what acceptance criteria prove the client is unblocked

This is not a product brainstorm. Product decisions are already settled.

## Mission

Make `evento-api` support discoverable Marmot/Nostr identity for Evento users so the new client can:

- generate a local messaging identity
- persist the public key against the authenticated Evento user
- resolve another Evento user's `nostr_pubkey` from their Evento `userId`
- resolve an incoming `nostr_pubkey` back to an Evento user profile

At the same time, prepare the API repo for Stream removal by deleting Stream-specific endpoints once
the client no longer calls them.

## Important Boundaries

Do:

- store public identity metadata
- expose it through existing user/profile surfaces
- remove Stream-specific backend endpoints when safe

Do not do:

- do not build a new chat/message database
- do not store Marmot local state
- do not store private keys
- do not build multi-device lease support in this pass
- do not build backup/export/import support in this pass
- do not build event-group Marmot support in this pass
- do not reintroduce server-side chat orchestration as a Stream replacement

## Current Client Reality

The current `evento-client` implementation already assumes these API capabilities:

1. `PATCH /v1/user` accepts `nostr_pubkey`
2. `GET /v1/user` can expose `nostr_pubkey`
3. `GET /v1/user/details?id=<userId>` resolves a recipient into a user record with `nostr_pubkey`
4. `GET /v1/user/details?nostr_pubkey=<hexPubkey>` resolves an incoming pubkey back to an Evento user

Relevant client files:

- [`lib/chat/api.ts`](/Users/andreneves/.codex/worktrees/fb12/evento-client/lib/chat/api.ts)
- [`lib/chat/runtime.ts`](/Users/andreneves/.codex/worktrees/fb12/evento-client/lib/chat/runtime.ts)
- [`lib/chat/provider.tsx`](/Users/andreneves/.codex/worktrees/fb12/evento-client/lib/chat/provider.tsx)
- [`components/messages/new-chat-sheet.tsx`](/Users/andreneves/.codex/worktrees/fb12/evento-client/components/messages/new-chat-sheet.tsx)
- [`components/event-detail/event-host.tsx`](/Users/andreneves/.codex/worktrees/fb12/evento-client/components/event-detail/event-host.tsx)
- [`components/followers-sheet/followers-sheet.tsx`](/Users/andreneves/.codex/worktrees/fb12/evento-client/components/followers-sheet/followers-sheet.tsx)

## Current API Gaps Observed

Based on the current `evento-api` codebase:

- [`app/api/v1/user/route.ts`](/Users/andreneves/Code/evento/evento-api/app/api/v1/user/route.ts)
  - `PATCH` validates `username`, `ln_address`, and `nip05`, but does not admit `nostr_pubkey`
  - `GET` selects `nip05` but not `nostr_pubkey`
- [`app/api/v1/user/details/route.ts`](/Users/andreneves/Code/evento/evento-api/app/api/v1/user/details/route.ts)
  - currently supports lookup by `username` only
  - does not support lookup by `id`
  - does not support lookup by `nostr_pubkey`
  - does not select `nostr_pubkey`
- [`app/api/v1/user/search/route.ts`](/Users/andreneves/Code/evento/evento-api/app/api/v1/user/search/route.ts)
  - does not expose `nostr_pubkey` or `nip05`
- [`app/api/v1/user/followers/list/route.ts`](/Users/andreneves/Code/evento/evento-api/app/api/v1/user/followers/list/route.ts)
  - does not expose `nostr_pubkey` or `nip05`
- [`app/api/v1/user/follows/list/route.ts`](/Users/andreneves/Code/evento/evento-api/app/api/v1/user/follows/list/route.ts)
  - does not expose `nostr_pubkey` or `nip05`

The client can tolerate the last three gaps for now, because it re-fetches `user/details?id=...`
before opening a DM. The first two gaps are hard blockers.

## Required Deliverables

### P0: Add `nostr_pubkey` To User Storage

Add a nullable `nostr_pubkey` column to `user_details`.

Recommended shape:

- column type: `text`
- nullable: yes
- uniqueness: yes, but only for non-null values
- normalized storage: lowercase hex

Recommended DB protections:

- partial unique index on `nostr_pubkey` where not null
- optional check constraint enforcing 64 lowercase hex characters

Recommended validation rule:

- accept only 64-character hex pubkeys
- normalize to lowercase before writing
- empty string should behave like null

Why this matters:

- two Evento users must not be able to claim the same Nostr public key
- client lookup by pubkey must be unambiguous

### P0: Update `PATCH /v1/user`

File:

- [`app/api/v1/user/route.ts`](/Users/andreneves/Code/evento/evento-api/app/api/v1/user/route.ts)

Required change:

- admit `nostr_pubkey` in the request schema and persisted payload

Implementation requirements:

- accept `nostr_pubkey?: string`
- normalize to lowercase and trim
- treat `""` as null
- reject malformed keys with a 4xx validation response
- reject duplicate keys cleanly with a useful message
- repeated writes of the same pubkey should be safe/idempotent

Suggested validation:

```ts
const nostrPubkeySchema = z
  .string()
  .regex(/^[0-9a-fA-F]{64}$/, "Nostr public key must be a 64-character hex string")
  .transform((val) => val.toLowerCase().trim())
  .optional();
```

Add `nostr_pubkey` to:

- request parsing
- zod validation
- `changedPayload`
- selected return payload

Important:

- do not require `nip05` in order to set `nostr_pubkey`
- do not generate keys on the backend
- do not overwrite unrelated user fields

### P0: Update `GET /v1/user`

File:

- [`app/api/v1/user/route.ts`](/Users/andreneves/Code/evento/evento-api/app/api/v1/user/route.ts)

Required change:

- include `nostr_pubkey` in the select list

Recommended select:

- existing fields
- `nostr_pubkey`

This is not the critical lookup for DM creation, but it keeps the authenticated user model aligned
between client and API.

### P0: Expand `GET /v1/user/details`

File:

- [`app/api/v1/user/details/route.ts`](/Users/andreneves/Code/evento/evento-api/app/api/v1/user/details/route.ts)

This route must support three lookup modes:

1. existing username lookup
2. Evento user id lookup
3. Nostr public key lookup

Supported query params:

- `username`
- `id`
- `nostr_pubkey`

Required behavior:

- exactly one lookup param should be used per request
- if multiple lookup params are present, return a validation error
- preserve existing `username` lookup behavior for the rest of the app

Required selected fields:

- `id`
- `username`
- `bio`
- `image`
- `verification_status`
- `verification_date`
- `name`
- `bio_link`
- `x_handle`
- `instagram_handle`
- `ln_address`
- `nip05`
- `nostr_pubkey`
- `pinned_event`

Behavior by lookup type:

- `username`:
  - keep current semantics if you want
  - `200` with object when found
  - `200` with `[]` or `null` when not found is acceptable
- `id`:
  - return a non-error response when not found
  - preferred: `200` with `[]` or `null`
  - avoid `404` here because the current client does not suppress it for the id lookup path
- `nostr_pubkey`:
  - `200` with object when found
  - `404` is acceptable when not found
  - `200` with `[]` or `null` is also acceptable

Why `id` lookup matters:

- every DM entry point in the new client starts from an Evento `userId`

Why `nostr_pubkey` lookup matters:

- Marmot invites and incoming message senders arrive as pubkeys, not Evento user ids

### P1: Expose `nostr_pubkey` On Search And Follow Surfaces

Files:

- [`app/api/v1/user/search/route.ts`](/Users/andreneves/Code/evento/evento-api/app/api/v1/user/search/route.ts)
- [`app/api/v1/user/followers/list/route.ts`](/Users/andreneves/Code/evento/evento-api/app/api/v1/user/followers/list/route.ts)
- [`app/api/v1/user/follows/list/route.ts`](/Users/andreneves/Code/evento/evento-api/app/api/v1/user/follows/list/route.ts)

This is recommended, not required to unblock the current client.

If added, expose:

- `nostr_pubkey`
- `nip05`

Why it still matters:

- fewer follow-up lookups
- future-proofing for richer chat entry points
- better consistency across user payloads

### P2: Expose `nostr_pubkey` On Event/Host-Adjacent User Payloads

Examples:

- event host payload joins
- quick profile payloads
- any event detail user joins that are likely to become chat entry points

This is optional for the first pass.

## Recommended Exact Work Plan

### Phase 1: Schema

1. Add `nostr_pubkey` to `user_details`
2. Backfill nothing
3. Create a unique partial index for non-null values
4. Add a check constraint if it matches repo conventions

### Phase 2: Authenticated User Route

Update [`app/api/v1/user/route.ts`](/Users/andreneves/Code/evento/evento-api/app/api/v1/user/route.ts):

1. add zod validation for `nostr_pubkey`
2. add `nostr_pubkey` to the `PATCH` payload
3. add `nostr_pubkey` to the `GET` select list
4. handle duplicate-key failures cleanly

### Phase 3: User Details Route

Update [`app/api/v1/user/details/route.ts`](/Users/andreneves/Code/evento/evento-api/app/api/v1/user/details/route.ts):

1. parse `username`, `id`, and `nostr_pubkey`
2. enforce exactly one lookup param
3. branch query logic by param
4. select `nostr_pubkey`
5. return a client-safe not-found shape for `id`

### Phase 4: Secondary User Surfaces

Update:

- [`app/api/v1/user/search/route.ts`](/Users/andreneves/Code/evento/evento-api/app/api/v1/user/search/route.ts)
- [`app/api/v1/user/followers/list/route.ts`](/Users/andreneves/Code/evento/evento-api/app/api/v1/user/followers/list/route.ts)
- [`app/api/v1/user/follows/list/route.ts`](/Users/andreneves/Code/evento/evento-api/app/api/v1/user/follows/list/route.ts)

This phase can be deferred if needed, but it should be simple once the column exists.

### Phase 5: Stream Deletion

Only after the new client is deployed and confirmed not to call Stream endpoints anymore:

Delete or retire these Stream surfaces:

- [`app/api/v1/stream-chat/token/route.ts`](/Users/andreneves/Code/evento/evento-api/app/api/v1/stream-chat/token/route.ts)
- [`app/api/v1/stream-chat/users/sync/route.ts`](/Users/andreneves/Code/evento/evento-api/app/api/v1/stream-chat/users/sync/route.ts)
- [`app/api/v1/stream-chat/channels/route.ts`](/Users/andreneves/Code/evento/evento-api/app/api/v1/stream-chat/channels/route.ts)
- [`app/api/v1/stream-chat/channels/direct-message/route.ts`](/Users/andreneves/Code/evento/evento-api/app/api/v1/stream-chat/channels/direct-message/route.ts)
- [`app/api/v1/stream-chat/webhooks/route.ts`](/Users/andreneves/Code/evento/evento-api/app/api/v1/stream-chat/webhooks/route.ts)
- [`app/api/v1/dm/channel/route.ts`](/Users/andreneves/Code/evento/evento-api/app/api/v1/dm/channel/route.ts)
- [`app/api/v1/dm/refresh/route.ts`](/Users/andreneves/Code/evento/evento-api/app/api/v1/dm/refresh/route.ts)
- [`app/api/v1/events/[eventId]/chat/route.ts`](/Users/andreneves/Code/evento/evento-api/app/api/v1/events/[eventId]/chat/route.ts)
- [`app/api/v1/events/[eventId]/chat/members/route.ts`](/Users/andreneves/Code/evento/evento-api/app/api/v1/events/[eventId]/chat/members/route.ts)
- [`app/api/v1/events/[eventId]/chat/auto-add/route.ts`](/Users/andreneves/Code/evento/evento-api/app/api/v1/events/[eventId]/chat/auto-add/route.ts)
- [`app/api/v1/events/[eventId]/chat/route/route.ts`](/Users/andreneves/Code/evento/evento-api/app/api/v1/events/[eventId]/chat/route/route.ts)
- [`app/api/v1/chat/[channelId]/event/route.ts`](/Users/andreneves/Code/evento/evento-api/app/api/v1/chat/[channelId]/event/route.ts)
- [`app/api/v1/events/[eventId]/quick-actions/route.ts`](/Users/andreneves/Code/evento/evento-api/app/api/v1/events/[eventId]/quick-actions/route.ts) if chat-related Stream assumptions remain there
- [`app/api/v1/webhooks/chat/route.ts`](/Users/andreneves/Code/evento/evento-api/app/api/v1/webhooks/chat/route.ts)
- [`app/api/v1/webhooks/users/upsert/route.tsx`](/Users/andreneves/Code/evento/evento-api/app/api/v1/webhooks/users/upsert/route.tsx) if it only exists for Stream sync
- [`lib/stream-chat/server.ts`](/Users/andreneves/Code/evento/evento-api/lib/stream-chat/server.ts)
- [`lib/stream-chat/index.ts`](/Users/andreneves/Code/evento/evento-api/lib/stream-chat/index.ts)

Also remove:

- Stream env vars
- Stream package dependency
- Stream-only tests
- Stream-only webhook tables such as `stream_chat_events` if no longer used anywhere

Do not delete those routes until production traffic has moved off them.

## Validation And Error Handling

### `nostr_pubkey` Format

Recommended accepted format:

- exactly 64 hex characters
- case-insensitive input
- store normalized lowercase

Recommended invalid-input behavior:

- return `400` or `422`
- include a specific validation message

### Duplicates

If another user already owns the same pubkey:

- reject the write
- return a human-readable message like `Nostr public key is already in use.`

### Not Found Behavior

For the new client:

- `GET /v1/user/details?id=...`
  - prefer `200` with no record rather than `404`
- `GET /v1/user/details?nostr_pubkey=...`
  - `404` is acceptable

### Backward Compatibility

Do not break existing username-based consumers of `GET /v1/user/details`.

## Recommended Testing

Add route-level tests for:

1. `PATCH /v1/user` accepts a valid `nostr_pubkey`
2. `PATCH /v1/user` normalizes uppercase pubkeys to lowercase
3. `PATCH /v1/user` rejects malformed pubkeys
4. `PATCH /v1/user` rejects duplicate pubkeys
5. `GET /v1/user` returns `nostr_pubkey`
6. `GET /v1/user/details?username=...` still works
7. `GET /v1/user/details?id=...` returns the user with `nostr_pubkey`
8. `GET /v1/user/details?nostr_pubkey=...` returns the user
9. `GET /v1/user/details?id=...` handles not-found without a hard error
10. `GET /v1/user/details` rejects requests with multiple lookup params

If search/follow payloads are updated, add tests for those fields too.

## Acceptance Criteria

The API work is complete for the current client pass when all of the following are true:

1. A logged-in user can complete chat onboarding and `PATCH /v1/user` successfully stores their
   generated `nostr_pubkey`.
2. `GET /v1/user` returns that `nostr_pubkey`.
3. A second user can be resolved through `GET /v1/user/details?id=<userId>` and the response
   contains `nostr_pubkey`.
4. An incoming sender/invite pubkey can be resolved through
   `GET /v1/user/details?nostr_pubkey=<hexPubkey>`.
5. Existing username lookups via `GET /v1/user/details?username=...` still work.
6. No new server-side chat/message persistence has been introduced.
7. The API repo is ready for Stream route deletion once the client rollout is confirmed.

## Nice-To-Haves But Not Required For This Handoff

- expose `nostr_pubkey` and `nip05` on search/follow/event-host surfaces
- set or normalize `nip05` to `username@evento.cash` as a product convention
- future event-chat exclusion signals by `event_id`
- multi-device lease support
- encrypted chat backup support

## Recommended Handoff Summary For The API Agent

If you want to brief another agent in one paragraph, use this:

Implement Marmot identity support for Evento users by adding `nostr_pubkey` to `user_details`,
teaching `PATCH /v1/user` to validate and persist it, teaching `GET /v1/user` to return it, and
expanding `GET /v1/user/details` so it can look up users by `username`, `id`, or `nostr_pubkey`
while preserving existing username behavior. Prefer a unique nullable public-key column with
lowercase normalization and client-safe not-found behavior for the `id` lookup path. After the
client rollout is confirmed, remove the old Stream chat routes, helpers, webhooks, and
dependencies from `evento-api`.
