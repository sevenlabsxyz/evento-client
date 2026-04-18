# Evento Marmot Chat Design

Date: 2026-03-26
Status: Approved for implementation planning
Scope: Replace Stream Chat in Evento with a Marmot-first, client-side encrypted messaging stack while preserving the Evento chat product surface and preparing the architecture for future event-group chat.

## Executive Summary

Evento will fully remove Stream Chat and replace it with a Marmot-backed messaging system that runs client-side in the browser. The user-facing route will remain `/e/messages`, and the product will preserve the current split-view DM experience with an Evento-owned interface rather than Stream-owned components.

The replacement architecture will introduce a generic Evento chat domain and a Marmot adapter/runtime beneath it. This avoids coupling route components to protocol internals and creates a clean path from v1 direct messages to v2 event group chat.

The v1 release will focus on:

- full Stream removal
- Evento-owned message list and thread UI
- first-run chat onboarding
- hidden key generation and setup
- discoverable Nostr identity via Evento profile metadata
- single active chat device per user
- encrypted backup/export and restore/import of chat identity plus local chat state
- direct-message conversations only

The v1 release will explicitly not include:

- Stream legacy history migration
- push notifications
- simultaneous multi-device chat
- guaranteed parity for Stream-native reactions, pins, unread behavior, moderation actions, or attachments
- event-group chat product UI

## Goals

- Remove all Stream Chat dependencies and product flows from Evento.
- Preserve the current `/e/messages` route as the main chat entry point.
- Preserve the current list/detail chat UX on mobile and desktop.
- Keep Evento auth as the app/session identity.
- Create or load Marmot/Nostr identity behind the scenes with no key exposure in the default flow.
- Make recipient discovery practical via Evento identity metadata.
- Support starting DMs from existing Evento surfaces.
- Keep the chat backend-free in the Stream sense: no message store, no channel store, no Stream token lifecycle.
- Design the architecture so direct messages in v1 and event groups in v2 share the same foundation.

## Non-Goals

- Port the reference Marmot web chat UI 1:1.
- Preserve Stream implementation details or Stream backend APIs.
- Promise exact parity for every Stream feature in v1.
- Support multiple concurrently active chat devices.
- Solve end-state cloud backup in v1.
- Build event-group chat in the first implementation.

## Product Decisions Already Made

### Core Messaging Direction

- Stream Chat should be removed completely.
- Marmot will be the only messaging engine in Evento.
- `/e/messages` remains the stable chat surface.
- The UI should feel similar to the current iMessage-style sidebar/thread experience.

### Identity

- Evento user auth remains the primary app identity.
- Each Evento user will have a discoverable messaging identity.
- Backend profile data will include an explicit `nostr_pubkey`.
- Evento will use `username@evento.cash` as the user-facing `nip05` identity path.
- Keys are generated and managed behind the scenes by default.
- Advanced settings may later expose export/import and identity details.

### First-Run Onboarding

The first chat launch will use a 3-step Evento-owned onboarding flow:

1. Introduce encrypted DMs.
2. Explain privacy and local-first behavior.
3. Explain readiness and let the user start.

The final CTA will be a `Start` button. After tapping it, the user sees a loading state with copy such as `We're getting things going for you`, while the client creates identity and initializes local state.

### Device Model

- v1 supports one active chat device per user.
- A second device attempting activation is blocked.
- The user can choose `Move chat here`.
- Moving invalidates the old active-device lease.
- Evento does not promise to recover missing local chat state from the previous device.

### Backup

- Chat backup is a separate encrypted payload from wallet backup.
- Backup will contain both messaging identity material and the local chat state required for continuity.
- The payload is protected by a PIN.
- The wallet and chat may share UX patterns, but should remain separate encrypted payloads.

### Notifications

- No push notifications in v1.

### Event Groups

- Event-group chat is desirable, but not part of v1 shipping scope.
- The architecture must support groups from day one.
- Future event group access will be tied to RSVP `yes`.
- Evento will not become the canonical server-side chat roster.
- For future event groups, Evento can expose lightweight exclusion signals keyed by `event_id` so the client can hide and delete local state for removed users.

## Current State Analysis

The current implementation is tightly coupled to Stream at multiple layers.

### Current Stream Integration Points

- [`app/e/layout.tsx`](/Users/andreneves/.codex/worktrees/fb12/evento-client/app/e/layout.tsx)
  - mounts the global `StreamChatProvider`
- [`lib/providers/stream-chat-provider.tsx`](/Users/andreneves/.codex/worktrees/fb12/evento-client/lib/providers/stream-chat-provider.tsx)
  - manages Stream token fetch, user sync, and client lifecycle
- [`lib/services/stream-chat.ts`](/Users/andreneves/.codex/worktrees/fb12/evento-client/lib/services/stream-chat.ts)
  - wraps Stream-specific backend endpoints
- [`app/e/messages/layout.tsx`](/Users/andreneves/.codex/worktrees/fb12/evento-client/app/e/messages/layout.tsx)
  - renders Stream `Chat` and `ChannelList`
- [`app/e/messages/[id]/page.tsx`](/Users/andreneves/.codex/worktrees/fb12/evento-client/app/e/messages/[id]/page.tsx)
  - renders Stream `Channel`, `Window`, `MessageList`, attachment upload, emoji, and pin UI
- [`components/messages/new-chat-sheet.tsx`](/Users/andreneves/.codex/worktrees/fb12/evento-client/components/messages/new-chat-sheet.tsx)
  - starts DMs through a Stream backend endpoint
- [`components/event-detail/event-host.tsx`](/Users/andreneves/.codex/worktrees/fb12/evento-client/components/event-detail/event-host.tsx)
  - deep-links into DM creation via Stream
- follower/following sheets
  - deep-link into `/e/messages?user=<id>`
- [`lib/hooks/use-message-actions.ts`](/Users/andreneves/.codex/worktrees/fb12/evento-client/lib/hooks/use-message-actions.ts)
  - depends on Stream methods for flagging, pinning, reactions, and mark-unread

### Current User-Visible Feature Surface

The Stream implementation currently provides:

- conversation list in a sidebar
- last message preview and time display
- unread badges
- DM creation from user search
- DM entry from event host cards
- DM entry from follower/following sheets
- text messages
- image/file attachment upload
- emoji insertion
- message edit/delete/pin/react actions via Stream UI
- pinned-message banner
- top-bar partner identity

This matters because the migration target is not just a protocol replacement. The target is the preserved Evento chat product surface.

## Why A Direct SDK Swap Will Fail

Stream and Marmot are not interchangeable systems.

Stream assumes:

- backend token issuance
- backend user sync
- server-backed channel creation and membership
- Stream-specific client and component model

Marmot assumes:

- client-side identity and key management
- client-side group state persistence
- relay-based discovery and message transport
- browser-local cryptographic state

The migration is therefore a domain architecture replacement, not a component-level swap.

## Target Architecture

### Design Principle

The route layer should depend on Evento chat concepts, not Stream types or raw Marmot internals.

### Layering

#### Layer 1: Evento Chat Domain

This is the app-facing abstraction used by pages and components.

Responsibilities:

- expose conversation and message models
- expose hooks for listing, opening, and sending messages
- expose chat identity readiness state
- expose backup and device-lease flows
- hide transport/protocol implementation details

Suggested files:

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

#### Layer 2: Marmot Adapter and Runtime

This is the protocol/runtime layer behind the Evento chat domain.

Responsibilities:

- local identity generation and loading
- local persistence
- relay/runtime bootstrap
- key package management
- group discovery and lifecycle
- mapping Marmot groups/messages into Evento chat models
- backup/export and restore/import

Suggested files:

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

### Runtime Boundary Rules

All of the following must remain client-only:

- Nostr signer logic
- Marmot runtime bootstrap
- relay websocket connections
- IndexedDB/localforage or equivalent browser persistence
- live subscription management
- local crypto state
- decryption pipeline

Next.js remains responsible for:

- route structure
- app shell
- composition
- static loading states
- non-E2EE backend APIs

## Conversation Model

The Evento chat domain should model both current and future chat types.

Suggested top-level types:

```ts
type ChatConversationType = 'direct' | 'group';

interface ChatConversationSummary {
  id: string;
  type: ChatConversationType;
  title: string;
  image?: string;
  participantIds: string[];
  unreadCount: number;
  lastMessageText?: string;
  lastMessageAt?: string;
  eventId?: string;
}

interface ChatMessageItem {
  id: string;
  conversationId: string;
  senderUserId: string;
  senderName?: string;
  senderImage?: string;
  text?: string;
  createdAt: string;
  pending?: boolean;
  failed?: boolean;
  attachments?: ChatAttachment[];
}

interface ChatAttachment {
  id: string;
  kind: 'image' | 'file' | 'audio' | 'video';
  name?: string;
  mimeType?: string;
  url?: string;
  size?: number;
}

interface ChatIdentityStatus {
  state:
    | 'uninitialized'
    | 'needs-onboarding'
    | 'initializing'
    | 'needs-device-activation'
    | 'needs-restore-or-start'
    | 'ready'
    | 'error';
  message?: string;
}
```

Notes:

- DMs are modeled as 2-member groups under the hood.
- Event groups use the same surface type later, differentiated by `type = 'group'` and `eventId`.
- This design prevents a second rewrite when event chat is added.

## Identity Model

### Public Identity

User profile data should expose:

- `nostr_pubkey`
- `nip05`

Expected `nip05` convention:

- `username@evento.cash`

The explicit `nostr_pubkey` is essential. `nip05` is valuable for user-facing identity and resolution, but should not be the only reliable source of recipient discovery.

### Private Identity

Private identity should remain local to the device in v1.

The client should generate:

- the user’s Nostr private key
- any Marmot-local identity/state needed for the runtime

The default product flow should never show the key material to the user.

### Advanced Identity Controls

Later settings can expose:

- export backup
- import backup
- show public key
- show `nip05`
- move chat to this device

Raw private-key visibility should be treated as advanced and optional, not part of the primary UX.

## DM Discovery and Creation

DM creation must support multiple current entry points:

- new-chat sheet
- event host cards
- follower/following sheets
- any future user profile CTA

### Open-Or-Create Direct Conversation Flow

1. User selects another Evento user.
2. Client resolves recipient messaging identity:
   - use explicit `nostr_pubkey`
   - use `nip05` only as a fallback bridge if necessary
3. Client derives or looks up the deterministic direct-conversation identity for the two participants.
4. Client checks local conversation cache/state.
5. If the conversation exists locally, open it.
6. If it does not exist, create/join the Marmot 2-member group using official runtime patterns.
7. Map the resulting group to an Evento conversation id and navigate to `/e/messages/<conversationId>`.

The user experience remains `message a user`. The protocol implementation is hidden.

## First-Run Onboarding and Readiness Flow

### User Experience

The first-time chat experience should be a stepped flow with a `Next` button and fade transitions between screens.

Proposed structure:

#### Step 1

- title: encrypted DMs or similar
- short plain-language description
- optional illustration

#### Step 2

- explain privacy and local-first behavior
- explain that Evento does not store the chat contents

#### Step 3

- explain setup completion and backup importance
- primary CTA: `Start`

#### Setup Loading Screen

- full-screen loading state
- copy similar to `We're getting things going for you`
- show progress states if useful, but keep the language non-technical

### Behind-The-Scenes Work

When the user completes onboarding, the client should:

- create or load local chat storage
- create or load local Nostr/Marmot identity
- initialize the Marmot runtime
- create and publish required key packages
- publish or sync discoverable public identity metadata if needed
- acquire or validate the device lease
- mark chat as ready

### Failure Handling

If setup fails:

- surface an Evento-owned retry state
- avoid protocol-heavy language
- retain onboarding completion state so the user does not re-read the intro unnecessarily

## Device Lease Model

### Goal

Prevent multiple simultaneously active devices for the same chat identity in v1.

### Backend Responsibilities

The backend stores lightweight device lease metadata, not chat content.

Suggested responsibilities:

- current active chat device id
- lease acquisition/update timestamp
- ability to force-move the lease to the current device

### Client Behavior

On chat startup:

1. Client checks current device lease state.
2. If no lease exists, acquire one.
3. If the lease belongs to this device, continue.
4. If the lease belongs to another device, block activation.
5. Present `Move chat here`.
6. If confirmed, replace the lease and continue.

### Move Chat Here UX

The UX must clearly state:

- chat is already active on another device
- Evento cannot fetch missing local chat state from that device
- moving here will continue from what this device currently has

If restore/import exists on the device already, users can restore before or after the move flow.

## Backup and Restore

### Principle

Backup must restore continuity, not just identity.

That means the backup payload should include:

- private identity material
- local Marmot database/state needed to resume conversations
- any metadata required to rebuild conversation continuity cleanly

### Encryption

- backup payload is encrypted client-side
- protected by a PIN
- separate from wallet backup payload

### UX

Initial backup UX can be manual:

- `Export chat backup`
- `Import chat backup`

Later cloud backup can reuse the same payload shape.

### Why Key-Only Restore Is Insufficient

If only the private key is restored and the local Marmot group state is not, the user may recover identity but fail to regain smooth continuity in ongoing conversations. The design therefore treats the combined encrypted backup blob as the primary continuity artifact.

## UI Migration Plan

### Keep

Preserve where practical:

- route structure under `/e/messages`
- app shell in [`app/e/layout.tsx`](/Users/andreneves/.codex/worktrees/fb12/evento-client/app/e/layout.tsx)
- top-bar integration
- existing visual structure of conversation list + thread
- existing `components/ui/chat-input.tsx`
- existing generic UI primitives and avatar patterns

### Replace

Remove or rewrite:

- `StreamChatProvider`
- Stream service layer
- Stream route components and Stream React components
- Stream-specific avatar and channel preview helpers
- Stream-specific hooks/tests/types/env vars

### New First-Party Chat UI

Suggested new UI components:

- `components/chat/chat-onboarding.tsx`
- `components/chat/chat-setup-loading.tsx`
- `components/chat/chat-device-lease-gate.tsx`
- `components/chat/chat-backup-sheet.tsx`
- `components/chat/conversation-list.tsx`
- `components/chat/conversation-preview.tsx`
- `components/chat/conversation-thread.tsx`
- `components/chat/conversation-empty-state.tsx`

### Existing CTA Entry Points To Rewire

The following should switch from Stream channel creation to the new direct-conversation flow:

- [`components/messages/new-chat-sheet.tsx`](/Users/andreneves/.codex/worktrees/fb12/evento-client/components/messages/new-chat-sheet.tsx)
- [`components/event-detail/event-host.tsx`](/Users/andreneves/.codex/worktrees/fb12/evento-client/components/event-detail/event-host.tsx)
- follower/following sheets

Any `?user=` deep links should be interpreted as an `open direct chat with this Evento user` request.

## Feature Parity Strategy

### Preserve in v1

- current chat route surface
- DM creation flows
- text send/receive
- local persistence across refresh
- list/detail layout
- top-bar partner identity
- loading and error handling

### Ship Later or Reduce in v1

#### Attachments

Attachments are desirable, but are not required to block the Stream removal if the Marmot media flow is not stable enough on the first pass.

Plan:

- v1 target: text messages first
- v1.1 target: attachments if the official patterns are straightforward to integrate

#### Unread

Unread state can initially be local and best-effort rather than exact Stream parity.

#### Reactions, Pins, Flagging, Mark-Unread

These should not be treated as required v1 features.

The Stream versions are tightly coupled to Stream APIs and should not be blindly re-created. The clean approach is:

- remove those actions from the primary product surface in v1
- reintroduce them later only if Evento chooses protocol-appropriate semantics

## Event Group Readiness For v2

### Principle

Even though v1 ships DMs only, the architecture must support groups now.

### Future Event Group Model

- one Marmot group maps to one Evento event
- a user with RSVP `yes` may access the event chat
- if the backend later exposes exclusion signals keyed by `event_id`, the client can hide and delete local event-chat state

### Backend Involvement

Evento should not become a chat membership database. For event chat, backend involvement should remain minimal:

- event identity mapping
- exclusion signals for local enforcement

### Important Expectation

Removing a user from future access is product-enforceable via the client, but is not a cryptographic way to erase history they already extracted locally.

That tradeoff is acceptable for the planned product.

## Dependency Strategy

The implementation should follow the official `marmots-web-chat` runtime patterns closely for correctness, but should not import its UI assumptions wholesale.

Guidance:

- copy architecture patterns from the official runtime, not the visual shell
- prefer thin adaptation over brute-force UI porting
- keep SSR boundaries explicit
- treat the Marmot and related TypeScript ecosystem as experimental

## Migration Phases

### Phase 0: Prep and Shape The Surface

- inventory all Stream usage
- finalize Evento chat domain interfaces
- add spec-backed backend requirements

### Phase 1: Generic Chat Layer

- create Evento chat types and hooks
- refactor route/components to consume generic chat models
- keep protocol details out of the route layer

### Phase 2: Marmot Runtime Skeleton

- create client-only runtime bootstrap
- set up local persistence
- integrate identity storage
- prove safe initialization inside the Next.js app shell

### Phase 3: Identity and Onboarding

- implement 3-step onboarding flow
- implement hidden identity creation
- implement key package readiness flow
- publish public identity metadata

### Phase 4: Device Lease and Backup

- implement lease acquisition and move-here flow
- implement export/import backup flow

### Phase 5: Conversation List and DM Open-Or-Create

- replace Stream `ChannelList`
- support recipient-based deep-link flows
- support direct open-or-create semantics

### Phase 6: Thread View

- replace Stream thread page with Evento-owned thread UI
- support text sending
- support error and empty states

### Phase 7: Stream Removal and Cleanup

- delete Stream provider/service/hooks/components/types
- remove Stream packages and env vars
- remove Stream tests
- replace with chat-domain and Marmot tests

### Phase 8: Hardening

- verify navigation behavior
- verify persistence and restore flows
- verify single-device behavior
- validate mobile/desktop UX

## Testing Strategy

### Unit Tests

Add tests for:

- chat identity status transitions
- DM open-or-create flow
- device lease handling
- backup/export/import behavior
- conversation and message mapping logic

### Integration Tests

Add integration coverage for:

- first-time onboarding through ready state
- starting a DM from the new-chat sheet
- starting a DM from host/follower/following entry points
- move-chat-here flow
- import backup then activate chat

### Manual QA

Critical manual QA checklist:

- first launch onboarding
- happy-path setup
- setup failure and retry
- existing user with ready identity
- deep-link into DM by user id
- conversation list rendering
- thread rendering
- text send/receive
- refresh persistence
- lease conflict on second device
- move-here warning and takeover
- export/import backup
- logout/login state transitions

## Risks

### Marmot Ecosystem Maturity

The official Marmot TypeScript stack is still experimental/alpha. This increases integration and stability risk and should be reflected in internal expectations.

### Browser-Only Runtime Boundaries

Import mistakes can cause SSR crashes or hydration issues. Client-only boundaries must be explicit and enforced.

### Direct Conversation Determinism

DM identity must be reliably derived or discovered. If this is wrong, users can accidentally fragment conversations.

### Backup Completeness

If backup omits required local state, restore continuity will break. Backup design must be validated early.

### UX Complexity Around Device Moves

The single-device model is good for v1, but the move-here flow must be extremely clear to avoid confusing users who expect chat state to magically follow them.

## Open Questions

No blocking product questions remain for the v1 design. The remaining unknowns are implementation details and technical validation against the official Marmot libraries/reference app.

## Implementation Summary

The correct implementation direction is:

- remove Stream entirely
- preserve `/e/messages`
- build an Evento-owned chat domain
- implement a client-only Marmot adapter beneath it
- ship direct messages only in v1
- hide key management behind onboarding and settings
- support one active chat device
- support encrypted backup and restore of identity plus local state
- keep the architecture ready for future event-group chat

This provides the cleanest one-pass migration path with the least architectural regret.
