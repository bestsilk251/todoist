import {
  buildHeatmap,
  calculateOnTimeRate,
  calculateStreak,
  clampRangeToToday,
  getMonthRange,
  getPreviousPeriod,
  getWeekRange,
  groupTasksByDay,
  parseDurationMinutes,
  zonedDateKey,
} from '../analyticsMath';

describe('analytics metric calculations', () => {
  test('calculates the on-time percentage only for tasks with deadlines', () => {
    expect(calculateOnTimeRate([
      { completed_at: '2026-07-14T09:00:00Z', due_at: '2026-07-14T10:00:00Z' },
      { completed_at: '2026-07-14T12:00:00Z', due_at: '2026-07-14T10:00:00Z' },
      { completed_at: '2026-07-14T08:00:00Z', due_at: null },
    ])).toBe(50);
  });

  test('returns a dash-compatible null when no completed task has a deadline', () => {
    expect(calculateOnTimeRate([
      { completed_at: '2026-07-14T09:00:00Z', due_at: null },
      { completed_at: null, due_at: '2026-07-14T10:00:00Z' },
    ])).toBeNull();
  });

  test('builds the previous period with identical inclusive length across a month boundary', () => {
    expect(getPreviousPeriod({ from: '2026-08-01', to: '2026-08-07' })).toEqual({
      from: '2026-07-25',
      to: '2026-07-31',
    });
  });

  test('caps the current week and month at today in the user timezone', () => {
    const now = new Date('2026-07-21T12:00:00Z');
    expect(getWeekRange(now, 'Europe/Kyiv')).toEqual({
      from: '2026-07-20',
      to: '2026-07-21',
    });
    expect(getMonthRange(now, 'Europe/Kyiv')).toEqual({
      from: '2026-07-01',
      to: '2026-07-21',
    });
  });

  test('clamps future ranges without allowing an entirely future selection', () => {
    const now = new Date('2026-07-21T12:00:00Z');
    expect(clampRangeToToday({ from: '2026-07-20', to: '2026-07-26' }, now, 'Europe/Kyiv')).toEqual({
      from: '2026-07-20',
      to: '2026-07-21',
    });
    expect(clampRangeToToday({ from: '2026-07-25', to: '2026-07-31' }, now, 'Europe/Kyiv')).toEqual({
      from: '2026-07-21',
      to: '2026-07-21',
    });
  });

  test('calculates a current streak in the user timezone and stops at the first missing day', () => {
    const completed = [
      '2026-07-21T20:30:00Z', // 23:30 in Kyiv
      '2026-07-20T08:00:00Z',
      '2026-07-19T08:00:00Z',
      '2026-07-17T08:00:00Z',
    ];
    expect(calculateStreak(completed, new Date('2026-07-21T20:00:00Z'), 'Europe/Kyiv')).toBe(3);
  });

  test('groups completed tasks by local day and ignores missing durations in time totals', () => {
    const grouped = groupTasksByDay([
      { completed_at: '2026-07-14T21:30:00Z', duration_minutes: 45 },
      { completed_at: '2026-07-15T08:00:00Z', duration_minutes: null },
    ], { from: '2026-07-14', to: '2026-07-16' }, 'Europe/Kyiv');
    expect(grouped).toEqual([
      { date: '2026-07-14', completedTasks: 0, plannedMinutes: 0 },
      { date: '2026-07-15', completedTasks: 2, plannedMinutes: 45 },
      { date: '2026-07-16', completedTasks: 0, plannedMinutes: 0 },
    ]);
  });

  test('returns a complete zero-filled series for an empty period', () => {
    expect(groupTasksByDay([], { from: '2026-07-30', to: '2026-08-02' }, 'UTC')).toEqual([
      { date: '2026-07-30', completedTasks: 0, plannedMinutes: 0 },
      { date: '2026-07-31', completedTasks: 0, plannedMinutes: 0 },
      { date: '2026-08-01', completedTasks: 0, plannedMinutes: 0 },
      { date: '2026-08-02', completedTasks: 0, plannedMinutes: 0 },
    ]);
  });

  test('groups heatmap values by ISO weekday and local hour', () => {
    const heatmap = buildHeatmap([
      '2026-07-20T07:00:00Z',
      '2026-07-20T07:20:00Z',
      '2026-07-21T17:00:00Z',
    ], 'Europe/Kyiv');
    expect(heatmap).toEqual([
      { weekday: 1, hour: 10, completedTasks: 2, plannedMinutes: 0, value: 2 },
      { weekday: 2, hour: 20, completedTasks: 1, plannedMinutes: 0, value: 1 },
    ]);
  });

  test('uses the requested timezone when UTC and local calendar dates differ', () => {
    expect(zonedDateKey('2026-07-14T22:30:00Z', 'Europe/Kyiv')).toBe('2026-07-15');
    expect(zonedDateKey('2026-07-14T22:30:00Z', 'America/New_York')).toBe('2026-07-14');
  });

  test('parses known planned durations without inventing missing values', () => {
    expect(parseDurationMinutes('1 год 30 хв')).toBe(90);
    expect(parseDurationMinutes('45 хв')).toBe(45);
    expect(parseDurationMinutes('')).toBeNull();
    expect(parseDurationMinutes('без тривалості')).toBeNull();
  });
});
