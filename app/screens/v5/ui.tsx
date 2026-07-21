/** Small presentational helpers reused across the v5 tabs. */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette, withAlpha } from '../../theme';

export function CategoryTag({ name, color, fontSize = 10.5 }: { name: string; color: string; fontSize?: number }) {
  return (
    <Text
      style={{
        fontSize,
        color: withAlpha(color, 0.9),
        backgroundColor: withAlpha(color, 0.12),
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        fontWeight: '500',
        overflow: 'hidden',
      }}
    >
      {name}
    </Text>
  );
}

export function ProgressBar({ completed, total }: { completed: number; total: number }) {
  const pct = total ? Math.round((completed / total) * 100) : 0;
  return (
    <View style={{ width: '100%' }}>
      <Text style={styles.progressLabel}>{`${completed} з ${total} задач виконано`}</Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  progressLabel: { fontSize: 13, color: palette.textMuted, marginBottom: 8 },
  progressTrack: { height: 6, backgroundColor: palette.surface, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: palette.accent, borderRadius: 3 },
});
