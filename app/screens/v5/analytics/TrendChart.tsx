import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Path, Circle, Line, Rect } from 'react-native-svg';
import { palette } from '../../../theme';
import type { AnalyticsDailyPoint, AnalyticsMeasure } from '../../../lib/analyticsTypes';
import { shortDayLabel } from './analyticsUi';
import { formatHours } from './analyticsUi';

export default function TrendChart({
  points,
  measure = 'tasks',
  change,
  title = 'Динаміка виконання',
  variant = 'bar',
}: {
  points: AnalyticsDailyPoint[];
  measure?: AnalyticsMeasure;
  change?: number | null;
  title?: string;
  variant?: 'bar' | 'line';
}) {
  const [width, setWidth] = useState(280);
  const [selected, setSelected] = useState<number | null>(null);
  const values = useMemo(() => points.map((point) => measure === 'tasks' ? point.completedTasks : point.plannedMinutes / 60), [points, measure]);
  const max = Math.max(1, ...values);
  const height = 170;
  const left = 28;
  const right = 8;
  const top = 14;
  const bottom = 26;
  const chartWidth = Math.max(1, width - left - right);
  const chartHeight = height - top - bottom;
  const x = (index: number) => left + ((index + 0.5) / Math.max(1, points.length)) * chartWidth;
  const y = (value: number) => top + chartHeight - (value / max) * chartHeight;
  const line = points.map((_, index) => `${index === 0 ? 'M' : 'L'} ${x(index)} ${y(values[index])}`).join(' ');
  const area = points.length ? `${line} L ${x(points.length - 1)} ${top + chartHeight} L ${x(0)} ${top + chartHeight} Z` : '';
  const labelIndexes = new Set(points.map((_, index) => index).filter((index) => points.length <= 8 || index === 0 || index === points.length - 1 || index % Math.ceil(points.length / 6) === 0));
  const selectedPoint = selected == null ? null : points[selected];
  const barWidth = Math.max(3, Math.min(18, (chartWidth / Math.max(1, points.length)) * 0.62));

  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);
  const onChartPress = (event: any) => {
    if (!points.length) return;
    const locationX = event?.nativeEvent?.locationX ?? left;
    const ratio = Math.max(0, Math.min(1, (locationX - left) / chartWidth));
    setSelected(Math.round(ratio * Math.max(0, points.length - 1)));
  };

  return (
    <View style={styles.card}>
      <View style={styles.heading}>
        <Text style={styles.title}>{title}</Text>
        {change !== undefined ? <Text style={[styles.badge, change != null && change > 0 ? styles.positive : change != null && change < 0 ? styles.negative : null]}>{change == null ? '—' : `${change > 0 ? '+' : ''}${change}%`}</Text> : null}
      </View>
      {selectedPoint ? (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipDate}>{new Date(`${selectedPoint.date}T12:00:00`).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })}</Text>
          <Text style={styles.tooltipValue}>Виконано: {selectedPoint.completedTasks} задач</Text>
          <Text style={styles.tooltipValue}>Заплановано: {formatHours(selectedPoint.plannedMinutes)}</Text>
        </View>
      ) : null}
      <View onLayout={onLayout} style={styles.chartWrap}>
        <Svg width="100%" height={height} onPress={onChartPress} accessibilityLabel={`${title}. Натисніть на графік для деталей.`}>
          <Defs>
            <LinearGradient id="analyticsArea" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={palette.accent} stopOpacity="0.35" />
              <Stop offset="1" stopColor={palette.accent} stopOpacity="0.02" />
            </LinearGradient>
          </Defs>
          {[0, 0.5, 1].map((ratio) => (
            <Line key={ratio} x1={left} x2={width - right} y1={top + chartHeight * ratio} y2={top + chartHeight * ratio} stroke={palette.border} strokeWidth={1} strokeDasharray="3 4" />
          ))}
          {variant === 'line' && area ? <Path d={area} fill="url(#analyticsArea)" /> : null}
          {variant === 'line' && line ? <Path d={line} fill="none" stroke={palette.accent} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" /> : null}
          {variant === 'line' ? points.map((point, index) => (
            <Circle key={point.date} cx={x(index)} cy={y(values[index])} r={selected === index ? 5 : 3.5} fill={palette.accent} stroke={palette.text} strokeWidth={selected === index ? 1.5 : 1} />
          )) : points.map((point, index) => {
            const topY = y(values[index]);
            return <Rect key={point.date} x={x(index) - barWidth / 2} y={topY} width={barWidth} height={Math.max(2, top + chartHeight - topY)} rx={Math.min(4, barWidth / 2)} fill={selected === index ? palette.accentLight : palette.accent} opacity={selected == null || selected === index ? 1 : 0.55} />;
          })}
        </Svg>
        <View pointerEvents="none" style={styles.labels}>
          {points.map((point, index) => labelIndexes.has(index) ? (
            <Text key={point.date} style={[styles.xLabel, { left: Math.max(0, Math.min(width - 42, x(index) - 21)) }]}>{shortDayLabel(point.date)}</Text>
          ) : null)}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 16, padding: 14, overflow: 'hidden' },
  heading: { minHeight: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { flex: 1, color: palette.text, fontSize: 14.5, fontWeight: '700' },
  badge: { color: palette.textFaint, fontSize: 11.5, fontWeight: '700', backgroundColor: palette.chip, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, overflow: 'hidden' },
  positive: { color: '#43B77A' },
  negative: { color: palette.accent },
  tooltip: { alignSelf: 'stretch', gap: 2, backgroundColor: palette.chip, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 7, marginTop: 4 },
  tooltipDate: { color: palette.textMuted, fontSize: 10.5 },
  tooltipValue: { color: palette.text, fontSize: 10.5, fontWeight: '700' },
  chartWrap: { height: 174, marginTop: 2 },
  labels: { position: 'absolute', left: 0, right: 0, bottom: 1, height: 18 },
  xLabel: { position: 'absolute', width: 42, color: palette.textFaint, fontSize: 9, textAlign: 'center' },
});
