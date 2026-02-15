# Testing & Type Coverage Improvements (evento-client)

## TL;DR

> **Quick Summary**: Clean up noisy hook logging, standardize integration tests on MSW, add high‑signal schema/DTO tests, and expand coverage in the most impactful UI + auth/registration flows—without introducing E2E or heavy runtime costs.
>
> **Deliverables**:
>
> - Reduced console noise in hooks
> - MSW‑based integration tests (consistent pattern)
> - Schema/DTO validation tests (type safety)
> - High‑signal UI + auth/registration tests (fast)
>
> **Estimated Effort**: Large
> **Parallel Execution**: YES – 2 waves
> **Critical Path**: Logging cleanup → MSW standardization → Schema tests → UI/Auth tests

---

## Context

### Original Request

Improve testing and type coverage in evento-client, identify noisy test logs, decide on E2E (not now), and focus on useful tests that help catch regressions early.

### Interview Summary

**Key Decisions**:

- Priorities: **Event creation/onboarding UI → Auth + registration → Wallet/payments**
- Focus on **regression prevention**, **payment safety**, **type safety**
- **No E2E** for now; keep tests fast
- **No coverage thresholds** yet
- **Remove noisy console logs** from hooks
- **Type coverage first**: schema/DTO validation tests, then consider stricter TS config
- **Integration tests should use MSW handlers** consistently

**Research Findings**:

- Jest + RTL with Next.js Jest config; MSW exists but underused.
- 40 test files (hooks + integration); no service tests; no component tests for critical flows.
- ~90 console statements across hooks (use-create-event, use-event-details, use-auth, use-wallet worst offenders).
- Critical coverage gaps in wallet services/hooks, auth service, registration hooks, onboarding & create-event components.

### Metis Review

**Gaps Addressed in Plan**:

- Make MSW vs apiClient mock strategy explicit (MSW for integration; keep apiClient mocks for unit/hook tests).
- Guardrail: avoid new dependencies/logging frameworks; remove console logs instead.
- Include explicit acceptance criteria for logging cleanup and test coverage.

---

## Work Objectives

### Core Objective

Increase test and type safety coverage with fast, high‑signal tests, while eliminating noisy logging and standardizing integration tests on MSW.

### Concrete Deliverables

- Hook logging cleanup (remove console.log/debug spam)
- Integration tests standardized to MSW handlers
- Schema/DTO validation tests for key Zod schemas
- UI + auth/registration tests (fast RTL)

### Definition of Done

- [x] No console.log/debug statements left in `lib/hooks/**` (errors only if needed)
- [x] Integration tests run via MSW without direct apiClient mocks
- [x] Schema tests exist for core Zod schemas (auth, user, event)
- [x] UI tests for event creation/onboarding cover critical regressions

### Must Have

- No E2E tests added
- Tests remain fast (unit/integration only)
- No coverage thresholds enforced yet

### Must NOT Have (Guardrails)

- Do **not** add new testing frameworks
- Do **not** introduce E2E tooling
- Do **not** refactor production logic beyond log cleanup
- Do **not** change backend code or endpoints

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks in this plan MUST be verifiable WITHOUT any human action.
> This is NOT conditional — it applies to EVERY task, regardless of test strategy.
>
> **FORBIDDEN** — acceptance criteria that require:
>
> - "User manually tests..."
> - "User visually confirms..."
> - "User interacts with..."
>
> **ALL verification is executed by the agent** using tools (Playwright, interactive_bash, curl, etc.).

### Test Decision

- **Infrastructure exists**: YES (Jest + RTL + MSW)
- **Automated tests**: YES (tests-after)
- **Framework**: Jest + RTL + MSW

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

> Each task includes a concrete QA scenario using CLI commands (pnpm test ...)

---

## Execution Strategy

### Parallel Execution Waves

Wave 1 (Start Immediately):
├── Task 1: Remove noisy console logs in hooks
└── Task 2: Standardize integration tests on MSW

Wave 2 (After Wave 1):
├── Task 3: Add schema/DTO tests (type safety)
└── Task 4: Add high‑signal UI + auth/registration tests

Critical Path: Task 1 → Task 2 → Task 3 → Task 4

---

## TODOs

> Implementation + Test = ONE Task. Never separate.
> EVERY task MUST have: Recommended Agent Profile + Parallelization info.

- [x]   1. Remove noisy console logs in hooks (keep errors only)

    **What to do**:
    - Remove `console.log`/debug statements from `lib/hooks/**` (notably `use-create-event`, `use-event-details`, `use-auth`, `use-wallet`).
    - Preserve essential `console.error` only where it represents real error reporting.
    - Ensure tests no longer require console mocks where noise was removed.

    **Must NOT do**:
    - Do not add a new logger dependency.
    - Do not change business logic.

    **Recommended Agent Profile**:
    - **Category**: `quick`
        - Reason: targeted removal of logging lines.
    - **Skills**: `vercel-react-best-practices`

    **Parallelization**:
    - **Can Run In Parallel**: YES
    - **Parallel Group**: Wave 1 (with Task 2)
    - **Blocks**: Task 2
    - **Blocked By**: None

    **References**:
    - `lib/hooks/use-create-event.ts` — 10+ console logs
    - `lib/hooks/use-event-details.ts` — heavy logging
    - `lib/hooks/use-auth.ts` — OTP/debug logging
    - `lib/hooks/use-wallet.ts` — wallet debug logs
    - `__tests__/hooks/*` — console mocks to remove post‑cleanup

    **Acceptance Criteria**:
    - [ ] `grep -r "console\.log" lib/hooks` returns 0 results
    - [ ] Tests that previously mocked console are updated/cleaned

    **Agent-Executed QA Scenarios**:

    Scenario: Verify no console.log in hooks
    Tool: Bash
    Steps: 1. Run: `grep -r "console\.log" lib/hooks` 2. Assert: no output
    Expected Result: zero matches
    Evidence: command output captured

    **Commit**: YES (group with Task 2)

- [x]   2. Standardize integration tests on MSW handlers

    **What to do**:
    - Ensure integration tests (`__tests__/integration/**`) rely on MSW handlers and not direct `apiClient` mocks.
    - Adjust `__tests__/setup/jest.setup.ts` or test setup to avoid globally mocking `apiClient` for integration tests (use selective unmocking or split setup).
    - Add/extend MSW handlers in `__tests__/setup/msw/handlers.ts` to cover integration endpoints used in tests.

    **Must NOT do**:
    - Do not rewrite unit/hook tests to MSW (keep their apiClient mocks).
    - Do not add new frameworks.

    **Recommended Agent Profile**:
    - **Category**: `unspecified-high`
        - Reason: test infra changes affect many files.
    - **Skills**: `vercel-react-best-practices`

    **Parallelization**:
    - **Can Run In Parallel**: YES
    - **Parallel Group**: Wave 1 (with Task 1)
    - **Blocks**: Task 3, 4
    - **Blocked By**: None

    **References**:
    - `__tests__/setup/jest.setup.ts` — global apiClient mocks
    - `__tests__/setup/msw/handlers.ts` — integration API mocks
    - `__tests__/integration/*.test.tsx` — integration tests to update

    **Acceptance Criteria**:
    - [ ] Integration tests pass with MSW handlers (no direct apiClient mocks)
    - [ ] Hook/unit tests remain unchanged in mocking pattern

    **Agent-Executed QA Scenarios**:

    Scenario: Run integration test suite with MSW
    Tool: Bash
    Steps: 1. Run: `pnpm test --testPathPattern=__tests__/integration` 2. Assert: exit code 0
    Expected Result: integration tests pass
    Evidence: test output captured

    **Commit**: YES (with Task 1)

- [x]   3. Add schema/DTO validation tests (type safety)

    **What to do**:
    - Add tests for Zod schemas in `lib/schemas/`:
        - `event.ts`, `user.ts`, `auth.ts`
    - Cover valid and invalid payloads; include boundary cases (min/max, required fields).
    - Ensure tests verify error messages or error paths for invalid inputs.

    **Must NOT do**:
    - Do not change schema logic unless needed for correctness.

    **Recommended Agent Profile**:
    - **Category**: `unspecified-low`
    - **Skills**: `vercel-react-best-practices`

    **Parallelization**:
    - **Can Run In Parallel**: NO
    - **Parallel Group**: Wave 2
    - **Blocks**: Task 4
    - **Blocked By**: Task 1, 2

    **References**:
    - `lib/schemas/event.ts`
    - `lib/schemas/user.ts`
    - `lib/schemas/auth.ts`
    - `__tests__/hooks/*` — patterns for test structure

    **Acceptance Criteria**:
    - [ ] Schema tests exist and validate pass/fail cases
    - [ ] `pnpm test --testPathPattern=schema` passes

    **Agent-Executed QA Scenarios**:

    Scenario: Run schema tests only
    Tool: Bash
    Steps: 1. Run: `pnpm test --testPathPattern=schema` 2. Assert: exit code 0
    Expected Result: schema tests pass
    Evidence: test output captured

    **Commit**: YES (group with Task 4)

- [x]   4. Add high‑signal UI + auth/registration tests (fast)

    **What to do**:
    - Add RTL tests for **event creation** and **onboarding** components:
        - Validate required fields
        - Validate error display and submit disabled states
    - Add auth/registration hook tests for:
        - OTP verification edge cases
        - Registration submission + approval/denial hooks
    - Keep tests fast; avoid network; rely on MSW for integration, apiClient mocks for hooks.

    **Must NOT do**:
    - Do not add E2E or browser automation.
    - Do not add tests that require real services.

    **Recommended Agent Profile**:
    - **Category**: `unspecified-high`
    - **Skills**: `vercel-react-best-practices`

    **Parallelization**:
    - **Can Run In Parallel**: NO
    - **Parallel Group**: Wave 2
    - **Blocks**: None (final)
    - **Blocked By**: Task 3

    **References**:
    - `components/create-event/**` — event creation UI
    - `components/onboarding/**` — onboarding UI
    - `app/auth/login/page.tsx`, `app/auth/verify/page.tsx` — auth pages
    - `lib/hooks/use-submit-registration.ts`
    - `lib/hooks/use-approve-registration.ts`
    - `lib/hooks/use-deny-registration.ts`
    - `__tests__/setup/test-utils.tsx` — RTL wrappers

    **Acceptance Criteria**:
    - [ ] Tests cover required field validation for event creation/onboarding
    - [ ] Auth/registration hooks have success + error tests
    - [ ] `pnpm test --testPathPattern=onboarding|registration|create-event` passes

    **Agent-Executed QA Scenarios**:

    Scenario: Run new UI/auth tests
    Tool: Bash
    Steps: 1. Run: `pnpm test --testPathPattern=onboarding|registration|create-event` 2. Assert: exit code 0
    Expected Result: targeted tests pass
    Evidence: test output captured

    **Commit**: YES (with Task 3)

---

## Commit Strategy

| After Task | Message                                                      | Files                        | Verification                                        |
| ---------- | ------------------------------------------------------------ | ---------------------------- | --------------------------------------------------- | ---------- | ------------ | ------------- |
| 1-2        | `chore(testing): remove hook debug logs and standardize MSW` | hooks + integration setup    | `pnpm test --testPathPattern=__tests__/integration` |
| 3-4        | `test: add schema and UI/auth coverage`                      | schema tests + UI/auth tests | `pnpm test --testPathPattern=schema                 | onboarding | registration | create-event` |

---

## Success Criteria

### Verification Commands

```bash
pnpm test --testPathPattern=__tests__/integration
pnpm test --testPathPattern=schema
pnpm test --testPathPattern=onboarding|registration|create-event
```

### Final Checklist

- [x] Hook debug logs removed
- [x] Integration tests standardized on MSW handlers
- [x] Schema/DTO tests added and passing
- [x] UI + auth/registration tests added and passing
