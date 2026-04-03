# Agent Prompt: Evento Stream Chat → Marmot Refactor

You are working in the `sevenlabsxyz/evento-client` Next.js repo.

Your mission: replace the current Stream Chat implementation with a client-side-only Marmot chat implementation, but do it in a streamlined, low-chaos way.

## Read this first

1. Read the repo-specific plan:
   - `docs or local copy`: `evento-marmot-chat-refactor-plan.md`
2. Read the Marmot reference material:
   - `https://github.com/marmot-protocol/marmot`
   - `https://github.com/marmot-protocol/marmot-ts`
   - `https://github.com/marmot-protocol/marmots-web-chat`

## Constraints

- This is a Next.js app-router TypeScript app.
- Keep `/e/messages` as the user-facing route surface if possible.
- Do NOT do a giant blind rewrite.
- Do NOT keep route components tightly coupled to Stream-specific or Marmot-specific types.
- Messaging runtime must be browser/client-side only.
- Avoid SSR breakage from IndexedDB, wasm, relay pool, signer logic, or other browser-only imports.
- Preserve the current app shell and overall UX flow where reasonable.

## What exists today

Current Stream Chat pieces include:
- `lib/providers/stream-chat-provider.tsx`
- `lib/services/stream-chat.ts`
- `lib/hooks/use-stream-chat.ts`
- `lib/hooks/use-message-actions.ts`
- `app/e/layout.tsx`
- `app/e/messages/layout.tsx`
- `app/e/messages/[id]/page.tsx`
- `components/messages/new-chat-sheet.tsx`

Current app identity is Evento auth, not Nostr identity.
Current profile data includes optional `nip05`, but Marmot really needs a usable Nostr pubkey / identity path.

## Required architecture approach

Do this in layers.

### Layer 1: Generic chat domain
Create a generic chat abstraction so route components stop depending on Stream-specific types.

Suggested files:
- `lib/chat/types.ts`
- `lib/chat/provider.tsx`
- `lib/chat/hooks/use-chat-client.ts`
- `lib/chat/hooks/use-conversations.ts`
- `lib/chat/hooks/use-conversation.ts`
- `lib/chat/hooks/use-conversation-messages.ts`
- `lib/chat/hooks/use-send-message.ts`
- `lib/chat/hooks/use-chat-identity.ts`
- `lib/chat/hooks/use-chat-invites.ts`

The `/e/messages` pages/components should consume these generic hooks/models.

### Layer 2: Marmot adapter/runtime
Implement Marmot behind the chat abstraction.

Suggested files:
- `lib/chat/adapters/marmot/settings.ts`
- `lib/chat/adapters/marmot/nostr.ts`
- `lib/chat/adapters/marmot/account-database.ts`
- `lib/chat/adapters/marmot/client.ts`
- `lib/chat/adapters/marmot/runtime.ts`
- `lib/chat/adapters/marmot/group-subscription-manager.ts`
- `lib/chat/adapters/marmot/discovery.ts`
- `lib/chat/adapters/marmot/mapping.ts`

### Layer 3: UI migration
Refactor these routes/components to consume the generic chat layer:
- `app/e/layout.tsx`
- `app/e/messages/layout.tsx`
- `app/e/messages/[id]/page.tsx`
- `components/messages/new-chat-sheet.tsx`

## Product/identity requirements

You must explicitly address how Evento users map to Marmot/Nostr identities.

Recommended practical approach:
- keep Evento auth as app auth
- create a browser-local Marmot identity per logged-in user for MVP
- expose or persist a discoverable public key path for recipient lookup
- if possible, support an explicit `nostr_pubkey` field in profile data
- if backend changes are unavailable, temporarily resolve `nip05` to pubkey client-side

You must not assume `nip05` alone is sufficient without handling pubkey resolution.

## MVP scope

First working version must support only:
- user enters `/e/messages`
- user can initialize chat identity if needed
- user can publish/create key package if needed
- list known conversations
- create/open a direct conversation with another Evento user
- send and receive text messages
- persist local state across refresh

Defer unless easy:
- reactions
- pinning
- unread parity with Stream
- attachments/media
- replies/threads
- moderation actions

## Preserve where possible

Keep and reuse if practical:
- `components/ui/chat-input.tsx`
- `components/ui/message.tsx`
- top bar store patterns
- existing app shell
- existing user search UX in `new-chat-sheet`

## Remove eventually

Delete Stream-specific implementation once Marmot path works:
- `stream-chat`
- `stream-chat-react`
- `lib/providers/stream-chat-provider.tsx`
- `lib/services/stream-chat.ts`
- `lib/hooks/use-stream-chat.ts`
- `lib/utils/stream-chat-display.ts`
- `app/e/messages/stream-chat.d.ts`
- `NEXT_PUBLIC_STREAM_CHAT_API_KEY` env usage

## Execution order

1. Inspect the current repo and confirm the Stream integration points.
2. Introduce the generic chat domain types/hooks.
3. Refactor `/e/messages` route components to depend on generic chat hooks, not Stream directly.
4. Implement the Marmot adapter/runtime.
5. Implement identity/discovery gating.
6. Replace conversation list.
7. Replace single conversation page.
8. Replace new-chat flow.
9. Remove Stream dependencies.
10. Update tests.

## Deliverables

At the end, provide:
1. a short architecture summary
2. a file-by-file change list
3. any unresolved identity/discovery constraints
4. a known-issues list
5. a manual QA checklist

## Quality bar

- No SSR/client-boundary crashes
- No browser-only imports leaking into server components
- No direct Stream imports left in `/e/messages` route components
- Clean TypeScript types
- Minimal unnecessary churn
- Preserve UX where possible
- Favor a thin, maintainable adapter instead of giant one-off page logic

## Output expectation

Start by summarizing the current architecture and propose the exact first code changes before you implement.
