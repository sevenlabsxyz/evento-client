# Learnings

## 2026-02-14 Task: Initial Analysis

- Zap flow uses step-based architecture with `SheetWithDetentFull` (NOT MasterScrollableSheet)
- Step type union: `'amount' | 'custom' | 'confirm' | 'sending' | 'success' | 'no-wallet'`
- ZapSheet receives `recipientLightningAddress` as string prop
- Two failure paths exist: empty address (line 70) and LNURL parse failure (line 98-108)
- LNURL parse failure currently closes sheet + shows toast — this is the bug to fix
- `RecipientInfo` object already constructed at line 59 but NOT passed to `ZapNoWalletStep`
- No Trigger.dev infrastructure exists in this client repo — zero files, zero deps
- Backend is accessed via catch-all proxy at `app/api/[...path]/route.ts`
- Mutation pattern reference: `lib/hooks/use-contact-host.ts` (simple POST mutation)
- Confirm step pattern reference: `components/zap/steps/zap-confirm-step.tsx` (receives RecipientInfo)

## 2026-02-14 Task: Route Invalid Input to No-Wallet Step

- Modified `components/zap/zap-sheet.tsx` lines 98-108 (LNURL parse error handler)
- Restructured error handling to check error type BEFORE closing sheet:
    - SDK not connected → close sheet + show unlock toast (sender problem)
    - Invalid input → route to `no-wallet` step (recipient problem)
    - Generic error → close sheet + show error toast
- Removed `setOpen(false)` from top of catch block (line 99)
- Moved `setOpen(false)` into SDK-not-connected and generic error branches only
- Invalid input branch now calls `setStep('no-wallet')` instead of closing sheet
- No new type errors introduced (verified with `pnpm tsc`)
- Pre-existing LSP error in file: `@/lib/utils/logger` module not found (unrelated to changes)

## 2026-02-14 Task: Server-Side Wallet Invite Notification Infrastructure

- Installed `@trigger.dev/sdk@4.3.3`, `resend@6.9.2`, `@react-email/components@1.0.7`
- Trigger.dev v3 SDK requires `maxDuration` in `defineConfig()` — it's a required field in `TriggerConfig`
- The `tasks.trigger<typeof taskRef>()` pattern is how you trigger tasks from Next.js route handlers
- React Email `PreviewProps` is a convention for the email preview tool, NOT a valid React FC property — don't assign it
- API route at `app/api/v1/wallet/notify/route.ts` is standalone (not proxied through catch-all)
- Route fetches sender identity via `GET /v1/user` and recipient via `GET /v1/users/username/:username` from backend
- In-memory `Map` used for 24h dedupe — sufficient for single-instance, would need Redis for multi-instance
- Trigger task sends 2 emails sequentially: recipient invite first, then sender confirmation
- Resend SDK returns `{ data, error }` — must check error before proceeding
- Environment variables needed: `TRIGGER_SECRET_KEY`, `RESEND_API_KEY`, `EMAIL_FROM_ADDRESS`, `NEXT_PUBLIC_APP_URL`
- Pre-existing `pnpm tsc` failures (7 errors) in unrelated files — none in new files

## 2026-02-14 Task: Expand ZapNoWalletStep with Notify Buttons

- Extended `ZapNoWalletStepProps` with: `onNotify`, `recipient`, `isNotifying`, `notifySuccess`, `alreadyNotified`
- Heading uses `recipient.name` when available: `"{name} hasn't set up their wallet"`, fallback `"Wallet Not Set Up"`
- Two buttons in vertical stack: primary "Let them know" + ghost "Close"
- Notify button has 4 states: default → loading (Loader2 spinner + "Sending...") → success (Check icon + "Notified" + emerald bg) → already notified ("Already Notified", disabled)
- `onNotify` is optional — button disabled when undefined (wiring happens in Task 4)
- Used `Loader2` and `Check` from lucide-react (already available, no new deps)
- Kept existing layout structure: `p-12`, centered flex column, gray Zap icon circle
- No new TypeScript errors introduced (verified with `pnpm tsc`)

## 2026-02-14 Task: Create useNotifyWalletInvite Mutation Hook

- Created `lib/hooks/use-notify-wallet-invite.ts` following `use-contact-host.ts` pattern
- Hook exports `useNotifyWalletInvite()` returning TanStack Query mutation
- Mutation calls `POST /v1/wallet/notify` with `{ recipientUsername: string }`
- Response type: `{ success: boolean, status: 'sent' | 'already_notified' | 'error', message?: string }`
- Toast behavior:
    - `status === 'sent'` → toast.success("We've let them know!")
    - `status === 'already_notified'` → no toast (UI handles this state)
    - `!success` → throws error → onError → toast.error()
- Returns full response data so UI can check `status` for state mapping
- apiClient path is `/v1/wallet/notify` (base URL already includes `/api`)
- Toast utility imported from `@/lib/utils/toast` (sonner wrapper)
- No TypeScript errors in new file (verified with `pnpm tsc`)
- Pre-existing errors remain in unrelated files (7 total)
