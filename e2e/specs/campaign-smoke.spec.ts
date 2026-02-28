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
  email?: string;
  username?: string | null;
};

type EventRecord = {
  id: string;
  creator_user_id: string;
  title: string;
  timezone: string;
  visibility: 'public' | 'private';
  status: 'published' | 'draft';
  type?: 'rsvp' | 'registration' | 'ticketed';
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
};

type CampaignRecord = {
  id: string;
  event_id: string | null;
  scope: 'event' | 'profile';
  status: 'active' | 'paused' | 'closed';
  visibility: 'public' | 'private';
  raised_sats: number;
  pledge_count: number;
};

type PledgeIntent = {
  pledgeId: string;
  invoice: string;
  amountSats: number;
  expiresAt: string;
};

type PledgeStatus = {
  status: 'pending' | 'settled' | 'expired' | 'failed';
  amountSats: number;
  settledAt?: string;
};

type CampaignFeedItem = {
  payer_username: string | null;
  payer_avatar: string | null;
  amount_sats: number;
  settled_at: string | null;
};

function nowStamp() {
  const d = new Date();
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
}

function buildEventDates() {
  const start = new Date();
  start.setUTCDate(start.getUTCDate() + 10);
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

async function apiPatch<T>(request: APIRequestContext, path: string, data: unknown): Promise<T> {
  const response = await request.patch(`/api${path}`, { data });
  const body = (await response.json()) as ApiEnvelope<T>;

  if (!response.ok() || body.success === false) {
    throw new Error(`PATCH ${path} failed: ${body.message || body.error || response.status()}`);
  }

  return body.data as T;
}

test('@campaign campaign smoke flow host enablement attendee pledge settlement feed', async () => {
  const runId = `campaign_smoke_${Date.now()}`;
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

  if (
    state.user_a_email !== smokeConfig.userAEmail ||
    state.user_b_email !== smokeConfig.userBEmail
  ) {
    throw new Error('Configured smoke users do not match smoke_test_state table.');
  }

  const userAToken = JSON.parse(await fs.readFile(smokeConfig.userAStatePath, 'utf8')) as {
    accessToken: string;
  };
  const userBToken = JSON.parse(await fs.readFile(smokeConfig.userBStatePath, 'utf8')) as {
    accessToken: string;
  };

  const userARequest = await playwrightRequest.newContext({
    baseURL: smokeConfig.webBaseUrl,
    extraHTTPHeaders: {
      Authorization: `Bearer ${userAToken.accessToken}`,
    },
  });

  const userBRequest = await playwrightRequest.newContext({
    baseURL: smokeConfig.webBaseUrl,
    extraHTTPHeaders: {
      Authorization: `Bearer ${userBToken.accessToken}`,
    },
  });

  let eventId = '';
  let pledgeId = '';

  try {
    await withStep('1) authenticate host and attendee API sessions', async () => {
      const host = await apiGet<UserDetails[]>(userARequest, '/v1/user');
      const attendee = await apiGet<UserDetails[]>(userBRequest, '/v1/user');

      expect(host.length).toBeGreaterThan(0);
      expect(attendee.length).toBeGreaterThan(0);
      expect(host[0].id).toBeTruthy();
      expect(attendee[0].id).toBeTruthy();
    });

    await withStep('2) host creates event and enables event campaign', async () => {
      const created = await apiPost<EventRecord[]>(userARequest, '/v1/events', {
        title: `smokecampaign${nowStamp()}`,
        description: 'Campaign smoke flow event',
        location: null,
        timezone: 'UTC',
        visibility: 'private',
        type: 'rsvp',
        ...buildEventDates(),
      });

      expect(created.length).toBeGreaterThan(0);
      eventId = created[0].id;

      const campaign = await apiPost<CampaignRecord>(userARequest, `/v1/events/${eventId}/campaign`, {
        title: 'Smoke campaign title',
        description: 'Smoke campaign description',
        goalSats: 5000,
        visibility: 'public',
        status: 'active',
      });

      expect(campaign.id).toBeTruthy();
      expect(campaign.scope).toBe('event');
      expect(campaign.event_id).toBe(eventId);
      expect(campaign.visibility).toBe('public');
      expect(campaign.status).toBe('active');
    });

    await withStep('3) host configures campaign and keeps it active', async () => {
      const updated = await apiPatch<CampaignRecord>(userARequest, `/v1/events/${eventId}/campaign`, {
        title: 'Smoke campaign title configured',
        goal_sats: 7500,
        status: 'active',
      });

      expect(updated.id).toBeTruthy();
      expect(updated.status).toBe('active');
      expect(updated.visibility).toBe('public');
    });

    await withStep('4) attendee creates pledge intent for event campaign', async () => {
      const intent = await apiPost<PledgeIntent>(userBRequest, `/v1/events/${eventId}/campaign/pledges`, {
        amountSats: 21,
      });

      expect(intent.pledgeId).toBeTruthy();
      expect(intent.invoice).toBeTruthy();
      expect(intent.amountSats).toBe(21);

      pledgeId = intent.pledgeId;
    });

    await withStep('5) settlement verification reaches settled pledge status', async () => {
      const maxAttempts = 12;
      const sleepMs = 5000;

      let finalStatus: PledgeStatus | null = null;

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        const status = await apiGet<PledgeStatus>(
          userBRequest,
          `/v1/campaign-pledges/${pledgeId}/status`
        );

        finalStatus = status;

        if (status.status === 'settled') {
          break;
        }

        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, sleepMs));
        }
      }

      expect(finalStatus).toBeTruthy();
      expect(finalStatus?.status).toBe('settled');
      expect(finalStatus?.settledAt).toBeTruthy();
    });

    await withStep('6) public campaign feed returns safe settled-only fields', async () => {
      const feed = await apiGet<CampaignFeedItem[]>(userBRequest, `/v1/events/${eventId}/campaign/feed`);

      expect(Array.isArray(feed)).toBeTruthy();
      expect(feed.length).toBeGreaterThan(0);

      for (const item of feed) {
        expect(Object.keys(item).sort()).toEqual([
          'amount_sats',
          'payer_avatar',
          'payer_username',
          'settled_at',
        ]);
        expect(item.amount_sats).toBeGreaterThan(0);
        expect(item.settled_at).toBeTruthy();

        const unsafe = item as CampaignFeedItem & {
          payment_hash?: string;
          preimage?: string;
          verify_url?: string;
          bolt11_invoice?: string;
        };

        expect(unsafe.payment_hash).toBeUndefined();
        expect(unsafe.preimage).toBeUndefined();
        expect(unsafe.verify_url).toBeUndefined();
        expect(unsafe.bolt11_invoice).toBeUndefined();
      }
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
