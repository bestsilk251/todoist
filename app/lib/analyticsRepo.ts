import { getSupabaseClient } from './supabase';
import type { AnalyticsDateRange, AnalyticsResponse } from './analyticsTypes';

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { expiresAt: number; data: AnalyticsResponse }>();
const pending = new Map<string, Promise<AnalyticsResponse>>();

export function analyticsCacheKey(userId: string, range: AnalyticsDateRange, timezone: string) {
  return `${userId}:${range.from}:${range.to}:${timezone}`;
}

function normalizeAnalytics(value: unknown): AnalyticsResponse {
  if (!value || typeof value !== 'object') throw new Error('Сервер повернув некоректну відповідь аналітики.');
  const result = value as AnalyticsResponse;
  if (!result.period || !result.summary || !Array.isArray(result.daily) || !Array.isArray(result.heatmap) || !Array.isArray(result.categories)) {
    throw new Error('Сервер повернув неповні дані аналітики.');
  }
  return result;
}

export async function fetchAnalytics(
  range: AnalyticsDateRange,
  timezone: string,
  force = false,
): Promise<AnalyticsResponse> {
  const client = getSupabaseClient();
  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  if (sessionError) throw new Error(sessionError.message || 'Не вдалося перевірити авторизацію.');
  const userId = sessionData.session?.user.id;
  if (!userId) throw new Error('Увійдіть у застосунок, щоб переглянути аналітику.');

  const key = analyticsCacheKey(userId, range, timezone);
  const hit = cache.get(key);
  if (!force && hit && hit.expiresAt > Date.now()) return hit.data;
  if (!force && pending.has(key)) return pending.get(key)!;

  const request = (async () => {
    const { data, error } = await client.rpc('get_task_analytics', {
      p_from: range.from,
      p_to: range.to,
      p_timezone: timezone,
    });
    if (error) throw new Error(error.message || 'Не вдалося завантажити аналітику.');
    const normalized = normalizeAnalytics(data);
    cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, data: normalized });
    return normalized;
  })();

  pending.set(key, request);
  try {
    return await request;
  } finally {
    pending.delete(key);
  }
}

export function clearAnalyticsCache(): void {
  cache.clear();
  pending.clear();
}
