/** A swipeable task row: right completes, left postpones, long press promotes. */
import React, { useRef } from 'react';
import { View, Text, Pressable, Animated, PanResponder, StyleSheet } from 'react-native';
import { palette, priorityColor, withAlpha } from '../../theme';
import { formatTaskDateFromOffset, type V5Task } from '../../lib/v5data';
import { useV5 } from './store';
import { CategoryTag } from './ui';
import { clockToMinutes, minutesToClock } from '../../lib/calendarMath';

const SWIPE_ACTION = 72;

export default function TaskCard({ task }: { task: V5Task }) {
  const s = useV5();
  const cats = s.categories;
  const catColor = cats[task.category] || palette.textFaint;
  const storeRef = useRef(s);
  const taskRef = useRef(task);
  storeRef.current = s;
  taskRef.current = task;
  const tx = useRef(new Animated.Value(0)).current;
  const current = useRef(0);
  const moved = useRef(false);

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: () => {
        moved.current = false;
      },
      onPanResponderMove: (_e, g) => {
        if (Math.abs(g.dx) > 6) moved.current = true;
        let next = g.dx;
        next = Math.max(-SWIPE_ACTION, Math.min(SWIPE_ACTION, next));
        current.current = next;
        tx.setValue(next);
      },
      onPanResponderRelease: () => {
        const val = current.current;
        if (val > 58) storeRef.current.toggleComplete(taskRef.current.id);
        if (val < -58) storeRef.current.cancelTask(taskRef.current.id);
        Animated.spring(tx, { toValue: 0, useNativeDriver: true, speed: 24, bounciness: 0 }).start();
        current.current = 0;
      },
    })
  ).current;

  const onPress = () => {
    if (moved.current) return;
    s.openTaskDetail(task.id);
  };

  const barColor = task.completed ? palette.border : task.overdue ? palette.accent : priorityColor(task.priority);
  const timeLabel = task.time && task.durationMinutes
    ? `${task.time}–${minutesToClock(clockToMinutes(task.time) + task.durationMinutes)}`
    : task.time;
  const dueDateLabel = task.dueInDays != null && (task.dueInDays > 1 || task.overdue)
    ? formatTaskDateFromOffset(task.dueInDays)
    : null;

  return (
    <View style={styles.wrap}>
      <View style={styles.swipeActions}>
        <View style={styles.completeAction}><Text style={styles.swipeActionText}>Виконати</Text></View>
        <View style={styles.cancelAction}><Text style={styles.swipeActionText}>Скасувати</Text></View>
      </View>

      <Animated.View style={{ transform: [{ translateX: tx }] }} {...pan.panHandlers}>
        <Pressable onPress={onPress} onLongPress={() => s.reorderTaskToTop(task.id)} delayLongPress={450} style={styles.card}>
          <View style={[styles.bar, { backgroundColor: barColor }]} />
          <Pressable
            onPress={() => s.toggleComplete(task.id)}
            style={[styles.checkbox, task.completed ? styles.checkboxDone : styles.checkboxOpen]}
          >
            {task.completed ? <Text style={styles.check}>✓</Text> : null}
          </Pressable>
          <View style={styles.body}>
            <Text style={[styles.title, task.completed && styles.titleDone]}>{task.title}</Text>
            <View style={styles.tags}>
              {timeLabel ? (
                <Text style={[styles.timeChip, task.overdue ? styles.timeChipOverdue : styles.timeChipNormal]}>{timeLabel}</Text>
              ) : null}
              {dueDateLabel ? <Text style={styles.dateChip}>{dueDateLabel}</Text> : null}
              <CategoryTag name={task.category} color={catColor} />
              {task.repeat ? <Text style={styles.metaPill}>Повторюється</Text> : null}
              {task.hasSubtasks ? <Text style={styles.metaPill}>{task.subtaskCount} підзадачі</Text> : null}
              {task.overdue ? <Text style={styles.overdue}>Прострочено</Text> : null}
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 16, overflow: 'hidden', marginBottom: 10 },
  swipeActions: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', justifyContent: 'space-between' },
  completeAction: { width: SWIPE_ACTION, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2F8D63' },
  cancelAction: { width: SWIPE_ACTION, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.accentDeep },
  swipeActionText: { color: palette.white, fontSize: 11.5, fontWeight: '700' },
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 12,
    backgroundColor: palette.surface, borderRadius: 15, borderWidth: 1, borderColor: palette.border,
  },
  bar: { position: 'absolute', left: 0, top: 14, bottom: 14, width: 3, borderRadius: 2 },
  checkbox: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 1, marginLeft: 6 },
  checkboxOpen: { borderWidth: 1.5, borderColor: palette.border, backgroundColor: 'transparent' },
  checkboxDone: { backgroundColor: palette.accent },
  check: { color: palette.text, fontSize: 13, lineHeight: 14 },
  body: { flex: 1 },
  title: { fontSize: 15, fontWeight: '500', lineHeight: 20, color: palette.text },
  titleDone: { color: palette.textFaint, textDecorationLine: 'line-through' },
  tags: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  timeChip: { fontSize: 11, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, overflow: 'hidden' },
  timeChipNormal: { color: palette.textMuted, backgroundColor: palette.chip },
  timeChipOverdue: { color: palette.accent, backgroundColor: withAlpha(palette.accent, 0.12) },
  metaPill: { fontSize: 11, color: palette.textMuted, backgroundColor: palette.chip, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, overflow: 'hidden' },
  dateChip: { fontSize: 11, color: palette.textSecondary, backgroundColor: palette.chip, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, overflow: 'hidden' },
  overdue: { fontSize: 11, color: palette.accent, fontWeight: '600' },
});
