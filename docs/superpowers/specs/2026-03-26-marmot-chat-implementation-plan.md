# Evento Marmot Chat Implementation Plan

Date: 2026-03-26
Status: Drafted from approved design
Depends on: `docs/superpowers/specs/2026-03-26-marmot-chat-design.md`
Repos covered:

- `evento-client`: `/Users/andreneves/.codex/worktrees/fb12/evento-client`
- `evento-api`: `/Users/andreneves/Code/evento/evento-api`

## Purpose

This document turns the approved Marmot chat design into an implementation sequence for both the client and the API. It defines:

- the exact backend changes needed to support Marmot without reintroducing a chat backend
- the exact client architecture migration path
- the deletion scope for Stream
- the order of work to avoid breaking `/e/messages` during the rewrite
- phase exit criteria
- testing and QA expectations

This is an implementation plan, not the design rationale. Product decisions are already captured in the design document.

## High-Level Strategy

The migration should be executed as a controlled replacement of the chat stack in seven tracks:

1. Backend metadata and policy support
2. Client chat-domain scaffolding
3. Client Marmot runtime integration
4. First-run onboarding, device lease, and backup flows
5. `/e/messages` UI replacement
6. CTA rewiring from the rest of Evento
7. Stream removal, testing, and hardening

The most important delivery rule is:

- never couple the new route layer directly to raw Marmot runtime objects
- never keep Stream as a transitional dependency inside the final route/page components

## Relevant Existing Surfaces

### Client: Current Stream Coupling

These files are current blockers and must be replaced or removed:

- [`app/e/layout.tsx`](/Users/andreneves/.codex/worktrees/fb12/evento-client/app/e/layout.tsx)
- [`app/e/messages/layout.tsx`](/Users/andreneves/.codex/worktrees/fb12/evento-client/app/e/messages/layout.tsx)
- [`app/e/messages/[id]/page.tsx`](/Users/andreneves/.codex/worktrees/fb12/evento-client/app/e/messages/[id]/page.tsx)
- [`components/messages/new-chat-sheet.tsx`](/Users/andreneves/.codex/worktrees/fb12/evento-client/components/messages/new-chat-sheet.tsx)
- [`components/event-detail/event-host.tsx`](/Users/andreneves/.codex/worktrees/fb12/evento-client/components/event-detail/event-host.tsx)
- follower/following sheets that deep-link to `/e/messages?user=<id>`
- [`lib/providers/stream-chat-provider.tsx`](/Users/andreneves/.codex/worktrees/fb12/evento-client/lib/providers/stream-chat-provider.tsx)
- [`lib/services/stream-chat.ts`](/Users/andreneves/.codex/worktrees/fb12/evento-client/lib/services/stream-chat.ts)
- [`lib/hooks/use-stream-chat.ts`](/Users/andreneves/.codex/worktrees/fb12/evento-client/lib/hooks/use-stream-chat.ts)
- [`lib/hooks/use-message-actions.ts`](/Users/andreneves/.codex/worktrees/fb12/evento-client/lib/hooks/use-message-actions.ts)
- [`app/e/messages/custom-channel-preview.tsx`](/Users/andreneves/.codex/worktrees/fb12/evento-client/app/e/messages/custom-channel-preview.tsx)
- [`components/chat/resolved-stream-avatar.tsx`](/Users/andreneves/.codex/worktrees/fb12/evento-client/components/chat/resolved-stream-avatar.tsx)
- [`lib/utils/stream-chat-display.ts`](/Users/andreneves/.codex/worktrees/fb12/evento-client/lib/utils/stream-chat-display.ts)
- Stream-focused tests under `__tests__/hooks` and `__tests__/integration`

### API: Current Stream Coupling

These backend surfaces are relevant and must be replaced, deleted, or repurposed:

- [`app/api/v1/user/route.ts`](/Users/andreneves/Code/evento/evento-api/app/api/v1/user/route.ts)
- [`app/api/v1/stream-chat/token/route.ts`](/Users/andreneves/Code/evento/evento-api/app/api/v1/stream-chat/token/route.ts)
- [`app/api/v1/stream-chat/users/sync/route.ts`](/Users/andreneves/Code/evento/evento-api/app/api/v1/stream-chat/users/sync/route.ts)
- [`app/api/v1/stream-chat/channels/route.ts`](/Users/andreneves/Code/evento/evento-api/app/api/v1/stream-chat/channels/route.ts)
- [`app/api/v1/stream-chat/channels/direct-message/route.ts`](/Users/andreneves/Code/evento/evento-api/app/api/v1/stream-chat/channels/direct-message/route.ts)
- [`app/api/v1/dm/channel/route.ts`](/Users/andreneves/Code/evento/evento-api/app/api/v1/dm/channel/route.ts)
- [`app/api/v1/dm/refresh/route.ts`](/Users/andreneves/Code/evento/evento-api/app/api/v1/dm/refresh/route.ts)
- [`app/api/v1/events/[eventId]/chat/route.ts`](/Users/andreneves/Code/evento/evento-api/app/api/v1/events/[eventId]/chat/route.ts)
- [`app/api/v1/events/[eventId]/chat/members/route.ts`](/Users/andreneves/Code/evento/evento-api/app/api/v1/events/[eventId]/chat/members/route.ts)
- [`app/api/v1/events/[eventId]/chat/auto-add/route.ts`](/Users/andreneves/Code/evento/evento-api/app/api/v1/events/[eventId]/chat/auto-add/route.ts)
- [`app/api/v1/events/[eventId]/chat/route/route.ts`](/Users/andreneves/Code/evento/evento-api/app/api/v1/events/[eventId]/chat/route/route.ts)
- [`app/api/v1/chat/[channelId]/event/route.ts`](/Users/andreneves/Code/evento/evento-api/app/api/v1/chat/[channelId]/event/route.ts)
- [`lib/stream-chat/server.ts`](/Users/andreneves/Code/evento/evento-api/lib/stream-chat/server.ts)
- [`lib/stream-chat/index.ts`](/Users/andreneves/Code/evento/evento-api/lib/stream-chat/index.ts)
- Stream-related webhook routes and user upsert hooks

These existing backend routes are also relevant because event-group policy later depends on them:

- [`app/api/v1/events/[eventId]/rsvps/route.ts`](/Users/andreneves/Code/evento/evento-api/app/api/v1/events/[eventId]/rsvps/route.ts)
- [`app/api/v1/events/[eventId]/rsvps/[userId]/route.ts`](/Users/andreneves/Code/evento/evento-api/app/api/v1/events/[eventId]/rsvps/[userId]/route.ts)

## Backend Work Plan

### Phase B1: Add Required User Messaging Metadata

#### Goal

Extend Evento user profile data so the client can discover a recipient’s Marmot/Nostr identity without using Stream.

#### Changes

1. Add `nostr_pubkey` to the `user_details` table.
2. Ensure all authenticated current-user payloads expose `nostr_pubkey`.
3. Ensure relevant viewer/profile payloads used by the client expose `nostr_pubkey` where needed.
4. Keep `nip05` as an existing field and align the product convention to `username@evento.cash`.

#### Likely files

- [`app/api/v1/user/route.ts`](/Users/andreneves/Code/evento/evento-api/app/api/v1/user/route.ts)
- [`lib/services/hub.ts`](/Users/andreneves/Code/evento/evento-api/lib/services/hub.ts)
- Supabase SQL migration under [`supabase/sql`](/Users/andreneves/Code/evento/evento-api/supabase/sql)
- backend type definitions that mirror `user_details`

#### Output

- client can fetch `nostr_pubkey` for self and recipients
- profile update endpoint can store it

### Phase B2: Add Single-Device Chat Lease Support

#### Goal

Support one active chat device per user without turning the backend into a chat message store.

#### Minimal data needed

Store lightweight per-user chat activation metadata:

- `user_id`
- `active_chat_device_id`
- `lease_updated_at`
- optional `lease_version`

#### Endpoint responsibilities

Create a small API surface for:

- reading current lease state
- acquiring lease if unclaimed
- moving lease to current device
- clearing lease on explicit logout if desired

#### Suggested shape

Prefer a small dedicated route family, for example:

- `GET /api/v1/chat/device`
- `POST /api/v1/chat/device/claim`
- `POST /api/v1/chat/device/move`

#### Output

- client can block second-device activation
- move-here flow has backend support

### Phase B3: Add Minimal Marmot Identity Persistence Endpoint

#### Goal

Let the client publish discoverable messaging identity without exposing private state.

#### Backend responsibilities

- accept and persist `nostr_pubkey`
- optionally normalize or validate `nip05`
- return current identity metadata for the authenticated user

#### Important boundary

Do not store private keys, local Marmot state, or message history.

### Phase B4: Prepare Event-Chat Policy Hooks For v2

#### Goal

Keep backend involvement minimal while making future event-group enforcement straightforward.

#### Changes

Do not build event groups now, but leave a clean path for:

- event-to-group metadata later
- exclusion signals by `event_id`

#### Recommendation

Introduce a lightweight future-proof table or route pattern only if it is trivial and clean. Otherwise defer physical schema creation and capture it as v2 work.

For v1, the implementation plan should only require documenting how RSVP removal routes will later emit exclusion signals.

### Phase B5: Delete Stream Backend Surface

#### Goal

Remove all server-side Stream dependency once the Marmot client path is live.

#### Delete or remove usages of

- all `/api/v1/stream-chat/*` routes
- all `/api/v1/dm/*` Stream helper routes
- event chat Stream endpoints
- `lib/stream-chat/*`
- Stream environment variables
- Stream webhook handlers
- any tests that only validate Stream behavior

#### Caution

Do this only after the client is fully switched to Marmot-backed routes and metadata.

## Client Work Plan

### Phase C1: Introduce Evento Chat Domain

#### Goal

Create a repo-local chat abstraction that route components can consume independently of the underlying runtime.

#### New files

- `lib/chat/types.ts`
- `lib/chat/provider.tsx`
- `lib/chat/hooks/use-chat-identity.ts`
- `lib/chat/hooks/use-conversations.ts`
- `lib/chat/hooks/use-conversation.ts`
- `lib/chat/hooks/use-conversation-messages.ts`
- `lib/chat/hooks/use-send-message.ts`
- `lib/chat/hooks/use-open-direct-conversation.ts`
- `lib/chat/hooks/use-chat-device-lease.ts`
- `lib/chat/hooks/use-chat-backup.ts`

#### Required outputs

- typed Evento-native conversation/message models
- typed identity readiness model
- stable context/provider surface for the route layer

#### Do not do yet

- no Stream removal yet
- no full UI rewrite yet
- no raw Marmot runtime leaking into route components

### Phase C2: Build Client-Only Marmot Runtime

#### Goal

Port the runtime patterns from the official `marmots-web-chat` into an Evento-local adapter layer without porting its whole UI shell.

#### New files

- `lib/chat/adapters/marmot/settings.ts`
- `lib/chat/adapters/marmot/nostr.ts`
- `lib/chat/adapters/marmot/account-database.ts`
- `lib/chat/adapters/marmot/client.ts`
- `lib/chat/adapters/marmot/runtime.ts`
- `lib/chat/adapters/marmot/group-subscription-manager.ts`
- `lib/chat/adapters/marmot/discovery.ts`
- `lib/chat/adapters/marmot/mapping.ts`
- `lib/chat/adapters/marmot/backup.ts`
- `lib/chat/adapters/marmot/device-lease.ts`

#### Runtime requirements

- browser-only initialization
- persistent local storage partitioned by authenticated Evento user
- safe rehydration after refresh
- ability to create/load identity
- ability to publish required key packages
- ability to list and subscribe to conversations

#### Exit criteria

- Marmot runtime can start safely in the browser
- no SSR/client-boundary crashes
- conversation data can be mapped into Evento chat domain models

### Phase C3: Replace App-Level Provider Mounting

#### Goal

Swap the global Stream provider out of the authenticated app shell.

#### Edit

- [`app/e/layout.tsx`](/Users/andreneves/.codex/worktrees/fb12/evento-client/app/e/layout.tsx)

#### Changes

- remove `StreamChatProvider`
- mount `ChatProvider`
- keep the rest of the app shell stable

#### Exit criteria

- authenticated app routes load without Stream provider
- chat runtime is client-safe
- navigation does not tear down chat state unnecessarily

### Phase C4: Implement Chat Identity and First-Run Onboarding

#### Goal

Users entering chat for the first time should be taken through the 3-step onboarding and hidden setup flow.

#### New UI files

- `components/chat/chat-onboarding.tsx`
- `components/chat/chat-onboarding-step.tsx`
- `components/chat/chat-setup-loading.tsx`
- `components/chat/chat-error-state.tsx`

#### Behavior

- check readiness via `use-chat-identity`
- if uninitialized, show onboarding
- after `Start`, kick off local setup and backend identity sync
- transition into ready chat UI when complete

#### Exit criteria

- first-run setup works end to end
- retry states are clear
- no private-key exposure in the default flow

### Phase C5: Implement Single-Device Lease UX

#### Goal

Prevent silent multi-device activation and provide the approved move-here flow.

#### New UI files

- `components/chat/chat-device-lease-gate.tsx`
- optional supporting dialog/sheet component

#### Behavior

- if backend lease belongs to another device, block activation
- show `Move chat here`
- after confirmation, call move endpoint and proceed
- retain clear warning about lack of remote state fetch

#### Exit criteria

- second-device activation is blocked
- takeover flow works cleanly

### Phase C6: Implement Backup Export and Import

#### Goal

Support manual continuity flow for v1.

#### New UI files

- `components/chat/chat-backup-sheet.tsx`
- `components/chat/chat-pin-sheet.tsx`

#### Required behavior

- export encrypted chat backup blob
- import encrypted chat backup blob
- restore enough local state to continue chat, not just identity

#### Exit criteria

- imported backup can lead to meaningful continuity on a new device after move-here

### Phase C7: Replace Conversation List

#### Goal

Remove Stream `ChannelList` and replace it with Evento-owned conversation list UI.

#### Edit

- [`app/e/messages/layout.tsx`](/Users/andreneves/.codex/worktrees/fb12/evento-client/app/e/messages/layout.tsx)

#### New files

- `components/chat/conversation-list.tsx`
- `components/chat/conversation-preview.tsx`

#### Behavior

- use generic chat hooks only
- show title, avatar, unread, preview text, time
- preserve current mobile/desktop split behavior
- own the routing behavior internally

#### Exit criteria

- no `stream-chat-react` imports remain in the layout
- route behaves like current Evento chat layout

### Phase C8: Replace Thread Page

#### Goal

Remove Stream `Channel`, `Window`, and `MessageList` from the thread route.

#### Edit

- [`app/e/messages/[id]/page.tsx`](/Users/andreneves/.codex/worktrees/fb12/evento-client/app/e/messages/[id]/page.tsx)

#### New or reused files

- `components/chat/conversation-thread.tsx`
- `components/chat/message-list.tsx`
- reuse `components/ui/chat-input.tsx`
- optionally reuse `components/ui/message.tsx`

#### Behavior

- render mapped messages from generic hooks
- support text send flow
- keep top-bar partner identity behavior
- preserve loading, empty, and error states

#### Explicit v1 scope

- text messages are required
- attachments are optional if stable enough
- Stream pin/reaction/edit/delete behaviors should not block this phase

#### Exit criteria

- no `stream-chat-react` imports remain in the thread page
- a direct conversation can be opened and used end to end

### Phase C9: Replace DM Entry Flows

#### Goal

Preserve the product-level ability to message someone from multiple Evento surfaces.

#### Edit

- [`components/messages/new-chat-sheet.tsx`](/Users/andreneves/.codex/worktrees/fb12/evento-client/components/messages/new-chat-sheet.tsx)
- [`components/event-detail/event-host.tsx`](/Users/andreneves/.codex/worktrees/fb12/evento-client/components/event-detail/event-host.tsx)
- follower/following sheets
- any `?user=` handling in the messages route

#### Behavior

- replace backend Stream DM channel creation with `open direct conversation`
- support recipient-based deep links
- if user taps “message,” client resolves identity and opens or creates the DM

#### Exit criteria

- all current DM CTAs still work
- no Stream DM creation call remains

### Phase C10: Remove Stream From Client

#### Goal

Delete all Stream client code and packages.

#### Remove

- `stream-chat`
- `stream-chat-react`
- Stream env vars
- Stream-specific types/helpers/components/tests

#### Exit criteria

- no client import graph references Stream
- `package.json` no longer depends on Stream
- tests no longer mock Stream for chat flows

## Cross-Repo Phase Order

The safest overall order is:

1. Add backend `nostr_pubkey` support and device-lease endpoints.
2. Add client chat-domain abstractions.
3. Integrate Marmot runtime under the abstractions.
4. Implement onboarding and identity readiness.
5. Implement device lease and backup flows.
6. Replace conversation list and thread UI.
7. Rewire all DM entry points.
8. Remove Stream backend.
9. Remove Stream client.
10. Run hardening and QA.

This avoids a period where the client has no usable chat path.

## Detailed File Plan

### Client: Files To Create

- `lib/chat/types.ts`
- `lib/chat/provider.tsx`
- `lib/chat/hooks/use-chat-identity.ts`
- `lib/chat/hooks/use-conversations.ts`
- `lib/chat/hooks/use-conversation.ts`
- `lib/chat/hooks/use-conversation-messages.ts`
- `lib/chat/hooks/use-send-message.ts`
- `lib/chat/hooks/use-open-direct-conversation.ts`
- `lib/chat/hooks/use-chat-device-lease.ts`
- `lib/chat/hooks/use-chat-backup.ts`
- `lib/chat/adapters/marmot/settings.ts`
- `lib/chat/adapters/marmot/nostr.ts`
- `lib/chat/adapters/marmot/account-database.ts`
- `lib/chat/adapters/marmot/client.ts`
- `lib/chat/adapters/marmot/runtime.ts`
- `lib/chat/adapters/marmot/group-subscription-manager.ts`
- `lib/chat/adapters/marmot/discovery.ts`
- `lib/chat/adapters/marmot/mapping.ts`
- `lib/chat/adapters/marmot/backup.ts`
- `lib/chat/adapters/marmot/device-lease.ts`
- `components/chat/chat-onboarding.tsx`
- `components/chat/chat-setup-loading.tsx`
- `components/chat/chat-device-lease-gate.tsx`
- `components/chat/chat-backup-sheet.tsx`
- `components/chat/conversation-list.tsx`
- `components/chat/conversation-preview.tsx`
- `components/chat/conversation-thread.tsx`

### Client: Files To Edit

- [`app/e/layout.tsx`](/Users/andreneves/.codex/worktrees/fb12/evento-client/app/e/layout.tsx)
- [`app/e/messages/layout.tsx`](/Users/andreneves/.codex/worktrees/fb12/evento-client/app/e/messages/layout.tsx)
- [`app/e/messages/[id]/page.tsx`](/Users/andreneves/.codex/worktrees/fb12/evento-client/app/e/messages/[id]/page.tsx)
- [`components/messages/new-chat-sheet.tsx`](/Users/andreneves/.codex/worktrees/fb12/evento-client/components/messages/new-chat-sheet.tsx)
- [`components/event-detail/event-host.tsx`](/Users/andreneves/.codex/worktrees/fb12/evento-client/components/event-detail/event-host.tsx)
- follower/following sheets
- client-side API types in [`lib/types/api.ts`](/Users/andreneves/.codex/worktrees/fb12/evento-client/lib/types/api.ts)
- user/profile hooks that need `nostr_pubkey`

### Client: Files To Delete

- `lib/providers/stream-chat-provider.tsx`
- `lib/services/stream-chat.ts`
- `lib/hooks/use-stream-chat.ts`
- `lib/hooks/use-message-actions.ts`
- `app/e/messages/custom-channel-preview.tsx`
- `components/chat/resolved-stream-avatar.tsx`
- `lib/utils/stream-chat-display.ts`
- `app/e/messages/stream-chat.d.ts`
- Stream-focused tests

### API: Files To Edit

- [`app/api/v1/user/route.ts`](/Users/andreneves/Code/evento/evento-api/app/api/v1/user/route.ts)
- [`lib/services/hub.ts`](/Users/andreneves/Code/evento/evento-api/lib/services/hub.ts)
- backend user types mirroring `user_details`
- RSVP routes only if future exclusion signals are implemented now

### API: Files To Create

- Supabase SQL migration for `nostr_pubkey`
- Supabase SQL migration for chat-device lease metadata
- device-lease route(s), likely under `app/api/v1/chat/device/...`
- optional identity helper under `lib/services` or `lib/chat`

### API: Files To Delete

- `app/api/v1/stream-chat/*`
- `app/api/v1/dm/*`
- Stream-backed event chat routes
- `lib/stream-chat/*`
- Stream webhooks and user upsert hooks where no longer needed

## Testing Plan

### Client Unit Tests

Add tests for:

- chat identity state machine
- direct conversation resolution/open-or-create logic
- device lease hook behavior
- backup export/import behavior
- mapping functions from Marmot runtime objects to Evento chat models

### Client Integration Tests

Add tests for:

- first-run onboarding flow
- setup loading and retry
- entering `/e/messages` with a ready identity
- opening a DM from search
- opening a DM from host CTA
- opening a DM from follower/following CTA
- `?user=` deep-link flow
- lease conflict and move-here flow

### API Tests

Add or update tests for:

- `nostr_pubkey` persistence on `/api/v1/user`
- device lease routes
- removal of Stream route expectations

### Manual QA Checklist

- login with a fresh user and set up chat
- login with an existing user and open chat
- start DM from new chat sheet
- start DM from event host card
- start DM from follower/following sheet
- refresh and verify continuity
- simulate second-device lease conflict
- move chat here and continue
- export backup
- import backup on another device/profile
- verify no Stream-related UI or API calls remain

## Rollout Guardrails

- do not partially remove Stream and leave `/e/messages` unusable
- do not ship a version where route components still structurally depend on Stream
- do not let private keys or raw protocol jargon leak into the default onboarding flow
- do not overbuild event-group functionality in v1
- do not ship attachment UX in v1 if it is unstable

## Suggested Delivery Chunks

To keep the implementation manageable, the actual work should be delivered in these reviewable chunks:

1. Backend metadata and lease support
2. Chat-domain scaffolding and provider swap
3. Marmot runtime bootstrap
4. Onboarding and identity readiness
5. Conversation list and thread replacement
6. DM CTA rewiring
7. Backup/restore
8. Stream removal and final hardening

Each chunk should leave the app in a coherent state.

## Phase Exit Criteria

### Exit after backend prep

- `nostr_pubkey` exists and is exposed to the client
- device lease endpoints exist and behave correctly

### Exit after runtime integration

- Marmot boots safely in browser-only mode
- local persistence works

### Exit after onboarding and lease work

- first-run setup works
- second-device block and move-here flow work

### Exit after UI replacement

- `/e/messages` works end to end without Stream
- DM entry points work

### Exit after cleanup

- no Stream packages
- no Stream env vars
- no Stream route handlers
- no Stream imports in either repo

## Risks To Watch During Implementation

- `marmot-ts` and related TS runtime maturity
- browser-only import leakage into server code
- deterministic DM derivation mistakes leading to duplicate conversations
- incomplete backup payloads
- overcomplicating v1 with event-group concerns

## Final Deliverable Definition

The migration is complete when:

- Stream Chat is fully removed from both repos
- `/e/messages` is powered by Evento-owned UI plus Marmot runtime
- a user can complete first-run onboarding, open a DM, send/receive text, refresh, and continue
- a user can export/import an encrypted chat backup
- a second device is blocked unless the user explicitly moves chat there
- the codebase is ready for future event-group chat without another architecture rewrite
