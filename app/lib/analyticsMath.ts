import type {
  AnalyticsDateRange,
  AnalyticsHeatmapPoint,
  AnalyticsTaskFixture,
} from './analyticsTypes';

const DAY_MS = 86_400_000;

function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function formatDateOnly(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

export function addDateDays(value: string, amount: number): string {
  const date = parseDateOnly(value);
  date.setUTCDate(date.getUTCDate() + amount);
  return formatDateOnly(date);
}

export function daysInclusive(range: AnalyticsDateRange): number {
  return Math.round((parseDateOnly(range.to).getTime() - parseDateOnly(range.from).getTime()) / DAY_MS) + 1;
}

export function getPreviousPeriod(range: AnalyticsDateRange): AnalyticsDateRange {
  const length = daysInclusive(range);
  const to = addDateDays(range.from, -1);
  return { from: addDateDays(to, -(length - 1)), to };
}

export function zonedDateKey(value: Date | string, timezone: string): string {
  const date = value instanceof Date ? value : new Date(value);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function zonedHour(value: Date | string, timezone: string): number {
  const date = value instanceof Date ? value : new Date(value);
  const hour = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date).find((item) => item.type === 'hour')?.value;
  return Number(hour ?? 0) % 24;
}

export function getWeekRange(now = new Date(), timezone = 'UTC'): AnalyticsDateRange {
  const today = zonedDateKey(now, timezone);
  const day = parseDateOnly(today).getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const from = addDateDays(today, mondayOffset);
  return { from, to: today };
}

export function getRollingRange(days: number, now = new Date(), timezone = 'UTC'): AnalyticsDateRange {
  const to = zonedDateKey(now, timezone);
  return { from: addDateDays(to, -(days - 1)), to };
}

export function getMonthRange(now = new Date(), timezone = 'UTC'): AnalyticsDateRange {
  const today = zonedDateKey(now, timezone);
  const date = parseDateOnly(today);
  const from = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-01`;
  return { from, to: today };
}

export function clampRangeToToday(
  range: AnalyticsDateRange,
  now = new Date(),
  timezone = 'UTC',
): AnalyticsDateRange {
  const today = zonedDateKey(now, timezone);
  const to = range.to > today ? today : range.to;
  return { from: range.from > to ? to : range.from, to };
}

export function shiftRange(range: AnalyticsDateRange, amount: number): AnalyticsDateRange {
  const length = daysInclusive(range);
  return {
    from: addDateDays(range.from, amount * length),
    to: addDateDays(range.to, amount * length),
  };
}

export function calculateOnTimeRate(tasks: AnalyticsTaskFixture[]): number | null {
  const eligible = tasks.filter((task) => task.completed_at && task.due_at);
  if (eligible.length === 0) return null;
  const onTime = eligible.filter((task) => new Date(task.completed_at!).getTime() <= new Date(task.due_at!).getTime()).length;
  return Math.round((onTime / eligible.length) * 100);
}

export function calculateStreak(completedAt: string[], today: Date, timezone: string): number {
  const days = new Set(completedAt.map((value) => zonedDateKey(value, timezone)));
  let cursor = zonedDateKey(today, timezone);
  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = addDateDays(cursor, -1);
  }
  return streak;
}

export function groupTasksByDay(
  tasks: AnalyticsTaskFixture[],
  range: AnalyticsDateRange,
  timezone: string,
) {
  const result = [];
  for (let day = range.from; day <= range.to; day = addDateDays(day, 1)) {
    result.push({ date: day, completedTasks: 0, plannedMinutes: 0 });
  }
  const byDate = new Map(result.map((item) => [item.date, item]));
  tasks.forEach((task) => {
    if (!task.completed_at) return;
    const item = byDate.get(zonedDateKey(task.completed_at, timezone));
    if (!item) return;
    item.completedTasks += 1;
    if (task.duration_minutes != null) item.plannedMinutes += task.duration_minutes;
  });
  return result;
}

export function buildHeatmap(
  completedAt: string[],
  timezone: string,
): AnalyticsHeatmapPoint[] {
  const values = new Map<string, AnalyticsHeatmapPoint>();
  completedAt.forEach((value) => {
    const dateKey = zonedDateKey(value, timezone);
    const weekdayJs = parseDateOnly(dateKey).getUTCDay();
    const weekday = weekdayJs === 0 ? 7 : weekdayJs;
    const hour = zonedHour(value, timezone);
    const key = `${weekday}:${hour}`;
    const existing = values.get(key) ?? { weekday, hour, completedTasks: 0, plannedMinutes: 0, value: 0 };
    existing.completedTasks += 1;
    existing.value = existing.completedTasks;
    values.set(key, existing);
  });
  return [...values.values()].sort((a, b) => a.weekday - b.weekday || a.hour - b.hour);
}

export function parseDurationMinutes(value: string): number | null {
  const normalized = value.trim().toLowerCase().replace(',', '.');
  if (!normalized) return null;
  const hours = normalized.match(/(\d+(?:\.\d+)?)\s*(?:год|г|h)/)?.[1];
  const minutes = normalized.match(/(\d+)\s*(?:хв|min|м)/)?.[1];
  const total = Math.round(Number(hours ?? 0) * 60 + Number(minutes ?? 0));
  return total > 0 ? total : null;
}
