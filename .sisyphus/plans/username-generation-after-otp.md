# Username Generation After OTP (Evento Client)

## TL;DR

> **Quick Summary**: Add client-side, post-OTP username generation that mirrors evento-api rules and writes to `/v1/user`, ensuring new users get a valid username before entering the app.
>
> **Deliverables**:
>
> - Client username generation + availability/collision handling helper
> - Post-OTP flow update to auto-create/update `user_details` with username + name
>
> **Estimated Effort**: Medium
> **Parallel Execution**: NO – sequential (helper first, integration second)
> **Critical Path**: Helper → OTP integration → QA

---

## Context

### Original Request

When unauthenticated users register for events (registration type), the OTP flow completes but username creation is skipped. Username must be auto-generated (from name/email) and saved to user details so the user can proceed in Evento.

### Interview Summary

**Key Discussions**:

- Username generation must happen **after OTP verification**.
- Flow must be **fully automatic**; users can edit usernames later in profile.
- Collision handling: append **numeric suffix with no separator** (`alex`, `alex2`, `alex3`).
- Implementation is **client-side only** (evento-client); no new backend endpoints.
- No automated tests; rely on agent-executed QA scenarios.

**Research Findings**:

- OTP verification uses `authService.verifyCode()` → `useVerifyCode()` in `lib/hooks/use-auth.ts`.
- User profile updates use `PATCH /v1/user` via `useUpdateUserProfile()` (hook) and `apiClient`.
- Backend rules in evento-api: 3–20 chars, alphanumeric only, lowercase/trim, reserved words (`api`, `blog`, `auth`, `e`, `event`).
- Backend helper exists: `lib/utils/username.ts` (generateUsername).
- Availability check endpoints in client:
    - Onboarding: `useUserByUsername` (public profile)
    - Profile edit: `useCheckUsername` (`GET /v1/user/check-username`)

### Metis Review

**Identified Gaps (addressed)**:

- Multiple availability-check paths → plan uses `/v1/user/check-username` as source of truth.
- No existing client generation logic → plan introduces a dedicated helper.
- Potential scope creep (OAuth/UI) → explicitly excluded.

---

## Work Objectives

### Core Objective

Ensure every new user completing OTP verification receives a valid, unique username (per backend rules) automatically and is written to `user_details` before entering the app.

### Concrete Deliverables

- New client-side username generation helper (mirrors evento-api rules).
- Post-OTP logic that generates and persists username + name via `PATCH /v1/user`.

### Definition of Done

- [x] New users who complete OTP flow have `username` + `name` stored in backend (`/v1/user` returns both).
- [x] Generated usernames follow backend rules (3–20, alphanumeric only, lowercase/trim, reserved words avoided).
- [x] Collision handling appends numeric suffix without separators (e.g., `alex2`).

### Must Have

- Auto-generation runs **after OTP verification**.
- No new UI for username selection in this flow.

### Must NOT Have (Guardrails)

- Do **not** change backend APIs or schema.
- Do **not** alter onboarding UI/flow unless required for data wiring.
- Do **not** introduce underscores/hyphens or other characters (alphanumeric only).
- Do **not** add OAuth-specific changes (scope limited to OTP registration path).

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

- **Infrastructure exists**: YES (Jest + RTL)
- **Automated tests**: NO
- **Framework**: none

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

> Whether TDD is enabled or not, EVERY task MUST include Agent-Executed QA Scenarios.
> These describe how the executing agent DIRECTLY verifies the deliverable
> by running it — opening browsers, executing commands, or running scripts.

---

## Execution Strategy

### Parallel Execution Waves

Wave 1 (Start Immediately):
├── Task 1: Add username generation + availability helper

Wave 2 (After Wave 1):
└── Task 2: Wire helper into post-OTP flow and persist to `/v1/user`

Critical Path: Task 1 → Task 2

---

## TODOs

> Implementation + Test = ONE Task. Never separate.
> EVERY task MUST have: Recommended Agent Profile + Parallelization info.

- [x]   1. Add client-side username generation + availability helper

    **What to do**:
    - Add a helper in `lib/utils/` (e.g., `lib/utils/username.ts`) that mirrors evento-api rules:
        - Normalize input: lowercase, trim, remove non-alphanumeric chars.
        - Generate base using email prefix + name combinations (match API algorithm order).
        - Enforce 3–20 char window; fallback to truncated email prefix.
        - Avoid reserved words (`api`, `blog`, `auth`, `e`, `event`).
        - Provide async availability check via `GET /v1/user/check-username?username=...`.
        - Collision handling: append numeric suffix with no separator (`base2`, `base3`, ...).
        - Stop after a max attempts threshold (set to **10 tries**) and return last candidate.
    - Ensure the helper can be used from auth flow without React hooks.

    **Must NOT do**:
    - Do not change backend rules or endpoints.
    - Do not add new UI for username selection.
    - Do not allow underscores or special characters.

    **Recommended Agent Profile**:
    - **Category**: `unspecified-low`
        - Reason: small utility addition + HTTP call logic.
    - **Skills**: `vercel-react-best-practices`
        - `vercel-react-best-practices`: ensures best practices for Next.js client utilities.
    - **Skills Evaluated but Omitted**:
        - `playwright`: not needed for utility creation.

    **Parallelization**:
    - **Can Run In Parallel**: NO
    - **Parallel Group**: Wave 1 (sequential)
    - **Blocks**: Task 2
    - **Blocked By**: None

    **References**:
    - `evento-api/lib/utils/username.ts` — source algorithm for email/name combinations.
    - `evento-api/app/api/v1/user/route.ts` — backend validation rules + reserved words.
    - `lib/hooks/use-check-username.ts` — existing client endpoint usage for availability.
    - `lib/schemas/user.ts` — current client validation schema (alphanumeric only).
    - `app/e/wallet/page.tsx` + `components/wallet/wallet-setup.tsx` — existing normalization pattern (`toLowerCase().replace(/[^a-z0-9]/g, '')`).

    **Acceptance Criteria**:
    - [x] Helper generates only lowercase alphanumeric usernames (no underscores).
    - [x] Reserved words are never returned as final usernames.
    - [x] Collision handling appends numeric suffix without separators.
    - [x] Helper can be called from non-hook code (no React dependency).

    **Agent-Executed QA Scenarios**:

    Scenario: Generate valid username from name+email with collisions
    Tool: Bash (node/tsx execution)
    Preconditions: Helper implemented; API check endpoint reachable or stubbed.
    Steps: 1. Execute a script that calls the helper with `email="alex@example.com"`, `name="Alex"` and a mocked availability function that returns unavailable for `alex`, available for `alex2`. 2. Assert: returned username equals `alex2`. 3. Assert: username is lowercase and alphanumeric.
    Expected Result: Helper returns `alex2`.
    Evidence: Script output captured.

    Scenario: Reserved word is avoided
    Tool: Bash (node/tsx execution)
    Preconditions: Helper implemented.
    Steps: 1. Execute a script with input that yields `"api"` as a base. 2. Assert: returned username is not `api` and uses numeric suffix or alternate combo.
    Expected Result: Reserved word avoided.
    Evidence: Script output captured.

    **Commit**: NO

- [x]   2. Wire username generation into post-OTP verification flow

    **What to do**:
    - In `lib/hooks/use-auth.ts` (or `lib/services/auth.ts` if better separation), insert post-OTP logic:
        - After successful `verifyCode()` and before final user state is set, check if `username` is missing.
        - Obtain name/email from the registration flow state (event registration form or auth store).
        - Call the new helper to generate an available username.
        - Persist via `PATCH /v1/user` with `{ username, name }` (and any required fields).
        - Update client user state with returned user details.
    - Ensure this runs only for OTP registration flow (not for already-onboarded users).
    - Handle API failures gracefully (log + allow onboarding to proceed rather than blocking auth).

    **Must NOT do**:
    - Do not block OTP success if username update fails.
    - Do not introduce new UI/steps in the flow.
    - Do not overwrite existing usernames.

    **Recommended Agent Profile**:
    - **Category**: `unspecified-high`
        - Reason: touches auth flow and user state updates.
    - **Skills**: `vercel-react-best-practices`
        - `vercel-react-best-practices`: ensures proper React Query/Zustand usage and Next.js data patterns.
    - **Skills Evaluated but Omitted**:
        - `playwright`: not required for wiring logic.

    **Parallelization**:
    - **Can Run In Parallel**: NO
    - **Parallel Group**: Wave 2 (after Task 1)
    - **Blocks**: None (final)
    - **Blocked By**: Task 1

    **References**:
    - `lib/hooks/use-auth.ts` — `useVerifyCode()` mutation flow.
    - `lib/services/auth.ts` — `verifyCode()` and `getCurrentUser()`.
    - `lib/hooks/use-user-profile.ts` — PATCH `/v1/user` behavior and response shape.
    - `lib/stores/auth-store.ts` — current user state updates.
    - Event registration flow components (where name/email is collected) — ensure name/email is accessible post-OTP.

    **Acceptance Criteria**:
    - [x] After OTP verification for a new user, a `PATCH /v1/user` request is made with generated username + name.
    - [x] The returned user details include the generated username and are set in auth store.
    - [x] If username already exists, a numeric suffix is applied and a subsequent PATCH succeeds.
    - [x] Existing users (already with username) bypass generation.

    **Agent-Executed QA Scenarios**:

    Scenario: Post-OTP flow triggers username creation
    Tool: Bash (curl or API log inspection)
    Preconditions: Dev server running; ability to simulate OTP verification response in dev.
    Steps: 1. Trigger OTP verification (via existing dev flow or mocked auth response). 2. Observe network: PATCH `/v1/user` with `username` and `name`. 3. Call `GET /v1/user` to confirm stored username.
    Expected Result: Username exists in backend after OTP.
    Evidence: Response body captured.

    Scenario: Collision handling appends numeric suffix
    Tool: Bash (curl)
    Preconditions: Username `alex` already exists; dev user attempts registration with name/email resolving to `alex`.
    Steps: 1. Trigger OTP verification for new user. 2. Verify helper attempts `alex`, sees unavailable, then uses `alex2`. 3. Confirm `PATCH /v1/user` payload uses `alex2`.
    Expected Result: `alex2` stored and visible in `GET /v1/user`.
    Evidence: Response body captured.

    Scenario: Failure does not block login
    Tool: Bash (simulated failure)
    Preconditions: Temporarily force `/v1/user` to return 500 (dev env or mock).
    Steps: 1. Trigger OTP verification. 2. Confirm user session is established even if username update fails.
    Expected Result: Auth succeeds; username update failure is logged but does not crash flow.
    Evidence: Console log/output captured.

    **Commit**: NO

---

## Commit Strategy

| After Task | Message | Files | Verification |
| ---------- | ------- | ----- | ------------ |
| None       | N/A     | N/A   | N/A          |

---

## Success Criteria

### Verification Commands

```bash
# No automated tests requested
```

### Final Checklist

- [x] New OTP registrations result in a backend username.
- [x] Username conforms to backend rules (3–20, alphanumeric only, lowercase).
- [x] Collision handling uses numeric suffix with no separator.
- [x] Auth flow still completes even if username update fails.
