import 'dotenv/config';

import { defineConfig } from '@playwright/test';

const baseURL =
  process.env.SMOKE_WEB_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003';

export default defineConfig({
  testDir: './e2e/specs',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html']],
  globalSetup: './e2e/setup/global.setup.ts',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'smoke',
    },
  ],
});
