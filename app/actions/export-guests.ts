'use server';

import { Env } from '@/lib/constants/env';
import { sanitizeFileName } from '@/lib/utils/file';
import { createClient } from '@supabase/supabase-js';

// Minimal Guest type contract expected from the client
type GuestUserDetails = {
  username?: string | null;
  name?: string | null;
};

export type GuestForExport = {
  id?: string;
  user_id: string;
  status?: string | null;
  created_at?: string | null;
  user_details?: GuestUserDetails | null;
};

function getSupabaseAdmin() {
  if (!Env.NEXT_PUBLIC_SUPABASE_URL || !Env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase server environment is not configured');
  }
  return createClient(Env.NEXT_PUBLIC_SUPABASE_URL, Env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function exportGuestsCsvAction(params: {
  guests: GuestForExport[];
  eventTitle: string;
}) {
  const { guests, eventTitle } = params;
  const supabase = getSupabaseAdmin();

  // Fetch emails for each guest via Admin API
  const emailResults = await Promise.all(
    guests.map(async (g) => {
      try {
        const { data } = await supabase.auth.admin.getUserById(g.user_id);
        return { userId: g.user_id, email: data.user?.email ?? '' };
      } catch {
        return { userId: g.user_id, email: '' };
      }
    })
  );

  const emailMap = new Map(emailResults.map((r) => [r.userId, r.email]));

  // Produce CSV rows (ALL guests provided)
  const rows = guests.map((g) => {
    const username = g.user_details?.username || '';
    const profileUrl = username ? `https://evento.so/${username}` : '';
    const rsvpTs = g.created_at || '';

    return [
      g.user_details?.name || '',
      username,
      emailMap.get(g.user_id) || '',
      g.status || '',
      rsvpTs,
      profileUrl,
    ];
  });

  const headers = ['Name', 'Username', 'Email', 'RSVP Status', 'RSVP Timestamp', 'Evento Profile'];

  const csv = [headers, ...rows]
    .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const date = new Date().toISOString().split('T')[0];
  const filename = `guest-list-${sanitizeFileName(eventTitle)}-${date}.csv`;

  return { filename, csv };
}
