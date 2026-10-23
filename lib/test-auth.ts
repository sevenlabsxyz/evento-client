/**
 * Development-only fixed-code login used by automated agents.
 *
 * Supabase Auth owns OTP issuance, so a fixed code cannot be configured there.
 * Instead, allowlisted emails bypass Supabase OTP entirely: /api/test-auth
 * mints a real session with the service-role key and the client installs it
 * via supabase.auth.setSession().
 *
 * Hard guard: this is disabled in production builds regardless of env vars.
 * In development it defaults to enabled so the login flow works without
 * restarting the dev server; set NEXT_PUBLIC_TEST_AUTH_ENABLED=false to opt out.
 */
const DEFAULT_TEST_AUTH_EMAILS = ['agent@evento.test'];
const DEFAULT_TEST_AUTH_CODE = '123456';

export function isTestAuthEnabled(): boolean {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }

  return process.env.NEXT_PUBLIC_TEST_AUTH_ENABLED !== 'false';
}

export function getTestAuthEmails(): string[] {
  const configured = process.env.NEXT_PUBLIC_TEST_AUTH_EMAILS;

  if (!configured) {
    return DEFAULT_TEST_AUTH_EMAILS;
  }

  return configured
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isTestAuthEmail(email: string): boolean {
  if (!isTestAuthEnabled()) {
    return false;
  }

  return getTestAuthEmails().includes(email.trim().toLowerCase());
}

/** Server-only. Never import from client components. */
export function getTestAuthCode(): string {
  return process.env.TEST_AUTH_CODE || DEFAULT_TEST_AUTH_CODE;
}
