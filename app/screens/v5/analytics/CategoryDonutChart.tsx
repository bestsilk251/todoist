import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { palette } from '../../../theme';
import type { AnalyticsCategory, AnalyticsMeasure } from '../../../lib/analyticsTypes';
import { categoryAnalyticsColor, formatDonutCenterHours, formatHours, normalizedCategoryPercentages } from './analyticsUi';
import { StarIcon } from '../../../components/icons';

export default function CategoryDonutChart({ categories, measure }: { categories: AnalyticsCategory[]; measure: AnalyticsMeasure }) {
  const { width } = useWindowDimensions();
  const compact = width < 370;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const size = compact ? 172 : 164;
  const stroke = 27;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = useMemo(() => categories.reduce((sum, item) => sum + (measure === 'hours' ? item.plannedMinutes : item.completedTasks), 0), [categories, measure]);
  const percentages = useMemo(() => normalizedCategoryPercentages(categories, measure), [categories, measure]);
  let offset = 0;
  const segments = categories.map((item) => {
    const value = measure === 'hours' ? item.plannedMinutes : item.completedTasks;
    const share = total > 0 ? value / total : 0;
    const segment = { item, value, share, offset };
    offset += share * circumference;
    return segment;
  });
  const selected = categories.find((item) => item.id === selectedId);
  const centerValue = measure === 'hours'
    ? formatDonutCenterHours(selected?.plannedMinutes ?? total)
    : String(selected?.completedTasks ?? total);
  const leading = categories.reduce<AnalyticsCategory | null>((best, item) => {
    const value = measure === 'hours' ? item.plannedMinutes : item.completedTasks;
    const bestValue = best ? (measure === 'hours' ? best.plannedMinutes : best.completedTasks) : -1;
    return value > bestValue ? item : best;
  }, null);

  const formatValue = (item: AnalyticsCategory) => (
    measure === 'hours' ? formatHours(item.plannedMinutes) : `${item.completedTasks} задач`
  );

  return (
    <View>
      <View style={[styles.wrap, compact && styles.wrapCompact]}>
        <View style={{ width: size, height: size }}>
          <Svg width={size} height={size} accessibilityLabel="Розподіл за категоріями">
            <Circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={palette.chip} strokeWidth={stroke} />
            {segments.map(({ item, share, offset: segmentOffset }) => (
              <Circle
                key={item.id}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={categoryAnalyticsColor(item.name)}
                strokeWidth={selectedId === item.id ? stroke + 3 : stroke}
                strokeDasharray={`${share * circumference} ${circumference}`}
                strokeDashoffset={-segmentOffset}
                rotation={-90}
                origin={`${size / 2}, ${size / 2}`}
                onPress={() => setSelectedId(item.id)}
              />
            ))}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius - stroke / 2 - 1}
              fill={palette.surfaceAlt}
              stroke={palette.borderFaint}
              strokeWidth={1}
            />
          </Svg>
          <View pointerEvents="none" style={styles.center}>
            <Text numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.82} style={styles.total}>{centerValue}</Text>
            <Text numberOfLines={1} style={styles.totalLabel}>{selected?.name ?? (measure === 'hours' ? 'заплановано' : 'задач')}</Text>
          </View>
        </View>
        <View style={styles.legend}>
          {categories.map((item, index) => (
            <Pressable
              key={item.id}
              onPress={() => setSelectedId((current) => current === item.id ? null : item.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedId === item.id }}
              style={[styles.legendRow, index < categories.length - 1 && styles.legendDivider, selectedId === item.id && styles.legendRowSelected]}
            >
              <View style={[styles.dot, { backgroundColor: categoryAnalyticsColor(item.name) }]} />
              <View style={styles.legendText}>
                <Text numberOfLines={1} style={styles.name}>{item.name}</Text>
                <Text numberOfLines={1} style={styles.legendValue}>{formatValue(item)}</Text>
              </View>
              <Text style={styles.percent}>{percentages[item.id] ?? 0}%</Text>
            </Pressable>
          ))}
        </View>
      </View>
      {leading ? (
        <View style={styles.insight}>
          <View style={styles.insightIcon}><StarIcon size={15} color={palette.accent} /></View>
          <Text numberOfLines={1} style={styles.insightText}>
            {measure === 'hours' ? 'Найбільше часу: ' : 'Найбільше задач: '}
            <Text style={{ color: categoryAnalyticsColor(leading.name), fontWeight: '700' }}>{leading.name}</Text>
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  wrapCompact: { flexDirection: 'column', alignItems: 'center', gap: 12 },
  center: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 31 },
  total: { width: '100%', color: palette.text, fontSize: 18, lineHeight: 20, fontWeight: '800', textAlign: 'center', letterSpacing: -0.35 },
  totalLabel: { color: palette.textMuted, fontSize: 10, marginTop: 3, maxWidth: 92, textAlign: 'center' },
  legend: { flex: 1, minWidth: 0, alignSelf: 'stretch', justifyContent: 'center' },
  legendRow: { minHeight: 43, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 5, borderRadius: 9 },
  legendRowSelected: { backgroundColor: palette.surfaceAlt },
  legendDivider: { borderBottomWidth: 1, borderBottomColor: palette.borderFaint },
  dot: { width: 9, height: 9, borderRadius: 5 },
  legendText: { flex: 1, minWidth: 0 },
  name: { color: palette.textSecondary, fontSize: 11.5, fontWeight: '600' },
  legendValue: { color: palette.textFaint, fontSize: 9.5, marginTop: 2 },
  percent: { color: palette.text, fontSize: 11.5, fontWeight: '800' },
  insight: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 14, paddingHorizontal: 11, borderRadius: 12, backgroundColor: palette.surfaceAlt, borderWidth: 1, borderColor: palette.borderFaint },
  insightIcon: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(229,57,53,0.08)', borderWidth: 1, borderColor: 'rgba(229,57,53,0.24)' },
  insightText: { flex: 1, minWidth: 0, color: palette.textSecondary, fontSize: 11.5 },
});
