# Draft: Zap Missing Wallet Email Flow

## Requirements (confirmed)

- If sender taps zap and recipient has no Evento wallet/lightning address, show a fallback sheet instead of continuing zap flow.
- Fallback must use a MasterScrollableSheet pattern.
- Sheet includes two actions: close, and notify/email recipient.
- System should send an automated email invite to recipient to create/claim Evento wallet/lightning address.
- Two email templates are needed for this run (final distinctions pending confirmation).

## Technical Decisions

- Zap fallback should be unified in existing `ZapSheet` step flow rather than introducing a separate sheet flow outside zap.
- Preferred insertion: in `components/zap/zap-sheet.tsx`, treat LNURL parse "invalid input" as `no-wallet` step instead of closing sheet.
- Keep UX inside existing `components/zap/steps/zap-no-wallet-step.tsx` and expand to two-button design.
- Trigger.dev recommended integration: trigger task from server-side handler/action with idempotency key and retry policy.
- Suggested test strategy: tests-after (infrastructure exists and flow spans UI + async email trigger).

## Research Findings

- Zap entry points identified:
    - `app/[username]/page-client.tsx`
    - `app/e/profile/page.tsx`
    - `components/event-detail/event-host.tsx`
    - `components/ui/quick-profile-sheet.tsx`
    - `components/event-detail/comment-item.tsx`
- Current failure behavior:
    - Empty recipient address -> `no-wallet` step renders.
    - LNURL parse "invalid input" currently closes sheet and shows toast (gap for desired flow).
- Existing fallback UI exists at `components/zap/steps/zap-no-wallet-step.tsx` but currently only has one dismiss button and no invite trigger.
- Master sheet patterns exist widely, but zap flow currently uses a step-based custom sheet and should stay consistent with that architecture.
- Test infrastructure exists:
    - Jest + React Testing Library + MSW
    - `pnpm test`, `pnpm test:watch`, `pnpm test:ci`
    - CI runs lint/test/build/typecheck in `.github/workflows/ci.yml`
- Trigger.dev guidance captured:
    - define task under `/trigger`
    - trigger from server route/action
    - use idempotency key + TTL to avoid duplicate invites
    - configure retry/backoff and log failures

## Scope Boundaries

- INCLUDE: zap fallback UX, notify action, automated email workflow, email template work.
- EXCLUDE: broader wallet product redesign (unless explicitly requested).
- EXCLUDE (default): multi-channel notifications (push/SMS), only email for this run.

## Open Questions

- Confirm exact two-template split (who receives template #1 and #2).
- Confirm notify channel wording and sender identity copy in emails.
- Confirm dedup/rate-limit behavior for repeated notify taps.

## Test Strategy Decision

- **Infrastructure exists**: YES
- **Automated tests**: Pending user confirmation (recommended: YES, tests-after)
- **Agent-Executed QA**: Mandatory for all plan tasks
