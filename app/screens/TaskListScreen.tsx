import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Text, SectionList, StyleSheet, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { getSupabaseClient } from '../lib/supabase';
import { signOut } from '../lib/useAuth';
import { toggleDone, deleteTask } from '../lib/taskActions';
import { isoToDisplayDate } from '../lib/dateTime';
import TaskRow from '../components/TaskRow';
import UndoBar from '../components/UndoBar';
import type { Task } from '../types';
import { spacing, typography, colors } from '../theme';

const UNDO_WINDOW_MS = 5000;

function isoDay(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

/**
 * Groups tasks into ordered sections. "Today" and "Tomorrow" get friendly
 * labels; every other dated task is grouped under its own date, shown as
 * DD-MM-YYYY (in chronological order). Tasks without a date fall into a final
 * "Без дати" section.
 */
export function groupByDate(tasks: Task[]) {
  const today = isoDay(0);
  const tomorrow = isoDay(1);

  const todayTasks: Task[] = [];
  const tomorrowTasks: Task[] = [];
  const noDateTasks: Task[] = [];
  const byDate = new Map<string, Task[]>();

  for (const t of tasks) {
    if (!t.due_date) noDateTasks.push(t);
    else if (t.due_date === today) todayTasks.push(t);
    else if (t.due_date === tomorrow) tomorrowTasks.push(t);
    else {
      const list = byDate.get(t.due_date) ?? [];
      list.push(t);
      byDate.set(t.due_date, list);
    }
  }

  const sections: { title: string; data: Task[] }[] = [];
  if (todayTasks.length) sections.push({ title: 'Today', data: todayTasks });
  if (tomorrowTasks.length) sections.push({ title: 'Tomorrow', data: tomorrowTasks });

  // Future/past dated sections, chronological, labelled by the date itself.
  for (const iso of [...byDate.keys()].sort()) {
    sections.push({ title: isoToDisplayDate(iso), data: byDate.get(iso)! });
  }

  if (noDateTasks.length) sections.push({ title: 'Без дати', data: noDateTasks });

  return sections;
}

export default function TaskListScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  // The task pending deletion during the Undo window; hidden from the list
  // but not yet removed from the database.
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null);
  const deleteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={signOut} hitSlop={8} testID="sign-out">
          <Text style={styles.signOut}>Вийти</Text>
        </Pressable>
      ),
    });
  }, [navigation]);

  async function load() {
    const { data } = await getSupabaseClient().from('tasks').select('*');
    setTasks((data as Task[]) ?? []);
  }

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
  }, []);

  // Optimistic toggle: flip status in local state immediately, then persist.
  // On failure, reload from the server to snap back to the true state.
  async function handleToggle(task: Task) {
    const nextStatus: Task['status'] = task.status === 'done' ? 'pending' : 'done';
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)));
    try {
      await toggleDone(task);
    } catch {
      load();
    }
  }

  // Commits a pending delete to the database (fired by the Undo timeout).
  async function commitDelete(task: Task) {
    deleteTimer.current = null;
    setPendingDelete(null);
    try {
      await deleteTask(task.id);
    } catch {
      load();
    }
  }

  // Deferred delete: hide the task and show the Undo bar. The row is only
  // removed from the database once the window elapses, so Undo is instant
  // and never needs to re-create the row.
  function handleDelete(task: Task) {
    // If another delete is already pending, commit it right away so we never
    // silently drop a queued deletion.
    if (deleteTimer.current && pendingDelete) {
      clearTimeout(deleteTimer.current);
      void commitDelete(pendingDelete);
    }
    setPendingDelete(task);
    deleteTimer.current = setTimeout(() => commitDelete(task), UNDO_WINDOW_MS);
  }

  function handleUndo() {
    if (deleteTimer.current) clearTimeout(deleteTimer.current);
    deleteTimer.current = null;
    setPendingDelete(null);
  }

  useEffect(() => {
    return () => {
      if (deleteTimer.current) clearTimeout(deleteTimer.current);
    };
  }, []);

  const visibleTasks = pendingDelete
    ? tasks.filter((t) => t.id !== pendingDelete.id)
    : tasks;

  return (
    <View style={styles.container}>
      <SectionList
        sections={groupByDate(visibleTasks)}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.lg }}
        renderSectionHeader={({ section }) => (
          <View style={styles.header}>
            <Text style={styles.headerText}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TaskRow
            task={item}
            onToggle={() => handleToggle(item)}
            onDelete={() => handleDelete(item)}
            onOpen={() => navigation.navigate('Edit', { task: item })}
          />
        )}
        ListEmptyComponent={<Text style={styles.empty}>Поки що немає задач</Text>}
      />

      {pendingDelete ? (
        <UndoBar message="Задачу видалено" onUndo={handleUndo} bottomInset={insets.bottom} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerText: {
    ...typography.footnote,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  empty: {
    ...typography.subhead,
    textAlign: 'center',
    color: colors.textFaint,
    marginTop: spacing.xxl,
  },
  signOut: { ...typography.callout, color: colors.primary },
});
