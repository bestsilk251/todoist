import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { Task } from '../types';
import { spacing, touch, typography, colors, hairline, radius } from '../theme';

interface Props {
  task: Pick<Task, 'id' | 'title' | 'due_time' | 'status'>;
  onToggle: () => void;
  onDelete: () => void;
  onOpen: () => void;
}

export default function TaskRow({ task, onToggle, onDelete, onOpen }: Props) {
  const done = task.status === 'done';

  return (
    <View style={styles.row}>
      <Pressable
        onPress={onToggle}
        hitSlop={8}
        style={[styles.checkbox, done && styles.checkboxDone]}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        accessibilityLabel={done ? 'Позначити невиконаною' : 'Позначити виконаною'}
        testID={`toggle-${task.id}`}
      >
        {done ? <Text style={styles.check}>✓</Text> : null}
      </Pressable>

      <Pressable style={styles.body} onPress={onOpen} testID={`open-${task.id}`}>
        <Text style={[styles.title, done && styles.titleDone]} numberOfLines={2}>
          {task.title}
        </Text>
      </Pressable>

      {task.due_time ? (
        <Text style={[styles.time, done && styles.titleDone]}>{task.due_time.slice(0, 5)}</Text>
      ) : null}

      <Pressable
        onPress={onDelete}
        hitSlop={8}
        style={styles.delete}
        accessibilityRole="button"
        accessibilityLabel="Видалити задачу"
        testID={`delete-${task.id}`}
      >
        <Text style={styles.deleteIcon}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: touch.minTarget + spacing.sm,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderBottomWidth: hairline,
    borderBottomColor: colors.border,
    gap: spacing.sm + 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  check: { color: colors.primaryText, fontSize: 14, fontWeight: '700', lineHeight: 16 },
  body: { flex: 1, justifyContent: 'center', minHeight: touch.minTarget },
  title: { ...typography.body, color: colors.text },
  titleDone: { color: colors.textFaint, textDecorationLine: 'line-through' },
  time: { ...typography.subhead, color: colors.textMuted },
  delete: {
    width: touch.minTarget,
    height: touch.minTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIcon: { ...typography.body, color: colors.textFaint },
});
