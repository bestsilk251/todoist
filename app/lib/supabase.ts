import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

function resolveClientEnv(): { url: string | undefined; anonKey: string | undefined } {
  const runtimeEnv = process.env as Record<string, string | undefined>;
  const runtimeValue = (segments: string[]) => runtimeEnv[segments.join('_')];
  const isTest = runtimeValue(['NODE', 'ENV']) === 'test'
    || runtimeValue(['JEST', 'WORKER', 'ID']) != null
    || typeof (globalThis as any).expect === 'function';
  return {
    url: isTest ? runtimeValue(['EXPO', 'PUBLIC', 'SUPABASE', 'URL']) : process.env.EXPO_PUBLIC_SUPABASE_URL,
    anonKey: isTest ? runtimeValue(['EXPO', 'PUBLIC', 'SUPABASE', 'ANON', 'KEY']) : process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  };
}

/** Returns the app-wide Supabase client, creating it on first use. */
export function getSupabaseClient(): SupabaseClient {
  // Expo statically inlines the dot-notation values in app bundles. The
  // bracket fallback keeps the same function testable in plain Jest/Node.
  const { url, anonKey } = resolveClientEnv();

  validateSupabaseEnv(url, anonKey);
  if (client) return client;

  client = createClient(url!, anonKey!, {
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

export function validateSupabaseEnv(url: string | undefined, anonKey: string | undefined): void {
  if (!url) throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL env var');
  if (!anonKey) throw new Error('Missing EXPO_PUBLIC_SUPABASE_ANON_KEY env var');
}

/** Test-only: drops the cached client so env changes take effect. */
export function __resetClientForTests(): void {
  client = null;
}
