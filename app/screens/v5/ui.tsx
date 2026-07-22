/** Small presentational helpers reused across the v5 tabs. */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { palette, withAlpha } from '../../theme';

export function ScreenHeader({
  icon,
  title,
  actions,
}: {
  icon: React.ReactNode;
  title: string;
  actions?: React.ReactNode;
}) {
  return (
    <View style={styles.screenHeader} accessibilityRole="header">
      <View style={styles.screenHeaderTitle}>
        <View style={styles.screenHeaderIcon}>{icon}</View>
        <Text style={styles.screenHeaderText}>{title}</Text>
      </View>
      {actions ? <View style={styles.screenHeaderActions}>{actions}</View> : null}
    </View>
  );
}

export function SegmentedControl<T extends string>({
  items,
  value,
  onChange,
  compact = false,
}: {
  items: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  compact?: boolean;
}) {
  return (
    <View style={[styles.segmented, compact && styles.segmentedCompact]} accessibilityRole="tablist">
      {items.map((item) => {
        const active = item.value === value;
        return (
          <Pressable
            key={item.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(item.value)}
            style={[styles.segment, compact && styles.segmentCompact, active && styles.segmentActive]}
          >
            <Text numberOfLines={1} style={[styles.segmentText, compact && styles.segmentTextCompact, active && styles.segmentTextActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function CategoryTag({ name, color, fontSize = 10.5 }: { name: string; color: string; fontSize?: number }) {
  return (
    <Text
      selectable={false}
      numberOfLines={1}
      ellipsizeMode="tail"
      style={{
        fontSize,
        color: withAlpha(color, 0.9),
        backgroundColor: withAlpha(color, 0.12),
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        fontWeight: '500',
        overflow: 'hidden',
        maxWidth: 150,
      }}
    >
      {name}
    </Text>
  );
}

export function ProgressBar({ completed, total, label }: { completed: number; total: number; label?: string }) {
  const pct = total ? Math.round((completed / total) * 100) : 0;
  return (
    <View style={{ width: '100%' }}>
      <Text style={styles.progressLabel}>{label ?? `${completed} з ${total} задач виконано`}</Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenHeader: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 16 },
  screenHeaderTitle: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 },
  screenHeaderIcon: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  screenHeaderText: { flexShrink: 1, color: palette.text, fontSize: 22, lineHeight: 28, fontWeight: '700', letterSpacing: -0.3 },
  screenHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  segmented: { flexDirection: 'row', backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 14, padding: 4 },
  segmentedCompact: { borderRadius: 12, padding: 3 },
  segment: { flex: 1, minWidth: 0, minHeight: 40, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 1, borderColor: 'transparent' },
  segmentCompact: { minHeight: 36, borderRadius: 9 },
  segmentActive: { backgroundColor: withAlpha(palette.accent, 0.1), borderColor: palette.accent },
  segmentText: { color: palette.textMuted, fontSize: 13, fontWeight: '600' },
  segmentTextCompact: { fontSize: 12 },
  segmentTextActive: { color: palette.accent, fontWeight: '700' },
  progressLabel: { fontSize: 13, color: palette.textMuted, marginBottom: 8 },
  progressTrack: { height: 6, backgroundColor: palette.surface, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: palette.accent, borderRadius: 3 },
});
