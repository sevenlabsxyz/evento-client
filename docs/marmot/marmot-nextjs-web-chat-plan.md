# Marmot Reference Web Chat → Next.js Integration Plan

> For the implementation agent: treat this as a practical migration/copy plan, not a theory doc. The goal is to extract the minimum viable architecture from the official `marmot-protocol/marmots-web-chat` reference app and rebuild it cleanly inside an existing Next.js web client without blindly cargo-culting Vite-era assumptions.

## Goal

Embed Marmot-powered secure group chat into an existing Next.js React application by porting the reference web chat’s core architecture:
- Nostr identity + relay connectivity
- Marmot client bootstrap
- local persistent crypto/group storage
- invite ingestion
- live group subscriptions
- group chat UI primitives
- optional media support

This plan is written for a separate autonomous coding agent that may have zero context on Marmot, the official reference app, or the target codebase.

## Executive Summary

The official reference app proves that Marmot can work in a browser, but it is built as a Vite SPA using React Router, RxJS-heavy singletons, IndexedDB/localforage persistence, Applesauce Nostr libraries, and `@internet-privacy/marmot-ts`.

A good Next.js integration should NOT try to port the whole app 1:1.

Instead:
1. Treat the reference app as an architecture/source-pattern repository.
2. Extract its runtime modules into a `src/lib/marmot/` domain.
3. Convert router/page concepts into Next.js app-router segments and client components.
4. Keep all secure messaging state on the client side only.
5. Avoid SSR for live Marmot state, relay connections, signing, and local crypto persistence.
6. Prefer a staged integration: bootstrap → auth/account → relays/storage → groups/invites → messages → media → polish.

## Source Repositories and What to Copy From

Primary protocol and implementation sources:

- Protocol/spec:
  - `https://github.com/marmot-protocol/marmot`
- TypeScript Marmot library:
  - `https://github.com/marmot-protocol/marmot-ts`
- Reference web chat:
  - `https://github.com/marmot-protocol/marmots-web-chat`
- Underlying TS MLS implementation:
  - `https://github.com/marmot-protocol/mls-ts`

Important reference-app files to study first:

- `src/lib/marmot-client.ts`
- `src/lib/nostr.ts`
- `src/lib/accounts.ts`
- `src/lib/account-database.ts`
- `src/lib/settings.ts`
- `src/lib/runtime.ts`
- `src/lib/group-subscription-manager.ts`
- `src/contexts/group-context.ts`
- `src/contexts/group-event-store-context.ts`
- `src/pages/groups/...`
- `src/pages/invites/...`
- `src/pages/key-packages/...`
- `src/hooks/use-decrypt-attachment.ts`
- `src/hooks/use-media-upload.ts`

## What the Reference App Actually Uses

From the reference app’s package manifest and code, the core moving parts are:

- React 19
- TypeScript
- Vite
- React Router
- RxJS
- `@internet-privacy/marmot-ts`
- `ts-mls`
- Applesauce libraries:
  - `applesauce-core`
  - `applesauce-relay`
  - `applesauce-react`
  - `applesauce-accounts`
  - `applesauce-signers`
  - `applesauce-loaders`
  - `applesauce-common`
  - `applesauce-actions`
- `localforage`
- `idb`
- `nostr-wasm`
- `blossom-client-sdk`

That means the actual browser architecture is:

1. browser-only signer/account system
2. browser-only relay pool and event verification
3. browser-only IndexedDB/localforage persistence
4. browser-only Marmot client creation
5. background subscription manager driven by auth/account state
6. route-level UI on top of those long-lived client singletons

## Hard Truths / Non-Negotiable Constraints

### 1. This is client-side software

Do NOT attempt to run these pieces on the Next.js server:
- relay websocket pool
- Nostr extension / bunker / local key signers
- IndexedDB/localforage
- Marmot group state persistence
- active group subscription manager
- live decryption pipeline

These belong in client components or client-only modules.

### 2. Next.js should be the shell, not the cryptographic brain

Use Next.js for:
- route organization
- layouts
- static assets
- app-level composition
- optional server APIs unrelated to E2EE core

Use client-side React/Marmot modules for:
- account sign-in
- relay I/O
- group state
- invite handling
- message sending/receiving

### 3. Do not copy the entire UI before proving the runtime

The runtime/integration layer is the hard part. UI is secondary.

Order of importance:
1. account + signer
2. relay pool + verification
3. persistence
4. Marmot client bootstrap
5. subscriptions + invites
6. group message send/receive
7. polished UI
8. media/webxdc/tools extras

### 4. Treat the TS ecosystem as experimental

The official Marmot TS libraries explicitly warn they are alpha / not production-mature.

The implementation agent should preserve this warning in the target repo docs and avoid overpromising security guarantees.

## Recommended Integration Strategy

Use a “thin adaptation, not brute-force migration” strategy.

### Strategy Overview

Build a dedicated Marmot domain inside the Next.js app:

- `src/lib/marmot/` for runtime and state infrastructure
- `src/components/marmot/` for feature UI
- `src/app/(authenticated)/marmot/...` for route segments
- `src/providers/marmot-provider.tsx` for client-only bootstrapping

Do not initially copy every page from the reference app.

Instead, implement these milestones:

1. Sign in / account bootstrap
2. Relay configuration + verification
3. Key package existence / creation
4. Invite inbox
5. Group list
6. Group detail view
7. Send/receive text messages
8. Member management
9. Optional media

## Mapping Vite SPA Concepts to Next.js

### Reference app → Next.js mapping

- `src/main.tsx` → `app/layout.tsx` + client-only provider tree
- React Router pages → Next.js `app/.../page.tsx`
- global singleton side effects from `src/lib/runtime.ts` → a client-only provider or boot component mounted once near app root
- `BrowserRouter` nested routes → app router segment nesting
- `import.meta.env.*` → `process.env.NEXT_PUBLIC_*`
- Vite-only bootstrap assumptions → explicit `"use client"` boundaries

### Example target route structure

```text
src/app/
  layout.tsx
  (app)/
    marmot/
      page.tsx                 # landing / groups list
      invites/
        page.tsx
      key-packages/
        page.tsx
      groups/
        page.tsx
        [groupId]/
          page.tsx             # chat tab default
          members/
            page.tsx
          admin/
            page.tsx
          media/
            page.tsx
      settings/
        page.tsx
      signin/
        page.tsx
```

## Proposed Target File Structure

This is the recommended landing zone for the integration.

```text
src/
  app/
    layout.tsx
    (app)/
      marmot/
        layout.tsx
        page.tsx
        invites/page.tsx
        key-packages/page.tsx
        groups/page.tsx
        groups/[groupId]/page.tsx
        groups/[groupId]/members/page.tsx
        groups/[groupId]/admin/page.tsx
        settings/page.tsx
        signin/page.tsx
  components/
    marmot/
      marmot-shell.tsx
      group-list.tsx
      group-chat.tsx
      group-message-list.tsx
      group-message-input.tsx
      invite-list.tsx
      key-package-status.tsx
      sign-in-options.tsx
      relay-status.tsx
      member-list.tsx
  contexts/
    marmot/
      marmot-client-context.tsx
      group-context.tsx
      group-event-store-context.tsx
  hooks/
    marmot/
      use-marmot-client.ts
      use-live-groups.ts
      use-live-invites.ts
      use-live-key-packages.ts
      use-group.ts
      use-group-messages.ts
      use-send-message.ts
      use-media-upload.ts
      use-decrypt-attachment.ts
  lib/
    marmot/
      nostr.ts
      accounts.ts
      settings.ts
      account-database.ts
      marmot-client.ts
      runtime.ts
      group-subscription-manager.ts
      blossom.ts
      utils.ts
      time.ts
  providers/
    marmot-provider.tsx
```

## Core Architecture to Port

The implementation agent should copy architecture, not exact file contents.

### A. `nostr.ts` runtime module

Reference responsibilities:
- initialize `nostr-wasm`
- create in-memory event store
- verify events before store insertion
- create relay pool
- create event loader bound to relay pool + event store

Target outcome in Next.js:
- client-only module exporting:
  - `eventStore`
  - `pool`
  - `eventLoader`
- lazy-safe initialization guarded so it never runs during SSR

Critical note:
- this file must be imported only from client-only code paths or wrapped by a lazy singleton initializer

### B. `accounts.ts` runtime module

Reference responsibilities:
- create account manager
- register account types
- support Nostr Connect signer integration
- persist accounts to localStorage
- persist active account ID
- expose active user observable
- expose generic publish method
- expose event factory/actions

Target outcome in Next.js:
- client-side account/session manager for Marmot/Nostr
- persistence in localStorage or existing app storage abstraction
- explicit support for whatever signer modes the target app wants:
  - browser extension signer
  - bunker/Nostr Connect signer
  - raw key import
  - generated keypair

Recommendation:
- do not over-support all modes on day one
- start with the signer modes the target app already uses or can safely support

### C. `settings.ts`

Reference responsibilities:
- persist lookup relays
- persist extra relays
- persist blossom servers
- persist feature toggles
- expose RxJS `BehaviorSubject`s

Target outcome in Next.js:
- client-only persisted settings store
- can be RxJS, Zustand, Jotai, or a thin custom wrapper
- if the target app already uses Zustand/Jotai/Redux, strongly consider adapting here instead of importing RxJS everywhere

Important decision:
- if the team is already comfortable with RxJS, keep it for minimal diff from reference
- if not, isolate RxJS inside `lib/marmot/*` and expose React hooks on top so the rest of the app stays idiomatic

### D. `account-database.ts`

Reference responsibilities:
- IndexedDB-backed rumor history
- localforage storage for group state and key packages
- per-account storage partitioning
- media storage backend
- invite store

This is one of the most important files in the whole app.

Target outcome in Next.js:
- one browser persistence layer that provides, per account:
  - group state backend
  - key package store
  - rumor history backend
  - invite store
  - media backend/factory

Implementation guidance:
- preserve per-account namespacing in storage keys/database names
- do not allow one account’s group state to leak into another
- document exact storage names and migration strategy

### E. `marmot-client.ts`

Reference responsibilities:
- adapt relay pool into `NostrNetworkInterface`
- create `MarmotClient` from active account and storage interfaces
- create `InviteReader`
- expose live group streams, invite streams, key package streams

Target outcome in Next.js:
- a single client-side composition module that is the “source of truth” for Marmot runtime state
- React hooks should sit on top of it; page components should not reimplement network or storage wiring

### F. `runtime.ts` + `group-subscription-manager.ts`

Reference responsibilities:
- start/stop background managers based on auth/client availability
- maintain active subscriptions for groups
- keep ingest loops alive

Target outcome in Next.js:
- a provider-mounted boot component that starts the group runtime once an active account + Marmot client exist
- ensures live events continue to flow across route changes

This is critical: if the coding agent only ports UI and skips the runtime manager, the chat will look fine but feel dead.

## Implementation Phases

## Phase 0 — Discovery in the target codebase

Before touching code, the implementation agent must inspect:
- whether the app uses app router or pages router
- whether it already has auth/session/account abstractions
- whether it already has a Nostr stack
- whether it already has client-only provider patterns
- whether it already uses Zustand/Jotai/RxJS/Redux
- whether there is an existing IndexedDB wrapper
- whether there is a design system to reuse

Deliverable:
- one short note explaining what will be reused vs introduced

Questions to answer before coding:
1. Do we already have a Nostr signer abstraction?
2. Do we already have relay pool infrastructure?
3. What browser storage abstraction already exists?
4. Is there already a “chat shell” route area?
5. Should Marmot be embedded as a new feature inside existing messaging, or as a standalone route tree?

## Phase 1 — Dependency and environment setup

Add the minimum viable dependencies needed for runtime parity.

Expected packages to evaluate/install:
- `@internet-privacy/marmot-ts`
- `ts-mls`
- `applesauce-core`
- `applesauce-relay`
- `applesauce-loaders`
- `applesauce-accounts`
- `applesauce-signers`
- `applesauce-common`
- `applesauce-actions`
- `applesauce-react` (only if actually needed)
- `localforage`
- `idb`
- `nostr-wasm`
- `rxjs`
- `blossom-client-sdk` (if media will be supported in initial pass)

Also decide if these are needed immediately or later:
- QR libraries
- reactions
- webxdc
- fancy analytics or graph views

Recommendation:
- skip optional UI dependencies in first pass
- focus on runtime and text messaging first

Verification criteria:
- clean install
- client build succeeds in Next.js
- no server-side import crashes from browser-only packages

## Phase 2 — Create client-only bootstrap boundaries

Create a client-only provider stack for Marmot.

Likely files:
- `src/providers/marmot-provider.tsx`
- `src/components/marmot/marmot-shell.tsx`

Responsibilities:
- ensure runtime modules initialize only in browser
- mount boot logic once
- expose context/hooks to route children

Pattern:
- top-level Next.js layout remains mostly server-safe
- Marmot subtree layout mounts a `"use client"` provider
- all messaging pages render under that subtree

Verification criteria:
- visiting non-Marmot routes never imports browser-only Marmot runtime
- visiting Marmot routes initializes without SSR errors

## Phase 3 — Port `nostr.ts`

Create `src/lib/marmot/nostr.ts`.

Must implement:
- `nostr-wasm` init
- event store
- relay pool
- event verification hook
- event loader

Potential Next.js caveats:
- dynamic/lazy import may be needed for wasm init
- must not run during server render
- ensure a single instance across HMR where possible

Verification criteria:
- relay pool can connect from client
- event verification works
- no duplicate initialization leaks during route transitions

## Phase 4 — Port account/signer infrastructure

Create `src/lib/marmot/accounts.ts`.

Choose initial signer scope:
- Option A: extension signer only
- Option B: extension + raw secret key import
- Option C: extension + bunker/Nostr Connect

Recommendation for MVP:
- support the minimal set already natural to the host app
- if the host app already has Nostr auth, adapt that abstraction instead of creating competing account systems

Must preserve:
- active account concept
- local persistence of account metadata
- clean switch-account semantics
- `publish()` abstraction

Verification criteria:
- sign in with chosen signer mode
- persisted active account reloads correctly
- can sign and publish a simple event

## Phase 5 — Port settings/persisted relay config

Create `src/lib/marmot/settings.ts`.

Include:
- lookup relays
- extra relays
- manual relays if desired
- blossom servers if media planned
- auto-create key package flag

Recommendation:
- keep relay settings extremely simple in MVP
- ship with sane defaults from reference app, then add settings UI later

Verification criteria:
- settings persist across refreshes
- relay configuration updates feed into runtime

## Phase 6 — Port per-account database/storage layer

Create `src/lib/marmot/account-database.ts`.

This is the deepest port.

Minimum interfaces to expose per account:
- `groupStateBackend`
- `keyPackageStore`
- `inviteStore`
- `historyFactory`
- `mediaFactory` if media included

Required behaviors:
- per-account storage isolation
- correct binary data handling (`Uint8Array` vs `ArrayBuffer` normalization)
- deterministic DB/store naming
- future migration path

Do not compromise here. Bugs in this layer can corrupt local cryptographic state.

Verification criteria:
- create account A and account B
- generate/use separate key packages and groups
- confirm no storage overlap
- refresh browser and confirm state rehydrates

## Phase 7 — Port `marmot-client.ts`

Create `src/lib/marmot/marmot-client.ts`.

Implement:
- adapter from relay pool to `NostrNetworkInterface`
- `getUserInboxRelays(pubkey)` lookup flow
- `MarmotClient` construction using active account + storage interfaces
- `InviteReader` construction
- live streams for groups, invites, key packages

Recommendation:
- this module should be the only place where `new MarmotClient(...)` happens
- page components should consume hooks, not instantiate clients

Verification criteria:
- client initializes only when account exists
- live groups stream works
- live invites stream works
- key package watch works

## Phase 8 — Port runtime/subscription manager

Create:
- `src/lib/marmot/runtime.ts`
- `src/lib/marmot/group-subscription-manager.ts`

Core behavior:
- when active account + Marmot client appear, start background group subscriptions
- when account logs out or switches, stop old subscriptions cleanly
- preserve updates across route changes

This is what makes the app act like a messenger instead of a static inspector.

Verification criteria:
- group receives live messages even if route was already open
- route transitions do not kill subscriptions
- account switch tears down old listeners

## Phase 9 — Build thin React hooks on top of runtime

Create hooks such as:
- `useMarmotClient()`
- `useLiveGroups()`
- `useLiveInvites()`
- `useLiveKeyPackages()`
- `useGroup(groupId)`
- `useGroupMessages(groupId)`
- `useSendMessage(groupId)`

Recommendation:
- shield the rest of the app from RxJS details
- return idiomatic React state from hooks
- if needed, use `useSyncExternalStore` or bridge observables with small wrappers

Verification criteria:
- route components are simple and declarative
- no repeated subscription boilerplate in pages

## Phase 10 — Build MVP UI in Next.js

Start with the minimum vertical slice.

### MVP pages
1. `signin`
2. `groups index`
3. `group detail/chat`
4. `invites`
5. `key package status`
6. minimal `settings`

### MVP UI components
- account/sign-in card
- group list
- invite list
- key package empty-state CTA
- chat transcript
- message composer
- relay status indicator

Do not initially port every sidebar/tool/analytics/admin screen unless the product requires it.

Verification criteria:
- user can sign in
- user can see or create key package
- user can accept invite / discover group
- user can open group and send/receive a message

## Phase 11 — Port group/member/admin flows

After text chat works:
- member list
- add/remove member actions
- admin screens
- group metadata editing
- group tree/timeline views if they matter

Recommendation:
- keep admin actions behind clear confirmation UX
- record which Marmot operations are destructive or state-mutating

Verification criteria:
- add member flow works end-to-end
- removals update local state and UI
- group metadata reflects current epoch/state

## Phase 12 — Port optional media support

Only after plain text messaging is stable.

Relevant reference pieces:
- `blossom.ts`
- `use-media-upload.ts`
- `use-decrypt-attachment.ts`
- media UI components

Requirements:
- encrypted upload to Blossom-like storage
- decryption on client
- storage of encrypted blobs and metadata
- clear UX for failed decrypt/upload

Verification criteria:
- upload image/file
- another client can receive and decrypt
- blob server cannot read plaintext contents

## Phase 13 — Polish, observability, and docs

Add:
- runtime debug logging gates
- error boundaries around Marmot routes
- loading skeletons
- offline/relay failure states
- docs warning that TS Marmot ecosystem is alpha

## Concrete “Copy vs Adapt” Guidance

## Safe to copy nearly directly

These ideas/patterns are safe to port with light edits:
- the `NostrNetworkInterface` adapter concept
- event store + relay pool separation
- account-persisted active-client creation
- per-account database partitioning
- runtime start/stop manager pattern
- invite reader wiring
- key package watch wiring

## Should be adapted, not copied verbatim

- route structure (React Router → Next app router)
- context placement
- styling system
- account sign-in UX
- settings UX
- any Vite environment assumptions
- any `window.*` DEV debugging helpers
- any global side effects that assume a SPA bootstrap file

## Probably defer unless product specifically needs it

- tools pages
- graph/tree analytics pages
- reactions
- webxdc support
- transcription helpers
- fancy QR onboarding
- broad multi-account UX

## What the Implementation Agent Should Read First

Read in this order:

1. `marmot-protocol/marmot` README and threat model
2. `marmot-protocol/marmot-ts` README + getting-started docs
3. reference `src/lib/marmot-client.ts`
4. reference `src/lib/account-database.ts`
5. reference `src/lib/nostr.ts`
6. reference `src/lib/accounts.ts`
7. reference `src/lib/runtime.ts`
8. reference group/invite pages and hooks

The main risk is not understanding storage and runtime lifecycle.

## Acceptance Criteria for the First Successful Port

A first-pass integration is successful only if all of the following are true:

1. The Marmot subtree loads in a Next.js app with no SSR/runtime crashes.
2. A user can authenticate with a supported signer.
3. Relay connections initialize in the browser.
4. A `MarmotClient` instance is created from active account + persistent storage.
5. Key package presence can be detected; key package can be created if missing.
6. Invites can be read and displayed.
7. Groups can be listed.
8. A group detail page can load message history.
9. New messages can be sent and received live.
10. Refreshing the page preserves local group/account state.
11. Switching accounts does not corrupt the previous account’s state.

## Testing Matrix

The implementation agent should not stop at “compiles.” Test the flows.

### Browser/runtime tests
- first load with no account
- sign in
- refresh page with persisted account
- logout / clear account
- switch active account

### Messaging tests
- create or join group
- send text message
- receive text message from another client
- history reload after refresh

### Storage tests
- key package persists
- group state persists
- invite state persists
- media state persists if enabled
- per-account separation verified

### Relay/network tests
- bad relay URL handling
- disconnected relay handling
- partial relay success
- inbox relay lookup failure

### Error-state tests
- signer unavailable
- wasm init failure
- IndexedDB unavailable/private mode edge cases
- malformed event handling
- decryption failure UI path

## Security Notes the Agent Must Preserve

The app must not claim perfect privacy.

Document clearly:
- content is E2EE via Marmot/MLS
- metadata still leaks at the network/relay layer
- browser clients have XSS/local-device risk
- relay operators can observe timing and IP correlation
- the TS Marmot stack is still alpha/experimental

Also make sure:
- no private keys are logged
- no decrypted message plaintext is logged in production
- no sensitive crypto material is exposed on `window`
- debug mode is opt-in

## Risks / Pitfalls

### 1. SSR explosions
Common cause: importing browser-only storage, signer, wasm, or relay code into server components.

Mitigation:
- strong `"use client"` boundaries
- lazy singleton creation
- no browser-only imports from server files

### 2. Duplicate singletons during HMR / route transitions
Mitigation:
- centralize runtime creation
- mount provider once under Marmot layout
- defensive guards in runtime bootstrap

### 3. Storage corruption or account cross-contamination
Mitigation:
- explicit per-account namespacing
- migration-safe naming
- binary normalization tests

### 4. UI built before subscriptions work
Mitigation:
- prove live group ingest with a minimal page before polishing anything

### 5. Over-copying optional complexity
Mitigation:
- stick to staged MVP scope
- postpone media, reactions, tools, webxdc, analytics

### 6. Host app architecture conflict
Mitigation:
- adapt reference runtime into host app patterns where sensible
- avoid introducing a parallel global state ecosystem unless necessary

## Suggested Task Breakdown for the Separate Agent

### Task 1 — Analyze target app architecture
Output:
- short note on app-router, auth, state, storage, and Nostr compatibility

### Task 2 — Add minimum Marmot runtime dependencies
Output:
- install/build green
- no browser package imported on server

### Task 3 — Create Marmot route subtree and client-only provider
Output:
- `/marmot` route renders safely

### Task 4 — Port `nostr.ts`
Output:
- relay/event runtime works in browser

### Task 5 — Port account/signer management
Output:
- user can authenticate with selected signer mode

### Task 6 — Port settings + relay persistence
Output:
- relay config persists

### Task 7 — Port per-account storage backend
Output:
- group/key/invite persistence works

### Task 8 — Port `marmot-client.ts`
Output:
- active Marmot client created and observable

### Task 9 — Port runtime subscription manager
Output:
- live background group ingestion works

### Task 10 — Implement key package status/create flow
Output:
- user can create or confirm key package availability

### Task 11 — Implement invites list/reader page
Output:
- gift-wrapped invite flow visible and actionable

### Task 12 — Implement groups list page
Output:
- user can see discovered/joined groups

### Task 13 — Implement group chat page
Output:
- load history and send/receive messages

### Task 14 — Add member/admin views
Output:
- basic group management works

### Task 15 — Add optional media support
Output:
- encrypted upload/decrypt works

### Task 16 — Documentation + warnings + cleanup
Output:
- README/developer docs explain architecture and caveats

## Opinionated Recommendations

### Recommendation 1: Keep Marmot isolated behind a feature boundary
Do not scatter Marmot code across the entire app. Give it its own subtree and provider layer.

### Recommendation 2: Wrap RxJS behind hooks unless the app already speaks RxJS
This makes the integration maintainable for normal React developers.

### Recommendation 3: Use the reference app for runtime fidelity, not UI fidelity
The UI can be re-skinned. The runtime architecture is what matters.

### Recommendation 4: Get text chat working before touching media
Media and extra features multiply failure modes.

### Recommendation 5: Preserve experimental-status messaging
Do not market the result as “Signal but decentralized and done.” That is not what the source ecosystem claims.

## Deliverables the Separate Agent Should Produce

At the end of implementation, the agent should provide:

1. A short architecture summary of what was ported
2. A file-by-file change list
3. Any deviations from the reference app and why
4. A setup note describing signer modes and relay defaults
5. A known-issues section
6. A manual QA checklist proving:
   - sign-in works
   - key packages work
   - invites work
   - groups list works
   - text messages work
   - persistence works

## If the Agent Has Time for a Better-Than-MVP Result

Nice upgrades after MVP:
- suspense/loading UX for bootstrapping
- optimistic message sending state
- better relay status UI
- account switcher UX
- import/export or reset of local Marmot state
- safer debug console tooling
- integration tests using mocked relay/network layer

## Final Recommendation

The best way to “copy the reference web chat stuff” is not to clone the whole repo into Next.js.

The correct move is to:
- port the reference runtime modules faithfully
- adapt them into client-only Next.js boundaries
- rebuild a thinner UI around the same primitives
- prove one end-to-end messaging slice before expanding scope

That gets you the benefits of the official architecture without dragging over every Vite-specific, SPA-specific, or experimental extra.

---

## Quick Start Brief for the Separate Agent

If you only read one section, read this:

1. Study `marmot-client.ts`, `account-database.ts`, `nostr.ts`, `accounts.ts`, and `runtime.ts` in the reference app.
2. Build a client-only `src/lib/marmot/` domain inside the Next.js app.
3. Mount a `MarmotProvider` under a `/marmot` route subtree.
4. Get active account + relay pool + IndexedDB + `MarmotClient` working first.
5. Then implement key packages, invites, groups, and chat in that order.
6. Only after text chat works, consider media/admin/tooling extras.

That is the shortest path to a sane, real integration.
