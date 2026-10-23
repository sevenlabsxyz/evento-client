import { Env } from '@/lib/constants/env';
import { getTestAuthCode, isTestAuthEmail, isTestAuthEnabled } from '@/lib/test-auth';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const disabled = () => NextResponse.json({ error: 'Not found' }, { status: 404 });

/**
 * Development-only session minting for allowlisted test emails.
 *
 * Flow: ensure the auth user exists, generate a magic-link token with the
 * service-role key (no email is sent), exchange it for a real session, and
 * return the tokens for the browser client to install.
 */
export async function POST(request: NextRequest) {
  if (!isTestAuthEnabled()) {
    return disabled();
  }

  if (!Env.NEXT_PUBLIC_SUPABASE_URL || !Env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Test auth is not configured' }, { status: 500 });
  }

  let body: { email?: unknown; code?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const code = typeof body.code === 'string' ? body.code.trim() : '';

  if (!isTestAuthEmail(email)) {
    return disabled();
  }

  if (code.length !== 6 || code !== getTestAuthCode()) {
    return NextResponse.json({ error: 'Invalid code. Please try again.' }, { status: 401 });
  }

  const admin = createClient(Env.NEXT_PUBLIC_SUPABASE_URL, Env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let link = await admin.auth.admin.generateLink({ type: 'magiclink', email });

  if (link.error) {
    // First login for this address: create the auth user, then retry.
    const created = await admin.auth.admin.createUser({ email, email_confirm: true });

    if (created.error && created.error.code !== 'email_exists') {
      console.error('Test auth: failed to create user', { email, error: created.error.message });
      return NextResponse.json({ error: 'Failed to prepare test user' }, { status: 500 });
    }

    link = await admin.auth.admin.generateLink({ type: 'magiclink', email });
  }

  const tokenHash = link.data?.properties?.hashed_token;

  if (link.error || !tokenHash) {
    console.error('Test auth: failed to generate magic link', {
      email,
      error: link.error?.message ?? 'missing hashed token',
    });
    return NextResponse.json({ error: 'Failed to prepare test session' }, { status: 500 });
  }

  const verifyResponse = await fetch(`${Env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/verify`, {
    method: 'POST',
    headers: {
      apikey: Env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type: 'magiclink', token_hash: tokenHash }),
  });

  const session = await verifyResponse.json().catch(() => null);

  if (!verifyResponse.ok || !session?.access_token || !session?.refresh_token) {
    console.error('Test auth: failed to verify magic link', {
      email,
      status: verifyResponse.status,
      error: session?.error_description ?? session?.msg ?? 'unknown',
    });
    return NextResponse.json({ error: 'Failed to create test session' }, { status: 500 });
  }

  return NextResponse.json({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });
}
