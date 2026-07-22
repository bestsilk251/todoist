/** Compact home task with horizontal complete/cancel gestures. */
import React, { useRef } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import type { V5Task } from '../../lib/v5data';
import { dayPhrase } from '../../lib/v5data';
import { palette, withAlpha } from '../../theme';
import { useV5 } from './store';

const ACTION_THRESHOLD = 64;

export default function NearestTaskCard({ task, categoryColor }: { task: V5Task; categoryColor: string }) {
  const s = useV5();
  const translateX = useRef(new Animated.Value(0)).current;
  const direction = useRef(new Animated.Value(0)).current;

  const reset = () => {
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true, speed: 22, bounciness: 7 }).start();
    direction.setValue(0);
  };

  const complete = () => {
    Animated.timing(translateX, { toValue: 500, duration: 210, useNativeDriver: true }).start(() => s.toggleComplete(task.id));
  };

  const cancel = () => {
    Animated.timing(translateX, { toValue: -500, duration: 210, useNativeDriver: true }).start(() => s.deleteTask(task.id));
  };

  const pan = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_event, gesture) => Math.abs(gesture.dx) > 8 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.25,
    onPanResponderMove: (_event, gesture) => {
      const value = Math.max(-120, Math.min(120, gesture.dx));
      translateX.setValue(value);
      direction.setValue(value);
    },
    onPanResponderRelease: (_event, gesture) => {
      if (gesture.dx >= ACTION_THRESHOLD) complete();
      else if (gesture.dx <= -ACTION_THRESHOLD) cancel();
      else reset();
    },
    onPanResponderTerminate: reset,
  })).current;

  const completeOpacity = direction.interpolate({ inputRange: [0, ACTION_THRESHOLD], outputRange: [0, 1], extrapolate: 'clamp' });
  const cancelOpacity = direction.interpolate({ inputRange: [-ACTION_THRESHOLD, 0], outputRange: [1, 0], extrapolate: 'clamp' });
  const when = task.time ? `${dayPhrase(task.dueInDays!)}, ${task.time}` : dayPhrase(task.dueInDays!);

  return (
    <View style={styles.wrap}>
      <View style={styles.actions}>
        <Animated.View style={[styles.actionSide, styles.completeSide, { opacity: completeOpacity }]}><Text style={styles.actionText}>Виконати</Text></Animated.View>
        <Animated.View style={[styles.actionSide, styles.cancelSide, { opacity: cancelOpacity }]}><Text style={styles.actionText}>Скасувати</Text></Animated.View>
      </View>
      <Animated.View style={{ transform: [{ translateX }] }} {...pan.panHandlers}>
        <Pressable
          onPress={() => s.openTaskInCalendar(task.id)}
          accessibilityRole="button"
          accessibilityHint="Свайпніть праворуч, щоб виконати, або ліворуч, щоб скасувати"
          style={styles.card}
        >
          <View style={[styles.dot, { backgroundColor: categoryColor }]} />
          <Text style={styles.title} numberOfLines={1}>{task.title}</Text>
          <Text style={styles.when}>{when}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 14, overflow: 'hidden' },
  actions: { ...StyleSheet.absoluteFillObject, flexDirection: 'row' },
  actionSide: { flex: 1, justifyContent: 'center', paddingHorizontal: 14 },
  completeSide: { alignItems: 'flex-start', backgroundColor: withAlpha(palette.badgeGreen, 0.34) },
  cancelSide: { alignItems: 'flex-end', backgroundColor: withAlpha(palette.accent, 0.42) },
  actionText: { color: palette.text, fontSize: 12, fontWeight: '700' },
  card: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 14 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  title: { flex: 1, fontSize: 13.5, color: palette.text },
  when: { fontSize: 11.5, color: palette.textMuted },
});
