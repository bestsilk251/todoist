/** Inertial wheel-style time picker sheet (hour / minute columns + presets). */
import React, { useEffect, useMemo, useRef } from 'react';
import {
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { palette, withAlpha } from '../../theme';
import { useV5 } from './store';

const WHEEL_ROW_HEIGHT = 48;
const WHEEL_HEIGHT = WHEEL_ROW_HEIGHT * 5;
const WHEEL_LOOPS = 9;
const WHEEL_MIDDLE_LOOP = Math.floor(WHEEL_LOOPS / 2);
const HOUR_VALUES = Array.from({ length: 24 }, (_, value) => value);
const MINUTE_VALUES = Array.from({ length: 60 }, (_, value) => value);

interface WheelItem {
  key: string;
  value: number;
  label: string;
}

interface WheelColumnProps {
  accessibilityLabel: string;
  testID: string;
  values: number[];
  selectedValue: number;
  onPick: (value: number) => void;
}

function WheelColumn({ accessibilityLabel, testID, values, selectedValue, onPick }: WheelColumnProps) {
  const listRef = useRef<FlatList<WheelItem>>(null);
  const lastEmittedValue = useRef(selectedValue);
  const items = useMemo<WheelItem[]>(() => Array.from({ length: WHEEL_LOOPS }, (_, loop) => (
    values.map((value) => ({
      key: `${loop}-${value}`,
      value,
      label: String(value).padStart(2, '0'),
    }))
  )).flat(), [values]);

  const selectedValueIndex = Math.max(0, values.indexOf(selectedValue));
  const middleIndex = WHEEL_MIDDLE_LOOP * values.length + selectedValueIndex;
  const initialIndex = useRef(middleIndex).current;

  const scrollToValue = (value: number, animated: boolean) => {
    const valueIndex = Math.max(0, values.indexOf(value));
    listRef.current?.scrollToOffset({
      offset: (WHEEL_MIDDLE_LOOP * values.length + valueIndex) * WHEEL_ROW_HEIGHT,
      animated,
    });
  };

  useEffect(() => {
    if (selectedValue === lastEmittedValue.current) return;
    lastEmittedValue.current = selectedValue;
    scrollToValue(selectedValue, true);
  }, [selectedValue]);

  const pickIndex = (rawIndex: number) => {
    const index = Math.max(0, Math.min(items.length - 1, rawIndex));
    const nextValue = items[index].value;
    if (nextValue === lastEmittedValue.current) return;
    lastEmittedValue.current = nextValue;
    onPick(nextValue);
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    pickIndex(Math.round(event.nativeEvent.contentOffset.y / WHEEL_ROW_HEIGHT));
  };

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.y / WHEEL_ROW_HEIGHT);
    const value = items[Math.max(0, Math.min(items.length - 1, index))].value;
    pickIndex(index);

    // Quietly return to the middle copy so the wheel can keep spinning both ways.
    if (index < values.length * 2 || index > values.length * (WHEEL_LOOPS - 2)) {
      scrollToValue(value, false);
    }
  };

  const adjust = (direction: 1 | -1) => {
    const currentIndex = Math.max(0, values.indexOf(selectedValue));
    const nextValue = values[(currentIndex + direction + values.length) % values.length];
    lastEmittedValue.current = nextValue;
    onPick(nextValue);
    scrollToValue(nextValue, true);
  };

  return (
    <View style={styles.wheelColumn}>
      <View pointerEvents="none" style={styles.wheelSelection} />
      <FlatList
        ref={listRef}
        testID={testID}
        data={items}
        keyExtractor={(item) => item.key}
        initialScrollIndex={initialIndex}
        getItemLayout={(_data, index) => ({ length: WHEEL_ROW_HEIGHT, offset: WHEEL_ROW_HEIGHT * index, index })}
        renderItem={({ item, index }) => {
          const selected = item.value === selectedValue;
          return (
            <Pressable
              onPress={() => {
                lastEmittedValue.current = item.value;
                onPick(item.value);
                listRef.current?.scrollToOffset({ offset: index * WHEEL_ROW_HEIGHT, animated: true });
              }}
              style={styles.wheelRow}
            >
              <Text selectable={false} style={[styles.wheelText, selected && styles.wheelTextSelected]}>{item.label}</Text>
            </Pressable>
          );
        }}
        contentContainerStyle={styles.wheelContent}
        snapToInterval={WHEEL_ROW_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        bounces={false}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleMomentumEnd}
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{ text: String(selectedValue).padStart(2, '0') }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(event) => adjust(event.nativeEvent.actionName === 'increment' ? 1 : -1)}
        initialNumToRender={15}
        maxToRenderPerBatch={15}
        windowSize={7}
      />
      <View pointerEvents="none" style={styles.wheelFadeTop} />
      <View pointerEvents="none" style={styles.wheelFadeBottom} />
    </View>
  );
}

export default function TimePicker() {
  const s = useV5();
  if (s.timePickerId == null) return null;
  const title = s.timePickerTarget === 'task-end'
    ? 'Час завершення'
    : s.timePickerTarget === 'task-start'
      ? 'Час початку'
      : 'Оберіть час';

  const now = new Date();
  const roundedClock = (time: Date) => {
    const totalMinutes = Math.ceil((time.getHours() * 60 + time.getMinutes()) / 5) * 5 % (24 * 60);
    return { h: Math.floor(totalMinutes / 60), m: totalMinutes % 60 };
  };
  const plus = (mins: number) => {
    const time = new Date();
    time.setMinutes(time.getMinutes() + mins);
    return roundedClock(time);
  };
  const currentPreset = roundedClock(now);
  const p30 = plus(30);
  const p60 = plus(60);
  const presets = [
    { label: 'Зараз', h: currentPreset.h, m: currentPreset.m },
    { label: '+30 хв', h: p30.h, m: p30.m },
    { label: '+1 год', h: p60.h, m: p60.m },
    { label: '18:00', h: 18, m: 0 },
    { label: '20:00', h: 20, m: 0 },
  ];

  return (
    <Pressable onPress={s.closeTimePicker} style={styles.overlay}>
      <Pressable onPress={() => {}} style={styles.sheet}>
        <View style={styles.grabber} />
        <View style={styles.headBlock}>
          <Text style={styles.title}>{title}</Text>
          <Text selectable={false} style={styles.bigTime}>{String(s.timePickerHour).padStart(2, '0')}:{String(s.timePickerMinute).padStart(2, '0')}</Text>
          <Text style={styles.wheelHint}>Проведіть вгору або вниз, щоб швидко змінити час</Text>
        </View>

        <View style={styles.wheels}>
          <WheelColumn
            accessibilityLabel="Години"
            testID="time-wheel-hours"
            values={HOUR_VALUES}
            selectedValue={s.timePickerHour}
            onPick={s.setTimePickerHour}
          />
          <Text selectable={false} style={styles.colon}>:</Text>
          <WheelColumn
            accessibilityLabel="Хвилини"
            testID="time-wheel-minutes"
            values={MINUTE_VALUES}
            selectedValue={s.timePickerMinute}
            onPick={s.setTimePickerMinute}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presets}>
          {presets.map((preset) => {
            const active = preset.h === s.timePickerHour && preset.m === s.timePickerMinute;
            return (
              <Pressable key={preset.label} onPress={() => s.applyTimePreset(preset.h, preset.m)} style={[styles.preset, active ? styles.presetActive : styles.presetIdle]}>
                <Text style={[styles.presetText, { color: active ? palette.accent : palette.textSecondary, fontWeight: active ? '600' : '400' }]}>{preset.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {s.timePickerError ? (
          <View accessibilityRole="alert" style={styles.errorBanner}>
            <Text style={styles.errorText}>{s.timePickerError}</Text>
          </View>
        ) : null}

        <View style={styles.footer}>
          <Pressable onPress={s.closeTimePicker} style={styles.cancelBtn}><Text style={styles.cancelText}>Скасувати</Text></Pressable>
          <Pressable onPress={s.confirmTimePicker} style={styles.doneBtn}><Text style={styles.doneText}>Готово</Text></Pressable>
        </View>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end', zIndex: 35 },
  sheet: { width: '100%', maxWidth: 540, alignSelf: 'center', backgroundColor: palette.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderColor: palette.border, paddingBottom: 24 },
  grabber: { width: 36, height: 4, borderRadius: 2, backgroundColor: palette.chipBorder, alignSelf: 'center', marginTop: 10 },
  headBlock: { alignItems: 'center', paddingTop: 14, paddingHorizontal: 20, paddingBottom: 2 },
  title: { fontSize: 16, fontWeight: '700', color: palette.text },
  bigTime: { fontSize: 32, fontWeight: '700', color: palette.accent, marginTop: 7, letterSpacing: 1 },
  wheelHint: { color: palette.textFaint, fontSize: 11, lineHeight: 15, textAlign: 'center', marginTop: 4 },
  wheels: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 26, paddingTop: 10, paddingBottom: 2 },
  colon: { fontSize: 28, fontWeight: '700', color: palette.textFainter },
  wheelColumn: { width: 96, height: WHEEL_HEIGHT, position: 'relative', overflow: 'hidden' },
  wheelContent: { paddingVertical: (WHEEL_HEIGHT - WHEEL_ROW_HEIGHT) / 2 },
  wheelSelection: { position: 'absolute', left: 0, right: 0, top: (WHEEL_HEIGHT - WHEEL_ROW_HEIGHT) / 2, height: WHEEL_ROW_HEIGHT, borderWidth: 1, borderColor: palette.accent, borderRadius: 13, backgroundColor: withAlpha(palette.accent, 0.08), zIndex: 0 },
  wheelRow: { height: WHEEL_ROW_HEIGHT, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  wheelText: { color: palette.textFaint, fontSize: 20, lineHeight: 26, fontWeight: '500', textAlign: 'center' },
  wheelTextSelected: { color: palette.accent, fontSize: 29, lineHeight: 34, fontWeight: '700' },
  wheelFadeTop: { position: 'absolute', top: 0, left: 0, right: 0, height: WHEEL_ROW_HEIGHT * 1.25, backgroundColor: withAlpha(palette.bg, 0.82), zIndex: 2 },
  wheelFadeBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: WHEEL_ROW_HEIGHT * 1.25, backgroundColor: withAlpha(palette.bg, 0.82), zIndex: 2 },
  presets: { gap: 8, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 4 },
  errorBanner: { marginHorizontal: 20, marginTop: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 11, backgroundColor: withAlpha(palette.accent, 0.1), borderWidth: 1, borderColor: withAlpha(palette.accent, 0.36) },
  errorText: { color: palette.accentSoftText, fontSize: 12, lineHeight: 17, textAlign: 'center' },
  preset: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 12, borderWidth: 1 },
  presetIdle: { backgroundColor: palette.surface, borderColor: palette.border },
  presetActive: { backgroundColor: withAlpha(palette.accent, 0.12), borderColor: palette.accent },
  presetText: { fontSize: 13 },
  footer: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 16 },
  cancelBtn: { flex: 1, minHeight: 50, justifyContent: 'center', borderRadius: 14, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, alignItems: 'center' },
  cancelText: { color: palette.textMuted, fontSize: 14.5 },
  doneBtn: { flex: 1, minHeight: 50, justifyContent: 'center', borderRadius: 14, backgroundColor: palette.accent, alignItems: 'center' },
  doneText: { color: palette.text, fontSize: 14.5, fontWeight: '600' },
});
