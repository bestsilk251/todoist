/**
 * Seed data and date helpers for the v5 dark UI. The values mirror the design
 * mock exactly so the ported screens render identically out of the box. When
 * the UI is later wired to Supabase, replace `seedTasks` with live rows that
 * satisfy the same shape.
 */
import type { Priority } from '../theme';
import { DEFAULT_TIMED_TASK_DURATION_MINUTES } from './calendarMath';

export interface V5Task {
  id: string;
  dueInDays: number | null; // 0 = today, 1 = tomorrow, null = no date
  title: string;
  time: string; // 'HH:MM' or '' when all-day
  category: string;
  priority: Priority;
  completed: boolean;
  cancelled: boolean;
  overdue: boolean;
  repeat: boolean;
  hasSubtasks: boolean;
  subtaskCount: number;
  durationMinutes: number | null;
  completedAt: string | null;
  cancelledAt?: string | null;
}

export interface PreviewTask {
  id: string;
  title: string;
  iso: string | null; // absolute due date 'YYYY-MM-DD' (null = no date)
  time: string;
  duration: string;
  category: string;
  important: boolean;
  priority?: Priority;
  needsConfirmation: boolean;
}

export function formatTaskDateFromOffset(offset: number | null, referenceDate = new Date()): string | null {
  if (offset == null) return null;
  const date = new Date(referenceDate);
  date.setDate(referenceDate.getDate() + offset);
  return date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' }).replace('.', '');
}

export function formatTaskEventDate(value: string | null | undefined, includeYear = true): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'short',
    ...(includeYear ? { year: 'numeric' as const } : {}),
  }).replace('.', '');
}

export function isTaskCurrentOrUpcoming(task: V5Task, now = new Date()): boolean {
  if (task.completed || task.cancelled) return false;
  if (task.dueInDays == null || task.dueInDays < 0) return false;
  if (task.dueInDays > 0 || !task.time) return true;
  const [hours, minutes] = task.time.split(':').map(Number);
  const startMinutes = hours * 60 + minutes;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const endMinutes = startMinutes + (task.durationMinutes ?? DEFAULT_TIMED_TASK_DURATION_MINUTES);
  return endMinutes >= currentMinutes;
}

/** Chronological order for task lists: date first, then timed tasks, then all-day tasks. */
export function compareTasksChronologically(a: V5Task, b: V5Task): number {
  const aDay = a.dueInDays ?? Number.MAX_SAFE_INTEGER;
  const bDay = b.dueInDays ?? Number.MAX_SAFE_INTEGER;
  if (aDay !== bDay) return aDay - bDay;

  const aTime = a.time || '24:00';
  const bTime = b.time || '24:00';
  const timeOrder = aTime.localeCompare(bTime);
  if (timeOrder !== 0) return timeOrder;
  return a.title.localeCompare(b.title, 'uk');
}

export function getNearestTasks(tasks: V5Task[], now = new Date(), limit = 3): V5Task[] {
  return tasks
    .filter((task) => isTaskCurrentOrUpcoming(task, now))
    .sort(compareTasksChronologically)
    .slice(0, Math.max(0, limit));
}

export const weekdaysFull = ['неділя', 'понеділок', 'вівторок', 'середа', 'четвер', "п'ятниця", 'субота'];
export const weekShort = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
export const monthsGen = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'];

export function formatDateLabel(d: Date): string {
  return `${d.getDate()} ${monthsGen[d.getMonth()]}, ${weekdaysFull[d.getDay()]}`;
}

export function dayPhrase(n: number): string {
  if (n <= 0) return 'сьогодні';
  if (n === 1) return 'завтра';
  const word = n >= 2 && n <= 4 ? 'дні' : 'днів';
  return `через ${n} ${word}`;
}

export function pluralTasks(n: number): string {
  const m = n % 10;
  const m100 = n % 100;
  if (m100 >= 11 && m100 <= 14) return 'задач';
  if (m === 1) return 'задача';
  if (m >= 2 && m <= 4) return 'задачі';
  return 'задач';
}

export const descByCategory: Record<string, string> = {
  'Робота': 'Обговорити деталі та наступні кроки з командою.',
  'Дім': 'Побутове завдання, яке варто виконати вчасно.',
  "Здоров'я": 'Приділіть час турботі про себе.',
  'Особисте': 'Особиста справа поза робочим часом.',
  'Навчання': 'Виділіть спокійний час для зосередженої роботи.',
};
