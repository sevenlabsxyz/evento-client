# Marmot Chat API Needs

This file documents what the current `evento-client` implementation actually assumes from
`evento-api` for Marmot-based direct messages.

It is intentionally narrower than the long-term product design. The goal here is to list what
will block the current client build from working, not every future backend enhancement.

## Hard Requirements

### 1. Current User Payload

`GET /v1/user` must continue returning the authenticated Evento user.

Required fields for chat bootstrap:

- `id`
- `username`
- `name`
- `image`
- `verification_status`

Optional but preferred:

- `nip05`
- `nostr_pubkey`

Notes:

- The current chat runtime generates and stores the private key locally.
- The client does not need `nostr_pubkey` from `GET /v1/user` in order to create the local
  identity, but returning it keeps the app's user model complete and consistent.

### 2. User Details Lookup By Evento User ID

`GET /v1/user/details?id=<userId>` must resolve an Evento user into a chat-capable user record.

Required fields:

- `id`
- `username`
- `name`
- `image`
- `verification_status`
- `nostr_pubkey`

Optional but preferred:

- `nip05`

This is the critical lookup used when:

- starting a DM from search results
- starting a DM from host cards
- starting a DM from followers/following sheets
- starting a DM from any other Evento user entry point that only has a user id

If `nostr_pubkey` is absent, the client treats that target user as not ready for secure chat.

### 3. User Details Lookup By Nostr Public Key

`GET /v1/user/details?nostr_pubkey=<hexPubkey>` must resolve an incoming Marmot/Nostr pubkey back
to an Evento user.

Required fields:

- `id`
- `username`
- `name`
- `image`
- `verification_status`

Optional but preferred:

- `nip05`
- `nostr_pubkey`

This lookup is needed when:

- an invite arrives from another Marmot user
- a message sender pubkey needs to be rendered as an Evento profile/avatar/name

Behavior requirement:

- if no Evento user matches the pubkey, returning `404` is acceptable
- returning an empty/null payload is also acceptable
- the client already tolerates unmapped pubkeys by falling back to a placeholder label

### 4. Current User Update

`PATCH /v1/user` must accept:

- `nostr_pubkey`

This mutation is used after first-run onboarding so the generated local messaging identity becomes
discoverable to other Evento users.

Behavior requirement:

- updating the same `nostr_pubkey` more than once should be safe/idempotent

## Important But Not Strictly Required For v1

The intended Evento identity model is still:

- `nip05 = username@evento.cash`

The current client does not require the API to set or mutate `nip05` as part of this first pass,
but we should still make sure profile responses expose it where available.

The following endpoints do not block the current DM flow from working, because the client can
re-fetch `GET /v1/user/details?id=...` before opening chat:

- `GET /v1/user/search`
- `GET /v1/user/followers/list`
- `GET /v1/user/follows/list`
- event host payloads

For those endpoints, the only hard requirement is that they continue to return a stable Evento user
`id` plus enough UI fields to render the list row.

Still preferred on those surfaces:

- `nostr_pubkey`
- `nip05`

## Relay Model Used By Client

For this first client pass, relays are fixed in the app instead of coming from the API:

- `wss://relay.damus.io`
- `wss://nos.lol`
- `wss://relay.primal.net`
- `wss://nostr.wine`
- `wss://relay.snort.social`

That means the API does **not** currently need to provide per-user relay lists for the client to function.

## What The Client Does On Its Own

The client now does all of this locally:

- generate a hidden Nostr/Marmot identity
- persist local Marmot state
- publish key packages to the fixed relay set
- discover recipient key packages from the fixed relay set
- create Marmot groups for direct messages
- subscribe to live group events
- ingest invites and join groups automatically

## Not In Scope For This Pass

The current client implementation does **not** depend on backend work for:

- multi-device chat leases
- encrypted backup/export/import
- event group chat
- push notifications
- Stream history migration

## Notes

- `GET /v1/user`, `GET /v1/user/details`, and `GET /v1/user/search` may return either a raw
  payload or the usual `{ success, message, data }` wrapper. The current client handles both.
- If a Marmot invite arrives for a pubkey that the API cannot map back to an Evento user, the
  client falls back to a placeholder participant label based on the pubkey.
