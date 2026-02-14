import { Env } from '@/lib/constants/env';
import type { sendWalletInviteTask } from '@/trigger/send-wallet-invite';
import { tasks } from '@trigger.dev/sdk';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface NotifyRequestBody {
  recipientUsername: string;
}

interface NotifyResponse {
  success: boolean;
  status: 'sent' | 'already_notified' | 'error';
  message?: string;
}

const notifiedPairs = new Map<string, number>();
const DEDUPE_WINDOW_MS = 24 * 60 * 60 * 1000;

function buildDedupeKey(senderUsername: string, recipientUsername: string): string {
  return `${senderUsername}:${recipientUsername}`;
}

function isDuplicate(key: string): boolean {
  const lastNotified = notifiedPairs.get(key);
  if (!lastNotified) return false;
  return Date.now() - lastNotified < DEDUPE_WINDOW_MS;
}

function recordNotification(key: string): void {
  notifiedPairs.set(key, Date.now());

  if (notifiedPairs.size > 10000) {
    const now = Date.now();
    for (const [k, v] of notifiedPairs) {
      if (now - v >= DEDUPE_WINDOW_MS) {
        notifiedPairs.delete(k);
      }
    }
  }
}

async function fetchUserFromBackend(
  username: string,
  cookieHeader: string | null
): Promise<{ id: string; username: string; name: string | null; email: string | null } | null> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (cookieHeader) {
      headers['cookie'] = cookieHeader;
    }

    const response = await fetch(`${Env.API_PROXY_TARGET}/v1/users/username/${username}`, {
      headers,
      credentials: 'include',
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data?.data ?? null;
  } catch {
    return null;
  }
}

async function fetchCurrentUser(
  cookieHeader: string | null
): Promise<{ id: string; username: string; name: string | null; email: string | null } | null> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (cookieHeader) {
      headers['cookie'] = cookieHeader;
    }

    const response = await fetch(`${Env.API_PROXY_TARGET}/v1/user`, {
      headers,
      credentials: 'include',
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data?.data ?? null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<NotifyResponse>> {
  try {
    let body: NotifyRequestBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, status: 'error', message: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const { recipientUsername } = body;

    if (!recipientUsername || typeof recipientUsername !== 'string') {
      return NextResponse.json(
        { success: false, status: 'error', message: 'recipientUsername is required' },
        { status: 400 }
      );
    }

    const cookieHeader = request.headers.get('cookie');

    const sender = await fetchCurrentUser(cookieHeader);
    if (!sender) {
      return NextResponse.json(
        { success: false, status: 'error', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const dedupeKey = buildDedupeKey(sender.username, recipientUsername);
    if (isDuplicate(dedupeKey)) {
      return NextResponse.json({
        success: true,
        status: 'already_notified',
        message: 'Recipient was already notified in the last 24 hours',
      });
    }

    const recipient = await fetchUserFromBackend(recipientUsername, cookieHeader);
    if (!recipient) {
      return NextResponse.json(
        { success: false, status: 'error', message: 'Recipient user not found' },
        { status: 404 }
      );
    }

    if (!recipient.email) {
      return NextResponse.json(
        { success: false, status: 'error', message: 'Recipient has no email on file' },
        { status: 422 }
      );
    }

    if (!sender.email) {
      return NextResponse.json(
        { success: false, status: 'error', message: 'Sender has no email on file' },
        { status: 422 }
      );
    }

    await tasks.trigger<typeof sendWalletInviteTask>('send-wallet-invite-email', {
      recipientUsername: recipient.username,
      recipientEmail: recipient.email,
      recipientName: recipient.name || recipient.username,
      senderName: sender.name || sender.username,
      senderUsername: sender.username,
      senderEmail: sender.email,
    });

    recordNotification(dedupeKey);

    return NextResponse.json({
      success: true,
      status: 'sent',
      message: 'Wallet invite notification triggered',
    });
  } catch (error) {
    console.error('Wallet notify error:', error);

    return NextResponse.json(
      {
        success: false,
        status: 'error',
        message: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
