/**
 * The bridge between Supabase `tasks` rows and the dark v5 UI model.
 *
 * The UI thinks in relative days (`dueInDays`) and a single `time` string; the
 * database stores absolute `due_date` + `due_time` + `is_all_day`. Everything
 * that converts between the two lives here, alongside thin CRUD wrappers. RLS
 * scopes every query to the signed-in user, so no explicit user_id filter.
 */
import { getSupabaseClient } from './supabase';
import type { Task, ParsedTask, Priority } from '../types';
import type { V5Task, PreviewTask } from './v5data';

const DAY = 86400000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** Local Date → 'YYYY-MM-DD'. */
export function isoOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 'YYYY-MM-DD' → local Date (midnight). */
export function isoToLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Whole-day offset of an ISO date from today (0 = today, 1 = tomorrow, null = no date). */
export function offsetFromToday(iso: string | null, today = new Date()): number | null {
  if (!iso) return null;
  return Math.round((startOfDay(isoToLocalDate(iso)) - startOfDay(today)) / DAY);
}

/** today + offset days → 'YYYY-MM-DD'. */
export function isoFromOffset(offset: number, today = new Date()): string {
  const d = new Date(today);
  d.setDate(today.getDate() + offset);
  return isoOf(d);
}

/** Human label for the preview date chip. */
export function previewDateLabel(iso: string | null, today = new Date()): string {
  if (!iso) return 'Без дати';
  const off = offsetFromToday(iso, today);
  if (off === 0) return 'Сьогодні';
  if (off === 1) return 'Завтра';
  const [, m, d] = iso.split('-');
  return `${d}.${m}`;
}

/** DB row → UI task. */
export function rowToV5(row: Task, today = new Date()): V5Task {
  const dueInDays = offsetFromToday(row.due_date, today);
  const time = !row.is_all_day && row.due_time ? row.due_time.slice(0, 5) : '';
  const completed = row.status === 'done';
  const overdue = !completed && dueInDays != null && dueInDays < 0;
  return {
    id: row.id,
    dueInDays,
    title: row.title,
    time,
    category: row.category || 'Особисте',
    priority: row.priority,
    completed,
    overdue,
    repeat: false,
    hasSubtasks: false,
    subtaskCount: 0,
  };
}

/** parse-task output → a preview card. */
export function previewFromParsed(p: ParsedTask, id: string): PreviewTask {
  return {
    id,
    title: p.title,
    iso: p.date,
    time: p.is_all_day || !p.time ? '' : p.time,
    duration: '',
    category: 'Особисте',
    important: false,
    needsConfirmation: p.needs_confirmation,
  };
}

/** Preview card → insert payload for the tasks table. user_id defaults to auth.uid(). */
export function previewToInsert(p: PreviewTask): Record<string, unknown> {
  const priority: Priority = p.important ? 'high' : 'medium';
  return {
    title: p.title,
    due_date: p.iso,
    due_time: p.time ? p.time : null,
    is_all_day: !p.time,
    category: p.category,
    important: p.important,
    priority,
    status: 'pending',
    needs_confirmation: false,
    source_text: p.title,
  };
}

// ---- CRUD ---------------------------------------------------------------

export async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await getSupabaseClient()
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Task[];
}

export async function insertTasks(rows: Record<string, unknown>[]): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await getSupabaseClient().from('tasks').insert(rows);
  if (error) throw error;
}

export async function setStatus(id: string, status: 'pending' | 'done'): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('tasks')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function removeTask(id: string): Promise<void> {
  const { error } = await getSupabaseClient().from('tasks').delete().eq('id', id);
  if (error) throw error;
}

export async function setDueDate(id: string, iso: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('tasks')
    .update({ due_date: iso, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

/** Invokes the parse-task Edge Function; returns [] on any failure. */
export async function parseTaskText(text: string): Promise<ParsedTask[]> {
  try {
    const { data, error } = await getSupabaseClient().functions.invoke('parse-task', {
      body: {
        text,
        currentDate: isoOf(new Date()),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    });
    if (error) throw error;
    const tasks = (data as { tasks?: ParsedTask[] })?.tasks;
    return Array.isArray(tasks) ? tasks : [];
  } catch {
    return [];
  }
}
