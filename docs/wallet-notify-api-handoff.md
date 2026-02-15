# Wallet Notify API Handoff

This document is for the Evento API backend agent. It captures the client behavior already implemented, what was previously prototyped with Trigger.dev/email templates, and the backend API contract the client now expects.

## Current Client Behavior (Already Implemented)

### 1) No-wallet fallback routing in zap flow

- File: `components/zap/zap-sheet.tsx`
- Behavior:
    - If `recipientLightningAddress` is empty, zap opens directly in `no-wallet` step.
    - If LNURL parsing throws `invalid input`, zap now routes to `no-wallet` step (instead of closing sheet).
    - `SDK not connected` behavior remains unchanged (sender wallet unlock flow).

### 2) No-wallet UI with explicit notify action

- File: `components/zap/steps/zap-no-wallet-step.tsx`
- UI states for "Let them know":
    - default: `Let them know`
    - loading: `Sending...`
    - success: `Notified`
    - deduped: `Already Notified`
- Secondary action: `Close`

### 3) Client mutation hook that calls backend API

- File: `lib/hooks/use-notify-wallet-invite.ts`
- Request:
    - `POST /v1/wallet/notify`
    - body: `{ recipientUsername: string }`
- Response expected by client:
    - `{ success: boolean, status: 'sent' | 'already_notified' | 'error', message?: string }`
- Client-side behavior:
    - `status === 'sent'`: success toast "We've let them know!"
    - `status === 'already_notified'`: no toast, UI shows "Already Notified"
    - `success === false`: error toast

### 4) ZapSheet integration

- File: `components/zap/zap-sheet.tsx`
- `no-wallet` step receives:
    - `onNotify` -> triggers `useNotifyWalletInvite().mutate({ recipientUsername })`
    - `isNotifying` <- mutation `isPending`
    - `notifySuccess` <- mutation success + `status === 'sent'`
    - `alreadyNotified` <- mutation success + `status === 'already_notified'`
- Mutation state is reset when sheet closes.

---

## Important Update

We removed the client-side Trigger.dev/Resend/React Email implementation.

Removed from this repo:

- `app/api/v1/wallet/notify/route.ts`
- `trigger/send-wallet-invite.ts`
- `trigger.config.ts`
- `emails/wallet-invite-recipient.tsx`
- `emails/wallet-invite-sender.tsx`
- dependencies: `@trigger.dev/sdk`, `resend`, `@react-email/components`

The backend should now fully own email orchestration and delivery.

---

## Backend API Needed

## Endpoint

- Method: `POST`
- Path: `/v1/wallet/notify`
- Auth: cookie/session auth (sender inferred from authenticated user)

## Request Body

```json
{
    "recipientUsername": "john"
}
```

## Response Body (contract expected by current client)

```json
{
    "success": true,
    "status": "sent",
    "message": "Wallet invite notification sent"
}
```

Allowed `status` values:

- `sent`
- `already_notified`
- `error`

Recommended error shape:

```json
{
    "success": false,
    "status": "error",
    "message": "Reason"
}
```

---

## Business Rules Expected

1. Deduplication window: 24h per sender->recipient pair.
2. If deduped, return HTTP 200 with:
    - `success: true`
    - `status: 'already_notified'`
3. Do not expose recipient email in API response.
4. Sender identity should come from auth/session, not request body.

---

## Email Content That Was Prototyped (for backend implementation)

Two transactional emails are needed:

1. Recipient invite email

- Subject: `"{SenderName} wants to send you sats on Evento"`
- Core message:
    - Sender tried to zap recipient on Evento.
    - Recipient needs to set up/claim Evento Wallet to receive Lightning payments.
    - Include CTA to wallet setup.

2. Sender confirmation email

- Subject: `"We've notified {RecipientName} about Evento Wallet"`
- Core message:
    - Recipient has been notified.
    - Sender can zap once recipient sets up wallet.
    - Mention dedupe behavior (no repeated sends in next 24h).

Suggested CTA target:

- wallet setup page in app (backend can choose canonical URL)

---

## Client-side Verification Already Passing

- Hook and UI tests pass:
    - `__tests__/hooks/use-notify-wallet-invite.test.ts`
    - `__tests__/components/zap-no-wallet-step.test.tsx`
- Full suite currently passing in this client repo.

---

## Notes for Backend Agent

- Keep the response contract exactly as above to avoid client changes.
- If backend wants a different payload (e.g. `recipientUserId`), communicate that and we can update the hook quickly.
- If you need extra metadata from client (source surface: profile/comment/host), we can add optional fields in a follow-up.
