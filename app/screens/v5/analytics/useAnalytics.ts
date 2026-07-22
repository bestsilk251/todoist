import { useCallback, useEffect, useRef, useState } from 'react';
import type { AnalyticsDateRange, AnalyticsResponse } from '../../../lib/analyticsTypes';
import { clearAnalyticsCache, fetchAnalytics } from '../../../lib/analyticsRepo';
import { getSupabaseClient } from '../../../lib/supabase';

export function useAnalytics(range: AnalyticsDateRange, timezone: string) {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);
  const forceNext = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const force = forceNext.current;
    forceNext.current = false;
    setLoading(true);
    setError(null);
    if (!force) setData(null);
    fetchAnalytics(range, timezone, force)
      .then((result) => { if (!cancelled) setData(result); })
      .catch((reason: unknown) => { if (!cancelled) setError(reason instanceof Error ? reason.message : 'Невідома помилка.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [range.from, range.to, timezone, requestVersion]);

  useEffect(() => {
    let channel: any = null;
    try {
      const client = getSupabaseClient();
      channel = client
        .channel('analytics-tasks-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' } as any, () => {
          clearAnalyticsCache();
          setRequestVersion((value) => value + 1);
        })
        .subscribe();
      return () => { if (channel) void client.removeChannel(channel); };
    } catch {
      return undefined;
    }
  }, []);

  const retry = useCallback(() => {
    forceNext.current = true;
    setRequestVersion((value) => value + 1);
  }, []);

  return { data, loading, error, retry };
}
