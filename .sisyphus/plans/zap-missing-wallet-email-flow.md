# Zap Missing Wallet + Email Invite Flow

## TL;DR

> **Quick Summary**: Unify all "recipient has no wallet" zap failures into one in-sheet fallback experience, add a two-button action (close + let them know), and trigger a backend email workflow via Trigger.dev with sender confirmation + recipient invite templates.
>
> **Deliverables**:
>
> - Robust no-wallet fallback in zap flow (including LNURL invalid-input path)
> - Two-action fallback UI in zap step
> - New notify mutation from client to backend endpoint
> - Backend Trigger.dev task + 2 email templates + 24h dedupe
> - Tests-after coverage (unit/integration + QA scenarios)
>
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Task 1 -> Task 2 -> Task 3 -> Task 5 -> Task 6

---

## Context

### Original Request

If a sender taps zap for a recipient without an Evento wallet/lightning address, show a fallback sheet with two actions (close + notify). Notify should trigger automated email delivery so recipient can claim/create wallet. Two templates are required for this run.

### Interview Summary

**Key Discussions**:

- Keep fallback inside existing zap flow architecture (step-based `ZapSheet`), not a separate global sheet flow.
- Add two templates: sender confirmation + recipient invite.
- Use automated tests with **tests-after** strategy.
- Apply resend guardrail with **24h dedupe**.

**Research Findings**:

- Zap entry points: `app/[username]/page-client.tsx`, `app/e/profile/page.tsx`, `components/event-detail/event-host.tsx`, `components/ui/quick-profile-sheet.tsx`, `components/event-detail/comment-item.tsx`.
- Current gap: LNURL invalid-input path in `components/zap/zap-sheet.tsx` closes sheet + toast instead of falling back.
- Existing fallback step at `components/zap/steps/zap-no-wallet-step.tsx` has no notify action.
- Test infra exists: Jest + RTL + MSW + CI in `.github/workflows/ci.yml`.

### Metis Review

**Identified Gaps (addressed in this plan):**

- Entry-point inconsistency: plan converges all no-wallet detection paths into unified fallback state handling in `ZapSheet`.
- Missing dedupe behavior UX: plan defines UI behavior for already-notified state.
- Missing retry/error behavior on notify: plan defines loading, error, and retry UX.
- Missing scope guardrails: plan locks out unrelated refactors and unrelated zap implementations.

---

## Work Objectives

### Core Objective

Ensure every zap attempt to a recipient without a claimable lightning address reliably transitions to a clear fallback UX, lets sender notify recipient, and triggers an idempotent transactional email workflow.

### Concrete Deliverables

- Updated zap state transitions in `components/zap/zap-sheet.tsx`.
- Updated fallback UI in `components/zap/steps/zap-no-wallet-step.tsx` with two buttons.
- New client notify hook in `lib/hooks/` and wiring in zap flow.
- Backend/API contract for notify endpoint (proxy-compatible), Trigger.dev task, and two templates.
- Test coverage and QA evidence for happy + failure paths.

### Definition of Done

- [ ] Zap invalid-input/empty-address paths both render no-wallet fallback.
- [ ] Fallback shows `Close` and `Let them know` actions with deterministic states.
- [ ] Notify action triggers backend endpoint exactly once per sender-recipient per 24h.
- [ ] Sender confirmation email and recipient invite email are both emitted (backend responsibility).
- [ ] Client tests pass and QA scenarios pass with captured evidence.

### Must Have

- Unified no-wallet behavior across all zap entry points.
- No recipient email exposure in client payload.
- 24h dedupe guardrail.
- Tests-after implementation with MSW-backed assertions.

### Must NOT Have (Guardrails)

- No refactor of unrelated zap internals (`handleProceedToConfirm`/`handleCustomAmountConfirm` extraction is out of scope).
- No changes to `components/wallet/zap-modal.tsx`.
- No expansion to push/SMS/in-app notification channels.
- No sender-customized email body in this run.
- No manual/human-only acceptance checks.

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> All verification is agent-executed (tests, browser automation, API assertions, logs/evidence capture).

### Test Decision

- **Infrastructure exists**: YES
- **Automated tests**: Tests-after
- **Framework**: Jest + React Testing Library + MSW

### Agent-Executed QA Scenarios (applies to all tasks)

- Frontend/UI: Playwright scenarios on fallback rendering + button behavior.
- API/backend: `curl` scenarios validating endpoint responses (sent, deduped, error).
- Test suite: `pnpm test -- --testPathPattern="zap|wallet|invite"` and `pnpm test:ci`.

---

## Execution Strategy

### Parallel Execution Waves

Wave 1 (Start Immediately):

- Task 1: Normalize no-wallet transition logic in `ZapSheet`
- Task 5: Backend contract + Trigger.dev task and template scaffolding

Wave 2 (After Wave 1):

- Task 2: Upgrade no-wallet step UI with two actions
- Task 3: Add client notify mutation hook + endpoint contract wiring

Wave 3 (After Wave 2):

- Task 4: Integrate notify action/state into zap step flow
- Task 6: Tests + QA evidence capture

Critical Path: 1 -> 2 -> 3 -> 4 -> 6

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
| ---- | ---------- | ------ | -------------------- |
| 1    | None       | 2, 4   | 5                    |
| 2    | 1          | 4      | 3                    |
| 3    | 5          | 4, 6   | 2                    |
| 4    | 2, 3       | 6      | None                 |
| 5    | None       | 3, 6   | 1                    |
| 6    | 3, 4, 5    | None   | None                 |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents                                                                    |
| ---- | ----- | ------------------------------------------------------------------------------------- |
| 1    | 1, 5  | `task(category="quick")` for Task 1, `task(category="unspecified-high")` for Task 5   |
| 2    | 2, 3  | `task(category="visual-engineering")` for Task 2, `task(category="quick")` for Task 3 |
| 3    | 4, 6  | `task(category="unspecified-low")` for integration + tests                            |

---

## TODOs

- [ ]   1. Route all recipient-no-wallet outcomes into the same zap fallback step

    **What to do**:
    - Update no-wallet decision points in `components/zap/zap-sheet.tsx` so both:
        - empty/falsy `recipientLightningAddress`
        - LNURL parse "invalid input" errors
          transition to `step = 'no-wallet'`.
    - Keep sender-wallet-disconnected behavior unchanged (still wallet unlock error).

    **Must NOT do**:
    - Do not introduce a new sheet framework outside zap.
    - Do not refactor unrelated zap flow internals.

    **Recommended Agent Profile**:
    - **Category**: `quick`
        - Reason: Targeted logic updates in one flow controller.
    - **Skills**: `[]`
    - **Skills Evaluated but Omitted**:
        - `frontend-ui-ux`: not required for this pure state-routing task.

    **Parallelization**:
    - **Can Run In Parallel**: YES
    - **Parallel Group**: Wave 1 (with Task 5)
    - **Blocks**: 2, 4
    - **Blocked By**: None

    **References**:
    - `components/zap/zap-sheet.tsx` - central zap state machine and error handling branch to modify.
    - `components/zap/zap-types.ts` - verifies available step union values.
    - `lib/services/breez-sdk.ts` - error source context for parse failures.

    **Acceptance Criteria**:
    - [ ] Invalid LNURL parse path no longer closes sheet immediately.
    - [ ] Invalid LNURL parse path lands on `no-wallet` step.
    - [ ] Empty address still lands on `no-wallet` step.

    **Agent-Executed QA Scenarios**:

    ```text
    Scenario: Invalid LNURL transitions to fallback
      Tool: Bash (test runner with mocks)
      Preconditions: Jest/MSW setup available
      Steps:
        1. Mock breez parseInput to throw Error("invalid input")
        2. Render ZapSheet open with recipientLightningAddress="user@evento.cash"
        3. Wait for step render
        4. Assert fallback heading appears
      Expected Result: no-wallet step rendered; sheet remains open
      Evidence: test output saved in .sisyphus/evidence/task-1-invalid-lnurl.txt

    Scenario: Sender SDK disconnected still shows sender-wallet error path
      Tool: Bash (test runner with mocks)
      Preconditions: Mock parseInput throws Error("SDK not connected")
      Steps:
        1. Render ZapSheet and trigger parse path
        2. Assert wallet unlock handler/toast path invoked
        3. Assert no-wallet step is not shown
      Expected Result: sender-wallet error path preserved
      Evidence: .sisyphus/evidence/task-1-sdk-disconnected.txt
    ```

- [ ]   2. Expand no-wallet step UI to two-button action model

    **What to do**:
    - Update `components/zap/steps/zap-no-wallet-step.tsx` to include:
        - heading/body copy: recipient has no wallet
        - `Close` button
        - `Let them know` button
    - Add props for notify action state (`isNotifying`, `alreadyNotified`, `onNotify`).

    **Must NOT do**:
    - Do not create a separate global master sheet component for this flow.
    - Do not add extra channels beyond email.

    **Recommended Agent Profile**:
    - **Category**: `visual-engineering`
        - Reason: UI copy, actions, loading/disabled states.
    - **Skills**: [`frontend-ui-ux`]
        - `frontend-ui-ux`: ensures consistent action hierarchy and tone.
    - **Skills Evaluated but Omitted**:
        - `playwright`: not needed for implementation, only for QA phase.

    **Parallelization**:
    - **Can Run In Parallel**: YES
    - **Parallel Group**: Wave 2 (with Task 3)
    - **Blocks**: 4
    - **Blocked By**: 1

    **References**:
    - `components/zap/steps/zap-no-wallet-step.tsx` - component to extend.
    - `components/zap/steps/zap-confirm-step.tsx` - prop-driven step UI pattern.
    - `components/ui/master-scrollable-sheet.tsx` - copy/button conventions reference (tone/style only; architecture remains zap-step).

    **Acceptance Criteria**:
    - [ ] Step renders two buttons with deterministic priority.
    - [ ] Notify button supports loading + disabled states.
    - [ ] Copy clearly explains recipient cannot receive zap yet.

    **Agent-Executed QA Scenarios**:

    ```text
    Scenario: Two-button no-wallet UI renders correctly
      Tool: Playwright
      Preconditions: Dev server running; route triggers no-wallet state
      Steps:
        1. Open page with zap action for no-wallet recipient
        2. Click zap trigger
        3. Wait for no-wallet heading
        4. Assert button text contains "Close"
        5. Assert button text contains "Let them know"
        6. Screenshot .sisyphus/evidence/task-2-no-wallet-ui.png
      Expected Result: Both actions visible and clickable
      Evidence: .sisyphus/evidence/task-2-no-wallet-ui.png

    Scenario: Notify button disabled when already notified
      Tool: Playwright
      Preconditions: Mock response indicates already notified in 24h window
      Steps:
        1. Open no-wallet state
        2. Assert notify button has disabled attribute
        3. Assert text indicates already notified
        4. Screenshot .sisyphus/evidence/task-2-already-notified.png
      Expected Result: User cannot resend within dedupe window
      Evidence: .sisyphus/evidence/task-2-already-notified.png
    ```

- [ ]   3. Implement client notify mutation hook + API contract wiring

    **What to do**:
    - Add new hook in `lib/hooks/` (e.g., `use-notify-wallet-invite.ts`) using existing mutation patterns.
    - Define payload using non-sensitive identifiers only (e.g., recipient username/id).
    - Standardize response states:
        - `sent`
        - `already_notified`
        - `error`

    **Must NOT do**:
    - Do not send recipient email from client.
    - Do not bypass existing API client patterns.

    **Recommended Agent Profile**:
    - **Category**: `quick`
        - Reason: small hook + mutation wiring following existing conventions.
    - **Skills**: []
    - **Skills Evaluated but Omitted**:
        - `git-master`: not required for implementation task itself.

    **Parallelization**:
    - **Can Run In Parallel**: YES
    - **Parallel Group**: Wave 2 (with Task 2)
    - **Blocks**: 4, 6
    - **Blocked By**: 5

    **References**:
    - `lib/hooks/use-contact-host.ts` - mutation structure and toast/error handling pattern.
    - `lib/api/client.ts` - API call conventions.
    - `lib/types/api.ts` - recipient/user type constraints.

    **Acceptance Criteria**:
    - [ ] Hook exposes `mutate` + pending/error/success semantics.
    - [ ] Response mapping supports dedupe (`already_notified`) UX.
    - [ ] No PII (email) sent from client request.

    **Agent-Executed QA Scenarios**:

    ```text
    Scenario: Notify API success maps to sent state
      Tool: Bash (Jest + MSW)
      Preconditions: MSW handler returns {status:"sent"}
      Steps:
        1. Invoke hook mutation with recipientUsername
        2. Await success
        3. Assert hook state indicates success/sent
      Expected Result: sent path returned to UI layer
      Evidence: .sisyphus/evidence/task-3-notify-sent.txt

    Scenario: Notify API dedupe maps to already_notified
      Tool: Bash (Jest + MSW)
      Preconditions: MSW handler returns {status:"already_notified"}
      Steps:
        1. Invoke mutation for same sender-recipient
        2. Assert hook returns dedupe status
        3. Assert no error state thrown
      Expected Result: UI can disable/label button appropriately
      Evidence: .sisyphus/evidence/task-3-notify-dedupe.txt
    ```

- [ ]   4. Wire notify action and state machine into zap flow

    **What to do**:
    - Connect Task 3 hook into `components/zap/zap-sheet.tsx`.
    - Pass recipient context and notify callbacks into `ZapNoWalletStep`.
    - Define post-click behavior:
        - success -> show "Notified" state
        - dedupe -> show already-notified state
        - failure -> show retryable error while keeping sheet open

    **Must NOT do**:
    - Do not auto-close sheet on notify failure.
    - Do not trigger notify automatically on step entry.

    **Recommended Agent Profile**:
    - **Category**: `unspecified-low`
        - Reason: integration task across component + hook state.
    - **Skills**: []
    - **Skills Evaluated but Omitted**:
        - `frontend-ui-ux`: already covered in task 2 for presentation.

    **Parallelization**:
    - **Can Run In Parallel**: NO
    - **Parallel Group**: Wave 3
    - **Blocks**: 6
    - **Blocked By**: 2, 3

    **References**:
    - `components/zap/zap-sheet.tsx` - owns step routing and callbacks.
    - `components/zap/steps/zap-no-wallet-step.tsx` - receives action handlers.

    **Acceptance Criteria**:
    - [ ] Notify action wired from step button to mutation.
    - [ ] UI state reflects pending/success/dedupe/error.
    - [ ] Close action always exits cleanly.

    **Agent-Executed QA Scenarios**:

    ```text
    Scenario: Let them know success path
      Tool: Playwright
      Preconditions: API mock returns sent
      Steps:
        1. Open no-wallet step
        2. Click "Let them know"
        3. Wait for loading indicator on button
        4. Assert button transitions to notified success state
        5. Screenshot .sisyphus/evidence/task-4-notify-success.png
      Expected Result: sender sees confirmation state without leaving sheet abruptly
      Evidence: .sisyphus/evidence/task-4-notify-success.png

    Scenario: Let them know failure path remains retryable
      Tool: Playwright
      Preconditions: API mock returns 500
      Steps:
        1. Open no-wallet step
        2. Click "Let them know"
        3. Wait for error toast/message
        4. Assert button re-enabled for retry
        5. Screenshot .sisyphus/evidence/task-4-notify-error.png
      Expected Result: no silent failure, no forced sheet close
      Evidence: .sisyphus/evidence/task-4-notify-error.png
    ```

- [ ]   5. Implement backend notify endpoint + Trigger.dev task + two email templates

    **What to do**:
    - Add/extend backend endpoint for wallet invite notifications (called by client via proxy).
    - Trigger a Trigger.dev task immediately with idempotency key.
    - Configure dedupe to 24h per sender->recipient pair.
    - Implement two templates:
        - Template A: sender confirmation ("we notified them")
        - Template B: recipient invite ("someone is trying to pay you; claim your lightning address")

    **Must NOT do**:
    - Do not expose recipient email in client/server response.
    - Do not send duplicate emails within dedupe window.

    **Recommended Agent Profile**:
    - **Category**: `unspecified-high`
        - Reason: server workflow, idempotency, email orchestration.
    - **Skills**: []
    - **Skills Evaluated but Omitted**:
        - `playwright`: not relevant for backend mail orchestration.

    **Parallelization**:
    - **Can Run In Parallel**: YES
    - **Parallel Group**: Wave 1 (with Task 1)
    - **Blocks**: 3, 6
    - **Blocked By**: None

    **References**:
    - Trigger.dev docs: `https://trigger.dev/docs/guides/frameworks/nextjs` - Next.js task integration.
    - Trigger.dev docs: `https://trigger.dev/docs/idempotency` - dedupe and idempotency-key design.
    - Trigger.dev docs: `https://trigger.dev/docs/errors-retrying` - retries/backoff guidance.

    **Acceptance Criteria**:
    - [ ] Endpoint returns explicit states (`sent`, `already_notified`, `error`).
    - [ ] Trigger.dev task uses idempotency key + 24h TTL.
    - [ ] Both templates are delivered in success path.
    - [ ] Retry/backoff configured for transient email failures.

    **Agent-Executed QA Scenarios**:

    ```text
    Scenario: Backend send path emits two emails
      Tool: Bash (curl + backend logs/assertions)
      Preconditions: Server + Trigger.dev worker running
      Steps:
        1. POST notify endpoint with sender/recipient identifiers
        2. Assert HTTP 200 and status="sent"
        3. Inspect task run output for two email dispatch calls
      Expected Result: sender + recipient emails queued/sent once
      Evidence: .sisyphus/evidence/task-5-backend-sent.json

    Scenario: Dedupe path returns already_notified
      Tool: Bash (curl)
      Preconditions: Prior successful notify in last 24h
      Steps:
        1. Repeat same POST payload
        2. Assert response status="already_notified"
        3. Assert no new email send records created
      Expected Result: duplicate send prevented
      Evidence: .sisyphus/evidence/task-5-backend-dedupe.json
    ```

- [ ]   6. Add tests-after coverage and end-to-end QA evidence

    **What to do**:
    - Add/extend tests for:
        - zap invalid-input -> fallback transition
        - no-wallet step actions and states
        - notify hook success/dedupe/error mapping
        - integrated zap no-wallet notify flow
    - Add/extend MSW handlers for new notify endpoint responses.
    - Run targeted and CI-level test commands.

    **Must NOT do**:
    - Do not leave backend integration unmocked in client tests.
    - Do not rely on manual browser-only checks.

    **Recommended Agent Profile**:
    - **Category**: `unspecified-low`
        - Reason: incremental test additions in existing Jest/MSW stack.
    - **Skills**: []
    - **Skills Evaluated but Omitted**:
        - `ultrabrain`: unnecessary for routine test additions.

    **Parallelization**:
    - **Can Run In Parallel**: NO
    - **Parallel Group**: Wave 3
    - **Blocks**: None
    - **Blocked By**: 3, 4, 5

    **References**:
    - `__tests__/integration/auth-flow.test.tsx` - integration test structure reference.
    - `__tests__/hooks/use-auth.test.ts` - hook test style reference.
    - `__tests__/setup/msw/handlers.ts` - mock handler pattern.
    - `jest.config.ts` - test environment constraints.
    - `.github/workflows/ci.yml` - CI validation commands.

    **Acceptance Criteria**:
    - [ ] New/updated tests pass locally.
    - [ ] `pnpm test:ci` passes.
    - [ ] Evidence artifacts captured for UI/API scenarios.

    **Agent-Executed QA Scenarios**:

    ```text
    Scenario: End-to-end client flow in no-wallet case
      Tool: Playwright
      Preconditions: Dev server and API mock route for notify endpoint
      Steps:
        1. Open zap entry point for recipient without wallet
        2. Trigger zap
        3. Assert fallback appears
        4. Click "Let them know"
        5. Assert post-action notified state and no crash
        6. Screenshot .sisyphus/evidence/task-6-e2e-no-wallet.png
      Expected Result: full UX path works without manual intervention
      Evidence: .sisyphus/evidence/task-6-e2e-no-wallet.png

    Scenario: Full test suite gate for changed scope
      Tool: Bash
      Preconditions: Dependencies installed
      Steps:
        1. Run pnpm test -- --testPathPattern="zap|wallet|invite"
        2. Run pnpm test:ci
        3. Capture outputs
      Expected Result: test commands succeed with zero failures
      Evidence: .sisyphus/evidence/task-6-test-commands.txt
    ```

---

## Commit Strategy

| After Task | Message                                                     | Files                                  | Verification             |
| ---------- | ----------------------------------------------------------- | -------------------------------------- | ------------------------ |
| 1-2        | `fix(zap): route missing-wallet states to fallback step`    | zap-sheet + no-wallet step             | targeted zap tests       |
| 3-4        | `feat(zap): add notify-recipient action for no-wallet flow` | hook + zap integration                 | hook + integration tests |
| 5          | `feat(wallet-invite): add trigger-based email notify flow`  | backend endpoint + trigger/email files | API scenario checks      |
| 6          | `test(zap): cover missing-wallet notify flow`               | tests + msw handlers                   | `pnpm test:ci`           |

---

## Success Criteria

### Verification Commands

```bash
pnpm test -- --testPathPattern="zap|wallet|invite"  # Expected: all targeted tests pass
pnpm test:ci                                          # Expected: CI test suite passes
```

### Final Checklist

- [ ] All Must Have items present.
- [ ] All Must NOT Have items absent.
- [ ] Unified no-wallet fallback works for empty-address and invalid-LNURL cases.
- [ ] Notify action supports success/dedupe/error states with 24h guardrail.
- [ ] Sender confirmation + recipient invite templates implemented in backend workflow.
- [ ] Test and QA evidence captured under `.sisyphus/evidence/`.
