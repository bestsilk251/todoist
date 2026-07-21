import { useCallback, useEffect, useState } from 'react';
import { getSupabaseClient } from './supabase';
import { toggleDone as toggleDoneAction, deleteTask as deleteTaskAction } from './taskActions';
import type { Task } from '../types';

export type GroupKey = 'today' | 'tomorrow' | 'later';

export const GROUP_LABELS: Record<GroupKey, string> = {
  today: 'Сьогодні',
  tomorrow: 'Завтра',
  later: 'Пізніше',
};

function isoDay(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

/** Which bucket a task falls into based on its due date. */
export function groupOf(task: Task): GroupKey {
  const today = isoDay(0);
  const tomorrow = isoDay(1);
  if (task.due_date === today) return 'today';
  if (task.due_date === tomorrow) return 'tomorrow';
  return 'later';
}

export interface TaskGroup {
  key: GroupKey;
  label: string;
  tasks: Task[];
}

/**
 * Loads the signed-in user's tasks, keeps them live via Realtime, and exposes
 * grouping, progress and optimistic complete/delete. Shared by Home and List.
 */
export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await getSupabaseClient()
      .from('tasks')
      .select('*')
      .order('due_time', { ascending: true, nullsFirst: false });
    setTasks((data as Task[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const client = getSupabaseClient();
    load();
    const channel = client
      .channel('tasks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, load)
      .subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [load]);

  const toggle = useCallback(
    async (task: Task) => {
      const next: Task['status'] = task.status === 'done' ? 'pending' : 'done';
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: next } : t)));
      try {
        await toggleDoneAction(task);
      } catch {
        load();
      }
    },
    [load],
  );

  const remove = useCallback(
    async (id: string) => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      try {
        await deleteTaskAction(id);
      } catch {
        load();
      }
    },
    [load],
  );

  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'done').length;
  const pct = total ? Math.round((completed / total) * 100) : 0;

  const groups: TaskGroup[] = (['today', 'tomorrow', 'later'] as GroupKey[])
    .map((key) => ({ key, label: GROUP_LABELS[key], tasks: tasks.filter((t) => groupOf(t) === key) }))
    .filter((g) => g.tasks.length > 0);

  const nearest = tasks
    .filter((t) => t.status !== 'done')
    .sort((a, b) => {
      const order: Record<GroupKey, number> = { today: 0, tomorrow: 1, later: 2 };
      const g = order[groupOf(a)] - order[groupOf(b)];
      if (g !== 0) return g;
      return (a.due_time || '99:99').localeCompare(b.due_time || '99:99');
    })
    .slice(0, 3);

  return { tasks, loading, load, toggle, remove, groups, nearest, total, completed, pct };
}
