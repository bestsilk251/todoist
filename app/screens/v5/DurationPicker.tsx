import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, withAlpha } from '../../theme';
import { WheelColumn } from './TimePicker';

const HOUR_VALUES = Array.from({ length: 24 }, (_, value) => value);
const MINUTE_VALUES = Array.from({ length: 12 }, (_, value) => value * 5);
const PRESETS = [15, 30, 45, 60, 90, 120];

export function formatDurationLabel(minutes: number): string {
  const safeMinutes = Math.max(5, Math.min(23 * 60 + 55, Math.round(minutes / 5) * 5));
  const hours = Math.floor(safeMinutes / 60);
  const rest = safeMinutes % 60;
  return `${hours ? `${hours} год` : ''}${rest ? ` ${rest} хв` : ''}`.trim();
}

export default function DurationPicker({
  visible,
  valueMinutes,
  onClose,
  onSelect,
}: {
  visible: boolean;
  valueMinutes: number;
  onClose: () => void;
  onSelect: (minutes: number) => void;
}) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [hours, setHours] = useState(1);
  const [minutes, setMinutes] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    const normalized = Math.max(5, Math.min(23 * 60 + 55, Math.round((valueMinutes || 60) / 5) * 5));
    setHours(Math.floor(normalized / 60));
    setMinutes(normalized % 60);
    setError(null);
  }, [valueMinutes, visible]);

  const totalMinutes = hours * 60 + minutes;
  const totalLabel = useMemo(() => formatDurationLabel(Math.max(5, totalMinutes)), [totalMinutes]);
  const wheelHeight = height < 720 ? 144 : 192;

  const choosePreset = (preset: number) => {
    setHours(Math.floor(preset / 60));
    setMinutes(preset % 60);
    setError(null);
  };

  const apply = () => {
    if (totalMinutes <= 0) {
      setError('Оберіть тривалість щонайменше 5 хвилин.');
      return;
    }
    onSelect(totalMinutes);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <Pressable onPress={onClose} style={styles.backdrop}>
        <Pressable
          onPress={() => {}}
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16), maxHeight: Math.max(500, height - Math.max(insets.top, 12)) }]}
        >
          <View style={styles.grabber} />
          <Text style={styles.title}>Оберіть тривалість</Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryDiamond} />
            <Text numberOfLines={1} adjustsFontSizeToFit style={styles.summaryValue}>{totalLabel}</Text>
            <View style={styles.summaryDiamond} />
          </View>

          <View style={styles.columnLabels}>
            <Text style={styles.columnLabel}>Год</Text>
            <Text style={styles.columnLabel}>Хв</Text>
          </View>
          <View style={styles.wheels}>
            <WheelColumn
              accessibilityLabel="Години тривалості"
              testID="duration-wheel-hours"
              values={HOUR_VALUES}
              selectedValue={hours}
              onPick={(value) => { setHours(value); setError(null); }}
              height={wheelHeight}
            />
            <Text selectable={false} style={styles.colon}>:</Text>
            <WheelColumn
              accessibilityLabel="Хвилини тривалості"
              testID="duration-wheel-minutes"
              values={MINUTE_VALUES}
              selectedValue={minutes}
              onPick={(value) => { setMinutes(value); setError(null); }}
              height={wheelHeight}
            />
          </View>

          <View style={styles.presets}>
            {PRESETS.map((preset) => {
              const active = totalMinutes === preset;
              const label = formatDurationLabel(preset);
              return (
                <Pressable
                  key={preset}
                  accessibilityLabel={`Встановити тривалість ${label}`}
                  accessibilityState={{ selected: active }}
                  onPress={() => choosePreset(preset)}
                  style={[styles.preset, active && styles.presetActive]}
                >
                  <Text style={[styles.presetText, active && styles.presetTextActive]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.info}>ⓘ Час потрібен для планування в календарі</Text>
          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}

          <View style={styles.footer}>
            <Pressable onPress={onClose} style={styles.cancelButton}><Text style={styles.cancelText}>Скасувати</Text></Pressable>
            <Pressable onPress={apply} style={styles.doneButton}><Text style={styles.doneText}>Готово</Text></Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.72)' },
  sheet: { width: '100%', maxWidth: 540, alignSelf: 'center', paddingHorizontal: 20, backgroundColor: palette.bg, borderTopLeftRadius: 26, borderTopRightRadius: 26, borderWidth: 1, borderBottomWidth: 0, borderColor: palette.borderStrong },
  grabber: { width: 42, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10, backgroundColor: palette.chipBorder },
  title: { color: palette.text, fontSize: 21, lineHeight: 28, fontWeight: '800', textAlign: 'center', marginTop: 20 },
  summaryCard: { minHeight: 76, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 16, paddingHorizontal: 22, borderRadius: 17, backgroundColor: palette.surface, borderWidth: 1, borderColor: withAlpha(palette.accent, 0.58) },
  summaryValue: { flex: 1, color: palette.text, fontSize: 34, fontWeight: '800', textAlign: 'center' },
  summaryDiamond: { width: 10, height: 10, backgroundColor: palette.accent, transform: [{ rotate: '45deg' }] },
  columnLabels: { flexDirection: 'row', justifyContent: 'center', gap: 86, marginTop: 13, marginBottom: -4 },
  columnLabel: { width: 96, color: palette.textMuted, fontSize: 12, textAlign: 'center' },
  wheels: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14 },
  colon: { color: palette.textFainter, fontSize: 28, fontWeight: '800' },
  presets: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, paddingTop: 12, paddingBottom: 6 },
  preset: { flexBasis: '30%', flexGrow: 1, maxWidth: 150, minWidth: 86, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, borderRadius: 12, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border },
  presetActive: { backgroundColor: withAlpha(palette.accent, 0.16), borderColor: palette.accent },
  presetText: { color: palette.textSecondary, fontSize: 12.5, fontWeight: '600' },
  presetTextActive: { color: palette.white, fontWeight: '800' },
  info: { color: palette.textFaint, fontSize: 11.5, textAlign: 'center', marginTop: 9 },
  error: { color: palette.accentSoftText, fontSize: 11.5, textAlign: 'center', marginTop: 7 },
  footer: { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancelButton: { flex: 1, minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border },
  cancelText: { color: palette.textSecondary, fontSize: 14.5, fontWeight: '600' },
  doneButton: { flex: 1.4, minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: palette.accent },
  doneText: { color: palette.white, fontSize: 14.5, fontWeight: '800' },
});
