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
import { parseDurationMinutes } from './analyticsMath';
import { clockToMinutes, DEFAULT_TIMED_TASK_DURATION_MINUTES, extractScheduleFromText } from './calendarMath';
import { clearAnalyticsCache } from './analyticsRepo';

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
  const cancelled = row.status === 'cancelled';
  const durationMinutes = time ? (row.duration_minutes ?? DEFAULT_TIMED_TASK_DURATION_MINUTES) : row.duration_minutes;
  const currentMinutes = today.getHours() * 60 + today.getMinutes();
  const scheduledEnd = time ? clockToMinutes(time) + durationMinutes! : null;
  const overdue = !completed && !cancelled && dueInDays != null && (
    dueInDays < 0 || (dueInDays === 0 && scheduledEnd != null && scheduledEnd < currentMinutes)
  );
  return {
    id: row.id,
    dueInDays,
    title: row.title,
    time,
    category: row.category || 'Особисте',
    priority: row.priority,
    completed,
    cancelled,
    overdue,
    repeat: false,
    hasSubtasks: false,
    subtaskCount: 0,
    durationMinutes,
    completedAt: row.completed_at,
  };
}

/** parse-task output → a preview card. */
export function previewFromParsed(p: ParsedTask, id: string): PreviewTask {
  const previewTime = p.is_all_day || !p.time ? '' : p.time;
  const durationMinutes = previewTime ? (p.duration_minutes ?? DEFAULT_TIMED_TASK_DURATION_MINUTES) : p.duration_minutes;
  const duration = durationMinutes == null
    ? ''
    : `${Math.floor(durationMinutes / 60) ? `${Math.floor(durationMinutes / 60)} год` : ''}${durationMinutes % 60 ? ` ${durationMinutes % 60} хв` : ''}`.trim();
  return {
    id,
    title: p.title,
    // A newly created task must have a place in both the list and calendar.
    // When natural-language parsing finds no date, schedule it for today.
    iso: p.date ?? isoOf(new Date()),
    time: previewTime,
    duration,
    category: 'Особисте',
    important: false,
    needsConfirmation: p.needs_confirmation,
  };
}

/** Preview card → insert payload for the tasks table. user_id defaults to auth.uid(). */
export function previewToInsert(p: PreviewTask): Record<string, unknown> {
  const priority: Priority = p.important ? 'high' : 'medium';
  const parsedDuration = parseDurationMinutes(p.duration);
  return {
    title: p.title,
    due_date: p.iso,
    due_time: p.time ? p.time : null,
    is_all_day: !p.time,
    category: p.category,
    important: p.important,
    priority,
    duration_minutes: p.time ? (parsedDuration ?? DEFAULT_TIMED_TASK_DURATION_MINUTES) : parsedDuration,
    status: 'pending',
    needs_confirmation: false,
    source_text: p.title,
  };
}

export function enrichParsedTasksWithSchedule(tasks: ParsedTask[], sourceText: string): ParsedTask[] {
  const inferred = extractScheduleFromText(sourceText);
  if (!inferred) return tasks;
  return tasks.map((task, index) => {
    if (index !== 0) return task;
    const time = task.time ?? inferred.startTime;
    return {
      ...task,
      time,
      is_all_day: time ? false : task.is_all_day,
      duration_minutes: task.duration_minutes ?? inferred.durationMinutes,
    };
  });
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

export async function insertTasks(rows: Record<string, unknown>[]): Promise<Task[]> {
  if (rows.length === 0) return [];
  clearAnalyticsCache();
  const { data, error } = await getSupabaseClient().from('tasks').insert(rows).select('*');
  if (error) throw error;
  clearAnalyticsCache();
  return (data ?? []) as Task[];
}

export async function setStatus(id: string, status: 'pending' | 'done' | 'cancelled'): Promise<void> {
  clearAnalyticsCache();
  const { error } = await getSupabaseClient()
    .from('tasks')
    .update({
      status,
      completed_at: status === 'done' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw error;
  clearAnalyticsCache();
}

export interface EditableTaskFields {
  time?: string;
  durationMinutes?: number | null;
  category?: string;
  priority?: Priority;
}

export async function updateTaskFields(id: string, fields: EditableTaskFields): Promise<void> {
  clearAnalyticsCache();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (fields.time !== undefined) {
    patch.due_time = fields.time || null;
    patch.is_all_day = !fields.time;
    if (fields.time && fields.durationMinutes === undefined) patch.duration_minutes = DEFAULT_TIMED_TASK_DURATION_MINUTES;
  }
  if (fields.durationMinutes !== undefined) patch.duration_minutes = fields.durationMinutes;
  if (fields.category !== undefined) patch.category = fields.category;
  if (fields.priority !== undefined) {
    patch.priority = fields.priority;
    patch.important = fields.priority === 'urgent' || fields.priority === 'high';
  }

  const { error } = await getSupabaseClient().from('tasks').update(patch).eq('id', id);
  if (error) throw error;
  clearAnalyticsCache();
}

export async function removeTask(id: string): Promise<void> {
  clearAnalyticsCache();
  const { error } = await getSupabaseClient().from('tasks').delete().eq('id', id);
  if (error) throw error;
  clearAnalyticsCache();
}

export async function setDueDate(id: string, iso: string): Promise<void> {
  clearAnalyticsCache();
  const { error } = await getSupabaseClient()
    .from('tasks')
    .update({ due_date: iso, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
  clearAnalyticsCache();
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
    if (!Array.isArray(tasks)) return [];
    return enrichParsedTasksWithSchedule(tasks, text);
  } catch {
    return [];
  }
}
