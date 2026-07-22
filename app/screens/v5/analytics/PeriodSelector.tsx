import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, withAlpha } from '../../../theme';
import type { AnalyticsDateRange, AnalyticsPeriodPreset } from '../../../lib/analyticsTypes';
import { addDateDays, daysInclusive } from '../../../lib/analyticsMath';
import { CalendarIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from '../../../components/icons';
import { formatPeriodLabel } from './analyticsUi';

const presets: { value: AnalyticsPeriodPreset; label: string }[] = [
  { value: 'week', label: '7 днів' },
  { value: '30days', label: '30 днів' },
  { value: 'month', label: 'Поточний\nмісяць' },
  { value: 'custom', label: 'Власний\nдіапазон' },
];

const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

function parseDateKey(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function dateKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

function monthKey(value: string): string {
  return `${value.slice(0, 7)}-01`;
}

function shiftMonth(value: string, amount: number): string {
  const date = parseDateKey(value);
  date.setUTCMonth(date.getUTCMonth() + amount, 1);
  return dateKey(date);
}

function rangeForPreset(value: AnalyticsPeriodPreset, maxDate: string, current: AnalyticsDateRange): AnalyticsDateRange {
  if (value === 'week') return { from: addDateDays(maxDate, -6), to: maxDate };
  if (value === '30days') return { from: addDateDays(maxDate, -29), to: maxDate };
  if (value === 'month') return { from: `${maxDate.slice(0, 8)}01`, to: maxDate };
  return current;
}

function longDateLabel(value: string): string {
  return parseDateKey(value).toLocaleDateString('uk-UA', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' }).replace(' р.', '');
}

function selectedDaysLabel(value: number): string {
  const lastTwo = value % 100;
  if (lastTwo >= 11 && lastTwo <= 14) return 'днів';
  const last = value % 10;
  if (last === 1) return 'день';
  if (last >= 2 && last <= 4) return 'дні';
  return 'днів';
}

export default function PeriodSelector({
  range,
  preset,
  maxDate,
  disableNext,
  onPreset,
  onShift,
  onCustomRange,
}: {
  range: AnalyticsDateRange;
  preset: AnalyticsPeriodPreset;
  maxDate: string;
  disableNext: boolean;
  onPreset: (value: AnalyticsPeriodPreset) => void;
  onShift: (amount: -1 | 1) => void;
  onCustomRange: (range: AnalyticsDateRange) => void;
}) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const compact = width <= 350;
  const [open, setOpen] = useState(false);
  const [draftPreset, setDraftPreset] = useState<AnalyticsPeriodPreset>(preset);
  const [draftRange, setDraftRange] = useState<AnalyticsDateRange>(range);
  const [visibleMonth, setVisibleMonth] = useState(monthKey(range.to));
  const [selectionStep, setSelectionStep] = useState<'start' | 'end'>('start');

  const cells = useMemo(() => {
    const first = parseDateKey(visibleMonth);
    const mondayOffset = (first.getUTCDay() + 6) % 7;
    const gridStart = new Date(first);
    gridStart.setUTCDate(first.getUTCDate() - mondayOffset);
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart);
      date.setUTCDate(gridStart.getUTCDate() + index);
      const key = dateKey(date);
      return {
        key,
        day: date.getUTCDate(),
        inMonth: date.getUTCMonth() === first.getUTCMonth(),
        disabled: key > maxDate,
      };
    });
  }, [visibleMonth, maxDate]);

  const monthTitle = parseDateKey(visibleMonth).toLocaleDateString('uk-UA', { timeZone: 'UTC', month: 'long', year: 'numeric' }).replace(' р.', '');
  const nextMonthDisabled = shiftMonth(visibleMonth, 1) > monthKey(maxDate);
  const selectedDays = daysInclusive(draftRange);

  const showSheet = () => {
    setDraftPreset(preset);
    setDraftRange(range);
    setVisibleMonth(monthKey(range.to));
    setSelectionStep('start');
    setOpen(true);
  };

  const choosePreset = (value: AnalyticsPeriodPreset) => {
    setDraftPreset(value);
    setDraftRange((current) => rangeForPreset(value, maxDate, current));
    if (value !== 'custom') setVisibleMonth(monthKey(maxDate));
    setSelectionStep('start');
  };

  const chooseDate = (value: string) => {
    if (selectionStep === 'start') {
      setDraftRange({ from: value, to: value });
      setSelectionStep('end');
    } else {
      setDraftRange((current) => value < current.from ? { from: value, to: current.from } : { from: current.from, to: value });
      setSelectionStep('start');
    }
    setDraftPreset('custom');
  };

  const apply = () => {
    if (draftPreset === 'custom') onCustomRange(draftRange);
    else onPreset(draftPreset);
    setOpen(false);
  };

  return (
    <View style={styles.host}>
      <View style={styles.row}>
        <Pressable accessibilityLabel="Попередній період" onPress={() => onShift(-1)} style={styles.arrow}>
          <ChevronLeftIcon size={18} color={palette.textSecondary} />
        </Pressable>
        <Pressable accessibilityLabel="Вибрати період" onPress={showSheet} style={styles.pill}>
          <CalendarIcon size={17} color={palette.textMuted} />
          <Text numberOfLines={1} style={styles.label}>{formatPeriodLabel(range.from, range.to)}</Text>
          <ChevronDownIcon size={14} color={palette.textFaint} />
        </Pressable>
        <Pressable
          accessibilityLabel="Наступний період"
          accessibilityState={{ disabled: disableNext }}
          disabled={disableNext}
          onPress={() => onShift(1)}
          style={[styles.arrow, disableNext && styles.arrowDisabled]}
        >
          <ChevronRightIcon size={18} color={palette.textSecondary} />
        </Pressable>
      </View>

      <Modal visible={open} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setOpen(false)}>
        <Pressable onPress={() => setOpen(false)} style={styles.backdrop}>
          <Pressable onPress={() => {}} style={[styles.sheet, { maxHeight: Math.min(height * 0.9, 720), paddingBottom: Math.max(insets.bottom, 12) }]}>
            <View style={styles.grabber} />
            <ScrollView contentContainerStyle={[styles.sheetContent, compact && styles.sheetContentCompact]} showsVerticalScrollIndicator={false}>
              <Text style={styles.title}>Оберіть період</Text>

              <View style={styles.presetRow}>
                {presets.map((item) => {
                  const active = item.value === draftPreset;
                  return (
                    <Pressable key={item.value} onPress={() => choosePreset(item.value)} style={[styles.presetButton, compact && styles.presetButtonCompact, active && styles.presetButtonActive]}>
                      <Text style={[styles.presetText, compact && styles.presetTextCompact, active && styles.presetTextActive]}>{item.label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.dateFields}>
                <Pressable onPress={() => setSelectionStep('start')} style={[styles.dateField, selectionStep === 'start' && styles.dateFieldActive]}>
                  <View style={{ flex: 1, minWidth: 0 }}><Text style={styles.dateCaption}>Початок</Text><Text numberOfLines={1} adjustsFontSizeToFit style={styles.dateValue}>{longDateLabel(draftRange.from)}</Text></View>
                  <CalendarIcon size={17} color={palette.textMuted} />
                </Pressable>
                <Text style={styles.dateDash}>—</Text>
                <Pressable onPress={() => setSelectionStep('end')} style={[styles.dateField, selectionStep === 'end' && styles.dateFieldActive]}>
                  <View style={{ flex: 1, minWidth: 0 }}><Text style={styles.dateCaption}>Кінець</Text><Text numberOfLines={1} adjustsFontSizeToFit style={styles.dateValue}>{longDateLabel(draftRange.to)}</Text></View>
                  <CalendarIcon size={17} color={palette.textMuted} />
                </Pressable>
              </View>

              <View style={styles.monthHeader}>
                <Pressable accessibilityLabel="Попередній місяць" onPress={() => setVisibleMonth((value) => shiftMonth(value, -1))} style={styles.monthArrow}><ChevronLeftIcon size={18} color={palette.textSecondary} /></Pressable>
                <Text style={styles.monthTitle}>{monthTitle}</Text>
                <Pressable accessibilityLabel="Наступний місяць" disabled={nextMonthDisabled} onPress={() => setVisibleMonth((value) => shiftMonth(value, 1))} style={[styles.monthArrow, nextMonthDisabled && styles.arrowDisabled]}><ChevronRightIcon size={18} color={palette.textSecondary} /></Pressable>
              </View>

              <View style={styles.weekRow}>{weekdays.map((day) => <Text key={day} style={styles.weekLabel}>{day}</Text>)}</View>
              <View style={styles.calendarGrid}>
                {cells.map((cell) => {
                  const inRange = cell.key >= draftRange.from && cell.key <= draftRange.to;
                  const endpoint = cell.key === draftRange.from || cell.key === draftRange.to;
                  const disabled = cell.disabled || !cell.inMonth;
                  return (
                    <Pressable
                      key={cell.key}
                      accessibilityLabel={longDateLabel(cell.key)}
                      accessibilityState={{ disabled, selected: inRange }}
                      disabled={disabled}
                      onPress={() => chooseDate(cell.key)}
                      style={[styles.dayCell, inRange && styles.dayCellRange]}
                    >
                      <View style={[styles.dayCircle, endpoint && styles.dayCircleSelected]}>
                        <Text style={[styles.dayText, !cell.inMonth && styles.dayTextOutside, cell.disabled && styles.dayTextDisabled, endpoint && styles.dayTextSelected]}>{cell.day}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.selectedSummary}>
                <CalendarIcon size={19} color={palette.accent} />
                <Text style={styles.selectedSummaryText}>Обрано: <Text style={styles.selectedSummaryStrong}>{selectedDays} {selectedDaysLabel(selectedDays)}</Text></Text>
              </View>
            </ScrollView>

            <View style={[styles.footer, compact && styles.footerCompact]}>
              <Pressable onPress={() => setOpen(false)} style={styles.cancelButton}><Text style={styles.cancelText}>Скасувати</Text></Pressable>
              <Pressable onPress={apply} style={styles.applyButton}><Text style={styles.applyText}>Застосувати</Text></Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { zIndex: 5, marginBottom: 18 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  arrow: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  arrowDisabled: { opacity: 0.28 },
  pill: { flex: 1, maxWidth: 240, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 14, paddingHorizontal: 12 },
  label: { flexShrink: 1, color: palette.textSecondary, fontSize: 14, fontWeight: '500' },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.68)' },
  sheet: { width: '100%', maxWidth: 430, alignSelf: 'center', backgroundColor: palette.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26, borderWidth: 1, borderBottomWidth: 0, borderColor: palette.borderStrong, overflow: 'hidden' },
  grabber: { width: 46, height: 5, borderRadius: 3, backgroundColor: palette.borderStrong, alignSelf: 'center', marginTop: 12 },
  sheetContent: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 14 },
  sheetContentCompact: { paddingHorizontal: 14, paddingTop: 18 },
  title: { color: palette.text, fontSize: 24, lineHeight: 30, fontWeight: '800', marginBottom: 18 },
  presetRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  presetButton: { flex: 1, minWidth: 0, minHeight: 58, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderRadius: 13, borderWidth: 1, borderColor: palette.borderStrong, backgroundColor: palette.surfaceAlt },
  presetButtonCompact: { minHeight: 54 },
  presetButtonActive: { backgroundColor: palette.accent, borderColor: palette.accentLight },
  presetText: { color: palette.textMuted, fontSize: 12, lineHeight: 16, fontWeight: '600', textAlign: 'center' },
  presetTextCompact: { fontSize: 10.5, lineHeight: 14 },
  presetTextActive: { color: palette.white, fontWeight: '800' },
  dateFields: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  dateField: { flex: 1, minWidth: 0, minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, borderRadius: 14, backgroundColor: palette.surfaceAlt, borderWidth: 1, borderColor: palette.borderStrong },
  dateFieldActive: { borderColor: palette.accent },
  dateCaption: { color: palette.textFaint, fontSize: 10.5, marginBottom: 4 },
  dateValue: { color: palette.text, fontSize: 13, fontWeight: '600' },
  dateDash: { color: palette.textFaint, fontSize: 17 },
  monthHeader: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  monthArrow: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  monthTitle: { flex: 1, color: palette.text, fontSize: 16, fontWeight: '700', textAlign: 'center', textTransform: 'capitalize' },
  weekRow: { flexDirection: 'row' },
  weekLabel: { width: `${100 / 7}%`, color: palette.textMuted, fontSize: 11.5, textAlign: 'center', paddingVertical: 8 },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: `${100 / 7}%`, minHeight: 42, alignItems: 'center', justifyContent: 'center' },
  dayCellRange: { backgroundColor: withAlpha(palette.accent, 0.22) },
  dayCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  dayCircleSelected: { backgroundColor: palette.accent },
  dayText: { color: palette.textSecondary, fontSize: 13.5, fontWeight: '500' },
  dayTextOutside: { color: palette.textFainter },
  dayTextDisabled: { opacity: 0.35 },
  dayTextSelected: { color: palette.white, fontWeight: '800' },
  selectedSummary: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, marginTop: 14, borderRadius: 14, backgroundColor: palette.surfaceAlt, borderWidth: 1, borderColor: palette.border },
  selectedSummaryText: { color: palette.textMuted, fontSize: 13.5 },
  selectedSummaryStrong: { color: palette.text, fontWeight: '700' },
  footer: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: palette.border },
  footerCompact: { paddingHorizontal: 14 },
  cancelButton: { flex: 1, minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 14, borderWidth: 1, borderColor: palette.borderStrong, backgroundColor: palette.surfaceAlt },
  cancelText: { color: palette.textMuted, fontSize: 14, fontWeight: '700' },
  applyButton: { flex: 1, minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: palette.accent },
  applyText: { color: palette.white, fontSize: 14, fontWeight: '800' },
});
