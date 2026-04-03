import { Env } from '@/lib/constants/env';
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = Env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = Env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function createClient() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}
