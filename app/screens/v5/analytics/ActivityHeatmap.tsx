import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { palette } from '../../../theme';
import type { AnalyticsHeatmapPoint, AnalyticsMeasure } from '../../../lib/analyticsTypes';
import { InfoIcon } from '../../../components/icons';
import { productivityColors } from './analyticsUi';

const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
const weekdayNames = ['понеділок', 'вівторок', 'середу', 'четвер', 'п’ятницю', 'суботу', 'неділю'];
const buckets = [
  { start: 0, end: 6, label: '00:00' },
  { start: 6, end: 12, label: '06:00' },
  { start: 12, end: 18, label: '12:00' },
  { start: 18, end: 24, label: '18:00' },
];

export default function ActivityHeatmap({ data, measure }: { data: AnalyticsHeatmapPoint[]; measure: AnalyticsMeasure }) {
  const [selected, setSelected] = useState<{ day: number; bucket: number; value: number } | null>(null);
  const matrix = useMemo(() => buckets.map((bucket) => weekdays.map((_, dayIndex) => {
    return data
      .filter((item) => item.weekday === dayIndex + 1 && item.hour >= bucket.start && item.hour < bucket.end)
      .reduce((sum, item) => sum + (measure === 'tasks' ? item.completedTasks : item.plannedMinutes / 60), 0);
  })), [data, measure]);
  const max = Math.max(0, ...matrix.flat());
  const peak = useMemo(() => {
    let best = { row: 0, day: 0, value: 0 };
    matrix.forEach((row, rowIndex) => row.forEach((value, dayIndex) => {
      if (value > best.value) best = { row: rowIndex, day: dayIndex, value };
    }));
    return best;
  }, [matrix]);
  const colors = [
    productivityColors.empty,
    productivityColors.low,
    productivityColors.medium,
    productivityColors.high,
    productivityColors.peak,
  ];
  const colorFor = (value: number) => {
    if (value <= 0 || max <= 0) return colors[0];
    return colors[Math.min(4, Math.max(1, Math.ceil((value / max) * 4)))];
  };

  return (
    <View style={styles.card}>
      <View style={styles.heading}><Text style={styles.title}>Найпродуктивніший час</Text><InfoIcon size={16} color={palette.textMuted} /></View>
      {peak.value > 0 ? <Text style={styles.insight}>Найчастіше ви виконуєте задачі у {weekdayNames[peak.day]} з {String(buckets[peak.row].start).padStart(2, '0')}:00 до {String(buckets[peak.row].end).padStart(2, '0')}:00.</Text> : null}
      {selected ? (
        <Text style={styles.tooltip}>{weekdays[selected.day - 1]}, {buckets[selected.bucket].label}: {measure === 'tasks' ? `${selected.value} задач` : `${selected.value.toFixed(1)} год`}</Text>
      ) : <Text style={styles.hint}>Натисніть на комірку, щоб переглянути значення</Text>}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.grid}>
        <View>
          <View style={styles.weekHeader}><View style={styles.timeSpacer} />{weekdays.map((day) => <Text key={day} style={styles.dayLabel}>{day}</Text>)}</View>
          {buckets.map((bucket, rowIndex) => (
            <View key={bucket.label} style={styles.row}>
              <Text style={styles.timeLabel}>{bucket.label}</Text>
              {matrix[rowIndex].map((value, dayIndex) => (
                <Pressable
                  key={`${rowIndex}-${dayIndex}`}
                  hitSlop={5}
                  accessibilityLabel={`${weekdays[dayIndex]}, ${bucket.label}, ${value}`}
                  onPress={() => setSelected({ day: dayIndex + 1, bucket: rowIndex, value })}
                  style={[styles.cell, { backgroundColor: colorFor(value) }, selected?.day === dayIndex + 1 && selected.bucket === rowIndex && styles.selected]}
                />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={styles.legend}>
        <Text style={styles.legendText}>Низька активність</Text>
        <View style={styles.swatches}>{colors.map((color, index) => <View key={index} style={[styles.swatch, { backgroundColor: color }]} />)}</View>
        <Text style={styles.legendText}>Висока активність</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 16, padding: 14 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { color: palette.text, fontSize: 14.5, fontWeight: '700' },
  insight: { color: palette.textSecondary, fontSize: 11.5, lineHeight: 17, marginTop: 6 },
  hint: { color: palette.textFaint, fontSize: 10.5, marginTop: 5, marginBottom: 10 },
  tooltip: { color: productivityColors.high, fontSize: 10.5, fontWeight: '600', marginTop: 5, marginBottom: 10 },
  grid: { minWidth: 298 },
  weekHeader: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 4 },
  timeSpacer: { width: 39 },
  dayLabel: { width: 34, color: palette.textFaint, fontSize: 9.5, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 4 },
  timeLabel: { width: 39, color: palette.textFaint, fontSize: 8.5 },
  cell: { width: 34, height: 38, borderRadius: 5, borderWidth: 1, borderColor: palette.borderFaint },
  selected: { borderColor: productivityColors.peak, borderWidth: 1.5 },
  legend: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10, flexWrap: 'wrap' },
  legendText: { color: palette.textFaint, fontSize: 9.5 },
  swatches: { flexDirection: 'row', gap: 3 },
  swatch: { width: 17, height: 8, borderRadius: 2 },
});
