# Smoke E2E Suite

This suite runs low-noise production-style smoke checks with two fixed users.

## What it validates

- User A and User B can authenticate using Supabase magic links.
- User A can create and edit an RSVP event.
- User B can RSVP yes to User A's RSVP event.
- User A can create/configure a registration event.
- User B can submit registration.
- User A can approve registration and User B ends with RSVP yes.
- Optional: User A profile image upload/update.

## Persistent state

The suite stores reusable IDs and run history in Supabase:

- `smoke_test_state`
- `smoke_test_runs`

Create those tables using:

- `evento-api/sql/create_smoke_test_tables.sql`

## Required environment variables

Set in your shell or `.env.local`:

- `SMOKE_ALLOW_PROD=true`
- `SMOKE_WEB_BASE_URL`
- `SMOKE_API_BASE_URL`
- `SMOKE_STATE_ID` (default `core_prod`)
- `SMOKE_ENVIRONMENT` (default `prod`)
- `SMOKE_SUITE_NAME` (default `core`)
- `SMOKE_USER_A_EMAIL`
- `SMOKE_USER_B_EMAIL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SMOKE_RUN_PROFILE_IMAGE=true` (optional)

## Run

```bash
pnpm test:e2e:smoke
```

Headed mode:

```bash
pnpm test:e2e:smoke:headed
```

Cleanup old run rows:

```bash
pnpm test:e2e:cleanup
```
