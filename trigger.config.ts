import { defineConfig } from '@trigger.dev/sdk';

export default defineConfig({
  // Replace with your actual Trigger.dev project ref from the dashboard
  project: 'proj_evento',
  dirs: ['./trigger'],
  maxDuration: 300,
  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
});
