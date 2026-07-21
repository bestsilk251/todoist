/** A swipeable task row for the list tab: drag left to reveal postpone/delete,
 * drag right to complete, tap to open detail. */
import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated, PanResponder, StyleSheet } from 'react-native';
import { palette, priorityColor, withAlpha } from '../../theme';
import type { V5Task } from '../../lib/v5data';
import { useV5 } from './store';
import { CategoryTag } from './ui';

const REVEAL = 140;

export default function TaskCard({ task }: { task: V5Task }) {
  const s = useV5();
  const cats = s.categories;
  const catColor = cats[task.category] || palette.textFaint;
  const isOpen = s.openSwipeId === task.id;

  const tx = useRef(new Animated.Value(isOpen ? -REVEAL : 0)).current;
  const current = useRef(isOpen ? -REVEAL : 0);
  const startOffset = useRef(0);
  const moved = useRef(false);

  useEffect(() => {
    const to = isOpen ? -REVEAL : 0;
    if (current.current !== to) {
      Animated.timing(tx, { toValue: to, duration: 220, useNativeDriver: true }).start();
      current.current = to;
    }
  }, [isOpen, tx]);

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: () => {
        startOffset.current = current.current;
        moved.current = false;
      },
      onPanResponderMove: (_e, g) => {
        if (Math.abs(g.dx) > 6) moved.current = true;
        let next = startOffset.current + g.dx;
        next = Math.max(-REVEAL, Math.min(70, next));
        current.current = next;
        tx.setValue(next);
      },
      onPanResponderRelease: () => {
        const val = current.current;
        if (val > 60) {
          s.toggleComplete(task.id);
          Animated.timing(tx, { toValue: 0, duration: 200, useNativeDriver: true }).start();
          current.current = 0;
        } else if (val < -60) {
          Animated.timing(tx, { toValue: -REVEAL, duration: 200, useNativeDriver: true }).start();
          current.current = -REVEAL;
          s.setOpenSwipe(task.id);
        } else {
          const to = startOffset.current <= -REVEAL + 1 ? -REVEAL : 0;
          Animated.timing(tx, { toValue: to, duration: 200, useNativeDriver: true }).start();
          current.current = to;
        }
      },
    })
  ).current;

  const onPress = () => {
    if (isOpen) { s.setOpenSwipe(null); return; }
    s.openTaskDetail(task.id);
  };

  const barColor = task.completed ? palette.border : priorityColor(task.priority);

  return (
    <View style={styles.wrap}>
      <View style={styles.actions}>
        <Pressable onPress={() => s.postponeTask(task.id)} style={[styles.actionBtn, { backgroundColor: palette.chip }]}>
          <Text style={styles.postponeText}>Перенести</Text>
        </Pressable>
        <Pressable onPress={() => s.deleteTask(task.id)} style={[styles.actionBtn, { backgroundColor: palette.accentDeep }]}>
          <Text style={styles.deleteText}>Видалити</Text>
        </Pressable>
      </View>

      <Animated.View style={{ transform: [{ translateX: tx }] }} {...pan.panHandlers}>
        <Pressable onPress={onPress} style={[styles.card, { borderColor: task.overdue ? palette.overdueBorder : palette.border }]}>
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
              {task.time ? (
                <Text style={[styles.timeChip, task.overdue ? styles.timeChipOverdue : styles.timeChipNormal]}>{task.time}</Text>
              ) : null}
              <CategoryTag name={task.category} color={catColor} />
              {task.repeat ? <Text style={styles.metaPill}>Повторюється</Text> : null}
              {task.hasSubtasks ? <Text style={styles.metaPill}>{task.subtaskCount} підзадачі</Text> : null}
              {task.overdue ? <Text style={styles.overdue}>Просрочено</Text> : null}
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 16, overflow: 'hidden', marginBottom: 10 },
  actions: { position: 'absolute', top: 0, right: 0, bottom: 0, flexDirection: 'row' },
  actionBtn: { width: 70, alignItems: 'center', justifyContent: 'center' },
  postponeText: { color: palette.textMuted, fontSize: 12 },
  deleteText: { color: palette.text, fontSize: 12 },
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 12,
    backgroundColor: palette.surface, borderRadius: 15, borderWidth: 1,
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
  overdue: { fontSize: 11, color: palette.accent, fontWeight: '600' },
});
