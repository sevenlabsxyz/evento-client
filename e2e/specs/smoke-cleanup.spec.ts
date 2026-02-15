import { test } from '@playwright/test';

import { cleanupHistoricalRuns, updateSmokeState } from '../helpers/smoke-state';

test('@cleanup cleanup old smoke run history', async () => {
  await cleanupHistoricalRuns(30);
  await updateSmokeState({ last_error: null });
});
