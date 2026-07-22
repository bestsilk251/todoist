import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { palette } from '../../../theme';
import type { AnalyticsDailyPoint, AnalyticsDateRange, AnalyticsMeasure, AnalyticsPeriodPreset, AnalyticsTabKey } from '../../../lib/analyticsTypes';
import {
  addDateDays,
  clampRangeToToday,
  formatDateOnly,
  getMonthRange,
  getRollingRange,
  getWeekRange,
  shiftRange,
  zonedDateKey,
} from '../../../lib/analyticsMath';
import { CheckCircleIcon, ClockIcon, FireIcon, InfoIcon, TargetIcon } from '../../../components/icons';
import AnalyticsHeader from './AnalyticsHeader';
import AnalyticsTabs from './AnalyticsTabs';
import PeriodSelector from './PeriodSelector';
import MetricCard from './MetricCard';
import TrendChart from './TrendChart';
import ProductivityChart from './ProductivityChart';
import ActivityHeatmap from './ActivityHeatmap';
import CategoryDonutChart from './CategoryDonutChart';
import CategoryProgressList from './CategoryProgressList';
import { AnalyticsEmptyState, AnalyticsErrorState, AnalyticsSkeleton } from './AnalyticsStates';
import { useAnalytics } from './useAnalytics';
import { formatHours, shortDayLabel } from './analyticsUi';
import { SegmentedControl } from '../ui';

function shiftMonth(range: AnalyticsDateRange, amount: number): AnalyticsDateRange {
  const [year, month] = range.from.split('-').map(Number);
  const start = new Date(Date.UTC(year, month - 1 + amount, 1));
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0));
  return { from: formatDateOnly(start), to: formatDateOnly(end) };
}

function changeTone(value: number | null, neutralDecrease = false) {
  if (value == null || value === 0 || (neutralDecrease && value < 0)) return 'neutral' as const;
  return value > 0 ? 'positive' as const : 'negative' as const;
}

const OVERVIEW_ACTIVITY_COLORS = {
  empty: palette.surfaceAlt,
  low: palette.accentDeep,
  medium: palette.accentFab,
  high: palette.accent,
  peak: palette.accentLight,
} as const;

function productivityColor(value: number, max: number) {
  if (value <= 0) return OVERVIEW_ACTIVITY_COLORS.empty;
  const ratio = value / Math.max(1, max);
  if (ratio >= 1) return OVERVIEW_ACTIVITY_COLORS.peak;
  if (ratio >= 0.66) return OVERVIEW_ACTIVITY_COLORS.high;
  if (ratio >= 0.33) return OVERVIEW_ACTIVITY_COLORS.medium;
  return OVERVIEW_ACTIVITY_COLORS.low;
}

function taskCountLabel(value: number) {
  const lastTwo = value % 100;
  if (lastTwo >= 11 && lastTwo <= 14) return `${value} задач`;
  const last = value % 10;
  if (last === 1) return `${value} задача`;
  if (last >= 2 && last <= 4) return `${value} задачі`;
  return `${value} задач`;
}

function MiniBars({ points }: { points: AnalyticsDailyPoint[] }) {
  const display = points.length > 7 ? points.slice(-7) : points;
  const max = Math.max(1, ...display.map((point) => point.completedTasks));
  return (
    <View style={styles.miniBars}>
      {display.map((point) => {
        const isPeak = point.completedTasks > 0 && point.completedTasks === max;
        return (
          <View
            key={point.date}
            accessible
            accessibilityLabel={`${shortDayLabel(point.date)}: ${taskCountLabel(point.completedTasks)}`}
            style={styles.miniDay}
          >
            <Text style={[styles.miniValue, isPeak && styles.miniValuePeak]}>{point.completedTasks}</Text>
            <View style={styles.miniBarSlot}>
              <View
                style={[
                  styles.miniBar,
                  {
                    height: Math.max(5, (point.completedTasks / max) * 40),
                    backgroundColor: productivityColor(point.completedTasks, max),
                  },
                ]}
              />
            </View>
            <Text numberOfLines={1} style={[styles.miniDayLabel, isPeak && styles.miniDayLabelPeak]}>{shortDayLabel(point.date)}</Text>
          </View>
        );
      })}
    </View>
  );
}

export default function AnalyticsScreen() {
  const timezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Kyiv', []);
  const now = useMemo(() => new Date(), []);
  const today = useMemo(() => zonedDateKey(now, timezone), [now, timezone]);
  const [tab, setTab] = useState<AnalyticsTabKey>('overview');
  const [preset, setPreset] = useState<AnalyticsPeriodPreset>('week');
  const [range, setRange] = useState<AnalyticsDateRange>(() => getWeekRange(now, timezone));
  const [measure, setMeasure] = useState<AnalyticsMeasure>('hours');
  const [categoryMeasure, setCategoryMeasure] = useState<AnalyticsMeasure>('hours');
  const { data, loading, error, retry } = useAnalytics(range, timezone);

  const selectPreset = (next: AnalyticsPeriodPreset) => {
    setPreset(next);
    if (next === 'week') setRange(getRollingRange(7, now, timezone));
    if (next === '30days') setRange(getRollingRange(30, now, timezone));
    if (next === 'month') setRange(getMonthRange(now, timezone));
  };
  const shift = (amount: -1 | 1) => {
    if (amount === 1 && range.to >= today) return;
    setRange((current) => {
      let next: AnalyticsDateRange;
      if (preset === 'month') {
        next = shiftMonth(current, amount);
      } else if (preset === 'week') {
        next = amount < 0
          ? { from: addDateDays(current.from, -7), to: addDateDays(current.from, -1) }
          : { from: addDateDays(current.from, 7), to: addDateDays(current.from, 13) };
      } else {
        next = shiftRange(current, amount);
      }
      return clampRangeToToday(next, now, timezone);
    });
  };
  const applyCustom = (next: AnalyticsDateRange) => {
    if (next.from > today || next.to > today) return;
    setPreset('custom');
    setRange(next);
  };

  const content = () => {
    if (loading) return <AnalyticsSkeleton />;
    if (error) return <AnalyticsErrorState message={error} onRetry={retry} />;
    if (!data || data.summary.completedTasks === 0) return <AnalyticsEmptyState />;

    if (tab === 'overview') {
      const plannedAvailable = data.summary.plannedMinutes > 0;
      const bestDay = data.daily.reduce<AnalyticsDailyPoint | null>((best, point) => (
        !best || point.completedTasks > best.completedTasks ? point : best
      ), null);
      return (
        <View style={styles.sectionStack}>
          <Text style={styles.sectionLabel}>Підсумки за період</Text>
          <View style={styles.metricGrid}>
            <MetricCard
              icon={<CheckCircleIcon size={21} color={palette.accent} />}
              value={String(data.summary.completedTasks)}
              label="Виконано задач"
              change={data.summary.completedTasksChange}
              changeTone={changeTone(data.summary.completedTasksChange)}
            />
            <MetricCard
              icon={<ClockIcon size={21} color={palette.accent} />}
              value={plannedAvailable ? formatHours(data.summary.plannedMinutes) : '—'}
              label="Запланований час"
              change={plannedAvailable ? data.summary.plannedMinutesChange : null}
              changeTone={changeTone(data.summary.plannedMinutesChange, true)}
              footnote={plannedAvailable ? undefined : 'Немає задач із тривалістю'}
            />
            <MetricCard
              icon={<TargetIcon size={21} color={palette.accent} />}
              value={data.summary.onTimeRate == null ? '—' : `${data.summary.onTimeRate}%`}
              label="Виконано вчасно"
              change={data.summary.onTimeRateChange}
              changeTone={changeTone(data.summary.onTimeRateChange)}
              footnote={data.summary.onTimeRate == null ? 'Немає задач із дедлайном' : undefined}
            />
            <MetricCard
              icon={<FireIcon size={21} color={palette.accent} />}
              value={String(data.summary.streakDays)}
              label="Днів поспіль"
              footnote="Поточна серія до сьогодні"
            />
          </View>
          <TrendChart points={data.daily} change={data.summary.completedTasksChange} />
          <View style={styles.productiveCard}>
            <View style={styles.productiveText}>
              <Text style={styles.cardTitle}>Найпродуктивніший час</Text>
              <Text style={styles.interval}>{data.insights.mostProductiveInterval ?? '—'}</Text>
              <Text style={styles.cardSub}>{data.insights.averageTasksPerDayInInterval == null ? 'Недостатньо даних' : `У середньому ${data.insights.averageTasksPerDayInInterval} задач/день`}</Text>
              {bestDay && bestDay.completedTasks > 0 ? (
                <Text style={styles.bestDay}>Найкращий день: {shortDayLabel(bestDay.date)} · {taskCountLabel(bestDay.completedTasks)}</Text>
              ) : null}
            </View>
            <MiniBars points={data.daily} />
          </View>
        </View>
      );
    }

    if (tab === 'productivity') {
      const focus = data.insights.focusRate;
      return (
        <View style={styles.sectionStack}>
          <ProductivityChart points={data.daily} measure={measure} onMeasure={setMeasure} />
          <ActivityHeatmap data={data.heatmap} measure={measure} />
          <View style={styles.focusCard}>
            <View style={styles.headingWithInfo}><Text style={styles.cardTitle}>Динаміка фокусу</Text><InfoIcon size={16} color={palette.textMuted} /></View>
            <View style={styles.focusRow}>
              <View><Text style={styles.focusValue}>{focus == null ? '—' : `${focus}%`}</Text><Text style={styles.cardSub}>За своєчасністю задач із дедлайном</Text></View>
              <Text style={[styles.focusChange, { color: data.summary.onTimeRateChange != null && data.summary.onTimeRateChange > 0 ? '#43B77A' : palette.textMuted }]}>{data.summary.onTimeRateChange == null ? '—' : `${data.summary.onTimeRateChange > 0 ? '↑ ' : data.summary.onTimeRateChange < 0 ? '↓ ' : ''}${Math.abs(data.summary.onTimeRateChange)} п.п.`}</Text>
            </View>
            <View style={styles.focusTrack}><View style={[styles.focusFill, { width: `${focus ?? 0}%` }]} /></View>
          </View>
        </View>
      );
    }

    const effectiveCategoryMeasure: AnalyticsMeasure = data.summary.plannedMinutes > 0 ? categoryMeasure : 'tasks';
    const sortedCategories = [...data.categories].sort((a, b) => {
      const aUncategorized = !a.name || /без категор/i.test(a.name);
      const bUncategorized = !b.name || /без категор/i.test(b.name);
      if (aUncategorized !== bUncategorized) return aUncategorized ? 1 : -1;
      const aValue = effectiveCategoryMeasure === 'hours' ? a.plannedMinutes : a.completedTasks;
      const bValue = effectiveCategoryMeasure === 'hours' ? b.plannedMinutes : b.completedTasks;
      return bValue - aValue;
    });
    if (data.categories.length === 0) return <AnalyticsEmptyState detail="Для виконаних задач за цей період немає даних про категорії." />;
    return (
      <View style={styles.sectionStack}>
        <SegmentedControl
          items={[{ value: 'hours', label: 'Час' }, { value: 'tasks', label: 'Задачі' }]}
          value={effectiveCategoryMeasure}
          onChange={setCategoryMeasure}
        />
        <View style={styles.categoryCard}>
          <View style={styles.headingWithInfo}>
            <Text style={[styles.cardTitle, styles.categoryTitle]}>{effectiveCategoryMeasure === 'hours' ? 'Розподіл запланованого часу' : 'Розподіл задач за категоріями'}</Text>
            <InfoIcon size={16} color={palette.textMuted} />
          </View>
          <CategoryDonutChart categories={sortedCategories} measure={effectiveCategoryMeasure} />
        </View>
        <CategoryProgressList categories={sortedCategories} measure={effectiveCategoryMeasure} />
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.fixedHeader}>
        <AnalyticsHeader />
        <AnalyticsTabs value={tab} onChange={setTab} />
        <PeriodSelector
          range={range}
          preset={preset}
          maxDate={today}
          disableNext={range.to >= today}
          onPreset={selectPreset}
          onShift={shift}
          onCustomRange={applyCustom}
        />
      </View>
      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {content()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  fixedHeader: { flexShrink: 0, zIndex: 10, paddingTop: 52, paddingHorizontal: 20, gap: 12, backgroundColor: palette.bg },
  contentScroll: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 120 },
  sectionStack: { gap: 12 },
  sectionLabel: { color: palette.textSecondary, fontSize: 14, fontWeight: '600', marginBottom: 1 },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  productiveCard: { minHeight: 126, flexDirection: 'row', alignItems: 'center', backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 16, padding: 14, gap: 12 },
  productiveText: { flex: 1, minWidth: 0 },
  cardTitle: { color: palette.text, fontSize: 14.5, fontWeight: '700' },
  interval: { color: palette.accent, fontSize: 14, fontWeight: '700', marginTop: 8 },
  cardSub: { color: palette.textMuted, fontSize: 10.5, lineHeight: 15, marginTop: 3 },
  bestDay: { color: palette.accent, fontSize: 10.5, lineHeight: 15, fontWeight: '600', marginTop: 4 },
  miniBars: { width: 132, height: 68, flexDirection: 'row', alignItems: 'stretch', gap: 3 },
  miniDay: { flex: 1, minWidth: 0, alignItems: 'center' },
  miniValue: { color: palette.textFaint, fontSize: 8.5, lineHeight: 11, fontWeight: '600' },
  miniValuePeak: { color: palette.accentLight },
  miniBarSlot: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'flex-end' },
  miniBar: { width: '68%', maxWidth: 13, minWidth: 4, borderRadius: 4 },
  miniDayLabel: { color: palette.textFaint, fontSize: 7.5, lineHeight: 11, marginTop: 2 },
  miniDayLabelPeak: { color: palette.accentLight, fontWeight: '700' },
  focusCard: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 16, padding: 14 },
  headingWithInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  focusRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  focusValue: { color: palette.text, fontSize: 27, fontWeight: '800' },
  focusChange: { fontSize: 11.5, fontWeight: '700', marginTop: 4 },
  focusTrack: { height: 7, backgroundColor: palette.chip, borderRadius: 4, overflow: 'hidden', marginTop: 12 },
  focusFill: { height: '100%', backgroundColor: palette.accent, borderRadius: 4 },
  categoryCard: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  categoryTitle: { flexShrink: 1, fontSize: 15.5, fontWeight: '800' },
});
