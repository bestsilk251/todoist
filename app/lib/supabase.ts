import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

/** Returns the app-wide Supabase client, creating it on first use. */
export function getSupabaseClient(): SupabaseClient {
  if (client) return client;

  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL env var');
  if (!anonKey) throw new Error('Missing EXPO_PUBLIC_SUPABASE_ANON_KEY env var');

  client = createClient(url, anonKey, {
    auth: {
      // Persist the session on the device so users stay logged in between
      // launches. AsyncStorage is the RN-appropriate store (no localStorage).
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  return client;
}

/** Test-only: drops the cached client so env changes take effect. */
export function __resetClientForTests(): void {
  client = null;
}
