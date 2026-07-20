import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabase';

export interface AuthState {
  session: Session | null;
  loading: boolean;
}

/**
 * Tracks the current Supabase auth session.
 *
 * `loading` is true only until the persisted session is read on mount, so the
 * app can show a splash instead of flashing the login screen for logged-in
 * users. After that it flips to false and stays there; session changes
 * (sign-in, sign-out, token refresh) arrive via the auth listener.
 */
export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const client = getSupabaseClient();

    client.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { session, loading };
}

export async function signOut(): Promise<void> {
  await getSupabaseClient().auth.signOut();
}
