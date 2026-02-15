import path from 'node:path';

const truthy = new Set(['1', 'true', 'yes', 'on']);

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export function isEnabledFlag(value: string | undefined): boolean {
  if (!value) return false;
  return truthy.has(value.toLowerCase());
}

export const smokeConfig = {
  allowProd: isEnabledFlag(process.env.SMOKE_ALLOW_PROD),
  webBaseUrl: required('SMOKE_WEB_BASE_URL').replace(/\/$/, ''),
  apiBaseUrl: required('SMOKE_API_BASE_URL').replace(/\/$/, ''),
  stateId: process.env.SMOKE_STATE_ID?.trim() || 'core_prod',
  environment: process.env.SMOKE_ENVIRONMENT?.trim() || 'prod',
  suiteName: process.env.SMOKE_SUITE_NAME?.trim() || 'core',
  runProfileImage: isEnabledFlag(process.env.SMOKE_RUN_PROFILE_IMAGE),
  userAEmail: required('SMOKE_USER_A_EMAIL').toLowerCase(),
  userBEmail: required('SMOKE_USER_B_EMAIL').toLowerCase(),
  supabaseUrl: required('NEXT_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: required('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  serviceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
  authDir: path.resolve(process.cwd(), 'e2e/.auth'),
  userAStatePath: path.resolve(process.cwd(), 'e2e/.auth/user-a.json'),
  userBStatePath: path.resolve(process.cwd(), 'e2e/.auth/user-b.json'),
};

export function assertSmokeGuards() {
  if (!smokeConfig.allowProd) {
    throw new Error('SMOKE_ALLOW_PROD must be true to run smoke tests.');
  }

  const allowedEmails = [smokeConfig.userAEmail, smokeConfig.userBEmail];
  for (const email of allowedEmails) {
    if (!email.includes('@')) {
      throw new Error(`Invalid smoke email: ${email}`);
    }
  }
}
