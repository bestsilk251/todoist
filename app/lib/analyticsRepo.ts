import { getSupabaseClient } from './supabase';
import type { AnalyticsDateRange, AnalyticsResponse } from './analyticsTypes';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_TTL_MS = 5 * 60 * 1000;
const STALE_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const STORAGE_PREFIX = 'voice-todo:analytics:';
const cache = new Map<string, { expiresAt: number; data: AnalyticsResponse }>();
const pending = new Map<string, Promise<AnalyticsResponse>>();

export function analyticsCacheKey(userId: string, range: AnalyticsDateRange, timezone: string) {
  return `${userId}:${range.from}:${range.to}:${timezone}`;
}

function analyticsStorageKey(key: string) {
  return `${STORAGE_PREFIX}${key}`;
}

export async function readCachedAnalytics(
  range: AnalyticsDateRange,
  timezone: string,
): Promise<AnalyticsResponse | null> {
  const client = getSupabaseClient();
  const { data } = await client.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) return null;
  const key = analyticsCacheKey(userId, range, timezone);
  const memory = cache.get(key);
  if (memory) return memory.data;
  try {
    const raw = await AsyncStorage.getItem(analyticsStorageKey(key));
    if (!raw) return null;
    const stored = JSON.parse(raw) as { savedAt?: number; data?: unknown };
    if (!stored.savedAt || Date.now() - stored.savedAt > STALE_CACHE_TTL_MS) return null;
    const normalized = normalizeAnalytics(stored.data);
    cache.set(key, { expiresAt: 0, data: normalized });
    return normalized;
  } catch {
    return null;
  }
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
    AsyncStorage.setItem(analyticsStorageKey(key), JSON.stringify({ savedAt: Date.now(), data: normalized }))
      .catch(() => { /* in-memory caching still works */ });
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
  AsyncStorage.getAllKeys()
    .then((keys) => {
      const analyticsKeys = keys.filter((key) => key.startsWith(STORAGE_PREFIX));
      return analyticsKeys.length ? AsyncStorage.multiRemove(analyticsKeys) : undefined;
    })
    .catch(() => { /* stale data is always refreshed on the next analytics visit */ });
}
