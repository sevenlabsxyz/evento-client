import fs from 'node:fs/promises';

import {
  expect,
  request as playwrightRequest,
  test,
  type APIRequestContext,
} from '@playwright/test';

import { smokeConfig } from '../helpers/smoke-config';
import {
  completeRun,
  createRun,
  getSmokeState,
  updateSmokeState,
  type SmokeStep,
} from '../helpers/smoke-state';

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  error?: string;
};

type UserDetails = {
  id: string;
  name?: string | null;
  bio?: string | null;
  bio_link?: string | null;
  x_handle?: string | null;
  instagram_handle?: string | null;
};

type EventRecord = {
  id: string;
  title: string;
  description: string | null;
  timezone: string;
  visibility: 'public' | 'private';
  status: 'published' | 'draft';
  cover?: string | null;
  start_date_day: number;
  start_date_month: number;
  start_date_year: number;
  start_date_hours?: number | null;
  start_date_minutes?: number | null;
  end_date_day: number;
  end_date_month: number;
  end_date_year: number;
  end_date_hours?: number | null;
  end_date_minutes?: number | null;
  spotify_url?: string | null;
  wavlake_url?: string | null;
  contrib_cashapp?: string | null;
  contrib_venmo?: string | null;
  contrib_paypal?: string | null;
  contrib_btclightning?: string | null;
  cost?: string | null;
};

function nowStamp() {
  const d = new Date();
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
}

function buildEventDates() {
  const start = new Date();
  start.setUTCDate(start.getUTCDate() + 10);
  start.setUTCHours(18, 0, 0, 0);
  const end = new Date(start);
  end.setUTCHours(start.getUTCHours() + 2);

  return {
    start_date_day: start.getUTCDate(),
    start_date_month: start.getUTCMonth() + 1,
    start_date_year: start.getUTCFullYear(),
    start_date_hours: start.getUTCHours(),
    start_date_minutes: start.getUTCMinutes(),
    end_date_day: end.getUTCDate(),
    end_date_month: end.getUTCMonth() + 1,
    end_date_year: end.getUTCFullYear(),
    end_date_hours: end.getUTCHours(),
    end_date_minutes: end.getUTCMinutes(),
  };
}

async function apiGet<T>(request: APIRequestContext, path: string): Promise<T> {
  const response = await request.get(`/api${path}`);
  const body = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok() || body.success === false) {
    throw new Error(`GET ${path} failed: ${body.message || body.error || response.status()}`);
  }
  return body.data as T;
}

async function apiPost<T>(request: APIRequestContext, path: string, data?: unknown): Promise<T> {
  const response = await request.post(`/api${path}`, { data });
  const body = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok() || body.success === false) {
    throw new Error(`POST ${path} failed: ${body.message || body.error || response.status()}`);
  }
  return body.data as T;
}

async function apiPatch<T>(request: APIRequestContext, path: string, data?: unknown): Promise<T> {
  const response = await request.patch(`/api${path}`, { data });
  const body = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok() || body.success === false) {
    throw new Error(`PATCH ${path} failed: ${body.message || body.error || response.status()}`);
  }
  return body.data as T;
}

test('@guards registration deny flow, profile update pack, and access guards', async () => {
  const runId = `smoke_reg_profile_guard_${Date.now()}`;
  const steps: SmokeStep[] = [];

  await createRun(runId);

  const withStep = async (name: string, fn: () => Promise<void>) => {
    const start = Date.now();
    try {
      await fn();
      steps.push({ name, status: 'passed', duration_ms: Date.now() - start });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      steps.push({ name, status: 'failed', duration_ms: Date.now() - start, message });
      throw error;
    }
  };

  const state = await getSmokeState();
  if (!state.enabled) {
    test.skip(true, `smoke_test_state ${state.id} is disabled`);
  }

  const userAToken = JSON.parse(await fs.readFile(smokeConfig.userAStatePath, 'utf8')) as {
    accessToken: string;
  };
  const userBToken = JSON.parse(await fs.readFile(smokeConfig.userBStatePath, 'utf8')) as {
    accessToken: string;
  };

  const userARequest = await playwrightRequest.newContext({
    baseURL: smokeConfig.webBaseUrl,
    extraHTTPHeaders: { Authorization: `Bearer ${userAToken.accessToken}` },
  });
  const userBRequest = await playwrightRequest.newContext({
    baseURL: smokeConfig.webBaseUrl,
    extraHTTPHeaders: { Authorization: `Bearer ${userBToken.accessToken}` },
  });

  let denyEventId = '';
  let denyRegistrationId = '';
  let guardEventId = '';

  try {
    await withStep('registration deny flow', async () => {
      const created = await apiPost<EventRecord[]>(userARequest, '/v1/events', {
        title: `smokedeny${nowStamp()}`,
        description: 'Smoke registration deny event',
        location: null,
        timezone: 'UTC',
        visibility: 'private',
        type: 'registration',
        ...buildEventDates(),
      });
      denyEventId = created[0].id;

      await apiPatch(userARequest, `/v1/events/${denyEventId}/registration`, {
        registration_required: true,
        approval_mode: 'manual',
      });

      const question = await apiPost<{ id: string }>(
        userARequest,
        `/v1/events/${denyEventId}/registration/questions`,
        {
          type: 'text',
          label: 'Smoke deny question',
          placeholder: 'Answer',
          is_required: true,
        }
      );

      const submitted = await apiPost<{ registration_id: string }>(
        userBRequest,
        `/v1/events/${denyEventId}/registration/submit`,
        {
          email: smokeConfig.userBEmail,
          name: 'SmokeUserB',
          answers: [{ question_id: question.id, answer: 'deny-flow' }],
        }
      );
      denyRegistrationId = submitted.registration_id;

      await apiPost(
        userARequest,
        `/v1/events/${denyEventId}/registration/submissions/${denyRegistrationId}/deny`,
        { reason: 'smoke deny validation' }
      );

      const details = await apiGet<{ approval_status: string; denial_reason: string | null }>(
        userARequest,
        `/v1/events/${denyEventId}/registration/submissions/${denyRegistrationId}`
      );
      expect(details.approval_status).toBe('denied');
      expect(details.denial_reason).toBe('smoke deny validation');
    });

    await withStep('user profile update pack with restore', async () => {
      const current = await apiGet<UserDetails[]>(userARequest, '/v1/user');
      const original = current[0];

      const patch = {
        name: `Smoke${nowStamp()}`,
        bio: `Smoke bio ${runId}`,
        bio_link: 'https://evento.so',
        x_handle: 'evento',
        instagram_handle: 'evento',
      };

      await apiPatch(userARequest, '/v1/user', patch);
      const changed = await apiGet<UserDetails[]>(userARequest, '/v1/user');
      expect(changed[0].name).toBe(patch.name);
      expect(changed[0].bio).toBe(patch.bio);

      await apiPatch(userARequest, '/v1/user', {
        name: original.name || '',
        bio: original.bio || '',
        bio_link: original.bio_link || '',
        x_handle: original.x_handle || '',
        instagram_handle: original.instagram_handle || '',
      });
    });

    await withStep('access control guards', async () => {
      const guardCreated = await apiPost<EventRecord[]>(userARequest, '/v1/events', {
        title: `smokeguard${nowStamp()}`,
        description: 'Guard validation event',
        location: null,
        timezone: 'UTC',
        visibility: 'private',
        type: 'rsvp',
        ...buildEventDates(),
      });
      guardEventId = guardCreated[0].id;

      const baseEvent = await apiGet<EventRecord>(userARequest, `/v1/events/${guardEventId}`);

      const editRes = await userBRequest.patch(`/api/v1/events/${guardEventId}`, {
        data: {
          title: `blocked${nowStamp()}`,
          description: baseEvent.description || '',
          status: baseEvent.status,
          timezone: baseEvent.timezone,
          visibility: baseEvent.visibility,
          cover: baseEvent.cover,
          start_date_day: baseEvent.start_date_day,
          start_date_month: baseEvent.start_date_month,
          start_date_year: baseEvent.start_date_year,
          start_date_hours: baseEvent.start_date_hours,
          start_date_minutes: baseEvent.start_date_minutes,
          end_date_day: baseEvent.end_date_day,
          end_date_month: baseEvent.end_date_month,
          end_date_year: baseEvent.end_date_year,
          end_date_hours: baseEvent.end_date_hours,
          end_date_minutes: baseEvent.end_date_minutes,
          spotify_url: baseEvent.spotify_url,
          wavlake_url: baseEvent.wavlake_url,
          contrib_cashapp: baseEvent.contrib_cashapp,
          contrib_venmo: baseEvent.contrib_venmo,
          contrib_paypal: baseEvent.contrib_paypal,
          contrib_btclightning: baseEvent.contrib_btclightning,
          cost: baseEvent.cost,
        },
      });
      expect([401].includes(editRes.status())).toBeTruthy();

      const regRes = await userBRequest.patch(`/api/v1/events/${guardEventId}/registration`, {
        data: { registration_required: true, approval_mode: 'manual' },
      });
      expect([403].includes(regRes.status())).toBeTruthy();

      const qRes = await userBRequest.post(
        `/api/v1/events/${guardEventId}/registration/questions`,
        {
          data: { type: 'text', label: 'blocked', is_required: true },
        }
      );
      expect([403].includes(qRes.status())).toBeTruthy();

      const approveRes = await userBRequest.post(
        `/api/v1/events/${denyEventId}/registration/submissions/${denyRegistrationId}/approve`
      );
      expect([403].includes(approveRes.status())).toBeTruthy();
    });

    await completeRun(runId, 'passed', steps);
    await updateSmokeState({ last_success_at: new Date().toISOString(), last_error: null });
  } catch (error) {
    const summary = error instanceof Error ? error.message : String(error);
    await completeRun(runId, 'failed', steps, summary);
    await updateSmokeState({ last_error: summary });
    throw error;
  } finally {
    await userARequest.dispose();
    await userBRequest.dispose();
  }
});
