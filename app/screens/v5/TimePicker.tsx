/** Wheel-style time picker sheet (hour / minute columns + quick presets). */
import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { palette, withAlpha } from '../../theme';
import { useV5 } from './store';

export default function TimePicker() {
  const s = useV5();
  if (s.timePickerId == null) return null;

  const hourRows = [-2, -1, 0, 1, 2].map((off) => {
    const val = (((s.timePickerHour + off) % 24) + 24) % 24;
    return { off, val, label: String(val).padStart(2, '0') };
  });
  const minuteRows = [-2, -1, 0, 1, 2].map((off) => {
    const val = ((((s.timePickerMinute / 5 + off) % 12) + 12) % 12) * 5;
    return { off, val, label: String(val).padStart(2, '0') };
  });

  const now = new Date();
  const plus = (mins: number) => { const t = new Date(); t.setMinutes(t.getMinutes() + mins); return { h: t.getHours(), m: (Math.round(t.getMinutes() / 5) * 5) % 60 }; };
  const p30 = plus(30); const p60 = plus(60);
  const presets = [
    { label: 'Зараз', h: now.getHours(), m: (Math.round(now.getMinutes() / 5) * 5) % 60 },
    { label: '+30 хв', h: p30.h, m: p30.m },
    { label: '+1 год', h: p60.h, m: p60.m },
    { label: '18:00', h: 18, m: 0 },
    { label: '20:00', h: 20, m: 0 },
  ];

  const Wheel = ({ rows, onPick }: { rows: { off: number; val: number; label: string }[]; onPick: (v: number) => void }) => (
    <View style={{ width: 80, gap: 2 }}>
      {rows.map((r) => {
        const dist = Math.abs(r.off);
        if (r.off === 0) {
          return <Pressable key={r.off} onPress={() => onPick(r.val)} style={styles.wheelCenter}><Text style={styles.wheelCenterText}>{r.label}</Text></Pressable>;
        }
        return (
          <Pressable key={r.off} onPress={() => onPick(r.val)} style={styles.wheelRow}>
            <Text style={{ fontSize: dist === 1 ? 22 : 18, fontWeight: '500', color: dist === 1 ? palette.textFaint : palette.textGhost, textAlign: 'center' }}>{r.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <Pressable onPress={s.closeTimePicker} style={styles.overlay}>
      <Pressable onPress={() => {}} style={styles.sheet}>
        <View style={styles.grabber} />
        <View style={styles.headBlock}>
          <Text style={styles.title}>Оберіть час</Text>
          <Text style={styles.bigTime}>{String(s.timePickerHour).padStart(2, '0')}:{String(s.timePickerMinute).padStart(2, '0')}</Text>
        </View>

        <View style={styles.wheels}>
          <Wheel rows={hourRows} onPick={s.setTimePickerHour} />
          <Text style={styles.colon}>:</Text>
          <Wheel rows={minuteRows} onPick={s.setTimePickerMinute} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presets}>
          {presets.map((d) => {
            const active = d.h === s.timePickerHour && d.m === s.timePickerMinute;
            return (
              <Pressable key={d.label} onPress={() => s.applyTimePreset(d.h, d.m)} style={[styles.preset, active ? styles.presetActive : styles.presetIdle]}>
                <Text style={[styles.presetText, { color: active ? palette.accent : palette.textSecondary, fontWeight: active ? '600' : '400' }]}>{d.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

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
  sheet: { backgroundColor: palette.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderColor: palette.border, paddingBottom: 24 },
  grabber: { width: 36, height: 4, borderRadius: 2, backgroundColor: palette.chipBorder, alignSelf: 'center', marginTop: 10 },
  headBlock: { alignItems: 'center', paddingTop: 14, paddingHorizontal: 20, paddingBottom: 4 },
  title: { fontSize: 16, fontWeight: '700', color: palette.text },
  bigTime: { fontSize: 32, fontWeight: '700', color: palette.accent, marginTop: 8, letterSpacing: 1 },
  wheels: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 26, paddingTop: 14, paddingBottom: 6 },
  colon: { fontSize: 28, fontWeight: '700', color: palette.textFainter },
  wheelCenter: { borderWidth: 1, borderColor: palette.accent, borderRadius: 12, paddingVertical: 6, backgroundColor: withAlpha(palette.accent, 0.08) },
  wheelCenterText: { fontSize: 30, fontWeight: '700', color: palette.accent, textAlign: 'center' },
  wheelRow: { paddingVertical: 6 },
  presets: { gap: 8, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  preset: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1 },
  presetIdle: { backgroundColor: palette.surface, borderColor: palette.border },
  presetActive: { backgroundColor: withAlpha(palette.accent, 0.12), borderColor: palette.accent },
  presetText: { fontSize: 13 },
  footer: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 18 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 14, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, alignItems: 'center' },
  cancelText: { color: palette.textMuted, fontSize: 14.5 },
  doneBtn: { flex: 1, padding: 14, borderRadius: 14, backgroundColor: palette.accent, alignItems: 'center' },
  doneText: { color: palette.text, fontSize: 14.5, fontWeight: '600' },
});
