# Evento Client: Stream Chat → Client-Side Marmot Refactor Plan

> Repo analyzed: `sevenlabsxyz/evento-client`
>
> Target: replace the current Stream Chat implementation with a browser-only Marmot/MLS/Nostr chat stack while keeping the refactor streamlined, incremental, and low-chaos.

## Goal

Replace Evento’s existing Stream Chat-based DM experience under `/e/messages` with a client-side-only Marmot chat implementation that:
- runs entirely in the browser for messaging state and crypto
- preserves the current app-shell and route structure as much as possible
- minimizes UI churn during migration
- avoids a giant “rewrite everything” diff
- creates a clean abstraction so chat stops being tightly coupled to Stream-specific types and APIs

## What Exists Today in Evento

The repo is a Next.js app-router TypeScript app with:
- React Query at the root via `app/providers.tsx`
- client-heavy authenticated app shell in `app/e/layout.tsx`
- Zustand store for top bar (`lib/stores/topbar-store.ts`)
- auth via `useAuth()` + Supabase session sync
- current chat mounted globally via `StreamChatProvider`

### Current Stream Chat architecture

#### Provider layer
- `lib/providers/stream-chat-provider.tsx`
  - owns a global singleton `StreamChat` client
  - fetches token from backend
  - syncs user to Stream backend
  - connects/disconnects user
  - exposes `{ client, isLoading, error }`

#### Backend service layer
- `lib/services/stream-chat.ts`
  - backend-dependent REST endpoints:
    - get token
    - sync user
    - list channels
    - create DM channel
    - create/update/delete channel

#### Hook layer
- `lib/hooks/use-stream-chat.ts`
  - wraps token fetch + client connect
- `lib/hooks/use-message-actions.ts`
  - Stream-specific actions (flag, pin, reaction, unread)

#### Route/UI layer
- `app/e/layout.tsx`
  - mounts `StreamChatProvider`
- `app/e/messages/layout.tsx`
  - renders `Chat`, `ChannelList`, `ChannelPreview` from `stream-chat-react`
- `app/e/messages/[id]/page.tsx`
  - renders a Stream `Channel` + `MessageList`
  - manually manages pinned messages, input state, attachments, emoji picker
- `components/messages/new-chat-sheet.tsx`
  - searches users and creates direct-message channels via backend API
- several small Stream-shaped helper components

#### Stream-specific tests
- `__tests__/hooks/use-stream-chat.test.ts`
- `__tests__/integration/stream-chat-flow.test.tsx`
- `__tests__/hooks/use-message-actions.test.ts`

## Key Architectural Truth

The current chat implementation is deeply tied to Stream concepts:
- Stream auth token lifecycle
- Stream channel model
- Stream client singleton
- Stream React UI primitives
- server-mediated channel creation

Marmot is fundamentally different:
- no Stream token
- no central chat backend
- no server-created DM channel
- messaging identity is Nostr-based
- group state and message history are local cryptographic state
- invites/key packages are part of runtime behavior, not backend CRUD

So a successful migration is NOT a search/replace of SDKs.

It is a domain-architecture swap.

## Most Important Product/Architecture Decision

Before implementation, choose the identity/discovery model.

### Critical mismatch: Evento auth user != Marmot identity

Evento today authenticates users with app auth.
Marmot requires a Nostr identity/signing key and recipient key-package discovery.

The repo currently has:
- `UserDetails.nip05?: string`
- profile sheets for viewing/editing a NIP-05 identifier

But NIP-05 alone is NOT enough to make Marmot work reliably.

For Marmot you need, at minimum:
- a Nostr signing identity for the sender
- a resolvable recipient Nostr pubkey
- the recipient’s published Marmot key package(s)

### Recommended identity plan

Use a two-layer model:

1. Evento auth remains the app/session identity.
2. Marmot identity becomes a client-side messaging identity attached to the logged-in user.

Recommended implementation path:
- browser-only Marmot identity managed locally for now
- expose the public Nostr pubkey to the Evento profile layer so other users can discover it
- keep using `nip05` as optional human-readable identity, but do not rely on it as the only lookup mechanism

### Strong recommendation

Add explicit support for a discoverable messaging pubkey instead of relying only on `nip05`.

Best options, in order:
1. Add `nostr_pubkey` to user profile data model in backend/profile API
2. If backend changes are impossible initially, resolve `nip05` to pubkey client-side as a temporary bridge
3. If neither is available, Marmot onboarding becomes too fragile for a streamlined rollout

## Strategic Refactor Approach

Do not directly replace Stream calls in-place everywhere.

Instead, introduce a neutral chat domain layer first, then plug Marmot under it.

## Proposed Migration Strategy: Anti-Corruption Layer

Create a new chat domain inside the repo that hides the underlying transport/runtime.

### New target structure

```text
lib/
  chat/
    types.ts
    provider.tsx
    hooks/
      use-chat-client.ts
      use-conversations.ts
      use-conversation.ts
      use-send-message.ts
      use-chat-identity.ts
      use-chat-invites.ts
    adapters/
      marmot/
        settings.ts
        nostr.ts
        account-database.ts
        client.ts
        runtime.ts
        group-subscription-manager.ts
        identity.ts
        discovery.ts
        mapping.ts
    ui/
      conversation-list-model.ts
      message-list-model.ts
      composer-model.ts
```

Then move `/e/messages` to consume this neutral chat layer.

That gives you these benefits:
- UI stops caring whether transport is Stream or Marmot
- message pages become easier to reason about
- migration can happen in slices
- a temporary feature flag is possible if needed

## What to Keep vs Replace

## Keep

These should mostly stay:
- app route structure under `/app/e/messages`
- app shell in `app/e/layout.tsx`
- top bar integration patterns
- generic UI primitives:
  - `components/ui/chat-input.tsx`
  - `components/ui/message.tsx`
  - sheets / buttons / avatars / skeletons
- user search flow UX in `new-chat-sheet.tsx`
- overall mobile/desktop split behavior

## Replace

These are Stream-specific and should be removed or rewritten:
- `lib/providers/stream-chat-provider.tsx`
- `lib/services/stream-chat.ts`
- `lib/hooks/use-stream-chat.ts`
- `lib/hooks/use-message-actions.ts`
- `stream-chat-react` components in `/e/messages/layout.tsx`
- `stream-chat-react` usage in `/e/messages/[id]/page.tsx`
- `lib/utils/stream-chat-display.ts`
- `stream-chat.d.ts`
- `NEXT_PUBLIC_STREAM_CHAT_API_KEY` env usage
- Stream-specific tests

## Big Design Choice: Preserve `/e/messages` UX, Change the Engine

That is the streamlined path.

Instead of building a whole separate `/marmot` section first, keep `/e/messages` as the stable product surface but swap the internals.

### This means:
- `MessagesLayout` still shows “conversation list on left, detail on right”
- `SingleChatPage` still shows one conversation view
- `NewChatSheet` still starts a new conversation from user search
- but all data comes from Marmot runtime instead of Stream

## Conversation Model Mapping

To keep the UI stable, define repo-local generic types.

### Introduce generic chat types

```ts
export interface ChatConversationSummary {
  id: string;
  type: 'direct' | 'group';
  title: string;
  image?: string;
  memberIds: string[];
  unreadCount: number;
  lastMessageText?: string;
  lastMessageAt?: string;
}

export interface ChatMessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  senderImage?: string;
  text?: string;
  createdAt: string;
  pending?: boolean;
  failed?: boolean;
  attachments?: ChatAttachment[];
  replyToId?: string;
  pinned?: boolean;
}

export interface ChatAttachment {
  id: string;
  kind: 'image' | 'file' | 'audio' | 'video';
  name?: string;
  mimeType?: string;
  url?: string;
  size?: number;
}
```

The Marmot adapter maps runtime objects into these shapes.

This removes Stream types from your page/components layer.

## Direct Message Semantics in Marmot

### Important

A Stream “DM channel” is not equivalent to a Marmot DM.

In Marmot, the closest fit is a 2-member group.

So Evento DMs should be modeled as:
- one Marmot group with exactly 2 members
- group metadata marks it as an Evento direct message
- local mapping shows the “other participant” as the conversation title/avatar

### Recommended metadata fields

When creating a 2-member group, attach app-level metadata in group data or local metadata such as:
- `evento_chat_kind = direct`
- `evento_participants = [userA, userB]`
- `evento_creator_user_id = ...`
- `evento_counterparty_user_id = ...` (locally derived for rendering)

Do NOT over-engineer server-side reconciliation in phase 1.

## Streamlined Refactor Phases

## Phase 1 — Introduce generic chat abstraction

### Objective
Decouple pages/components from Stream-specific types before bringing in Marmot.

### Create
- `lib/chat/types.ts`
- `lib/chat/provider.tsx`
- `lib/chat/hooks/use-chat-client.ts`
- `lib/chat/hooks/use-conversations.ts`
- `lib/chat/hooks/use-conversation.ts`
- `lib/chat/hooks/use-send-message.ts`

### Refactor
- `app/e/messages/layout.tsx`
- `app/e/messages/[id]/page.tsx`
- `components/messages/new-chat-sheet.tsx`

### Outcome
Pages consume generic chat hooks and generic conversation/message models.

At this phase, you can still temporarily back them by Stream if desired, but the goal is to delete direct Stream imports from route components.

### Why this matters
This is the biggest leverage move for a low-chaos migration.

## Phase 2 — Add Marmot runtime modules under `lib/chat/adapters/marmot`

Port/adapt the Marmot reference web chat architecture into Evento’s Next.js patterns.

### Core files to add
- `lib/chat/adapters/marmot/settings.ts`
- `lib/chat/adapters/marmot/nostr.ts`
- `lib/chat/adapters/marmot/account-database.ts`
- `lib/chat/adapters/marmot/client.ts`
- `lib/chat/adapters/marmot/runtime.ts`
- `lib/chat/adapters/marmot/group-subscription-manager.ts`
- `lib/chat/adapters/marmot/discovery.ts`
- `lib/chat/adapters/marmot/mapping.ts`

### Responsibilities

#### `settings.ts`
Persist:
- lookup relays
- extra relays
- optional blossom servers
- auto-create-key-package flag
- current Marmot identity choice if needed

#### `nostr.ts`
Client-only:
- init `nostr-wasm`
- create event store
- create relay pool
- event verification
- event loader

#### `account-database.ts`
Client-only IndexedDB/localforage persistence for:
- group state
- key packages
- invite store
- rumor history
- optional media

#### `client.ts`
Compose:
- active Evento auth user
- active Marmot signer identity
- per-account storage
- Nostr network interface
- Marmot client instance
- invite reader
- live groups/key packages/invites streams

#### `runtime.ts`
Start/stop background subscriptions based on auth + identity readiness.

#### `discovery.ts`
Bridge Evento users to Marmot identities.

This is where user profile lookup and `nostr_pubkey` / `nip05` resolution should live.

#### `mapping.ts`
Map Marmot groups/rumors/messages into repo-local generic chat types.

## Phase 3 — Build Marmot identity bootstrap on top of Evento auth

### This is the hardest product question
How does a logged-in Evento user get a Marmot identity?

### Recommended MVP path

Option A — generated local keypair per Evento account on device
- simplest for client-side-only MVP
- keypair stored locally
- public key optionally synced to user profile
- downside: identity is device-local unless export/import is added

Option B — extension / bunker signer
- stronger Nostr-native model
- more complex onboarding
- probably too much for first streamlined migration unless audience already uses Nostr tools

### Recommended practical rollout
For a streamlined migration:
1. support local generated Marmot identity first
2. expose/import/export later
3. optionally support external Nostr signer as advanced mode later

### What the UI needs
A lightweight identity readiness flow inside `/e/messages`:
- if user has no Marmot identity: show onboarding CTA
- if identity exists but no key package: show “Publish key package” CTA
- if identity + key package exist: enter normal chat UX

## Phase 4 — Replace provider mounting in `app/e/layout.tsx`

Current:
- `StreamChatProvider` wraps the authenticated app shell

Target:
- replace with `ChatProvider` backed by Marmot adapter

Recommended implementation:
- `ChatProvider` is the app-level provider
- internally it mounts the Marmot runtime only on client
- route components consume generic hooks, not Marmot internals directly

### Why not mount Marmot only under `/e/messages`?
You can, but app-level mounting may be useful for live unread counts.

### Best compromise
Mount `ChatProvider` in `app/e/layout.tsx`, but lazily initialize heavy Marmot runtime only when a messages route or unread subscription actually needs it.

## Phase 5 — Replace conversation list implementation

Current `app/e/messages/layout.tsx` depends on:
- `Chat`
- `ChannelList`
- `CustomChannelPreview`
- Stream filters/sort/options

Target:
- custom conversation list component fed by `useConversations()`
- custom preview row using Evento design system
- no `stream-chat-react`

### Recommended component split
- `components/chat/conversation-list.tsx`
- `components/chat/conversation-preview.tsx`

These should render:
- avatar/title of other participant for DMs
- last message preview
- timestamp
- unread count

This is simpler than trying to emulate Stream’s list API.

## Phase 6 — Replace single chat page implementation

Current `app/e/messages/[id]/page.tsx` uses:
- Stream `Channel`
- Stream `Window`
- Stream `MessageList`
- pinned message state based on Stream events
- channel query/watch semantics

Target:
- fully custom page using:
  - `useConversation(id)`
  - `useConversationMessages(id)`
  - `useSendMessage(id)`

### Page should manage:
- header/title from mapped conversation model
- list of mapped messages
- composer state
- attachment picker
- optional pin/reply UI if supported in chosen Marmot MVP

### Strong recommendation
Defer these Stream-era features in phase 1 unless they are mission-critical:
- pin/unpin
- reactions
- mark unread
- flagging/moderation
- threaded replies

These are not natural MVP features in Marmot and will slow the migration.

### MVP features for first shippable refactor
- list conversations
- open conversation
- send text
- receive text
- create/start DM
- basic attachments later

## Phase 7 — Rework `NewChatSheet`

Current behavior:
- search users
- backend creates Stream DM channel
- navigate to `/e/messages/:channelId`

Target Marmot behavior:
- search users exactly as today
- resolve selected user to Marmot identity
- find existing 2-member group OR create/invite a new one
- navigate to `/e/messages/:conversationId`

### This requires:
- `useSearchUsers()` can remain unchanged
- add discovery step:
  - get selected user’s `nostr_pubkey` or resolve `nip05`
  - confirm they have a published key package or can receive invite
- then call `createDirectConversation(recipient)` in the chat adapter

### Recommended conversation creation flow
1. Check local known conversations for an existing direct chat with recipient.
2. If found, open it.
3. If not found, create 2-member Marmot group and publish invite.
4. Persist local mapping.
5. Navigate to new conversation ID.

## Phase 8 — Remove Stream backend dependencies

Once Marmot replacement is working, delete:
- token fetch endpoint dependency
- sync user endpoint dependency
- create/update/delete Stream channel dependency
- Stream env var access
- Stream package imports

### Repo cleanup targets
- remove `stream-chat`
- remove `stream-chat-react`
- remove `NEXT_PUBLIC_STREAM_CHAT_API_KEY` from env constants and docs
- delete Stream-specific test mocks

## Proposed File-by-File Refactor Map

## Files to delete eventually
- `lib/providers/stream-chat-provider.tsx`
- `lib/services/stream-chat.ts`
- `lib/hooks/use-stream-chat.ts`
- `lib/hooks/use-message-actions.ts` (or replace with generic message actions)
- `lib/utils/stream-chat-display.ts`
- `app/e/messages/stream-chat.d.ts`

## Files to heavily refactor
- `app/e/layout.tsx`
- `app/e/messages/layout.tsx`
- `app/e/messages/[id]/page.tsx`
- `components/messages/new-chat-sheet.tsx`
- tests that currently assert Stream behavior

## Files to mostly keep/reuse
- `components/ui/chat-input.tsx`
- `components/ui/message.tsx`
- top bar store and route config patterns
- auth hooks and app shell
- user search/following hooks
- toast/logger patterns

## Suggested New Files

```text
lib/chat/types.ts
lib/chat/provider.tsx
lib/chat/hooks/use-chat-client.ts
lib/chat/hooks/use-conversations.ts
lib/chat/hooks/use-conversation.ts
lib/chat/hooks/use-conversation-messages.ts
lib/chat/hooks/use-send-message.ts
lib/chat/hooks/use-chat-identity.ts
lib/chat/hooks/use-chat-invites.ts
lib/chat/adapters/marmot/settings.ts
lib/chat/adapters/marmot/nostr.ts
lib/chat/adapters/marmot/account-database.ts
lib/chat/adapters/marmot/client.ts
lib/chat/adapters/marmot/runtime.ts
lib/chat/adapters/marmot/group-subscription-manager.ts
lib/chat/adapters/marmot/discovery.ts
lib/chat/adapters/marmot/mapping.ts
components/chat/conversation-list.tsx
components/chat/conversation-preview.tsx
components/chat/message-list.tsx
components/chat/message-composer.tsx
components/chat/chat-identity-gate.tsx
components/chat/key-package-cta.tsx
```

## Streamlined MVP Scope Recommendation

To keep this refactor sane, the first Marmot milestone should support only:
- authenticated user can initialize local Marmot identity
- publish or refresh a key package
- list known DMs/groups
- create/open a DM with another Evento user
- send/receive text messages
- basic persistence across refresh

Defer to later milestones:
- attachments/media
- reactions
- pinned messages
- unread semantics beyond simple local counts
- message moderation/flagging
- reply threads
- webxdc
- cross-device key export/import polish

## Discovery Layer Plan

This is the repo-specific glue that matters most.

### Problem
Evento users are app users; Marmot peers are Nostr identities.

### Need
A reliable way to discover a target user’s chat identity.

### Recommended implementation in Evento

#### Preferred
Extend user profile data with:
- `nostr_pubkey?: string`
- optionally `nostr_chat_ready?: boolean`

That makes `NewChatSheet` simple and deterministic.

#### Temporary fallback
If only `nip05` exists:
- resolve `nip05` to pubkey client-side
- cache the result locally
- use that pubkey for Marmot discovery

#### Important caveat
If a user has neither `nostr_pubkey` nor valid resolvable `nip05`, they cannot be a Marmot chat recipient.

The UI must surface that cleanly.

## Suggested UI/UX Guardrails

### When opening `/e/messages`
If user is not Marmot-ready, show a gating state:
- “Set up secure chat”
- create local identity
- optionally publish discoverable pubkey
- publish key package

### When starting a new chat
Possible states:
- recipient is chat-ready → create/open DM
- recipient has identity but no key package → show “not ready yet” / retry
- recipient has no discoverable identity → show “This user hasn’t enabled secure chat yet”

### When reading a conversation
Possible states:
- loading runtime
- syncing local state
- waiting for invite acceptance / group readiness
- relay disconnected

## Testing Strategy for the Refactor

## Replace Stream tests with chat-domain tests

### New high-value tests
1. `use-chat-client` initializes only when auth + identity exist
2. per-account storage remains isolated
3. `use-conversations` maps Marmot groups into conversation summaries
4. `createDirectConversation` returns existing 2-member group when present
5. `createDirectConversation` creates/invites new DM when absent
6. `use-send-message` appends optimistic message and resolves to persisted message
7. messages page renders from generic chat models without Stream imports

### Manual QA checklist
- login
- open `/e/messages`
- initialize Marmot identity
- publish key package
- create DM with another chat-ready user
- send text
- receive text from another client
- reload page and confirm conversation still renders
- switch account and confirm chat state isolation

## Risk Register

### Risk 1 — Identity/discovery not solved cleanly
This is the biggest blocker.

Mitigation:
- explicitly add `nostr_pubkey` support or a temporary `nip05` resolution path before doing UI-heavy work

### Risk 2 — Over-preserving Stream-era features
Trying to keep pinning/reactions/threads on day one will bloat the migration.

Mitigation:
- cut to text DMs first

### Risk 3 — SSR/client boundary issues in Next.js
Marmot runtime, IndexedDB, relay pool, wasm, and signer logic are browser-only.

Mitigation:
- keep Marmot runtime under client-only modules and provider boundaries

### Risk 4 — Tight coupling to current page code
`app/e/messages/[id]/page.tsx` currently mixes UI, Stream channel lifecycle, and state.

Mitigation:
- move state to hooks + generic adapter before swapping backend engine

### Risk 5 — Missing recipient readiness
Not all Evento users will have a chat identity/key package.

Mitigation:
- add readiness UI and graceful empty states

## Best Streamlined Execution Order

### Step 1
Introduce generic chat models/hooks and remove direct Stream imports from route components.

### Step 2
Build Marmot adapter/runtime behind those hooks.

### Step 3
Implement identity/discovery flow.

### Step 4
Replace conversation list.

### Step 5
Replace single conversation page.

### Step 6
Replace new-chat flow.

### Step 7
Delete Stream dependencies and env usage.

This order minimizes blast radius.

## Recommended Final Architecture

### At the top
- app auth still controls app access
- chat provider is mounted in authenticated app shell

### In the middle
- generic chat hooks power the `/e/messages` UI

### At the bottom
- Marmot adapter manages identity, relays, storage, invites, conversations, and message ingestion

That gives Evento:
- stable product routes
- lower coupling
- real client-side-only secure chat runtime
- a path to expand later without redoing the whole tree again

## Bottom-Line Recommendation

Do NOT attempt a brute-force “replace Stream with Marmot” inside the current files.

Instead:
1. carve out a generic chat domain
2. preserve `/e/messages` UX shell
3. port Marmot as an adapter/runtime beneath that shell
4. solve identity discovery early
5. ship text DMs first
6. delete Stream after the new path is proven end-to-end

That is the cleanest and most streamlined refactor path for `evento-client`.
