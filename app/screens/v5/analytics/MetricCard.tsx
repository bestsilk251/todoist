import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette } from '../../../theme';

type Tone = 'positive' | 'negative' | 'neutral';

export default function MetricCard({
  icon,
  value,
  label,
  change,
  changeTone,
  footnote,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  change?: number | null;
  changeTone?: Tone;
  footnote?: string;
}) {
  const changeColor = changeTone === 'positive' ? '#43B77A' : changeTone === 'negative' ? palette.accent : palette.textMuted;
  return (
    <View style={styles.card}>
      <View style={styles.top}>{icon}<Text adjustsFontSizeToFit minimumFontScale={0.72} numberOfLines={1} style={styles.value}>{value}</Text></View>
      <Text numberOfLines={2} style={styles.label}>{label}</Text>
      {change === undefined ? <Text style={styles.footnote}>{footnote ?? 'Найдовша серія'}</Text> : (
        <>
          <Text style={[styles.change, { color: change == null ? palette.textFaint : changeColor }]}>
            {change == null ? '—' : `${change > 0 ? '↑ ' : change < 0 ? '↓ ' : ''}${Math.abs(change)}%`}
          </Text>
          <Text numberOfLines={1} style={styles.footnote}>{footnote ?? 'порівняно з попереднім періодом'}</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: '48.5%', minHeight: 126, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 16, padding: 12 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  value: { flex: 1, color: palette.text, fontSize: 18, lineHeight: 23, fontWeight: '700' },
  label: { color: palette.textMuted, fontSize: 11.5, lineHeight: 15, marginTop: 6, minHeight: 30 },
  change: { fontSize: 11, fontWeight: '700', marginTop: 3 },
  footnote: { color: palette.textFaint, fontSize: 8.5, lineHeight: 11, marginTop: 3 },
});
