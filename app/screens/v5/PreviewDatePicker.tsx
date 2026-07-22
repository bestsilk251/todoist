import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, withAlpha } from '../../theme';
import { isoFromOffset, isoOf, isoToLocalDate, previewDateLabel } from '../../lib/tasksRepo';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '../../components/icons';

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

function monthKey(value: string): string {
  return `${value.slice(0, 7)}-01`;
}

function shiftMonth(value: string, amount: number): string {
  const date = isoToLocalDate(value);
  date.setMonth(date.getMonth() + amount, 1);
  return isoOf(date);
}

function monthTitle(value: string): string {
  return isoToLocalDate(value).toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' }).replace(' р.', '');
}

export default function PreviewDatePicker({
  visible,
  value,
  onClose,
  onSelect,
}: {
  visible: boolean;
  value: string | null;
  onClose: () => void;
  onSelect: (iso: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const today = isoOf(new Date());
  const [draft, setDraft] = useState(value ?? today);
  const [visibleMonth, setVisibleMonth] = useState(monthKey(value ?? today));

  useEffect(() => {
    if (!visible) return;
    const next = value && value >= today ? value : today;
    setDraft(next);
    setVisibleMonth(monthKey(next));
  }, [today, value, visible]);

  const cells = useMemo(() => {
    const first = isoToLocalDate(visibleMonth);
    const mondayOffset = (first.getDay() + 6) % 7;
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - mondayOffset);
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      const iso = isoOf(date);
      return {
        iso,
        day: date.getDate(),
        inMonth: date.getMonth() === first.getMonth(),
        disabled: iso < today,
      };
    });
  }, [today, visibleMonth]);

  const chooseQuickDate = (offset: number) => {
    const iso = isoFromOffset(offset);
    setDraft(iso);
    setVisibleMonth(monthKey(iso));
  };

  const apply = () => {
    onSelect(draft);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <Pressable onPress={onClose} style={styles.backdrop}>
        <Pressable
          onPress={() => {}}
          style={[styles.sheet, { maxHeight: Math.min(height * 0.86, 610), paddingBottom: Math.max(insets.bottom, 16) }]}
        >
          <View style={styles.grabber} />
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Оберіть день</Text>
              <Text style={styles.subtitle}>Дата виконання задачі</Text>
            </View>
            <View style={styles.calendarBadge}><CalendarIcon size={19} color={palette.accent} /></View>
          </View>

          <View style={styles.quickRow}>
            {[0, 1, 7].map((offset) => {
              const iso = isoFromOffset(offset);
              const active = draft === iso;
              return (
                <Pressable key={offset} onPress={() => chooseQuickDate(offset)} style={[styles.quickButton, active && styles.quickButtonActive]}>
                  <Text style={[styles.quickText, active && styles.quickTextActive]}>{offset === 7 ? 'Через тиждень' : previewDateLabel(iso)}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.monthHeader}>
            <Pressable accessibilityLabel="Попередній місяць" onPress={() => setVisibleMonth((month) => shiftMonth(month, -1))} style={styles.monthArrow}>
              <ChevronLeftIcon size={18} color={palette.textSecondary} />
            </Pressable>
            <Text style={styles.monthTitle}>{monthTitle(visibleMonth)}</Text>
            <Pressable accessibilityLabel="Наступний місяць" onPress={() => setVisibleMonth((month) => shiftMonth(month, 1))} style={styles.monthArrow}>
              <ChevronRightIcon size={18} color={palette.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.weekRow}>{WEEKDAYS.map((day) => <Text key={day} style={styles.weekday}>{day}</Text>)}</View>
          <View style={styles.grid}>
            {cells.map((cell) => {
              const selected = cell.iso === draft;
              const disabled = cell.disabled || !cell.inMonth;
              return (
                <Pressable
                  key={cell.iso}
                  disabled={disabled}
                  accessibilityRole="button"
                  accessibilityState={{ disabled, selected }}
                  accessibilityLabel={isoToLocalDate(cell.iso).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })}
                  onPress={() => setDraft(cell.iso)}
                  style={styles.dayCell}
                >
                  <View style={[styles.dayCircle, selected && styles.dayCircleSelected]}>
                    <Text style={[styles.dayText, !cell.inMonth && styles.dayOutside, cell.disabled && styles.dayDisabled, selected && styles.daySelected]}>{cell.day}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.footer}>
            <Pressable onPress={onClose} style={styles.cancelButton}><Text style={styles.cancelText}>Скасувати</Text></Pressable>
            <Pressable onPress={apply} style={styles.applyButton}><Text style={styles.applyText}>Обрати день</Text></Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.68)' },
  sheet: { width: '100%', maxWidth: 430, alignSelf: 'center', paddingHorizontal: 18, backgroundColor: palette.bg, borderTopLeftRadius: 26, borderTopRightRadius: 26, borderWidth: 1, borderBottomWidth: 0, borderColor: palette.borderStrong },
  grabber: { width: 42, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10, backgroundColor: palette.chipBorder },
  header: { minHeight: 76, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: palette.text, fontSize: 21, fontWeight: '800' },
  subtitle: { color: palette.textMuted, fontSize: 12.5, marginTop: 4 },
  calendarBadge: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: withAlpha(palette.accent, 0.1), borderWidth: 1, borderColor: withAlpha(palette.accent, 0.28) },
  quickRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  quickButton: { flex: 1, minWidth: 0, minHeight: 42, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderRadius: 12, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border },
  quickButtonActive: { borderColor: palette.accent, backgroundColor: withAlpha(palette.accent, 0.1) },
  quickText: { color: palette.textMuted, fontSize: 11.5, fontWeight: '600', textAlign: 'center' },
  quickTextActive: { color: palette.accent, fontWeight: '700' },
  monthHeader: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthArrow: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  monthTitle: { flex: 1, color: palette.text, fontSize: 15.5, fontWeight: '700', textAlign: 'center', textTransform: 'capitalize' },
  weekRow: { flexDirection: 'row' },
  weekday: { width: `${100 / 7}%`, paddingVertical: 7, color: palette.textMuted, fontSize: 11, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: `${100 / 7}%`, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  dayCircle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  dayCircleSelected: { backgroundColor: palette.accent },
  dayText: { color: palette.textSecondary, fontSize: 13, fontWeight: '500' },
  dayOutside: { color: palette.textFainter },
  dayDisabled: { opacity: 0.3 },
  daySelected: { color: palette.white, fontWeight: '800' },
  footer: { flexDirection: 'row', gap: 10, paddingTop: 14, borderTopWidth: 1, borderTopColor: palette.borderFaint },
  cancelButton: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border },
  cancelText: { color: palette.textMuted, fontSize: 14, fontWeight: '600' },
  applyButton: { flex: 1.4, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: palette.accent },
  applyText: { color: palette.white, fontSize: 14, fontWeight: '700' },
});
