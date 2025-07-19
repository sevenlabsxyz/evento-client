import { Env } from '@/lib/constants/env';
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = Env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = Env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!Env.NEXT_PUBLIC_SUPABASE_URL || !Env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseKey);
}

// For backward compatibility, create a default client
export const supabase = createClient();
