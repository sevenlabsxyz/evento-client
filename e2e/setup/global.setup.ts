import fs from 'node:fs/promises';

import { chromium, type FullConfig } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

import { assertSmokeGuards, smokeConfig } from '../helpers/smoke-config';

async function createMagicLink(email: string): Promise<string> {
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

  return actionLink;
}

async function loginAndSaveState(
  email: string,
  statePath: string,
  browser: Awaited<ReturnType<typeof chromium.launch>>
) {
  const actionLink = await createMagicLink(email);
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(actionLink, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const userRes = await page.request.get(`${smokeConfig.webBaseUrl}/api/v1/user`);
  if (!userRes.ok()) {
    const body = await userRes.text();
    throw new Error(`Authentication verification failed for ${email}: ${userRes.status()} ${body}`);
  }

  await context.storageState({ path: statePath });
  await context.close();
}

async function globalSetup(_config: FullConfig) {
  assertSmokeGuards();
  await fs.mkdir(smokeConfig.authDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    await loginAndSaveState(smokeConfig.userAEmail, smokeConfig.userAStatePath, browser);
    await loginAndSaveState(smokeConfig.userBEmail, smokeConfig.userBStatePath, browser);
  } finally {
    await browser.close();
  }
}

export default globalSetup;
