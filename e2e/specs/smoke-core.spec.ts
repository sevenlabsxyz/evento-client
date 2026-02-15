import { expect, test, type APIRequestContext } from '@playwright/test';

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
  image?: string | null;
};

type EventRecord = {
  id: string;
  creator_user_id: string;
  title: string;
  description: string | null;
  timezone: string;
  visibility: 'public' | 'private';
  status: 'published' | 'draft';
  type?: 'rsvp' | 'registration' | 'ticketed';
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
  start.setUTCDate(start.getUTCDate() + 7);
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

async function apiPatch<T>(request: APIRequestContext, path: string, data: unknown): Promise<T> {
  const response = await request.patch(`/api${path}`, { data });
  const body = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok() || body.success === false) {
    throw new Error(`PATCH ${path} failed: ${body.message || body.error || response.status()}`);
  }
  return body.data as T;
}

test('core smoke flow for two-user event lifecycle', async ({ browser }) => {
  const runId = `smoke_run_${Date.now()}`;
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

  const userAContext = await browser.newContext({
    baseURL: smokeConfig.webBaseUrl,
    storageState: smokeConfig.userAStatePath,
  });
  const userBContext = await browser.newContext({
    baseURL: smokeConfig.webBaseUrl,
    storageState: smokeConfig.userBStatePath,
  });

  const userARequest = userAContext.request;
  const userBRequest = userBContext.request;

  let userA: UserDetails | null = null;
  let userB: UserDetails | null = null;
  let rsvpEventId = state.rsvp_event_id;
  let registrationEventId = state.registration_event_id;

  try {
    await withStep('authenticate user A and user B sessions', async () => {
      const userAData = await apiGet<UserDetails[]>(userARequest, '/v1/user');
      const userBData = await apiGet<UserDetails[]>(userBRequest, '/v1/user');
      expect(userAData.length).toBeGreaterThan(0);
      expect(userBData.length).toBeGreaterThan(0);
      userA = userAData[0];
      userB = userBData[0];
      expect(userA.id).toBeTruthy();
      expect(userB.id).toBeTruthy();
    });

    await withStep('ensure reusable RSVP event exists', async () => {
      let event: EventRecord | null = null;
      if (rsvpEventId) {
        try {
          event = await apiGet<EventRecord>(userARequest, `/v1/events/${rsvpEventId}`);
        } catch {
          event = null;
        }
      }

      if (!event) {
        const title = `smokersvp${nowStamp()}`;
        const created = await apiPost<EventRecord[]>(userARequest, '/v1/events', {
          title,
          description: 'Smoke RSVP flow event',
          location: null,
          timezone: 'UTC',
          visibility: 'private',
          type: 'rsvp',
          ...buildEventDates(),
        });
        expect(created.length).toBeGreaterThan(0);
        rsvpEventId = created[0].id;
        await updateSmokeState({ rsvp_event_id: rsvpEventId, last_error: null });
      }

      expect(rsvpEventId).toBeTruthy();
    });

    await withStep('user A edits RSVP event', async () => {
      const existing = await apiGet<EventRecord>(userARequest, `/v1/events/${rsvpEventId}`);
      expect(existing.creator_user_id).toBe(userA?.id);
      const updatedTitle = `smokersvp${nowStamp()}edit`;

      await apiPatch<EventRecord[]>(userARequest, `/v1/events/${rsvpEventId}`, {
        title: updatedTitle,
        description: `Updated by smoke run ${runId}`,
        status: existing.status,
        timezone: existing.timezone,
        visibility: existing.visibility,
        cover: existing.cover,
        start_date_day: existing.start_date_day,
        start_date_month: existing.start_date_month,
        start_date_year: existing.start_date_year,
        start_date_hours: existing.start_date_hours,
        start_date_minutes: existing.start_date_minutes,
        end_date_day: existing.end_date_day,
        end_date_month: existing.end_date_month,
        end_date_year: existing.end_date_year,
        end_date_hours: existing.end_date_hours,
        end_date_minutes: existing.end_date_minutes,
        spotify_url: existing.spotify_url,
        wavlake_url: existing.wavlake_url,
        contrib_cashapp: existing.contrib_cashapp,
        contrib_venmo: existing.contrib_venmo,
        contrib_paypal: existing.contrib_paypal,
        contrib_btclightning: existing.contrib_btclightning,
        cost: existing.cost,
      });

      const verify = await apiGet<EventRecord>(userARequest, `/v1/events/${rsvpEventId}`);
      expect(verify.title).toBe(updatedTitle);
    });

    await withStep('user B RSVPs yes to RSVP event', async () => {
      await apiPost(userBRequest, `/v1/events/${rsvpEventId}/rsvps`, {
        event_id: rsvpEventId,
        status: 'yes',
      });

      const me = await apiGet<Array<{ status: string }>>(
        userBRequest,
        `/v1/events/${rsvpEventId}/rsvps/me`
      );
      expect(Array.isArray(me)).toBeTruthy();
      expect(me.length).toBeGreaterThan(0);
      expect(me[0].status).toBe('yes');
    });

    await withStep('ensure reusable registration event exists', async () => {
      let event: EventRecord | null = null;
      if (registrationEventId) {
        try {
          event = await apiGet<EventRecord>(userARequest, `/v1/events/${registrationEventId}`);
        } catch {
          event = null;
        }
      }

      if (!event) {
        const title = `smokeregistration${nowStamp()}`;
        const created = await apiPost<EventRecord[]>(userARequest, '/v1/events', {
          title,
          description: 'Smoke registration flow event',
          location: null,
          timezone: 'UTC',
          visibility: 'private',
          type: 'registration',
          ...buildEventDates(),
        });
        expect(created.length).toBeGreaterThan(0);
        registrationEventId = created[0].id;
        await updateSmokeState({ registration_event_id: registrationEventId, last_error: null });
      }

      expect(registrationEventId).toBeTruthy();
    });

    let questionId = '';

    await withStep(
      'user A configures registration manual approval and required question',
      async () => {
        await apiPatch(userARequest, `/v1/events/${registrationEventId}/registration`, {
          registration_required: true,
          approval_mode: 'manual',
        });

        const questions = await apiGet<Array<{ id: string; is_required: boolean; type: string }>>(
          userARequest,
          `/v1/events/${registrationEventId}/registration/questions`
        );

        const requiredText = questions.find((q) => q.is_required && q.type === 'text');
        if (requiredText) {
          questionId = requiredText.id;
        } else {
          const created = await apiPost<{ id: string }>(
            userARequest,
            `/v1/events/${registrationEventId}/registration/questions`,
            {
              type: 'text',
              label: 'Smoke question',
              placeholder: 'Smoke answer',
              is_required: true,
            }
          );
          questionId = created.id;
        }

        expect(questionId).toBeTruthy();
      }
    );

    let registrationId = '';
    let approvalStatus: 'pending' | 'approved' = 'pending';

    await withStep('user B submits registration for registration event', async () => {
      try {
        const submitted = await apiPost<{
          registration_id: string;
          status: 'pending' | 'approved';
        }>(userBRequest, `/v1/events/${registrationEventId}/registration/submit`, {
          email: smokeConfig.userBEmail,
          name: 'SmokeUserB',
          answers: [
            {
              question_id: questionId,
              answer: 'yes',
            },
          ],
        });
        registrationId = submitted.registration_id;
        approvalStatus = submitted.status;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!message.includes('already registered')) {
          throw error;
        }

        const list = await apiGet<{
          registrations: Array<{
            id: string;
            email: string;
            approval_status: 'pending' | 'approved' | 'denied';
          }>;
        }>(
          userARequest,
          `/v1/events/${registrationEventId}/registration/submissions?status=all&limit=100&offset=0`
        );

        const existing = list.registrations.find(
          (r) => r.email.toLowerCase() === smokeConfig.userBEmail && r.approval_status !== 'denied'
        );
        if (!existing) {
          throw new Error(
            'Registration exists message received but no matching registration found.'
          );
        }

        registrationId = existing.id;
        approvalStatus = existing.approval_status === 'approved' ? 'approved' : 'pending';
      }

      expect(registrationId).toBeTruthy();
    });

    await withStep('user A approves registration and user B RSVP reflects yes', async () => {
      if (approvalStatus === 'pending') {
        await apiPost(
          userARequest,
          `/v1/events/${registrationEventId}/registration/submissions/${registrationId}/approve`
        );
      }

      const list = await apiGet<{
        registrations: Array<{ id: string; approval_status: string }>;
      }>(
        userARequest,
        `/v1/events/${registrationEventId}/registration/submissions?status=all&limit=100&offset=0`
      );

      const row = list.registrations.find((r) => r.id === registrationId);
      expect(row).toBeTruthy();
      expect(row?.approval_status).toBe('approved');

      const bRsvp = await apiGet<Array<{ status: string }>>(
        userBRequest,
        `/v1/events/${registrationEventId}/rsvps/me`
      );
      expect(bRsvp.length).toBeGreaterThan(0);
      expect(bRsvp[0].status).toBe('yes');
    });

    if (smokeConfig.runProfileImage) {
      await withStep('user A updates profile image through upload + profile update', async () => {
        const uploadResponse = await userARequest.post(
          `/api/v1/user/details/image-upload?filename=smoke.png`,
          {
            headers: {
              'content-type': 'application/octet-stream',
            },
            data: Buffer.from(`smoke-image-${runId}`),
          }
        );
        const uploadBody = (await uploadResponse.json()) as ApiEnvelope<{ image: string }>;
        if (!uploadResponse.ok() || uploadBody.success === false || !uploadBody.data?.image) {
          throw new Error(
            `Profile image upload failed: ${uploadBody.message || uploadBody.error || uploadResponse.status()}`
          );
        }

        await apiPatch(userARequest, '/v1/user', {
          image: uploadBody.data.image,
        });

        const me = await apiGet<UserDetails[]>(userARequest, '/v1/user');
        expect(me.length).toBeGreaterThan(0);
        expect(me[0].image).toBe(uploadBody.data.image);
      });
    }

    await completeRun(runId, 'passed', steps);
    await updateSmokeState({
      rsvp_event_id: rsvpEventId,
      registration_event_id: registrationEventId,
      last_success_at: new Date().toISOString(),
      last_error: null,
    });
  } catch (error) {
    const summary = error instanceof Error ? error.message : String(error);
    await completeRun(runId, 'failed', steps, summary);
    await updateSmokeState({ last_error: summary });
    throw error;
  } finally {
    await userAContext.close();
    await userBContext.close();
  }
});
