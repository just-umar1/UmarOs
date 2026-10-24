'use client';

import { createBrowserClient } from '@supabase/ssr';
import { isSupabaseConfigured, supabasePublishableKey, supabaseUrl } from '@/lib/config';

export function createClient() {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured. Copy .env.example to .env.local and add your project URL and publishable key.');
  return createBrowserClient(supabaseUrl!, supabasePublishableKey!);
}
