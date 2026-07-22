import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette } from '../../../theme';
import type { AnalyticsDailyPoint, AnalyticsMeasure } from '../../../lib/analyticsTypes';
import TrendChart from './TrendChart';
import { SegmentedControl } from '../ui';

export default function ProductivityChart({ points, measure, onMeasure }: { points: AnalyticsDailyPoint[]; measure: AnalyticsMeasure; onMeasure: (measure: AnalyticsMeasure) => void }) {
  const hasHours = points.some((point) => point.plannedMinutes > 0);
  return (
    <View>
      <View style={styles.switchWrap}><SegmentedControl compact items={[{ value: 'hours', label: 'Години' }, { value: 'tasks', label: 'Задачі' }]} value={measure} onChange={onMeasure} /></View>
      {measure === 'hours' && !hasHours ? (
        <View style={styles.noDuration}><Text style={styles.noDurationText}>У вибраному періоді немає виконаних задач із зазначеною тривалістю.</Text></View>
      ) : <TrendChart points={points} measure={measure} title={measure === 'hours' ? 'Продуктивність у годинах' : 'Продуктивність у задачах'} />}
    </View>
  );
}

const styles = StyleSheet.create({
  switchWrap: { width: 180, marginBottom: 10 },
  noDuration: { minHeight: 150, borderWidth: 1, borderColor: palette.border, borderRadius: 16, backgroundColor: palette.surface, alignItems: 'center', justifyContent: 'center', padding: 24 },
  noDurationText: { color: palette.textMuted, fontSize: 13, lineHeight: 19, textAlign: 'center' },
});
