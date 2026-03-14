import { createClient } from '@supabase/supabase-js';

import { smokeConfig } from './smoke-config';

export type SmokeState = {
  id: string;
  user_a_email: string;
  user_b_email: string;
  rsvp_event_id: string | null;
  registration_event_id: string | null;
  enabled: boolean;
};

export type SmokeStep = {
  name: string;
  status: 'passed' | 'failed';
  duration_ms: number;
  message?: string;
};

const admin = createClient(smokeConfig.supabaseUrl, smokeConfig.serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export async function getSmokeState(): Promise<SmokeState> {
  const { data, error } = await admin
    .from('smoke_test_state')
    .select('id, user_a_email, user_b_email, rsvp_event_id, registration_event_id, enabled')
    .eq('id', smokeConfig.stateId)
    .single();

  if (error || !data) {
    throw new Error(
      `Could not load smoke_test_state ${smokeConfig.stateId}: ${error?.message || 'not found'}`
    );
  }

  return data as SmokeState;
}

export async function updateSmokeState(
  patch: Partial<SmokeState> & { last_error?: string | null; last_success_at?: string | null }
) {
  const { error } = await admin
    .from('smoke_test_state')
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq('id', smokeConfig.stateId);

  if (error) {
    throw new Error(`Failed to update smoke_test_state: ${error.message}`);
  }
}

export async function createRun(runId: string) {
  const { error } = await admin.from('smoke_test_runs').insert({
    id: runId,
    state_id: smokeConfig.stateId,
    status: 'running',
    started_at: new Date().toISOString(),
    steps: [],
  });

  if (error) {
    throw new Error(`Failed to create smoke_test_runs row: ${error.message}`);
  }
}

export async function completeRun(
  runId: string,
  status: 'passed' | 'failed',
  steps: SmokeStep[],
  errorSummary?: string
) {
  const { error } = await admin
    .from('smoke_test_runs')
    .update({
      status,
      steps,
      error_summary: errorSummary || null,
      finished_at: new Date().toISOString(),
    })
    .eq('id', runId);

  if (error) {
    throw new Error(`Failed to finalize smoke_test_runs row: ${error.message}`);
  }
}

export async function cleanupHistoricalRuns(keepDays: number) {
  const cutoff = new Date(Date.now() - keepDays * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await admin
    .from('smoke_test_runs')
    .delete()
    .eq('state_id', smokeConfig.stateId)
    .lt('started_at', cutoff);

  if (error) {
    throw new Error(`Failed cleaning old smoke_test_runs: ${error.message}`);
  }
}
