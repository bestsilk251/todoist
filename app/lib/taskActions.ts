import { getSupabaseClient } from './supabase';
import type { Task } from '../types';

/**
 * Data-layer operations on a single task. Each returns a promise that rejects
 * on failure so the caller can roll back an optimistic UI update. RLS ensures
 * a user can only touch their own rows, so no user_id filter is needed here.
 */

export async function setTaskStatus(id: string, status: Task['status']): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('tasks')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export function toggleDone(task: Pick<Task, 'id' | 'status'>): Promise<void> {
  const next: Task['status'] = task.status === 'done' ? 'pending' : 'done';
  return setTaskStatus(task.id, next);
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await getSupabaseClient().from('tasks').delete().eq('id', id);
  if (error) throw error;
}

/** Editable fields of a task. Omitting a field leaves it unchanged. */
export type TaskEdits = Partial<
  Pick<Task, 'title' | 'description' | 'due_date' | 'due_time' | 'is_all_day'>
>;

export async function updateTask(id: string, edits: TaskEdits): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('tasks')
    .update({ ...edits, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

/** Recreates a task (used to undo a delete that already hit the database). */
export async function restoreTask(task: Task): Promise<void> {
  const { error } = await getSupabaseClient().from('tasks').insert({
    id: task.id,
    title: task.title,
    description: task.description,
    due_date: task.due_date,
    due_time: task.due_time,
    is_all_day: task.is_all_day,
    needs_confirmation: task.needs_confirmation,
    status: task.status,
    source_text: task.source_text,
  });
  if (error) throw error;
}
