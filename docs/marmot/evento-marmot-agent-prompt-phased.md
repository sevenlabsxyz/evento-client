# Agent Prompt: Exact-Phase Implementation Brief for Evento Stream Chat → Marmot

You are implementing a chat-architecture migration in the `sevenlabsxyz/evento-client` repository.

This is not an open-ended exploration task.
This is a phased refactor with strict priorities.

Your job is to replace the existing Stream Chat implementation with a client-side-only Marmot chat implementation while preserving the current `/e/messages` product surface as much as possible.

You must execute this as a sequence of controlled phases.
Do not skip ahead.
Do not rewrite everything at once.
Do not keep direct Stream dependencies inside route components.

## Primary Objective

Ship a working first version of Evento chat backed by Marmot that supports:
- authenticated user opens `/e/messages`
- chat identity readiness flow exists
- direct conversations can be created/opened
- text messages can be sent and received
- local state persists across refresh
- Stream SDK and Stream React components are removed from the chat route implementation

## Non-Negotiable Constraints

1. Keep `/e/messages` as the main user-facing chat route.
2. Messaging runtime must be client-side only.
3. Do not import browser-only Marmot runtime modules into server components.
4. Do not leave direct `stream-chat` or `stream-chat-react` usage inside route/page components after the refactor is complete.
5. Introduce a repo-local generic chat abstraction so UI is not coupled directly to Marmot internals.
6. Do not attempt full feature parity with Stream in v1.
7. Focus on text DMs first. Everything else is secondary.

## Required Reading Before Coding

Read and understand:
- the repo-specific migration plan in `evento-marmot-chat-refactor-plan.md`
- `https://github.com/marmot-protocol/marmot`
- `https://github.com/marmot-protocol/marmot-ts`
- `https://github.com/marmot-protocol/marmots-web-chat`

Also inspect these current repo files carefully:
- `app/e/layout.tsx`
- `app/e/messages/layout.tsx`
- `app/e/messages/[id]/page.tsx`
- `components/messages/new-chat-sheet.tsx`
- `lib/providers/stream-chat-provider.tsx`
- `lib/services/stream-chat.ts`
- `lib/hooks/use-stream-chat.ts`
- `lib/hooks/use-message-actions.ts`
- `lib/hooks/use-auth.ts`
- `lib/types/api.ts`

## Hard Architectural Requirement

You must split the migration into two layers:

### Layer A: Generic chat domain
Create a neutral app-level chat abstraction for Evento.
This layer is consumed by routes and UI.
It must not expose raw Stream types.
It should also avoid leaking raw Marmot implementation details wherever practical.

### Layer B: Marmot adapter/runtime
Implement Marmot behind the generic chat layer.
This layer handles identity, relay network, local storage, invites, group state, and mapping into Evento chat models.

## Product Identity Requirement

Evento auth is not the same as a Nostr/Marmot identity.
You must explicitly handle this mismatch.

For the first implementation:
- keep Evento auth as app auth
- introduce a client-side Marmot identity bootstrap path per logged-in user
- prefer a generated local keypair for MVP if external signer support is too heavy
- support recipient identity discovery via explicit pubkey if available
- if only `nip05` exists, use `nip05` resolution as a fallback bridge, not the only long-term design

You must clearly document unresolved discovery limitations if the repo/backend does not yet expose enough recipient identity data.

## DO NOT Build Yet

Do not spend time on these in the first pass unless trivial:
- reactions
- pinning
- message flagging
- mark unread parity
- threads/replies
- media attachments
- webxdc
- advanced account import/export UX
- full multi-device sync story

## Exact Implementation Phases

### Phase 0 — Repo analysis and migration prep

Objective:
Understand the current Stream integration and define exact first changes.

Tasks:
1. Inspect current `/e/messages` architecture and list all Stream touchpoints.
2. Inspect auth/user model and determine what identity data exists today (`id`, `username`, `nip05`, etc.).
3. Decide whether a temporary `nip05`-resolution bridge is needed.
4. Identify all tests that will need replacement or rewrite.

Deliverable before code:
- a short implementation note summarizing:
  - current Stream dependencies
  - proposed generic chat abstraction
  - Marmot identity/discovery plan
  - exact first files to create/modify

Do not start coding until this summary is explicit.

### Phase 1 — Introduce generic chat domain

Objective:
Remove direct Stream coupling from route components.

Create these files or close equivalents:
- `lib/chat/types.ts`
- `lib/chat/provider.tsx`
- `lib/chat/hooks/use-chat-client.ts`
- `lib/chat/hooks/use-conversations.ts`
- `lib/chat/hooks/use-conversation.ts`
- `lib/chat/hooks/use-conversation-messages.ts`
- `lib/chat/hooks/use-send-message.ts`
- `lib/chat/hooks/use-chat-identity.ts`
- `lib/chat/hooks/use-chat-invites.ts`

Define repo-local generic types such as:
- `ChatConversationSummary`
- `ChatMessageItem`
- `ChatAttachment`
- `ChatIdentityStatus`

Then refactor these files to depend on the new generic layer, not directly on Stream APIs:
- `app/e/messages/layout.tsx`
- `app/e/messages/[id]/page.tsx`
- `components/messages/new-chat-sheet.tsx`

Important:
At the end of this phase, route components should be structured around generic chat hooks/models even if Marmot is not fully wired yet.

Deliverable:
- page/components no longer structurally depend on Stream-specific types
- chat domain types/hooks exist

### Phase 2 — Add client-only Marmot runtime skeleton

Objective:
Create the Marmot runtime infrastructure without fully wiring all UI yet.

Create these files or close equivalents:
- `lib/chat/adapters/marmot/settings.ts`
- `lib/chat/adapters/marmot/nostr.ts`
- `lib/chat/adapters/marmot/account-database.ts`
- `lib/chat/adapters/marmot/client.ts`
- `lib/chat/adapters/marmot/runtime.ts`
- `lib/chat/adapters/marmot/group-subscription-manager.ts`
- `lib/chat/adapters/marmot/discovery.ts`
- `lib/chat/adapters/marmot/mapping.ts`

Requirements:
- browser-only initialization boundaries are explicit
- no SSR crashes
- local persistence is partitioned per Evento user/account
- Marmot runtime is mountable via a provider

Deliverable:
- Marmot runtime boots safely in the browser
- no active messaging UI yet required beyond smoke-level readiness

### Phase 3 — Implement chat identity readiness flow

Objective:
A logged-in Evento user can become “chat-ready.”

Tasks:
1. Implement local Marmot identity creation/bootstrap.
2. Add key package readiness detection.
3. Add key package create/publish flow.
4. Add a lightweight identity gate UI for `/e/messages`.

Suggested new UI files:
- `components/chat/chat-identity-gate.tsx`
- `components/chat/key-package-cta.tsx`

Success conditions:
- if user has no local Marmot identity, UI tells them to create/setup secure chat
- if identity exists but no key package exists, UI tells them to publish one
- if identity + key package exist, normal chat UI becomes available

Deliverable:
- `/e/messages` can gate users into a valid Marmot-ready state

### Phase 4 — Replace provider mounting in authenticated app shell

Objective:
Swap app-level chat runtime from Stream provider to generic chat provider backed by Marmot.

Modify:
- `app/e/layout.tsx`

Tasks:
1. Remove `StreamChatProvider` usage.
2. Mount `ChatProvider` instead.
3. Ensure heavy Marmot runtime is initialized client-side only.
4. Make sure route changes do not tear down active chat state incorrectly.

Success conditions:
- authenticated app shell renders without Stream provider
- chat provider exists and is ready for `/e/messages`

Deliverable:
- Stream provider removed from app shell

### Phase 5 — Replace conversation list UI and data source

Objective:
Replace Stream `ChannelList` with Evento-owned conversation list components backed by generic chat hooks.

Create:
- `components/chat/conversation-list.tsx`
- `components/chat/conversation-preview.tsx`

Modify:
- `app/e/messages/layout.tsx`

Requirements:
- conversation list shows title/avatar/unread/last-message preview/time
- direct-message preview shows other participant, not a raw group ID
- no `stream-chat-react` imports remain in message list layout

Deliverable:
- `/e/messages` list pane is fully custom and Marmot-backed

### Phase 6 — Replace single conversation page

Objective:
Replace Stream channel page with custom conversation page backed by generic chat hooks.

Modify:
- `app/e/messages/[id]/page.tsx`

Requirements:
- load conversation by ID using generic hooks
- render messages using repo UI primitives and mapped models
- use `components/ui/chat-input.tsx`
- support text send flow
- show loading/error/empty states cleanly
- no `stream-chat-react` imports remain

Important:
Do not bring over Stream-era pin/reaction/reply complexity unless it is already naturally supported and low cost.

Deliverable:
- one fully custom conversation page using Marmot-backed generic hooks

### Phase 7 — Replace new chat creation flow

Objective:
Replace backend Stream channel creation with Marmot direct-conversation creation.

Modify:
- `components/messages/new-chat-sheet.tsx`

Requirements:
- keep the existing user search UX as much as possible
- when selecting a user:
  1. resolve their Marmot/Nostr identity
  2. check if an existing 2-member direct conversation already exists
  3. if yes, open it
  4. if no, create a new 2-member Marmot group/invite flow
- navigate to `/e/messages/:conversationId`

If recipient discovery fails:
- show a clear user-facing error such as “This user has not enabled secure chat yet.”

Deliverable:
- direct conversation creation works without Stream backend APIs

### Phase 8 — Remove Stream backend/service usage

Objective:
Delete the obsolete Stream integration.

Remove or replace:
- `lib/providers/stream-chat-provider.tsx`
- `lib/services/stream-chat.ts`
- `lib/hooks/use-stream-chat.ts`
- `lib/hooks/use-message-actions.ts` if no longer needed or replace with generic equivalent
- `lib/utils/stream-chat-display.ts`
- `app/e/messages/stream-chat.d.ts`
- `stream-chat` package usage
- `stream-chat-react` package usage
- `NEXT_PUBLIC_STREAM_CHAT_API_KEY` references in env/constants/docs

Deliverable:
- no dead Stream chat infrastructure remains

### Phase 9 — Rewrite tests around the new domain

Objective:
Replace Stream-centric tests with generic chat + Marmot adapter tests.

Minimum required tests:
1. generic chat provider initializes cleanly
2. chat identity readiness flow behaves correctly
3. conversations list hook returns mapped summaries
4. direct conversation creation reuses existing DM if present
5. send-message flow updates UI and runtime state
6. `/e/messages` route renders without Stream dependencies

Also add manual QA notes for:
- login
- identity setup
- key package publish
- direct chat creation
- send/receive text
- refresh persistence

Deliverable:
- test suite no longer asserts Stream-specific behavior for the migrated path

## Implementation Standards

- Prefer small, reviewable commits per phase.
- Avoid giant multi-concern files.
- Keep browser-only code behind clear client-only boundaries.
- Keep route components thin; put runtime logic in hooks/adapters.
- Reuse existing Evento UI components where possible.
- Do not overbuild abstractions beyond what is needed for this migration.

## Acceptance Criteria

The migration is successful when all of these are true:

1. `/e/messages` works without Stream provider or Stream React components.
2. A logged-in user can become Marmot-ready from the client.
3. A direct conversation can be created/opened with a chat-ready user.
4. Text messages can be sent and received in the browser.
5. Conversation state survives refresh.
6. The app does not SSR-crash from browser-only Marmot code.
7. Stream dependencies are removed from the migrated path.
8. The implementation is organized around a generic chat domain, not route-level hacks.

## Final Output Requirements

When you finish, provide:
1. a concise architecture summary
2. a phase-by-phase summary of what changed
3. a file-by-file change list
4. any unresolved recipient discovery limitations
5. a known-issues section
6. a manual QA checklist

## Start Here

First, summarize the current Stream integration points and propose the exact Phase 1 file changes before writing code.
