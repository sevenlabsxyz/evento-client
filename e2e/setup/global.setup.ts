import fs from 'node:fs/promises';

import type { FullConfig } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

import { assertSmokeGuards, smokeConfig } from '../helpers/smoke-config';

async function createMagicLink(email: string) {
  const admin = createClient(smokeConfig.supabaseUrl, smokeConfig.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: {
      redirectTo: `${smokeConfig.webBaseUrl}/auth/callback`,
    },
  });

  if (error) {
    throw new Error(`Failed to generate magic link for ${email}: ${error.message}`);
  }

  const actionLink = data.properties?.action_link;
  if (!actionLink) {
    throw new Error(`No action_link returned for ${email}`);
  }

  return {
    actionLink,
    emailOtp: data.properties?.email_otp || '',
    hashedToken: data.properties?.hashed_token || '',
  };
}

async function createAccessToken(email: string): Promise<string> {
  const { actionLink, emailOtp, hashedToken } = await createMagicLink(email);
  const url = new URL(actionLink);
  const token = url.searchParams.get('token') || '';
  const tokenHash = url.searchParams.get('token_hash') || '';

  const anon = createClient(smokeConfig.supabaseUrl, smokeConfig.supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  if (token) {
    const { data, error } = await anon.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    if (!error && data.session?.access_token) {
      return data.session.access_token;
    }
  }

  if (tokenHash || hashedToken) {
    const { data, error } = await anon.auth.verifyOtp({
      token_hash: tokenHash || hashedToken,
      type: 'magiclink',
    });

    if (!error && data.session?.access_token) {
      return data.session.access_token;
    }
  }

  if (emailOtp) {
    const { data, error } = await anon.auth.verifyOtp({
      email,
      token: emailOtp,
      type: 'email',
    });

    if (!error && data.session?.access_token) {
      return data.session.access_token;
    }
  }

  throw new Error(`Failed to establish auth session for ${email} from generated magic link.`);
}

async function loginAndSaveState(email: string, statePath: string) {
  const accessToken = await createAccessToken(email);
  await fs.writeFile(statePath, JSON.stringify({ accessToken }, null, 2), 'utf8');
}

async function globalSetup(_config: FullConfig) {
  assertSmokeGuards();
  await fs.mkdir(smokeConfig.authDir, { recursive: true });

  await loginAndSaveState(smokeConfig.userAEmail, smokeConfig.userAStatePath);
  await loginAndSaveState(smokeConfig.userBEmail, smokeConfig.userBStatePath);
}

export default globalSetup;
