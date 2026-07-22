import { analyticsCacheKey, clearAnalyticsCache, fetchAnalytics } from '../analyticsRepo';
import { getSupabaseClient } from '../supabase';
import type { AnalyticsResponse } from '../analyticsTypes';

jest.mock('../supabase', () => ({ getSupabaseClient: jest.fn() }));

const range = { from: '2026-07-14', to: '2026-07-20' };
const response: AnalyticsResponse = {
  period: { ...range, previousFrom: '2026-07-07', previousTo: '2026-07-13' },
  summary: {
    completedTasks: 1,
    completedTasksChange: null,
    plannedMinutes: 30,
    plannedMinutesChange: null,
    onTimeRate: 100,
    onTimeRateChange: null,
    streakDays: 1,
  },
  daily: [],
  heatmap: [],
  categories: [],
  insights: { mostProductiveInterval: '10:00–14:00', averageTasksPerDayInInterval: 1, focusRate: 100 },
};

describe('analytics repository', () => {
  const rpc = jest.fn();
  const getSession = jest.fn();

  beforeEach(() => {
    clearAnalyticsCache();
    rpc.mockReset().mockResolvedValue({ data: response, error: null });
    getSession.mockReset().mockResolvedValue({ data: { session: { user: { id: 'user-a' } } }, error: null });
    (getSupabaseClient as jest.Mock).mockReturnValue({ auth: { getSession }, rpc });
  });

  it('scopes cache entries by authenticated user', () => {
    expect(analyticsCacheKey('user-a', range, 'Europe/Kyiv')).not.toBe(
      analyticsCacheKey('user-b', range, 'Europe/Kyiv'),
    );
  });

  it('reuses real RPC data for the same user and period', async () => {
    await fetchAnalytics(range, 'Europe/Kyiv');
    await fetchAnalytics(range, 'Europe/Kyiv');
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith('get_task_analytics', {
      p_from: range.from,
      p_to: range.to,
      p_timezone: 'Europe/Kyiv',
    });
  });

  it('never serves another user cached analytics', async () => {
    await fetchAnalytics(range, 'Europe/Kyiv');
    getSession.mockResolvedValue({ data: { session: { user: { id: 'user-b' } } }, error: null });
    await fetchAnalytics(range, 'Europe/Kyiv');
    expect(rpc).toHaveBeenCalledTimes(2);
  });
});
