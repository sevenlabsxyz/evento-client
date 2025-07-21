import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/v1/user/events/count?id=<user_id>
// Returns the exact number of events a user is attending (status = "yes")
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawId = searchParams.get('id') || '';
  const userId = rawId.trim().toLowerCase();

  if (!userId) {
    return NextResponse.json(
      {
        success: false,
        message: 'Missing required query parameter "id".',
      },
      { status: 422 }
    );
  }

  // Create a server-side Supabase client. This uses the service credentials if
  // they are available (see lib/supabase/server.ts).
  const supabase = await createClient();

  const { count, error } = await supabase
    .from('event_rsvps')
    // We do a HEAD request with an exact count to avoid transferring rows.
    .select('*', {
      head: true,
      count: 'exact', // <-- exact instead of estimated
    })
    .eq('user_id', userId)
    .eq('status', 'yes');

  if (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || `Failed to fetch event count for user: ${userId}`,
      },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      data: { count: count || 0 },
    },
    { status: 200 }
  );
}