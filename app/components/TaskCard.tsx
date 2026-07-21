import { useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, PanResponder } from 'react-native';
import type { Task } from '../types';
import { colors, spacing, typography, radius } from '../theme';

interface Props {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
  onPostpone: () => void;
  onOpen: () => void;
}

function isOverdue(task: Task): boolean {
  if (task.status === 'done' || !task.due_date) return false;
  return task.due_date < new Date().toISOString().slice(0, 10);
}

/**
 * Swipeable task card. Swipe left reveals Перенести / Видалити; swipe right
 * past a threshold toggles completion. Uses Animated + PanResponder so it works
 * on both native and react-native-web.
 */
export default function TaskCard({ task, onToggle, onDelete, onPostpone, onOpen }: Props) {
  const translateX = useRef(new Animated.Value(0)).current;
  const openRef = useRef(false);

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_e, g) => {
        const base = openRef.current ? -140 : 0;
        let next = base + g.dx;
        next = Math.max(-140, Math.min(70, next));
        translateX.setValue(next);
      },
      onPanResponderRelease: (_e, g) => {
        const base = openRef.current ? -140 : 0;
        const val = base + g.dx;
        if (val > 60) {
          onToggle();
          openRef.current = false;
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        } else if (val < -60) {
          openRef.current = true;
          Animated.spring(translateX, { toValue: -140, useNativeDriver: true }).start();
        } else {
          openRef.current = false;
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    }),
  ).current;

  function closeAndRun(fn: () => void) {
    openRef.current = false;
    Animated.timing(translateX, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => fn());
  }

  const done = task.status === 'done';
  const overdue = isOverdue(task);

  return (
    <View style={styles.wrap}>
      <View style={styles.actions}>
        <Pressable style={[styles.action, styles.postpone]} onPress={() => closeAndRun(onPostpone)}>
          <Text style={styles.postponeText}>Перенести</Text>
        </Pressable>
        <Pressable style={[styles.action, styles.delete]} onPress={() => closeAndRun(onDelete)}>
          <Text style={styles.deleteText}>Видалити</Text>
        </Pressable>
      </View>

      <Animated.View style={{ transform: [{ translateX }] }} {...pan.panHandlers}>
        <Pressable onPress={onOpen} style={styles.card}>
          {task.important && !done ? <View style={styles.importantBar} /> : null}

          <Pressable
            onPress={onToggle}
            hitSlop={8}
            style={[styles.checkbox, done && styles.checkboxDone]}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: done }}
            testID={`toggle-${task.id}`}
          >
            {done ? <Text style={styles.check}>✓</Text> : null}
          </Pressable>

          <View style={styles.body}>
            <Text style={[styles.title, done && styles.titleDone]} numberOfLines={2}>
              {task.title}
            </Text>
            <View style={styles.chips}>
              {task.due_time ? (
                <Text style={[styles.timeChip, overdue && styles.timeChipOverdue]}>
                  {task.due_time.slice(0, 5)}
                </Text>
              ) : null}
              <Text style={styles.chip}>{task.category}</Text>
              {overdue ? <Text style={styles.overdue}>Просрочено</Text> : null}
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: radius.xl, overflow: 'hidden', marginBottom: 10 },
  actions: { position: 'absolute', top: 0, bottom: 0, right: 0, flexDirection: 'row' },
  action: { width: 70, alignItems: 'center', justifyContent: 'center' },
  postpone: { backgroundColor: colors.chip },
  postponeText: { ...typography.chip, fontSize: 12, color: colors.textMuted },
  delete: { backgroundColor: colors.accentDeep },
  deleteText: { ...typography.chip, fontSize: 12, color: colors.text },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.lg - 2,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  importantBar: {
    position: 'absolute',
    left: 0,
    top: 14,
    bottom: 14,
    width: 3,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
  checkbox: {
    width: 26,
    height: 26,
    minWidth: 26,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxDone: { backgroundColor: colors.accent, borderColor: colors.accent },
  check: { color: colors.text, fontSize: 13, fontWeight: '700', lineHeight: 14 },
  body: { flex: 1, minWidth: 0 },
  title: { ...typography.cardTitle, color: colors.text, lineHeight: 20 },
  titleDone: { color: colors.textFaint, textDecorationLine: 'line-through' },
  chips: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  timeChip: {
    ...typography.chip,
    color: colors.textMuted,
    backgroundColor: colors.chip,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  timeChipOverdue: { color: colors.accent, backgroundColor: colors.accentDim },
  chip: {
    ...typography.chip,
    color: colors.textMuted,
    backgroundColor: colors.chip,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  overdue: { ...typography.chip, color: colors.accent, fontWeight: '600' },
});
