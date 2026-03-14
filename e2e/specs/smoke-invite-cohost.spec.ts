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
  start.setUTCDate(start.getUTCDate() + 9);
  start.setUTCHours(19, 0, 0, 0);
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

test('@collab invite flow and cohost invite flow', async () => {
  const runId = `smoke_invite_cohost_${Date.now()}`;
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

  let userB: UserDetails | null = null;
  let rsvpEventId = state.rsvp_event_id;

  try {
    await withStep('load users and RSVP event', async () => {
      const userAData = await apiGet<UserDetails[]>(userARequest, '/v1/user');
      const userBData = await apiGet<UserDetails[]>(userBRequest, '/v1/user');
      expect(userAData.length).toBeGreaterThan(0);
      expect(userBData.length).toBeGreaterThan(0);
      userB = userBData[0];

      if (!rsvpEventId) {
        const created = await apiPost<EventRecord[]>(userARequest, '/v1/events', {
          title: `smokersvp${nowStamp()}`,
          description: 'Smoke RSVP event for invite/cohost flows',
          location: null,
          timezone: 'UTC',
          visibility: 'private',
          type: 'rsvp',
          ...buildEventDates(),
        });
        rsvpEventId = created[0].id;
        await updateSmokeState({ rsvp_event_id: rsvpEventId, last_error: null });
      }
    });

    await withStep('invite flow', async () => {
      await apiPost(userARequest, `/v1/events/${rsvpEventId}/invites`, {
        invites: [{ id: userB?.id }],
        message: `smoke invite ${runId}`,
      });

      const pending = await apiGet<Array<{ id: string; event_id: string }>>(
        userBRequest,
        '/v1/events/invites?status=pending'
      );
      const pendingInvite = pending.find((i) => i.event_id === rsvpEventId);
      expect(pendingInvite).toBeTruthy();

      await apiPatch(userBRequest, `/v1/events/${rsvpEventId}/invites`, {
        status: 'responded',
        response: 'yes',
      });

      const responded = await apiGet<Array<{ event_id: string; response: string }>>(
        userBRequest,
        '/v1/events/invites?status=responded'
      );
      expect(
        responded.some((i) => i.event_id === rsvpEventId && i.response === 'yes')
      ).toBeTruthy();
    });

    await withStep('cohost invite flow', async () => {
      await userARequest.delete(`/api/v1/events/${rsvpEventId}/hosts`, {
        data: { hostId: userB?.id },
      });

      await apiPost(userARequest, `/v1/events/${rsvpEventId}/cohost-invites`, {
        invites: [{ userId: userB?.id }],
        message: `smoke cohost ${runId}`,
      });

      const pending = await apiGet<Array<{ id: string; event_id: string }>>(
        userBRequest,
        '/v1/user/cohost-invites?status=pending'
      );
      const invite = pending.find((row) => row.event_id === rsvpEventId);
      expect(invite).toBeTruthy();

      await apiPatch(userBRequest, `/v1/cohost-invites/${invite?.id}/accept`);

      const eventData = await apiGet<EventRecord>(userBRequest, `/v1/events/${rsvpEventId}`);
      await apiPatch(userBRequest, `/v1/events/${rsvpEventId}`, {
        title: `smokecohost${nowStamp()}`,
        description: eventData.description || '',
        status: eventData.status,
        timezone: eventData.timezone,
        visibility: eventData.visibility,
        cover: eventData.cover,
        start_date_day: eventData.start_date_day,
        start_date_month: eventData.start_date_month,
        start_date_year: eventData.start_date_year,
        start_date_hours: eventData.start_date_hours,
        start_date_minutes: eventData.start_date_minutes,
        end_date_day: eventData.end_date_day,
        end_date_month: eventData.end_date_month,
        end_date_year: eventData.end_date_year,
        end_date_hours: eventData.end_date_hours,
        end_date_minutes: eventData.end_date_minutes,
        spotify_url: eventData.spotify_url,
        wavlake_url: eventData.wavlake_url,
        contrib_cashapp: eventData.contrib_cashapp,
        contrib_venmo: eventData.contrib_venmo,
        contrib_paypal: eventData.contrib_paypal,
        contrib_btclightning: eventData.contrib_btclightning,
        cost: eventData.cost,
      });
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
