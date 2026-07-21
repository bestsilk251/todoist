/**
 * Seed data and date helpers for the v5 dark UI. The values mirror the design
 * mock exactly so the ported screens render identically out of the box. When
 * the UI is later wired to Supabase, replace `seedTasks` with live rows that
 * satisfy the same shape.
 */
import type { Priority } from '../theme';

export interface V5Task {
  id: string;
  dueInDays: number | null; // 0 = today, 1 = tomorrow, null = no date
  title: string;
  time: string; // 'HH:MM' or '' when all-day
  category: string;
  priority: Priority;
  completed: boolean;
  overdue: boolean;
  repeat: boolean;
  hasSubtasks: boolean;
  subtaskCount: number;
}

export interface V5AllDay {
  id: string;
  title: string;
  category: string;
  completed: boolean;
  dueInDays: number;
}

export interface V5Event {
  id: number;
  start: string;
  end: string;
  title: string;
  category: string;
  dueInDays: number;
  flag?: boolean;
  video?: boolean;
  attachment?: boolean;
}

export interface PreviewTask {
  id: string;
  title: string;
  iso: string | null; // absolute due date 'YYYY-MM-DD' (null = no date)
  time: string;
  duration: string;
  category: string;
  important: boolean;
  needsConfirmation: boolean;
}

export const seedAllDay: V5AllDay[] = [
  { id: 'a1', title: 'Купити ліки', category: 'Особисте', completed: false, dueInDays: 0 },
  { id: 'a2', title: 'Відправити документи', category: 'Робота', completed: false, dueInDays: 0 },
];

export const seedEvents: V5Event[] = [
  { id: 1, start: '09:00', end: '10:00', title: 'Ранкове тренування', category: "Здоров'я", flag: true, dueInDays: 0 },
  { id: 2, start: '10:30', end: '11:00', title: 'Відповісти на листи', category: 'Робота', dueInDays: 0 },
  { id: 3, start: '12:00', end: '13:00', title: 'Зустріч із командою', category: 'Робота', video: true, dueInDays: 0 },
  { id: 4, start: '17:00', end: '18:00', title: 'Робота над презентацією', category: 'Робота', attachment: true, dueInDays: 0 },
  { id: 5, start: '09:30', end: '10:30', title: 'Дзвінок із клієнтом', category: 'Робота', dueInDays: 1 },
  { id: 6, start: '13:00', end: '14:00', title: 'Обід із другом', category: 'Особисте', dueInDays: 1 },
  { id: 7, start: '11:00', end: '12:00', title: 'Йога', category: "Здоров'я", dueInDays: 2 },
];

/** The mock "current minute of the day" the design uses for the now-line. */
export const NOW_MINUTES = 13 * 60 + 45;

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
